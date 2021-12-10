import { reactive } from "../lib/petite-vue.js";
import MatrixAPI from "./matrix-api.js";

export default class MatrixClient {
  constructor({ settings }) {
    this.settings = settings;
    this._api = new MatrixAPI({
      homeserver: this.settings.matrix.roomId.split(":")[1],
    });
    this.state = reactive({
      session: null,
      displayName: null,
    });
  }

  async loginAsSavedSessionOrGuest() {
    // First, read the saved session, or create a guest session.
    this.state.session =
      this._readSavedSession() || (await this._createGuestMatrixSession());

    // Then, save the session in storage for next time.
    localStorage.setItem(
      "playroom-matrix-session",
      JSON.stringify(this.state.session)
    );
  }

  async ensureAccountIsReadyToChat() {
    // (We set display name before joining, to avoid a "user changed their
    // name" message appearing in chat the first time they join.)
    try {
      await this._ensureDisplayName();
      await this._ensureJoinedRoom();
    } catch (error) {
      throw this._wrapAccountSetupError(error);
    }
  }

  _readSavedSession() {
    try {
      const sessionString = localStorage.getItem("playroom-matrix-session");
      if (sessionString) {
        return JSON.parse(sessionString);
      } else {
        return null;
      }
    } catch (error) {
      console.warn(
        `[MatrixClient] Error reading saved session, skipping:`,
        error
      );
      return null;
    }
  }

  async _createGuestMatrixSession() {
    // First, create an account.
    const guestSessionData = await this._api.post(
      "/_matrix/client/v3/register?kind=guest",
      { body: {} }
    );

    // Then, build it into a Matrix session object to use in future requests.
    const homeserverBaseUrl = await this._api.getUrlOnHomeserver("/");
    return {
      accessToken: guestSessionData.access_token,
      deviceId: guestSessionData.device_id,
      userId: guestSessionData.user_id,
      homeserverBaseUrl,
    };
  }

  async _ensureDisplayName() {
    const { userId } = this.state.session;

    // If the display name is just the default guest username (which we
    // double-check is just digits, to decrease the odds of a bug where we
    // overwrite real display names), replace it with a fun guest name!
    const username = userId.split(":")[0].substr(1);
    if (username.match(/^[0-9]+$/)) {
      const displayName = await this.getDisplayName();
      if (displayName === username) {
        const newDisplayName = generateFunDisplayName();
        await this.setDisplayName(newDisplayName);
      }
    }
  }

  async _ensureJoinedRoom() {
    const { roomId } = this.settings.matrix;
    const { accessToken } = this.state.session;
    await this._api.post(
      `/_matrix/client/v3/join/${encodeURIComponent(roomId)}`,
      { accessToken }
    );
  }

  _wrapAccountSetupError(error) {
    // Check if this is a Terms & Conditions consent error. If so, handle
    // it specially, so the app can help the user resolve it. (This is specific
    // to the Synapse consent implementation. matrix.org uses this, so I expect
    // it to be helpful for a lot of folks deploying from scratch!)
    if (
      error.responseStatus === 403 &&
      error.responseData?.errcode === "M_CONSENT_NOT_GIVEN"
    ) {
      const consentMatch = error.responseData?.error?.match(
        /you must review and agree to our terms and conditions at (https:\/\/\S+)\.$/
      );
      if (consentMatch) {
        //
        const termsError = new Error(
          `[Playroom] User must agree to the terms & conditions first`
        );
        termsError.termsUrl = consentMatch[1];
        return termsError;
      } else {
        console.warn(
          `[Playroom] Received M_CONSENT_NOT_GIVEN error, but it didn't match the error message format. Leaving as-is.`,
          error
        );
      }
    }

    return error;
  }

  async getDisplayName() {
    if (!this.state.displayName) {
      const { accessToken, userId } = this.state.session;

      const displayNameData = await this._api.get(
        `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
        { accessToken }
      );
      this.state.displayName = displayNameData.displayname;
    }

    return this.state.displayName;
  }

  async setDisplayName(newDisplayName) {
    const { accessToken, userId } = this.state.session;

    await this._api.put(
      `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
      {
        accessToken,
        body: { displayname: newDisplayName },
      }
    );

    this.state.displayName = newDisplayName;
  }

  async getRoomState() {
    const { roomId } = this.settings.matrix;
    const { accessToken, userId } = this.state.session;
    const roomEvents = await this._api.get(
      `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state`,
      { accessToken }
    );

    const powerLevelsEvent = roomEvents.filter(
      (e) => e.type === "m.room.power_levels"
    )[0];
    const powerLevelToManageWidgets =
      powerLevelsEvent?.content?.events?.["im.vector.modular.widgets"] || 0;
    const currentUserPowerLevel =
      powerLevelsEvent?.content?.users?.[userId] || 0;

    // NOTE: I'm basing my widget stuff on the widgets API RFC that seems to be
    // what Element and Synapse are using-ish. The main difference seems to be
    // that the widget type is still proprietary instead of `m.widget`. I'm not
    // gonna add `m.widget` support until it gets into the actual spec!
    //
    // https://docs.google.com/document/d/1uPF7XWY_dXTKVKV7jZQ2KmsI19wn9-kFRgQ1tFQP7wQ/edit#heading=h.ll7aaslz33ov
    const widgetEvents = roomEvents.filter(
      (event) => event.type === "im.vector.modular.widgets"
    );
    const widgetUrls = widgetEvents
      .map((event) => event.content?.url)
      // Widgets that were removed will still have events, but no content.
      // Ignore them.
      .filter((url) => url != null && isValidUrl(url));

    return { powerLevelToManageWidgets, currentUserPowerLevel, widgetUrls };
  }
}

function isValidUrl(maybeUrl) {
  try {
    new URL(maybeUrl);
  } catch (error) {
    return false;
  }
  return true;
}

// TODO: These should probably be configurable lol
const FUN_DISPLAY_NAME_NOUNS = [
  "Snail",
  "Duck",
  "Cherry",
  "Raymond",
  "Mote",
  "Sparkles",
  "Daisy",
  "Dark Knight",
  "Thinker",
  "Alicorn",
  "Blossom",
  "Chestnut",
  "Flopsy",
  "Dynamo",
  "Lake",
];

function generateFunDisplayName() {
  const noun =
    FUN_DISPLAY_NAME_NOUNS[
      Math.floor(Math.random() * FUN_DISPLAY_NAME_NOUNS.length)
    ];
  const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  return `${noun} ${letter} (guest)`;
}
