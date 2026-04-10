const feed = document.getElementById("feed");

let posts = [];

async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  posts = json.data || [];

  render();
  setupFocus();
}

function render() {
  feed.innerHTML = "";

  posts.forEach((item, index) => {
    const post = document.createElement("div");
    post.className = "post";
    post.dataset.index = index;

    const imageRow = document.createElement("div");
    imageRow.className = "imageRow";

    // MAIN IMAGE (срез снизу через CSS object-position)
    const imgMain = document.createElement("img");
    imgMain.className = "imageMain";
    imgMain.src = item.image;

    // THUMB (полная версия)
    const imgThumb = document.createElement("img");
    imgThumb.className = "imageThumb";
    imgThumb.src = item.image;

    const text = document.createElement("textarea");
text.className = "text";
text.value = item.text || "";

/* 💥 теперь реально редактор */
text.addEventListener("input", (e) => {
  const newValue = e.target.value;

  // обновляем локально
  posts[index].text = newValue;

  // 💾 локальное сохранение (чтобы не терялось)
  localStorage.setItem("feed_backup", JSON.stringify(posts));
});
  }

  window.addEventListener("scroll", updateFocus, { passive: true });
  window.addEventListener("resize", updateFocus);

  updateFocus();
}

load();
