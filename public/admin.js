const API = "https://endless.wiki-self.workers.dev";

const imgInput = document.getElementById("img");
const textInput = document.getElementById("text");
const counter = document.getElementById("counter");
const sendBtn = document.getElementById("sendBtn");
const lastPost = document.getElementById("lastPost");
const adminList = document.getElementById("adminList");

const emojis = [
  "😀", "😎", "🙂", "😏", "🤓",
  "😶", "🙃", "😌", "🫥", "🤔",
  "👽", "🤖", "👻", "🐱", "🐶",
  "🦊", "🐸", "🐵", "🦄", "🐼"
];

function randomEmoji() {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function updateCounter() {
  const count = textInput.value.length;
  counter.textContent = `${count} characters`;
}

function formatLines(text) {
  return text
    .split("\n")
    .map(line => {
      if (!line.trim()) return line;

      const trimmed = line.trim();

      if (/^\p{Extended_Pictographic}/u.test(trimmed)) {
        return line;
      }

      return `${randomEmoji()} ${trimmed}`;
    })
    .join("\n");
}

textInput.addEventListener("input", updateCounter);

textInput.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;

  event.preventDefault();

  const start = textInput.selectionStart;
  const end = textInput.selectionEnd;

  const before = textInput.value.slice(0, start);
  const after = textInput.value.slice(end);

  const emoji = randomEmoji();

  textInput.value =
    before +
    "\n" +
    emoji +
    " " +
    after;

  const cursor = start + emoji.length + 2;

  textInput.selectionStart = cursor;
  textInput.selectionEnd = cursor;

  updateCounter();
});

async function addPost() {
  const image = imgInput.value.trim();
  const rawText = textInput.value;

  if (!image && !rawText.trim()) {
    return;
  }

  const text = formatLines(rawText);

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try {
    const response = await fetch(`${API}/api/paste`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image,
        text
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error("API error");
    }

    imgInput.value = "";
    textInput.value = "";

    updateCounter();

    renderLastPost(result.post);

    await loadPosts();

  } catch (error) {
    console.error(error);
    alert("Не удалось добавить пост.");
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
}

function renderLastPost(post) {
  lastPost.innerHTML = "";

  if (!post) return;

  const item = document.createElement("div");
  item.className = "adminItem";

  if (post.image) {
    const img = document.createElement("img");
    img.src = post.image;
    img.alt = "";
    item.appendChild(img);
  }

  const text = document.createElement("div");
  text.textContent = post.text || "";

  item.appendChild(text);
  lastPost.appendChild(item);
}

async function loadPosts() {
  try {
    const response = await fetch(`${API}/api/feed`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    adminList.innerHTML = "";

    if (!result.ok || !Array.isArray(result.data)) {
      return;
    }

    result.data.slice(0, 10).forEach(post => {
      const item = document.createElement("div");
      item.className = "adminItem";

      if (post.image) {
        const img = document.createElement("img");
        img.src = post.image;
        img.alt = "";
        item.appendChild(img);
      }

      const text = document.createElement("div");
      text.textContent = post.text || "";

      item.appendChild(text);
      adminList.appendChild(item);
    });

  } catch (error) {
    console.error("Feed error:", error);
  }
}

sendBtn.addEventListener("click", addPost);

updateCounter();
loadPosts();
