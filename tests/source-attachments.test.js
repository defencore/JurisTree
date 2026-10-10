import test from "node:test";
import assert from "node:assert/strict";
import { fresh } from "../src/model/project.js";
import { sample } from "../src/data/demo.js";
import { validateImport } from "../src/model/validation.js";
import { normalizeSourceAttachments } from "../src/model/source-attachments.js";
import { state } from "../src/core/state.js";
import { usedBlobs, pruneBlobs } from "../src/services/blobs.js";
import {
  readClipboardImages,
  pastedImages,
} from "../src/services/clipboard.js";
import { prepareAttachment } from "../src/services/attachment-files.js";
import { buildSearchIndex, searchIndex } from "../src/model/search.js";

const file = (assetId, filename = `${assetId}.png`) => ({
  assetId,
  filename,
  caption: "",
  description: "",
  inscription: "",
  regions: [],
  mime: "image/png",
  size: 12,
});

test("archives normalize earlier single-file sources once and round-trip multiple attachments without scalar fields", () => {
  const project = sample(),
    source = project.documents[0];
  delete source.attachments;
  Object.assign(source, file("earlier"));
  let imported = validateImport(project);
  assert.deepEqual(imported.documents[0].attachments, [file("earlier")]);
  for (const key of ["assetId", "filename", "mime", "size"])
    assert.equal(Object.hasOwn(imported.documents[0], key), false);
  imported.documents[0].attachments.push(
    file("register-page-2", "Riverdale register page 2.png"),
  );
  imported = validateImport(imported);
  assert.equal(imported.documents[0].attachments.length, 2);
  assert.ok(
    searchIndex(buildSearchIndex(imported), '"Riverdale register page 2"').some(
      (result) => result.id === source.id,
    ),
  );
});

test("attachment validation rejects missing IDs, duplicates, oversized lists, unsafe MIME types and invalid sizes", () => {
  for (const attachments of [
    [{}],
    [file("bad/id")],
    [file(42)],
    [file("same"), file("same")],
    [{ ...file("x"), mime: "text/html" }],
    [{ ...file("x"), size: -1 }],
    [{ ...file("x"), size: 51 * 1048576 }],
    Array.from({ length: 201 }, (_, i) => file(`a-${i}`)),
    {},
  ]) {
    assert.throws(() => normalizeSourceAttachments({ attachments }));
  }
  assert.deepEqual(
    normalizeSourceAttachments({ attachments: [], ...file("obsolete") }),
    [],
  );
});

test("all source pages and portraits persist while historical attachments remain available for undo and redo", () => {
  state.project = fresh();
  state.project.people = [{ avatarId: "portrait" }];
  state.project.documents = [{ attachments: [file("page-1"), file("page-2")] }];
  state.history = [
    { people: [], documents: [{ attachments: [file("removed")] }] },
  ];
  state.future = [
    { people: [], documents: [{ attachments: [file("future")] }] },
  ];
  state.urls = new Map();
  state.blobs = new Map(
    ["portrait", "page-1", "page-2", "removed", "future", "orphan"].map(
      (id) => [id, new Blob([id])],
    ),
  );
  assert.deepEqual(usedBlobs().sort(), ["page-1", "page-2", "portrait"]);
  pruneBlobs();
  assert.deepEqual([...state.blobs.keys()].sort(), [
    "future",
    "page-1",
    "page-2",
    "portrait",
    "removed",
  ]);
});

test("clipboard reading selects one image representation per item and ignores unrelated text", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let typesRead = [];
  try {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        clipboard: {
          read: async () => [
            {
              types: ["text/html", "image/png", "image/jpeg"],
              getType: async (type) => {
                typesRead.push(type);
                return new Blob(["image"], { type });
              },
            },
            {
              types: ["text/plain"],
              getType: () => assert.fail("Clipboard text must not be read"),
            },
          ],
        },
      },
    });
    const files = await readClipboardImages();
    assert.equal(files.length, 1);
    assert.deepEqual(typesRead, ["image/png"]);
    assert.match(files[0].name, /^Clipboard-\d+-1\.png$/);
    assert.equal(files[0].type, "image/png");
    navigator.clipboard.read = async () => {
      throw Error("denied");
    };
    await assert.rejects(readClipboardImages(), /Ctrl\+V/);
    assert.deepEqual(
      pastedImages({
        clipboardData: {
          files: [
            files[0],
            new File(["text"], "note.txt", { type: "text/plain" }),
          ],
        },
      }),
      [files[0]],
    );
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete globalThis.navigator;
  }
});

test("source file preparation retains PDF and text bytes and rejects oversized or unsupported files", async () => {
  const original = new File(["Original register transcript"], "record.txt", {
    type: "text/plain",
  });
  const prepared = await prepareAttachment(original);
  assert.equal(prepared.blob, original);
  assert.equal(await prepared.blob.text(), "Original register transcript");
  const pdf = new File(["%PDF-1.4"], "record.pdf", { type: "" });
  const pdfPrepared = await prepareAttachment(pdf);
  assert.equal(pdfPrepared.mime, "application/pdf");
  assert.equal(await pdfPrepared.blob.text(), "%PDF-1.4");
  for (const input of [
    { name: "script.html", type: "text/html", size: 10 },
    { name: "big.pdf", type: "application/pdf", size: 13 * 1048576 },
    { name: "big.png", type: "image/png", size: 51 * 1048576 },
  ])
    await assert.rejects(prepareAttachment(input));
});

test("sources resolve the exact profile record without duplicate attachment ownership and preserve book metadata and captions", async () => {
  const { profileRecordTarget, sourceRecordLinks, recordSourceType } =
    await import("../src/model/source-record-links.js");
  const project = sample();
  const target = profileRecordTarget(project, {
    personId: "p4",
    section: "military",
    recordId: "award-jordan",
  });
  assert.equal(recordSourceType("military", target.record), "award");
  const source = project.documents[0];
  source.collectionTitle = "Awards register";
  source.volume = "7";
  source.pages = "18v";
  source.attachments = [
    { ...file("obverse"), caption: "Medal, obverse" },
    { ...file("reverse"), caption: "Medal, reverse" },
  ];
  target.record.sourceId = source.id;
  const imported = validateImport(project);
  const links = sourceRecordLinks(imported, source.id).filter(
    ({ record }) => record.id === "award-jordan",
  );
  assert.equal(links.length, 1);
  assert.equal(links[0].profile.id, "p4");
  assert.equal(imported.documents[0].pages, "18v");
  assert.equal(imported.documents[0].attachments[1].caption, "Medal, reverse");
  assert.equal(
    profileRecordTarget(imported, {
      personId: "p4",
      section: "military",
      recordId: "missing",
    }),
    null,
  );
  assert.equal(recordSourceType("death", {}), "death_notice");
});

test("archive validation bounds the combined attachment count so exported ZIPs remain importable", () => {
  const project = sample(),
    source = project.documents[0];
  project.documents = Array.from({ length: 13 }, (_, i) => ({
    ...source,
    id: `large-source-${i}`,
    attachments: Array.from({ length: 200 }, (_, j) => file(`file-${i}-${j}`)),
  }));
  assert.throws(() => validateImport(project), /2?400|2400/);
});
