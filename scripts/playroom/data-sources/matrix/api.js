async function request(
  path,
  { settings, session, body = null, method = "GET" } = {}
) {
  const homeserverBaseUrl = getHomeserverBaseUrl({ settings, session });
  const url = new URL(path, homeserverBaseUrl);
  const headers = {};

  if (body != null) {
    headers["Content-Type"] = "application/json";
  }
  if (session != null) {
    headers.Authorization = `Bearer ${session.accessToken}`;
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

export async function get(path, options = {}) {
  return await request(path, { ...options, method: "GET" });
}

export async function post(path, options = {}) {
  return await request(path, { ...options, method: "POST" });
}

export async function put(path, options = {}) {
  return await request(path, { ...options, method: "PUT" });
}

function getHomeserverBaseUrl({ settings, session }) {
  const url = new URL("https://placeholder-host");
  url.host = session
    ? session.userId.split(":")[1]
    : settings.matrix.roomId.split(":")[1];
  return url;
}
