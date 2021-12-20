import { get, put } from "./api.js";

export async function loadStreamState({ settings, session }) {
  const { roomId } = settings.matrix;
  const roomEvents = await get(
    `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state`,
    { settings, session }
  );

  const powerLevelsEvent = roomEvents.filter(
    (e) => e.type === "m.room.power_levels"
  )[0];
  // These are the default power levels for new users, and for unspecified
  // state event types, respectively. The fallback numbers are copied from the
  // Matrix spec, as the definitive fallback values if not specified.
  const defaultUserPowerLevel = powerLevelsEvent?.content?.users_default ?? 0;
  const defaultPowerLevelToManageState =
    powerLevelsEvent?.content?.state_default ?? 50;
  const powerLevelToManageWidgets =
    powerLevelsEvent?.content?.events?.["dev.playroom.broadcast"] ??
    defaultPowerLevelToManageState;
  const currentUserPowerLevel =
    powerLevelsEvent?.content?.users?.[session.userId] ?? defaultUserPowerLevel;
  const canManage = currentUserPowerLevel >= powerLevelToManageWidgets;

  // SECURITY TODO: Rooms on matrix.org start with Moderator access for "Change
  //       "Settings" by default. Should we warn to advise people to increase
  //       it to Admin? Perhaps warn more softly? Moderators are trusted, but
  //       are they *that* trusted? We could also consider automatically adding
  //       a setting for dev.playroom.broadcast specifically if not present…
  // NOTE: I suppose the text doesn't quite match the condition: if you have a
  //       custom setting for broadcast events = 0, we'll show this warning,
  //       which isn't quite true. But that seems unlikely, and this message
  //       is fine.
  const securityWarning =
    powerLevelToManageWidgets === defaultUserPowerLevel
      ? `Your Matrix room is currently configured to let *anybody* ` +
        `send room state events, including starting a broadcast!\n\nPlease ` +
        `fix this by setting the "Change settings" setting (or a custom ` +
        `"dev.playroom.broadcast" setting) to require admin access.`
      : null;

  const broadcastEvent = roomEvents.find(
    (e) =>
      e.type === "dev.playroom.broadcast" && e.state_key === "currentBroadcast"
  );
  const videoEmbedUrl = broadcastEvent?.content?.videoEmbedUrl || null;

  return { canManage, securityWarning, videoEmbedUrl };
}

export async function startStream({ videoEmbedUrl }, { settings, session }) {
  await put(
    `/_matrix/client/v3/rooms/${settings.matrix.roomId}/state` +
      `/dev.playroom.broadcast/currentBroadcast`,
    {
      settings,
      session,
      body: {
        videoEmbedUrl,
      },
    }
  );
}

export async function endStream({ settings, session }) {
  await put(
    `/_matrix/client/v3/rooms/${settings.matrix.roomId}/state` +
      `/dev.playroom.broadcast/currentBroadcast`,
    {
      settings,
      session,
      body: {},
    }
  );
}
