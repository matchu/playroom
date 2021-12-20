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
  const powerLevelToManageWidgets =
    powerLevelsEvent?.content?.events?.["im.vector.modular.widgets"] || 0;
  const currentUserPowerLevel =
    powerLevelsEvent?.content?.users?.[session.userId] || 0;
  const canManage = currentUserPowerLevel >= powerLevelToManageWidgets;

  const securityWarning =
    powerLevelToManageWidgets === 0
      ? `Your Matrix room is currently configured to let *anybody* ` +
        `add and edit widgets.\n\nPlease fix this by setting the "Modify ` +
        `widgets" setting (or "im.vector.modular.widgets" setting) to ` +
        `require moderator access.`
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
