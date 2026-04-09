export default {
  async fetch(req, env) {
    const url = new URL(req.url)

    if (url.pathname.startsWith("/api/")) {
      return handleAPI(req, env, url)
    }

    // статика
    return env.ASSETS.fetch(req)
  }
}

async function handleAPI(req, env, url) {
  if (req.method === "GET" && url.pathname === "/api/feed") {
    const feed = JSON.parse(await env.DB.get("feed") || "[]")

    const posts = await Promise.all(
      feed.slice(-20).reverse().map(async (id) => {
        const data = await env.DB.get("post:" + id)
        return { id, ...JSON.parse(data) }
      })
    )

    return json(posts)
  }

  if (req.method === "POST" && url.pathname === "/api/post") {
    const { image } = await req.json()

    const id = crypto.randomUUID().slice(0, 8)

    await env.DB.put("post:" + id, JSON.stringify({
      image,
      text: ""
    }))

    const feed = JSON.parse(await env.DB.get("feed") || "[]")
    feed.push(id)
    await env.DB.put("feed", JSON.stringify(feed))

    return json({ id })
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/post/")) {
    const id = url.pathname.split("/").pop()
    const { text } = await req.json()

    const post = JSON.parse(await env.DB.get("post:" + id) || "{}")

    post.text = text.slice(0, 500)

    await env.DB.put("post:" + id, JSON.stringify(post))

    return json({ ok: true })
  }

  return new Response("Not found", { status: 404 })
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" }
  })
}
