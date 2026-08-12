import { clamp } from './math.js';
import { PADDLE } from './config.js';

/**
 * Unified pointer / keyboard / gamepad control.
 *
 * The mobile scheme is absolute: the horizontal position of your thumb maps
 * straight onto a position along your wall. Relative dragging is gentler on
 * the thumb but it costs you the one thing this game is about — being able to
 * cross the full width of your goal *right now*. Absolute mapping makes that a
 * single motion, and the hull's own inertia smooths the snap so it never looks
 * teleported.
 *
 * For touch the mapping is narrowed past the wall's true screen span (see
 * `POINTER_GAIN`) so a comfortable thumb arc covers the whole goal instead of
 * forcing a stretch to the literal screen edges — which matters a lot in
 * portrait, where the arena occupies a narrow band. A mouse gets an exact 1:1
 * mapping, because a pointing device should put the paddle under the cursor.
 *
 * Whichever device was last actually used owns the paddle (`source`). Without
 * that, desktop hover-steer wins every tie — a mouse that hasn't moved in
 * minutes still reports a position, so releasing an arrow key would snap the
 * craft back to the cursor.
 *
 * Directional steering is deliberately one behaviour, not two: a press moves at
 * full speed from the very first frame, and releasing simply stops. No start-up
 * delay, no acceleration curve, no discrete per-tap step. An earlier design gave
 * taps their own fixed step and put a delay before continuous travel began, and
 * that reads as a stutter — jump, pause, go — three events where the player
 * asked for one.
 *
 * Releasing leaves the craft where it is, for both families. Self-centring is
 * available behind `PADDLE.returnMax` but is off: where you parked the paddle is
 * information you chose to put there, and pulling it home means re-aiming after
 * every press.
 */

