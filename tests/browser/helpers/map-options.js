export async function openMapOptions(page) {
  if (!(await page.locator("#graphToolbar").isVisible()))
    await page.locator('[data-action="mobile-tools"]').click();
}

export async function openMapLayout(page) {
  await openMapOptions(page);
  const summary = page.locator(
    ".graph-layout-settings:not([open]) summary, .diagram-layout-settings:not([open]) summary",
  );
  if (await summary.isVisible()) await summary.click();
}
