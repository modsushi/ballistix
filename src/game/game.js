import * as THREE from 'three';
import {
  ARC, ARENA, BLACKHOLE, BRICKS, DIFFICULTY, ORB, PADDLE, PINBALL, PLAYERS, RULES,
} from '../core/config.js';
import { clamp, damp, lerp, rand } from '../core/math.js';
import { Arena } from './arena.js';
import { Craft } from './craft.js';
import { Orb } from './orb.js';
import { AI } from './ai.js';
import { Effects } from './effects.js';
import { BrickField } from './bricks.js';
import { Pinball } from './pinball.js';
import { BlackHole } from './blackhole.js';
import { stepOrb, collideOrbs } from './collide.js';
import { ArcField } from '../gfx/arcfield.js';
import { POINTER_GAIN } from '../core/input.js';

/**
 * Match state and the simulation loop.
 *
 * The core loop is Ballistix's: every pilot defends one wall, everyone starts
 * on five points, conceding costs one, zero means your wall seals and your
 * craft is destroyed, and the last pilot with points on the board wins. Orbs
 * accumulate on a timer so the deck gets progressively less survivable.
 *
 * On top of that sits the middle game: a field of breakable bricks and four
 * pinball wells. Points can now be *won* as well as lost — shattering bricks
 * banks salvage for whoever last touched the orb, and every `BRICKS.perPoint`
 * of it pays out a point. That turns a purely defensive game into one with a
 * reason to aim, and slows the whole thing down, because an orb crossing the
 * middle is knocked off course and bled of speed several times on the way.
 *
 * Physics runs on a fixed 120Hz step behind an accumulator. That is not
 * gold-plating: deflection angle depends on exactly where an orb meets a
 * moving deflector, and letting that depend on a phone's variable frame time
 * would make identical inputs produce different shots.
 */

const FIXED = 1 / 120;
const MAX_CATCHUP = 0.25;

// When "3" lands. The intro runs 3.4s, so the digits fall on 0.4/1.4/2.4 and
// "1" clears just as the serve charge takes over.
const INTRO_FIRST_TICK = 0.4;

export const State = {
  INTRO: 'intro',
  SERVE: 'serve',
  PLAY: 'play',
  KO: 'ko',
  OVER: 'over',
};

export class Game {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./camera.js').GameCamera} camera
   */
  constructor(scene, camera, assets, audio, hud, preset, input) {
    this.scene = scene;
    this.camera = camera;
    this.assets = assets;
    this.audio = audio;
    this.hud = hud;
    this.preset = preset;
    this.input = input;

    this.arena = new Arena(scene, assets, preset);
    this.effects = new Effects(scene, this.arena, camera, audio, preset);

    // Pinball first: its elements are keep-out zones for the brick layout.
    // Null when switched off in config, and everything downstream is written
    // to cope with that rather than to construct a disabled copy — off should
    // mean no geometry, no materials and no per-frame work at all.
    this.pinball = PINBALL.enabled ? new Pinball(scene, preset) : null;
    this.bricks = new BrickField(scene, preset);
    this.blackhole = BLACKHOLE.enabled ? new BlackHole(scene, preset) : null;

    this.crafts = [];
    for (let i = 0; i < 4; i++) this.crafts.push(new Craft(i, PLAYERS[i], assets, scene));

    // Only the first few orbs get a real light; past that the cost isn't worth
    // it and the bloom is already carrying the illusion.
    this.maxOrbs = Math.min(4, preset.sparks > 400 ? 4 : RULES.orbCapMobile);
    this.orbs = [];
    for (let i = 0; i < this.maxOrbs; i++) {
      const o = new Orb(scene, preset, i < preset.orbLights);
      o.id = i;
      this.orbs.push(o);
    }

    // One lightning fence per pilot, parked at their goal line.
    const span = 2 * (ARENA.half - ARENA.chamfer);
    this.arcFields = this.crafts.map((c) => new ArcField(c, span, PLAYERS[c.index].color, scene));

    this.ais = [];
    this.state = State.INTRO;
    this.accum = 0;
    this.timeScale = 1;
    this._targetScale = 1;
    this._freeze = 0;
    this.events = [];
    this.paused = false;
    this.attract = true;

    this.startAttract();
  }

  // ------------------------------------------------------------------ setup --

