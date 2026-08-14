/**
 * Central tuning. Everything that a designer would want to twist lives here.
 */

/**
 * --- arena geometry (a square with chamfered corners: 4 goals, 4 bumpers) ---
 *
 * The deck was widened from 13.6 to 19.0 to make room for the brick field and
 * the pinball wells. That is not decoration: the middle is where the game now
 * happens, and at the old size anything placed there sat in the goal approach
 * lanes. The chamfer grew with it (5.0 -> 9.6) so the octagon stays close to
 * regular rather than becoming a square with nicked corners — the diagonal
 * walls are the pinball surfaces, and short ones barely participate.
 *
 * Goal lines grew only 9% (17.2 -> 18.8) while the deck grew 40%, so a pilot's
 * job is very nearly as hard as it was; everything else is travel time, which
 * is exactly the pacing this rework is buying.
 */
export const ARENA = {
  half: 19.0,       // half-width of the square, centre -> goal wall
  chamfer: 9.6,     // how much of each corner is cut away
  wallH: 2.9,       // visual wall height
  floorY: 0,
  playY: 0.92,      // the plane everything moves on
};

/** Outward normals, in play order. 0 = south (player), then W, N, E. */
export const SIDES = [
  { key: 'S', nx: 0, nz: 1, ang: 0 },
  { key: 'W', nx: -1, nz: 0, ang: Math.PI * 0.5 },
  { key: 'N', nx: 0, nz: -1, ang: Math.PI },
  { key: 'E', nx: 1, nz: 0, ang: Math.PI * 1.5 },
];

export const PLAYERS = [
  { id: 0, name: 'YOU',    color: 0x24e2ff, deep: 0x0a7f96, css: '#24e2ff', craft: 'craft_speederC', human: true  },
  { id: 1, name: 'VEX',    color: 0xff2fa8, deep: 0x92135e, css: '#ff2fa8', craft: 'craft_speederB', human: false },
  { id: 2, name: 'KORR',   color: 0xffb020, deep: 0x8f5c05, css: '#ffb020', craft: 'craft_speederA', human: false },
  { id: 3, name: 'SABLE',  color: 0x86ff3d, deep: 0x43901a, css: '#86ff3d', craft: 'craft_speederD', human: false },
];

export const RULES = {
  startPoints: 5,
  /**
    * Ceiling on salvaged points. Bricks are the only way to gain points, and
    * without a cap a pilot who farms the middle can bank an unloseable lead
    * while the match quietly stops being able to end. Seven leaves real room
    * to build (+40%) and still puts every pilot inside a bad minute of being
    * in trouble.
    *
    * Measured, not guessed: at eight, `tools/playtest.mjs` produced a 260s
    * match that never resolved, with the last two pilots oscillating between
    * four and eight for a hundred seconds because salvage income matched the
    * goal drain exactly. See `BRICKS.perPoint` and `targetOrbCount` — all
    * three were pulled back together.
    */
  maxPoints: 7,
  /**
    * Salvage only pays out while at least this many pilots are alive. In the
    * final duel the deck stops handing points back.
    *
    * Every softer lever was tried first — a longer bank, a lower ceiling, a
    * field that thins as pilots die — and all of them only moved where the
    * equilibrium sat rather than removing it. Two competent pilots defending
    * two walls concede rarely enough that *any* steady income cancels the
    * drain, and `playtest.mjs` kept producing matches that sat at [6,4,0,0]
    * for ninety seconds with both survivors banking points as fast as they
    * dropped them.
    *
    * Closing the faucet outright makes points strictly monotonic in the
    * endgame, so a match can always end. It also reads as a rule rather than
    * as a tuning fudge: the middle game is the four-player escalation, and the
    * last two pilots settle it the way the game always did — on defence alone.
    */
  salvageMinPilots: 3,
  /**
    * Orb count over elapsed play time. Paced so a rally has room to develop
    * before the next orb lands — arriving too fast turns the deck from a duel
    * into noise, and the player has three walls' worth of rebounds to read.
    */
  orbSchedule: [
    { t: 0,  n: 1 },
    { t: 24, n: 2 },
    { t: 56, n: 3 },
    { t: 92, n: 4 },
  ],
  orbCapMobile: 3,
  respawnDelay: 1.05,
  serveDelay: 1.5,
};

