import { BLACKHOLE, BRICKS, PINBALL, PLAYERS, RULES } from '../core/config.js';

/**
 * DOM-side interface. Kept entirely out of the WebGL layer.
 *
 * Text rendered by the browser stays crisp at any device pixel ratio and reflows
 * for free when the viewport changes — both things a canvas-drawn HUD makes you
 * pay for. The trade is that updates cost layout, so every method here is a
 * no-op when the value hasn't actually changed.
 */

const ARC_LEN = 2 * Math.PI * 42;

const el = (id) => document.getElementById(id);

// The lightning bolt, reused from the HUD's ARC meter so the menu teaches the
// same glyph the player will be watching for mid-match.
const BOLT = '<svg class="g-bolt" viewBox="0 0 12 20" aria-hidden="true"><path d="M8.4 0 L1 11.4 H4.9 L3.6 20 L11 8.2 H6.6 Z"/></svg>';

/**
 * Controls, drawn rather than written.
 *
 * A block of prose on a menu is read once and forgotten; a picture of the key
 * you are about to press survives the first rally. W and S are shown but dimmed
 * — the cluster is what people recognise, and greying the two that do nothing
 * is more honest than pretending the pair is all there is.
 */
const KEY_CONTROLS = `
  <div class="ctrl">
    <div class="keys wasd">
      <b class="key dead">W</b>
      <b class="key">A</b><b class="key dead">S</b><b class="key">D</b>
    </div>
    <i>STEER</i>
  </div>
  <div class="ctrl">
    <b class="key space">SPACE</b>
    <i>${BOLT}ARC / SURGE</i>
  </div>
  <div class="ctrl">
    <b class="key">SHIFT</b>
    <i>SURGE ONLY</i>
  </div>`;

const TOUCH_CONTROLS = `
  <div class="ctrl">
    <svg class="glyph" viewBox="0 0 44 32" aria-hidden="true">
      <path class="g-stroke" d="M8 16 H36" />
      <path class="g-stroke" d="M12 11 L7 16 L12 21" />
      <path class="g-stroke" d="M32 11 L37 16 L32 21" />
      <circle class="g-fill" cx="22" cy="16" r="5" />
    </svg>
    <i>SLIDE TO STEER</i>
  </div>
  <div class="ctrl">
    <svg class="glyph" viewBox="0 0 44 32" aria-hidden="true">
      <circle class="g-stroke" cx="22" cy="16" r="12" opacity="0.35" />
      <circle class="g-stroke" cx="22" cy="16" r="8" opacity="0.7" />
      <circle class="g-fill" cx="22" cy="16" r="4" />
    </svg>
    <i>${BOLT}TAP TO FIRE</i>
  </div>`;

export class HUD {
  constructor() {
    this.dom = {
      hud: el('hud'),
      rivals: el('rivals'),
      orbCount: el('orbCount'),
      selfArc: el('selfArc'),
      selfScore: el('selfScore'),
      selfPips: el('selfPips'),
      countdown: el('countdown'),
      countdownNum: el('countdown').querySelector('span'),
      toasts: el('toasts'),
      arcMeter: el('arcMeter'),
      arcFill: el('arcFill'),
      arcWord: el('arcWord'),
      salvMeter: el('salvMeter'),
      salvFill: el('salvFill'),
      salvWord: el('salvWord'),
      pinMeter: el('pinMeter'),
      pinFill: el('pinFill'),
      pinWord: el('pinWord'),
      bhMeter: el('bhMeter'),
      bhFill: el('bhFill'),
      bhWord: el('bhWord'),
      combo: el('combo'),
      comboNum: el('comboNum'),
      comboMult: el('comboMult'),
      scoreValue: el('scoreValue'),
      pops: el('pops'),
      boot: el('boot'),
      loadFill: el('loadFill'),
      loadText: el('loadText'),
      menu: el('menu'),
      pause: el('pause'),
      result: el('result'),
      resultBadge: el('resultBadge'),
      resultTitle: el('resultTitle'),
      standings: el('standings'),
      matchStats: el('matchStats'),
      ctrlHint: el('ctrlHint'),
      nowebgl: el('nowebgl'),
    };

    this.pods = [];
    this.pips = [];
    this._scores = [-1, -1, -1, -1];
    this._orbs = -1;
    this._combo = -1;
    this._mult = -1;
    this._points = -1;
    this._arc = -1;
    this._arcState = '';
    this._salv = -1;
    this._salvClosed = null;
    this._pin = -1;
    this._pinLive = null;
    this._bh = -1;
    this._bhLive = null;
    this._countTimer = null;
    this._popCursor = 0;
    this._pops = [];
    this._seqTimers = [];
    this._countRaf = 0;
    // No readout for anything that isn't in the match.
    if (!PINBALL.enabled) this.dom.pinMeter.style.display = 'none';
    if (!BLACKHOLE.enabled) this.dom.bhMeter.style.display = 'none';
    this._buildPods();
    this._buildPops();
    this._setControlHint();
  }

