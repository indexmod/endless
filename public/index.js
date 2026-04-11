function render() {
  if (!Array.isArray(posts)) {
    console.error("posts is broken:", posts);
    return;
  }

  feed.innerHTML = "";

  const sorted = [...posts]
    .filter(p => p && typeof p === "object")
    .sort((a, b) => {
      return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
    });

  const total = sorted.length;

  sorted.forEach((item, index) => {

    if (!item) return;

    const post = document.createElement("div");
    post.className = "post";

    const imageWrap = document.createElement("div");
    imageWrap.className = "imageWrap";

    const img = document.createElement("img");
    img.className = "imageMain";

    // 🔥 защита
    img.src = item?.image || "";

    imageWrap.appendChild(img);

    const badge = document.createElement("div");
    badge.className = "index-badge";
    badge.textContent = String(total - index).padStart(2, "0");

    imageWrap.appendChild(badge);

    const text = document.createElement("textarea");
    text.className = "text";
    text.value = item?.text || "";

    text.addEventListener("input", (e) => {

      const value = e.target.value;

      const p = posts.find(p => p?.id === item?.id);
      if (!p || !item?.id) return;

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
