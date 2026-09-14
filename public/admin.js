const API =
	"https://endless.wiki-self.workers.dev";


const USER_EMOJIS = [
	"🐈", "🐕", "🦊", "🐼", "🐸",
	"🐙", "🦋", "🐝", "🦄", "🐳",
	"🌞", "🌙", "⭐", "🪐", "🌈",
	"🍋", "🍒", "🍀", "🌵", "🌻",
	"🎈", "🎨", "🎧", "📷", "💿"
];


function randomEmoji() {

	return USER_EMOJIS[
		Math.floor(
			Math.random() *
			USER_EMOJIS.length
		)
	];

}


/*
 * Add anonymous userpic
 * to every new line.
 */

function formatLines(text) {

	return text
		.split("\n")
		.map(line => {

			if (!line.trim()) {
				return line;
			}

			if (
				/^\p{Extended_Pictographic}\s/u
				.test(line.trim())
			) {
				return line;
			}

			return (
				randomEmoji() +
				" " +
				line
			);

		})
		.join("\n");

}


/*
 * New line = new anonymous user
 */

function insertNewUserLine(textarea) {

	const start =
		textarea.selectionStart;

	const end =
		textarea.selectionEnd;

	const before =
		textarea.value.slice(
			0,
			start
		);

	const after =
		textarea.value.slice(
			end
		);

	const insertion =
		"\n" +
		randomEmoji() +
		" ";

	textarea.value =
		before +
		insertion +
		after;

	const cursor =
		before.length +
		insertion.length;

	textarea.selectionStart =
		cursor;

	textarea.selectionEnd =
		cursor;

	textarea.dispatchEvent(
		new Event(
			"input",
			{ bubbles: true }
		)
	);

}


document.addEventListener(
	"DOMContentLoaded",
	() => {

		const imgInput =
			document.getElementById("img");

		const textInput =
			document.getElementById("text");

		const counter =
			document.getElementById("counter");

		const sendBtn =
			document.getElementById("sendBtn");

		const lastPost =
			document.getElementById("lastPost");


		if (
			!imgInput ||
			!textInput ||
			!counter ||
			!sendBtn ||
			!lastPost
		) {

			console.error(
				"ADMIN INIT FAILED"
			);

			return;

		}


		/* =========================
		   INITIAL TEXT
		   ========================= */

		textInput.addEventListener(
			"input",
			() => {

				counter.textContent =
					`${textInput.value.length} characters`;

			}
		);


		/* =========================
		   ENTER
		   ========================= */

		textInput.addEventListener(
			"keydown",
			e => {

				if (
					e.key === "Enter" &&
					!e.shiftKey
				) {

					e.preventDefault();

					insertNewUserLine(
						textInput
					);

				}

			}
		);


		/* =========================
		   SEND
		   ========================= */

		sendBtn.addEventListener(
			"click",
			async () => {

				const url =
					imgInput.value.trim();

				const text =
					formatLines(
						textInput.value.trim()
					);


				if (!url) {
					return;
				}


				const payload = {
					image: url,
					text
				};


				try {

					const res =
						await fetch(
							`${API}/api/paste`,
							{
								method: "POST",

								headers: {
									"content-type":
										"application/json"
								},

								body:
									JSON.stringify(
										payload
									)
							}
						);


					if (!res.ok) {
						throw new Error(
							"POST FAILED"
						);
					}


					const json =
						await res.json();


					imgInput.value = "";
					textInput.value = "";

					counter.textContent =
						"0 characters";


					renderLast(
						json.post
					);


				} catch (e) {

					console.error(
						"SEND ERROR:",
						e
					);

				}

			}
		);


		/* =========================
		   LAST POST
		   ========================= */

		function renderLast(post) {

			lastPost.innerHTML = "";


			const card =
				document.createElement("div");

			card.className =
				"adminItem";


			const url =
				post.image || "";


			const map =
				url.match(
					/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
				);


			if (map) {

				const label =
					document.createElement("div");

				label.textContent =
					"Map post";

				card.appendChild(label);

			} else {

				const img =
					document.createElement("img");

				img.src =
					url;

				card.appendChild(img);

			}


			const text =
				document.createElement("div");

			text.textContent =
				post.text;


			card.appendChild(text);

			lastPost.appendChild(card);

		}


		/* =========================
		   INITIAL
		   ========================= */

		async function initLast() {

			try {

				const res =
					await fetch(
						`${API}/api/feed`
					);

				const json =
					await res.json();


				if (
					json.data &&
					json.data.length
				) {

					renderLast(
						json.data[0]
					);

				}

			} catch (e) {

				console.error(
					"INIT LOAD ERROR",
					e
				);

			}

		}


		initLast();

	}
);
