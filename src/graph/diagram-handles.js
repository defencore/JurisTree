export const bounded = (point) => ({
  x: Math.max(-100000, Math.min(100000, point.x)),
  y: Math.max(-100000, Math.min(100000, point.y)),
});
export const markerPosition = (element) => {
  const matrix = element.transform.baseVal.getItem(0).matrix;
  return { x: matrix.e, y: matrix.f };
};
export function focusSegment(key, axis, position) {
  const markers = [
    ...document.querySelectorAll(
      '#graph [data-route-segment][data-connector="' +
        key +
        '"][data-segment-axis="' +
        axis +
        '"]',
    ),
  ];
  markers.sort((a, b) => {
    const distance = (el) => {
      const p = markerPosition(el);
      return Math.hypot(p.x - position.x, p.y - position.y);
    };
    return distance(a) - distance(b);
  });
  markers[0]?.focus({ preventScroll: true });
}
