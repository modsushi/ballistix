# Orbital Ballistix

A four-player deflection arena for the browser, inspired by **Ballistix** from
*Crash Bash*. Four pilots hold one wall each of an octagonal deck. Everyone
starts on five points. Let a plasma orb past you and you lose one. Hit zero and
your wall seals shut and your craft is destroyed. Last pilot with points on the
board wins.

Built with three.js. Targets mobile web first: one WebGL2 context, no audio
files, and a render pipeline that scales itself down rather than dropping
frames.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview
```

---

## Controls

|            | Steer                           | Surge          | Pause     |
| ---------- | ------------------------------- | -------------- | --------- |
| Touch      | slide anywhere                  | tap            | HUD button|
| Mouse      | move (no click needed)          | click          | Esc / P   |
| Keyboard   | `A` / `D` or arrows             | Space / Shift  | Esc / P   |
| Gamepad    | left stick / d-pad              | A              | Start     |

**Surge** is on a ~4 second cooldown. It widens your deflector and adds power to
the next return. The deflector glows white when it's ready.

The two control families behave differently on release, because they mean
different things:

- **Positional** (touch, mouse) — the finger or cursor *is* the paddle position.
  Touch is absolute: your thumb's horizontal position maps straight onto a spot
  along your wall, narrowed by ~1.34× so a comfortable arc covers the whole
  goal. Relative dragging is easier on the hand but costs you the ability to
  cross your goal in one motion, which is the thing the game is actually about.
  A mouse gets an exact 1:1 mapping — the paddle sits under the cursor — and
  hover-steers with no button held. Let go and the paddle stays put.
- **Directional** (keyboard, stick) — these say "go left", not "be here". Hold a
  direction to move; release and the craft springs back to the middle of its
  wall like a self-centring stick. The return is exponential and capped to the
  craft's own top speed, so it leaves the edge fast and eases into the centre.
  Tune or disable it with `PADDLE.recenterRate` in `core/config.js` (0 = hold
  position instead).

Whichever device you last actually used owns the paddle, so releasing an arrow
key can't be hijacked by an idle cursor. Move the mouse and it takes over again.

---

## How it's put together

```
src/
  main.js               bootstrap, frame loop, screen flow
  core/
    config.js           every tuning number worth arguing about
    math.js             clamp / damp / lerp / value noise
    quality.js          device tiering + adaptive resolution governor
    input.js            pointer, keyboard and gamepad, unified
    audio.js            the entire soundtrack and SFX set, synthesised
  gfx/
    postfx.js           HDR chain: dual-filter bloom, ACES, grade, grain
    environment.js      procedural nebula baked to a cubemap; stars; gas giant
    floor.js            the deck — emissive energy layer inside a PBR material
    forcefield.js       goal barriers
    trail.js            camera-facing ribbon for orb trails
    particles.js        one pooled Points system for every spark
    materials.js        Kenney material-name -> PBR retargeting
    manifest.js         the list of models we actually place
    assets.js           GLB loading, transform baking, re-origining
    batch.js            static geometry merging by material
  game/
    game.js             match state machine and the fixed-step loop
    arena.js            deck, walls, barriers, substructure, set dressing
    craft.js            a pilot's paddle and everything that makes it feel good
    orb.js              the plasma orb
    collide.js          substepped integration, contacts, AI prediction
    ai.js               rival pilots
    effects.js          events -> spectacle
    camera.js           responsive framing, shake, lean, FOV punch
  ui/
    hud.js, ui.css      DOM interface
