export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const saturate = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Frame-rate independent exponential approach. `rate` = how fast, in 1/sec. */
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));

export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => (a + Math.random() * (b - a + 1)) | 0;
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];

/** Small, fast, deterministic value noise for camera shake. */
export function noise1(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const h = (n) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  return lerp(h(i), h(i + 1), u);
}
