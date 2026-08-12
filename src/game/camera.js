import * as THREE from 'three';
import { ARENA, PADDLE } from '../core/config.js';
import { clamp, damp, lerp, noise1, smoothstep } from '../core/math.js';

/**
 * The match camera.
 *
 * Two jobs. The first is responsiveness: the arena has to be fully visible and
 * comfortably framed from a 20:9 phone held upright to an ultrawide monitor.
 * We solve that by projecting the arena's real silhouette and iterating on the
 * distance until it fills the frame (see `_solveDistance`), and by *changing the
 * camera's elevation with aspect ratio* — a low, dramatic angle in landscape
 * where there's width to spare, and a higher, more top-down angle in portrait
 * where a shallow view would squash the octagon into an unreadable sliver.
 *
 * The second job is feel: trauma-driven shake, a rotational lean toward the
 * action, and an FOV punch on impacts. All of it is additive on top of the
 * framing solve, so juice never breaks the composition.
 */

/**
 * The silhouette we must keep on screen: the eight deck corners at deck level
 * and again at the top of the containment wall, pushed out by the wall's
 * thickness. Sixteen points is enough to bound the arena exactly.
 */
const FIT_POINTS = (() => {
  const { half, chamfer, wallH } = ARENA;
  const a = half - chamfer;
  const pad = 1.9;                       // wall thickness plus a little rail
  const ring = [
    [-a, half], [a, half], [half, a], [half, -a],
    [a, -half], [-a, -half], [-half, -a], [-half, a],
  ];
  const pts = [];
  for (const [x, z] of ring) {
    const l = Math.hypot(x, z);
    const ex = x + (x / l) * pad, ez = z + (z / l) * pad;
    pts.push(new THREE.Vector3(ex, 0, ez));
    pts.push(new THREE.Vector3(ex, wallH + 0.5, ez));
  }
  return pts;
})();

export class GameCamera {
  constructor(aspect) {
    // fov is re-derived from aspect in resize(); this is just a valid seed.
    this.cam = new THREE.PerspectiveCamera(50, aspect, 0.5, 1400);
    this.trauma = 0;
    this.traumaTime = 0;
    this.fovPunch = 0;
    this.leanX = 0; this.leanZ = 0;
    this.targetLeanX = 0; this.targetLeanZ = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.intro = 0;
    this.introActive = false;
    this.kickX = 0; this.kickY = 0;
    this._base = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this.resize(aspect);
  }

  resize(aspect) {
    this.aspect = aspect;
    this.cam.aspect = aspect;

    // Portraitness: 0 at 16:9 and wider, 1 at 9:16 and narrower.
    const p = clamp((1.35 - aspect) / (1.35 - 0.52), 0, 1);
    this.portraitness = smoothstep(p);

    // Elevation: shallow and cinematic when wide, near-overhead when tall.
    this.elevation = lerp(40, 66, this.portraitness) * Math.PI / 180;
    // A slightly wider lens in portrait keeps the required distance sane.
    this.baseFov = lerp(48, 62, this.portraitness);
    this.cam.fov = this.baseFov;

    // Push the arena up the frame so the bottom HUD and the player's own craft
    // aren't fighting for the same pixels.
    this.lookLift = lerp(-1.2, -3.4, this.portraitness);

    this._solveDistance();
    this.cam.updateProjectionMatrix();
  }

  _solveDistance() {
    const vFov = this.baseFov * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.aspect);

    // Fill targets leave room for the HUD, which eats proportionally more of a
    // short landscape viewport than a tall portrait one. In portrait the fit is
    // always width-bound — a flat octagon seen at any elevation is wider than
    // it is tall on screen — so we spend nearly the full width there and let
    // the vertical slack carry the surrounding facility.
    const fillX = lerp(0.94, 0.99, this.portraitness);
    const fillY = lerp(0.86, 0.80, this.portraitness);

    // Start from a bounding-sphere estimate, then correct against the real
    // silhouette. A sphere fit badly over-estimates here — the arena is a flat
    // disc seen at 40–63° of elevation, so its projected height is a fraction
    // of its projected width, and the sphere solve strands the deck in the
    // middle of a mostly empty screen. NDC extent falls off as roughly
    // 1/distance, so scaling by the overshoot converges in a few passes.
    let d = (ARENA.half * 1.2) / Math.sin(Math.min(vFov, hFov) / 2);
    const probe = _probe;
    probe.fov = this.baseFov;
    probe.aspect = this.aspect;
    probe.updateProjectionMatrix();