  /** Begin a scored match. */
  startMatch(difficulty = 1) {
    this.attract = false;
    // `autoPlayer` is a balance-testing hook: pilot 0 plays itself at the
    // same skill as its rivals, so any asymmetry in the outcome is the
    // rules' fault rather than the player's.
    this.autoPlayer = this.autoPlayer || false;
    this._resetCommon(difficulty);
    this.state = State.INTRO;
    this.introTimer = 0;
    this.camera.startIntro();
  }

  /**
   * A live, unscored demo that plays behind the menus. Four AI pilots on a deck
   * that never ends — considerably more inviting than a still frame, and it
   * doubles as a warm cache for every shader and particle path the real match
   * will need.
   */
  startAttract() {
    this.attract = true;
    this._resetCommon(2);
    // Skip ahead on the orb schedule so the demo is immediately busy.
    this.playTime = 40;
    this.state = State.SERVE;
    this.serveTimer = 0;
    this.serveDuration = 0.7;
    this.pendingServes = [0];
  }

  _resetCommon(difficulty = 1) {
    const diff = DIFFICULTY[clamp(difficulty, 0, 2)];
    this.difficulty = difficulty;

    this.scores = PLAYERS.map(() => RULES.startPoints);
    this.salvage = PLAYERS.map(() => 0);
    this.alive = [true, true, true, true];
    this.eliminationOrder = [];
    this.stats = { deflections: 0, bestChain: 0, knockouts: 0, bricks: 0, duration: 0 };
    this.chain = 0;
    this.matchTime = 0;
    this.playTime = 0;
    this.serveTimer = 0;
    this.koTimer = 0;
    this.pendingServes = [];
    this.lastConceder = -1;

    for (const c of this.crafts) {
      c.alive = true;
      c.dying = 0;
      c.arc = ARC.startCharge;
      c.arcActive = 0;
      c.arcJustFired = false;
      c.u = 0; c.vu = 0; c.targetU = 0;
      c.recoil = 0; c.hitFlash = 0;
      c.surge = 1; c.surgeActive = 0;
      c.root.visible = true;
      c.bobPivot.position.y = 0;
      c.hullPivot.rotation.set(0, 0, 0);
      c.defMat.uniforms.uAlive.value = 1;
      c.sync(0);
    }
    for (const o of this.orbs) o.kill();
    for (const f of this.arcFields || []) { f.extinguish(); f.update(1, 0); }
    // The fences are torn down here rather than through `arcExpire`, so the
    // sustained hum has to be cut by hand — otherwise abandoning a match with a
    // fence up carries its buzz into the menu.
    this.audio.arcSilence();
    this._arcWasReady = false;

    // Pilot 0 gets an AI too — it only drives during attract, but keeping it
    // allocated means switching modes never has to build one mid-frame.
    this.ais = [];
    for (let i = 0; i < 4; i++) this.ais[i] = new AI(this.crafts[i], diff, this.arena.planes);

    // A fresh field every match. Laid out around the pinball elements, which
    // never move, so only the bricks need re-rolling.
    this.pinball?.reset();
    this.blackhole?.reset();
    this.bricks.reset(this.pinball?.obstacles() ?? []);

    for (let i = 0; i < 4; i++) {
      this.arena.setBarrierHealth(i, 1);
      this.hud.setScore(i, RULES.startPoints);
    }
    this.hud.resetMatch();
    this.hud.setOrbCount(0);
    this.hud.setCombo(0);
    this.hud.setSalvage(0, BRICKS.perPoint);
    this.effects.clear();
    this.arena.setCharge(0);

    this.timeScale = 1;
    this._targetScale = 1;
    this._freeze = 0;
    this._slowHold = 0;
    this._resultShown = false;
    this.overTimer = 0;
  }

  /**
   * Enter slow motion for `hold` seconds of real time.
   * Driven from the update loop rather than setTimeout so a pause freezes
   * it too, and so restarting a match can't be clobbered by a stale timer
   * from the previous one.
   */
  _slow(scale, hold) { this._targetScale = scale; this._slowHold = hold; }

  /** HUD announcements are suppressed while the menus own the screen. */
  /**
   * Match events go to the toast rail, never over the deck.
   *
   * Only outcomes are worth a toast — who went down, who won. Everything the
   * deck already shows for itself (an orb arriving, blocks surfacing, the
   * fence going up) is read from the deck; captioning it was noise sitting on
   * top of the one thing the player is trying to track.
   */
  _toast(text, opts) { if (!this.attract) this.hud.toast(text, opts); }

