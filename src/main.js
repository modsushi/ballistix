import * as THREE from 'three';
import { detectTier, PRESETS, ResolutionGovernor } from './core/quality.js';
import { AssetStore } from './gfx/assets.js';
import { setColormap } from './gfx/materials.js';
import { buildEnvironment } from './gfx/environment.js';
import { PostFX } from './gfx/postfx.js';
import { GameCamera } from './game/camera.js';
import { Game } from './game/game.js';
import { Input } from './core/input.js';
import { Audio } from './core/audio.js';
import { HUD } from './ui/hud.js';
import { clamp } from './core/math.js';

/**
 * Bootstrap, frame loop and screen flow.
 *
 * Notable choices:
 *  · The scene renders into a linear HDR target and is tonemapped by our own
 *    composite pass, so three's tone mapping and output encoding are both
 *    switched off here. Turning either back on will double-encode.
 *  · Shaders are compiled before the menu is shown. A first-frame shader
 *    compile on a phone is a 300ms freeze at exactly the moment the player is
 *    forming an opinion about the game.
 *  · The menu sits over a live attract match rather than a static backdrop.
 */

const $ = (id) => document.getElementById(id);

class App {
  constructor() {
    this.hud = new HUD();
    this.audio = new Audio();
    this.difficulty = 1;
    this.timer = new THREE.Timer();
    this.governor = new ResolutionGovernor(0.62);
    this.renderScale = 1;
    this.running = false;
    this.inMatch = false;
  }

  async start() {
    const canvas = $('gl');

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,          // MSAA is configured on the HDR target instead
        alpha: false,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      console.error(err);
      this.hud.showScreen($('nowebgl'));
      $('boot').classList.add('hidden');
      return;
    }
    if (!renderer.capabilities.isWebGL2) {
      this.hud.showScreen($('nowebgl'));
      $('boot').classList.add('hidden');
      return;
    }

    this.renderer = renderer;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;   // the arena is static; see _bake
    // Manual reset: three clears these per render() call, which would leave
    // us reading the fullscreen composite pass instead of the scene.
    renderer.info.autoReset = false;
    this.stats = { sceneCalls: 0, sceneTris: 0, totalCalls: 0, fps: 0 };

    const probe = detectTier(renderer.getContext());
    // `?tier=0|1|2` and `?dpr=` force a quality level — used for testing the
    // low-end path on a desktop and for capturing consistent screenshots.
    const q = new URLSearchParams(location.search);
    const forced = q.has('tier') ? clamp(Number(q.get('tier')) | 0, 0, 2) : probe.tier;
    this.tier = forced;
    this.preset = { ...PRESETS[forced] };
    this.isTouch = probe.touch;
    this._dprOverride = q.has('dpr') ? Number(q.get('dpr')) : null;
    this._noMusic = q.has('nomusic');
    this._zoom = q.has('zoom') ? Number(q.get('zoom')) : null;   // framing checks
    this._auto = q.has('auto');                                  // balance harness

    // Half-float render targets are required by the post chain. If the
    // extension is missing there is no graceful path, so fail loudly.
    if (!renderer.extensions.get('EXT_color_buffer_half_float') &&
        !renderer.extensions.get('EXT_color_buffer_float')) {
      console.warn('[gfx] no float render targets; disabling MSAA and hoping for the best');
      this.preset.msaa = 0;
    }

    this.baseDpr = this._dprOverride ?? Math.min(window.devicePixelRatio || 1, this.preset.maxDpr);

    // ---- scene ------------------------------------------------------------
    this.scene = new THREE.Scene();
    this.gcam = new GameCamera(this._aspect());
    this.postfx = new PostFX(renderer, this.preset);
    this.input = new Input(canvas);

