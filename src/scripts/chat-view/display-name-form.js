export default class DisplayNameForm {
  constructor({ container, client }) {
    this.container = container;
    this.client = client;

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
    const displayNameData = await this.client._get(
      `/_matrix/client/v3/profile/${encodeURIComponent(
        session.userId
      )}/displayname`,
      { accessToken: session.accessToken }
    );
    this.state.displayName = displayNameData.displayname;
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

    await this.client.setDisplayName({ accessToken, userId, newDisplayName });

    this.state.isSubmitting = false;
    this.textField.blur();
    this.update();
  }
}
