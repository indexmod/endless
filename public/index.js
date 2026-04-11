function render() {
  feed.innerHTML = "";

  // 🔥 НОВЫЕ СЛЕВА, СТАРЫЕ СПРАВА
  const sorted = [...posts].sort((a, b) => {
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const total = sorted.length;

  sorted.forEach((item, index) => {

    const post = document.createElement("div");
    post.className = "post";

    const imageWrap = document.createElement("div");
    imageWrap.className = "imageWrap";

    const img = document.createElement("img");
    img.className = "imageMain";
    img.src = item.image;

    imageWrap.appendChild(img);

    const badge = document.createElement("div");
    badge.className = "index-badge";

    badge.textContent = String(total - index).padStart(2, "0");

    imageWrap.appendChild(badge);

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

    post.appendChild(imageWrap);
    post.appendChild(text);

    feed.appendChild(post);
  });
}
