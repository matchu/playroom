import Playroom from "./model/playroom.js";
import { createApp } from "./lib/petite-vue.js";
import DisplayNameForm from "./components/display-name-form.js";
import Hydrogen from "./components/hydrogen.js";
import settings from "../settings.js";

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
