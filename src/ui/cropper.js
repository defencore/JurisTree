import { resetWindow } from "./floating-windows.js";
import { $ } from "../core/dom.js";
import { imageDimensions } from "../services/attachment-files.js";
import { bytes } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import {
  cropViewport,
  moveCrop,
  resizeCrop,
  scaleCrop,
} from "../model/crop-geometry.js";
import { toast } from "./dialog.js";

export async function cropImage(file, portrait) {
  const img = await imageDimensions(file),
    canvas = $("#cropCanvas"),
    ctx = canvas.getContext("2d"),
    source = document.createElement("canvas");
  let rotation = 0,
    bounds,
    rect,
    view,
    gesture = null;
  canvas.width = 700;
  canvas.height = 420;
  $("#cropTitle").textContent = translate(
    portrait ? "ui.personProfilePhoto" : "ui.prepareDocumentImage",
  );
  $("#cropHint").textContent = translate(
    portrait ? "ui.portraitCropHint" : "ui.documentCropHint",
  );
  $("#cropSize").value = portrait ? "1600" : "2400";
  $("#cropSize").disabled = portrait;
  $("#cropSizeControl").hidden = portrait;
  $("#cropQuality").value = ".84";
  $("#cropZoomControl").hidden = !portrait;

  function fitView() {
    view = cropViewport(bounds, rect, canvas.width, canvas.height);
  }
  function reset() {
    bounds = {
      width: rotation % 180 ? img.height : img.width,
      height: rotation % 180 ? img.width : img.height,
    };
    source.width = bounds.width;
    source.height = bounds.height;
    const context = source.getContext("2d");
    context.translate(bounds.width / 2, bounds.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(img, -img.width / 2, -img.height / 2);
    const side = Math.min(bounds.width, bounds.height);
    rect = portrait
      ? {
          x: (bounds.width - side) / 2,
          y: (bounds.height - side) / 2,
          w: side,
          h: side,
        }
      : { x: 0, y: 0, w: bounds.width, h: bounds.height };
    gesture = null;
    fitView();
    draw();
  }
  function corners() {
    return [
      ["nw", rect.x, rect.y],
      ["ne", rect.x + rect.w, rect.y],
      ["sw", rect.x, rect.y + rect.h],
      ["se", rect.x + rect.w, rect.y + rect.h],
    ];
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e7eef6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const image = () =>
      ctx.drawImage(
        source,
        view.x,
        view.y,
        bounds.width * view.scale,
        bounds.height * view.scale,
      );
    image();
    ctx.fillStyle = "rgba(14,34,57,.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const x = view.x + rect.x * view.scale,
      y = view.y + rect.y * view.scale,
      w = rect.w * view.scale,
      h = rect.h * view.scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, w, h);
    image();
    ctx.restore();
    ctx.strokeStyle = "#8d6b2c";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    for (const [, cx, cy] of corners()) {
      const px = view.x + cx * view.scale,
        py = view.y + cy * view.scale;
      ctx.fillStyle = "white";
      ctx.fillRect(px - 6, py - 6, 12, 12);
      ctx.strokeStyle = "#081f3c";
      ctx.strokeRect(px - 6, py - 6, 12, 12);
    }
    const percent = Math.round(
      (Math.min(bounds.width, bounds.height) * 100) / rect.w,
    );
    // A logarithmic slider keeps 100% centered and makes reducing photos practical on phones.
    $("#cropZoom").value = String(Math.round(Math.log10(percent / 100) * 100));
    $("#cropZoom").setAttribute("aria-valuetext", percent + "%");
    $("#cropZoomValue").textContent = percent + "%";
    canvas.dataset.cropRect = JSON.stringify(rect);
    canvas.dataset.cropView = JSON.stringify(view);
    $("#cropInfo").textContent =
      translate("ui.original2") +
      " " +
      bytes(file.size) +
      " " +
      translate("ui.selection") +
      " " +
      Math.round(rect.w) +
      " × " +
      Math.round(rect.h) +
      " px · " +
      translate(
        portrait
          ? "ui.portraitUpTo640Px"
          : "ui.compressedCopyYourOriginalFileStaysUnchanged",
      );
  }
  function point(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x:
        (((event.clientX - box.left) * canvas.width) / box.width - view.x) /
        view.scale,
      y:
        (((event.clientY - box.top) * canvas.height) / box.height - view.y) /
        view.scale,
    };
  }
  function cornerAt(p) {
    const radius = Math.min(
      (14 * canvas.width) / canvas.getBoundingClientRect().width / view.scale,
      rect.w / 4,
      rect.h / 4,
    );
    return corners().find(
      ([, x, y]) => Math.abs(x - p.x) <= radius && Math.abs(y - p.y) <= radius,
    )?.[0];
  }
  function inside(p) {
    return (
      p.x >= rect.x &&
      p.x <= rect.x + rect.w &&
      p.y >= rect.y &&
      p.y <= rect.y + rect.h
    );
  }
  canvas.onpointerdown = (event) => {
    if (event.button !== 0) return;
    const start = point(event),
      corner = cornerAt(start);
    gesture = {
      start,
      rect: { ...rect },
      view: { ...view },
      corner,
      mode: corner ? "resize" : inside(start) ? "move" : "create",
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
    event.preventDefault();
  };
  canvas.onpointermove = (event) => {
    const p = point(event);
    if (!gesture) {
      const corner = cornerAt(p);
      canvas.style.cursor = corner
        ? ["nw", "se"].includes(corner)
          ? "nwse-resize"
          : "nesw-resize"
        : inside(p)
          ? "move"
          : "crosshair";
      return;
    }
    if (gesture.mode === "move")
      rect = moveCrop(
        gesture.rect,
        p.x - gesture.start.x,
        p.y - gesture.start.y,
        bounds,
        portrait,
      );
    else if (gesture.mode === "resize")
      rect = resizeCrop(gesture.rect, gesture.corner, p, bounds, portrait);
    else {
      const clampPoint = (p) =>
          portrait
            ? p
            : {
                x: Math.max(0, Math.min(bounds.width, p.x)),
                y: Math.max(0, Math.min(bounds.height, p.y)),
              },
        start = clampPoint(gesture.start),
        end = clampPoint(p);
      let w = Math.abs(end.x - start.x),
        h = Math.abs(end.y - start.y);
      if (portrait) w = h = Math.min(w, h);
      if (w >= 8 && h >= 8)
        rect = {
          x: end.x < start.x ? start.x - w : start.x,
          y: end.y < start.y ? start.y - h : start.y,
          w,
          h,
        };
    }
    draw();
  };
  function endGesture(event) {
    if (!gesture) return;
    if (event.type === "pointercancel") {
      rect = gesture.rect;
      view = gesture.view;
    } else fitView();
    gesture = null;
    draw();
  }
  canvas.onpointerup = canvas.onpointercancel = endGesture;
  canvas.onkeydown = (event) => {
    const directions = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      },
      direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = (event.shiftKey ? 20 : 5) / view.scale;
    rect = moveCrop(
      rect,
      direction[0] * step,
      direction[1] * step,
      bounds,
      portrait,
    );
    fitView();
    draw();
  };
  $("#cropZoom").oninput = () => {
    rect = scaleCrop(
      rect,
      Math.min(bounds.width, bounds.height),
      Math.round(100 * 10 ** (Number($("#cropZoom").value) / 100)),
    );
    fitView();
    draw();
  };
  $("#cropRotate").onclick = () => {
    rotation = (rotation + 90) % 360;
    reset();
  };
  $("#cropReset").onclick = () => {
    if (!portrait) {
      reset();
      return;
    }
    const side = Math.max(bounds.width, bounds.height);
    rect = {
      x: (bounds.width - side) / 2,
      y: (bounds.height - side) / 2,
      w: side,
      h: side,
    };
    fitView();
    draw();
  };
  reset();
  resetWindow($("#cropDialog"));
  $("#cropDialog").showModal();
  return new Promise((resolve) => {
    let finished = false;
    function done(blob) {
      if (finished) return;
      finished = true;
      $("#cropDialog").close();
      canvas.onpointerdown =
        canvas.onpointermove =
        canvas.onpointerup =
        canvas.onpointercancel =
        canvas.onkeydown =
          null;
      $("#cropZoom").oninput =
        $("#cropRotate").onclick =
        $("#cropReset").onclick =
          null;
      gesture = null;
      resolve(blob);
    }
    $("#cropCancel").onclick = $("#cropCancelTop").onclick = () => done(null);
    $("#cropDialog").oncancel = (event) => {
      event.preventDefault();
      done(null);
    };
    $("#cropSave").onclick = async () => {
      const button = $("#cropSave");
      button.disabled = true;
      try {
        const max = portrait ? 640 : Number($("#cropSize").value),
          factor = Math.min(1, max / Math.max(rect.w, rect.h)),
          out = document.createElement("canvas");
        out.width = Math.max(1, Math.round(rect.w * factor));
        out.height = Math.max(1, Math.round(rect.h * factor));
        const context = out.getContext("2d");
        context.fillStyle = "white";
        context.fillRect(0, 0, out.width, out.height);
        context.drawImage(
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
        for (let attempt = 0; attempt < 5; attempt++) {
          blob = await new Promise((resolve) =>
            out.toBlob(resolve, "image/webp", quality),
          );
          if (!blob) throw Error(translate("ui.couldNotCompressTheImage"));
          if (blob.size <= (portrait ? 220000 : 2200000) || quality <= 0.48)
            break;
          quality -= 0.1;
        }
        toast(
          translate("ui.image") +
            " " +
            bytes(file.size) +
            " → " +
            bytes(blob.size),
        );
        done(blob);
      } catch (error) {
        toast(error.message, true);
      } finally {
        button.disabled = false;
      }
    };
  });
}
