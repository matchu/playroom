export default function DisplayNameForm({ playroom }) {
  return {
    _playroomState: playroom.state,
    _localDisplayName: null,
    isSaving: false,
    get displayName() {
      return this._localDisplayName ?? this._playroomState.chat.displayName;
    },
    set displayName(newDisplayName) {
      this._localDisplayName = newDisplayName;
    },
    get isDisabled() {
      return this.displayName == null || this.isSaving;
    },
    async saveDisplayName(e) {
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

      this.$refs.displayNameInput.blur();
    },
  };
}
