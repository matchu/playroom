import Playroom from "./model/playroom";
import { createApp } from "./lib/petite-vue";
import DisplayNameForm from "./components/display-name-form";
import Hydrogen from "./components/hydrogen";
import settings from "../settings";

try {
  const playroom = new Playroom({ settings });

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