```

### Decisions worth knowing about

**Physics runs at a fixed 120 Hz behind an accumulator.** Deflection angle
depends on exactly where an orb meets a moving deflector. If that depended on a
phone's variable frame time, identical inputs would produce different shots.
Orb integration is additionally substepped so nothing travels more than 0.22
world units per test — at 33 units/sec on a 30fps phone an unstepped orb moves
1.1 units against a 0.92-unit-thick deflector and passes straight through it.

**The scene renders into a linear RGBA16F target and is tonemapped by our own
composite pass.** three's tone mapping and output encoding are switched off in
`main.js`; turning either back on will double-encode. Bloom is the dual-filter
variant (13-tap down, 9-tap tent up, accumulating additively) — a wide, smooth,
energy-preserving glow for a fraction of the cost of stacked gaussians. The
composite then does chromatic aberration, an optional radial-blur pulse, ACES,
grading, vignette and grain in a single pass.

**The sky is baked once.** An fbm nebula is rendered into a small HDR cubemap at
load; that cube becomes both the scene background and the PMREM source for
image-based lighting. Runtime cost is one cube fetch per background pixel. Stars
and the gas giant are real geometry, because they'd smear at cube resolution.

**The shadow map is rendered once, at load.** The arena and the key light never
move. Anything that *does* move is kept out of it — craft use a hover glow for
grounding and orbs use a soft additive blob, both cheaper and softer than a
1k-texel map could manage.

**Kenney's GLBs carry a node translation.** `craft_speederA` sits at (2, 0, 1.5)
inside its own file. `assets.js` bakes each mesh's world matrix into its
geometry and re-origins the model on its own footprint — centred in XZ, resting
on y = 0 — so `position` means what it says. Skipping this puts every prop
metres from where the layout asked for it, scaled by whatever scale factor you
applied.

**`metalRed` is an accent slot.** Kenney ships stable material names, so the
material library substitutes a shared PBR set keyed off those names and treats
`metalRed` as the team-colour channel. Recolouring one material re-skins an
entire craft. Hull colours are rebuilt from the team *hue* at fixed saturation
and lightness rather than lerped toward the raw colour — blending toward cyan
lands near white while blending toward magenta stays vivid, so a naive lerp
gives the four pilots wildly different visual weight.

**Several hundred static props are merged by material** (`batch.js`), which is
the difference between ~90 draw calls and several hundred.

### Performance

Measured in-browser via `window.__ballistix.stats`:

| | |
| --- | --- |
| Scene draw calls | ~86 |
| Triangles | ~77k |
| Post passes | 12 |
| Shader programs | ~43 |
| Textures | 13 |

Quality tiers are picked from touch/cores/memory plus the GPU renderer string
(`core/quality.js`), and a governor trims internal resolution between 1.0 and
0.62 if smoothed frame cost stays over budget for a couple of seconds. It is
deliberately sluggish — resolution changes are visible, so it only moves on
consistent evidence, and it ignores hitches over 120 ms because a tab switch
isn't a resolution problem.

### Audio

Everything is synthesised at runtime — no files, no decode stall, and every
sound is parameterised by what happened. A deflection's pitch tracks orb speed,
its brightness tracks impact power, and its metallic partial ratio is keyed to
the deflecting pilot, so each rival's returns sound recognisably theirs. The
music bed is a drone, a sub layer and a sparse pentatonic sequencer whose tempo
and filter open up with match intensity.

---

## Development tools

```bash
node tools/shot.mjs      <url> <outDir>      # menu/play/result at 4 viewports
node tools/closeup.mjs   <url> <outDir> <z>  # zoomed craft & orb detail
node tools/moments.mjs   <url> <outDir>      # concede, elimination, surge, low-health
node tools/playtest.mjs  <url>               # drives a full match, asserts it resolves
node tools/controls.mjs  <url>               # steering direction, range, device hand-off
node tools/balance.mjs   <url> <n> <diff>    # seat-symmetry check
npm run models:sync                          # re-extract public/models from the zips
```

`balance.mjs` runs scored matches with all four pilots on the same AI. If the
rules are fair, wins spread evenly across the four seats; a seat that
consistently wins or loses means the geometry, serve logic or targeting weights
are biased rather than that one pilot is better.

Debug URL parameters: `?tier=0|1|2` forces a quality tier, `?dpr=` overrides
device pixel ratio, `?zoom=` scales camera distance, `?auto=1` hands pilot 0 to
the AI inside a scored match.

---

## Assets

Models from [Kenney](https://kenney.nl)'s **Space Kit** and **Space Station
Kit**, both CC0.

The kits ship ~250 models between them; we place 45. `npm run models:sync`
extracts exactly the set listed in `src/gfx/manifest.js` from the zips in
`assets/` and deletes anything else under `public/models/`. Everything in
`public/` is copied verbatim into `dist/`, so skipping this ships ~3MB of GLBs
no one ever requests. Add an entry to the manifest, re-run the script.
