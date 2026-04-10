export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ======================
    // INDEX / ADMIN
    // ======================
    if (url.pathname === "/" || url.pathname === "/admin") {
      return env.ASSETS.fetch(req);
    }

    // ======================
    // GET FEED
    // ======================
    if (url.pathname === "/api/feed") {
      const raw = await env.DB.get("feed");
      return Response.json({ data: raw ? JSON.parse(raw) : [] });
    }

    // ======================
    // ADD POST
    // ======================
    if (url.pathname === "/api/paste") {
      const body = await req.json();

      const raw = await env.DB.get("feed");
      const feed = raw ? JSON.parse(raw) : [];

      const post = {
        id: Date.now(),
        image: body.image || "",
        text: body.text || ""
      };

      feed.unshift(post);

      await env.DB.put("feed", JSON.stringify(feed.slice(0, 50)));

      return Response.json({ ok: true });
    }

    // ======================
    // UPDATE POST (LIVE EDIT)
    // ======================
    if (url.pathname === "/api/update") {
      const body = await req.json();

      const raw = await env.DB.get("feed");
      let feed = raw ? JSON.parse(raw) : [];

      feed = feed.map(p =>
        p.id === body.id
          ? { ...p, text: body.text }
          : p
      );

      await env.DB.put("feed", JSON.stringify(feed));

      return Response.json({ ok: true });
    }

    // ======================
    // DELETE POST
    // ======================
    if (url.pathname === "/api/delete") {
      const body = await req.json();

      const raw = await env.DB.get("feed");
      let feed = raw ? JSON.parse(raw) : [];

      feed = feed.filter(p => p.id !== body.id);

      await env.DB.put("feed", JSON.stringify(feed));

      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
};
