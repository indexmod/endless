const feed = document.getElementById("feed");

let posts = [];
let saveTimers = {};
let textareas = {};

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

// ================= SYNC =================
async function sync() {
  try {
    const res = await fetch("/api/feed");
    const json = await res.json();

    const serverPosts = json.data || [];

    serverPosts.forEach(serverPost => {
      const local = posts.find(p => p.id === serverPost.id);
      if (!local) return;

      if (!saveTimers[serverPost.id]) {
        if (local.text !== serverPost.text) {
          local.text = serverPost.text;

          const textarea = textareas[serverPost.id];
          if (textarea && textarea.value !== serverPost.text) {
            textarea.value = serverPost.text;

            // 🔥 авто-рост при синке
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
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

  // 💥 НОВЫЕ СВЕРХУ
  [...posts].reverse().forEach((item) => {

    const post = document.createElement("div");
    post.className = "post";

    const imageWrap = document.createElement("div");
    imageWrap.className = "imageWrap";

    const img = document.createElement("img");
    img.className = "imageMain";
    img.src = item.image;

    imageWrap.appendChild(img);

    const text = document.createElement("textarea");
    text.className = "text";
    text.value = item.text || "";

    // 🔥 авто-рост СРАЗУ после создания
    text.style.height = "auto";
    text.style.height = text.scrollHeight + "px";

    textareas[item.id] = text;

    text.addEventListener("input", (e) => {
      const value = e.target.value;

      // 🔥 авто-рост при вводе
      text.style.height = "auto";
      text.style.height = text.scrollHeight + "px";

      const target = posts.find(p => p.id === item.id);
      if (target) target.text = value;

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
      }, 400);
    });

    post.appendChild(imageWrap);
    post.appendChild(text);

    feed.appendChild(post);
  });
}

// ================= INIT =================
load();
setInterval(sync, 2000);
