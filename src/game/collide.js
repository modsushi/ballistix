import { ARENA, ORB, PADDLE } from '../core/config.js';
import { clamp } from '../core/math.js';

/**
 * Orb integration and contact resolution.
 *
 * Movement is substepped so no orb ever travels more than a fraction of a
 * paddle's thickness between tests. At 40 units/sec on a 30fps phone an
 * unstepped orb moves 1.33 units per frame against a 0.92-unit-thick deflector
 * — it would pass straight through. Substepping is not optional here.
 */

const MAX_STEP = 0.22;   // world units of travel per substep

/** Enforce a minimum angle away from a wall so orbs can't crawl along it. */
function unstick(vx, vz, nx, nz, speed) {
  // Component heading into the wall we just left must clear sin(minAngle).
  const along = vx * -nz + vz * nx;       // tangential
  const away = vx * -nx + vz * -nz;       // inward, away from the wall
  const minAway = Math.sin(ORB.minAngle) * speed;
  if (away >= minAway) return [vx, vz];
  const sgn = along >= 0 ? 1 : -1;
  const newAway = minAway;
  const newAlong = sgn * Math.sqrt(Math.max(0, speed * speed - newAway * newAway));
  return [
    -nz * newAlong + -nx * newAway,
    nx * newAlong + -nz * newAway,
  ];
}

/**
 * @param {object} o        orb
 * @param {number} dt
 * @param {object} ctx      { planes, crafts, events }
 *
 * `events` collects { type, ... } records for the caller to turn into audio,
 * particles and score changes. Keeping resolution free of side effects makes
 * the substep loop safe to run many times per frame.
 */
export function stepOrb(o, dt, ctx) {
  const { planes, crafts, events } = ctx;

  let remaining = dt;
  let guard = 0;
  while (remaining > 1e-6 && guard++ < 64) {
    const speed = Math.hypot(o.vx, o.vz) || 1e-4;
    const step = Math.min(remaining, MAX_STEP / speed);
    remaining -= step;

    o.x += o.vx * step;
    o.z += o.vz * step;

    // ---- paddles ---------------------------------------------------------
    for (const c of crafts) {
      if (!c.alive) continue;
      const vn = o.vx * c.nx + o.vz * c.nz;
      if (vn <= 0) continue;                 // not heading at this wall

      const d = c.standoffDist;
      const relX = o.x - c.nx * d - c.tx * c.u;
      const relZ = o.z - c.nz * d - c.tz * c.u;
      const lt = relX * c.tx + relZ * c.tz;      // along the wall
      const ln = relX * c.nx + relZ * c.nz;      // out through the wall
      if (ln > 0) continue;                      // already behind the deflector

      const hl = c.effHalfLen;
      const ct = clamp(lt, -hl, hl);
      const cn = clamp(ln, -c.halfThick, c.halfThick);
      const ddt = lt - ct, ddn = ln - cn;
      if (ddt * ddt + ddn * ddn > ORB.radius * ORB.radius) continue;

      // ---- deflect ------------------------------------------------------
      const offset = clamp(lt / hl, -1, 1);
      const english = clamp(c.vu / PADDLE.maxSpeed, -1, 1) * ORB.spinInfluence;
      let aT = offset * ORB.angleInfluence + english;
      aT = clamp(aT, -1.35, 1.35);

      // Outgoing: inward along -n, deflected sideways by where it landed.
      let dirT = aT, dirN = -1;
      const inv = 1 / Math.hypot(dirT, dirN);
      dirT *= inv; dirN *= inv;

      const surge = c.surgeActive > 0 ? 1 : 0;
      let ns = Math.min(
        ORB.maxSpeed,
        speed + ORB.rallyGain + ORB.paddleBoost + surge * 3.4,
      );

      o.vx = (c.tx * dirT + c.nx * dirN) * ns;
      o.vz = (c.tz * dirT + c.nz * dirN) * ns;
      o.speed = ns;
      o.rally++;
      o.lastHitBy = c.index;

      // Push clear of the deflector so the next substep can't re-trigger.
      const sep = ORB.radius + c.halfThick + 0.02;
      o.x = c.nx * d + c.tx * c.u + c.tx * ct - c.nx * sep;
      o.z = c.nz * d + c.tz * c.u + c.tz * ct - c.nz * sep;

      o.registerImpact(-c.nx, -c.nz, 0.85 + surge * 0.5);
      events.push({
        type: 'deflect', orb: o, craft: c, u01: (offset + 1) * 0.5,
        power: 0.7 + surge * 0.6, speed: ns, x: o.x, z: o.z,
      });
      break;
    }

    // ---- walls & goals ---------------------------------------------------
    for (const p of planes) {
      const dist = o.x * p.nx + o.z * p.nz;
      if (dist + ORB.radius <= p.d) continue;

      if (p.goal >= 0) {
        const lateral = o.x * -p.nz + o.z * p.nx;
        const craft = crafts[p.goal];
        if (craft.alive && Math.abs(lateral) <= p.halfWidth) {
          // Retire it here, not in the event handler: orb-vs-orb runs
          // between the two and would otherwise clash against a scored orb.
          o.active = false;
          events.push({
            type: 'goal', orb: o, victim: p.goal, x: o.x, z: o.z,
            u01: clamp(lateral / p.halfWidth, -1, 1) * 0.5 + 0.5,
          });
          return;                       // orb is consumed; stop integrating
        }
      }

      // Reflect.
      const over = dist + ORB.radius - p.d;
      o.x -= p.nx * over * 1.02;
      o.z -= p.nz * over * 1.02;
      const vn = o.vx * p.nx + o.vz * p.nz;
      if (vn > 0) {
        o.vx -= 2 * vn * p.nx;
        o.vz -= 2 * vn * p.nz;
      }
      const sp = Math.min(ORB.maxSpeed, Math.hypot(o.vx, o.vz) + ORB.rallyGain * 0.35);
      const [ux, uz] = unstick(o.vx, o.vz, p.nx, p.nz, sp);
      const ul = Math.hypot(ux, uz) || 1;
      o.vx = (ux / ul) * sp;
      o.vz = (uz / ul) * sp;
      o.speed = sp;
      o.registerImpact(-p.nx, -p.nz, 0.55);

      events.push({
        type: p.goal >= 0 ? 'sealed' : 'wall',
        orb: o, x: o.x, z: o.z, nx: p.nx, nz: p.nz, speed: sp, goal: p.goal,
      });
      break;
    }
  }
}

