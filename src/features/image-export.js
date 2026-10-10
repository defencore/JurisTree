import { fullSVG } from "../graph/export.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { download, safeName } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { toast } from "../ui/dialog.js";

export async function exportImage(vector = false) {
  try {
    const { svg, width, height } = await fullSVG(
      $("#imageScope")?.value || "full",
    );
    if (vector) {
      download(
        new Blob([svg], {
          type: "image/svg+xml",
        }),
        safeName(appState.project.title) + ".svg",
      );
      toast(translate("ui.svgRetainsQualityAtAnyScale"));
      return;
    }
    let scale = Number($("#pngScale")?.value || 2);
    scale = Math.min(
      scale,
      16000 / width,
      16000 / height,
      Math.sqrt(48e6 / (width * height)),
    );
    const image = new Image(),
      url = URL.createObjectURL(
        new Blob([svg], {
          type: "image/svg+xml",
        }),
      );
    try {
      await new Promise((res, rej) => {
        image.onload = res;
        image.onerror = () => rej(Error(translate("ui.couldNotPrepareTheMap")));
        image.src = url;
      });
      const c = document.createElement("canvas");
      c.width = Math.ceil(width * scale);
      c.height = Math.ceil(height * scale);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#f4f7fb";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(image, 0, 0, c.width, c.height);

      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      if (!blob) throw Error(translate("ui.mapTooLargeForPngChooseSvg"));
      download(blob, safeName(appState.project.title) + ".png");
      toast(`${translate("ui.map")} ${c.width} × ${c.height} px`);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    toast(e.message, true);
  }
}
