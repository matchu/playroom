export default class MatrixClient {
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

    let data;

    const newRejection = (message) => {
      const error = new Error(
        `API request failed: ${path}: ` +
          `${response.status} ${response.statusText} - ` +
          `${message}`
      );
      error.responseStatus = response.status;
      error.responseData = data;
      return error;
    };

    try {
      data = await response.json();
    } catch (error) {
      throw newRejection(`(Could not parse response as JSON)`);
    }

    if (!response.ok) {
      if (data.errcode && data.error) {
        throw newRejection(`${data.errcode} - ${data.error}`);
      } else {
        throw newRejection(`(Response JSON was not an error message)`);
      }
    }

    return data;
  }

  async loginAsGuest() {
    let guestSessionData;
    try {
      guestSessionData = await this._post("/_matrix/client/v3/register", {
        body: {
          initial_device_display_name: this.appName,
        },
      });
    } catch (error) {
      if (error.responseStatus === 401 && error.responseData?.flows) {
        throw new Error(`TODO: Captcha support`);
      } else {
        throw error;
      }
    }

    return {
      accessToken: guestSessionData.access_token,
      deviceId: guestSessionData.device_id,
      homeServer: guestSessionData.home_server,
      userId: guestSessionData.user_id,
    };
  }
}
