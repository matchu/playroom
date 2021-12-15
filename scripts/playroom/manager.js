import { reactive } from "../lib/petite-vue.js";
import {
  readSavedSession,
  writeSavedSession,
} from "./data-sources/local-device.js";
import {
  ensureChatIsSetUpForCurrentUser,
  setDisplayName,
} from "./data-sources/matrix/chat.js";
import {
  createGuestSession,
  validateSession,
} from "./data-sources/matrix/login.js";
import { loadStreamState } from "./data-sources/matrix/stream.js";

export default class PlayroomManager {
  constructor({ settings }) {
    this.settings = settings;

    this.state = reactive({
      session: null,
      chat: reactive({
        status: "loading",
        displayName: null,
      }),
      stream: reactive({
        status: "loading",
        videoEmbedUrl: null,
        canManage: false,
      }),
    });
  }

  async start() {
    // First, log in, with a new guest session if needed.
    await this._loginAsSavedSessionOrGuest();

    // Then, start loading stream state. We don't wait, we just get started!
    // We also set it up to automatically reload every 10 seconds.
    //
    // NOTE: This happens after login, because the Matrix requires a session to
    //       load room data, even though it's public.
    this._loadStreamState();
    setInterval(() => this._loadStreamState(), 10000);

    // Finally, start getting the account ready to chat. It will set state when
    // it's done! (This has its own internal error handling, to loop in the
    // case of a terms error!)
    this._ensureAccountIsReadyToChat();
  }

  async _loginAsSavedSessionOrGuest() {
    const { settings } = this;

    try {
      this.state.chat.status = "logging-in";

      // First, try using the saved session, if any.
      let session = await readSavedSession();
      const savedSessionIsValid =
        session != null && (await validateSession({ settings, session }));
      if (session != null && !savedSessionIsValid) {
        console.warn(
          `Saved Playroom session was invalid, creating new session instead`,
          session
        );
      }

      // If there's no saved session, or it's invalid, create a new guest
      // session and save it.
      if (!savedSessionIsValid) {
        session = await createGuestSession({ settings });
        await writeSavedSession(session);
      }

      this.state.session = session;
    } catch (error) {
      console.error("[Playroom] Error logging in", error);
      this.state.chat.status = "login-error";
      return;
    }
  }

  async _ensureAccountIsReadyToChat() {
    const { settings } = this;
    const { session } = this.state;

    try {
      const { displayName } = await ensureChatIsSetUpForCurrentUser({
        settings,
        session,
      });
      this.state.chat.displayName = displayName;
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
      console.error("[Playroom] Error setting up account", error);
      this.state.chat.status = "login-error";
      return;
    }

    // If there were no errors, then we're logged in!
    this.state.chat.status = "logged-in";
  }

  async _loadStreamState() {
    const { settings } = this;
    const { session } = this.state;

    const { canManage, securityWarning, videoEmbedUrl } = await loadStreamState(
      { settings, session }
    );

    if (securityWarning != null && !this._hasSentPowerLevelWarning) {
      alert(
        `WARNING: ${securityWarning}\n\nTo prevent a stream hijack, we've ` +
          `disabled your stream until this is resolved. Sorry for the ` +
          `trouble, hope this makes sense! 💖 —The Playroom Devs`
      );
      this._hasSentPowerLevelWarning = true;
    }

    this.state.stream.canManage = canManage;

    if (videoEmbedUrl != null && securityWarning == null) {
      this.state.stream.status = "live";
      this.state.stream.videoEmbedUrl = videoEmbedUrl;
    } else {
      this.state.stream.status = "idle";
      this.state.stream.videoEmbedUrl = null;
    }
  }

  async setDisplayName(newDisplayName) {
    const { settings } = this;
    const { session } = this.state;

    await setDisplayName(newDisplayName, { settings, session });
    this.state.chat.displayName = newDisplayName;
  }
}
