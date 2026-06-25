import fs from "node:fs";
import path from "node:path";

// Collects every image in /assets so the UI gallery stays in sync with the filesystem.
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".svg", ".gif", ".webp"]);

export default function () {
  const assetsDir = path.join(process.cwd(), "assets");
  let files = [];

  try {
    files = fs.readdirSync(assetsDir);
  } catch {
    return [];
  }

  return files
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((file) => ({
      file,
      src: `/assets/${file}`,
      type: path.extname(file).replace(".", "").toUpperCase(),
    }));
}
