document.addEventListener("DOMContentLoaded", () => {
  const imgInput = document.getElementById("img");
  const textInput = document.getElementById("text");
  const counter = document.getElementById("counter");
  const sendBtn = document.getElementById("sendBtn");
  const root = document.getElementById("adminList");

  // safety checks
  if (!imgInput || !textInput || !counter || !sendBtn || !root) {
    console.error("ADMIN INIT FAILED: missing elements");
    return;
  }

  // counter
  textInput.addEventListener("input", () => {
    counter.textContent = `${textInput.value.length} / 500`;
  });

  // send handler
  sendBtn.addEventListener("click", async () => {
    const payload = {
      image: imgInput.value,
      text: textInput.value
    };

    await fetch("/api/paste", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    imgInput.value = "";
    textInput.value = "";
    counter.textContent = "0 / 500";

    loadAdmin();
  });

  // load feed
  async function loadAdmin() {
    try {
      const res = await fetch("/api/feed");
      const json = await res.json();

      root.innerHTML = "";

      json.data.forEach(post => {
        const row = document.createElement("div");
        row.style.border = "1px solid #000";
        row.style.padding = "10px";
        row.style.marginBottom = "10px";

        const img = document.createElement("img");
        img.src = post.image;
        img.style.width = "120px";

        const text = document.createElement("div");
        text.textContent = post.text;

        const btn = document.createElement("button");
        btn.textContent = "delete";

        btn.addEventListener("click", async () => {
          await fetch("/api/delete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: post.id })
          });

          loadAdmin();
        });

        row.appendChild(img);
        row.appendChild(text);
        row.appendChild(btn);

        root.appendChild(row);
      });

    } catch (err) {
      console.error("LOAD ADMIN ERROR:", err);
    }
  }

  // init
  loadAdmin();
});
