import { BRICKS, PINBALL, PLAYERS, RULES } from '../core/config.js';

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

export class HUD {
  constructor() {
    this.dom = {
      hud: el('hud'),
      rivals: el('rivals'),
      orbCount: el('orbCount'),
      selfArc: el('selfArc'),
      selfScore: el('selfScore'),
      selfPips: el('selfPips'),
      announce: el('announce'),
      announceText: el('announce').querySelector('span'),
      arcMeter: el('arcMeter'),
      arcFill: el('arcFill'),
      arcWord: el('arcWord'),
      salvMeter: el('salvMeter'),
      salvFill: el('salvFill'),
      pinMeter: el('pinMeter'),
      pinFill: el('pinFill'),
      pinWord: el('pinWord'),
      combo: el('combo'),
      comboNum: el('combo').querySelector('b'),
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
    this._arc = -1;
    this._arcState = '';
    this._salv = -1;
    this._pin = -1;
    this._pinLive = null;
    this._announceTimer = null;
    // No readout for furniture that isn't in the match.
    if (!PINBALL.enabled) this.dom.pinMeter.style.display = 'none';
    this._buildPods();
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

  _setControlHint() {
    const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
    this.dom.ctrlHint.innerHTML = touch
      ? 'Slide to steer &nbsp;·&nbsp; Tap to fire &mdash; ARC when charged'
      : 'Mouse or A / D to steer &nbsp;·&nbsp; Space to fire &mdash; ARC when charged'
        + '<br/>Shift for surge only';
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
   * Salvage banked toward the next point.
   *
   * @param {number} value  blocks shattered since the last payout
   * @param {number} per    blocks needed for a point
   */
  setSalvage(value, per) {
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

  setCombo(n) {
    if (this._combo === n) return;
    this._combo = n;
    if (n < 3) {
      this.dom.combo.classList.remove('show');
      return;
    }
    this.dom.comboNum.textContent = String(n);
    this.dom.combo.classList.add('show');
    this._replay(this.dom.combo, 'tick');
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

  announce(text, hold = 1500) {
    this.dom.announceText.textContent = text;
    this.dom.announce.classList.remove('show');
    void this.dom.announce.offsetWidth;
    this.dom.announce.classList.add('show');
    clearTimeout(this._announceTimer);
    this._announceTimer = setTimeout(() => this.dom.announce.classList.remove('show'), hold);
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
    for (let i = 0; i < 4; i++) {
      this.pods[i]?.classList.remove('dead', 'hit');
      this.setScore(i, RULES.startPoints);
    }
    this.dom.combo.classList.remove('show');
    this.dom.announce.classList.remove('show');
    this._arc = -1;
    this._arcState = '';
    this.setArc(0, false, false);
    this._salv = -1;
    this.setSalvage(0, BRICKS.perPoint);
    this._pin = -1;
    this._pinLive = null;
    this.setPinball(0, false);
  }

  // --------------------------------------------------------------- result --
  /**
   * @param {{order:number[], stats:object}} result
   *   `order` is finishing position, best first.
   */
  showResult(result) {
    const won = result.order[0] === 0;
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
      row.style.animationDelay = `${rank * 0.08}s`;
      const pts = result.finalScores[pid];
      row.innerHTML = `
        <div class="stand-rank">${rank + 1}</div>
        <div class="stand-dot"></div>
        <div class="stand-name">${p.name}</div>
        <div class="stand-val">${pts > 0 ? `${pts} LEFT` : 'OUT'}</div>`;
      this.dom.standings.appendChild(row);
    });

    const s = result.stats;
    this.dom.matchStats.innerHTML = `
      <div class="stat"><b>${s.deflections}</b><i>DEFLECTIONS</i></div>
      <div class="stat"><b>${s.bestChain}</b><i>BEST CHAIN</i></div>
      <div class="stat"><b>${s.bricks}</b><i>BLOCKS BROKEN</i></div>
      <div class="stat"><b>${s.knockouts}</b><i>KNOCKOUTS</i></div>
      <div class="stat"><b>${this._fmtTime(s.duration)}</b><i>DURATION</i></div>`;

    this.showScreen(this.dom.result);
  }

  _fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