  get aliveCount() { return this.alive.reduce((n, a) => n + (a ? 1 : 0), 0); }

  /** How many orbs should be in play right now. */
  targetOrbCount() {
    let n = 1;
    for (const s of RULES.orbSchedule) if (this.playTime >= s.t) n = s.n;
    // The deck gets smaller as pilots are eliminated, but the survivors get
    // *one more* orb than they have rivals rather than fewer. Keeping the
    // pressure strictly proportional was right when conceding was the only
    // thing that moved the score; now that the middle both absorbs orbs and
    // pays points out, a two-pilot endgame on two orbs reaches an equilibrium
    // where salvage income cancels the goal drain and the match cannot end.
    return clamp(Math.min(n, this.maxOrbs), 1, Math.max(2, this.aliveCount + 1));
  }

  activeOrbs() { return this.orbs.filter((o) => o.active); }

  // ------------------------------------------------------------------- loop --
  /**
   * @param {number} dtReal unscaled seconds since the last frame
   */
  update(dtReal) {
    if (this.paused) {
      // Keep presentation alive so a paused frame doesn't look dead.
      this.arena.update(0, this.matchTime);
      return;
    }

    // ---- time dilation ------------------------------------------------------
    if (this._slowHold > 0) {
      this._slowHold -= dtReal;
      if (this._slowHold <= 0) this._targetScale = 1;
    }
    if (this._freeze > 0) {
      this._freeze -= dtReal;
      this.timeScale = 0;
    } else {
      this.timeScale = damp(this.timeScale, this._targetScale, 7, dtReal);
    }
    const dt = dtReal * this.timeScale;
    this.matchTime += dtReal;

    switch (this.state) {
      case State.INTRO: this._updateIntro(dtReal); break;
      case State.SERVE: this._updateServe(dt, dtReal); break;
      case State.PLAY: this._updatePlay(dt); break;
      case State.KO: this._updateKO(dt, dtReal); break;
      case State.OVER: this._updateOver(dtReal); break;
    }

    // ---- simulation ---------------------------------------------------------
    if (this.state !== State.INTRO) {
      this.accum = Math.min(this.accum + dt, MAX_CATCHUP);
      let steps = 0;
      while (this.accum >= FIXED && steps++ < 40) {
        this._fixedStep(FIXED);
        this.accum -= FIXED;
      }
    }

    // ---- presentation -------------------------------------------------------
    this._updateArcs(dt);
    this._updateMiddle(dt);
    for (const c of this.crafts) c.update(dt, this.matchTime);
    for (const o of this.orbs) o.updateVisual(dt, this.matchTime);
    this.arena.aimFill(this.camera.cam.position);
    this.arena.update(dt, this.matchTime);
    this.effects.update(dtReal, this.camera.cam);

    this._updateCameraFocus(dtReal);
    this._updateAudioIntensity();
  }

  /** One deterministic physics tick. */
  _fixedStep(h) {
    const ev = this.events;
    ev.length = 0;

    const playing = this.state === State.PLAY || this.state === State.SERVE || this.state === State.KO;

    // --- pilots -------------------------------------------------------------
    if (playing) {
      if (this.attract || this.autoPlayer) this.ais[0].update(h, this.orbs, this.crafts, this.scores);
      else this._steerPlayer(h);
      for (let i = 1; i < 4; i++) {
        if (this.alive[i]) this.ais[i].update(h, this.orbs, this.crafts, this.scores);
      }
    }

    // --- orbs ---------------------------------------------------------------
    const ctx = {
      planes: this.arena.planes, crafts: this.crafts,
      bricks: this.bricks, pinball: this.pinball, blackhole: this.blackhole,
      events: ev,
    };
    for (const o of this.orbs) {
      if (!o.active) continue;
      stepOrb(o, h, ctx);
    }
    collideOrbs(this.activeOrbs(), ev);

    for (const e of ev) this._handleEvent(e);
  }

  _steerPlayer(h) {
    const me = this.crafts[0];
    if (!me.alive) return;

    const m = this._mapper;
    if (m) me.steer(this.input.resolve(h, m.map, me.limit, me.targetU, m.sign));

    // Space (and tap, and gamepad A) spend the best ability available: the
    // fence when it is charged, otherwise a surge. Shift is surge-only, for
    // players who want to hold the fence back for a moment they choose.
    if (this.input.consumeSurge()) {
      if (!me.tryArc() && me.trySurge()) this.effects.surge(me);
    }
    if (this.input.consumeSurgeOnly() && me.trySurge()) this.effects.surge(me);
  }

