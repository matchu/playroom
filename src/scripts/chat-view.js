import HydrogenBridge from "./hydrogen-bridge";

export default class ChatView {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
    this.hydrogenBridge = new HydrogenBridge(this.container);
  }

  mount() {
    this.container.innerText = "Logging in…";
  }

  async useSession(session) {
    // First, wait for Hydrogen to set itself up for this session.
    await this.hydrogenBridge.startWithExistingSession(session);

    // Then, build a Hydrogen TimelineView for this room.
    const view = await this.hydrogenBridge.createRoomView(this.roomId);

    // Finally, mount the view. We'll also wrap it in an additional .hydrogen
    // element, which Hydrogen looks for as a container sometimes.
    this.container.innerHTML = "";
    const hydrogenContainer = document.createElement("div");
    hydrogenContainer.className = "hydrogen";
    this.container.appendChild(hydrogenContainer);
    hydrogenContainer.appendChild(view.mount());
  }
}
