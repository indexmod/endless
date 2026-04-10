export default {
  async fetch() {
    return new Response("WORKER OK", { status: 200 });
  }
}
