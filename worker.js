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
      // STATIC
      // ======================
      if (url.pathname === "/" || url.pathname === "/admin") {
        return env.ASSETS?.fetch(req);
      }

      // ======================
      // DB SAFE WRAPPER
      // ======================
      const getFeed = async () => {
        try {
          const raw = await env.DB?.get("feed");
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      };

      const saveFeed = async (feed) => {
        try {
          await env.DB?.put("feed", JSON.stringify(feed.slice(0, 50)));
        } catch (e) {
          console.log("DB WRITE ERROR:", e);
        }
      };

      // ======================
      // FEED
      // ======================
      if (url.pathname === "/api/feed") {
        return Response.json({
          ok: true,
          data: await getFeed()
        });
      }

      // ======================
      // ADD
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

    } catch (e) {
      return new Response(
        JSON.stringify({
          error: e?.message || String(e)
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" }
        }
      );
    }
  }
};