  // ------------------------------------------------------------------ events --
  _handleEvent(e) {
    switch (e.type) {
      case 'deflect': {
        this.effects.deflect(e);
        if (e.craft.index === 0) {
          this.chain++;
          this.stats.deflections++;
          this.stats.bestChain = Math.max(this.stats.bestChain, this.chain);
          this.hud.setCombo(this.chain);
        }
        e.orb.setTint(PLAYERS[e.craft.index].color);
        break;
      }
      case 'wall':
      case 'sealed':
        this.effects.wall(e);
        break;
      case 'orbclash':
        this.effects.orbClash(e);
        break;
      case 'arc':
        this.effects.arcStrike(e);
        this.arcFields[e.craft.index].strike(e.u01, 0.9);
        break;
      case 'brickhit':
        this.effects.brickHit(e);
        break;
      case 'brickbreak':
        this._brickBreak(e);
        break;
      case 'bumper':
        this.effects.bumper(e);
        break;
      case 'sling':
        this.effects.sling(e);
        break;
      case 'goal':
        this._concede(e);
        break;
    }
  }

  /**
   * A block shattered. Credit whoever last touched the orb, and pay out a
   * point once they have banked enough.
   *
   * Salvage is banked rather than paid per brick because bricks break often —
   * an orb crossing the field contacts one roughly every half second — and a
   * point per brick would inflate faster than conceding could deflate. The
   * match would then never be able to end, which is a worse failure than the
   * mechanic being slightly less generous than it first sounds.
   *
   * And it closes entirely for the final duel; see `RULES.salvageMinPilots`.
   */
  _brickBreak(e) {
    this.effects.brickBreak(e);

    const by = e.by;
    if (by < 0 || !this.alive[by]) return;
    if (by === 0) this.stats.bricks++;
    if (this.attract) return;              // demo shows the spectacle, not the ledger

    // The deck stops paying out for the final duel — see RULES.salvageMinPilots.
    // Blocks still break, still slow orbs down and still light up; only the
    // ledger closes.
    if (this.aliveCount < RULES.salvageMinPilots) {
      if (by === 0) this.hud.setSalvageClosed(true);
      return;
    }

    this.salvage[by]++;
    if (by === 0) this.hud.setSalvage(this.salvage[0], BRICKS.perPoint);
    if (this.salvage[by] < BRICKS.perPoint) return;

    this.salvage[by] -= BRICKS.perPoint;
    if (by === 0) this.hud.setSalvage(this.salvage[0], BRICKS.perPoint);

    // A pilot already at the ceiling keeps the spectacle but banks nothing —
    // the alternative is an unloseable lead and a match that cannot resolve.
    if (this.scores[by] >= RULES.maxPoints) return;

    this.scores[by]++;
    this.hud.setScore(by, this.scores[by]);
    this.arena.setBarrierHealth(by, Math.min(1, this.scores[by] / RULES.startPoints));
    // No caption: the pip strip growing and the salvage meter resetting say it,
    // and they say it where the player is already looking.
    this.effects.salvagePoint(this.crafts[by]);
  }

  _concede(e) {
    const victim = e.victim;
    if (!this.alive[victim]) return;

    e.orb.kill();

    // Attract runs forever: show the impact, skip the consequences.
    if (this.attract) {
      this.effects.goal(e, false);
      this.lastConceder = victim;
      this._queueServe(0.5);
      return;
    }

    this.scores[victim] = Math.max(0, this.scores[victim] - 1);
    this.hud.setScore(victim, this.scores[victim]);
    // Salvage can push a pilot above the starting five; the barrier reads full
    // rather than overcharged, so the deck never shows more than "healthy".
    this.arena.setBarrierHealth(victim, Math.min(1, this.scores[victim] / RULES.startPoints));
    this.crafts[victim].onConcede();
    this.lastConceder = victim;

    const wasPlayer = victim === 0;
    this.effects.goal(e, wasPlayer);

    if (wasPlayer) {
      this.chain = 0;
      this.hud.setCombo(0);
    } else if (e.orb.lastHitBy === 0) {
      this.stats.knockouts += this.scores[victim] === 0 ? 1 : 0;
    }

    // Hit-stop. Freezing the simulation for a beat is the cheapest and most
    // effective impact amplifier there is — the eye reads the pause as force.
    this._freeze = wasPlayer ? 0.11 : 0.06;
    this._slow(0.34, wasPlayer ? 0.42 : 0.26);

    if (this.scores[victim] === 0) {
      this._eliminate(victim);
    } else {
      // A conceded point is already loud: the pip goes out, the barrier dims,
      // the frame closes in on your last life. It doesn't need a caption too.
      this._queueServe(RULES.respawnDelay);
    }
  }

