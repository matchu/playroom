import { get, post } from "./matrix-api.js";

export async function loginAsSavedSessionOrGuest({ settings }) {
  // First, read the saved session, or create a guest session.
  const session =
    (await readSavedSession({ settings })) ||
    (await createGuestMatrixSession({ settings }));

  // Then, save the session in storage for next time.
  localStorage.setItem("playroom-matrix-session", JSON.stringify(session));

  return session;
}

async function readSavedSession({ settings }) {
  let session;
  try {
    const sessionString = localStorage.getItem("playroom-matrix-session");
    if (!sessionString) {
      return null;
    }
    session = JSON.parse(sessionString);
  } catch (error) {
    console.warn(
      `[MatrixClient] Error reading saved session, skipping:`,
      error
    );
    return null;
  }

  // Test the saved session. If it returns a 401 Unauthorized, ignore it and
  // we'll create a new session instead.
  //
  // NOTE: This is kinda inefficient: it's a request where we don't actually
  //       care about the response data. We could also check for the 401 on
  //       the account setup requests we make immediately after? We'd need to
  //       substantially refactor the current control flow though, because
  //       we've currently wrapped account setup in consent retry logic.
  try {
    await get("/_matrix/client/v3/account/whoami", { settings, session });
  } catch (error) {
    if (error.responseStatus === 401) {
      console.warn(
        `[MatrixClient] Saved session is no longer authorized, ignoring.`,
        error
      );
      return null;
    }
    throw error;
  }

  return session;
}

async function createGuestMatrixSession({ settings }) {
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
