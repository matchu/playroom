import DisplayNameForm from "./components/display-name-form";
import Playroom from "./model/playroom";
import { createApp } from "./lib/petite-vue";
import Hydrogen from "./components/hydrogen";

try {
  const roomIdMetaTag = document.querySelector("meta[name='playroom:room-id']");
  const roomId = roomIdMetaTag?.content;
  if (roomId == null) {
    throw new Error(
      `Can't find the room ID. It should be configured in the <head> ` +
        `of the document as <meta name="playroom:room-id" ` +
        `content="ROOM_ID_HERE" />.`
    );
  }

  const playroom = new Playroom({ roomId });

  createApp({
    chat: playroom.state.chat,
    stream: playroom.state.stream,
    displayNameForm: DisplayNameForm({ playroom }),
    hydrogen: Hydrogen({ playroom }),
  }).mount();

  playroom.start();
} catch (error) {
  console.error(error);
  alert(
    `Error starting the stream, sorry! If you keep getting this, please let ` +
      `me know! You can open the browser console for details.`
  );
}
