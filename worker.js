export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // 🔥 API FIRST
    if (url.pathname === "/api/paste") {
      const body = await req.json().catch(() => ({}));
      await env.DB.put("latest", JSON.stringify(body));
      return Response.json({ ok: true });
    }

    if (url.pathname === "/api/feed") {
      const data = await env.DB.get("latest");
      return Response.json({
        data: data ? JSON.parse(data) : null
      });
    }

    // 🧱 STATIC UI
    return env.ASSETS.fetch(req);
  }
}
