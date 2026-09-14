const API = "https://endless.wiki-self.workers.dev";

const list = document.getElementById("adminList");

async function load() {
  try {
    const response = await fetch(`${API}/api/feed`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    list.innerHTML = "";

    if (!json.ok || !Array.isArray(json.data)) {
      throw new Error("Invalid feed response");
    }

    json.data.forEach(post => {
      const item = document.createElement("div");
      item.className = "adminItem";

      if (post.image) {
        const image = document.createElement("img");

        image.className = "adminPreview";
        image.src = post.image;
        image.alt = "";

        item.appendChild(image);
      }

      const text = document.createElement("div");

      text.className = "adminText";
      text.textContent =
        post.text?.slice(0, 120) || "";

      item.appendChild(text);

      const actions = document.createElement("div");

      actions.className = "adminActions";

      const deleteBtn =
        document.createElement("button");

      deleteBtn.className = "deleteBtn";
      deleteBtn.type = "button";
      deleteBtn.textContent = "delete";

      deleteBtn.addEventListener(
        "click",
        async () => {

          const confirmed = confirm(
            "Delete this post?"
          );

          if (!confirmed) {
            return;
          }

          deleteBtn.disabled = true;
          deleteBtn.textContent = "deleting…";

          try {
            const response =
              await fetch(`${API}/api/delete`, {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  id: post.id
                })
              });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            const result =
              await response.json();

            if (!result.ok) {
              throw new Error(
                "Delete failed"
              );
            }

            await load();

          } catch (error) {

            console.error(
              "Delete error:",
              error
            );

            alert(
              "Не удалось удалить пост."
            );

            deleteBtn.disabled = false;
            deleteBtn.textContent = "delete";
          }
        }
      );

      actions.appendChild(deleteBtn);
      item.appendChild(actions);

      list.appendChild(item);
    });

  } catch (error) {

    console.error(
      "Moderator feed error:",
      error
    );

    list.innerHTML =
      "<div class=\"moderatorError\">Не удалось загрузить ленту.</div>";
  }
}

load();
