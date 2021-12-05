import {
  LoadStatus,
  Platform,
  RoomViewModel,
  SessionContainer,
  TimelineView,
} from "hydrogen-web";

export default class ChatView {
  constructor({ container, roomId }) {
    this.container = container;
    this.roomId = roomId;
  }

  mount() {
    this.container.innerText = "Logging in…";
  }

  async useSession(session) {
    this.container.innerHTML = "";

    // First, initialize the Hydrogen "platform", the layer that helps it do
    // Web stuff.
    this.hydrogenPlatform = new Platform(this.container, {});

    // Then, clear out all existing Hydrogen sessions, just for clarity and
    // space efficiency.
    const sessions = await this.hydrogenPlatform.sessionInfoStorage.getAll();
    for (const session of sessions) {
      await this.hydrogenPlatform.sessionInfoStorage.delete(session.id);
    }

    // Then, drop the new session into the Hydrogen platform's session storage.
    // (Session ID code copied from Hydrogen's SessionContainer source!)
    const sessionId = Math.floor(
      Math.random() * Number.MAX_SAFE_INTEGER
    ).toString();
    await this.hydrogenPlatform.sessionInfoStorage.add({
      id: sessionId,
      deviceId: session.deviceId,
      userId: session.userId,
      homeServer: session.homeserverBaseUrl,
      homeserver: session.homeserverBaseUrl,
      accessToken: session.accessToken,
      lastUsed: new Date(),
    });

    // Then, create a new Hydrogen "session container" that will try to load
    // the session by ID. The `loadStatus` code is from the SDK.md docs:
    // https://github.com/vector-im/hydrogen-web/blob/82aac93f362b3fba95ffbff9749e9b0375d4bcf0/doc/SDK.md
    this.sessionContainer = new SessionContainer({
      platform: this.hydrogenPlatform,
    });
    this.sessionContainer.startWithExistingSession(sessionId);
    await this.sessionContainer.loadStatus.waitFor(
      (status) =>
        status === LoadStatus.Ready ||
        status === LoadStatus.Error ||
        status === LoadStatus.LoginFailed
    ).promise;

    // Check how the login went! If it went poorly, throw an eror.
    if (this.sessionContainer.loginFailure) {
      throw new Error(
        `[ChatView] Hydrogen login failed: ` +
          `${this.sessionContainer.loginFailure}`
      );
    } else if (this.sessionContainer.loadError) {
      throw new Error(
        `[ChatView] Hydrogen login error: ` +
          `${this.sessionContainer.loadError.message}`
      );
    }

    const hydrogenSession = this.sessionContainer.session;
    const room = hydrogenSession.rooms.get(this.roomId);
    if (!room) {
      throw new Error(
        `[ChatView] Hydrogen could not find room with ID ${this.roomId}`
      );
    }
    const roomViewModel = new RoomViewModel({
      room,
      ownUserId: hydrogenSession.userId,
      platform: this.hydrogenPlatform,
      // Omitting urlCreator and navigation, I don't want those!
    });
    await roomViewModel.load();
    const view = new TimelineView(roomViewModel.timelineViewModel);
    this.container.appendChild(view.mount());
  }
}
