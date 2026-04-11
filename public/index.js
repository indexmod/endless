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

    // merge by id (safe state)
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

// ================= RENDER =================
function render() {
  feed.innerHTML = "";

  posts.forEach((item, index) => {

    const post = document.createElement("div");
    post.className = "post";

    // ================= BADGE =================
    const badge = document.createElement("div");
    badge.className = "index-badge";
    badge.textContent = String(index + 1).padStart(2, "0");

    post.appendChild(badge);

    // ================= IMAGE =================
    const imageWrap = document.createElement("div");
    imageWrap.className = "imageWrap";

    const img = document.createElement("img");
    img.className = "imageMain";
    img.src = item.image;

    imageWrap.appendChild(img);

    // ================= IMAGE BADGE (optional CSS support) =================
    const imageBadge = document.createElement("div");
    imageBadge.className = "index-badge image-badge";
    imageBadge.textContent = String(index + 1).padStart(2, "0");

    imageWrap.appendChild(imageBadge);

    // ================= TEXT =================
    const text = document.createElement("textarea");
    text.className = "text";
    text.value = item.text || "";

    // ================= INPUT =================
    text.addEventListener("input", (e) => {
      const value = e.target.value;

      const p = posts.find(p => p.id === item.id);
      if (!p) return;

      p.text = value;

      // local backup
      localStorage.setItem("feed_backup", JSON.stringify(posts));

      // UI state
      text.classList.add("dirty");
      text.classList.remove("saved");

      // debounce save (by id, NOT index)
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
