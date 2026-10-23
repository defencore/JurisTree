import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { state } from "../src/core/state.js";
import { onSignal } from "../src/core/signals.js";
import { fresh } from "../src/model/project.js";
import { saveNow, scheduleSave } from "../src/services/storage.js";

const unsubscribe = [];
afterEach(() => {
  clearTimeout(state.saveTimer);
  unsubscribe.splice(0).forEach((stop) => stop());
  state.editorActive = false;
  state.db = null;
});
function storage() {
  const transactions = [],
    snapshots = [],
    statuses = [],
    errors = [];
  state.project = fresh();
  state.editorActive = true;
  state.saveRevision = 0;
  state.saveSerial = Promise.resolve();
  state.db = {
    transaction() {
      const tx = {
        objectStore: () => ({ put: (payload) => snapshots.push(payload) }),
      };
      transactions.push(tx);
      return tx;
    },
  };
  unsubscribe.push(
    onSignal("storage:status", (status) => statuses.push(status)),
  );
  unsubscribe.push(
    onSignal("storage:error", (message) => errors.push(message)),
  );
  return { transactions, snapshots, statuses, errors };
}

test("an older draft write cannot report saved while a newer edit is waiting to save", async () => {
  const { transactions, snapshots, statuses } = storage();
  state.project.title = "Before edit";
  const older = saveNow();
  await setImmediate();
  state.project.title = "Latest edit";
  scheduleSave();
  transactions[0].oncomplete();
  await older;
  assert.equal(statuses.at(-1), "saving");
  assert.equal(statuses.includes("saved"), false);
  const latest = saveNow();
  await setImmediate();
  transactions[1].oncomplete();
  await latest;
  assert.equal(statuses.at(-1), "saved");
  assert.equal(snapshots.at(-1).project.title, "Latest edit");
});

test("queued edits persist in order and only the newest completed snapshot reports saved", async () => {
  const { transactions, snapshots, statuses } = storage();
  const writes = [];
  for (const title of ["Create", "Undo", "Redo"]) {
    state.project.title = title;
    writes.push(saveNow());
  }
  for (let i = 0; i < writes.length; i++) {
    await setImmediate();
    assert.equal(transactions.length, i + 1);
    transactions[i].oncomplete();
    await writes[i];
    assert.equal(statuses.at(-1), i === 2 ? "saved" : "saving");
  }
  assert.deepEqual(
    snapshots.map((p) => p.project.title),
    ["Create", "Undo", "Redo"],
  );
});

test("a superseded write failure does not replace the status of a newer successful draft", async () => {
  const { transactions, statuses, errors } = storage();
  const older = saveNow();
  await setImmediate();
  state.project.title = "Replacement";
  const latest = saveNow();
  transactions[0].error = Error("Write aborted");
  transactions[0].onabort();
  await older;
  await setImmediate();
  assert.equal(statuses.at(-1), "saving");
  assert.deepEqual(errors, []);
  transactions[1].oncomplete();
  await latest;
  assert.equal(statuses.at(-1), "saved");
});
