import ChatView from "./chat-view";
import MatrixClient from "./matrix-client";

const chatView = new ChatView({
  container: document.querySelector("#chat"),
  roomId: document.querySelector("meta[name='playroom:room-id']").content,
});
chatView.mount();
console.debug("ChatView", chatView);

const client = new MatrixClient({ homeserver: "matrix.org" });
client
  .loginAsGuest()
  .then((guestSession) => {
    console.debug("Logged in as guest", guestSession);
    chatView.useSession(guestSession);
  })
  .catch((error) => {
    console.error(error);
    document.querySelector("#alert").setAttribute("data-status", "error");
    document.querySelector("#alert").innerText =
      `We're having trouble logging you into chat, sorry 😖 ` +
      `See the browser console for details!`;
  });
console.debug("MatrixClient", client);

// NOTE: We'll have our stuff load a session into the Hydrogen Platform's
//       session storage, then have a SessionContainer load it by ID.