/**
 * Equal-mass elastic exchange along the contact normal, plus positional
 * separation. Orbs keep their own speeds — only the directions trade — which
 * keeps the rally from either dying out or running away.
 */
export function collideOrbs(orbs, events) {
  const R2 = (ORB.radius * 2) * (ORB.radius * 2);
  for (let i = 0; i < orbs.length; i++) {
    const a = orbs[i];
    if (!a.active) continue;
    for (let j = i + 1; j < orbs.length; j++) {
      const b = orbs[j];
      if (!b.active) continue;
      let dx = b.x - a.x, dz = b.z - a.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > R2 || d2 < 1e-8) continue;

      const d = Math.sqrt(d2);
      dx /= d; dz /= d;

      const rel = (b.vx - a.vx) * dx + (b.vz - a.vz) * dz;
      if (rel < 0) {
        a.vx += rel * dx; a.vz += rel * dz;
        b.vx -= rel * dx; b.vz -= rel * dz;
        // Renormalise so neither orb loses or gains energy from the swap.
        const la = Math.hypot(a.vx, a.vz) || 1, lb = Math.hypot(b.vx, b.vz) || 1;
        a.vx = (a.vx / la) * a.speed; a.vz = (a.vz / la) * a.speed;
        b.vx = (b.vx / lb) * b.speed; b.vz = (b.vz / lb) * b.speed;

        a.registerImpact(-dx, -dz, 0.6);
        b.registerImpact(dx, dz, 0.6);
        events.push({
          type: 'orbclash', x: a.x + dx * ORB.radius, z: a.z + dz * ORB.radius,
          speed: Math.max(a.speed, b.speed),
        });
      }

      const push = (ORB.radius * 2 - d) * 0.5 + 0.001;
      a.x -= dx * push; a.z -= dz * push;
      b.x += dx * push; b.z += dz * push;
    }
  }
}

/**
 * Forward-simulate an orb against the arena walls to find where it will cross
 * a given pilot's goal line, and when. Used by the AI — deliberately ignores
 * paddles and other orbs, so the AI plans against the ball's *current* course
 * exactly the way a human reading the table would.
 *
 * @returns {{lateral:number, time:number}|null}
 */
export function predictArrival(o, planes, sideIndex, maxTime = 4) {
  let x = o.x, z = o.z, vx = o.vx, vz = o.vz;
  const goalPlane = planes[sideIndex];
  let t = 0;

  for (let bounce = 0; bounce < 10 && t < maxTime; bounce++) {
    // Nearest plane the current ray will reach.
    let best = Infinity, bestP = null;
    for (const p of planes) {
      const denom = vx * p.nx + vz * p.nz;
      if (denom <= 1e-6) continue;
      const dist = (p.d - ORB.radius) - (x * p.nx + z * p.nz);
      const tt = dist / denom;
      if (tt > 1e-5 && tt < best) { best = tt; bestP = p; }
    }
    if (!bestP || !isFinite(best)) return null;

    t += best;
    x += vx * best;
    z += vz * best;

    if (bestP === goalPlane) {
      return { lateral: x * -goalPlane.nz + z * goalPlane.nx, time: t };
    }

    const vn = vx * bestP.nx + vz * bestP.nz;
    vx -= 2 * vn * bestP.nx;
    vz -= 2 * vn * bestP.nz;
  }
  return null;
}
