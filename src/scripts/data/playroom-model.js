import MatrixClient from "./matrix-client";

export default class PlayroomModel {
  constructor({ roomId, appName = "Playroom" }) {
    this.appName = appName;
    this.roomId = roomId;
    this._matrix = new MatrixClient({
      homeserver: this.roomId.split(":")[1],
    });
    this._session = null;
  }

  async loginAsSavedSessionOrGuest() {
    // First, read the saved session, or create a new empty one.
    this._session = this._readSavedSession() || {};

    // If it doesn't have a Matrix session, create one.
    if (!this._session.matrix) {
      this._session.matrix = await this._createGuestMatrixSession();
    }

    // Then, save the session in storage for next time.
    localStorage.setItem(
      "playroom-matrix-session",
      JSON.stringify(this._session)
    );

    // Finally, make sure the account is all set up, then return.
    // (We set display name before joining, to avoid a "user changed their
    // name" message appearing in chat the first time they join.)
    await this._ensureDisplayName();
    await this._ensureJoinedRoom();
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
    const guestSessionData = await this._matrix.post(
      "/_matrix/client/v3/register?kind=guest",
      {
        body: {
          initial_device_display_name: this.appName,
        },
      }
    );

    // Then, build it into a Matrix session object to use in future requests.
    const homeserverBaseUrl = await this._matrix.getUrlOnHomeserver("/");
    return {
      accessToken: guestSessionData.access_token,
      deviceId: guestSessionData.device_id,
      userId: guestSessionData.user_id,
      homeserverBaseUrl,
    };
  }

  async _ensureDisplayName() {
    const { userId } = this.getMatrixSessionData();

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
    const { accessToken } = this.getMatrixSessionData();

    await this._matrix.post(
      `/_matrix/client/v3/join/${encodeURIComponent(this.roomId)}`,
      { accessToken }
    );
  }

  async getDisplayName() {
    if (!this._cachedDisplayName) {
      const { accessToken, userId } = this.getMatrixSessionData();

      const displayNameData = await this._matrix.get(
        `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
        { accessToken }
      );
      this._cachedDisplayName = displayNameData.displayname;
    }

    return this._cachedDisplayName;
  }

  async setDisplayName(newDisplayName) {
    const { accessToken, userId } = this.getMatrixSessionData();

    await this._matrix.put(
      `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
      {
        accessToken,
        body: { displayname: newDisplayName },
      }
    );

    this._cachedDisplayName = newDisplayName;
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
    return this._session.matrix;
  }
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
