function getAdminHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>admin</title>
<style>
body{font-family:Helvetica;background:white;color:black;padding:40px}
input,textarea{width:400px;font-size:16px;margin:10px;padding:10px}
button{padding:10px 20px}
</style>
</head>
<body>

<h2>ADMIN</h2>

<input id="img" placeholder="image url"/>
<textarea id="text" maxlength="500">Abracadabra...</textarea>

<div id="count">0 / 500</div>
<button onclick="send()">send</button>

<script>
const t=document.getElementById('text')
const c=document.getElementById('count')

t.addEventListener('input',()=>c.textContent=t.value.length+" / 500")

async function send(){
  await fetch('/api/paste',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      image:document.getElementById('img').value,
      text:t.value
    })
  })
  alert("ok")
}
</script>

</body>
</html>`;
}

function getIndexHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>feed</title>
<style>
body{
  margin:0;
  font-family:Helvetica;
  background:white;
  overflow-x:auto;
  overflow-y:hidden;
}

.feed{
  display:flex;
  flex-direction:row;
  gap:40px;
  padding:40px;
  width:max-content;
}

.post{width:400px;flex:0 0 auto}

img{width:100%;border-radius:10px}

textarea{
  width:100%;
  height:120px;
  font-size:20px;
  font-family:Helvetica;
  border:none;
  outline:none;
}
</style>
</head>
<body>

<div class="feed" id="feed"></div>

<script>
async function load(){
  const res=await fetch('/api/feed')
  const json=await res.json()

  const feed=document.getElementById('feed')
  feed.innerHTML=""

  json.data.forEach(p=>{
    const el=document.createElement('div')
    el.className="post"

    const img=document.createElement('img')
    img.src=p.image

    const ta=document.createElement('textarea')
    ta.maxLength=500
    ta.value=p.text

    el.appendChild(img)
    el.appendChild(ta)
    feed.appendChild(el)
  })
}

load()
setInterval(load,3000)
</script>

</body>
</html>`;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/admin") {
      return new Response(getAdminHTML(), {
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/") {
      return new Response(getIndexHTML(), {
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/api/paste") {
      let body = {};
      try { body = await req.json(); } catch {}

      const raw = await env.DB.get("feed");
      const feed = raw ? JSON.parse(raw) : [];

      feed.unshift({
        id: Date.now(),
        image: body.image || "",
        text: body.text || "Abracadabra..."
      });

      await env.DB.put("feed", JSON.stringify(feed.slice(0, 50)));

      return Response.json({ ok: true });
    }

    if (url.pathname === "/api/feed") {
      const raw = await env.DB.get("feed");
      return Response.json({ data: raw ? JSON.parse(raw) : [] });
    }

    return new Response("Not found", { status: 404 });
  }
};
