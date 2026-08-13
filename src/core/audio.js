import { clamp, lerp, rand, pick } from './math.js';

/**
 * Everything you hear is synthesised at runtime.
 *
 * No audio files means no download, no decode stall on a phone, and — more
 * usefully — every sound can be parameterised by what actually happened.
 * A deflection's pitch tracks orb speed, its brightness tracks impact power,
 * and its timbre carries the deflecting pilot's colour. Sampled audio can't do
 * that without a combinatorial explosion of assets.
 *
 * Signal flow:  voices -> [sfxBus | musicBus] -> compressor -> master -> out
 */

const A4 = 440;
const semi = (n) => A4 * Math.pow(2, n / 12);
// Minor pentatonic on A — reads as tense without being dour.
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];

export class Audio {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.intensity = 0;
    this._targetIntensity = 0;
    this._nextBeat = 0;
    this._beat = 0;
    this._root = -5;
    this._duckUntil = 0;
  }

  /** Must be called from inside a user gesture. */
  async unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;

    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.knee.value = 22;
    this.comp.ratio.value = 6;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.16;

    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.85;
    this.music = ctx.createGain();
    this.music.gain.value = 0.0;

    // A gentle stereo widener on music only; SFX stay centred so positional
    // cues aren't muddied.
    this.wide = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    this.sfx.connect(this.comp);
    this.music.connect(this.comp);
    this.comp.connect(this.master);
    this.master.connect(ctx.destination);

    this._buildNoise();
    this._buildBed();

    if (ctx.state === 'suspended') await ctx.resume();
    this.ready = true;
    this._nextBeat = ctx.currentTime + 0.2;
  }

  _buildNoise() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  _noise(dur, when) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.start(when);
    s.stop(when + dur + 0.05);
    return s;
  }

  // ------------------------------------------------------------------ bed --
  _buildBed() {
    const ctx = this.ctx;

    // Drone: three detuned saws through a slowly-swept lowpass.
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.16;
    this.droneFilter = ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 340;
    this.droneFilter.Q.value = 3.2;

    this.droneOscs = [];
    for (const det of [-9, 0, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = semi(this._root - 24);
      o.detune.value = det;
      const g = ctx.createGain();
      g.gain.value = det === 0 ? 0.5 : 0.3;
      o.connect(g); g.connect(this.droneFilter);
      o.start();
      this.droneOscs.push({ o, g });
    }
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.music);

    // Slow filter LFO so the pad never sits still.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 190;
    lfo.connect(lfoAmt); lfoAmt.connect(this.droneFilter.frequency);
    lfo.start();
    this._lfo = lfo;

    // A sub layer that only appears when things get tense.
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0;
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = semi(this._root - 36);
    sub.connect(this.subGain);
    this.subGain.connect(this.music);
    sub.start();
    this.sub = sub;
  }

  /** 0..1 — drives tempo, filter opening and the sub layer. */
  setIntensity(v) { this._targetIntensity = clamp(v, 0, 1); }

  setMusicLevel(v) {
    if (!this.ready) return;
    this.music.gain.cancelScheduledValues(this.ctx.currentTime);
    this.music.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.8);
  }

  setMuted(m) {
    this.muted = m;
    if (this.ready) this.master.gain.value = m ? 0 : 0.9;
  }

  /** Pull the music down briefly so a big event cuts through. */
  duck(seconds = 0.5, depth = 0.35) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const g = this.music.gain;
    const cur = g.value;
    g.cancelScheduledValues(t);
    g.setValueAtTime(cur, t);
    g.linearRampToValueAtTime(cur * depth, t + 0.04);
    g.linearRampToValueAtTime(cur, t + seconds);
  }

  update(dt) {
    if (!this.ready) return;
    this.intensity += (this._targetIntensity - this.intensity) * Math.min(1, dt * 0.9);
    const I = this.intensity;

    this.droneFilter.Q.value = 3.0 + I * 4;
    this.droneGain.gain.value = 0.13 + I * 0.09;
    this.subGain.gain.value = I * I * 0.11;

    // Sequencer: tempo climbs with intensity.
    const bpm = lerp(78, 122, I);
    const spb = 60 / bpm;
    const now = this.ctx.currentTime;
    let guard = 0;
    while (this._nextBeat < now + 0.12 && guard++ < 8) {
      this._sequence(this._nextBeat, this._beat, I);
      this._beat++;
      this._nextBeat += spb;
    }
  }

  _sequence(when, beat, I) {
    // Pulse on every beat, accented on the downbeat.
    const down = beat % 4 === 0;
    this._pulse(when, down ? 0.30 : 0.14, down ? 54 : 78);

    // Sparse plucks, denser as the match heats up.
    if (Math.random() < 0.16 + I * 0.42) {
      const n = this._root + pick(SCALE) + (Math.random() < 0.25 ? 12 : 0);
      this._pluck(when + rand(0, 0.05), semi(n), 0.07 + I * 0.05);
    }

    // Modulate the tonal centre every 16 bars for slow harmonic movement.
    if (beat % 64 === 0 && beat > 0) {
      this._root = pick([-5, -3, -7, -10]);
      const f = semi(this._root - 24);
      for (const { o } of this.droneOscs) {
        o.frequency.cancelScheduledValues(when);
        o.frequency.linearRampToValueAtTime(f, when + 2.2);
      }
      this.sub.frequency.linearRampToValueAtTime(semi(this._root - 36), when + 2.2);
    }
  }

  _pulse(when, gain, freq) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq * 2.4, when);
    o.frequency.exponentialRampToValueAtTime(freq, when + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
    o.connect(g); g.connect(this.music);
    o.start(when); o.stop(when + 0.4);
  }

  _pluck(when, freq, gain) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq * 2.2;
    f.Q.value = 5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
    o.connect(f); f.connect(g); g.connect(this.music);
    o.start(when); o.stop(when + 0.55);
  }

  // ------------------------------------------------------------------ sfx --

  /**
   * @param {number} speed01  0..1 orb speed, raises pitch and bite
   * @param {number} hue      0..1, shifts the metallic partial — each pilot's
   *                          deflections get a recognisable timbre
   */
  deflect(speed01 = 0.5, power = 1, hue = 0.5) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const base = lerp(180, 340, speed01);

    // Body: a fast downward sine chirp — the "thock".
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(base * 3.1, t);
    o.frequency.exponentialRampToValueAtTime(base * 0.75, t + 0.09);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.34 * power, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
    o.connect(og); og.connect(this.sfx);
    o.start(t); o.stop(t + 0.22);

    // Ring: a metallic partial whose ratio depends on who hit it.
    const r = ctx.createOscillator();
    r.type = 'triangle';
    r.frequency.setValueAtTime(base * lerp(4.2, 7.4, hue), t);
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0, t);
    rg.gain.linearRampToValueAtTime(0.11 * power, t + 0.002);
    rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    r.connect(rg); rg.connect(this.sfx);
    r.start(t); r.stop(t + 0.3);

    // Transient: a very short bandpassed noise crack.
    const n = this._noise(0.09, t);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.setValueAtTime(lerp(1400, 3600, speed01), t);
    nf.Q.value = 1.4;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.20 * power, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
    n.connect(nf); nf.connect(ng); ng.connect(this.sfx);
  }

  wall(speed01 = 0.5) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(lerp(120, 210, speed01), t);
    o.frequency.exponentialRampToValueAtTime(lerp(62, 96, speed01), t + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.19, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.18);

    const n = this._noise(0.06, t);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.1, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.connect(f); f.connect(ng); ng.connect(this.sfx);
  }

  clash() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // Two inharmonic partials = a bell-like clank rather than a musical note.
    for (const [mult, gain] of [[1, 0.15], [2.76, 0.09], [5.4, 0.05]]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 620 * mult * rand(0.94, 1.06);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(g); g.connect(this.sfx);
      o.start(t); o.stop(t + 0.45);
    }
  }

  // --------------------------------------------------------------- bricks --

  /**
   * A block chipped. The most frequent sound in the game by some margin, so it
   * is deliberately small, short and *dark* — a bright click at this rate
   * becomes exhausting inside a minute.
   *
   * @param {number} speed01 orb speed, adds bite
   * @param {number} hp01    remaining integrity — a damaged block rings lower
   *                         and shorter, which is the audible half of the
   *                         cracks appearing on its shell
   */
  brickHit(speed01 = 0.5, hp01 = 1) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const base = lerp(150, 260, hp01) * lerp(0.94, 1.12, speed01);

    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(base * 2.0, t);
    o.frequency.exponentialRampToValueAtTime(base, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.13 * lerp(0.7, 1, hp01), t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07 + hp01 * 0.06);
    o.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.16);

    // Grit: a very short bandpassed crack that tracks impact speed.
    const n = this._noise(0.05, t);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 1.1;
    f.frequency.value = lerp(900, 2200, speed01);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.085, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(f); f.connect(ng); ng.connect(this.sfx);
  }

  /**
   * A block destroyed: a ceramic shatter. Inharmonic partials scattered around
   * a root (so it reads as breaking rather than as a note), a noise burst with
   * a falling filter for the debris, and a small thump underneath for weight.
   */
  brickBreak(maxHp = 2) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // Tougher blocks break lower — a three-hit block should sound like it took
    // three hits to get here.
    const root = maxHp >= 3 ? 300 : 390;

    for (const [mult, gain, dur] of [[1, 0.13, 0.34], [2.41, 0.09, 0.26], [4.17, 0.055, 0.20], [6.8, 0.03, 0.15]]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = root * mult * rand(0.93, 1.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.sfx);
      o.start(t); o.stop(t + dur + 0.02);
    }

    const n = this._noise(0.3, t);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(3400, t);
    f.frequency.exponentialRampToValueAtTime(420, t + 0.28);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.20, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    n.connect(f); f.connect(ng); ng.connect(this.sfx);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(46, t + 0.2);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t);
    sg.gain.linearRampToValueAtTime(0.2, t + 0.006);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    sub.connect(sg); sg.connect(this.sfx);
    sub.start(t); sub.stop(t + 0.3);
  }

  /** Salvage paying out a point: a bright rising triad over a soft duck. */
  salvage() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.duck(0.45, 0.55);
    [0, 7, 12].forEach((n, i) => {
      const st = t + i * 0.065;
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = semi(n + 12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.11, st + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.36);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 5000;
      o.connect(f); f.connect(g); g.connect(this.sfx);
      o.start(st); o.stop(st + 0.38);
    });
  }

  /** A block rising out of the deck: a short upward swell, no transient. */
  brickSurface() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(280 * rand(0.94, 1.08), t + 0.26);
    const g = ctx.createGain();
    // Swelling in rather than clicking in is the whole idea: four of these
    // land together, and four transients at once is a machine-gun burst.
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.075, t + 0.14);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1800;
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.45);
  }

  // ----------------------------------------------------------- black hole --

  /**
   * Telegraph: an inhaling swell. Where the pinball warning is mechanical, this
   * is the room being pulled at — a rising, detuned pair with no transient at
   * all, so it arrives without ever having started.
   */
  blackHoleWarn() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (const det of [0, 11]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(38, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 1.3);
      o.detune.value = det;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.Q.value = 9;
      f.frequency.setValueAtTime(160, t);
      f.frequency.exponentialRampToValueAtTime(900, t + 1.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 1.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o.connect(f); f.connect(g); g.connect(this.sfx);
      o.start(t); o.stop(t + 1.55);
    }
  }

  /**
   * It tearing open: a downward sweep against an upward one. Two things moving
   * in opposite directions at once is the cheapest way to make a sound feel
   * like it has no bottom, which is the only quality a black hole really needs.
   */
  blackHoleOpen() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.duck(1.2, 0.28);

    const down = ctx.createOscillator();
    down.type = 'sine';
    down.frequency.setValueAtTime(320, t);
    down.frequency.exponentialRampToValueAtTime(26, t + 1.1);
    const dg = ctx.createGain();
    dg.gain.setValueAtTime(0, t);
    dg.gain.linearRampToValueAtTime(0.5, t + 0.02);
    dg.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    down.connect(dg); dg.connect(this.sfx);
    down.start(t); down.stop(t + 1.35);

    const up = ctx.createOscillator();
    up.type = 'sawtooth';
    up.frequency.setValueAtTime(60, t);
    up.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
    const uf = ctx.createBiquadFilter();
    uf.type = 'bandpass'; uf.Q.value = 4;
    uf.frequency.setValueAtTime(300, t);
    uf.frequency.exponentialRampToValueAtTime(3400, t + 0.9);
    const ug = ctx.createGain();
    ug.gain.setValueAtTime(0.16, t);
    ug.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
    up.connect(uf); uf.connect(ug); ug.connect(this.sfx);
    up.start(t); up.stop(t + 1.05);

    // Noise wash, opening then shutting — the event horizon settling.
    const n = this._noise(1.2, t);
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.Q.value = 0.7;
    nf.frequency.setValueAtTime(900, t);
    nf.frequency.exponentialRampToValueAtTime(140, t + 1.1);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.24, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    n.connect(nf); nf.connect(ng); ng.connect(this.sfx);
  }

  /** It collapsing: the open sound run backwards and much shorter. */
  blackHoleClose() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(40, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2200;
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.58);

    const n = this._noise(0.3, t + 0.42);
    const nf = ctx.createBiquadFilter();
    nf.type = 'highpass'; nf.frequency.value = 1800;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.12, t + 0.42);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    n.connect(nf); nf.connect(ng); ng.connect(this.sfx);
  }

  // -------------------------------------------------------------- pinball --

  /** Telegraph: a mechanical clunk with something spinning up under it. */
  pinballWarn() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(58, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.9);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(1500, t + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 1.1);
  }

  /** The wells arriving: hydraulics landing hard. */
  pinballDeploy() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.duck(0.5, 0.45);

    const n = this._noise(0.4, t);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(240, t + 0.35);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.26, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    n.connect(f); f.connect(ng); ng.connect(this.sfx);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.32);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.42, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.45);

    // A bright two-note flourish, so "the deck just got dangerous" reads as
    // an event rather than as a thud somewhere off screen.
    [7, 14].forEach((nn, i) => {
      const st = t + 0.04 + i * 0.09;
      const s = ctx.createOscillator();
      s.type = 'square';
      s.frequency.value = semi(nn);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0, st);
      sg.gain.linearRampToValueAtTime(0.07, st + 0.006);
      sg.gain.exponentialRampToValueAtTime(0.0001, st + 0.24);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 3200;
      s.connect(lp); lp.connect(sg); sg.connect(this.sfx);
      s.start(st); s.stop(st + 0.26);
    });
  }

  /** The wells sinking: the deploy run backwards, and quieter. */
  pinballRetract() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.4);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(220, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.46);
  }

  /**
   * A pop bumper. The classic recipe and still the right one: a steep downward
   * pitch sweep on a square wave, which the ear hears as something being
   * *thrown*. Detuned per hit so a well full of them doesn't machine-gun one
   * identical sample.
   */
  bumper(speed01 = 0.5) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const top = lerp(760, 1150, speed01) * rand(0.92, 1.1);

    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(top, t);
    o.frequency.exponentialRampToValueAtTime(top * 0.18, t + 0.085);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 5;
    f.frequency.setValueAtTime(4200, t);
    f.frequency.exponentialRampToValueAtTime(700, t + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.19, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.16);

    // Body thump, so the pop has mass on a phone speaker as well as a desk.
    const s = ctx.createOscillator();
    s.type = 'sine';
    s.frequency.setValueAtTime(190, t);
    s.frequency.exponentialRampToValueAtTime(72, t + 0.12);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t);
    sg.gain.linearRampToValueAtTime(0.16, t + 0.005);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    s.connect(sg); sg.connect(this.sfx);
    s.start(t); s.stop(t + 0.18);
  }

  /** A slingshot: a hard mechanical snap with a metallic tail. */
  sling() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;

    // Snap: near-instant noise slap through a high resonant band.
    const n = this._noise(0.12, t);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 2.4;
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(560, t + 0.1);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.30, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.connect(f); f.connect(ng); ng.connect(this.sfx);

    // Spring: a fast falling saw, which is what makes it read as *fired*.
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(620 * rand(0.94, 1.08), t);
    o.frequency.exponentialRampToValueAtTime(96, t + 0.13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.17, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3000;
    o.connect(lp); lp.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.2);
  }

  goal(isPlayer) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.duck(0.7, 0.30);

    // Impact: filtered noise slam.
    const n = this._noise(0.5, t);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(180, t + 0.42);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.42, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    n.connect(f); f.connect(ng); ng.connect(this.sfx);

    // Sub drop.
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 0.55);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.75);

    // A falling minor third if it happened to you; rising if it didn't.
    const seq = isPlayer ? [semi(4), semi(0)] : [semi(7), semi(12)];
    seq.forEach((fr, i) => {
      const s = ctx.createOscillator();
      s.type = 'triangle';
      s.frequency.value = fr;
      const sg = ctx.createGain();
      const st = t + 0.06 + i * 0.11;
      sg.gain.setValueAtTime(0, st);
      sg.gain.linearRampToValueAtTime(0.13, st + 0.01);
      sg.gain.exponentialRampToValueAtTime(0.0001, st + 0.4);
      s.connect(sg); sg.connect(this.sfx);
      s.start(st); s.stop(st + 0.42);
    });
  }

  explode() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.duck(1.4, 0.22);

    const n = this._noise(1.4, t);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(5200, t);
    f.frequency.exponentialRampToValueAtTime(90, t + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.62, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
    n.connect(f); f.connect(g); g.connect(this.sfx);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(24, t + 1.0);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.6, t + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(og); og.connect(this.sfx);
    o.start(t); o.stop(t + 1.25);
  }

  surge() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(1150, t + 0.26);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 7;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.26);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.20, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.34);
  }

  serve() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // Charge: rising filtered noise.
    const n = this._noise(1.1, t);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 5;
    f.frequency.setValueAtTime(240, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + 1.0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.95);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.12);
    n.connect(f); f.connect(g); g.connect(this.sfx);

    // Release.
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(880, t + 1.0);
    o.frequency.exponentialRampToValueAtTime(220, t + 1.16);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t + 1.0);
    og.gain.linearRampToValueAtTime(0.16, t + 1.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(og); og.connect(this.sfx);
    o.start(t + 1.0); o.stop(t + 1.22);
  }

  // ------------------------------------------------------------------ arc --

  /**
   * Raising the fence: a rising bandpassed noise sweep, hard amplitude
   * modulation at mains-hum rate, and a sub thump underneath.
   *
   * The AM is what makes it read as *electrical* rather than as a whoosh —
   * chopping the noise at ~55Hz is the same trick the shader plays with its
   * gated filaments, and hearing and seeing the same rate lands them together.
   */
  arcOn() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    this.duck(0.5, 0.5);

    const n = this._noise(0.7, t);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 3.5;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(4200, t + 0.30);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.34, t + 0.10);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);

    // Ring-modulate the noise to chop it into a crackle.
    const am = ctx.createGain();
    am.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(38, t);
    lfo.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 1;
    lfo.connect(lfoAmt); lfoAmt.connect(am.gain);
    lfo.start(t); lfo.stop(t + 0.7);

    n.connect(bp); bp.connect(am); am.connect(g); g.connect(this.sfx);

    // Sub thump for weight.
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.4);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.42, t + 0.012);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(og); og.connect(this.sfx);
    o.start(t); o.stop(t + 0.6);

    this._arcLoopStart();
  }

  /** The sustained hum while the fence is up. Built once, gated by a gain. */
  _arcLoopStart() {
    const ctx = this.ctx;
    if (!this._arcBus) {
      const bus = ctx.createGain();
      bus.gain.value = 0;
      bus.connect(this.sfx);

      // Buzz: a detuned saw pair through a resonant bandpass — the classic
      // transformer-hum recipe — plus filtered noise for the sizzle on top.
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 900; filt.Q.value = 6;
      filt.connect(bus);

      for (const f of [58, 87.5, 174]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = f > 100 ? 0.10 : 0.22;
        o.connect(g); g.connect(filt);
        o.start();
      }

      const hiss = this._noise(1e6, ctx.currentTime);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 2600;
      const hg = ctx.createGain();
      hg.gain.value = 0.075;
      hiss.connect(hp); hp.connect(hg); hg.connect(bus);

      // Irregular tremolo so the hum never sits perfectly still.
      const trem = ctx.createOscillator();
      trem.type = 'sine'; trem.frequency.value = 7.3;
      const tremAmt = ctx.createGain();
      tremAmt.gain.value = 420;
      trem.connect(tremAmt); tremAmt.connect(filt.frequency);
      trem.start();

      this._arcBus = bus;
    }
    const g = this._arcBus.gain;
    const t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.30, t + 0.10);
  }

  /** Fence expiring: cut the hum and drop a power-down over the top. */
  arcOff() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (this._arcBus) {
      const g = this._arcBus.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.exponentialRampToValueAtTime(0.0001, t + 0.28);
    }
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.34);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 8;
    f.frequency.setValueAtTime(3000, t);
    f.frequency.exponentialRampToValueAtTime(200, t + 0.34);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.4);
  }

  /** An orb striking the fence: a short, bright electrical snap. */
  arcHit(speed01 = 0.5) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;

    const n = this._noise(0.14, t);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(lerp(2600, 5200, speed01), t);
    bp.frequency.exponentialRampToValueAtTime(700, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.30, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    n.connect(bp); bp.connect(g); g.connect(this.sfx);

    // A pitched zap on top so successive hits stay distinguishable.
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(lerp(700, 1300, speed01) * rand(0.9, 1.12), t);
    o.frequency.exponentialRampToValueAtTime(160, t + 0.09);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.13, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(og); og.connect(this.sfx);
    o.start(t); o.stop(t + 0.12);
  }

  /** The fence coming off cooldown — a short, bright two-note ping. */
  arcReady() {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    [0, 0.075].forEach((off, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = semi(i === 0 ? 12 : 19);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + off);
      g.gain.linearRampToValueAtTime(0.075, t + off + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.30);
      o.connect(g); g.connect(this.sfx);
      o.start(t + off); o.stop(t + off + 0.32);
    });
  }

  ui(kind = 'tick') {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const freq = kind === 'confirm' ? 880 : kind === 'back' ? 330 : 660;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(freq, t);
    if (kind === 'confirm') o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 3200;
    o.connect(f); f.connect(g); g.connect(this.sfx);
    o.start(t); o.stop(t + 0.14);
  }

  stinger(win) {
    if (!this.ready || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const notes = win ? [0, 7, 12, 19] : [0, -2, -5, -12];
    notes.forEach((n, i) => {
      const st = t + i * 0.13;
      for (const [mult, gain] of [[1, 0.15], [2, 0.07]]) {
        const o = ctx.createOscillator();
        o.type = win ? 'triangle' : 'sawtooth';
        o.frequency.value = semi(n) * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, st);
        g.gain.linearRampToValueAtTime(gain, st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 1.1);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = win ? 4200 : 1400;
        o.connect(f); f.connect(g); g.connect(this.sfx);
        o.start(st); o.stop(st + 1.15);
      }
    });
  }
}
