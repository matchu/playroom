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
    monkeyPatchSessionContainer(this.sessionContainer);
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

    // Then, build a Hydrogen view for this room.
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
      urlCreator: { urlUntilSegment: () => "<not implemented>" },
    });
    await roomViewModel.load();
    const view = new TimelineView(roomViewModel.timelineViewModel);

    // Finally, mount the view. We'll also wrap it in an additional .hydrogen
    // element, which Hydrogen looks for as a container sometimes.
    const hydrogenContainer = document.createElement("div");
    hydrogenContainer.className = "hydrogen";
    this.container.appendChild(hydrogenContainer);
    hydrogenContainer.appendChild(view.mount());
  }
}

// Monkey-patch syncing for compatibility with guest accounts.
//
// Hydrogen, at time of writing, creates a filter to apply `lazy_load_members`
// to syncs. But guest accounts can't do that! So instead, we block the filter
// request, and apply the same filter inline on sync requests.
function monkeyPatchSessionContainer(sessionContainer) {
  // `_waitForFirstSync` is a convenient moment just after the `_sync` object
  // was created, but before the sync actually starts. That's when we patch!
  const originalWaitForFirstSync =
    sessionContainer._waitForFirstSync.bind(sessionContainer);
  sessionContainer._waitForFirstSync = async (...args) => {
    try {
      // Replace the `createFilter` API call with a function that returns the
      // same settings back, as a stringified "filter ID". This takes advantage
      // of the fact that /sync will accept either a filter ID or a JSON string,
      // so if we pretend this JSON string is a filter ID, the sync procedure
      // uses it the same way, which happens to still be correct!
      sessionContainer._sync._hsApi.createFilter = (_, filterSettings) => ({
        response: async () => ({
          filter_id: JSON.stringify(filterSettings),
        }),
      });
    } catch (error) {
      console.warn(`Error monkey-patching session syncing, ignoring`, error);
    }
    return await originalWaitForFirstSync(...args);
  };
}
