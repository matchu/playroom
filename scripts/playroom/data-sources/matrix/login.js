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

export async function createGuestSession({ settings }) {
  // First, create an account.
  const guestSessionData = await post(
    "/_matrix/client/v3/register?kind=guest",
    { settings, body: {} }
  );

  // Then, build it into a Matrix session object to use in future requests.
  return {
    accessToken: guestSessionData.access_token,
    deviceId: guestSessionData.device_id,
    userId: guestSessionData.user_id,
  };
}
