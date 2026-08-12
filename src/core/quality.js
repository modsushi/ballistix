/**
 * Device profiling + an adaptive resolution governor.
 *
 * We pick a starting tier from coarse hints (touch, memory, core count, GPU
 * renderer string), then let the governor trim internal resolution at runtime
 * if frames start costing too much. The tier decides *what* we draw; the
 * governor decides how many pixels we draw it into.
 */

export const TIER = { LOW: 0, MED: 1, HIGH: 2 };

function gpuHint(gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    return (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
  } catch { return ''; }
}

export function detectTier(gl) {
  const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || (touch ? 4 : 8);
  const r = gpuHint(gl);

  let score = 0;
  score += touch ? 0 : 3;
  score += cores >= 8 ? 2 : cores >= 6 ? 1 : 0;
  score += mem >= 8 ? 2 : mem >= 4 ? 1 : 0;

  // Apple silicon (incl. recent iPhones) punches well above the coarse hints.
  if (/apple\s*(a1[4-9]|a[2-9]\d|m[1-9])/.test(r)) score += 3;
  else if (/apple/.test(r)) score += 2;
  if (/adreno\s*(7\d\d|6[5-9]\d)/.test(r)) score += 2;
  if (/mali-g(7[1-9]|[89]\d)/.test(r)) score += 1;
  if (/(rtx|radeon rx|geforce)/.test(r)) score += 3;
  if (/(swiftshader|llvmpipe|software)/.test(r)) score -= 6;

  const tier = score >= 7 ? TIER.HIGH : score >= 4 ? TIER.MED : TIER.LOW;
  return { tier, touch, cores, mem, renderer: r };
}

/** Per-tier render settings. */
export const PRESETS = [
  { // LOW
    maxDpr: 1.5, msaa: 0, bloomLevels: 4, shadows: true, shadowSize: 768,
    sparks: 260, orbLights: 1, envSize: 128, grain: true, aberration: 0.55,
    floorDetail: 0.55, starCount: 900, trailSegments: 14,
  },
  { // MED
    maxDpr: 2.0, msaa: 4, bloomLevels: 5, shadows: true, shadowSize: 1024,
    sparks: 520, orbLights: 2, envSize: 256, grain: true, aberration: 0.8,
    floorDetail: 0.8, starCount: 1600, trailSegments: 20,
  },
  { // HIGH
    maxDpr: 2.0, msaa: 4, bloomLevels: 6, shadows: true, shadowSize: 2048,
    sparks: 900, orbLights: 4, envSize: 256, grain: true, aberration: 1.0,
    floorDetail: 1.0, starCount: 2600, trailSegments: 26,
  },
];

/**
 * Watches smoothed frame cost and nudges a render scale between `min` and 1.
 * Deliberately sluggish: resolution changes are visible, so we only move when
 * the evidence is consistent over a couple of seconds.
 */
export class ResolutionGovernor {
  constructor(min = 0.62) {
    this.scale = 1;
    this.min = min;
    this.avg = 16.7;
    this.acc = 0;
    this.dirty = false;
  }

  /** @returns {boolean} true when the scale changed and buffers need resizing. */
  update(dtMs) {
    // Ignore hitches (tab switches, GC spikes) — they aren't a resolution problem.
    if (dtMs > 120) return false;
    this.avg += (dtMs - this.avg) * 0.045;

    const budgetHi = 20.5;  // ~48fps — we're struggling
    const budgetLo = 13.2;  // ~76fps — we have headroom

    if (this.avg > budgetHi) this.acc += 1;
    else if (this.avg < budgetLo) this.acc -= 1;
    else this.acc *= 0.9;

    if (this.acc > 70 && this.scale > this.min) {
      this.scale = Math.max(this.min, this.scale - 0.09);
      this.acc = 0;
      return true;
    }
    if (this.acc < -140 && this.scale < 1) {
      this.scale = Math.min(1, this.scale + 0.06);
      this.acc = 0;
      return true;
    }
    return false;
  }
}
