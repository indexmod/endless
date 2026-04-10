const feed = document.getElementById("feed");

let posts = [];

async function load() {
  const res = await fetch("/api/feed");
  const json = await res.json();

  posts = json.data || [];

  // восстановление из localStorage
  const backup = localStorage.getItem("feed_backup");
  if (backup) {
    posts = JSON.parse(backup);
  }

  render();
}

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

    text.addEventListener("input", (e) => {
      posts[index].text = e.target.value;
      localStorage.setItem("feed_backup", JSON.stringify(posts));
    });

    imageRow.appendChild(imgMain);
    imageRow.appendChild(imgThumb);

    post.appendChild(imageRow);
    post.appendChild(text);

    feed.appendChild(post);
  });
}

load();
