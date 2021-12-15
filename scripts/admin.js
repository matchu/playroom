import PlayroomManager from "./playroom/manager.js";
import settings from "../settings.js";

async function onSubmitLoginForm(event) {
  event.preventDefault();
  const button = event.target.querySelector("button[type=submit]");
  const buttonOriginalText = button.innerText;
  button.innerText = "Logging in…";
  button.disabled = true;

  try {
    const formData = new FormData(event.target);
    const username = formData.get("username");
    const password = formData.get("password");
    const homeserver = formData.get("homeserver");
    const userId = `@${username}:${homeserver}`;

    // Log into Playroom, and redirect to the main app once we're logged in.
    const playroom = new PlayroomManager({ settings });
    await playroom.loginAsAdmin({ userId, password });
    window.location = "/";
  } catch (error) {
    console.error(error);
    alert(`Login failed, sorry! Please try again.\n\nError: ${error.message}`);

    button.innerText = buttonOriginalText;
    button.disabled = false;
  }
}

document
  .querySelector(".login-form form")
  .addEventListener("submit", onSubmitLoginForm);
