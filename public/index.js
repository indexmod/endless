const feed = document.getElementById("feed");

let posts = [];
let saveTimers = {};

// ================= LOAD =================
async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  let serverPosts = json.data || [];

  const backup = localStorage.getItem("feed_backup");

  if (backup) {
    const localPosts = JSON.parse(backup);

    serverPosts = serverPosts.map((p, i) => ({
      ...p,
      text: localPosts[i]?.text || p.text
    }));
  }

  posts = serverPosts;
  render();
}

// ================= RENDER =================
function render() {
  feed.innerHTML = "";

  posts.forEach((item, index) => {

    const post = document.createElement("div");
    post.className = "post";

    // IMAGE WRAP
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
      posts[index].text = e.target.value;

      localStorage.setItem("feed_backup", JSON.stringify(posts));

      if (saveTimers[index]) {
        clearTimeout(saveTimers[index]);
      }

      saveTimers[index] = setTimeout(() => {
        saveToServer(posts[index]);
      }, 500);
    });

    post.appendChild(imageWrap);
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