  _eliminate(index) {
    this.alive[index] = false;
    this.eliminationOrder.push(index);
    this.crafts[index].eliminate();
    this.hud.markEliminated(index);
    this.effects.eliminate(this.crafts[index]);

    this._freeze = 0.2;
    this._slow(0.25, 0.9);

    const remaining = this.aliveCount;
    if (remaining <= 1) {
      this.state = State.OVER;
      this.overTimer = 0;
      for (const o of this.orbs) o.kill();
      const winner = this.alive.indexOf(true);
      this._toast(winner === 0 ? 'YOU SURVIVE' : `${PLAYERS[winner].name} WINS`, {
        color: PLAYERS[winner].css, tone: winner === 0 ? 'good' : undefined,
      });
      this.audio.stinger(winner === 0);
      this.audio.setIntensity(0);
      return;
    }

    this.state = State.KO;
    this.koTimer = 1.9;
    this._slow(0.25, 0.7);

    const down = index === 0 ? 'YOU ARE OUT' : `${PLAYERS[index].name} DOWN`;
    this._toast(down, {
      color: index === 0 ? 'var(--danger)' : PLAYERS[index].css,
      tone: index === 0 ? 'bad' : undefined,
    });

    // Going down to two closes the ledger. It gets its own toast — they stack,
    // so the rule change is no longer competing with the knockout for the one
    // slot, and a rule that changes mid-match without being announced looks
    // like the game breaking.
    if (remaining < RULES.salvageMinPilots) {
      this.hud.setSalvageClosed(true);
      this._toast('SALVAGE CLOSED');
    }

    // Everything currently in flight is cleared; the deck resets around the
    // survivors rather than continuing mid-rally against a corpse.
    for (const o of this.orbs) if (o.active) o.kill();
  }

  _queueServe(delay) {
    this.pendingServes.push(delay);
    if (this.state === State.PLAY && this.activeOrbs().length === 0) {
      this.state = State.SERVE;
      this.serveTimer = 0;
      this.serveDuration = Math.max(delay, RULES.serveDelay);
      this.audio.serve();
    }
  }

  _serveOrb() {
    const o = this.orbs.find((x) => !x.active);
    if (!o) return;

    // Launch away from whoever just conceded — nobody should be punished twice
    // in a row by geometry — and never straight down a wall.
    let ang = rand(0, Math.PI * 2);
    const banned = this.lastConceder;
    for (let tries = 0; tries < 24; tries++) {
      ang = rand(0, Math.PI * 2);
      const dx = Math.sin(ang), dz = Math.cos(ang);
      // Reject shallow angles that would crawl along a wall.
      if (Math.abs(dx) < 0.22 || Math.abs(dz) < 0.22) continue;
      if (banned >= 0) {
        const s = this.arena.planes[banned];
        if (dx * s.nx + dz * s.nz > 0.55) continue;
      }
      // Never serve at an eliminated pilot's sealed wall first.
      let ok = true;
      for (let i = 0; i < 4; i++) {
        if (this.alive[i]) continue;
        const s = this.arena.planes[i];
        if (dx * s.nx + dz * s.nz > 0.8) { ok = false; break; }
      }
      if (ok) break;
    }

    const speed = ORB.baseSpeed + Math.min(6, this.playTime * 0.05);
    o.spawn(0, 0, ang, speed);
    this.effects.serveBurst(0, 0, ang);
    this.arena.setCharge(0);
    this.hud.setOrbCount(this.activeOrbs().length);
  }

