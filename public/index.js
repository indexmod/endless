const API = "https://endless.wiki-self.workers.dev";

const feedElement = document.getElementById("feed");

const emojis = [
  "😀", "😎", "🙂", "😏", "🤓",
  "😶", "🙃", "😌", "🫥", "🤔",
  "👽", "🤖", "👻", "🐱", "🐶",
  "🦊", "🐸", "🐵", "🦄", "🐼"
];

function randomEmoji() {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function hasEmoji(text) {
  return /^\p{Extended_Pictographic}/u.test(text.trim());
}

function formatLines(text) {
  return text
    .split("\n")
    .map(line => {
      if (!line.trim()) return line;

      const trimmed = line.trim();

      if (hasEmoji(trimmed)) {
        return line;
      }

      return `${randomEmoji()} ${trimmed}`;
    })
    .join("\n");
}

function parseMapUrl(value) {
  try {
    const url = new URL(value);

    let lat = null;
    let lng = null;
    let zoom = 13;

    // Google Maps
    const googleMatch = url.pathname.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/
    );

    if (googleMatch) {
      lat = Number(googleMatch[1]);
      lng = Number(googleMatch[2]);
      zoom = Number(googleMatch[3]) || 13;
    }

    const q = url.searchParams.get("q");
    const ll = url.searchParams.get("ll");

    if (!lat && q) {
      const match = q.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
      );

      if (match) {
        lat = Number(match[1]);
        lng = Number(match[2]);
      }
    }

    if (!lat && ll) {
      const match = ll.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
      );

      if (match) {
        lat = Number(match[1]);
        lng = Number(match[2]);
      }
    }

    // OpenStreetMap
    const map = url.hash.match(
      /#map=(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/
    );

    if (map) {
      zoom = Number(map[1]);
      lat = Number(map[2]);
      lng = Number(map[3]);
    }

    const mlat = url.searchParams.get("mlat");
    const mlon = url.searchParams.get("mlon");

    if (!lat && mlat && mlon) {
      lat = Number(mlat);
      lng = Number(mlon);
    }

    // Apple Maps
    if (!lat && ll) {
      const match = ll.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
      );

      if (match) {
        lat = Number(match[1]);
        lng = Number(match[2]);
      }
    }

    // Bing Maps
    const cp = url.searchParams.get("cp");

    if (!lat && cp) {
      const match = cp.match(
        /^\s*(-?\d+(?:\.\d+)?)~(-?\d+(?:\.\d+)?)\s*$/
      );

      if (match) {
        lat = Number(match[1]);
        lng = Number(match[2]);
      }
    }

    // Yandex Maps
    if (!lat && ll && url.hostname.includes("yandex")) {
      const match = ll.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
      );

      if (match) {
        lng = Number(match[1]);
        lat = Number(match[2]);
      }
    }

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return {
        lat,
        lng,
        zoom
      };
    }

    return null;

  } catch {
    return null;
  }
}

function createMap(container, location) {
  if (typeof L === "undefined") {
    return;
  }

  const map = L.map(container, {
    scrollWheelZoom: true
  }).setView(
    [location.lat, location.lng],
    location.zoom
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }
  ).addTo(map);

  L.marker([location.lat, location.lng]).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}

function createPost(post) {
  const article = document.createElement("article");
  article.className = "post";

  if (post.image) {
    const mapLocation = parseMapUrl(post.image);

    if (mapLocation) {
      const mapWrap = document.createElement("div");
      mapWrap.className = "mapWrap";

      const mapElement = document.createElement("div");
      mapElement.className = "map";

      mapWrap.appendChild(mapElement);
      article.appendChild(mapWrap);

      createMap(mapElement, mapLocation);

    } else {
      const imageWrap = document.createElement("div");
      imageWrap.className = "imageWrap";

      const image = document.createElement("img");
      image.className = "imageMain";
      image.src = post.image;
      image.alt = "";

      imageWrap.appendChild(image);
      article.appendChild(imageWrap);
    }
  }

  const textarea = document.createElement("textarea");
  textarea.className = "text";
  textarea.value = post.text || "";
  textarea.spellcheck = false;

  article.appendChild(textarea);

  let timer = null;

  textarea.addEventListener("input", () => {
    clearTimeout(timer);

    timer = setTimeout(async () => {
      try {
        await fetch(`${API}/api/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: post.id,
            text: textarea.value
          })
        });
      } catch (error) {
        console.error("Update error:", error);
      }
    }, 400);
  });

  textarea.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);

    const emoji = randomEmoji();

    textarea.value =
      before +
      "\n" +
      emoji +
      " " +
      after;

    const cursor = start + emoji.length + 2;

    textarea.selectionStart = cursor;
    textarea.selectionEnd = cursor;

    textarea.dispatchEvent(new Event("input"));
  });

  return article;
}

async function loadFeed() {
  try {
    const response = await fetch(`${API}/api/feed`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.ok || !Array.isArray(result.data)) {
      throw new Error("Invalid feed response");
    }

    feedElement.innerHTML = "";

    result.data.forEach(post => {
      feedElement.appendChild(createPost(post));
    });

  } catch (error) {
    console.error("Feed error:", error);
  }
}

let syncing = false;

async function syncFeed() {
  if (syncing) return;

  syncing = true;

  try {
    const response = await fetch(`${API}/api/feed`);

    if (!response.ok) return;

    const result = await response.json();

    if (!result.ok || !Array.isArray(result.data)) return;

    const currentIds = Array.from(
      feedElement.querySelectorAll(".post")
    ).map(post => post.dataset.id);

    const newIds = result.data.map(post => String(post.id));

    if (currentIds.join(",") !== newIds.join(",")) {
      loadFeed();
    }

  } catch (error) {
    console.error("Sync error:", error);
  } finally {
    syncing = false;
  }
}

loadFeed();

setInterval(syncFeed, 2000);
