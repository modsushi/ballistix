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
 * Framing constraints.
 *
 * Fitting the entire arena inside the frame is the obvious thing to do and it
 * looks wrong — the deck ends up a small tile floating in a sea of scenery.
 * The original Ballistix instead pushes in until the arena overflows, letting
 * the near left and right corners run off the edges, because those corners are
 * the least useful pixels on the screen.
 *
 * So rather than one bounding set, we keep three, and only constrain each
 * against the edge that actually matters for it:
 *
 *   WIDTH   the *far* ends of the side walls, plus the player's own travel.
 *           The near ends share the same |x| but project wider, so leaving
 *           them out is exactly what lets the bottom corners spill off-screen.
 *   TOP     the far wall at full height — the deepest thing you must be able
 *           to read.
 *   BOTTOM  the player's goal line and their craft. Non-negotiable: an orb
 *           arriving at a goal you cannot see is not a game.
 */
const FIT = (() => {
  const { half, chamfer, wallH, playY } = ARENA;
  const a = half - chamfer;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // Mirrors Craft's own clamp, so the framing tracks the paddle's real travel.
  const reach = a - PADDLE.halfLen * 0.42;
  const zPad = half - PADDLE.standoff;

  return {
    width: [
      V(-half, 0, -a), V(half, 0, -a),         // far ends of the side walls
      V(-a, 0, -half), V(a, 0, -half),         // far chamfer corners
      V(-reach - PADDLE.halfLen, playY, zPad), // the player's deflector, fully
      V(reach + PADDLE.halfLen, playY, zPad),  // extended to either stop
    ],
    top: [
      V(-a, 2.5, -half), V(a, 2.5, -half),
      V(-half, 2.5, -a), V(half, 2.5, -a),
    ],
    bottom: [
      V(-a, 0, half), V(0, 0, half), V(a, 0, half),   // the player's goal line
      V(-reach, playY + 1.5, zPad), V(reach, playY + 1.5, zPad),
    ],
  };
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
    this.victoryCraft = null;
    this.victory = 0;
    this.victoryK = 0;
    this.victoryPanel = false;   // the result card is up; slide the subject clear
    this.victoryPush = 0;
    this.victoryR = 14;
    this._base = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this.stableCam = new THREE.PerspectiveCamera(50, aspect, 0.5, 1400);
    this.resize(aspect);
  }

  resize(aspect) {
    this.aspect = aspect;
    this.cam.aspect = aspect;

    // Portraitness: 0 at 16:9 and wider, 1 at 9:16 and narrower.
    const p = clamp((1.35 - aspect) / (1.35 - 0.52), 0, 1);
    this.portraitness = smoothstep(p);

    // Elevation: shallow and cinematic when wide, near-overhead when tall.
    this.elevation = lerp(35, 66, this.portraitness) * Math.PI / 180;
    // A slightly wider lens in portrait keeps the required distance sane.
    this.baseFov = lerp(48, 62, this.portraitness);
    this.cam.fov = this.baseFov;

    // `lookLift` is solved, not authored — see `_solveDistance`.
    this.lookLift = 0;
    this._solveDistance();
    this.cam.updateProjectionMatrix();
  }

  _solveDistance() {
    const vFov = this.baseFov * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.aspect);

    // How far each constrained set may reach, in NDC. Slightly over 1 on width
    // is deliberate: it lets the widest part of the deck kiss the screen edges
    // rather than sitting politely inside them.
    const fillX = lerp(1.0, 0.995, this.portraitness);
    const fillTop = lerp(0.95, 0.94, this.portraitness);
    // The bottom stops short of the edge because the self pod and pause button
    // live down there, and because the player's craft wants a little air.
    const fillBottom = lerp(0.88, 0.90, this.portraitness);

    // Two unknowns, solved together: how far back to sit, and where to aim.
    //
    // Distance alone isn't enough. Aim at the deck's centre and the near goal
    // line runs out of room long before the far wall does, so the bottom edge
    // binds while a third of the screen width goes to waste. Balancing the
    // vertical headroom first — pushing the image up until the top and bottom
    // are equally tight — frees the solve to keep pushing in until the *width*
    // binds, which is what puts the arena on the screen edges.
    //
    // NDC extent falls off as roughly 1/distance, so scaling by the worst
    // overshoot converges geometrically; the aim correction rides along in the
    // same loop and settles with it.
    let d = (ARENA.half * 1.2) / Math.sin(Math.min(vFov, hFov) / 2);
    let lift = 0;

    const probe = _probe;
    probe.fov = this.baseFov;
    probe.aspect = this.aspect;
    probe.updateProjectionMatrix();

    for (let iter = 0; iter < 32; iter++) {
      const ch = Math.cos(this.elevation), sh = Math.sin(this.elevation);
      probe.position.set(0, sh * d, ch * d);
      probe.lookAt(0, lift, lift * 0.15);
      probe.updateMatrixWorld(true);

      let wRatio = 0, tRatio = 0, bRatio = 0;
      for (const p of FIT.width) {
        _tmp.copy(p).project(probe);
        wRatio = Math.max(wRatio, Math.abs(_tmp.x) / fillX);
      }
      for (const p of FIT.top) {
        _tmp.copy(p).project(probe);
        tRatio = Math.max(tRatio, Math.max(0, _tmp.y) / fillTop);
      }
      for (const p of FIT.bottom) {
        _tmp.copy(p).project(probe);
        bRatio = Math.max(bRatio, Math.max(0, -_tmp.y) / fillBottom);
      }

      // Aiming lower (more negative) raises the image. Nudge toward the point
      // where top and bottom are equally close to their limits.
      const imbalance = bRatio - tRatio;
      lift = clamp(lift - imbalance * 3.2, -7, 2);

      const over = Math.max(wRatio, tRatio, bRatio);
      if (Math.abs(over - 1) < 0.003 && Math.abs(imbalance) < 0.006) break;
      d *= over;
    }

    this.distance = d;
    this.lookLift = lift;

    // A copy of the camera at its *ideal* framing — no lean, no shake, no
    // FOV punch. Input mapping is built against this rather than the live
    // camera so that steering stays stable while the frame is being thrown
    // around. Tying it to the live camera means the paddle creeps whenever
    // the camera leans toward an orb, which is exactly the kind of drift
    // that makes a control feel untrustworthy.
    const sc = this.stableCam;
    sc.fov = this.baseFov;
    sc.aspect = this.aspect;
    sc.updateProjectionMatrix();
    sc.position.set(0, Math.sin(this.elevation) * d, Math.cos(this.elevation) * d);
    sc.lookAt(0, lift, lift * 0.15);
    sc.updateMatrixWorld(true);
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

  /**
   * Leave the match framing and hold on the winner.
   *
   * The framing solve exists to keep the whole deck readable, which is exactly
   * the wrong composition once there is nothing left to read — a match ends with
   * the camera politely showing you an empty arena. So the victory shot throws
   * the solve away and orbits the surviving craft from inside the deck, close
   * enough that the hull fills a third of the frame.
   *
   * @param {import('./craft.js').Craft} craft
   */
  startVictory(craft) {
    this.victoryCraft = craft;
    this.victory = 0;
    this.victoryK = 0;
    this.victoryPanel = false;
    this.victoryPush = 0;
  }

  clearVictory() {
    this.victoryCraft = null;
    this.victory = 0;
    this.victoryK = 0;
    this.victoryPanel = false;
    this.victoryPush = 0;
  }

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

    // --- victory hero shot, blended over the solved framing -----------------
    if (this.victoryCraft) {
      this.victory += dt;
      // Slower in than the intro is out: a hard cut to a close-up reads as a
      // camera error, and the drift has to be moving by the time it arrives.
      const k = clamp(this.victory / 1.9, 0, 1);
      this.victoryK = 1 - Math.pow(1 - k, 3);

      const c = this.victoryCraft;
      c.worldPos(_hero);
      // Orbit anchored on the line from the craft toward the deck's centre, so
      // the shot opens on the hull's face and drifts around it from there.
      const ang = Math.atan2(-c.nx, -c.nz) + Math.sin(this.victory * 0.22) * 0.55 - 0.28;
      const el = (21 + Math.sin(this.victory * 0.31) * 3.0) * Math.PI / 180;
      const R = lerp(19.5, 15.5, this.victoryK);
      this.victoryR = R;

      _heroPos.set(
        _hero.x + Math.sin(ang) * Math.cos(el) * R,
        _hero.y + Math.sin(el) * R + 3.1,
        _hero.z + Math.cos(ang) * Math.cos(el) * R,
      );
      _heroLook.set(_hero.x, _hero.y + 1.35, _hero.z);

      this._base.lerp(_heroPos, this.victoryK);
      this._look.lerp(_heroLook, this.victoryK);
    }

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

    // --- make room for the result card -------------------------------------
    // Once the panel is up the hero shot has to share the frame with it, so the
    // subject is pushed out from behind the card: up, and to one side when
    // there is width to spare. Applied after `lookAt` as a pure translation —
    // re-aiming would swing the whole orbit instead of sliding the composition.
    if (this.victoryCraft) {
      this.victoryPush = damp(this.victoryPush, this.victoryPanel ? 1 : 0, 2.4, dt);
      if (this.victoryPush > 0.002) {
        // Framed against the orbit radius actually in use — deriving the
        // offset from a guessed distance undershoots and leaves the subject
        // half behind the card.
        const vh = 2 * Math.tan(this.cam.fov * Math.PI / 360) * (this.victoryR || 14);
        const wide = this.aspect > 1.05;
        if (wide) this.cam.translateX(vh * this.aspect * 0.33 * this.victoryPush);
        this.cam.translateY(-vh * (wide ? 0.14 : 0.24) * this.victoryPush);
      }
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
   * Projected against `stableCam` — the camera at its solved framing, with the
   * lean, shake and FOV punch left out. Using the live camera would be more
   * "correct" visually but makes the paddle drift under a motionless cursor
   * every time the frame moves, which is far worse than the paddle sitting a
   * few pixels off during a screen shake.
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
    _p1.project(this.stableCam);
    _p2.project(this.stableCam);

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

const _hero = new THREE.Vector3();
const _heroPos = new THREE.Vector3();
const _heroLook = new THREE.Vector3();
const _p1 = new THREE.Vector3();
const _p2 = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _probe = new THREE.PerspectiveCamera(50, 1, 0.5, 1400);
