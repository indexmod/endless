async function loadAdmin() {
  const root = document.getElementById('adminList');

  try {
    root.innerHTML = "loading...";

    const res = await fetch('/api/feed', {
      headers: {
        'cache-control': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error("API /api/feed failed: " + res.status);
    }

    const json = await res.json();

    console.log("API RESPONSE:", json);

    const feed = Array.isArray(json.data) ? json.data : [];

    root.innerHTML = "";

    if (feed.length === 0) {
      root.innerHTML = "<div>No posts</div>";
      return;
    }

    feed.forEach(post => {
      const row = document.createElement('div');
      row.style.border = "1px solid #000";
      row.style.padding = "10px";
      row.style.marginBottom = "10px";
      row.style.display = "flex";
      row.style.gap = "10px";
      row.style.alignItems = "center";

      // IMAGE
      if (post.image) {
        const img = document.createElement('img');
        img.src = post.image;
        img.style.width = "80px";
        img.style.height = "80px";
        img.style.objectFit = "cover";
        row.appendChild(img);
      }

      // TEXT
      const text = document.createElement('div');
      text.textContent = post.text || "";
      text.style.flex = "1";
      row.appendChild(text);

      // DELETE BUTTON
      const btn = document.createElement('button');
      btn.textContent = "delete";

      btn.onclick = async () => {
        try {
          const res = await fetch('/api/delete', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({ id: post.id })
          });

          if (!res.ok) {
            throw new Error("Delete failed: " + res.status);
          }

          loadAdmin();

        } catch (err) {
          console.error("DELETE ERROR:", err);
          alert("Delete failed (see console)");
        }
      };

      row.appendChild(btn);
      root.appendChild(row);
    });

  } catch (err) {
    console.error("LOAD ADMIN ERROR:", err);
    root.innerHTML = `
      <div style="color:red">
        Admin load failed<br>
        ${err.message}
      </div>
    `;
  }
}

loadAdmin();
