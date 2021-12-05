export default class DisplayNameForm {
  constructor({ container, playroom }) {
    this.container = container;
    this.playroom = playroom;

    this.state = { session: null, displayName: null, isSubmitting: false };

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

  async useSession(session) {
    this.session = session;
    this.state.displayName = await this.playroom.getDisplayName(session);
    this.update();
  }

  update() {
    const { displayName } = this.state;
    this.textField.value = displayName;
    this.textField.disabled = displayName == null || this.state.isSubmitting;
    this.saveButton.disabled = displayName == null || this.state.isSubmitting;
  }

  async onSubmit() {
    if (this.session == null) {
      throw new Error(`can't submit DisplayNameForm without a session`);
    }

    const { accessToken, userId } = this.session;
    const newDisplayName = this.textField.value;

    this.state.displayName = newDisplayName;
    this.state.isSubmitting = true;
    this.update();

    await this.playroom.setDisplayName({ accessToken, userId, newDisplayName });

    this.state.isSubmitting = false;
    this.textField.blur();
    this.update();
  }
}