/**
 * Arcade score. Deliberately a *separate* currency from the points on the pip
 * strip: those are lives, and tying a reward to them would let a good rally buy
 * survival, which is the one thing the match balance can't absorb (see the note
 * on `RULES.maxPoints`). Score costs the simulation nothing and can therefore
 * be as generous as it likes.
 */
export const SCORING = {
  perDeflect: 1,      // base award for a clean deflection
  /** Chain length per multiplier step: ×2 at 3, ×3 at 6, and so on. */
  chainPerStep: 3,
  maxMultiplier: 8,
};

export const PADDLE = {
  halfLen: 2.4,       // half the deflector width
  halfThick: 0.46,
  standoff: 2.45,     // distance from the goal wall plane
  maxSpeed: 40,       // units/sec at full tilt
  // How hard the hull tracks its target, and how quickly its velocity may
  // change. Both are tight: a directional press has to read as motion on the
  // very next frame, and any softness here is felt as input lag.
  damp: 26,
  track: 34,          // proportional gain, target -> desired velocity

  // --- directional (key / stick) feel ------------------------------------
  // Held input moves at a flat `moveSpeed` from the first frame. No start-up
  // delay and no ramp: both were tried and both read as a stutter, because a
  // discrete step followed by a pause followed by acceleration is three
  // separate events where the player asked for one.
  moveSpeed: 28,      // units/sec while a direction is held
  /**
    * Minimum time a press is honoured for, even if the key is released before
    * the next frame. A 30ms tap between two frames would otherwise vanish
    * entirely — the DOM sees keydown and keyup, the simulation sees neither.
    * This also sets the granularity of a tap: `minPress × moveSpeed` ≈ 1.3
    * units, the smallest deliberate step a player can make. A typical 70ms
    * tap covers about 2.
    */
  minPress: 0.045,

  /**
    * Optional self-centring, **off by default**.
    *
    * With `returnMax: 0` the craft simply stays where you left it, which is
    * what a paddle should do — where you parked it is information you chose to
    * put there, and taking it away means re-aiming after every single press.
    *
    * Set `returnMax` above zero to turn it back on: the return then starts on
    * the frame you release (no hold-off, which reads as lag) at `returnSpeed`,
    * ramping quadratically to `returnMax` over `returnRamp` seconds — gentle
    * at first so a brief release barely costs you, quick later so letting go
    * properly gets you home fast.
    */
  returnMax: 0,       // units/sec once fully ramped; 0 = hold position
  returnSpeed: 3.5,   // units/sec the instant you release
  returnRamp: 0.45,   // seconds of no input to reach returnMax

  bankMax: 0.62,      // radians of roll when strafing
  hover: 0.16,        // bob amplitude
};

/**
 * The ARC — a lightning fence that unzips from both ends of your craft and
 * seals your whole goal line for a few seconds. Nothing gets past it.
 *
 * Deliberately expensive: at a 15s cooldown and 2.6s of uptime it is about 17%
 * coverage, so it rescues a moment you'd otherwise lose rather than replacing
 * the act of defending. Every pilot gets one, including the AI — an ability
 * only the human has would quietly rewrite the difficulty curve, and it would
 * be invisible to the seat-symmetry harness.
 */
export const ARC = {
  cooldown: 15,       // seconds to recharge from empty
  startCharge: 0.55,  // fraction charged at the opening whistle
  duration: 2.6,      // seconds the fence stays up
  height: 2.2,        // visual height of the fence
  openTime: 0.18,     // seconds to unzip open (and to collapse)
  fadeTime: 0.3,      // seconds to fade out after expiry
  speedGain: 0.9,     // added to orb speed on a bounce
  english: 0.34,      // how much craft motion curves the bounce
};

