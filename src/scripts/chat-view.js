import HydrogenBridge from "./hydrogen-bridge";

export default class ChatView {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
    this.hydrogenBridge = new HydrogenBridge(this.container);
  }

  showLoggingInState() {
    this.container.setAttribute("loading-step", "logging-in");
  }

  async useSession(session) {
    // First, wait for Hydrogen to set itself up for this session.
    await this.hydrogenBridge.startWithExistingSession(session);

    // Then, build a Hydrogen TimelineView for this room.
    const view = await this.hydrogenBridge.createRoomView(this.roomId);

    // Finally, mount the view in the .hydrogen element, and hide the loading
    // UI.
    const chatMainElement = this.container.querySelector("chat-main .hydrogen");
    chatMainElement.appendChild(view.mount());
    this.container.setAttribute("status", "ready");
    this.container.removeAttribute("loading-step");
  }

  handleLoginError(error, retry) {
    console.error(error);

    if (error.consentUrl) {
      try {
        this.handleConsentError(error, retry);
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

  handleConsentError(error, retry) {
    const links = this.container.querySelectorAll(
      "a[href$='terms-placeholder.html'], a[data-terms-url-was-replaced]"
    );
    if (links.length === 0) {
      throw new Error(`could not find terms-placeholder.html link to replace`);
    }
    for (const link of links) {
      link.href = error.consentUrl;
      link.setAttribute("data-terms-url-was-replaced", "true");
    }
    this.container.setAttribute("status", "error");
    this.container.setAttribute("error-type", "must-agree-to-terms");

    // Try again in 3 seconds. If the user hasn't agreed to the terms yet, we
    // should end up back here in a loop until they do.
    setTimeout(() => retry(), 3000);
  }
}
