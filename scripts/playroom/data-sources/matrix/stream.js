import { get } from "./api.js";

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

  // NOTE: I'm basing my widget stuff on the widgets API RFC that seems to be
  // what Element and Synapse are using-ish. The main difference seems to be
  // that the widget type is still proprietary instead of `m.widget`. I'm not
  // gonna add `m.widget` support until it gets into the actual spec!
  //
  // https://docs.google.com/document/d/1uPF7XWY_dXTKVKV7jZQ2KmsI19wn9-kFRgQ1tFQP7wQ/edit#heading=h.ll7aaslz33ov
  const widgetEvents = roomEvents.filter(
    (event) => event.type === "im.vector.modular.widgets"
  );
  const widgetUrls = widgetEvents
    .map((event) => event.content?.url)
    // Widgets that were removed will still have events, but no content.
    // Ignore them.
    .filter((url) => url != null && isValidUrl(url));
  const videoEmbedUrl = widgetUrls[0] || null;

  return { canManage, securityWarning, videoEmbedUrl };
}

function isValidUrl(url) {
  try {
    new URL(url);
  } catch (error) {
    return false;
  }
  return true;
}
