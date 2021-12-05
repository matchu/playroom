import ChatView from "./chat-view";
import MatrixClient from "./matrix-client";

async function startApp() {
  const container = document.querySelector("chat-panel");
  const roomId = document.querySelector(
    "meta[name='playroom:room-id']"
  ).content;

  const chatView = new ChatView({ container, roomId });
  chatView.mount();
  console.debug("ChatView", chatView);

  try {
    const client = new MatrixClient({ homeserver: "matrix.org", roomId });
    const session = await client.loginAsSavedSessionOrGuest();
    await chatView.useSession(session);
    console.debug("MatrixClient", client);
  } catch (error) {
    if (error.consentUrl) {
      window.open(error.consentUrl);
    }
    console.error(error);

    container.setAttribute("status", "error");
    container.setAttribute("error-type", "login-error");
    return;
  }

  container.setAttribute("status", "ready");
  container.removeAttribute("loading-step");
}

startApp().catch((error) => console.error(error));
