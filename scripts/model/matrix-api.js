export default class MatrixAPI {
  constructor({ homeserver }) {
    this.homeserver = homeserver;
  }

  async _getHomeserverBaseUrl() {
    // The first time the homeserver URL is requested, we make a request to the
    // .well-known document to learn where to *actually* send requests for this
    // homeserver name.
    if (!this._homeserverBaseUrlPromise) {
      this._homeserverBaseUrlPromise = (async () => {
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

    return await this._homeserverBaseUrlPromise;
  }

  async getUrlOnHomeserver(path) {
    const baseUrl = await this._getHomeserverBaseUrl();
    return new URL(path, baseUrl);
  }

  async _request(
    path,
    { body = null, accessToken = null, method = "GET" } = {}
  ) {
    const url = await this.getUrlOnHomeserver(path);
    const headers = {};

    if (body != null) {
      headers["Content-Type"] = "application/json";
    }
    if (accessToken != null) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
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

  async get(path, options = {}) {
    return await this._request(path, { ...options, method: "GET" });
  }

  async post(path, options = {}) {
    return await this._request(path, { ...options, method: "POST" });
  }

  async put(path, options = {}) {
    return await this._request(path, { ...options, method: "PUT" });
  }
}
