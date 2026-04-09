export default {
  async fetch(req, env) {
    const url = new URL(req.url)

    if (url.pathname === "/api/feed") {
      const raw = await env.DB.get("feed")
      const feed = safeJSON(raw, [])

      const posts = await Promise.all(
        feed.slice(-100).map(async (id) => {
          const data = await env.DB.get("post:" + id)
          if (!data) return null
          return safeJSON(data, null)
        })
      )

      return json(posts.filter(Boolean))
    }

    if (url.pathname === "/api/post") {
      const body = await req.json()

      if (!body?.image) {
        return json({ error: "no image" }, 400)
      }

      const id = crypto.randomUUID().slice(0, 8)

      const post = {
        id,
        image: body.image,
        ts: Date.now()
      }

      await env.DB.put("post:" + id, JSON.stringify(post))

      const feed = safeJSON(await env.DB.get("feed"), [])
      feed.push(id)

      await env.DB.put("feed", JSON.stringify(feed.slice(-500)))

      return json({ id })
    }

    return new Response("not found", { status: 404 })
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json"
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
