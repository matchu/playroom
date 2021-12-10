import DisplayNameForm from "./components/display-name-form";
import Playroom from "./model/playroom";
import HydrogenBridge from "./hydrogen-bridge";
import { createApp } from "./lib/petite-vue";

function mountPlayroomApp({ container, roomId }) {
  const playroom = new Playroom({ roomId });
  const hydrogenBridge = new HydrogenBridge(container);

  createApp({
    chat: playroom.state.chat,
    stream: playroom.state.stream,
    hydrogenLoaded: false,
    displayNameForm: DisplayNameForm({ playroom }),

    startPlayroom() {
      playroom.start();
    },

    async loadHydrogen() {
      // Set up Hydrogen with the new session, then load and mount the view.
      await hydrogenBridge.startWithExistingSession(
        playroom.getMatrixSessionData()
      );
      const view = await hydrogenBridge.createRoomView(roomId);
      this.$refs.hydrogen.appendChild(view.mount());
      this.hydrogenLoaded = true;
    },
  }).mount();
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".chat-panel");
  if (container == null) {
    alert("Error: Can't find the chat-panel element to mount the app into.");
    return;
  }

  const roomIdMetaTag = document.querySelector("meta[name='playroom:room-id']");
  const roomId = roomIdMetaTag?.content;
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