/** Screen-span multiplier for absolute steering; >1 means less thumb travel. */
export const POINTER_GAIN = 1.34;
const TAP_MS = 240;
const TAP_PX = 12;

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;          // is a pointer down
    this.pointerId = null;
    this.screenX = 0;
    this.touchMode = false;

    this.keyLeft = false;
    this.keyRight = false;

    this.surgeRequested = false;
    this.pauseRequested = false;

    /** Which device last steered: 'none' | 'pointer' | 'keys' | 'pad'. */
    this.source = 'none';

    this._latch = 0;        // seconds a just-pressed key is still honoured for
    this._latchDir = 0;
    this._restTime = 0;     // seconds since any directional input

    this._downT = 0;
    this._downX = 0;
    this._downY = 0;
    this._moved = 0;
    this._padIndex = null;

    this._bind();
  }

  _bind() {
    const c = this.canvas;
    const opts = { passive: false };

    this._onDown = (e) => {
      if (this.pointerId !== null && e.pointerId !== this.pointerId) return;
      this.pointerId = e.pointerId;
      this.active = true;
      this.source = 'pointer';
      this.touchMode = e.pointerType !== 'mouse';
      this.screenX = e.clientX;
      this._downT = performance.now();
      this._downX = e.clientX;
      this._downY = e.clientY;
      this._moved = 0;
      // Throws if the pointer has already gone (fast taps, synthetic events).
      try { c.setPointerCapture?.(e.pointerId); } catch { /* not capturable */ }
      e.preventDefault();
    };

    this._onMove = (e) => {
      // Only a real movement reclaims control from the keyboard; browsers emit
      // pointermove for sub-pixel jitter and on window focus changes.
      const moved = Math.abs(e.clientX - this.screenX) > 1;

      if (e.pointerType === 'mouse') {
        // Hover-steer: on desktop the paddle tracks the cursor whether or not a
        // button is held. Note this deliberately ignores `pointerId` — that is
        // cleared on pointerup, and gating mouse movement on it means the
        // paddle freezes permanently after the player's first click.
        if (moved) this.source = 'pointer';
        this.screenX = e.clientX;
        this.touchMode = false;
        this.active = true;
        if (e.pointerId === this.pointerId) {
          this._moved = Math.max(this._moved, Math.hypot(e.clientX - this._downX, e.clientY - this._downY));
          e.preventDefault();
        }
        return;
      }

      // Touch and pen only steer while the finger that started it is down.
      if (e.pointerId !== this.pointerId) return;
      if (moved) this.source = 'pointer';
      this.screenX = e.clientX;
      this._moved = Math.max(this._moved, Math.hypot(e.clientX - this._downX, e.clientY - this._downY));
      e.preventDefault();
    };

    this._onUp = (e) => {
      if (e.pointerId !== this.pointerId) return;
      const dt = performance.now() - this._downT;
      if (dt < TAP_MS && this._moved < TAP_PX) this.surgeRequested = true;
      this.pointerId = null;
      if (this.touchMode) this.active = false;
      try { c.releasePointerCapture?.(e.pointerId); } catch { /* already released */ }
    };

    c.addEventListener('pointerdown', this._onDown, opts);
    window.addEventListener('pointermove', this._onMove, opts);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);

    this._onKeyDown = (e) => {
      switch (e.code) {
        // `if (!this.key*)` filters the OS key-repeat storm, so the latch is
        // armed once per physical press however long it is held.
        case 'ArrowLeft': case 'KeyA':
          if (!this.keyLeft) { this.keyLeft = true; this._arm(-1); }
          this.source = 'keys'; e.preventDefault(); break;
        case 'ArrowRight': case 'KeyD':
          if (!this.keyRight) { this.keyRight = true; this._arm(1); }
          this.source = 'keys'; e.preventDefault(); break;
        case 'Space': case 'ShiftLeft': this.surgeRequested = true; e.preventDefault(); break;
        case 'Escape': case 'KeyP': this.pauseRequested = true; break;
      }
    };
    this._onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keyLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keyRight = false;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    window.addEventListener('gamepadconnected', (e) => { this._padIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this._padIndex = null; });

    // Chrome fires a synthetic click after touch; block the resulting
    // scroll/zoom gestures outright.
    c.addEventListener('touchstart', (e) => e.preventDefault(), opts);
    c.addEventListener('gesturestart', (e) => e.preventDefault(), opts);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Arm the press latch so a very short tap still produces movement. */
  _arm(dir) { this._latchDir = dir; this._latch = PADDLE.minPress; }

  /** Poll the gamepad; returns an axis in -1..1 plus button edges. */
  _pollPad() {
    if (this._padIndex === null || !navigator.getGamepads) return 0;
    const gp = navigator.getGamepads()[this._padIndex];
    if (!gp) return 0;
    let ax = gp.axes[0] || 0;
    if (Math.abs(ax) < 0.14) ax = 0;
    const dl = !!gp.buttons[14]?.pressed, dr = !!gp.buttons[15]?.pressed;
    if (dl && !this._padL) this._arm(-1);
    if (dr && !this._padR) this._arm(1);
    this._padL = dl; this._padR = dr;
    if (dl) ax = -1;
    if (dr) ax = 1;
    if (gp.buttons[0]?.pressed && !this._padA) this.surgeRequested = true;
    this._padA = gp.buttons[0]?.pressed;
    if (gp.buttons[9]?.pressed && !this._padStart) this.pauseRequested = true;
    this._padStart = gp.buttons[9]?.pressed;
    return ax;
  }

  /**
   * @param {number} dt
   * @param {(screenX:number)=>number} mapAbsolute  screen px -> wall offset
   * @param {number} limit                          wall half-extent
   * @param {number} currentU
   * @param {number} sign   +1 if increasing `u` moves right on screen, else -1
   * @returns {number} the new wall offset
   */
  resolve(dt, mapAbsolute, limit, currentU, sign = 1) {
    const padAxis = this._pollPad();

    // Digital / analogue steering is relative and integrates over time.
    let axis = 0;
    if (this.keyLeft) axis -= 1;
    if (this.keyRight) axis += 1;
    if (padAxis !== 0) { axis = padAxis; this.source = 'pad'; }

    // Honour a press that was released before we got to look at it.
    if (axis === 0 && this._latch > 0) axis = this._latchDir;

    if (axis !== 0) {
      // Full speed on the first frame. No start-up delay, no acceleration
      // curve — the hull's own inertia is the only smoothing, and anything on
      // top of it is felt as the control hesitating.
      this._latch = Math.max(0, this._latch - dt);
      this._restTime = 0;
      const speed = PADDLE.moveSpeed * Math.min(1, Math.abs(axis));
      return clamp(currentU + Math.sign(axis) * sign * speed * dt, -limit, limit);
    }

    // Whichever device the player last actually used owns the paddle.
    //
    // Desktop hover-steer means a mouse that hasn't moved in minutes still
    // reports a position. Without this check, letting go of an arrow key falls
    // straight through to the pointer branch and the craft snaps back to
    // wherever the cursor happens to be sitting — which reads as the paddle
    // sliding off on its own the instant you stop steering.
    if (this.source === 'pointer') {
      // Held pointer: track it. Released finger: hold the last position, since
      // a positional control has no meaningful neutral to return to.
      return this.active ? clamp(mapAbsolute(this.screenX), -limit, limit) : currentU;
    }

    // Nothing is driving the paddle: leave it where the player put it. When
    // self-centring is enabled, `_recentre` walks it home from here instead.
    this._restTime += dt;
    return this._recentre(currentU, dt);
  }

  /**
   * Ease a released directional control back to the middle of the wall.
   *
   * Disabled by default (`PADDLE.returnMax === 0`), in which case this is a
   * no-op and the craft holds position.
   *
   * When enabled: constant speed rather than exponential, and ramped by *time
   * since input* rather than by distance from centre. Both choices matter:
   *
   *   · An exponential return is fastest when you are furthest out, which is
   *     precisely where a player is most likely to be trying to hold station.
   *     A time-ramped constant speed behaves the same wherever you are, so
   *     tap-to-park works at the edge exactly as it does near the middle.
   *   · Ramping from a slow start means the return is immediate — the craft
   *     moves on the very next frame — without being so quick off the mark
   *     that a single tap can't out-run it.
   */
  _recentre(currentU, dt) {
    const { returnSpeed, returnMax, returnRamp } = PADDLE;
    if (returnMax <= 0 || currentU === 0) return currentU;

    const k = returnRamp > 0 ? clamp(this._restTime / returnRamp, 0, 1) : 1;
    const speed = returnSpeed + (returnMax - returnSpeed) * k * k;

    const dir = Math.sign(currentU);
    const out = currentU - dir * speed * dt;
    return Math.sign(out) === dir ? out : 0;   // never overshoot past centre
  }

  consumeSurge() { const s = this.surgeRequested; this.surgeRequested = false; return s; }
  consumePause() { const p = this.pauseRequested; this.pauseRequested = false; return p; }

  /** Drop any held state — used when a screen opens over the game. */
  release() {
    this.active = false;
    this.pointerId = null;
    this.keyLeft = this.keyRight = false;
    this.surgeRequested = false;
    this.source = 'none';
    this._latch = 0;
    this._restTime = 0;
  }

  dispose() {
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