  // ------------------------------------------------------------------ states --
  /**
   * The opening beat is a 3 · 2 · 1 on the second, ending as the serve charge
   * begins. A countdown is the one thing worth putting over the deck: it isn't
   * telling the player what happened, it's telling them how long they have.
   */
  _updateIntro(dtReal) {
    const was = this.introTimer;
    this.introTimer += dtReal;
    for (let i = 0; i < 3; i++) {
      const at = INTRO_FIRST_TICK + i;
      if (was < at && this.introTimer >= at && !this.attract) {
        this.hud.countdown(3 - i);
        this.audio.ui(i === 2 ? 'confirm' : 'tick');
      }
    }
    if (this.introTimer >= 3.4) {
      this.state = State.SERVE;
      this.serveTimer = 0;
      this.serveDuration = 1.4;
      this.pendingServes = [0];
      this.audio.serve();
    }
  }

  _updateServe(dt, dtReal) {
    this.serveTimer += dtReal;
    const k = clamp(this.serveTimer / this.serveDuration, 0, 1);
    this.effects.serveCharge(k);

    if (k >= 1) {
      this.pendingServes.shift();
      this._serveOrb();
      this.state = State.PLAY;
    }
  }

  _updatePlay(dt) {
    this.playTime += dt;

    // Fold in queued respawns without stopping play when orbs remain.
    if (this.pendingServes.length) {
      this.pendingServes[0] -= dt;
      if (this.pendingServes[0] <= 0) {
        this.pendingServes.shift();
        this._serveOrb();
      }
    }

    // Escalation: add an orb when the schedule calls for one.
    const want = this.targetOrbCount();
    const have = this.activeOrbs().length + this.pendingServes.length;
    if (have < want) {
      // The count in the corner ticks up and the serve ring lights the deck;
      // both land before the orb does, which is all the warning this needed.
      this.pendingServes.push(0.6);
    }
    this.hud.setOrbCount(this.activeOrbs().length);

    // Safety net: an orb that somehow leaves the deck is recycled rather than
    // silently ending the rally.
    for (const o of this.orbs) {
      if (!o.active) continue;
      if (Math.hypot(o.x, o.z) > ARENA.half * 1.9) o.kill();
    }
    if (this.activeOrbs().length === 0 && this.pendingServes.length === 0) {
      this._queueServe(RULES.respawnDelay);
    }
  }

  _updateKO(dt, dtReal) {
    this.hud.setOrbCount(0);
    this.koTimer -= dtReal;
    if (this.koTimer <= 0) {
      this.state = State.SERVE;
      this.serveTimer = 0;
      this.serveDuration = RULES.serveDelay;
      this.pendingServes = [0];
      this.lastConceder = -1;
      this.audio.serve();
    }
  }

  _updateOver(dtReal) {
    this.overTimer += dtReal;
    if (!this._resultShown && this.overTimer > 2.2) {
      this._resultShown = true;
      this.onMatchEnd?.(this.buildResult());
    }
  }

  buildResult() {
    // Finishing order: survivors first (by points), then reverse elimination.
    const survivors = [];
    for (let i = 0; i < 4; i++) if (this.alive[i]) survivors.push(i);
    survivors.sort((a, b) => this.scores[b] - this.scores[a]);
    const order = [...survivors, ...this.eliminationOrder.slice().reverse()];
    this.stats.duration = this.matchTime;
    return { order, finalScores: this.scores.slice(), stats: this.stats };
  }

  /**
   * Drive the fences off craft state.
   *
   * Reading the rising edge here rather than plumbing a callback through both
   * the player's input path and the AI's means the two can't drift apart — a
   * fence raised by a rival gets exactly the same treatment as one of yours.
   */
  _updateArcs(dt) {
    for (let i = 0; i < 4; i++) {
      const c = this.crafts[i];
      const f = this.arcFields[i];

      if (c.arcJustFired) {
        c.arcJustFired = false;
        f.ignite(c.u);
        this.effects.arcIgnite(c);
      }
      if (f.active && c.arcActive <= 0) {
        f.extinguish();
        this.effects.arcExpire(c);
      }
      if (c.arcActive > 0) this.effects.arcCrackle(c, dt);
      f.update(dt, this.matchTime);
    }

    // The charge meter is the player's only readout for it.
    const me = this.crafts[0];
    const wasReady = this._arcWasReady === true;
    const ready = me.arc >= 1 && me.arcActive <= 0;
    this.hud.setArc(me.arcActive > 0 ? me.arcActive / ARC.duration : me.arc,
      ready, me.arcActive > 0);
    if (ready && !wasReady && !this.attract) this.audio.arcReady();
    this._arcWasReady = ready;
  }

