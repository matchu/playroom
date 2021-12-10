import { reactive } from "../lib/petite-vue";
import MatrixClient from "./matrix-client";

export default class Playroom {
  constructor({ settings }) {
    this.settings = settings;
    this._matrixClient = new MatrixClient({ settings });

    const playroom = this;
    this.state = reactive({
      chat: reactive({
        status: "loading",
        get displayName() {
          return playroom._matrixClient.state.displayName;
        },
      }),
      stream: reactive({
        status: "loading",
        videoEmbedUrl: null,
        canManage: false,
      }),
    });
  }

  async start() {
    this.state.chat.status = "logging-in";

    // First, log into a Matrix session.
    try {
      await this._matrixClient.loginAsSavedSessionOrGuest();
    } catch (error) {
      console.error("[Playroom] Error logging in", error);
      this._handleLoginError(error);
    }

    // Then, start loading stream state. We don't wait, we just get started!
    // We also set it up to automatically reload every 10 seconds.
    this.loadStreamState();
    setInterval(() => this.loadStreamState(), 10000);

    // Finally, start getting the account ready to chat. It will set state when
    // it's done! (This has its own internal error handling, to loop in the
    // case of a terms error!)
    this._ensureAccountIsReadyToChat();
  }

  async _ensureAccountIsReadyToChat() {
    try {
      await this._matrixClient.ensureAccountIsReadyToChat();
    } catch (error) {
      // If this is a must-agree-to-terms error, show it on the UI, and try
      // again in 3 seconds (to see if they've agreed yet).
      if (error.termsUrl) {
        try {
          this.state.chat.status = "must-agree-to-terms";
          this.state.chat.termsUrl = error.termsUrl;
          setTimeout(() => this._ensureAccountIsReadyToChat(), 3000);
          return;
        } catch (error2) {
          console.warn(
            `Could not show terms prompt, showing generic error instead`,
            error2
          );
        }
      }

      // Otherwise, show a generic error message.
      this.state.chat.status = "login-error";
      console.error("[Playroom] Error setting up account", error);
      return;
    }

    // If there were no errors, then we're logged in!
    this.state.chat.status = "logged-in";
  }

  async loadStreamState() {
    const { powerLevelToManageWidgets, currentUserPowerLevel, widgetUrls } =
      await this._matrixClient.getRoomState();

    const widgetPowerLevelIsSafe = powerLevelToManageWidgets > 0;
    if (!widgetPowerLevelIsSafe && !this._hasSentPowerLevelWarning) {
      alert(
        `WARNING: Your Matrix room is currently configured to let *anybody* ` +
          `add and edit widgets.\n\nPlease fix this by setting the "Modify ` +
          `widgets" setting (or "im.vector.modular.widgets" setting) to ` +
          `require moderator access.\n\nTo prevent a stream hijack, we've ` +
          `disabled your stream until this is resolved. Sorry for the ` +
          `trouble, hope this makes sense! 💖 —The Playroom Devs`
      );
      this._hasSentPowerLevelWarning = true;
    }

    const currentUserCanManageWidgets =
      currentUserPowerLevel >= powerLevelToManageWidgets;
    if (currentUserCanManageWidgets) {
      this.state.stream.canManage = true;
    }

    // We use the URL of the first active widget in the room as our stream!
    if (widgetPowerLevelIsSafe && widgetUrls.length >= 1) {
      this.state.stream.status = "live";
      this.state.stream.videoEmbedUrl = widgetUrls[0];
    } else {
      this.state.stream.status = "idle";
      this.state.stream.videoEmbedUrl = null;
    }
  }

  /**
   * Returns the raw Matrix session data.
   *
   * This is escape hatch for integrations with Matrix UI libraries, like
   * Hydrogen, who *need* the raw session to get *anything* done.
   *
   * In general, Playroom developers should prefer to handle Matrix logic
   * inside this model class instead! That way, the app sees a generic Playroom
   * API rather than anything Matrix-specific, which will enable us to refactor
   * with minimal impact to the rest of the app and any customizations the
   * Playroom owner may have made.
   */
  getMatrixSessionData() {
    return this._matrixClient.state.session;
  }

  async setDisplayName(newDisplayName) {
    await this._matrixClient.setDisplayName(newDisplayName);
  }
}
