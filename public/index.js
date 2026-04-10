const feed = document.getElementById("feed");

let posts = [];
let saveTimers = {}; // отдельный debounce на каждый пост

// ================= LOAD =================
async function load() {
  try {
    const res = await fetch("/api/feed");
    const json = await res.json();

    let serverPosts = json.data || [];

    const backup = localStorage.getItem("feed_backup");

    if (backup) {
      const localPosts = JSON.parse(backup);

      // 💥 merge локального и серверного
      serverPosts = serverPosts.map((p, i) => ({
        ...p,
        text: localPosts[i]?.text || p.text
      }));
    }

    posts = serverPosts;

  } catch (e) {
    console.error("load failed, fallback to localStorage");

    const backup = localStorage.getItem("feed_backup");
    if (backup) {
      posts = JSON.parse(backup);
    }
  }

  render();
}

// ================= RENDER =================
function render() {
  feed.innerHTML = "";

  posts.forEach((item, index) => {
    const post = document.createElement("div");
    post.className = "post";

    const imageRow = document.createElement("div");
    imageRow.className = "imageRow";

    const imgMain = document.createElement("img");
    imgMain.className = "imageMain";
    imgMain.src = item.image;

    const imgThumb = document.createElement("img");
    imgThumb.className = "imageThumb";
    imgThumb.src = item.image;

    const text = document.createElement("textarea");
    text.className = "text";
    text.value = item.text || "";

    // ================= INPUT =================
    text.addEventListener("input", (e) => {
      const value = e.target.value;

      posts[index].text = value;

      // 💥 мгновенный локальный бэкап
      localStorage.setItem("feed_backup", JSON.stringify(posts));

      // 💥 debounce на конкретный пост
      if (saveTimers[index]) {
        clearTimeout(saveTimers[index]);
      }

      saveTimers[index] = setTimeout(() => {
        saveToServer(posts[index]);
      }, 500);
    });

    imageRow.appendChild(imgMain);
    imageRow.appendChild(imgThumb);

    post.appendChild(imageRow);
    post.appendChild(text);

    feed.appendChild(post);
  });
}

// ================= SAVE =================
async function saveToServer(post) {
  try {
    await fetch("/api/post/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(post)
    });
  } catch (e) {
    console.error("save failed", e);
  }
}

// ================= INIT =================
load();
