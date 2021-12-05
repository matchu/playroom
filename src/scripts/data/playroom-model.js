import MatrixClient from "./matrix-client";

export default class PlayroomModel {
  constructor({ roomId, appName = "Playroom" }) {
    this.appName = appName;
    this.roomId = roomId;
    this.matrix = new MatrixClient({
      homeserver: this.roomId.split(":")[1],
    });
  }

  async loginAsSavedSessionOrGuest() {
    // First, either read a saved session, or create a new guest session.
    const session = this.readSavedSession() || (await this.loginAsGuest());

    // Then, ensure that we're in the chatroom.
    await this.matrix.post(
      `/_matrix/client/v3/join/${encodeURIComponent(this.roomId)}`,
      { accessToken: session.accessToken }
    );

    return session;
  }

  readSavedSession() {
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

  async loginAsGuest() {
    // First, create an account.
    const guestSessionData = await this.matrix.post(
      "/_matrix/client/v3/register?kind=guest",
      {
        body: {
          initial_device_display_name: this.appName,
        },
      }
    );

    // Then, build it into a session object for the rest of the app.
    const homeserverBaseUrl = await this.matrix.getUrlOnHomeserver("/");
    const session = {
      accessToken: guestSessionData.access_token,
      deviceId: guestSessionData.device_id,
      userId: guestSessionData.user_id,
      homeserverBaseUrl,
    };

    // Then, give it a friendly display name.
    const funDisplayName = generateFunDisplayName();
    await this.setDisplayName({
      accessToken: session.accessToken,
      userId: session.userId,
      newDisplayName: funDisplayName,
    });

    // Save the session for next time!
    localStorage.setItem("playroom-matrix-session", JSON.stringify(session));

    return session;
  }

  async getDisplayName(session) {
    const displayNameData = await this.matrix.get(
      `/_matrix/client/v3/profile` +
        `/${encodeURIComponent(session.userId)}/displayname`,
      { accessToken: session.accessToken }
    );
    return displayNameData.displayname;
  }

  async setDisplayName({ accessToken, userId, newDisplayName }) {
    await this.matrix.put(
      `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
      {
        accessToken,
        body: { displayname: newDisplayName },
      }
    );
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
