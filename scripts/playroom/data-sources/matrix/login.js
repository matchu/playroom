import { get, post } from "./api.js";

export async function validateSession({ settings, session }) {
  try {
    await get("/_matrix/client/v3/account/whoami", { settings, session });
  } catch (error) {
    if (error.responseStatus === 401) {
      return false;
    }
    throw error;
  }
  return true;
}

export async function loginWithPassword({ userId, password, settings }) {
  const loginSessionData = await post(`/_matrix/client/v3/login`, {
    settings,
    body: {
      type: "m.login.password",
      identifier: {
        type: "m.id.user",
        user: userId,
      },
      password,
    },
  });

  return {
    accessToken: loginSessionData.access_token,
    deviceId: loginSessionData.device_id,
    userId: loginSessionData.user_id,
  };
}

export async function createGuestSession({ settings }) {
  const guestSessionData = await post(
    "/_matrix/client/v3/register?kind=guest",
    { settings, body: {} }
  );

  return {
    accessToken: guestSessionData.access_token,
    deviceId: guestSessionData.device_id,
    userId: guestSessionData.user_id,
  };
}
