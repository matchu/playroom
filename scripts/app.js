import settings from "../settings.js";
import { createApp } from "./lib/petite-vue.js";
import PlayroomManager from "./playroom/manager.js";
import DisplayNameForm from "./playroom/ui/display-name-form.js";
import Hydrogen from "./playroom/ui/hydrogen.js";

try {
  const playroom = new PlayroomManager({ settings });
  playroom.start();
  createApp({
    chat: playroom.state.chat,
    stream: playroom.state.stream,
    ui: {
      displayNameForm: DisplayNameForm({ playroom }),
      hydrogen: Hydrogen({ playroom }),
    },
  }).mount();
} catch (error) {
  console.error(error);
  alert(
    `Error starting the stream, sorry! If you keep getting this, please let ` +
      `me know! You can open the browser console for details.`
  );
}