    for (let iter = 0; iter < 8; iter++) {
      const ch = Math.cos(this.elevation), sh = Math.sin(this.elevation);
      probe.position.set(0, sh * d, ch * d);
      probe.lookAt(0, this.lookLift, this.lookLift * 0.15);
      probe.updateMatrixWorld(true);

      let mx = 0, my = 0;
      for (const p of FIT_POINTS) {
        _tmp.copy(p).project(probe);
        mx = Math.max(mx, Math.abs(_tmp.x));
        my = Math.max(my, Math.abs(_tmp.y));
      }
      const over = Math.max(mx / fillX, my / fillY);
      if (Math.abs(over - 1) < 0.004) break;
      d *= over;
    }
    this.distance = d;
  }

  /** Camera shake. `amount` 0..1; stacks and decays quadratically. */
  shake(amount) { this.trauma = Math.min(1, this.trauma + amount); }

  /** A directional nudge, in world XZ — used for big impacts. */
  kick(x, z, power) {
    this.kickX += x * power;
    this.kickY += z * power;
  }

  punch(amount) { this.fovPunch = Math.min(9, this.fovPunch + amount); }

  /** Bias the framing toward a point of interest (usually the busiest orb). */
  lookToward(x, z, weight = 1) {
    this.targetLeanX = clamp(x * 0.055, -1.4, 1.4) * weight;
    this.targetLeanZ = clamp(z * 0.045, -1.2, 1.2) * weight;
  }

  startIntro() { this.intro = 0; this.introActive = true; }

  update(dt, t) {
    // --- decay -------------------------------------------------------------
    this.trauma = Math.max(0, this.trauma - dt * 1.55);
    this.traumaTime += dt * (28 + this.trauma * 26);
    this.fovPunch = damp(this.fovPunch, 0, 6.5, dt);
    this.kickX = damp(this.kickX, 0, 8, dt);
    this.kickY = damp(this.kickY, 0, 8, dt);
    this.leanX = damp(this.leanX, this.targetLeanX, 2.6, dt);
    this.leanZ = damp(this.leanZ, this.targetLeanZ, 2.6, dt);
    this.zoom = damp(this.zoom, this.targetZoom, 3.2, dt);

    // --- framing -----------------------------------------------------------
    let dist = this.distance * this.zoom;
    let el = this.elevation;
    let yaw = 0;

    if (this.introActive) {
      this.intro += dt;
      const k = clamp(this.intro / 3.4, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      // Sweep in from a low, close, off-axis angle and settle into the frame.
      dist *= lerp(0.55, 1, e);
      el = lerp(11 * Math.PI / 180, el, e);
      yaw = lerp(-0.85, 0, e);
      if (k >= 1) this.introActive = false;
    }

    // Idle breathing: a slow orbit and rise, small enough to feel rather than
    // see, which keeps a static scene from looking like a paused screenshot.
    yaw += Math.sin(t * 0.13) * 0.019;
    el += Math.sin(t * 0.097 + 1.3) * 0.012;

    const ch = Math.cos(el), sh = Math.sin(el);
    this._base.set(
      Math.sin(yaw) * ch * dist + this.leanX,
      sh * dist,
      Math.cos(yaw) * ch * dist + this.leanZ,
    );
    this._look.set(this.leanX * 1.7, this.lookLift, this.leanZ * 1.7 + this.lookLift * 0.15);

    this.cam.position.copy(this._base);
    this.cam.lookAt(this._look);

    // --- shake, applied in camera-local space so it always reads on screen --
    const s = this.trauma * this.trauma;
    if (s > 0.0001) {
      const T = this.traumaTime;
      const ox = noise1(T) * s * 1.35;
      const oy = noise1(T + 47.3) * s * 1.15;
      const roll = noise1(T + 91.7) * s * 0.055;
      this.cam.translateX(ox + this.kickX * 0.5);
      this.cam.translateY(oy + this.kickY * 0.35);
      this.cam.rotateZ(roll);
    } else if (this.kickX || this.kickY) {
      this.cam.translateX(this.kickX * 0.5);
      this.cam.translateY(this.kickY * 0.35);
    }

    const fov = this.baseFov + this.fovPunch + s * 1.6;
    if (Math.abs(fov - this.cam.fov) > 0.005) {
      this.cam.fov = fov;
      this.cam.updateProjectionMatrix();
    }
    this.cam.updateMatrixWorld();
  }

  /**
   * Build the screen-x <-> wall-offset mapping for a craft.
   *
   * Both ends are projected *through the craft's own basis* rather than through
   * world X. That distinction is the whole point: a pilot's offset `u` runs
   * along their wall's tangent, and for the south wall the tangent is -X, so
   * increasing `u` moves the craft **left** on screen. Building the mapping
   * from world X instead silently inverts the controls — and inverts them for
   * two of the four walls only, which is worse than inverting them everywhere.
   *
   * Projecting live each frame also keeps it correct through shake, the intro
   * sweep and resizes, with no assumptions baked in about the projection.
   *
   * @param {{nx:number,nz:number,tx:number,tz:number}} craft
   * @param {number} limit  the wall's half-extent
   * @param {number} gain   >1 narrows the screen band, so less travel is needed
   * @returns {{map:(screenX:number)=>number, sign:number}}
   *   `sign` is +1 when increasing `u` moves right on screen, -1 when left.
   *   Relative controls (keys, stick) multiply by it so "right" always means
   *   right regardless of which wall you're on.
   */
  makeMapper(craft, limit, gain, viewportWidth) {
    const d = ARENA.half - PADDLE.standoff;
    _p1.set(craft.nx * d + craft.tx * -limit, ARENA.playY, craft.nz * d + craft.tz * -limit);
    _p2.set(craft.nx * d + craft.tx * limit, ARENA.playY, craft.nz * d + craft.tz * limit);
    _p1.project(this.cam);
    _p2.project(this.cam);

    let x0 = (_p1.x * 0.5 + 0.5) * viewportWidth;
    let x1 = (_p2.x * 0.5 + 0.5) * viewportWidth;
    // Narrow the band about its midpoint so a comfortable sweep covers the wall.
    const mid = (x0 + x1) * 0.5;
    x0 = mid + (x0 - mid) / gain;
    x1 = mid + (x1 - mid) / gain;

    const span = x1 - x0;
    if (Math.abs(span) < 1) return { map: () => 0, sign: 1 };
    return {
      map: (sx) => ((sx - x0) / span) * 2 * limit - limit,
      sign: span > 0 ? 1 : -1,
    };
  }
}

const _p1 = new THREE.Vector3();
const _p2 = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _probe = new THREE.PerspectiveCamera(50, 1, 0.5, 1400);
