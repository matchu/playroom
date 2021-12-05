export default class DisplayNameForm {
  constructor({ container, playroom }) {
    this.container = container;
    this.playroom = playroom;

    this.state = { displayName: null, isSubmitting: false };

    this.form = this.container.querySelector("form");
    this.textField = this.container.querySelector("input[type=text]");
    this.saveButton = this.container.querySelector("button");
  }

  start() {
    this.container
      .querySelector("form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.onSubmit();
      });
  }

  async handleLoginSuccess() {
    this.state.displayName = await this.playroom.getDisplayName();
    this.update();
  }

  update() {
    const { displayName } = this.state;
    this.textField.value = displayName;
    this.textField.disabled = displayName == null || this.state.isSubmitting;
    this.saveButton.disabled = displayName == null || this.state.isSubmitting;
  }

  async onSubmit() {
    const newDisplayName = this.textField.value;

    this.state.displayName = newDisplayName;
    this.state.isSubmitting = true;
    this.update();

    await this.playroom.setDisplayName(newDisplayName);

    this.state.isSubmitting = false;
    this.textField.blur();
    this.update();
  }
}
