export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // 🔥 health check
    if (url.pathname === "/") {
      return new Response("WORKER OK", { status: 200 });
    }

    // ➕ ADD POST (multi feed)
    if (url.pathname === "/api/paste") {
      try {
        const body = await req.json();

        const raw = await env.DB.get("feed");
        const feed = raw ? JSON.parse(raw) : [];

        const post = {
          id: Date.now(),
          image: body.image
        };

        feed.unshift(post); // новые сверху

        const trimmed = feed.slice(0, 50);

        await env.DB.put("feed", JSON.stringify(trimmed));

        return Response.json({ ok: true, post });
      } catch (e) {
        return Response.json({ ok: false, error: "bad json" }, { status: 400 });
      }
    }

    // 📡 GET FEED
    if (url.pathname === "/api/feed") {
      const raw = await env.DB.get("feed");
      const feed = raw ? JSON.parse(raw) : [];

      return Response.json({
        data: feed
      });
    }

    // 🧱 fallback
    if (env.ASSETS) {
      return env.ASSETS.fetch(req);
    }

    return new Response("Not found", { status: 404 });
  }
};
