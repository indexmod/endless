const API = "https://endless.wiki-self.workers.dev";

const feed = document.getElementById("feed");

let posts = [];
let saveTimers = {};
let textareas = {};

const USER_EMOJIS = [
	"🐈", "🐕", "🦊", "🐼", "🐸",
	"🐙", "🦋", "🐝", "🦄", "🐳",
	"🌞", "🌙", "⭐", "🪐", "🌈",
	"🍋", "🍒", "🍀", "🌵", "🌻",
	"🎈", "🎨", "🎧", "📷", "💿"
];

function randomEmoji() {
	return USER_EMOJIS[
		Math.floor(Math.random() * USER_EMOJIS.length)
	];
}


/* =========================================================
   TEXT FORMAT
   ========================================================= */

function formatAnonymousLines(text) {

	return text
		.split("\n")
		.map(line => {

			if (!line.trim()) {
				return line;
			}

			if (/^\p{Extended_Pictographic}\s/u.test(line.trim())) {
				return line;
			}

			return `${randomEmoji()} ${line}`;

		})
		.join("\n");
}


function insertUserLine(textarea) {

	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;

	const before = textarea.value.slice(0, start);
	const after = textarea.value.slice(end);

	const insertion = "\n" + randomEmoji() + " ";

	textarea.value =
		before +
		insertion +
		after;

	const position =
		before.length +
		insertion.length;

	textarea.selectionStart = position;
	textarea.selectionEnd = position;

	textarea.dispatchEvent(new Event("input", {
		bubbles: true
	}));
}


/* =========================================================
   MAP URL PARSER
   ========================================================= */

function parseMapURL(value) {

	if (!value) return null;

	let url;

	try {
		url = new URL(value);
	} catch {
		return null;
	}

	const host = url.hostname.toLowerCase();

	/* Google Maps */

	if (
		host.includes("google.") ||
		host === "maps.google.com"
	) {

		const at = value.match(
			/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
		);

		if (at) {
			return {
				lat: Number(at[1]),
				lon: Number(at[2]),
				zoom: 15,
				provider: "Google Maps"
			};
		}

		const q =
			url.searchParams.get("q") ||
			url.searchParams.get("ll");

		if (q) {

			const m = q.match(
				/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/
			);

			if (m) {
				return {
					lat: Number(m[1]),
					lon: Number(m[2]),
					zoom: 15,
					provider: "Google Maps"
				};
			}
		}
	}


	/* OpenStreetMap */

	if (
		host.includes("openstreetmap.")
	) {

		const map =
			value.match(
				/#map=(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/
			);

		if (map) {
			return {
				zoom: Number(map[1]),
				lat: Number(map[2]),
				lon: Number(map[3]),
				provider: "OpenStreetMap"
			};
		}

		const lat =
			url.searchParams.get("mlat");

		const lon =
			url.searchParams.get("mlon");

		if (lat && lon) {
			return {
				lat: Number(lat),
				lon: Number(lon),
				zoom: 15,
				provider: "OpenStreetMap"
			};
		}
	}


	/* Apple Maps */

	if (
		host.includes("apple.com") ||
		host.includes("maps.apple.com")
	) {

		const ll =
			url.searchParams.get("ll");

		if (ll) {

			const m = ll.match(
				/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/
			);

			if (m) {
				return {
					lat: Number(m[1]),
					lon: Number(m[2]),
					zoom: 15,
					provider: "Apple Maps"
				};
			}
		}
	}


	/* Bing Maps */

	if (host.includes("bing.com")) {

		const cp =
			url.searchParams.get("cp");

		if (cp) {

			const m = cp.match(
				/(-?\d+(?:\.\d+)?)[~\s]+(-?\d+(?:\.\d+)?)/
			);

			if (m) {
				return {
					lat: Number(m[1]),
					lon: Number(m[2]),
					zoom: 15,
					provider: "Bing Maps"
				};
			}
		}
	}


	/* Yandex Maps */

	if (host.includes("yandex.")) {

		const ll =
			url.searchParams.get("ll");

		if (ll) {

			const m = ll.match(
				/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
			);

			if (m) {
				return {
					lon: Number(m[1]),
					lat: Number(m[2]),
					zoom: 15,
					provider: "Yandex Maps"
				};
			}
		}
	}


	return null;
}


/* =========================================================
   MAP RENDER
   ========================================================= */

