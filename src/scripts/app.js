import DisplayNameForm from "./components/display-name-form";
import PlayroomModel from "./data/playroom-model";
import HydrogenBridge from "./hydrogen-bridge";
import { createApp } from "./lib/petite-vue";

function mountPlayroomApp({ container, roomId }) {
  const playroom = new PlayroomModel({ roomId });
  const hydrogenBridge = new HydrogenBridge(container);

  createApp({
    roomId,
    status: "loading",
    loadingStep: "loading",
    errorType: null,
    termsUrl: "/terms-placeholder.html",
    get streamState() {
      return playroom.state.streamState;
    },
    DisplayNameForm: () => DisplayNameForm({ playroom }),

    async login() {
      this.loadingStep = "logging-in";
      try {
        await playroom.loginAsSavedSessionOrGuest();
        this._handleLoginSuccess();
      } catch (error) {
        console.error(error);
        this._handleLoginError(error);
      }
    },

    async _handleLoginSuccess() {
      // Set up Hydrogen with the new session, then load and mount the view.
      await hydrogenBridge.startWithExistingSession(
        playroom.getMatrixSessionData()
      );
      const view = await hydrogenBridge.createRoomView(roomId);
      this.$refs.hydrogenRoomView.appendChild(view.mount());

      // Also, let's start reloading the stream state every 10 seconds.
      setInterval(() => playroom.loadStreamState(), 10000);

      // Okay, we're ready now! Show the app!
      this.status = "ready";
      this.loadingStep = null;
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
  }).mount();
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
