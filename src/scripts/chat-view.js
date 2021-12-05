import { buildHydrogenTimelineView } from "./hydrogen-bridge";

export default class ChatView {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
  }

  mount() {
    this.container.innerText = "Logging in…";
  }

  async useSession(session) {
    const view = await buildHydrogenTimelineView(
      this.roomId,
      session,
      this.container
    );

    // Finally, mount the view. We'll also wrap it in an additional .hydrogen
    // element, which Hydrogen looks for as a container sometimes.
    this.container.innerHTML = "";
    const hydrogenContainer = document.createElement("div");
    hydrogenContainer.className = "hydrogen";
    this.container.appendChild(hydrogenContainer);
    hydrogenContainer.appendChild(view.mount());
  }
}
