import { effect, reactive } from "../lib/petite-vue";
import {
  LoadStatus,
  Platform,
  RoomViewModel,
  SessionContainer,
  RoomView,
} from "hydrogen-web";

export default function Hydrogen({ playroom }) {
  const hydrogen = reactive({
    status: "loading",
  });

  // Wait for chat to become ready, then load and mount Hydrogen.
  effect(() => {
    if (playroom.state.chat.status === "logged-in") {
      setTimeout(async () => {
        const hydrogenContainer = document.querySelector(
          ".playroom-root .hydrogen"
        );

        // Set up Hydrogen with the new session…
        const hydrogenBridge = new HydrogenBridge(hydrogenContainer);
        await hydrogenBridge.startWithExistingSession(
          playroom.getMatrixSessionData()
        );

        // …then load and mount the view.
        const view = await hydrogenBridge.createRoomView(playroom.roomId);
        hydrogenContainer.appendChild(view.mount());
        hydrogen.status = "ready";
      }, 0);
    }
  });

  return hydrogen;
}

class HydrogenBridge {
  constructor(container) {
    // First, initialize the Hydrogen "platform", the layer that helps it do
    // Web stuff.
    this.platform = new Platform(container, {});
    this.sessionContainer = new SessionContainer({
      platform: this.platform,
    });
    monkeyPatchSessionContainer(this.sessionContainer);
  }

  async startWithExistingSession(session) {
    // First, clear out all existing Hydrogen sessions, just for clarity and
    // space efficiency.
    const sessions = await this.platform.sessionInfoStorage.getAll();
    for (const session of sessions) {
      await this.platform.sessionInfoStorage.delete(session.id);
    }

    // Then, drop the new session into the Hydrogen platform's session storage.
    // (Session ID code copied from Hydrogen's SessionContainer source!)
    const sessionId = Math.floor(
      Math.random() * Number.MAX_SAFE_INTEGER
    ).toString();
    const homeserverBaseUrlString = session.homeserverBaseUrl
      .toString()
      .slice(0, -1);
    await this.platform.sessionInfoStorage.add({
      id: sessionId,
      deviceId: session.deviceId,
      userId: session.userId,
      homeServer: homeserverBaseUrlString,
      homeserver: homeserverBaseUrlString,
      accessToken: session.accessToken,
      lastUsed: new Date(),
    });

    // Then, create a new Hydrogen "session container" that will try to load
    // the session by ID. The `loadStatus` code is from the SDK.md docs:
    // https://github.com/vector-im/hydrogen-web/blob/82aac93f362b3fba95ffbff9749e9b0375d4bcf0/doc/SDK.md
    this.sessionContainer.startWithExistingSession(sessionId);
    await this.sessionContainer.loadStatus.waitFor(
      (status) =>
        status === LoadStatus.Ready ||
        status === LoadStatus.Error ||
        status === LoadStatus.LoginFailed
    ).promise;

    // Check how the login went! If it went poorly, throw an error. Otherwise,
    // return successfully!
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
  }

  async createRoomView(roomId) {
    const hydrogenSession = this.sessionContainer.session;
    const room = hydrogenSession.rooms.get(roomId);
    if (!room) {
      throw new Error(
        `[ChatView] Hydrogen could not find room with ID ${roomId}`
      );
    }

    const roomViewModel = new RoomViewModel({
      room,
      ownUserId: hydrogenSession.userId,
      platform: this.platform,
      urlCreator: { urlUntilSegment: () => "<not implemented>" },
    });
    await roomViewModel.load();

    return new RoomView(roomViewModel);
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