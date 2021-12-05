import ChatView from "./chat-view";
import MatrixClient from "./matrix-client";

async function startApp() {
  const roomId = document.querySelector(
    "meta[name='playroom:room-id']"
  ).content;

  const chatView = new ChatView({
    container: document.querySelector("chat-panel"),
    roomId,
  });
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
    document.querySelector("#alert").setAttribute("data-status", "error");
    document.querySelector("#alert").innerText =
      `We're having trouble logging you into chat, sorry 😖 ` +
      `See the browser console for details!`;
  }
}

startApp().catch((error) => console.error(error));
