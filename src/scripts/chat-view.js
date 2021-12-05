import HydrogenBridge from "./hydrogen-bridge";

export default class ChatView {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
    this.hydrogenBridge = new HydrogenBridge(this.container);
  }

  mount() {
    this.container
      .querySelector(".chat-loading-message")
      ?.setAttribute("data-status", "logging-in");
  }

  async useSession(session) {
    // First, wait for Hydrogen to set itself up for this session.
    await this.hydrogenBridge.startWithExistingSession(session);

    // Then, build a Hydrogen TimelineView for this room.
    const view = await this.hydrogenBridge.createRoomView(this.roomId);

    // Finally, mount the view in the .hydrogen element, and hide the loading
    // UI.
    this.container.querySelector(".hydrogen").appendChild(view.mount());
    this.container
      .querySelector(".chat-loading-message")
      ?.setAttribute("data-status", "ready");
  }
}
