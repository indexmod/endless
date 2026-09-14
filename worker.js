const corsHeaders = {
  "Access-Control-Allow-Origin": "https://indexmod.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders
    }
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (!env.DB) {
      return json(
        { error: "DB NOT BOUND" },
        500
      );
    }

    const getFeed = async () => {
      try {
        const raw = await env.DB.get("feed");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    };

    const saveFeed = async (feed) => {
      try {
        await env.DB.put(
          "feed",
          JSON.stringify(feed.slice(0, 50))
        );
      } catch (e) {
        console.log("DB ERROR:", e);
      }
    };

    if (url.pathname === "/api/feed") {
      return json({
        ok: true,
        data: await getFeed()
      });
    }

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

      return json({
        ok: true,
        post
      });
    }

    if (url.pathname === "/api/update") {
      const body = await req.json();

      let feed = await getFeed();

      feed = feed.map(p =>
        p.id === body.id
          ? { ...p, text: body.text }
          : p
      );

      await saveFeed(feed);

      return json({
        ok: true
      });
    }

    if (url.pathname === "/api/delete") {
      const body = await req.json();

      let feed = await getFeed();

      feed = feed.filter(
        p => p.id !== body.id
      );

      await saveFeed(feed);

      return json({
        ok: true
      });
    }

    if (url.pathname === "/admin") {
      return env.ASSETS.fetch(
        new Request(
          new URL("/admin.html", req.url),
          req
        )
      );
    }

    const response = await env.ASSETS.fetch(req);

    return response;
  }
};
