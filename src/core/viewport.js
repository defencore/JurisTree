export function isMobileLayout() {
  return typeof innerWidth === "number" && innerWidth <= 760;
}