  /**
   * Pips run to `maxPoints`, not to the five everyone starts on: salvage can
   * push a pilot above the starting line, and a meter that can only ever go
   * down would hide the single most interesting thing on the board. The slots
   * past five are narrower and gold, so "banked" reads differently from "still
   * holding what I was given" at a glance.
   */
  _pipStrip(wrap) {
    const pips = [];
    for (let k = 0; k < RULES.maxPoints; k++) {
      const s = document.createElement('i');
      s.className = k >= RULES.startPoints ? 'pip bonus' : 'pip';
      wrap.appendChild(s);
      pips.push(s);
    }
    return pips;
  }

  _buildPods() {
    // Rivals appear left-to-right in the same order they sit around the arena
    // from the player's viewpoint: west, north, east.
    const order = [1, 2, 3];
    this.dom.rivals.innerHTML = '';
    for (const i of order) {
      const p = PLAYERS[i];
      const pod = document.createElement('div');
      pod.className = 'pod';
      pod.style.setProperty('--c', p.css);
      pod.innerHTML = `<div class="pod-name">${p.name}</div><div class="pips"></div>`;
      this.dom.rivals.appendChild(pod);
      this.pods[i] = pod;
      this.pips[i] = this._pipStrip(pod.querySelector('.pips'));
    }

    this.dom.selfPips.innerHTML = '';
    this.pips[0] = this._pipStrip(this.dom.selfPips);
    this.pods[0] = el('selfPod');
  }

