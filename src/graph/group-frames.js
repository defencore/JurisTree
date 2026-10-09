const FRAME_PADDING = 19;
const HEADER_HEIGHT = 32;
const HEADER_GAP = 8;
const PERSON_BADGE_SPACE = 36;

function intersects(a, b) {
  return (
    a.x < b.x + b.w + HEADER_GAP &&
    a.x + a.w + HEADER_GAP > b.x &&
    a.y < b.y + b.h + HEADER_GAP &&
    a.y + a.h + HEADER_GAP > b.y
  );
}

/** Keep group headings clear of cards, kinship badges and other headings. */
export function groupFrames(
  groups,
  nodes,
  labelWidth = () => 280,
  labelPosition = () => null,
) {
  const obstacles = nodes.map((node) => {
    const space = node.kind === "person" ? PERSON_BADGE_SPACE : 0;
    return { x: node.x, y: node.y - space, w: node.w, h: node.h + space };
  });
  const frames = [];
  for (const group of groups) {
    const members = nodes.filter(
      (node) => node.kind === "person" && node.groupIds?.includes(group.id),
    );
    if (!members.length) continue;
    const x = Math.min(...members.map((node) => node.x)) - FRAME_PADDING,
      top = Math.min(...members.map((node) => node.y)),
      right = Math.max(...members.map((node) => node.x + node.w)),
      bottom = Math.max(...members.map((node) => node.y + node.h)),
      w = right - x + FRAME_PADDING;
    const header = {
      x: x + HEADER_GAP,
      y: top - PERSON_BADGE_SPACE - HEADER_GAP - HEADER_HEIGHT,
      w: Math.min(
        w - HEADER_GAP * 2,
        Math.max(160, labelWidth(group, members.length) + 68),
      ),
      h: HEADER_HEIGHT,
    };
    let collision;
    while ((collision = obstacles.find((box) => intersects(header, box))))
      header.y = Math.min(
        header.y - 1,
        collision.y - HEADER_GAP - HEADER_HEIGHT,
      );
    const y = header.y - HEADER_GAP,
      manual = labelPosition(group);
    if (manual) {
      header.x = manual.x - header.w / 2;
      header.y = manual.y - 10;
    }
    obstacles.push(header);
    frames.push({
      group,
      count: members.length,
      x,
      y,
      w,
      h: bottom - y + 20,
      header,
    });
  }
  return frames;
}
