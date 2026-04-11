const feed = document.getElementById("feed");

let posts = [];
let saveTimers = {};

// ================= LOAD =================
async function load() {
  try {
    const res = await fetch("/api/feed");
    const json = await res.json();

    // универсально: поддержка и {data: []} и []
    const serverPosts = json.data || json || [];

    const backup = localStorage.getItem("feed_backup");

    if (backup) {
      const localPosts = JSON.parse(backup);

      // merge по id
      posts = serverPosts.map((p) => {
        const local = localPosts.find(lp => lp.id === p.id);

        return {
          ...p,
          text: local?.text ?? p.text
        };
      });

    } else {
      posts = serverPosts;
    }

    render();

  } catch (e) {
    console.error("load failed", e);
  }
}

// ================= RENDER =================
function render() {
  feed.innerHTML = "";

  posts.forEach((item) => {

    const post = document.createElement("div");
    post.className = "post";

    // IMAGE
    const imageWrap = document.createElement("div");
    imageWrap.className = "imageWrap";

    const img = document.createElement("img");
    img.className = "imageMain";
    img.src = item.image || "";

    imageWrap.appendChild(img);

    // TEXT
    const text = document.createElement("textarea");
    text.className = "text";
    text.value = item.text || "";

    const id = item.id;

    text.addEventListener("input", (e) => {
      const value = e.target.value;

      // обновляем по id (не по index!)
      const target = posts.find(p => p.id === id);
      if (target) target.text = value;

      // local backup
      localStorage.setItem("feed_backup", JSON.stringify(posts));

      // UI состояние
      text.classList.add("dirty");
      text.classList.remove("saved");

      // debounce по id
      clearTimeout(saveTimers[id]);

      saveTimers[id] = setTimeout(async () => {
        try {
          await saveToServer({ id, text: value });

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
    body: JSON.stringify(post)
  });

  if (!res.ok) {
    throw new Error("save failed");
  }

  return await res.json();
}

// ================= INIT =================
window.addEventListener("DOMContentLoaded", load);
