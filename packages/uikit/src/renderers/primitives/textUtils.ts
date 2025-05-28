import { Color } from "../../types";

// src/renderers/primitives/textUtils.ts
export function calculateOuterColor(fontColor: Color): Color {
  const [r,g,b,a] = fontColor;
  const len = Math.hypot(r,g,b);
  const v = 1.0 - (len >= 0.1 ? 1.0 : 0.0);
  return [v,v,v,a];
}
