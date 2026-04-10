let timer = null;

async function load(){
  const res = await fetch('/api/feed')
  const json = await res.json()

  const feed = document.getElementById('feed')
  feed.innerHTML = ""

  json.data.forEach(post => {

    const wrap = document.createElement('div')
    wrap.className = "post"

    const img = document.createElement('img')
    img.src = post.image
    img.className = "image"

    const ta = document.createElement('textarea')
    ta.className = "text"
    ta.value = post.text || ""

    // ======================
    // LIVE EDIT
    // ======================
    ta.addEventListener('input', () => {

      clearTimeout(timer)

      timer = setTimeout(async () => {
        await fetch('/api/update', {
          method:'POST',
          headers:{'content-type':'application/json'},
          body: JSON.stringify({
            id: post.id,
            text: ta.value
          })
        })
      }, 400) // debounce
    })

    wrap.appendChild(img)
    wrap.appendChild(ta)

    feed.appendChild(wrap)
  })
}

load()
setInterval(load, 5000)
