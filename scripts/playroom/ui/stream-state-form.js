import { reactive } from "../../lib/petite-vue.js";

export default function StreamStateForm({ playroom }) {
  return reactive({
    videoEmbedHtml: "",
    isSaving: false,

    async start(event) {
      event.preventDefault();
      this.isSaving = true;

      try {
        const { videoEmbedUrl } = parseVideoEmbedHtml(this.videoEmbedHtml);
        alert(`TODO: Start stream at ${videoEmbedUrl}`);
      } catch (error) {
        console.error(error);
        alert(
          `Couldn't start the stream, sorry!\n\nError: ${error.message}\n\n` +
            `See the browser console for details.`
        );
      }

      this.isSaving = false;
    },

    async stop(event) {
      event.preventDefault();
      this.isSaving = true;

      try {
        alert("TODO: Stop the stream!");
      } catch (error) {
        console.error(error);
        alert(
          `Couldn't stop the stream, sorry! See the browser console for ` +
            `details.\n\n${error.message}`
        );
      }

      this.isSaving = false;
    },
  });
}

function parseVideoEmbedHtml(videoEmbedHtml) {
  let embedDocument;
  try {
    embedDocument = new DOMParser().parseFromString(
      videoEmbedHtml,
      "text/html"
    );
  } catch (error) {
    console.error(error);
    throw new Error(`Could not parse embed HTML: ${error.message}`);
  }
  console.log(embedDocument);

  const iframe = embedDocument.querySelector("iframe[src]");
  if (!iframe) {
    throw new Error(
      `Could not extract URL from embed HTML. Embed HTML should contain an ` +
        `<iframe> tag, with a src attribute.`
    );
  }

  const videoEmbedUrl = iframe.getAttribute("src");
  try {
    new URL(videoEmbedUrl);
  } catch (error) {
    console.error(error);
    throw new Error(
      `The <iframe> src attribute was not a valid URL: ${error.message}`
    );
  }

  return { videoEmbedUrl };
}
