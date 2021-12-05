export default class MatrixClient {
  constructor({ homeserver, roomId, appName = "Playroom" }) {
    this.appName = appName;
    this.roomId = roomId;
    this.homeserver = homeserver;
    this.homeserverUrl = new URL("about:blank");
    this.homeserverUrl.protocol = "https";
    this.homeserverUrl.host = homeserver;
  }

  async _getHomeserverBaseUrl() {
    // The first time the homeserver URL is requested, we make a request to the
    // .well-known document to learn where to *actually* send requests for this
    // homeserver name.
    if (!this.homeserverBaseUrlPromise) {
      this.homeserverBaseUrlPromise = (async () => {
        const tentativeBaseUrl = new URL("about:blank");
        tentativeBaseUrl.protocol = "https";
        tentativeBaseUrl.host = this.homeserver;

        const wellKnownUrl = new URL(
          "/.well-known/matrix/client",
          tentativeBaseUrl
        );
        const response = await fetch(wellKnownUrl);
        // If there's no well-known document to redirect us, just use the common
        // assumption that the homeserver is the hostname!
        if (response.status === 404) {
          return tentativeBaseUrl;
        } else if (!response.ok) {
          throw new Error(
            `could not read .well-known document at ${wellKnownUrl}: ` +
              `${response.status} ${response.statusText}`
          );
        }

        let data;
        try {
          data = await response.json();
        } catch (error) {
          throw new Error(
            `could not read .well-known document at ${wellKnownUrl}: ` +
              `could not parse as JSON: ${error.message}`
          );
        }

        let actualBaseUrl;
        try {
          actualBaseUrl = new URL(data?.["m.homeserver"]?.["base_url"]);
        } catch (error) {
          throw new Error(
            `could not read .well-known document at ${wellKnownUrl}: ` +
              `base URL is invalid: ` +
              `${JSON.stringify(data?.["m.homeserver"]?.["base_url"])}`
          );
        }

        // NOTE: I'm skipping the step in the spec to validate by connecting
        //       to /_matrix/client/versions. This is a stable setup, rather
        //       than a homeserver someone typed in, so it should generally be
        //       fine!

        return actualBaseUrl;
      })();
    }

    return await this.homeserverBaseUrlPromise;
  }

  async _getUrlOnHomeserver(path) {
    const baseUrl = await this._getHomeserverBaseUrl();
    return new URL(path, baseUrl);
  }

  async _post(path, { body = {}, accessToken = null } = {}) {
    const url = await this._getUrlOnHomeserver(path);
    const headers = { "Content-Type": "application/json" };

    if (accessToken != null) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
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
        // Check if this is a Terms & Conditions consent error. If so, handle
        // it specially, so the app can help the user resolve it.
        if (response.status === 403 && data.errcode === "M_CONSENT_NOT_GIVEN") {
          const consentMatch = data.error.match(
            /you must review and agree to our terms and conditions at (https:\/\/\S+)\.$/
          );
          if (consentMatch) {
            // This is specific to the Synapse consent implementation.
            // matrix.org uses this, so I expect it to be helpful for a lot of
            // folks deploying from scratch!
            const error = new Error(
              `User must agree to the terms & conditions first`
            );
            error.consentUrl = consentMatch[1];
            throw error;
          } else {
            console.warn(
              `Received M_CONSENT_NOT_GIVEN error, but it didn't match the error message format. Re-throwing.`,
              data
            );
          }
        }

        throw newRejection(`${data.errcode} - ${data.error}`);
      } else {
        throw newRejection(`(Response JSON was not an error message)`);
      }
    }

    return data;
  }

  async loginAsSavedSessionOrGuest() {
    // First, either read a saved session, or create a new guest session.
    const session = this.readSavedSession() || (await this.loginAsGuest());

    // Then, ensure that we're in the chatroom.
    await this._post(
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
    const guestSessionData = await this._post(
      "/_matrix/client/v3/register?kind=guest",
      {
        body: {
          initial_device_display_name: this.appName,
        },
      }
    );

    const homeserverBaseUrl = await this._getHomeserverBaseUrl();

    const session = {
      accessToken: guestSessionData.access_token,
      deviceId: guestSessionData.device_id,
      userId: guestSessionData.user_id,
      homeserverBaseUrl: homeserverBaseUrl.toString().slice(0, -1),
    };

    // Save the session for next time!
    localStorage.setItem("playroom-matrix-session", JSON.stringify(session));

    return session;
  }
}
