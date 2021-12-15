export async function readSavedSession() {
  try {
    const sessionString = localStorage.getItem("playroom-session");
    if (!sessionString) {
      return null;
    }
    return JSON.parse(sessionString);
  } catch (error) {
    console.warn(`Error reading saved session, skipping:`, error);
    return null;
  }
}

export async function writeSavedSession(session) {
  localStorage.setItem("playroom-session", JSON.stringify(session));
}
