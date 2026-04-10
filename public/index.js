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
    text.readOnly = true;

    imageRow.appendChild(imgMain);
    imageRow.appendChild(imgThumb);

    post.appendChild(imageRow);
    post.appendChild(text);

    feed.appendChild(post);
  });
}

/**
 * 💥 ФОКУС ЭФФЕКТ (пространственное восприятие)
 * ближайший к центру пост становится "живым"
 */
function setupFocus() {
  const postsEls = [...document.querySelectorAll(".post")];

  function updateFocus() {
    const centerX = window.innerWidth / 2;

    postsEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.left + rect.width / 2;

      const distance = Math.abs(centerX - elCenter);

      // нормализуем
      const scale = Math.max(0.9, 1 - distance / 1200);

      el.style.transform = `scale(${scale})`;
      el.style.opacity = scale < 0.92 ? 0.5 : 1;
    });
  }

  window.addEventListener("scroll", updateFocus, { passive: true });
  window.addEventListener("resize", updateFocus);

  updateFocus();
}

load();
