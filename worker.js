export default {
  async fetch(req) {
    return new Response("WORKER OK", {
      headers: { "content-type": "text/plain" }
    })
  }
}
