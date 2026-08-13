import * as THREE from 'three';
import { Sparks } from '../gfx/particles.js';
import { ARENA, PLAYERS } from '../core/config.js';
import { ELEMENT_COLOR } from './pinball.js';
import { PINBALL } from '../core/config.js';
import { clamp, lerp, rand } from '../core/math.js';

/** The warning ring contracts over exactly the telegraph window, so what the
 *  player sees closing is literally the time they have left. */
const PIN_WARN = PINBALL.warnTime;

/**
 * Turns gameplay events into spectacle.
 *
 * Isolated from the simulation on purpose: `game.js` produces a flat list of
 * facts ("orb 2 was deflected by craft 1 at speed 27") and this module decides
 * what that looks and sounds like. Retuning game feel therefore never risks
 * touching the rules, and the physics stays deterministic regardless of what
 * the quality tier decides to draw.
 */

// ---------------------------------------------------------------------------
// Expanding rings, pooled. Used for anything that needs to read as a
// pressure wave rather than a spray of debris.
// ---------------------------------------------------------------------------
class RingPool {
  constructor(scene, count = 10) {
    this.items = [];
    const geo = new THREE.RingGeometry(0.78, 1.0, 48, 1);
    geo.rotateX(-Math.PI / 2);
    this.geo = geo;

    for (let i = 0; i < count; i++) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: new THREE.Color(1, 1, 1) },
          uFade: { value: 0 },
        },
        vertexShader: `varying vec2 vU; void main(){ vU=uv;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `precision mediump float; varying vec2 vU;
          uniform vec3 uColor; uniform float uFade;
          void main(){
            // Soft across the band, hard-ish on the leading edge.
            float a = smoothstep(0.0,0.35,vU.y) * smoothstep(1.0,0.55,vU.y);
            a *= uFade;
            gl_FragColor = vec4(uColor*a*2.2, a);
          }`,
      });
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      m.renderOrder = 5;
      scene.add(m);
      this.items.push({ mesh: m, mat, life: 0, dur: 1, from: 1, to: 6, tilt: 0 });
    }
    this.cursor = 0;
  }

  spawn(x, y, z, from, to, dur, color, tilt = 0, rotY = 0) {
    let it = this.items.find((i) => i.life <= 0);
    if (!it) { it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % this.items.length; }
    it.life = dur; it.dur = dur; it.from = from; it.to = to; it.tilt = tilt;
    it.mesh.position.set(x, y, z);
    it.mesh.rotation.set(tilt, rotY, 0);
    it.mesh.visible = true;
    it.mat.uniforms.uColor.value.set(color).convertSRGBToLinear();
    it.mat.uniforms.uFade.value = 1;
    return it;
  }

  update(dt) {
    for (const it of this.items) {
      if (it.life <= 0) continue;
      it.life -= dt;
      if (it.life <= 0) { it.mesh.visible = false; continue; }
      const k = 1 - it.life / it.dur;
      // Ease-out expansion: fast start, long settle. Matches how a real
      // pressure wave loses speed and is far more readable than linear.
      const e = 1 - Math.pow(1 - k, 2.6);
      const r = lerp(it.from, it.to, e);
      it.mesh.scale.set(r, r, r);
      it.mat.uniforms.uFade.value = Math.pow(1 - k, 1.7);
    }
  }

  dispose() {
    this.geo.dispose();
    for (const it of this.items) { it.mat.dispose(); it.mesh.parent?.remove(it.mesh); }
  }
}

// ---------------------------------------------------------------------------

export class Effects {
  constructor(scene, arena, camera, audio, preset) {
    this.scene = scene;
    this.arena = arena;
    this.cam = camera;
    this.audio = audio;
    this.preset = preset;

    this.sparks = new Sparks(preset.sparks, Math.min(devicePixelRatio || 1, 2));
    scene.add(this.sparks.points);
    this.rings = new RingPool(scene, preset.sparks > 400 ? 12 : 7);

    // Flash + slow-motion requests are read and cleared by the game loop.
    this.flash = 0;
    this.flashColor = new THREE.Color(1, 1, 1);
    this.radial = 0;
  }

  setPixelRatio(pr) { this.sparks.setPixelRatio(pr); }

  update(dt, camera) {
    this.sparks.update(dt, camera);
    this.rings.update(dt);
    this.flash = Math.max(0, this.flash - dt * 4.2);
    this.radial = Math.max(0, this.radial - dt * 3.4);
  }

  // ----------------------------------------------------------- deflection --
  /** @param {object} e event from collide.js */
  deflect(e) {
    const c = e.craft;
    const p = PLAYERS[c.index];
    const speed01 = clamp((e.speed - 15) / 25, 0, 1);
    const dirx = -c.nx, dirz = -c.nz;

    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      dir: [dirx, 0.35, dirz],
      spread: 0.62,
      count: Math.round(lerp(8, 20, speed01) * (this.preset.sparks / 520 + 0.4)),
      speedMin: 6, speedMax: 16 + speed01 * 14,
      lifeMin: 0.16, lifeMax: 0.42,
      sizeMin: 5, sizeMax: 13,
      color: p.color, color2: 0xffffff,
      kind: 1, drag: 3.4, grav: -7, jitter: 0.3,
    });

    // A tight flat ring on the deck marks exactly where contact happened.
    this.rings.spawn(e.x, ARENA.playY - 0.75, e.z, 0.25, 2.4 + speed01 * 1.6, 0.42, p.color);
    this.arena.shock(e.x, e.z, 0.55 + speed01 * 0.5, p.color);
    this.arena.hitBarrier(c.index, e.u01, 0.18);

    c.onDeflect(e.u01, e.power);
    this.audio.deflect(speed01, 0.75 + e.power * 0.35, c.index / 3);

    if (c.index === 0) {
      this.cam.shake(0.09 + speed01 * 0.10);
      this.cam.punch(0.7 + speed01 * 0.9);
    } else {
      this.cam.shake(0.035 + speed01 * 0.03);
    }
  }

  // ----------------------------------------------------------------- wall --
  wall(e) {
    const speed01 = clamp((e.speed - 15) / 25, 0, 1);
    const tint = e.goal >= 0 ? 0xffa63d : 0x5fd8ff;
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      dir: [-e.nx, 0.5, -e.nz],
      spread: 0.75,
      count: Math.round(lerp(4, 11, speed01) * (this.preset.sparks / 520 + 0.4)),
      speedMin: 4, speedMax: 11 + speed01 * 8,
      lifeMin: 0.12, lifeMax: 0.34,
      sizeMin: 4, sizeMax: 9,
      color: tint, color2: 0xffffff,
      kind: 1, drag: 4.2, grav: -8,
    });
    this.arena.shock(e.x, e.z, 0.28 + speed01 * 0.3, tint);
    this.audio.wall(speed01);
    this.cam.shake(0.02 + speed01 * 0.03);
  }

  orbClash(e) {
    const speed01 = clamp((e.speed - 15) / 25, 0, 1);
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      spread: 2,
      count: Math.round(16 * (this.preset.sparks / 520 + 0.4)),
      speedMin: 5, speedMax: 15,
      lifeMin: 0.2, lifeMax: 0.5,
      sizeMin: 4, sizeMax: 11,
      color: 0xffffff, color2: 0x7fe8ff,
      kind: 0, drag: 3, grav: -6,
    });
    this.rings.spawn(e.x, ARENA.playY, e.z, 0.2, 2.6, 0.4, 0xbfefff, -Math.PI / 2);
    this.arena.shock(e.x, e.z, 0.5, 0xbfefff);
    this.audio.clash();
    this.cam.shake(0.07);
  }

  // ----------------------------------------------------------------- goal --
  /** @param {{victim:number, x:number, z:number, u01:number}} e */
  goal(e, wasPlayer) {
    const p = PLAYERS[e.victim];
    const n = this.preset.sparks;

    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z], spread: 2,
      count: Math.round(46 * (n / 520 + 0.5)),
      speedMin: 8, speedMax: 30, lifeMin: 0.3, lifeMax: 0.95,
      sizeMin: 6, sizeMax: 20,
      color: p.color, color2: 0xffffff, kind: 1, drag: 2.2, grav: -11, jitter: 0.6,
    });
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z], spread: 2,
      count: Math.round(22 * (n / 520 + 0.5)),
      speedMin: 3, speedMax: 12, lifeMin: 0.5, lifeMax: 1.4,
      sizeMin: 10, sizeMax: 26,
      color: p.color, color2: 0xff8a4a, kind: 0, drag: 1.6, grav: -2.5,
    });

    // Vertical ring standing in the goal plane, plus a flat one on the deck.
    const side = this.arena.planes[e.victim];
    this.rings.spawn(e.x, ARENA.playY, e.z, 0.4, 7, 0.7, p.color,
      0, Math.atan2(side.nx, side.nz));
    this.rings.spawn(e.x, ARENA.playY - 0.8, e.z, 0.4, 11, 0.85, p.color);

    this.arena.shock(e.x, e.z, 2.0, p.color);
    this.arena.hitBarrier(e.victim, e.u01, 1.4);

    this.flash = wasPlayer ? 0.42 : 0.20;
    this.flashColor.set(p.color).convertSRGBToLinear().lerp(new THREE.Color(1, 1, 1), 0.55);
    this.radial = wasPlayer ? 1.5 : 0.7;

    this.audio.goal(wasPlayer);
    this.cam.shake(wasPlayer ? 0.62 : 0.34);
    this.cam.punch(wasPlayer ? 5.5 : 3.0);
    this.cam.kick(-side.nx, -side.nz, wasPlayer ? 0.55 : 0.3);
  }

  // ---------------------------------------------------------- elimination --
  eliminate(craft) {
    const p = PLAYERS[craft.index];
    const pos = craft.worldPos(new THREE.Vector3());
    const n = this.preset.sparks;

    this.sparks.burst({
      at: [pos.x, pos.y, pos.z], spread: 2,
      count: Math.round(90 * (n / 520 + 0.5)),
      speedMin: 10, speedMax: 42, lifeMin: 0.4, lifeMax: 1.3,
      sizeMin: 7, sizeMax: 24,
      color: p.color, color2: 0xffffff, kind: 1, drag: 1.8, grav: -13, jitter: 1.2,
    });
    this.sparks.burst({
      at: [pos.x, pos.y, pos.z], spread: 2,
      count: Math.round(40 * (n / 520 + 0.5)),
      speedMin: 4, speedMax: 18, lifeMin: 0.8, lifeMax: 2.2,
      sizeMin: 14, sizeMax: 40,
      color: 0xff7a2a, color2: 0x40160a, kind: 0, drag: 1.1, grav: -1.4, jitter: 1.4,
    });
    // Hull fragments, tumbling.
    this.sparks.burst({
      at: [pos.x, pos.y, pos.z], spread: 2,
      count: Math.round(26 * (n / 520 + 0.5)),
      speedMin: 6, speedMax: 26, lifeMin: 0.9, lifeMax: 2.0,
      sizeMin: 8, sizeMax: 18,
      color: 0x9fb3c9, color2: p.color, kind: 2, drag: 0.9, grav: -16, jitter: 1.0,
    });

    this.rings.spawn(pos.x, ARENA.playY - 0.8, pos.z, 0.5, 17, 1.15, p.color);
    this.rings.spawn(pos.x, ARENA.playY, pos.z, 0.5, 9, 0.8, 0xffffff,
      0, Math.atan2(craft.nx, craft.nz));

    this.arena.shock(pos.x, pos.z, 3.0, p.color);
    this.arena.sealBarrier(craft.index);

    this.flash = 0.62;
    this.flashColor.set(0xffd0a0).convertSRGBToLinear();
    this.radial = 2.2;

    this.audio.explode();
    this.cam.shake(0.95);
    this.cam.punch(7);
  }

  // ------------------------------------------------------------------ arc --

  /** The fence going up: a discharge running out along the goal line. */
  arcIgnite(craft) {
    const p = PLAYERS[craft.index];
    const n = this.preset.sparks;
    const d = craft.arcDist;
    const half = ARENA.half - ARENA.chamfer;

    // Sparks fired along the whole span, timed by distance so the burst reads
    // as travelling outward from the craft rather than appearing all at once.
    const steps = Math.round(14 * (n / 520 + 0.5));
    for (let i = 0; i < steps; i++) {
      const u = (i / (steps - 1) - 0.5) * 2 * half;
      this.sparks.burst({
        at: [craft.nx * d + craft.tx * u, ARENA.playY + rand(-0.2, 1.4), craft.nz * d + craft.tz * u],
        dir: [-craft.nx, 0.5, -craft.nz], spread: 0.85,
        count: 3, speedMin: 3, speedMax: 13, lifeMin: 0.14, lifeMax: 0.5,
        sizeMin: 4, sizeMax: 12, color: 0xffffff, color2: p.color,
        kind: 1, drag: 3.6, grav: -5, jitter: 0.5,
      });
    }

    const pos = craft.worldPos(new THREE.Vector3());
    this.rings.spawn(pos.x, ARENA.playY - 0.8, pos.z, 0.4, 9, 0.6, p.color);
    this.rings.spawn(pos.x, ARENA.playY, pos.z, 0.3, 5, 0.45, 0xffffff,
      0, Math.atan2(craft.nx, craft.nz));
    this.arena.shock(pos.x, pos.z, 1.5, p.color);

    this.flash = craft.index === 0 ? 0.34 : 0.16;
    this.flashColor.set(0xd8f0ff).convertSRGBToLinear();
    this.audio.arcOn();
    this.cam.shake(craft.index === 0 ? 0.34 : 0.16);
    this.cam.punch(craft.index === 0 ? 3.2 : 1.4);
  }

  /** An orb bouncing off a fence. */
  arcStrike(e) {
    const c = e.craft;
    const p = PLAYERS[c.index];
    const speed01 = clamp((e.speed - 15) / 20, 0, 1);

    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      dir: [-c.nx, 0.45, -c.nz], spread: 0.55,
      count: Math.round(lerp(14, 28, speed01) * (this.preset.sparks / 520 + 0.4)),
      speedMin: 8, speedMax: 24 + speed01 * 14,
      lifeMin: 0.12, lifeMax: 0.4, sizeMin: 5, sizeMax: 14,
      color: 0xffffff, color2: p.color, kind: 1, drag: 3.2, grav: -8, jitter: 0.4,
    });
    // A few slow embers so the strike leaves something hanging in the air.
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z], spread: 2,
      count: Math.round(6 * (this.preset.sparks / 520 + 0.4)),
      speedMin: 1, speedMax: 5, lifeMin: 0.4, lifeMax: 0.9,
      sizeMin: 8, sizeMax: 18, color: p.color, color2: 0x9fd8ff,
      kind: 0, drag: 2.2, grav: -1.5,
    });

    this.rings.spawn(e.x, ARENA.playY - 0.78, e.z, 0.2, 3.4, 0.4, 0xffffff);
    this.arena.shock(e.x, e.z, 0.8 + speed01 * 0.5, p.color);
    this.audio.arcHit(speed01);
    this.cam.shake(c.index === 0 ? 0.16 : 0.05);
    if (c.index === 0) this.cam.punch(1.1);
  }

  /** Idle crackle while a fence is up. Called every frame it is active. */
  arcCrackle(craft, dt) {
    // Rate-based rather than per-frame, so the density doesn't ride framerate.
    this._crackle = (this._crackle || 0) + dt * 26;
    if (this._crackle < 1) return;
    this._crackle = 0;
    const p = PLAYERS[craft.index];
    const d = craft.arcDist;
    const half = ARENA.half - ARENA.chamfer;
    const u = rand(-half, half);
    this.sparks.burst({
      at: [craft.nx * d + craft.tx * u, ARENA.playY + rand(-0.3, 1.5), craft.nz * d + craft.tz * u],
      dir: [-craft.nx, 0.3, -craft.nz], spread: 1.1,
      count: 1, speedMin: 2, speedMax: 9, lifeMin: 0.1, lifeMax: 0.32,
      sizeMin: 3, sizeMax: 9, color: 0xffffff, color2: p.color,
      kind: 1, drag: 4, grav: -6,
    });
  }

  arcExpire(craft) {
    const p = PLAYERS[craft.index];
    const pos = craft.worldPos(new THREE.Vector3());
    this.rings.spawn(pos.x, ARENA.playY - 0.8, pos.z, 6, 0.5, 0.4, p.color);
    this.audio.arcOff();
  }

  // --------------------------------------------------------------- bricks --

  /** A block chipped but not broken. Deliberately small — these are frequent. */
  brickHit(e) {
    const speed01 = clamp((e.speed - 12) / 20, 0, 1);
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      dir: [e.nx, 0.55, e.nz], spread: 0.7,
      count: Math.round(lerp(4, 10, speed01) * (this.preset.sparks / 520 + 0.4)),
      speedMin: 4, speedMax: 12 + speed01 * 9,
      lifeMin: 0.12, lifeMax: 0.34, sizeMin: 4, sizeMax: 10,
      color: e.tint, color2: 0xffffff, kind: 1, drag: 4.0, grav: -9, jitter: 0.35,
    });
    // A couple of tumbling chips, so damage leaves debris on the deck.
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      dir: [e.nx, 0.8, e.nz], spread: 1.0,
      count: Math.round(3 * (this.preset.sparks / 520 + 0.4)),
      speedMin: 3, speedMax: 9, lifeMin: 0.4, lifeMax: 0.8,
      sizeMin: 5, sizeMax: 10, color: 0x9fb3c9, color2: e.tint,
      kind: 2, drag: 1.4, grav: -15,
    });
    this.arena.shock(e.x, e.z, 0.22 + speed01 * 0.22, e.tint);
    this.audio.brickHit(speed01, e.hp01);
    this.cam.shake(0.015 + speed01 * 0.02);
  }

  /**
   * A block destroyed. This is the game's reward moment, so it gets the full
   * treatment: a shell of shards, a flat ring on the deck, and a ring standing
   * upright in the plane of the impact.
   */
  brickBreak(e) {
    const n = this.preset.sparks;
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z], spread: 2,
      count: Math.round(26 * (n / 520 + 0.5)),
      speedMin: 6, speedMax: 22, lifeMin: 0.25, lifeMax: 0.7,
      sizeMin: 5, sizeMax: 15,
      color: e.tint, color2: 0xffffff, kind: 1, drag: 2.6, grav: -12, jitter: 0.7,
    });
    // Hull-style fragments: the block comes apart into pieces, not a puff.
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z], spread: 2,
      count: Math.round(14 * (n / 520 + 0.5)),
      speedMin: 4, speedMax: 15, lifeMin: 0.6, lifeMax: 1.4,
      sizeMin: 7, sizeMax: 16,
      color: 0x8fa6bd, color2: e.tint, kind: 2, drag: 1.1, grav: -17, jitter: 1.0,
    });
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z], spread: 2,
      count: Math.round(8 * (n / 520 + 0.5)),
      speedMin: 1, speedMax: 6, lifeMin: 0.5, lifeMax: 1.1,
      sizeMin: 10, sizeMax: 22, color: e.tint, color2: 0xff9a4a,
      kind: 0, drag: 1.8, grav: -2,
    });

    this.rings.spawn(e.x, ARENA.playY - 0.85, e.z, 0.3, 5.5, 0.55, e.tint);
    this.arena.shock(e.x, e.z, 0.85, e.tint);
    this.audio.brickBreak(e.maxHp);
    this.cam.shake(0.075);
    if (e.by === 0) this.cam.punch(0.9);
  }

  /** Salvage paid out as a point. Fires at the pilot who earned it. */
  salvagePoint(craft) {
    const p = PLAYERS[craft.index];
    const pos = craft.worldPos(new THREE.Vector3());
    this.sparks.burst({
      at: [pos.x, pos.y, pos.z],
      dir: [-craft.nx, 0.9, -craft.nz], spread: 0.9,
      count: Math.round(22 * (this.preset.sparks / 520 + 0.4)),
      speedMin: 5, speedMax: 17, lifeMin: 0.35, lifeMax: 0.9,
      sizeMin: 5, sizeMax: 13,
      color: 0xffffff, color2: p.color, kind: 1, drag: 2.4, grav: -3, jitter: 0.8,
    });
    this.rings.spawn(pos.x, ARENA.playY - 0.8, pos.z, 0.4, 7, 0.6, p.color);
    this.arena.shock(pos.x, pos.z, 1.1, p.color);
    this.audio.salvage();
    if (craft.index === 0) {
      this.flash = 0.16;
      this.flashColor.set(p.color).convertSRGBToLinear().lerp(new THREE.Color(1, 1, 1), 0.6);
      this.cam.punch(1.4);
    }
  }

  /** A block rising out of the deck. One per block, four at a time. */
  brickSurface(b) {
    const n = this.preset.sparks;
    this.sparks.burst({
      at: [b.x, ARENA.floorY + 0.1, b.z],
      dir: [0, 1, 0], spread: 0.9,
      count: Math.round(9 * (n / 520 + 0.4)),
      speedMin: 2, speedMax: 9, lifeMin: 0.25, lifeMax: 0.6,
      sizeMin: 4, sizeMax: 11,
      color: 0x8fe8ff, color2: 0xffffff, kind: 1, drag: 2.8, grav: -6, jitter: 0.5,
    });
    this.rings.spawn(b.x, ARENA.playY - 0.85, b.z, 0.2, 3.4, 0.5, 0x8fe8ff);
    this.arena.shock(b.x, b.z, 0.5, 0x8fe8ff);
    this.audio.brickSurface();
  }

  // -------------------------------------------------------------- pinball --

  /** The telegraph, a beat before the wells punch up through the deck. */
  pinballWarn(pin) {
    for (const b of pin.bumpers) {
      this.rings.spawn(b.x, ARENA.playY - 0.86, b.z, 2.6, 0.4, PIN_WARN, ELEMENT_COLOR);
      this.arena.shock(b.x, b.z, 0.45, ELEMENT_COLOR);
    }
    this.audio.pinballWarn();
  }

  /** The wells arriving. */
  pinballDeploy(pin) {
    const n = this.preset.sparks;
    for (const b of pin.bumpers) {
      this.sparks.burst({
        at: [b.x, ARENA.floorY + 0.1, b.z],
        dir: [0, 1, 0], spread: 0.55,
        count: Math.round(14 * (n / 520 + 0.4)),
        speedMin: 5, speedMax: 16, lifeMin: 0.2, lifeMax: 0.6,
        sizeMin: 5, sizeMax: 13,
        color: 0xffffff, color2: ELEMENT_COLOR, kind: 1, drag: 3.0, grav: -8, jitter: 0.5,
      });
      this.rings.spawn(b.x, ARENA.playY - 0.85, b.z, 0.3, 4.6, 0.55, ELEMENT_COLOR);
      this.arena.shock(b.x, b.z, 0.9, ELEMENT_COLOR);
    }
    for (const s of pin.slings) this.arena.shock(s.x, s.z, 0.7, ELEMENT_COLOR);
    this.flash = 0.18;
    this.flashColor.set(0xffd9a0).convertSRGBToLinear();
    this.audio.pinballDeploy();
    this.cam.shake(0.3);
    this.cam.punch(2.2);
  }

  /** The wells sinking back under the deck. */
  pinballRetract(pin) {
    for (const b of pin.bumpers) {
      this.rings.spawn(b.x, ARENA.playY - 0.85, b.z, 3.2, 0.3, 0.45, ELEMENT_COLOR);
      this.arena.shock(b.x, b.z, 0.4, ELEMENT_COLOR);
    }
    this.audio.pinballRetract();
    this.cam.shake(0.1);
  }

  /** A pop bumper firing. Short, bright, and always the same amber. */
  bumper(e) {
    const speed01 = clamp((e.speed - 15) / 18, 0, 1);
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      dir: [e.nx, 0.6, e.nz], spread: 0.8,
      count: Math.round(lerp(10, 20, speed01) * (this.preset.sparks / 520 + 0.4)),
      speedMin: 7, speedMax: 20 + speed01 * 10,
      lifeMin: 0.14, lifeMax: 0.42, sizeMin: 5, sizeMax: 13,
      color: 0xffffff, color2: ELEMENT_COLOR, kind: 1, drag: 3.4, grav: -7, jitter: 0.5,
    });
    // A ring standing in the plane of the kick reads as a shockwave leaving
    // the bumper face, which is what sells the pop as an impulse.
    this.rings.spawn(e.x, ARENA.playY, e.z, 0.2, 3.0, 0.36, ELEMENT_COLOR,
      0, Math.atan2(e.nx, e.nz));
    this.rings.spawn(e.x, ARENA.playY - 0.8, e.z, 0.2, 3.6, 0.42, ELEMENT_COLOR);
    this.arena.shock(e.x, e.z, 0.6, ELEMENT_COLOR);
    this.audio.bumper(speed01);
    this.cam.shake(0.05 + speed01 * 0.04);
  }

  /** A slingshot firing: heavier than a bumper, and it always means business. */
  sling(e) {
    const n = this.preset.sparks;
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z],
      dir: [e.nx, 0.4, e.nz], spread: 0.42,
      count: Math.round(24 * (n / 520 + 0.4)),
      speedMin: 12, speedMax: 34, lifeMin: 0.16, lifeMax: 0.5,
      sizeMin: 5, sizeMax: 15,
      color: 0xffffff, color2: ELEMENT_COLOR, kind: 1, drag: 2.4, grav: -6, jitter: 0.3,
    });
    this.sparks.burst({
      at: [e.x, ARENA.playY, e.z], spread: 2,
      count: Math.round(6 * (n / 520 + 0.4)),
      speedMin: 1, speedMax: 5, lifeMin: 0.4, lifeMax: 1.0,
      sizeMin: 9, sizeMax: 20, color: ELEMENT_COLOR, color2: 0xffd9a0,
      kind: 0, drag: 2.0, grav: -1.2,
    });
    this.rings.spawn(e.x, ARENA.playY, e.z, 0.3, 5.0, 0.42, 0xffe0b0,
      0, Math.atan2(e.nx, e.nz));
    this.arena.shock(e.x, e.z, 1.0, ELEMENT_COLOR);
    this.audio.sling();
    this.cam.shake(0.11);
    this.cam.kick(e.nx, e.nz, 0.14);
  }

  surge(craft) {
    const pos = craft.worldPos(new THREE.Vector3());
    const p = PLAYERS[craft.index];
    this.sparks.burst({
      at: [pos.x, pos.y, pos.z],
      dir: [-craft.nx, 0.2, -craft.nz], spread: 0.5,
      count: Math.round(18 * (this.preset.sparks / 520 + 0.4)),
      speedMin: 6, speedMax: 20, lifeMin: 0.2, lifeMax: 0.5,
      sizeMin: 5, sizeMax: 12,
      color: 0xffffff, color2: p.color, kind: 1, drag: 3, grav: -4, jitter: 1.4,
    });
    this.rings.spawn(pos.x, ARENA.playY - 0.8, pos.z, 0.4, 5.5, 0.5, 0xffffff);
    this.audio.surge();
    if (craft.index === 0) this.cam.punch(1.6);
  }

  /** Charge glow at the centre before an orb is served. */
  serveCharge(progress) {
    this.arena.setCharge(progress);
    if (progress > 0.02 && Math.random() < progress * 0.5) {
      const a = rand(0, Math.PI * 2);
      const r = lerp(11, 1.2, progress);
      this.sparks.burst({
        at: [Math.cos(a) * r, ARENA.playY, Math.sin(a) * r],
        dir: [-Math.cos(a), 0.1, -Math.sin(a)], spread: 0.25,
        count: 2, speedMin: 8, speedMax: 18, lifeMin: 0.2, lifeMax: 0.45,
        sizeMin: 4, sizeMax: 9, color: 0x9fefff, color2: 0xffffff,
        kind: 1, drag: 1.2, grav: 0,
      });
    }
  }

  serveBurst(x, z, ang) {
    this.sparks.burst({
      at: [x, ARENA.playY, z],
      dir: [Math.sin(ang), 0.2, Math.cos(ang)], spread: 0.7,
      count: Math.round(26 * (this.preset.sparks / 520 + 0.4)),
      speedMin: 8, speedMax: 24, lifeMin: 0.2, lifeMax: 0.55,
      sizeMin: 5, sizeMax: 14, color: 0x8fe8ff, color2: 0xffffff,
      kind: 1, drag: 2.6, grav: -4,
    });
    this.rings.spawn(x, ARENA.playY - 0.8, z, 0.3, 8, 0.6, 0x8fe8ff);
    this.arena.shock(x, z, 0.8, 0x8fe8ff);
    this.cam.shake(0.14);
    this.cam.punch(2.0);
  }

  clear() { this.sparks.clear(); }

  dispose() {
    this.sparks.dispose();
    this.rings.dispose();
  }
}
