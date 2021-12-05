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
    console.error(error);
    if (error.consentUrl) {
      try {
        handleConsentError(error, container);
        return;
      } catch (error2) {
        console.warn(
          `Could not show consent prompt, showing generic error instead`,
          error2
        );
      }
    }

    container.setAttribute("status", "error");
    container.setAttribute("error-type", "login-error");
    return;
  }

  container.setAttribute("status", "ready");
  container.removeAttribute("loading-step");
}

function handleConsentError(error, container) {
  const links = container.querySelectorAll("a[href$='terms-placeholder.html']");
  if (links.length === 0) {
    throw new Error(`could not find terms-placeholder.html link to replace`);
  }
  for (const link of links) {
    link.href = error.consentUrl;
  }
  container.setAttribute("status", "error");
  container.setAttribute("error-type", "must-agree-to-terms");
}

document.addEventListener("DOMContentLoaded", () => startApp());
