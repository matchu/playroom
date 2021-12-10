import DisplayNameForm from "./components/display-name-form";
import Playroom from "./model/playroom";
import HydrogenBridge from "./hydrogen-bridge";
import { createApp } from "./lib/petite-vue";

function mountPlayroomApp({ container, roomId }) {
  const playroom = new Playroom({ roomId });
  const hydrogenBridge = new HydrogenBridge(container);

  // To let components use $refs, we pass them a proxy object that references
  // this variable `app`. It won't be initialized when the component is created,
  // but it will be by the time the app starts, so it should work by then!
  // (I couldn't find a better way in the petite-vue API, ah well!)
  let app;
  const $refs = new Proxy({}, { get: (_, key) => app.$refs[key] });

  createApp({
    chat: playroom.state.chat,
    stream: playroom.state.stream,
    hydrogenLoaded: false,
    displayNameForm: DisplayNameForm({ playroom, $refs }),

    startPlayroom() {
      playroom.start();
      app = this;
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
