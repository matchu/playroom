import * as fs from "fs/promises";
import glob from "glob";
import { gzip } from "pako";

const jsLibFiles = glob.sync("../scripts/lib/**/*.js");
const cssLibFiles = glob.sync("../styles/lib/**/*.css");
const libFiles = [...jsLibFiles, ...cssLibFiles].sort();

for (const filename of libFiles) {
  const content = await fs.readFile(filename);
  const gzippedContent = gzip(content);
  console.log(
    `${filename}: ${formatBytes(content.byteLength)} ` +
      `(${formatBytes(gzippedContent.byteLength)} gzipped)`
  );
}

// https://stackoverflow.com/a/18650828/107415
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
