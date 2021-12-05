import PlayroomModel from "./data/playroom-model";
import { createApp } from "./lib/petite-vue";

function mountPlayroomApp({ container, roomId }) {
  createApp({
    roomId,
    playroom: new PlayroomModel({ roomId }),
    status: "loading",
    loadingStep: "loading",
    errorType: null,
    termsUrl: "/terms-placeholder.html",

    async login() {
      this.loadingStep = "logging-in";
      try {
        await this.playroom.loginAsSavedSessionOrGuest();
        this.status = "ready";
        this.loadingStep = null;
      } catch (error) {
        console.error(error);
        this._handleLoginError(error);
      }
    },

    _handleLoginError(error) {
      if (error.termsUrl) {
        try {
          this.status = "error";
          this.errorType = "must-agree-to-terms";
          this.termsUrl = error.termsUrl;
          setTimeout(() => this.login(), 3000);
          return;
        } catch (error2) {
          console.warn(
            `Could not show terms prompt, showing generic error instead`,
            error2
          );
        }
      }

      this.status = "error";
      this.errorType = "login-error";
    },
  }).mount(container);
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

  mountPlayroomApp({ container, roomId });
});
