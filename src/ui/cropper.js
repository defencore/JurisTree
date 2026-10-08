import { resetWindow } from "./floating-windows.js";
import { $ } from "../core/dom.js";
import { bytes } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { toast } from "./dialog.js";
export async function cropImage(file, portrait) {
  const img = new Image(),
    url = URL.createObjectURL(file);
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(Error(translate("ui.unsupportedOrDamagedImage")));
    img.src = url;
  });
  URL.revokeObjectURL(url);
  if (img.width * img.height > 90e6)
    throw Error(translate("ui.imageTooLargeToProcess"));
  let rotation = 0,
    rect = null,
    pointerStart = null,
    iw = img.width,
    ih = img.height,
    scale = 1;
  const canvas = $("#cropCanvas"),
    ctx = canvas.getContext("2d"),
    source = document.createElement("canvas");
  $("#cropTitle").textContent = portrait
    ? translate("ui.personProfilePhoto")
    : translate("ui.prepareDocumentImage");
  $("#cropHint").textContent = portrait
    ? translate("ui.selectASquareAreaForThePortrait")
    : translate("ui.selectAnAreaKeepAllRequiredStampsSignatures");
  $("#cropSize").value = portrait ? "1600" : "2400";
  $("#cropSize").disabled = portrait;
  $("#cropQuality").value = ".84";
  function reset() {
    iw = rotation % 180 ? img.height : img.width;
    ih = rotation % 180 ? img.width : img.height;
    source.width = iw;
    source.height = ih;
    const s = source.getContext("2d");
    s.translate(iw / 2, ih / 2);
    s.rotate((rotation * Math.PI) / 180);
    s.drawImage(img, -img.width / 2, -img.height / 2);
    scale = Math.min(1, 700 / iw, 400 / ih);
    canvas.width = Math.max(1, Math.round(iw * scale));
    canvas.height = Math.max(1, Math.round(ih * scale));
    const side = Math.min(iw, ih);
    rect = portrait
      ? {
          x: (iw - side) / 2,
          y: (ih - side) / 2,
          w: side,
          h: side,
        }
      : {
          x: 0,
          y: 0,
          w: iw,
          h: ih,
        };
    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(14,34,57,.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x * scale, rect.y * scale, rect.w * scale, rect.h * scale);
    ctx.clip();
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      rect.x * scale,
      rect.y * scale,
      rect.w * scale,
      rect.h * scale,
    );
    $("#cropInfo").textContent =
      `${translate("ui.original2")} ${bytes(file.size)} ${translate("ui.selection")} ${Math.round(rect.w)} × ${Math.round(rect.h)} px · ${portrait ? translate("ui.portraitUpTo640Px") : translate("ui.compressedCopyYourOriginalFileStaysUnchanged")}`;
  }
  function point(e) {
    const b = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(iw, ((e.clientX - b.left) / b.width) * iw)),
      y: Math.max(0, Math.min(ih, ((e.clientY - b.top) / b.height) * ih)),
    };
  }
  canvas.onpointerdown = (e) => {
    pointerStart = point(e);
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (!pointerStart) return;
    const p = point(e);
    let x = Math.min(pointerStart.x, p.x),
      y = Math.min(pointerStart.y, p.y),
      w = Math.abs(p.x - pointerStart.x),
      h = Math.abs(p.y - pointerStart.y);
    if (portrait) {
      const side = Math.min(w, h);
      w = h = side;
      if (p.x < pointerStart.x) x = pointerStart.x - side;
      if (p.y < pointerStart.y) y = pointerStart.y - side;
    }
    if (w >= 8 && h >= 8) {
      rect = {
        x,
        y,
        w,
        h,
      };
      draw();
    }
  };
  canvas.onpointerup = () => (pointerStart = null);
  canvas.onpointercancel = () => (pointerStart = null);
  $("#cropRotate").onclick = () => {
    rotation = (rotation + 90) % 360;
    reset();
  };
  $("#cropReset").onclick = reset;
  reset();
  resetWindow($("#cropDialog"));
  $("#cropDialog").showModal();
  return new Promise((resolve) => {
    let finished = false;
    function done(blob) {
      if (finished) return;
      finished = true;
      $("#cropDialog").close();
      canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = null;
      resolve(blob);
    }
    $("#cropCancel").onclick = $("#cropCancelTop").onclick = () => done(null);
    $("#cropDialog").oncancel = (e) => {
      e.preventDefault();
      done(null);
    };
    $("#cropSave").onclick = async () => {
      const btn = $("#cropSave");
      btn.disabled = true;
      try {
        const max = portrait ? 640 : Number($("#cropSize").value),
          factor = Math.min(1, max / Math.max(rect.w, rect.h)),
          out = document.createElement("canvas");
        out.width = Math.max(1, Math.round(rect.w * factor));
        out.height = Math.max(1, Math.round(rect.h * factor));
        const c = out.getContext("2d");
        c.fillStyle = "white";
        c.fillRect(0, 0, out.width, out.height);
        c.drawImage(
          source,
          rect.x,
          rect.y,
          rect.w,
          rect.h,
          0,
          0,
          out.width,
          out.height,
        );
        let quality = Number($("#cropQuality").value),
          blob;
        for (let k = 0; k < 5; k++) {
          blob = await new Promise((res) =>
            out.toBlob(res, "image/webp", quality),
          );
          if (!blob) throw Error(translate("ui.couldNotCompressTheImage"));
          if (blob.size <= (portrait ? 220000 : 2200000) || quality <= 0.48)
            break;
          quality -= 0.1;
        }
        toast(
          `${translate("ui.image")} ${bytes(file.size)} → ${bytes(blob.size)}`,
        );
        done(blob);
      } catch (e) {
        toast(e.message, true);
      } finally {
        btn.disabled = false;
      }
    };
  });
}
