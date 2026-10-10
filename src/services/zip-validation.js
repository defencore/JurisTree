import { translate } from "../i18n/index.js";

export function checkZip(buffer) {
  const v = new DataView(buffer);
  let end = -1;
  for (
    let i = buffer.byteLength - 22;
    i >= Math.max(0, buffer.byteLength - 65557);
    i--
  )
    if (v.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw Error(translate("ui.invalidZipArchive"));
  const count = v.getUint16(end + 10, true),
    offset = v.getUint32(end + 16, true);
  if (count > 2500 || count === 65535)
    throw Error(translate("ui.tooManyFilesInZip"));
  let at = offset,
    total = 0;
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (at + 46 > buffer.byteLength || v.getUint32(at, true) !== 0x02014b50)
      throw Error(translate("ui.damagedZipDirectory"));
    const size = v.getUint32(at + 24, true),
      nl = v.getUint16(at + 28, true),
      el = v.getUint16(at + 30, true),
      cl = v.getUint16(at + 32, true);
    if (at + 46 + nl + el + cl > buffer.byteLength)
      throw Error(translate("ui.damagedZipDirectory"));
    if (size > 50 * 1048576)
      throw Error(translate("ui.anArchiveEntryIsTooLarge"));
    if (v.getUint16(at + 8, true) & 1)
      throw Error(translate("ui.encryptedZipArchivesAreNotSupported"));
    total += size;
    if (total > 150 * 1048576)
      throw Error(translate("ui.unpackedArchiveExceeds150Mb"));
    const path = decoder.decode(new Uint8Array(buffer, at + 46, nl));
    if (path.split(/[\\/]/).includes("..") || path.startsWith("/"))
      throw Error(translate("ui.invalidZipPath"));
    at += 46 + nl + el + cl;
  }
}
