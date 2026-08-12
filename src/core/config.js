/**
 * Central tuning. Everything that a designer would want to twist lives here.
 */

// --- arena geometry (a square with chamfered corners: 4 goals, 4 bumpers) ---
export const ARENA = {
  half: 13.6,       // half-width of the square, centre -> goal wall
  chamfer: 5.0,     // how much of each corner is cut away
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
  baseSpeed: 14.5,
  maxSpeed: 33,
  rallyGain: 0.34,    // speed added per deflection
  paddleBoost: 1.05,  // extra on a player deflection
  spinInfluence: 0.26,// how much paddle velocity curves the return
  angleInfluence: 0.78,
  minAngle: 0.30,     // rad; keeps orbs from crawling along a wall
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