export const ORB = {
  radius: 0.52,
  baseSpeed: 13.2,
  maxSpeed: 33,
  rallyGain: 0.34,    // speed added per deflection
  paddleBoost: 1.05,  // extra on a player deflection
  spinInfluence: 0.26,// how much paddle velocity curves the return
  angleInfluence: 0.78,
  minAngle: 0.30,     // rad; keeps orbs from crawling along a wall

  /**
    * Speed bleed. Above `cruise` an orb sheds `bleed` units/sec² until it
    * settles back down; below it, nothing happens.
    *
    * This exists because the pinball wells are speed *sources*. Without a sink
    * the first orb to find a bumper cluster pins itself at `maxSpeed` and stays
    * there for the rest of the match, and four of those is the fast, unreadable
    * game this rework is trying to get away from. The threshold is set above
    * normal rally speeds so an ordinary exchange is untouched — only bumper
    * energy decays, which makes a kicked orb a passing danger you wait out
    * rather than a permanent change to the match.
    */
  cruise: 19,
  bleed: 2.4,
};

/**
 * The brick field.
 *
 * A ring of breakable blocks filling the middle of the deck. They do three
 * things at once: they slow orbs down on contact, they scatter shots so the
 * lane between two goals is never straight for long, and they are the only
 * source of points in the game — shatter one and whoever last touched the orb
 * banks salvage.
 *
 * The layout is regenerated every match but always laid out with four-fold
 * rotational symmetry, so every seat faces exactly the same field. That is a
 * hard requirement rather than an aesthetic one: `tools/balance.mjs` reads seat
 * win rates to detect rule bias, and an asymmetric field would show up there as
 * unfairness that no amount of tuning could remove.
 */
export const BRICKS = {
  perQuadrant: 3,     // layout slots; total = 4x this

  /**
    * Hard ceiling on blocks standing at once, enforced against both the
    * surfacing schedule and the regeneration of broken ones.
    *
    * The layout has twelve slots and only eight may ever be occupied, which is
    * the point: which four are empty keeps changing, so the field is never the
    * same obstacle course twice even within a single match, and the middle
    * stays sparse enough to read the orb through. A block whose regen timer
    * expires while the field is full simply waits its turn.
    */
  maxLive: 8,

  /**
    * The ceiling also scales with how many pilots are left: `perAlive` blocks
    * each, capped by `maxLive`.
    *
    * This is the endgame valve. Goals get rarer as pilots are eliminated — two
    * survivors defending two walls concede far less often than four defending
    * four — while a fixed field keeps paying salvage out at the same rate. At a
    * flat ceiling `tools/playtest.mjs` produced a match that sat at [6,3,0,0]
    * for ninety-five seconds, both survivors banking points as fast as they
    * dropped them. Thinning the field exactly when the drain thins keeps the
    * two moving together, and it reads as the deck running out of material
    * rather than as a rule.
    */
  perAlive: 2,

  /**
    * The deck starts **empty** and grows its own hazards.
    *
    * Blocks rise out of the floor one at a time. This is the pacing arc: the
    * opening is the clean duel the game has always been, and by ninety seconds
    * the middle is a cluttered obstacle course that no shot crosses unmolested.
    * Escalating the deck rather than starting cluttered also keeps the first
    * half-minute readable for someone who has never seen the game.
    *
    * The spawn *order* walks the quadrants — block 0 of each quadrant, then
    * block 1, and so on. The layout is four-fold symmetric, so this means the
    * field returns to perfect symmetry every four spawns and is never more than
    * three blocks away from it. That matters because `tools/balance.mjs` reads
    * seat win rates as the signal for rule bias; surfacing all of one quadrant
    * before starting the next would hand one pilot a private obstacle course
    * for a minute at a time.
    */
  spawnFirst: 8,      // seconds of play before the first block rises
  spawnEvery: 5,      // seconds between blocks
  w: 2.35,            // long axis
  d: 1.18,            // short axis
  h: 1.3,             // height above the deck — the orb plane sits ~70% up it
  bevel: 0.11,

  innerR: 4.6,        // keep-out around the serve point
  outerR: 12.6,       // stay well clear of the goal approach lanes
  minGap: 0.72,       // clear space between neighbouring blocks
  wellClear: 2.0,     // clear space around a pinball element — wide enough for
                      // an orb to pass between the two when they deploy

  /** Hit points by radius: tougher toward the middle, so the core is a prize. */
  hpInner: 3,
  hpOuter: 2,
  hpSplit: 8.4,       // radius where the inner band ends

  slow: 0.55,         // speed shed per contact — bricks are the pacing brake
  /**
    * Bricks shattered per point awarded. The single most load-bearing number
    * here: bricks break often (an orb crossing the field contacts one roughly
    * every half second), so paying out a point per brick would inflate faster
    * than goals could deflate and matches would stop resolving. Salvage banks
    * the breaks and pays out rarely, which keeps the faucet well under the
    * drain while still making every shatter feel like progress.
    *
    * Ten. It was nine when the field was 28 blocks standing from the opening
    * whistle, and that stopped matches resolving once they were down to two
    * pilots — goals get rarer as pilots are eliminated while the field pays out
    * at exactly the same rate. It went to thirteen to fix that, and back to ten
    * once the field was cut to sixteen blocks that arrive over the first ninety
    * seconds, which cut income far more than the ratio ever did. Measured with
    * `tools/playtest.mjs` at every step.
    */
  perPoint: 12,
  regen: 13,          // seconds a shattered block stays down
  reformTime: 0.85,   // seconds to fade and scale back in
  breakTime: 0.42,    // seconds of shatter animation
};

