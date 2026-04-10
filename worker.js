function indexHTML() {
  return `
  <html>
    <body>
      <h1>INDEX OK</h1>
    </body>
  </html>`;
}

function adminHTML() {
  return `
  <html>
    <body>
      <h1>ADMIN OK</h1>
    </body>
  </html>`;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    try {

      // ======================
      // INDEX
      // ======================
      if (url.pathname === "/") {
        return new Response(indexHTML(), {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }

      // ======================
      // ADMIN
      // ======================
      if (url.pathname === "/admin") {
        return new Response(adminHTML(), {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }

      // ======================
      // SAFE DB HELPER
      // ======================
      const getFeed = async () => {
        if (!env.DB) return [];
        const raw = await env.DB.get("feed");
        try {
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      };

      const saveFeed = async (feed) => {
        if (!env.DB) return;
        await env.DB.put("feed", JSON.stringify(feed.slice(0, 50)));
      };

      // ======================
      // API: FEED
      // ======================
      if (url.pathname === "/api/feed") {
        return Response.json({ data: await getFeed() });
      }

      // ======================
      // API: ADD
      // ======================
      if (url.pathname === "/api/paste") {
        const body = await req.json();
        const feed = await getFeed();

        feed.unshift({
          id: Date.now(),
          image: body.image || "",
          text: body.text || ""
        });

        await saveFeed(feed);

        return Response.json({ ok: true });
      }

      // ======================
      // API: UPDATE
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
      // API: DELETE
      // ======================
      if (url.pathname === "/api/delete") {
        const body = await req.json();
        let feed = await getFeed();

        feed = feed.filter(p => p.id !== body.id);

        await saveFeed(feed);

        return Response.json({ ok: true });
      }

      return new Response("Not found", { status: 404 });

    } catch (e) {
      return new Response(
        "Worker crash: " + (e?.message || String(e)),
        { status: 500 }
      );
    }
  }
};
