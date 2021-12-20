import { reactive } from "../../lib/petite-vue.js";

export default function StreamStateForm({ playroom }) {
  return reactive({
    _localStreamPageUrl: null,
    isSaving: false,

    get streamPageUrl() {
      return this._localStreamPageUrl || playroom.state.stream.videoEmbedUrl;
    },
    set streamPageUrl(newStreamPageUrl) {
      this._localStreamPageUrl = newStreamPageUrl;
    },

    async startStream(event) {
      event.preventDefault();
      this.isSaving = true;

      try {
        const safeStreamPageUrl = filterStreamPageUrl(this.streamPageUrl);
        const unsafeVideoEmbedUrl = await getVideoEmbedUrlFromStreamPageUrl(
          safeStreamPageUrl
        );
        const videoEmbedUrl = filterVideoEmbedUrl(unsafeVideoEmbedUrl);
        await playroom.startStream({ videoEmbedUrl });
      } catch (error) {
        console.error(error);
        alert(
          `Couldn't start the stream, sorry!\n\nError: ${error.message}\n\n` +
            `See the browser console for details.`
        );
      }

      this.isSaving = false;
    },

    async endStream(event) {
      event.preventDefault();
      this.isSaving = true;

      try {
        await playroom.endStream();
      } catch (error) {
        console.error(error);
        alert(
          `Couldn't end the stream, sorry! See the browser console for ` +
            `details.\n\n${error.message}`
        );
      }

      this.isSaving = false;
    },
  });
}

async function getVideoEmbedUrlFromStreamPageUrl(streamPageUrl) {
  // First, if the URL actually looks like HTML, try parsing it as such, and
  // getting the actual URL out of the <iframe> tag. (This means users can e.g.
  // copy the Embed HTML from their video provider and have it work, which is
  // useful if oEmbed isn't working over CORS!)
  if (streamPageUrl.match(/^\s*</)) {
    try {
      return getVideoEmbedUrlFromEmbedHtml(streamPageUrl);
    } catch (error) {
      console.warn(
        `Tried parsing the stream page URL as HTML, but failed. Trying ` +
          `next strategy.`,
        error
      );
    }
  }

  // Next, try to load the stream page, to look for the oEmbed meta tag. If it
  // works, load the oEmbed endpoint, and parse the URL from the embed HTML it
  // returns.
  try {
    const streamPageRes = await fetch(streamPageUrl, { mode: "cors" });
    if (!streamPageRes.ok) {
      throw new Error(
        `Stream page responded with ${res.status} ${res.statusText}`
      );
    }
    const streamPageHtml = await streamPageRes.text();
    const streamPageDocument = new DOMParser().parseFromString(
      streamPageHtml,
      "text/html"
    );
    const oEmbedLinkTag = streamPageDocument.querySelector(
      'link[type="application/json+oembed"]'
    );
    const oEmbedUrl = oEmbedLinkTag.getAttribute("href");
    return await getVideoEmbedUrlFromOEmbedUrl(oEmbedUrl);
  } catch (error) {
    console.warn(
      `Couldn't load stream page for oEmbed tag. Could be expected, if the ` +
        `page doesn't support CORS (like YouTube). Trying next strategy.`,
      error
    );
  }

  // Next, try loading /oembed at the root of the given URL. This endpoint
  // location isn't guaranteed, but this is where YouTube puts it!
  try {
    const oEmbedUrl = new URL("/oembed", streamPageUrl);
    oEmbedUrl.search = new URLSearchParams({ url: streamPageUrl }).toString();
    return await getVideoEmbedUrlFromOEmbedUrl(oEmbedUrl);
  } catch (error) {
    console.warn(
      `Couldn't load /oembed endpoint. Could be expected, if the endpoint ` +
        `doesn't exist, or doesn't support CORS. Trying next strategy.`,
      error
    );
  }

  // Next, try loading /services/oembed at the root of the given URL. This
  // endpoint location isn't guaranteed, but this is the standard location
  // described in the oEmbed spec, and it's where PeerTube puts it!
  try {
    const oEmbedUrl = new URL("/services/oembed", streamPageUrl);
    oEmbedUrl.search = new URLSearchParams({ url: streamPageUrl }).toString();
    return await getVideoEmbedUrlFromOEmbedUrl(oEmbedUrl);
  } catch (error) {
    console.warn(
      `Couldn't load /services/oembed endpoint. Could be expected, if the ` +
        `endpoint doesn't exist, or doesn't support CORS. Trying next ` +
        `strategy.`,
      error
    );
  }

  // Finally, just use the stream URL as given. Maybe they gave us the embed
  // URL from the iframe embed code!
  return streamPageUrl;
}

async function getVideoEmbedUrlFromOEmbedUrl(oEmbedUrl) {
  const res = await fetch(oEmbedUrl, { mode: "cors" });
  if (!res.ok) {
    throw new Error(
      `oEmbed endpoint responded with ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  return await getVideoEmbedUrlFromEmbedHtml(data.html);
}

function getVideoEmbedUrlFromEmbedHtml(videoEmbedHtml) {
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

  const iframe = embedDocument.querySelector("iframe[src]");
  if (!iframe) {
    throw new Error(
      `Could not extract URL from embed HTML. Embed HTML should contain an ` +
        `<iframe> tag, with a src attribute.`
    );
  }

  return iframe.getAttribute("src");
}

function filterStreamPageUrl(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}: ${url}`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`URL must be HTTP or HTTPS`);
  }

  // Rewrite youtu.be redirect URLs, because we won't be able to follow them
  // for oEmbed correctly.
  if (parsedUrl.hostname === "youtu.be") {
    return (
      `https://www.youtube.com/watch?v=` +
      `${encodeURIComponent(parsedUrl.pathname.split("/")[1])}`
    );
  }

  return parsedUrl.toString();
}

function filterVideoEmbedUrl(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}: ${url}`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`URL must be HTTP or HTTPS`);
  }

  // Use privacy-enhanced mode for Youtube URLs.
  if (parsedUrl.hostname === "www.youtube.com") {
    parsedUrl.hostname = "www.youtube-nocookie.com";
  }

  return parsedUrl.toString();
}