/**
 * Pinball furniture: four "chaos wells", one per quadrant, sitting on the
 * diagonals between the goals.
 *
 * Each well is two pop bumpers with a slingshot behind them. An orb that
 * wanders in rattles between the bumpers, gaining speed, until the slingshot
 * fires it back across the deck. Deliberately placed off the goal axes — a
 * well in front of someone's wall would be a random goal generator rather than
 * a feature you can play around.
 */
export const PINBALL = {
  /**
    * Master switch, currently **off**. The well is built, tuned and tested —
    * including the roaming single-site behaviour below — but the deck is being
    * played without it. With this false nothing is constructed, nothing is
    * added to the scene, no collision runs and the HUD readout is hidden; flip
    * it to bring the well back exactly as described.
    */
  enabled: false,

  /**
    * **One well at a time**, and never for long.
    *
    * There are four sites, one per quadrant on the diagonals, but only ever one
    * is up: it surfaces at a site, runs for fourteen seconds, sinks, and thirty
    * seconds later the *next* site along opens instead. Starts down, so the
    * opening exchange is played on a clean deck.
    *
    * A cycle rather than a fixture because a permanent well is a permanent tax
    * on one region of the deck — you learn where it is and simply stop sending
    * orbs there. Something that appears somewhere new every three-quarters of a
    * minute has to be replanned around each time, and it gives the match a
    * rhythm: a tense stretch where one corner is dangerous, then a calm one.
    *
    * Stepping the site each deployment is also what keeps it fair. A single
    * live well obviously cannot be four-fold symmetric the way the brick field
    * is, so instead every seat gets the same exposure over a match and no
    * pilot ever gets it twice running — the same treatment the singularity
    * gets, for the same reason.
    */
  upTime: 14,         // seconds deployed
  downTime: 30,       // seconds retracted before the next site opens
  warnTime: 1.1,      // telegraph before it punches up through the deck
  riseTime: 0.55,     // seconds to travel up or down

  wellR: 10.4,        // distance from centre to the bumper pair
  bumperGap: 1.62,    // tangential offset of each bumper from the well axis
  bumperR: 0.95,
  bumperH: 1.55,      // tapered so its true radius lands on the orb's own plane

  kick: 3.4,          // speed added per bumper pop
  kickFloor: 17,      // a pop never leaves an orb slower than this
  scatter: 0.16,      // rad of random spray, so a well never loops forever

  slingBack: 2.35,    // how far behind the bumpers the slingshot face sits
  slingHalf: 2.2,     // half-length of the face
  slingH: 1.05,       // kept low: it is furniture, not a wall
  slingDepth: 1.35,   // collider depth; the wedge is solid, not just a face
  slingSpeed: 25.5,   // the face fires at a fixed speed, pinball-style
  slingSpread: 0.62,  // how much contact offset angles the shot
  cool: 0.09,         // seconds before the same element can fire again
};

