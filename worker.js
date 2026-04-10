export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ======================
    // STATIC
    // ======================
    if (url.pathname === "/" || url.pathname === "/admin") {
      return env.ASSETS.fetch(req);
    }

    // ======================
    // HARD CHECK DB
    // ======================
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          error: "DB NOT BOUND"
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" }
        }
      );
    }

    // ======================
    // DB LAYER
    // ======================
    const getFeed = async () => {
      const raw = await env.DB.get("feed");
      return raw ? JSON.parse(raw) : [];
    };

    const saveFeed = async (feed) => {
      await env.DB.put("feed", JSON.stringify(feed.slice(0, 50)));
    };

    // ======================
    // FEED
    // ======================
    if (url.pathname === "/api/feed") {
      return Response.json({
        data: await getFeed()
      });
    }

    // ======================
    // ADD
    // ======================
    if (url.pathname === "/api/paste") {
      const body = await req.json();

      const feed = await getFeed();

      const post = {
        id: Date.now(),
        image: body.image || "",
        text: body.text || ""
      };

      feed.unshift(post);

      await saveFeed(feed);

      return Response.json({
        ok: true,
        created: post
      });
    }

    // ======================
    // UPDATE
    // ======================
    if (url.pathname === "/api/update") {
      const body = await req.json();

      let feed = await getFeed();

      feed = feed.map(p =>
        p.id === body.id ? { ...p, text: body.text } : p
      );

      await saveFeed(feed);

      return Response.json({ ok: true });
    }

    // ======================
    // DELETE
    // ======================
    if (url.pathname === "/api/delete") {
      const body = await req.json();

      let feed = await getFeed();

      feed = feed.filter(p => p.id !== body.id);

      await saveFeed(feed);

      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
};
