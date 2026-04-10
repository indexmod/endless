export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // ======================
      // 🔥 ADMIN PAGE
      // ======================
      if (pathname === "/admin") {
        return new Response(getAdminHTML(), {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }

      // ======================
      // 🧭 INDEX FEED PAGE
      // ======================
      if (pathname === "/") {
        return new Response(getIndexHTML(), {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }

      // ======================
      // ➕ ADD POST
      // ======================
      if (pathname === "/api/paste") {
        let body = {};

        try {
          body = await req.json();
        } catch (e) {
          body = {};
        }

        const raw = await env.DB.get("feed");
        const feed = raw ? JSON.parse(raw) : [];

        const post = {
          id: Date.now(),
          image: body.image || "",
          text: body.text || "Abracadabra... editable wiki note"
        };

        feed.unshift(post);

        await env.DB.put("feed", JSON.stringify(feed.slice(0, 50)));

        return Response.json({ ok: true, post });
      }

      // ======================
      // 📡 GET FEED
      // ======================
      if (pathname === "/api/feed") {
        const raw = await env.DB.get("feed");

        return Response.json({
          data: raw ? JSON.parse(raw) : []
        });
      }

      return new Response("Not found", { status: 404 });

    } catch (err) {
      return new Response(
        "Worker error: " + (err?.message || err),
        { status: 500 }
      );
    }
  }
};
