export default class ChatClient {
  constructor({ homeserver, appName = "Playroom" }) {
    this.appName = appName;
    this.homeserverUrl = new URL("about:blank");
    this.homeserverUrl.protocol = "https";
    this.homeserverUrl.host = homeserver;
  }

  async _post(path, { body = {} } = {}) {
    const url = new URL(path, this.homeserverUrl);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await response.json();
  }

  async loginAsGuest() {
    const guestSession = await this._post(
      "/_matrix/client/v3/register?kind=guest",
      {
        body: {
          initial_device_display_name: this.appName,
        },
      }
    );
    return guestSession;
  }
}
