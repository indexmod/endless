const feed = document.getElementById("feed");

let posts = [];
let saveTimers = {};

// ================= LOAD =================
async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  const serverPosts = json.data || [];

  const backup = localStorage.getItem("feed_backup");

  if (backup) {
    const localPosts = JSON.parse(backup);

    posts = serverPosts.map((p) => {
      const local = localPosts.find(lp => lp.id === p.id);

      return {
        ...p,
        text: local?.text ?? p.text,
        createdAt: p.createdAt || p.id
      };
    });

  } else {
    posts = serverPosts.map(p => ({
      ...p,
      createdAt: p.createdAt || p.id
    }));
  }

  render();
}

// ================= RENDER =================
function render() {
  feed.innerHTML = "";

  // 🔥 сортировка: старые → новые (НЕ ТРОГАЕМ ПОРЯДОК ДАННЫХ)
  const sorted = [...posts].sort((a, b) => {
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  const total = sorted.length;

  sorted.forEach((item, index) => {

    const post = document.createElement("div");
    post.className = "post";

    // ================= IMAGE WRAP =================
    const imageWrap = document.createElement("div");
    imageWrap.className = "imageWrap";

    const img = document.createElement("img");
    img.className = "imageMain";
    img.src = item.image;

    imageWrap.appendChild(img);

    // ================= BADGE (REVERSED INDEX) =================
    const badge = document.createElement("div");
    badge.className = "index-badge";

    // 🔥 ОБРАТНЫЙ ОТСЧЁТ:
    // старый = 1, новый = N
    badge.textContent = String(total - index).padStart(2, "0");

    imageWrap.appendChild(badge);

    // ================= TEXT =================
    const text = document.createElement("textarea");
    text.className = "text";
    text.value = item.text || "";

    text.addEventListener("input", (e) => {
      const value = e.target.value;

      const p = posts.find(p => p.id === item.id);
      if (!p) return;

      p.text = value;

      localStorage.setItem("feed_backup", JSON.stringify(posts));

      text.classList.add("dirty");
      text.classList.remove("saved");

      clearTimeout(saveTimers[item.id]);

      saveTimers[item.id] = setTimeout(async () => {
        try {
          await saveToServer(p);

          text.classList.remove("dirty");
          text.classList.add("saved");

          setTimeout(() => {
            text.classList.remove("saved");
          }, 800);

        } catch (e) {
          console.error("save failed", e);
        }
      }, 500);
    });

    // ================= APPEND =================
    post.appendChild(imageWrap);
    post.appendChild(text);

    feed.appendChild(post);
  });
}

// ================= SAVE =================
async function saveToServer(post) {
  const res = await fetch("/api/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: post.id,
      text: post.text
    })
  });

  if (!res.ok) {
    throw new Error("save failed");
  }

  return await res.json();
}

// ================= INIT =================
load();
