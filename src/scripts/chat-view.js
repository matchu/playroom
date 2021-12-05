import { Platform, SessionContainer } from "hydrogen-web";

export default class ChatView {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
  }

  mount() {
    this.container.innerText = "Logging in…";
  }

  useSession(session) {
    console.log("TODO: Use the session", session);
    this.container.innerHTML = "";
    this.hydrogenPlatform = new Platform(this.container, {});
    this.sessionContainer = new SessionContainer({
      platform: this.hydrogenPlatform,
    });
  }
}
