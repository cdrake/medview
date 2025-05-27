function nice(x: number, round: boolean): number {
  const exp = Math.floor(Math.log(x) / Math.log(10))
  const f = x / Math.pow(10, exp)
  let nf
  if (round) {
    if (f < 1.5) {
      nf = 1
    } else if (f < 3) {
      nf = 2
    } else if (f < 7) {
      nf = 5
    } else {
      nf = 10
    }
  } else {
    if (f <= 1) {
      nf = 1
    } else if (f <= 2) {
      nf = 2
    } else if (f <= 5) {
      nf = 5
    } else {
      nf = 10
    }
  }
  return nf * Math.pow(10, exp)
}

function loose_label(min: number, max: number, ntick = 4): [number, number, number, boolean] {
  const range = nice(max - min, false)
  const d = nice(range / (ntick - 1), true)
  const graphmin = Math.floor(min / d) * d
  const graphmax = Math.ceil(max / d) * d
  const perfect = graphmin === min && graphmax === max
  return [d, graphmin, graphmax, perfect]
}

// "Nice Numbers for Graph Labels", Graphics Gems, pp 61-63
// https://github.com/cenfun/nice-ticks/blob/master/docs/Nice-Numbers-for-Graph-Labels.pdf

/**
 * Computes tick spacing for an axis given a data range and desired number of ticks.
 * @param mn - Minimum data value
 * @param mx - Maximum data value
 * @param tickCount - Desired number of intervals (default: 5)
 * @returns [step, start, end]
 */
export function tickSpacing(
  mn: number,
  mx: number,
  tickCount: number = 5
): [number, number, number] {
  // Use the loose_label algorithm to compute nice step and endpoints
  const v = loose_label(mn, mx, tickCount)
  // v[0]: step size, v[1]: nice minimum, v[2]: nice maximum
  return [v[0], v[1], v[2]]
}