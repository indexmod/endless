async function loadAdmin(){
  const res = await fetch('/api/feed')
  const json = await res.json()

  const root = document.getElementById('adminList')
  root.innerHTML = ""

  json.data.forEach(post => {

    const row = document.createElement('div')
    row.style.border = "1px solid black"
    row.style.padding = "10px"
    row.style.marginBottom = "10px"

    const img = document.createElement('img')
    img.src = post.image
    img.style.width = "100px"

    const btn = document.createElement('button')
    btn.textContent = "delete"

    btn.onclick = async () => {
      await fetch('/api/delete', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({ id: post.id })
      })

      loadAdmin()
    }

    row.appendChild(img)
    row.appendChild(btn)

    root.appendChild(row)
  })
}

loadAdmin()
