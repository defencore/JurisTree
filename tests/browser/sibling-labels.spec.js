import { test, expect } from "@playwright/test";

for (const [language, brother, sister, neutral] of [
  ["en", "Brother", "Sister", "Sibling"],
  ["uk", "Брат", "Сестра", "Брат / сестра"],
  ["ru", "Брат", "Сестра", "Брат / сестра"],
]) {
  test(
    "sibling map captions and person roles follow recorded genders in " +
      language,
    async ({ page }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const hash = process.env.JURISTREE_RELEASE_HASH;
      await page.goto(hash ? "./?release=" + hash : "./");
      if (hash)
        await expect(page.locator('script[type="module"]')).toHaveAttribute(
          "src",
          new RegExp(hash),
        );
      await page.locator("#startDemo").click();
      await page.locator("#appShell [data-language]").selectOption(language);
      await page.evaluate(async () => {
        const base = document.querySelector('script[type="module"]').src,
          load = (path) => import(new URL(path, base).href);
        const [
          { fresh },
          { validateImport },
          { activateTree },
          { render },
          { fit },
        ] = await Promise.all([
          load("model/project.js"),
          load("model/validation.js"),
          load("features/workspace-session.js"),
          load("ui/render.js"),
          load("graph/camera.js"),
        ]);
        const p = fresh();
        p.title = "Doe family";
        p.people = [
          ["m1", "John Doe", "m"],
          ["m2", "Jamie Doe", "m"],
          ["f1", "Jane Doe", "f"],
          ["f2", "Jesse Doe", "f"],
          ["u1", "Robin Doe", "u"],
        ].map(([id, name, gender], i) => ({
          id,
          name,
          gender,
          x: (i % 3) * 440,
          y: Math.floor(i / 3) * 420,
        }));
        p.relations = [
          ["mm", "m1", "m2"],
          ["ff", "f1", "f2"],
          ["mf", "m1", "f1"],
          ["fm", "f2", "m2"],
          ["mu", "m2", "u1"],
        ].map(([id, from, to]) => ({ id, from, to, type: "sibling" }));
        activateTree(validateImport(p));
        render();
        fit();
      });
      for (const [id, caption] of [
        ["mm", brother],
        ["ff", sister],
        ["mf", brother + " / " + sister],
        ["fm", sister + " / " + brother],
        ["mu", neutral],
      ])
        await expect(
          page.locator('[data-edge="' + id + '"] .relationship-title'),
        ).toHaveText(caption.toLocaleLowerCase());
      await page.evaluate(async () => {
        const { select } = await import(
          new URL(
            "ui/render.js",
            document.querySelector('script[type="module"]').src,
          ).href
        );
        select("relation", "fm");
      });
      await expect(page.locator("#inspector h2")).toHaveText(
        sister + " / " + brother,
      );
      const steps = await page.evaluate(async () => {
        const base = document.querySelector('script[type="module"]').src,
          { state } = await import(new URL("core/state.js", base).href),
          { graphStepLabel } = await import(
            new URL("features/graph-tools.js", base).href
          );
        return Object.fromEntries(
          state.project.relations.map((r) => [r.id, graphStepLabel(r, r.from)]),
        );
      });
      expect(steps).toEqual({
        mm: brother,
        ff: sister,
        mf: sister,
        fm: brother,
        mu: neutral,
      });

      await page.evaluate(async () => {
        const { select } = await import(
          new URL(
            "ui/render.js",
            document.querySelector('script[type="module"]').src,
          ).href
        );
        select("person", "m1");
      });
      await expect(
        page.locator('[data-node="m2"] .person-card-role'),
      ).toContainText(brother);
      await expect(
        page.locator('[data-node="f1"] .person-card-role'),
      ).toContainText(sister);
      expect(errors).toEqual([]);
    },
  );
}
