/** Shared reference palette for interface tokens and standalone SVG exports. */
export const theme = Object.freeze({
  paper: "#ffffff",
  bg: "#f4f7fb",
  ink: "#081f3c",
  muted: "#3e516c",
  line: "#d5deea",
  blue: "#081f3c",
  "blue-dark": "#14325c",
  "blue-soft": "#e7eef6",
  accent: "#8d6b2c",
  gold: "#c6a15a",
  "accent-soft": "#f3efe4",
  teal: "#28644a",
  "green-soft": "#edf6f0",
  amber: "#8d6b2c",
  "amber-soft": "#fff3d8",
  violet: "#6c538f",
  "violet-soft": "#f3eff8",
  red: "#9c3944",
  "red-soft": "#fbeef0",
});
export function applyTheme() {
  for (const [name, color] of Object.entries(theme))
    document.documentElement.style.setProperty("--" + name, color);
}
