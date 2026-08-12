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
  accel: 320,
  damp: 13,
  /**
    * How fast the deflector springs back to the middle of its wall once a
    * relative control (key / stick) is released, in 1/sec. Exponential, so
    * it leaves the edge quickly and eases into the centre. 0 disables the
    * return and the craft simply holds where you left it.
    */
  recenterRate: 7,
  bankMax: 0.62,      // radians of roll when strafing
  hover: 0.16,        // bob amplitude
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
