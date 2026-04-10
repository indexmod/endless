document.addEventListener("DOMContentLoaded", () => {
  const imgInput = document.getElementById("img");
  const textInput = document.getElementById("text");
  const counter = document.getElementById("counter");
  const sendBtn = document.getElementById("sendBtn");
  const root = document.getElementById("adminList");
  const lastPost = document.getElementById("lastPost");

  if (!imgInput || !textInput || !counter || !sendBtn || !root || !lastPost) {
    console.error("ADMIN INIT FAILED");
    return;
  }

  // ================= COUNTER =================
  textInput.addEventListener("input", () => {
    counter.textContent = `${textInput.value.length} / 500`;
  });

  // ================= SEND =================
  sendBtn.addEventListener("click", async () => {
    const payload = {
      image: imgInput.value.trim(),
      text: textInput.value.trim()
    };

    if (!payload.image) return;

    try {
      const res = await fetch("/api/paste", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("POST FAILED");

      const json = await res.json();

      // очистка
      imgInput.value = "";
      textInput.value = "";
      counter.textContent = "0 / 500";

      // показать последний пост сразу
      renderLast(json.post);

      // обновить список
      loadAdmin();

    } catch (e) {
      console.error("SEND ERROR:", e);
    }
  });

  // ================= LAST POST =================
  function renderLast(post){
    lastPost.innerHTML = "";

    const card = document.createElement("div");
    card.className = "adminItem";

    const img = document.createElement("img");
    img.src = post.image;

    const text = document.createElement("div");
    text.textContent = post.text;

    card.appendChild(img);
    card.appendChild(text);

    lastPost.appendChild(card);
  }

  // ================= LOAD =================
  async function loadAdmin() {
    try {
      const res = await fetch("/api/feed");
      const json = await res.json();

      root.innerHTML = "";

      json.data.forEach(post => {
        const row = document.createElement("div");
        row.className = "adminItem";

        const img = document.createElement("img");
        img.src = post.image;

        const text = document.createElement("div");
        text.textContent = post.text;

        const btn = document.createElement("button");
        btn.textContent = "delete";

        btn.onclick = async () => {
          await fetch("/api/delete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: post.id })
          });

          loadAdmin();
        };

        row.appendChild(img);
        row.appendChild(text);
        row.appendChild(btn);

        root.appendChild(row);
      });

    } catch (err) {
      console.error("LOAD ADMIN ERROR:", err);
    }
  }

  // ================= INIT =================
  loadAdmin();
});
