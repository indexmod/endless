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
        text: local?.text ?? p.text
      };
    });

  } else {
    posts = serverPosts;
  }

  render();
}

// ================= SYNC (REAL DANCING) =================
async function sync() {
  try {
    const res = await fetch("/api/feed");
    const json = await res.json();

    const serverPosts = json.data || [];

    serverPosts.forEach(serverPost => {
      const local = posts.find(p => p.id === serverPost.id);
      if (!local) return;

      // 💥 если НЕ редактируется — обновляем
      if (!saveTimers[serverPost.id]) {
        local.text = serverPost.text;
      }
    });

    render();

  } catch (e) {
    console.error("sync failed", e);
  }
}

// ================= RENDER =================
function render() {
  feed.innerHTML = "";

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

    text.addEventListener("input", (e) => {
      const value = e.target.value;

      posts[index].text = value;

      // 💾 local backup
      localStorage.setItem("feed_backup", JSON.stringify(posts));

      // debounce
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

          console.log("saved", item.id);

        } catch (e) {
          console.error("save failed", e);
        } finally {
          // 💥 КЛЮЧ: освобождаем "замок редактирования"
          delete saveTimers[item.id];
        }
      }, 500);
    });

    post.appendChild(imageWrap);
    post.appendChild(text);

    feed.appendChild(post);
  });
}

// ================= INIT =================
load();

// 💥 запускаем "дыхание"
setInterval(sync, 2000);
