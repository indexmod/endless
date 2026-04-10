export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // healthcheck
    if (url.pathname === "/") {
      return new Response("WORKER LIVE");
    }

    // paste → KV
    if (url.pathname === "/api/paste") {
      const body = await req.json().catch(() => ({}));
      await env.KV.put("latest", JSON.stringify(body));
      return Response.json({ ok: true });
    }

    // feed → KV
    if (url.pathname === "/api/feed") {
      const data = await env.KV.get("latest");
      return Response.json({ data: data ? JSON.parse(data) : null });
    }

    return new Response("Not found", { status: 404 });
  }
}
