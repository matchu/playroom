import { reactive } from "../lib/petite-vue";

export default function DisplayNameForm({ playroom, $refs }) {
  return reactive({
    _localDisplayName: null,
    isSaving: false,

    get displayName() {
      return this._localDisplayName ?? playroom.state.chat.displayName;
    },
    set displayName(newDisplayName) {
      this._localDisplayName = newDisplayName;
    },

    get isDisabled() {
      return this.displayName == null || this.isSaving;
    },

    async submit(e) {
      console.log("form", this);
      e.preventDefault();
      this.isSaving = true;

      try {
        await playroom.setDisplayName(this.displayName);
      } catch (error) {
        console.error(error);
        alert(
          `Error saving your display name, sorry! ` +
            `Let me know if you keep having trouble!`
        );
      }

      this._localDisplayName = null;
      this.isSaving = false;

      $refs.displayNameInput.blur();
    },
  });
}
