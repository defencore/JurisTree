export const attachmentExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "application/octet-stream": "bin",
};
export function mediaMime(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "webm" && file.type === "audio/webm") return "audio/webm";
  return (
    {
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      wav: "audio/wav",
      ogg: "audio/ogg",
      webm: "video/webm",
      mp4: "video/mp4",
      mov: "video/quicktime",
    }[ext] || ""
  );
}
export function isMedia(mime = "") {
  return (
    (mime.startsWith("audio/") || mime.startsWith("video/")) &&
    Object.hasOwn(attachmentExtensions, mime)
  );
}
