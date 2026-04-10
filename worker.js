export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // 1. API ВСЕГДА ВЫШЕ ASSETS
    if (url.pathname.startsWith("/api/")) {

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

      return new Response("Not found", { status: 404 });
    }

    // 2. STATIC UI
    return env.ASSETS.fetch(req);
  }
}
