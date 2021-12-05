import ChatView from "./chat-view";
import MatrixClient from "./matrix-client";

class App {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
    this.chatView = new ChatView({ container, roomId });
    // TODO: Infer homeserver from roomId!
    this.client = new MatrixClient({ homeserver: "matrix.org", roomId });
  }

  async start() {
    this.chatView.mount();
    await this.login();
  }

  async login() {
    try {
      const session = await this.client.loginAsSavedSessionOrGuest();
      await this.chatView.useSession(session);
    } catch (error) {
      this.handleLoginError(error);
      return;
    }

    this.container.setAttribute("status", "ready");
    this.container.removeAttribute("loading-step");
  }

  handleLoginError(error) {
    console.error(error);

    if (error.consentUrl) {
      try {
        this.handleConsentError(error);
        return;
      } catch (error2) {
        console.warn(
          `Could not show consent prompt, showing generic error instead`,
          error2
        );
      }
    }

    this.container.setAttribute("status", "error");
    this.container.setAttribute("error-type", "login-error");
  }

  handleConsentError(error) {
    const links = this.container.querySelectorAll(
      "a[href$='terms-placeholder.html']"
    );
    if (links.length === 0) {
      throw new Error(`could not find terms-placeholder.html link to replace`);
    }
    for (const link of links) {
      link.href = error.consentUrl;
    }
    this.container.setAttribute("status", "error");
    this.container.setAttribute("error-type", "must-agree-to-terms");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector("chat-panel");
  if (container == null) {
    alert("Error: Can't find the chat-panel element to mount the app into.");
    return;
  }

  const roomId = document.querySelector(
    "meta[name='playroom:room-id']"
  )?.content;
  if (roomId == null) {
    alert(
      `Error: Can't find the room ID. It should be configured in the <head> ` +
        `of the document as <meta name="playroom:room-id" ` +
        `content="ROOM_ID_HERE" />.`
    );
    return;
  }

  const app = new App({ container, roomId });

  console.debug("App", app);

  await app.start();
});