function createMap(container, data, originalURL) {

	const map = L.map(container, {
		zoomControl: true,
		scrollWheelZoom: true
	}).setView(
		[data.lat, data.lon],
		data.zoom || 15
	);

	L.tileLayer(
		"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		{
			maxZoom: 19,
			attribution:
				'© OpenStreetMap contributors'
		}
	).addTo(map);

	L.marker([
		data.lat,
		data.lon
	])
	.addTo(map)
	.bindPopup(data.provider)
	.openPopup();

	return map;
}


/* =========================================================
   LOAD
   ========================================================= */

async function load() {

	try {

		const res =
			await fetch(`${API}/api/feed`);

		const json =
			await res.json();

		const serverPosts =
			json.data || [];

		const backup =
			localStorage.getItem("feed_backup");

		if (backup) {

			const localPosts =
				JSON.parse(backup);

			posts =
				serverPosts.map(p => {

					const local =
						localPosts.find(
							lp => lp.id === p.id
						);

					return {
						...p,
						text:
							local?.text ?? p.text
					};

				});

		} else {

			posts = serverPosts;

		}

		render();

	} catch (e) {

		console.error(
			"load failed",
			e
		);

	}

}


/* =========================================================
   SYNC
   ========================================================= */

async function sync() {

	try {

		const res =
			await fetch(`${API}/api/feed`);

		const json =
			await res.json();

		const serverPosts =
			json.data || [];

		serverPosts.forEach(serverPost => {

			const local =
				posts.find(
					p => p.id === serverPost.id
				);

			if (!local) return;

			if (!saveTimers[serverPost.id]) {

				if (
					local.text !==
					serverPost.text
				) {

					local.text =
						serverPost.text;

					const textarea =
						textareas[
							serverPost.id
						];

					if (
						textarea &&
						textarea.value !==
						serverPost.text
					) {

						textarea.value =
							serverPost.text;

					}

				}

			}

		});

	} catch (e) {

		console.error(
			"sync failed",
			e
		);

	}

}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

	feed.innerHTML = "";
	textareas = {};

	posts.forEach(item => {

		const post =
			document.createElement("div");

		post.className = "post";


		/* MEDIA */

		const mapData =
			parseMapURL(item.image);

		if (mapData) {

			const mapWrap =
				document.createElement("div");

			mapWrap.className =
				"mapWrap";

			const map =
				document.createElement("div");

			map.className =
				"map";

			mapWrap.appendChild(map);

			const link =
				document.createElement("a");

			link.className =
				"mapLink";

			link.href =
				item.image;

			link.target =
				"_blank";

			link.rel =
				"noopener noreferrer";

			link.textContent =
				`Open in ${mapData.provider}`;

			mapWrap.appendChild(link);

			post.appendChild(mapWrap);

			requestAnimationFrame(() => {
				createMap(
					map,
					mapData,
					item.image
				);
			});

		} else {

			const imageWrap =
				document.createElement("div");

			imageWrap.className =
				"imageWrap";

			const img =
				document.createElement("img");

			img.className =
				"imageMain";

			img.src =
				item.image;

			img.loading =
				"lazy";

			imageWrap.appendChild(img);

			post.appendChild(imageWrap);

		}


		/* TEXT */

		const text =
			document.createElement("textarea");

		text.className =
			"text";

		text.value =
			item.text || "";

		textareas[item.id] =
			text;


		text.addEventListener(
			"keydown",
			e => {

				if (
					e.key === "Enter" &&
					!e.shiftKey
				) {

					e.preventDefault();

					insertUserLine(text);

				}

			}
		);


		text.addEventListener(
			"input",
			e => {

				const value =
					e.target.value;

				const target =
					posts.find(
						p => p.id === item.id
					);

				if (target) {
					target.text =
						value;
				}

				localStorage.setItem(
					"feed_backup",
					JSON.stringify(posts)
				);

				clearTimeout(
					saveTimers[item.id]
				);

				saveTimers[item.id] =
					setTimeout(
						async () => {

							try {

								await fetch(
									`${API}/api/update`,
									{
										method: "POST",

										headers: {
											"Content-Type":
												"application/json"
										},

										body:
											JSON.stringify({
												id: item.id,
												text: value
											})
									}
								);

							} catch (e) {

								console.error(
									"save failed",
									e
								);

							} finally {

								delete saveTimers[
									item.id
								];

							}

						},
						400
					);

			}
		);


		post.appendChild(text);

		feed.appendChild(post);

	});

}


load();

setInterval(
	sync,
	2000
);
