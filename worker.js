export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ======================
    // 🔥 ADMIN PAGE
    // ======================
    if (url.pathname === "/admin") {
      return new Response(adminHTML, {
        headers: { "content-type": "text/html" }
      });
    }

    // ======================
    // 🧭 INDEX FEED PAGE
    // ======================
    if (url.pathname === "/") {
      return new Response(indexHTML, {
        headers: { "content-type": "text/html" }
      });
    }

    // ======================
    // ➕ ADD POST
    // ======================
    if (url.pathname === "/api/paste") {
      const body = await req.json();

      const raw = await env.DB.get("feed");
      const feed = raw ? JSON.parse(raw) : [];

      const post = {
        id: Date.now(),
        image: body.image,
        text: body.text || "Abracadabra... editable wiki note"
      };

      feed.unshift(post);

      await env.DB.put("feed", JSON.stringify(feed.slice(0, 50)));

      return Response.json({ ok: true });
    }

    // ======================
    // 📡 GET FEED
    // ======================
    if (url.pathname === "/api/feed") {
      const raw = await env.DB.get("feed");
      return Response.json({
        data: raw ? JSON.parse(raw) : []
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