    this._resize();
    window.addEventListener('resize', () => this._resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this._resize(), 220));
    visualViewport?.addEventListener('resize', () => this._resize());

    // ---- load -------------------------------------------------------------
    this.hud.setLoadProgress(0.04, 'LINKING SHADERS');
    await this._nextFrame();

    this.assets = new AssetStore();
    await this.assets.loadAll((done, total, name) => {
      this.hud.setLoadProgress(0.05 + (done / total) * 0.62, `LOADING ${name.toUpperCase()}`);
    });

    if (this.assets.colormap) setColormap(this.assets.colormap);

    this.hud.setLoadProgress(0.70, 'IGNITING NEBULA');
    await this._nextFrame();
    this.env = buildEnvironment(renderer, this.scene, this.preset);

    this.hud.setLoadProgress(0.80, 'ASSEMBLING DECK');
    await this._nextFrame();
    this.game = new Game(this.scene, this.gcam, this.assets, this.audio, this.hud, this.preset, this.input);
    this.game.onMatchEnd = (r) => this._onMatchEnd(r);

    this.hud.setLoadProgress(0.90, 'COMPILING PIPELINE');
    await this._nextFrame();
    await renderer.compileAsync(this.scene, this.gcam.cam);
    this._bakeShadows();

    this.hud.setLoadProgress(1, 'READY');
    await this._nextFrame();

    // ---- go ---------------------------------------------------------------
    this._wireUI();
    this.game.startAttract();
    this.running = true;
    renderer.setAnimationLoop(() => this._frame());

    await this._sleep(320);
    await this.hud.hideScreen($('boot'));
    this.hud.showScreen($('menu'));
    this.hud.showGame(false);
  }

  /**
   * The arena never moves and the key light never moves, so the shadow map only
   * needs rendering once. Crafts and orbs don't cast into it — their contact
   * shadows are faked, which is both cheaper and softer than a 1k map could be.
   */
  _bakeShadows() {
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.setRenderTarget(this.postfx.hdr);
    this.renderer.render(this.scene, this.gcam.cam);
    this.renderer.setRenderTarget(null);
  }

  // -------------------------------------------------------------------- ui --
  _wireUI() {
    const tap = async (fn) => { await this.audio.unlock(); fn(); };

    for (const btn of document.querySelectorAll('.diff')) {
      btn.addEventListener('click', () => tap(() => {
        document.querySelectorAll('.diff').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = Number(btn.dataset.diff);
        this.audio.ui('tick');
      }));
    }

    $('playBtn').addEventListener('click', () => tap(() => this._startMatch()));
    $('againBtn').addEventListener('click', () => tap(() => this._startMatch()));
    $('menuBtn').addEventListener('click', () => tap(() => this._toMenu()));
    $('pauseBtn').addEventListener('click', () => tap(() => this._setPaused(true)));
    $('resumeBtn').addEventListener('click', () => tap(() => this._setPaused(false)));
    $('quitBtn').addEventListener('click', () => tap(() => {
      this._setPaused(false);
      this._toMenu();
    }));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.inMatch && !this.paused) this._setPaused(true);
        // Suspending the audio graph while hidden matters on phones: a running
        // context keeps the audio thread (and the radio, via wake locks) alive.
        this.audio.ctx?.suspend?.();
      } else if (this.audio.ctx?.state === 'suspended' && this.audio.ready) {
        this.audio.ctx.resume();
      }
    });
    window.addEventListener('blur', () => {
      if (this.inMatch && !this.paused) this._setPaused(true);
    });

    // Mobile browsers drop the GL context when memory gets tight or the app is
    // backgrounded for a while. Without preventDefault the context is gone for
    // good and the canvas stays black forever.
    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.running = false;
      this.renderer.setAnimationLoop(null);
      console.warn('[gfx] context lost');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      console.warn('[gfx] context restored');
      this._resize();
      this.renderer.shadowMap.needsUpdate = true;
      this.running = true;
      this.timer.update();                 // swallow the gap
      this.renderer.setAnimationLoop(() => this._frame());
    });
  }

  async _startMatch() {
    this.audio.ui('confirm');
    this._music(0.5);
    await Promise.all([
      this.hud.hideScreen($('menu')),
      this.hud.hideScreen($('result')),
    ]);
    this.hud.showGame(true);
    this.inMatch = true;
    this.game.autoPlayer = this._auto;
    this.game.startMatch(this.difficulty);
  }

  async _toMenu() {
    this.audio.ui('back');
    this.inMatch = false;
    await Promise.all([
      this.hud.hideScreen($('result')),
      this.hud.hideScreen($('pause')),
    ]);
    this.hud.showGame(false);
    this.game.startAttract();
    this.hud.showScreen($('menu'));
    this._music(0.28);
  }

  _setPaused(p) {
    this.paused = p;
    this.game.setPaused(p);
    // A paused match is silent — bed, effects and any sustained voice such as
    // a live ARC fence, which would otherwise hum on over a frozen deck.
    this.audio.setPauseMuted(p);
    if (p) {
      this.audio.ui('back');
      this.hud.showScreen($('pause'));
    } else {
      this.audio.ui('tick');
      this.hud.hideScreen($('pause'));
    }
  }

  _onMatchEnd(result) {
    this.inMatch = false;
    this.hud.showGame(false);
    this._music(0.25);
    // The result screen drives the arena: every beat of the tally gets a volley
    // out of the winner's hull, so the celebration and the numbers are one
    // performance rather than two things happening at once.
    const won = result.order[0] === 0;
    this.gcam.victoryPanel = true;
    this.hud.showResult(result, {
      beat: (i) => {
        this.audio.ui(i === 0 ? 'confirm' : 'tick');
        if (won && i === 0) this.game.celebrateBurst(1.0);
      },
      tick: (p) => {
        this.audio.scoreTick(p);
        if (won && Math.random() < 0.035) this.game.celebrateBurst(0.45);
      },
      land: (w) => {
        this.audio.scoreLand(w);
        if (w) this.game.celebrateBurst(1.5);
      },
    });
  }

  // ---------------------------------------------------------------- resize --
  _aspect() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    return w / h;
  }

  _resize() {
    const cssW = Math.max(1, Math.floor(window.innerWidth));
    const cssH = Math.max(1, Math.floor(window.innerHeight));
    const dpr = this.baseDpr * this.renderScale;

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(cssW, cssH, false);
    const canvas = this.renderer.domElement;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const buf = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(buf);
    this.postfx.setSize(buf.x, buf.y);
    this.gcam.resize(cssW / cssH);
    this.env?.setPixelRatio(dpr);
    this.game?.effects.setPixelRatio(Math.min(dpr, 2));
    this.game?.refreshMapper(cssW);
    this.cssWidth = cssW;

    // Re-bake: the shadow camera is unchanged but the map may have been lost
    // if the context was restored during a resize on mobile Safari.
    if (this.game) this.renderer.shadowMap.needsUpdate = true;
  }

  _applyRenderScale() {
    this._resize();
  }

  // ----------------------------------------------------------------- frame --
  _frame() {
    if (!this.running) return;
    this.timer.update();
    const dtRaw = this.timer.getDelta();
    // Clamp: a backgrounded tab returns a multi-second delta that would fling
    // every orb through a wall before the substepper could catch it.
    const dt = Math.min(dtRaw, 1 / 20);

    if (this.governor.update(dtRaw * 1000)) {
      this.renderScale = this.governor.scale;
      this._applyRenderScale();
    }

    const t = this.timer.getElapsed();

    if (this._zoom) this.gcam.targetZoom = this._zoom;
    this.audio.update(dt);
    // Refresh the control mapping before the sim reads it, so input maps
    // against the camera the player is actually looking through.
    this.game.refreshMapper(this.cssWidth);
    this.game.update(dt);
    this.gcam.update(dt, t);
    this.env.update(t);

    // Keep the sky centred on the camera so it reads as infinitely distant.
    this.env.group.position.copy(this.gcam.cam.position);

    // Post uniforms driven by gameplay.
    const u = this.postfx.u;
    const fx = this.game.effects;
    u.uFlash.value = fx.flash;
    u.uFlashTint.value.copy(fx.flashColor);
    u.uRadial.value = fx.radial;
    u.uDesat.value = (1 - this.game.timeScale) * 0.30;
    u.uExposure.value = 0.92 + fx.flash * 0.22;
    // On your last point the frame itself starts to close in. Peripheral
    // and pre-attentive, so it raises tension without stealing a glance.
    const lastLife = this.inMatch && this.game.alive[0] && this.game.scores[0] <= 1;
    const pulse = lastLife ? 0.5 + 0.5 * Math.sin(t * 5.2) : 0;
    u.uVignette.value += (0.44 + pulse * 0.30 - u.uVignette.value) * Math.min(1, dt * 4);
    u.uBloomStrength.value = 0.42 + fx.flash * 0.45;

    this.renderer.info.reset();
    this.postfx.renderScene(this.scene, this.gcam.cam);
    const r = this.renderer.info.render;
    this.stats.sceneCalls = r.calls;
    this.stats.sceneTris = r.triangles;
    this.postfx.present(t);
    this.stats.totalCalls = this.renderer.info.render.calls;
    this.stats.fps = 1000 / Math.max(0.01, this.governor.avg);

    if (this.input.consumePause() && this.inMatch) this._setPaused(!this.paused);
  }

  /** `?nomusic` silences the bed without touching SFX — useful when capturing. */
  _music(level) { this.audio.setMusicLevel(this._noMusic ? 0 : level); }

  _nextFrame() { return new Promise((r) => requestAnimationFrame(() => r())); }
  _sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
}

const app = new App();
app.start().catch((err) => {
  console.error('[boot] fatal', err);
  const el = document.getElementById('loadText');
  if (el) el.textContent = 'STARTUP FAILED — SEE CONSOLE';
});

// Expose for debugging in the console; harmless in production.
window.__ballistix = app;