/**
 * The singularity.
 *
 * One black hole, occasionally, somewhere off-centre. While it is open every
 * orb inside its reach is pulled toward it and its path bends into an arc —
 * shots do not travel in straight lines any more, and a return you aimed at a
 * wall arrives somewhere else entirely.
 *
 * ### It turns orbs, it does not speed them up
 *
 * The pull is applied as an acceleration and then the velocity is renormalised
 * back to the orb's own speed. Real gravity would trade potential for kinetic
 * energy and spit the orb out faster than it arrived, which would wreck a speed
 * model the whole game is tuned around — rally escalation, the audio intensity
 * curve, the AI's reaction budget. Turning without accelerating gives exactly
 * the thing that was asked for (an arc) and costs nothing elsewhere.
 *
 * ### It cannot capture an orb
 *
 * A circular orbit at radius r needs v²/r of inward acceleration. Against the
 * slowest orb in the game, and at every radius inside the field, what this
 * supplies is at least three times short of that — the pull falls off toward
 * the boundary faster than the orbit requirement does, so the margin is
 * smallest in the middle distances and still comfortable there. No orb can be
 * trapped; the worst case is a hard bend. Worth having as a property of the
 * numbers rather than as something playtesting failed to find, because a
 * captured orb is a soft-locked match.
 *
 * ### Fairness
 *
 * A single object cannot be four-fold symmetric the way the brick field is, so
 * instead each appearance steps to the next quadrant in order. Over a match
 * every seat gets the same exposure, and no pilot ever gets it twice running.
 */
export const BLACKHOLE = {
  enabled: true,
  first: 26,          // seconds of match time before the first one opens
  duration: 11,       // seconds it stays open
  cooldown: 44,       // seconds between them — deliberately a rare event
  warnTime: 1.4,      // telegraph before it tears open
  openTime: 0.9,      // seconds to spin up to full strength, and to close

  spawnR: 7.4,        // distance from the deck centre
  radius: 6.6,        // reach of the pull
  pull: 20,           // peak acceleration, units/sec² — about 30° of bend on a
                      // crossing, more the closer to the core it passes
  coreR: 0.95,        // the dark core
  discR: 2.9,         // accretion disc
  clearance: 2.2,     // keep-out from standing blocks when picking a spot
};

/**
 * `err` is in world units of aim error against a 4.8-unit-wide deflector, so
 * roughly: ROOKIE misses often, PILOT clips the edge, ACE is on the sweet spot.
 * `speed` throttles how fast a rival can chase the ideal spot — the honest
 * lever, since it fails the way a slow human fails rather than by pretending
 * not to see the orb.
 */
export const DIFFICULTY = [
  { name: 'ROOKIE', react: 0.34, err: 3.6, speed: 0.51, aggression: 0.25 },
  { name: 'PILOT',  react: 0.22, err: 2.3, speed: 0.66, aggression: 0.45 },
  { name: 'ACE',    react: 0.13, err: 1.2, speed: 0.82, aggression: 0.70 },
];
