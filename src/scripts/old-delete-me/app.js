import ChatView from "./chat-view";
import PlayroomModel from "../data/playroom-model";

class App {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
    this.playroom = new PlayroomModel({ roomId });
    this.chatView = new ChatView({
      container,
      playroom: this.playroom,
      roomId,
    });
  }

  async start() {
    this.chatView.start();
    this.chatView.showLoggingInState();
    await this.login();
  }

  async login() {
    try {
      await this.playroom.loginAsSavedSessionOrGuest();
      await this.chatView.handleLoginSuccess();
    } catch (error) {
      // The ChatView will display the error, and potentially retry the login
      // if it becomes appropriate.
      this.chatView.handleLoginError(error, () => this.login());
    }
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
