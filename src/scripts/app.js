import ChatClient from "./chat.js";

const client = new ChatClient({ homeserver: "matrix.org" });

client.loginAsGuest().then((guestSession) => {
  console.log("guest session", guestSession, client);
});

// NOTE: We'll have our stuff load a session into the Hydrogen Platform's
//       session storage, then have a SessionContainer load it by ID.