  /**
   * Score popups are pooled and positioned with `transform` only.
   *
   * One of these fires on every deflection, in the middle of the busiest frame
   * of the match — creating a node and writing `left`/`top` would put a layout
   * and a style recalc exactly there. A fixed ring of nodes moved on the
   * compositor costs nothing measurable.
   */
  _buildPops(n = 14) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'pop';
      d.innerHTML = '<span></span>';
      this.dom.pops.appendChild(d);
      this._pops.push({ node: d, span: d.firstElementChild });
    }
  }

  _setControlHint() {
    const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
    this.dom.ctrlHint.innerHTML = touch ? TOUCH_CONTROLS : KEY_CONTROLS;
  }

  // --------------------------------------------------------------- screens --
  showGame(show) {
    this.dom.hud.style.opacity = show ? '1' : '0';
    this.dom.hud.style.transition = 'opacity .4s cubic-bezier(.16,1,.3,1)';
    // A faded-out HUD must also stop taking taps — the pause button sits under
    // the menus' dead zones and would otherwise still be hittable.
    this.dom.hud.classList.toggle('inert', !show);
  }

  /** Fade a screen out, then hide it. Resolves when it's gone. */
  hideScreen(node) {
    return new Promise((resolve) => {
      if (node.classList.contains('hidden')) return resolve();
      node.classList.add('leaving');
      setTimeout(() => {
        node.classList.add('hidden');
        node.classList.remove('leaving');
        resolve();
      }, 320);
    });
  }

  showScreen(node) {
    node.classList.remove('hidden', 'leaving');
    // Restart the entry animation even if the node was recently shown.
    node.style.animation = 'none';
    void node.offsetWidth;
    node.style.animation = '';
  }

  setLoadProgress(frac, label) {
    this.dom.loadFill.style.width = `${Math.round(frac * 100)}%`;
    if (label) this.dom.loadText.textContent = label;
  }

  // ------------------------------------------------------------------ hud --
  setScore(index, value, max = RULES.maxPoints) {
    if (this._scores[index] === value) return;
    const prev = this._scores[index];
    const dropped = value < prev && prev >= 0;
    const gained = value > prev && prev >= 0;
    this._scores[index] = value;

    const pips = this.pips[index];
    for (let k = 0; k < pips.length; k++) pips[k].classList.toggle('spent', k >= value);

    if (index === 0) {
      this.dom.selfScore.textContent = String(value);
      this.dom.selfArc.style.strokeDashoffset = String(ARC_LEN * (1 - value / max));
      this.dom.selfArc.style.stroke = value <= 1 ? 'var(--danger)'
        : value > RULES.startPoints ? 'var(--salv)' : 'var(--p0)';
      if (dropped || gained) this._replay(this.dom.selfScore, dropped ? 'hit' : 'gain');
    }
    if (dropped) this._replay(this.pods[index], 'hit');
    else if (gained) this._replay(this.pods[index], 'gain');
  }

  /**
   * The deck no longer pays out — the final duel is defence only. Shown rather
   * than left to be inferred, because a meter that silently stops filling is
   * indistinguishable from a bug.
   */
  setSalvageClosed(closed) {
    if (closed === this._salvClosed) return;
    this._salvClosed = closed;
    this.dom.salvMeter.classList.toggle('closed', closed);
    this.dom.salvWord.textContent = closed ? 'CLOSED' : 'SALVAGE';
    if (closed) {
      this._salv = 0;
      this.dom.salvFill.style.width = '0%';
    }
  }

  /**
   * Salvage banked toward the next point.
   *
   * @param {number} value  blocks shattered since the last payout
   * @param {number} per    blocks needed for a point
   */
  setSalvage(value, per) {
    if (this._salvClosed) return;
    const pct = Math.round(Math.min(1, value / per) * 100);
    if (pct === this._salv) return;
    // A payout resets to zero; flash the meter rather than letting the bar
    // silently snap back, which reads as a bug.
    if (pct < this._salv) this._replay(this.dom.salvMeter, 'paid');
    this._salv = pct;
    this.dom.salvFill.style.width = `${pct}%`;
  }

  markEliminated(index) {
    this.pods[index]?.classList.add('dead');
  }

  setOrbCount(n) {
    if (this._orbs === n) return;
    const grew = n > this._orbs && this._orbs >= 0;
    this._orbs = n;
    this.dom.orbCount.textContent = String(n);
    if (grew) this._replay(this.dom.orbCount, 'bump');
  }

  /** The running arcade score. Lives are the pip strip; this is the reward. */
  setPoints(v) {
    if (this._points === v) return;
    const grew = v > this._points && this._points >= 0;
    this._points = v;
    this.dom.scoreValue.textContent = String(v);
    if (grew) this._replay(this.dom.scoreValue, 'bump');
  }

  /**
   * @param {number} n     consecutive deflections
   * @param {number} mult  what the next one will pay
   *
   * The multiplier is the headline and the chain the small print: the player
   * cares what a hit is worth, not how many they have strung together. The
   * panel only appears once the multiplier does — a "×1" is not news.
   */
  setCombo(n, mult = 1) {
    if (this._combo === n && this._mult === mult) return;
    const stepped = mult > this._mult && this._mult > 0;
    this._combo = n;
    this._mult = mult;

    if (mult < 2) {
      this.dom.combo.classList.remove('show');
      return;
    }
    this.dom.comboMult.textContent = `×${mult}`;
    this.dom.comboNum.textContent = String(n);
    this.dom.combo.classList.add('show');
    // Both classes off before either goes on: leaving `step` applied would let
    // it keep winning the cascade and the per-hit tick would never play again.
    this.dom.combo.classList.remove('tick', 'step');
    void this.dom.combo.offsetWidth;
    this.dom.combo.classList.add(stepped ? 'step' : 'tick');
  }

  /**
   * A floating award at a point on screen.
   *
   * @param {number} x  CSS pixels
   * @param {number} y  CSS pixels
   */
  pop(x, y, text, kind = '') {
    const it = this._pops[this._popCursor];
    this._popCursor = (this._popCursor + 1) % this._pops.length;
    it.span.textContent = text;
    it.node.className = 'pop' + (kind ? ` ${kind}` : '');
    it.node.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    // Restart the rise even if this node is still mid-flight from a moment ago.
    it.span.style.animation = 'none';
    void it.span.offsetWidth;
    it.span.style.animation = '';
  }

  /**
   * @param {number} value  0..1 — charge while recharging, time left while live
   * @param {boolean} ready charged and available
   * @param {boolean} live  currently burning
   */
  setArc(value, ready, live) {
    const state = live ? 'live' : ready ? 'ready' : '';
    // The bar moves every frame while live, so only touch the DOM when the
    // rounded value actually changes — a HUD write is a layout write.
    const pct = Math.round(value * 100);
    if (pct !== this._arc) {
      this._arc = pct;
      this.dom.arcFill.style.width = `${pct}%`;
    }
    if (state === this._arcState) return;
    this._arcState = state;
    this.dom.arcMeter.classList.toggle('ready', state === 'ready');
    this.dom.arcMeter.classList.toggle('live', state === 'live');
    this.dom.arcWord.textContent = live ? 'LIVE' : ready ? 'READY' : 'ARC';
  }

  /**
   * The pinball wells' deploy cycle.
   *
   * One bar doing double duty: it fills while they are retracted and about to
   * arrive, and drains while they are live. Either way the bar is time you can
   * plan around, which is the only reason a cycling hazard is fair.
   *
   * @param {number} value 0..1
   * @param {boolean} live currently deployed
   */
  setPinball(value, live) {
    const pct = Math.round(value * 100);
    if (pct !== this._pin) {
      this._pin = pct;
      this.dom.pinFill.style.width = `${pct}%`;
    }
    if (live === this._pinLive) return;
    this._pinLive = live;
    this.dom.pinMeter.classList.toggle('live', live);
    this.dom.pinWord.textContent = live ? 'LIVE' : 'BUMPERS';
  }

  /**
   * The singularity's cycle. Same bar convention as the wells: filling toward
   * the next one, draining while it is open.
   */
  setBlackHole(value, live) {
    const pct = Math.round(value * 100);
    if (pct !== this._bh) {
      this._bh = pct;
      this.dom.bhFill.style.width = `${pct}%`;
    }
    if (live === this._bhLive) return;
    this._bhLive = live;
    this.dom.bhMeter.classList.toggle('live', live);
    this.dom.bhWord.textContent = live ? 'OPEN' : 'SINGULARITY';
  }

  /**
   * The serve countdown — the one thing that earns the middle of the arena,
   * because it is the only message the player has to act on *before* it ends.
   *
   * @param {number|string} n
   */
  countdown(n) {
    this.dom.countdownNum.textContent = String(n);
    this.dom.countdown.classList.remove('show');
    void this.dom.countdown.offsetWidth;
    this.dom.countdown.classList.add('show');
    clearTimeout(this._countTimer);
    this._countTimer = setTimeout(() => this.dom.countdown.classList.remove('show'), 950);
  }

  /**
   * Everything else that used to be shouted across the deck.
   *
   * A toast sits out of the play area and stacks instead of overwriting, so two
   * things happening at once both get read — which the single centre slot could
   * never do — and nothing blurs across the orb you are tracking.
   *
   * @param {string} text
   * @param {{color?: string, tone?: 'good'|'bad'}} [opts]
   */
  toast(text, opts = {}) {
    const t = document.createElement('div');
    t.className = 'toast' + (opts.tone ? ` ${opts.tone}` : '');
    if (opts.color) t.style.setProperty('--c', opts.color);
    t.textContent = text;
    this.dom.toasts.appendChild(t);
    // Cap the stack: a knockout cascade would otherwise run off the top.
    while (this.dom.toasts.children.length > 3) this.dom.toasts.firstElementChild.remove();
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 360);
    }, 2200);
  }

  clearToasts() {
    this.dom.toasts.innerHTML = '';
    this.dom.countdown.classList.remove('show');
    clearTimeout(this._countTimer);
  }

  /** Re-trigger a CSS animation class that may already be applied. */
  _replay(node, cls) {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  resetMatch() {
    this._scores = [-1, -1, -1, -1];
    this._orbs = -1;
    this._combo = -1;
    this._mult = -1;
    this._points = -1;
    for (let i = 0; i < 4; i++) {
      this.pods[i]?.classList.remove('dead', 'hit');
      this.setScore(i, RULES.startPoints);
    }
    this.dom.combo.classList.remove('show');
    for (const p of this._pops) p.span.style.animation = 'none';
    this._clearSequence();
    this.clearToasts();
    this._arc = -1;
    this._arcState = '';
    this.setArc(0, false, false);
    this._salv = -1;
    this._salvClosed = null;
    this.setSalvageClosed(false);
    this.setSalvage(0, BRICKS.perPoint);
    this._pin = -1;
    this._pinLive = null;
    this.setPinball(0, false);
    this._bh = -1;
    this._bhLive = null;
    this.setBlackHole(0, false);
  }

  // --------------------------------------------------------------- result --
  /**
   * @param {{order:number[], stats:object}} result
   *   `order` is finishing position, best first.
   */
  /**
   * The result screen, played as a sequence rather than printed.
   *
   * Everything arrives on a beat: the verdict stamps, the board builds a row at
   * a time, the score counts up out of zero, and the breakdown lands last. It
   * takes about three seconds, which is roughly how long a player sits looking
   * at a result before reaching for the button anyway — the difference is that
   * those three seconds now have something happening in them.
   *
   * @param {object} result
   * @param {{tick?:(p:number)=>void, beat?:(i:number)=>void,
   *          land?:(won:boolean)=>void}} [hooks]
   *   Audio and arena reactions, injected so the HUD keeps knowing nothing
   *   about either.
   */
  showResult(result, hooks = {}) {
    this._clearSequence();
    const won = result.order[0] === 0;
    const s = result.stats;

    this.dom.result.classList.toggle('won', won);
    this.dom.resultBadge.textContent = won ? 'VICTORY' : 'ELIMINATED';
    this.dom.resultBadge.classList.toggle('defeat', !won);
    this.dom.resultTitle.textContent = won
      ? 'LAST ONE STANDING'
      : `${PLAYERS[result.order[0]].name} TAKES THE DECK`;

    this.dom.standings.innerHTML = '';
    result.order.forEach((pid, rank) => {
      const p = PLAYERS[pid];
      const row = document.createElement('div');
      row.className = 'stand-row' + (rank === 0 ? ' first' : '');
      row.style.setProperty('--c', p.css);
      row.style.animationDelay = `${0.5 + rank * 0.11}s`;
      const pts = result.finalScores[pid];
      row.innerHTML = `
        <div class="stand-rank">${rank + 1}</div>
        <div class="stand-dot"></div>
        <div class="stand-name">${p.name}</div>
        <div class="stand-val">${pts > 0 ? `${pts} LEFT` : 'OUT'}</div>`;
      this.dom.standings.appendChild(row);
    });

    // The score starts at zero and is counted into place; the rest of the
    // breakdown is dealt out behind it.
    const breakdown = [
      [`×${s.bestMultiplier}`, 'BEST MULTIPLIER'],
      [s.deflections, 'DEFLECTIONS'],
      [s.bestChain, 'BEST CHAIN'],
      [s.bricks, 'BLOCKS BROKEN'],
      [s.knockouts, 'KNOCKOUTS'],
      [this._fmtTime(s.duration), 'DURATION'],
    ];
    this.dom.matchStats.innerHTML = `
      <div class="stat wide"><b id="finalScore">0</b><i>SCORE</i></div>`
      + breakdown.map(([v, k], i) =>
        `<div class="stat deal" style="animation-delay:${1.25 + i * 0.075}s"><b>${v}</b><i>${k}</i></div>`,
      ).join('');
    const scoreNode = el('finalScore');

    this.showScreen(this.dom.result);

    // One row of the board per beat, so the arena can answer each of them.
    result.order.forEach((_, rank) => {
      this._after(520 + rank * 110, () => hooks.beat?.(rank));
    });
    this._after(1050, () => this._countTo(scoreNode, s.score, 1100, hooks, won));
  }

  /**
   * Count a number up into place.
   *
   * Eased, not linear: a linear tally arrives at its total with no sense of
   * settling, and the last few digits are where the drama is. Driven off rAF so
   * it shares the frame budget with the celebration rather than fighting it on
   * its own timer.
   */
  _countTo(node, to, dur, hooks, won) {
    if (!node) return;
    const t0 = performance.now();
    let last = -1;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 2.6);
      const v = Math.round(to * e);
      if (v !== last) {
        last = v;
        node.textContent = String(v);
        hooks.tick?.(k);
      }
      if (k < 1) { this._countRaf = requestAnimationFrame(step); return; }
      this._countRaf = 0;
      node.classList.add('landed');
      hooks.land?.(won);
    };
    this._countRaf = requestAnimationFrame(step);
  }

  _after(ms, fn) { this._seqTimers.push(setTimeout(fn, ms)); }

  /** Kill anything still in flight — the player may have hit RUN IT BACK. */
  _clearSequence() {
    for (const t of this._seqTimers) clearTimeout(t);
    this._seqTimers.length = 0;
    if (this._countRaf) cancelAnimationFrame(this._countRaf);
    this._countRaf = 0;
  }

  _fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
