export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // 🔥 health check
    if (url.pathname === "/") {
      return new Response("WORKER OK", { status: 200 });
    }

    // 🔥 API: save latest
    if (url.pathname === "/api/paste") {
      try {
        const body = await req.json();
        await env.DB.put("latest", JSON.stringify(body));
        return Response.json({ ok: true });
      } catch (e) {
        return Response.json({ ok: false, error: "bad json" }, { status: 400 });
      }
    }

    // 🔥 API: get latest
    if (url.pathname === "/api/feed") {
      const data = await env.DB.get("latest");

      return Response.json({
        data: data ? JSON.parse(data) : null
      });
    }

    // 🧱 fallback (если есть assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(req);
    }

    return new Response("Not found", { status: 404 });
  }
};
