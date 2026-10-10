import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "../src/vendor/zip.js";
import { checkZip } from "../src/services/zip-validation.js";
import { translate } from "../src/i18n/index.js";

test("ZIP directory validation accepts portable archives and rejects truncated filename metadata with a readable error", async () => {
  const zip = new JSZip();
  zip.file("tree.json", "{}");
  const bytes = await zip.generateAsync({ type: "arraybuffer" });
  assert.doesNotThrow(() => checkZip(bytes));
  const malformed = bytes.slice(0),
    view = new DataView(malformed);
  const offset = view.getUint32(malformed.byteLength - 22 + 16, true);
  view.setUint16(offset + 28, 65535, true);
  assert.throws(
    () => checkZip(malformed),
    (error) => error.message === translate("ui.damagedZipDirectory"),
  );
  assert.throws(
    () => checkZip(new ArrayBuffer(5)),
    (error) => error.message === translate("ui.invalidZipArchive"),
  );
});
