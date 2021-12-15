import { get, post, put } from "./api.js";

export async function ensureChatIsSetUpForCurrentUser({ settings, session }) {
  // (We set display name before joining, to avoid a "user changed their
  // name" message appearing in chat the first time they join.)
  let displayName;
  try {
    displayName = await ensureDisplayName({ settings, session });
    await ensureJoinedRoom({ settings, session });
  } catch (error) {
    throw wrapAccountSetupError(error);
  }
  return { displayName };
}

async function ensureDisplayName({ settings, session }) {
  const { userId } = session;

  // If the display name is just the default guest username (which we
  // double-check is just digits, to decrease the odds of a bug where we
  // overwrite real display names), replace it with a fun guest name!
  const username = userId.split(":")[0].substr(1);
  const displayName = await getDisplayName({ settings, session });
  if (displayName === username && username.match(/^[0-9]+$/)) {
    const newDisplayName = generateFunDisplayName();
    await setDisplayName(newDisplayName, { settings, session });
    return newDisplayName;
  } else {
    return displayName;
  }
}

async function ensureJoinedRoom({ settings, session }) {
  const { roomId } = settings.matrix;

  await post(`/_matrix/client/v3/join/${encodeURIComponent(roomId)}`, {
    settings,
    session,
  });
}

async function getDisplayName({ settings, session }) {
  const { userId } = session;

  const displayNameData = await get(
    `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
    { settings, session }
  );

  return displayNameData.displayname;
}

export async function setDisplayName(newDisplayName, { settings, session }) {
  const { userId } = session;

  await put(
    `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
    {
      settings,
      session,
      body: { displayname: newDisplayName },
    }
  );
}

function wrapAccountSetupError(error) {
  // Check if this is a Terms & Conditions consent error. If so, handle
  // it specially, so the app can help the user resolve it. (This is specific
  // to the Synapse consent implementation. matrix.org uses this, so I expect
  // it to be helpful for a lot of folks deploying from scratch!)
  if (
    error.responseStatus === 403 &&
    error.responseData?.errcode === "M_CONSENT_NOT_GIVEN"
  ) {
    const consentMatch = error.responseData?.error?.match(
      /you must review and agree to our terms and conditions at (https:\/\/\S+)\.$/
    );
    if (consentMatch) {
      //
      const termsError = new Error(
        `[Playroom] User must agree to the terms & conditions first`
      );
      termsError.termsUrl = consentMatch[1];
      return termsError;
    } else {
      console.warn(
        `[Playroom] Received M_CONSENT_NOT_GIVEN error, but it didn't match the error message format. Leaving as-is.`,
        error
      );
    }
  }

  return error;
}

// TODO: These should probably be configurable lol
const FUN_DISPLAY_NAME_NOUNS = [
  "Snail",
  "Duck",
  "Cherry",
  "Raymond",
  "Mote",
  "Sparkles",
  "Daisy",
  "Dark Knight",
  "Thinker",
  "Alicorn",
  "Blossom",
  "Chestnut",
  "Flopsy",
  "Dynamo",
  "Lake",
];

function generateFunDisplayName() {
  const noun =
    FUN_DISPLAY_NAME_NOUNS[
      Math.floor(Math.random() * FUN_DISPLAY_NAME_NOUNS.length)
    ];
  const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  return `${noun} ${letter} (guest)`;
}
