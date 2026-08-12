import { predictArrival } from './collide.js';
import { ARENA, ORB, PADDLE, SIDES } from '../core/config.js';
import { clamp, damp, lerp, rand } from '../core/math.js';

/**
 * Rival pilots.
 *
 * The interesting part of an opponent in a game like this isn't whether it can
 * reach the orb — perfect interception is trivial and unbeatable. It's whether
 * it looks like it is *thinking*. So this AI does three separable things:
 *
 *   1. Reads the table: forward-simulates every live orb to find which one
 *      threatens its wall first.
 *   2. Aims: picks a victim, then works backwards from the desired return
 *      angle to the exact spot on its deflector the orb must strike.
 *   3. Fails plausibly: reaction lag, aim error that tightens as the orb
 *      closes, a speed ceiling, and idle drift.
 *
 * Difficulty scales (3) alone. (1) and (2) stay sharp at every level, because
 * an opponent that plays badly is far less fun than one that plays well and
 * occasionally can't quite get there.
 */

export class AI {
  /**
   * @param {import('./craft.js').Craft} craft
   * @param {object} diff  entry from DIFFICULTY
   */
  constructor(craft, diff, planes) {
    this.craft = craft;
    this.diff = diff;
    this.planes = planes;

    this.reactTimer = 0;
    this.aimError = 0;
    this.desiredU = 0;
    this.threatId = -1;
    this.victim = -1;
    this.idlePhase = rand(0, Math.PI * 2);
    this.commitTime = 0;
    this.panic = 0;
  }

  /** Choose whose goal to aim at. Recomputed each time we commit to a shot. */
  _pickVictim(crafts, scores) {
    const me = this.craft.index;
    const options = [];
    for (let i = 0; i < 4; i++) {
      if (i === me || !crafts[i].alive) continue;
      // Prefer finishing off whoever is closest to elimination, and lean on
      // the human a little at higher aggression — rivals should feel personal.
      let w = 1 + (6 - scores[i]) * 0.45;
      // A lean toward the human, kept deliberately small. Measured with
      // tools/balance.mjs: at 0.35 the human's seat was knocked out first in
      // 5 matches out of 10, because three rivals each biased 16% toward one
      // wall compounds into a real disadvantage. 0.15 preserves the sense of
      // being singled out without stacking the deck.
      if (i === 0) w *= 1 + this.diff.aggression * 0.15;
      // Don't hammer the same pilot twice running.
      if (i === this.victim) w *= 0.45;
      options.push([i, w]);
    }
    if (!options.length) return -1;
    let total = 0;
    for (const [, w] of options) total += w;
    let r = Math.random() * total;
    for (const [i, w] of options) { r -= w; if (r <= 0) return i; }
    return options[0][0];
  }

  /**
   * Lateral offset on our deflector that returns the orb toward `victim`.
   * Inverts the deflection model in collide.js: the outgoing tangential ratio
   * is `offset * angleInfluence`, so the offset we need is that ratio scaled.
   */
  _aimOffset(victim, arrivalLateral) {
    const c = this.craft;
    if (victim < 0) return 0;
    const vs = SIDES[victim];

    // Aim at a point on the victim's goal line, biased away from dead centre
    // so returns aren't all trivially blockable.
    const bias = rand(-0.55, 0.55) * (ARENA.half - ARENA.chamfer);
    const tx = -vs.nz, tz = vs.nx;
    const px = vs.nx * ARENA.half + tx * bias;
    const pz = vs.nz * ARENA.half + tz * bias;

    // Our paddle will be somewhere near the arrival lateral; good enough.
    const d = c.standoffDist;
    const ox = c.nx * d + c.tx * arrivalLateral;
    const oz = c.nz * d + c.tz * arrivalLateral;

    const dx = px - ox, dz = pz - oz;
    const dT = dx * c.tx + dz * c.tz;
    const dN = dx * -c.nx + dz * -c.nz;      // inward component
    if (dN <= 0.5) return 0;

    const ratio = clamp(dT / dN, -1.2, 1.2);
    return clamp(ratio / ORB.angleInfluence, -0.92, 0.92);
  }

  update(dt, orbs, crafts, scores) {
    const c = this.craft;
    if (!c.alive) return;

    // ---- 1. find the soonest threat ---------------------------------------
    let best = null, bestOrb = null;
    for (const o of orbs) {
      if (!o.active) continue;
      const hit = predictArrival(o, this.planes, c.index, 5);
      if (!hit) continue;
      if (!best || hit.time < best.time) { best = hit; bestOrb = o; }
    }

    this.reactTimer -= dt;

    if (best) {
      const changed = bestOrb.id !== this.threatId || best.time > this.commitTime + 0.35;
      if (changed && this.reactTimer <= 0) {
        this.threatId = bestOrb.id;
        this.reactTimer = this.diff.react * rand(0.7, 1.35);
        this.victim = this._pickVictim(crafts, scores);
        // Error is drawn once per commitment, then relaxed as the orb closes,
        // so the pilot looks like it is refining an estimate rather than
        // jittering randomly.
        this.aimError = rand(-1, 1) * this.diff.err * rand(0.6, 1.4);
      }
      this.commitTime = best.time;

      const offset = this._aimOffset(this.victim, best.lateral);
      const wantContact = offset * c.halfLen;

      // Error shrinks with time-to-impact: last-instant corrections are the
      // one thing every decent player can do.
      const closeness = clamp(1 - best.time / 1.6, 0, 1);
      const err = this.aimError * (1 - closeness * 0.82);

      this.desiredU = best.lateral - wantContact + err;

      // Panic when the orb is fast and far off-centre — drives a surge.
      this.panic = clamp((Math.abs(best.lateral - c.u) / 8) * (1 - best.time / 1.2), 0, 1);

      if (this.panic > 0.55 && best.time < 0.55 && c.surge >= 1 && Math.random() < this.diff.aggression * dt * 22) {
        c.trySurge();
      }
    } else {
      // ---- 2. idle: hold near centre with a slow drift --------------------
      this.idlePhase += dt * 0.55;
      const home = Math.sin(this.idlePhase) * (ARENA.half - ARENA.chamfer) * 0.30;
      this.desiredU = lerp(this.desiredU, home, 1 - Math.exp(-dt * 1.6));
      this.panic = 0;
    }

    // ---- 3. movement ceiling ------------------------------------------------
    // Rather than clamping the craft's own speed (which would also blunt its
    // animation), we throttle how fast the *target* can chase the ideal spot.
    const maxRate = PADDLE.maxSpeed * this.diff.speed * (1 + this.panic * 0.25);
    const cur = c.targetU;
    const delta = clamp(this.desiredU - cur, -maxRate * dt, maxRate * dt);
    c.steer(cur + delta);
  }
}
