const feed = document.getElementById("feed");

let posts = [];
let saveTimers = {};
let textareas = {}; // 💥 храним ссылки на DOM

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
        text: local?.text ?? p.text
      };
    });

  } else {
    posts = serverPosts;
  }

  render();
}

// ================= SYNC (без перерисовки) =================
async function sync() {
  try {
    const res = await fetch("/api/feed");
    const json = await res.json();

    const serverPosts = json.data || [];

    serverPosts.forEach(serverPost => {
      const local = posts.find(p => p.id === serverPost.id);
      if (!local) return;

      // если не редактируется
      if (!saveTimers[serverPost.id]) {
        if (local.text !== serverPost.text) {
          local.text = serverPost.text;

          // 💥 обновляем только textarea
          const textarea = textareas[serverPost.id];
          if (textarea && textarea.value !== serverPost.text) {
            textarea.value = serverPost.text;
          }
        }
      }
    });

  } catch (e) {
    console.error("sync failed", e);
  }
}

// ================= RENDER =================
function render() {
  feed.innerHTML = "";
  textareas = {};

  posts.forEach((item, index) => {

    const post = document.createElement("div");
    post.className = "post";

    // IMAGE
    const imageWrap = document.createElement("div");
    imageWrap.className = "imageWrap";

    const img = document.createElement("img");
    img.className = "imageMain";
    img.src = item.image;

    imageWrap.appendChild(img);

    // TEXT
    const text = document.createElement("textarea");
    text.className = "text";
    text.value = item.text || "";

    // 💥 сохраняем ссылку
    textareas[item.id] = text;

    text.addEventListener("input", (e) => {
      const value = e.target.value;

      posts[index].text = value;

      // local backup
      localStorage.setItem("feed_backup", JSON.stringify(posts));

      clearTimeout(saveTimers[item.id]);

      saveTimers[item.id] = setTimeout(async () => {
        try {
          await fetch("/api/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: item.id,
              text: value
            })
          });

        } catch (e) {
          console.error("save failed", e);
        } finally {
          delete saveTimers[item.id];
        }
      }, 400); // чуть быстрее
    });

    post.appendChild(imageWrap);
    post.appendChild(text);

    feed.appendChild(post);
  });
}

// ================= INIT =================
load();
setInterval(sync, 2000);
