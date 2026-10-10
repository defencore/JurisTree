export async function openMapOptions(page) {
  if (!(await page.locator("#graphToolbar").isVisible()))
    await page
      .locator('[popovertarget="mapSettings"]:not([popovertargetaction])')
      .click();
}

export async function openMapLayout(page) {
  if (!(await page.locator("#diagramTools").isVisible()))
    await openMapOptions(page);
  const summary = page.locator(
    (await page.locator("#diagramTools").isVisible())
      ? ".diagram-layout-settings:not([open]) summary"
      : ".graph-layout-settings:not([open]) summary",
  );
  if (await summary.isVisible()) await summary.click();
}

export async function openWorkingPeople(page) {
  if (!(await page.locator("#favoriteRail").isVisible()))
    await page.locator('[popovertarget="favoriteRail"]').click();
}
