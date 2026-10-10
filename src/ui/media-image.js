import { esc } from "../core/dom.js";
import { objectUrl } from "../services/blobs.js";

/** Render a view of the original bytes; region coordinates never alter the file. */
export function mediaImage(
  file,
  region = null,
  { alt = "", eager = false, maxHeight = 360 } = {},
) {
  const url = objectUrl(file.assetId);
  if (!url) return "";
  const attributes = `alt="${esc(alt || region?.title || file.caption || file.filename)}" ${eager ? "" : 'loading="lazy"'} decoding="async"`;
  if (!region?.rect)
    return `<img class="media-original" src="${url}" ${attributes}>`;
  const { x, y, width, height } = region.rect;
  const ratio = ((file.width || 1) * width) / ((file.height || 1) * height);
  return `<div class="media-region-image" style="aspect-ratio:${ratio};width:100%;max-width:${ratio * maxHeight}px"><img src="${url}" ${attributes} style="width:${100 / width}%;height:${100 / height}%;left:${(-100 * x) / width}%;top:${(-100 * y) / height}%"></div>`;
}

export function imageItemKey({ source, file, region }) {
  return `${source.id}:${file.assetId}:${region?.id || "whole"}`;
}
