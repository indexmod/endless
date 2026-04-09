export default {
  async fetch(req, env) {
    const url = new URL(req.url)

    if (url.pathname.startsWith("/api/")) {
      return handleAPI(req, env, url)
    }

    return env.ASSETS.fetch(req)
  }
}

async function handleAPI(req, env, url) {
  try {

    // ---------------- FEED ----------------
    if (req.method === "GET" && url.pathname === "/api/feed") {
      const raw = await env.DB.get("feed")
      const feed = safeJSON(raw, [])

      const posts = await Promise.all(
        feed.slice(-50).reverse().map(async (id) => {
          const data = await env.DB.get("post:" + id)
          if (!data) return null
          return { id, ...safeJSON(data, {}) }
        })
      )

      return json(posts.filter(Boolean))
    }

    // ---------------- CREATE POST ----------------
    if (req.method === "POST" && url.pathname === "/api/post") {
      const body = await safeBody(req)
      if (!body?.image) return json({ error: "no image" }, 400)

      const id = crypto.randomUUID().slice(0, 8)

      await env.DB.put("post:" + id, JSON.stringify({
        image: body.image,
        text: ""
      }))

      const feed = safeJSON(await env.DB.get("feed"), [])

      feed.push(id)

      // защита от разрастания KV
      const trimmed = feed.slice(-200)

      await env.DB.put("feed", JSON.stringify(trimmed))

      return json({ id })
    }

    // ---------------- UPDATE POST ----------------
    if (req.method === "PATCH" && url.pathname.startsWith("/api/post/")) {
      const id = url.pathname.split("/").pop()
      const body = await safeBody(req)

      if (!body) return json({ error: "bad json" }, 400)

      const post = safeJSON(await env.DB.get("post:" + id), null)
      if (!post) return json({ error: "not found" }, 404)

      post.text = (body.text || "").slice(0, 500)

      await env.DB.put("post:" + id, JSON.stringify(post))

      return json({ ok: true })
    }

    return json({ error: "not found" }, 404)

  } catch (e) {
    return json({
      error: "server crash",
      details: e.message
    }, 500)
  }
}

// ---------------- HELPERS ----------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*"
    }
  })
}

function safeJSON(str, fallback) {
  try {
    return JSON.parse(str || "")
  } catch {
    return fallback
  }
}

async function safeBody(req) {
  try {
    return await req.json()
  } catch {
    return null
  }
}
