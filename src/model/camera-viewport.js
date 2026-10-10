/** Keep the viewed world center and user-selected scale when the viewport changes. */
export function resizeCamera(camera, previous, next) {
  return {
    ...camera,
    x: camera.x + (next.width - previous.width) / 2,
    y: camera.y + (next.height - previous.height) / 2,
  };
}