  /**
   * The middle of the deck: blocks surfacing on the match clock, and the
   * pinball wells running their own deploy cycle.
   *
   * Both telegraph themselves on the deck — a warning swell before the wells
   * rise, a ring of light as blocks surface. A hazard that appears silently
   * under a rally is indistinguishable from a bug, so the warning has to exist;
   * it just belongs in the arena, where the player is looking, rather than in
   * a caption over it.
   */
  _updateMiddle(dt) {
    this.bricks.update(dt, this.playTime, this.aliveCount);
    // One ring's worth of effect at most. The attract demo starts 40 seconds
    // into the schedule and catches up several rings on its first frame; a dozen
    // simultaneous swells is a wall of noise rather than an arrival.
    const surfaced = this.bricks.justSpawned;
    for (let i = 0; i < Math.min(surfaced.length, 4); i++) this.effects.brickSurface(surfaced[i]);
    const h = this.blackhole;
    if (h) {
      h.update(dt, this.matchTime, this.bricks);
      if (h.justWarned) this.effects.blackHoleWarn(h);
      if (h.justOpened) {
        this.effects.blackHoleOpen(h);
      }
      if (h.justClosed) this.effects.blackHoleClose(h);
      if (h.live) this.effects.blackHoleAmbient(h, dt);
      this.hud.setBlackHole(h.cycle01, h.live);
    }

    const p = this.pinball;
    if (!p) return;
    p.update(dt, this.matchTime);
    if (p.justWarned) this.effects.pinballWarn(p);
    if (p.justDeployed) {
      this.effects.pinballDeploy(p);
    }
    if (p.justRetracted) this.effects.pinballRetract(p);

    this.hud.setPinball(p.cycle01, p.live);
  }

  // ------------------------------------------------------------------ polish --
  _updateCameraFocus(dtReal) {
    // Lean toward the busiest part of the deck, weighted by orb speed so the
    // frame follows the shot that matters rather than the average of them all.
    let wx = 0, wz = 0, tw = 0;
    for (const o of this.orbs) {
      if (!o.active) continue;
      const w = 0.4 + o.speed / ORB.maxSpeed;
      wx += o.x * w; wz += o.z * w; tw += w;
    }
    if (tw > 0) this.camera.lookToward(wx / tw, wz / tw, 1);
    else this.camera.lookToward(0, 0, 0.2);
  }

  _updateAudioIntensity() {
    let danger = 0;
    for (const o of this.orbs) {
      if (!o.active) continue;
      const sp = clamp((o.speed - ORB.baseSpeed) / (ORB.maxSpeed - ORB.baseSpeed), 0, 1);
      // How close is it to *my* wall, and is it coming this way?
      const toward = clamp(o.vz / Math.max(1e-3, o.speed), 0, 1);
      const near = clamp((o.z + ARENA.half) / (ARENA.half * 2), 0, 1);
      danger = Math.max(danger, sp * 0.55 + toward * near * 0.6);
    }
    const orbLoad = this.activeOrbs().length / this.maxOrbs;
    const lowHealth = 1 - this.scores[0] / RULES.startPoints;
    this.audio.setIntensity(clamp(danger * 0.5 + orbLoad * 0.3 + lowHealth * 0.35, 0, 1));
  }

  /**
    * Rebuild the screen-space control mapping. Cheap (two projections), and
    * done every frame so it tracks the camera exactly.
    *
    * A mouse gets an exact 1:1 mapping — the paddle sits under the cursor,
    * which is what a pointing device should do. Touch gets the widened band,
    * because a thumb can't comfortably reach both edges of a phone.
    */
  refreshMapper(viewportWidth) {
    const gain = this.input.touchMode ? POINTER_GAIN : 1;
    this._mapper = this.camera.makeMapper(this.crafts[0], this.crafts[0].limit, gain, viewportWidth);
  }

  setPaused(p) {
    this.paused = p;
    if (p) this.input.release();
  }

  dispose() {
    for (const f of this.arcFields) f.dispose();
    this.bricks.dispose();
    this.pinball?.dispose();
    this.blackhole?.dispose();
    this.effects.dispose();
    for (const c of this.crafts) c.dispose();
    for (const o of this.orbs) o.dispose();
    this.arena.dispose();
  }
}
