# Orbital Ballistix

A four-player deflection arena for the browser, inspired by **Ballistix** from
*Crash Bash*. Four pilots hold one wall each of an octagonal deck. Everyone
starts on five points. Let a plasma orb past you and you lose one. Hit zero and
your wall seals shut and your craft is destroyed. Last pilot with points on the
board wins.

The deck starts bare and grows its own hazards. **Blocks** rise out of the floor
one at a time as the match runs. Shattering one banks salvage for whoever last
touched the orb, and enough salvage buys a point back — so points can be won as
well as lost, and there is finally a reason to aim rather than just to survive.

Every so often a **singularity** tears open somewhere on the deck. While it is
there, orbs that pass inside its reach stop travelling in straight lines.

And a **chaos well** — pop bumpers and a slingshot — surfaces in one corner of
the deck at a time, runs for a quarter of a minute, and reopens somewhere else.

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

### Abilities

**Space** (tap on touch, A on a pad) spends the best ability you have charged.

**SURGE** — ~4 second cooldown. Briefly widens your deflector and adds power to
the next return. The tell is diegetic: your deflector arc glows white-hot when
charged and drops back to team colour once spent. Note the widening is not flat
— `effHalfLen` scales by *seconds remaining*, so it starts ~23% wider and tapers
away over 0.55s. Collider and visual use the same expression, so it reads as a
burst that fades.

**ARC** — 15 second cooldown, 2.6 seconds of uptime. A lightning fence unzips
from both ends of your craft and seals your entire goal line. Nothing gets
through it; orbs bounce off, and your own motion still curves them a little, so
you keep some steering while shielded. The HUD carries a charge meter beside
your score — it fills while recharging, reads READY with a pulse when charged,
and drains white while live.

Space takes the ARC when it's charged and falls back to the surge otherwise.
**Shift** is surge-only, for holding the fence back for a moment you choose.

Every pilot gets both, including the AI — an ability only the human has would
quietly rewrite the difficulty curve, and it would be invisible to the
seat-symmetry harness. Rivals spend the fence on shots they genuinely can't
reach, and on the point that would end their match.

The two control families behave differently on release, because they mean
different things:

- **Positional** (touch, mouse) — the finger or cursor *is* the paddle position.
  Touch is absolute: your thumb's horizontal position maps straight onto a spot
  along your wall, narrowed by ~1.34× so a comfortable arc covers the whole
  goal. Relative dragging is easier on the hand but costs you the ability to
  cross your goal in one motion, which is the thing the game is actually about.
  A mouse gets an exact 1:1 mapping — the paddle sits under the cursor — and
  hover-steers with no button held. Let go and the paddle stays put.
- **Directional** (keyboard, stick) — these say "go left", not "be here". A
  press moves at full speed (34 units/sec) from the *first frame*: no start-up
  delay, no acceleration curve, no discrete step. Release and the craft heads
  back to the middle of its wall, also starting on the next frame.

  Both families **hold position on release**. Where you parked the paddle is
  information you chose to put there; pulling it back to centre would mean
  re-aiming after every single press. Tapping is therefore pure placement — one
  tap walks the craft about 1.4 units (22% of the half-wall), and taps chain
  evenly in either direction.

  A press is honoured for a minimum of 45ms even if the key is released before
  the next frame, so a flick between two frames can't be silently dropped. That
  minimum also sets the smallest deliberate step.

  Self-centring is still available behind `PADDLE.returnMax` (set it above 0),
  and when enabled it starts on the frame you release and ramps from
  `returnSpeed` to `returnMax` over `returnRamp`. Off by default.

  Tune in `PADDLE` (`core/config.js`): `moveSpeed`, `minPress`, plus `track`
  and `damp` for how tightly the hull follows.

  > An earlier version gave taps their own discrete step and put a 140ms delay
  > before continuous travel began. It looked reasonable on paper and felt
  > terrible: press, jump, stall, go. Three events where the player asked for
  > one. `tools/controls.mjs` now slices the first 400ms of a hold into 60ms
  > windows and fails if any of them shows no motion.
  >
  > Both that suite and `moments.mjs` measure in *simulation* time, not wall
  > time — scoring a goal triggers hit-stop, and a slow-motion freeze is
  > indistinguishable from an input stall if you only watch position against
  > the clock.

Whichever device you last actually used owns the paddle, so releasing an arrow
key can't be hijacked by an idle cursor. Move the mouse and it takes over again.

---

## The middle game

The deck used to be a straight line between two pilots, and it played fast in
the bad way: an orb crossed it in under a second, arriving on a course you
could read from the moment it left the other paddle. The middle now has things
in it — but not from the opening whistle.

**The deck escalates.** At kick-off it is bare, and the first exchange is the
clean duel the game has always been. The first block surfaces at eight seconds
and one more joins every five after that, so the field is at its ceiling inside
the first minute; the singularity makes its first appearance at 26 seconds.

That arc is doing two jobs. It gives the match a shape — the same escalation
the orb schedule provides, on a second axis — and it means someone who has
never seen the game gets half a minute to learn what a deflection does before
anything else is asked of them.

### Bricks

Twelve layout slots fill an annulus between radius 4.6 and 12.6 — clear of the
serve point and well clear of the goal approach lanes — of which **at most eight
may be standing at once**. Every contact bounces the orb and takes 0.55 off its
speed, which is the single biggest reason the game plays slower than it did.

The ceiling is the interesting half of that. Which four slots are empty keeps
changing as blocks break and regrow, so the field is never the same obstacle
course twice even inside one match, and the middle stays sparse enough to track
an orb through. A block whose regen timer expires while the field is full simply
waits for a slot.

It also **shrinks with the field of play**: two blocks per surviving pilot, so
four survivors get eight and two get four. Goals get rarer as pilots are
eliminated — two survivors defending two walls concede far less often than four
defending four — while a fixed field would keep paying salvage out at the same
rate, and it reads as the deck running out of material rather than as a rule.

They arrive **one at a time**, in an order that walks the quadrants: block 0 of
each quadrant, then block 1, and so on. Since the layout is four-fold symmetric,
the field returns to perfect symmetry every fourth spawn and is never more than
three blocks away from it. The interval is timed from the spawn that actually
happened rather than from a fixed schedule, so a spawn deferred by the cap never
causes a burst of arrivals the moment room appears.

Blocks take two hits, or three toward the middle, and carry their damage
visibly: a hairline seam and an outlined inset panel while healthy, then dark
fissures that glow hotter as they go. A block wears the colour of the pilot who
last struck it, so a glance at the middle tells you who has been farming it.

Break one and whoever last touched the orb banks **salvage**. Every twelve of
those pays out a point, up to a ceiling of seven. Broken blocks reform after thirteen
seconds, so the field erodes and grows back rather than being cleared once and
gone — under sustained fire it sits well below its own ceiling.

> Bricks-per-point is the most load-bearing number in the rework. An orb
> crossing a full field contacts a block roughly every half second, so paying a
> point per brick would have inflated points faster than conceding could
> deflate them. That is not a hypothetical: at nine — with the field standing
> in full from the opening whistle — `playtest.mjs` produced a 260-second match
> that never resolved, the last two pilots oscillating between four and eight
> points for a hundred seconds because income exactly matched the drain. It
> went to thirteen to fix that, and to twelve once the field shrank to a
> capped one arriving a block at a time, which cut income far more than any
> ratio did. The points ceiling exists for the same reason: it stops a pilot
> farming an unloseable lead.

**Salvage closes for the final duel.** Once only two pilots are left the deck
stops paying out entirely — blocks still break, still slow orbs down and still
light up, but the ledger shuts and the HUD meter reads CLOSED.

That is a rule rather than a tuning number because every softer lever failed.
A longer bank, a lower ceiling, a field that thins as pilots die: each one only
moved where the equilibrium sat instead of removing it. Two competent pilots
defending two walls concede rarely enough that *any* steady income cancels the
drain, and `playtest.mjs` kept producing matches that sat at [6,4,0,0] for
ninety seconds with both survivors banking points as fast as they dropped them.
Closing the faucet makes points strictly monotonic in the endgame, so a match
can always end — and it reads well: the middle game is the four-player
escalation, and the last two settle it the way the game always did, on defence
alone.

### The singularity

Every so often — 26 seconds into a match, then on a 44-second cooldown — a black
hole tears open somewhere off-centre and stays for 11 seconds. Only ever one.
Orbs that pass inside its 6.6-unit reach are pulled toward the core and their
paths bend into arcs, so a return you aimed at a wall arrives somewhere else.

Two properties are worth stating, because both are load-bearing:

**It turns orbs without speeding them up.** The pull is applied as an
acceleration and then the velocity is renormalised back to the orb's own speed.
Real gravity would trade potential for kinetic energy and spit the orb out
faster than it arrived, which would wreck a speed model the whole game is tuned
around — rally escalation, the audio intensity curve, the AI's reaction budget.
Turning without accelerating gives exactly the arc and costs nothing elsewhere.

**It cannot capture an orb.** A circular orbit at radius *r* needs *v²/r* of
inward acceleration, and against the slowest orb in the game, at every radius
inside the field, the pull supplies at least three times less than that. No orb
can be trapped; the worst case is a hard bend. That is a property of the numbers
rather than something playtesting happened not to find, which matters because a
captured orb is a soft-locked match.

A single object can't be four-fold symmetric the way the brick field is, so
instead each appearance steps to the next quadrant in order: every seat gets the
same exposure over a match and nobody gets it twice running. It also avoids
opening on top of a standing block, and the boundary of the pull is drawn on the
deck as a dashed contracting ring, so the reach is something you can play around
rather than something that happens to you.

Visually there is no screen-space distortion — real lensing would mean another
full-screen pass in a chain that already has twelve, for something on screen
eleven seconds a minute. The illusion is assembled instead from five parts:

- a genuinely black core that occludes what is behind it, with a hard fresnel
  photon ring on its limb
- an accretion disc of spiralling noise whose inner edge laps its outer one,
  with **relativistic beaming**: the side rotating toward the camera is far
  brighter and blue-shifted, the receding side dim and red. One sine, and it is
  the single asymmetry that stops a disc reading as a spinning washer
- a camera-facing **lensing halo** standing off the core — a thin photon ring
  plus a softer arc brightest across the top, standing in for the far side of
  the disc being lifted over the hole by its own gravity. Because it is
  billboarded it reads from a top-down phone camera as well as a low desktop one
- the **deck itself bending**: the floor's hex lattice is sampled at a position
  pulled toward the hole, so the grid warps into it, and the deck goes dark
  underneath because light does not leave. Only the lattice is warped —
  territory washes and shock rings keep their true positions, since those carry
  information the player reads positionally and bending them would be lying
- the dashed boundary ring at the exact radius of the pull

### The chaos well

There are four well *sites*, one per quadrant on the diagonals between the
goals, and **exactly one is ever open**. A well is two pop bumpers with a
slingshot standing behind them: an orb that wanders in rattles between the
bumpers gaining speed until the slingshot fires it back across the deck at a
flat 25.5 units/sec.

It surfaces at a site, runs for fourteen seconds, sinks, and thirty seconds
later opens at the *next* site along. Starting down, so the opening exchange is
played on a clean deck.

A cycle rather than a fixture because a permanent well is a permanent tax on one
region of the deck — you learn where it is and simply stop sending orbs there.
Something that appears somewhere new every three-quarters of a minute has to be
replanned around each time, and it gives the match a rhythm: a tense stretch
where one corner is lethal, then a calm one. A ring contracting on the deck
telegraphs the arrival about a second out, and the HUD carries the cycle as a
bar next to the orb count — filling while it is away, draining while it is live.

Stepping the site is also what keeps it fair. One live well obviously cannot be
four-fold symmetric the way the brick field is, so instead every seat gets the
same exposure over a match and nobody gets it twice running — the same treatment
the singularity gets, for the same reason.

The sites are on the diagonals rather than the goal axes. A well in front of
somebody's wall is a random goal generator; a well in a neutral corner is a
feature you can aim into, avoid, or use to buy yourself time.

Only one site being up is free at the draw-call level: all twelve elements stay
in three instanced meshes, and the three dormant sites are collapsed to zero
scale in their instance matrices rather than being separate objects to toggle.

Because bumpers are speed *sources*, orbs above 19 units/sec bleed speed at
2.4 units/sec² until they settle back down. Without that sink the first orb to
find a well pins itself at the speed cap and stays there for the rest of the
match, which is precisely the game this rework is trying to get away from.
Ordinary rallies never reach the threshold, so their escalation is untouched.

### Fairness

Both the brick layout and the well placement are **four-fold rotationally
symmetric**: one quadrant is sampled by rejection, then copied at 90°, 180° and
270°. Every seat faces an identical middle.

That is a hard requirement, not an aesthetic one. `tools/balance.mjs` reads
seat win rates as the signal for rule bias, and an asymmetric field would show
up there as unfairness that no amount of tuning could ever remove. It also
falls out conveniently: every copy is a quarter turn, so a block that starts
axis-aligned stays axis-aligned and collision stays a circle-vs-AABB test.

Because blocks surface one at a time, the field is only *exactly* symmetric
every fourth spawn — the spawn order walks the quadrants specifically to keep
the transient imbalance to at most three blocks and to make sure it never sits
in front of the same pilot twice running. Surfacing a whole quadrant before
starting the next would hand one seat a private obstacle course for a minute at
a time.

Screen-to-paddle mapping is projected against the camera at its *solved*
framing, not the live one. The live camera leans toward the action and shakes
on impact; mapping through it makes the paddle creep under a motionless cursor,
which is the difference between a control that feels precise and one that
feels haunted.

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
    shapes.js           procedural geometry: beveled slabs, bumpers, wedges
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
    bricks.js           the breakable field: layout, damage, instanced render
    pinball.js          pop bumpers and slingshots
    blackhole.js        the singularity: trajectory bending, accretion disc
    collide.js          substepped integration, contacts, AI prediction
    ai.js               rival pilots
    effects.js          events -> spectacle
    camera.js           responsive framing, shake, lean, FOV punch
  ui/
    hud.js, ui.css      DOM interface
```

### Decisions worth knowing about

**The deck is 19 units to a wall, not 13.6.** The brick field and the wells
needed somewhere to live that wasn't a goal approach lane, and at the old size
there was no such place. The chamfer grew with it (5.0 → 9.6) so the octagon
stays close to regular — the diagonal walls are pinball surfaces now, and short
ones barely participate. Goal lines grew only 9% against a 40% bigger deck, so
defending is very nearly as hard as it was and everything else is travel time.

**Physics runs at a fixed 120 Hz behind an accumulator.** Deflection angle
depends on exactly where an orb meets a moving deflector. If that depended on a
phone's variable frame time, identical inputs would produce different shots.
Orb integration is additionally substepped so nothing travels more than 0.22
world units per test — at 33 units/sec on a 30fps phone an unstepped orb moves
1.1 units against a 0.92-unit-thick deflector and passes straight through it.

**The whole brick field is two draw calls.** One instanced beveled slab drawn
twice — an opaque PBR shell and an additive rim shell — with damage, hit flash
and team tint carried on per-instance attributes and resolved in the shader.
Chipping a block therefore costs one float, not a geometry rebuild, and the
whole field adds two draw calls and about 4k triangles to the frame. The
chaos well is three more instanced meshes on top, whichever site is open.

**Things arrive by rising out of the deck rather than fading in.** A block
surfacing, and a pinball well deploying, are both a translation from below a
floor that is already opaque — which costs nothing, hides the geometry
perfectly, and gives the arrival its whole sense of mass for free. The wells'
instance matrices are still written exactly once, at construction; only the
parent mesh moves.

The blocks are deliberately *dark*. An earlier pass lit their whole top face
and the middle of the deck turned into a light table that the orb vanished
into — the one object that must always be findable. They are now machined
metal carrying a hairline seam and an outlined inset panel, and the only thing
that ever gets brighter is damage.

**The AI does not know the middle exists.** `predictArrival` still forward-
simulates against the eight arena planes only, ignoring bricks, bumpers and
other orbs — exactly as it always ignored paddles. Teaching it the field would
mean a ray test against two dozen boxes per bounce per orb per pilot per tick, and it
would make rivals eerily prescient about a region whose entire job is to be
unpredictable. Every seat is misled identically, which is what the symmetry
requirement buys.

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

**The camera framing is a constrained solve, not a bounding box.** Fitting the
whole arena on screen leaves it a small tile in a sea of scenery. Like the
original, we push in until it overflows — but only where overflow is free.
Three constraint sets are checked against different screen edges: the *far*
ends of the side walls plus the player's own paddle travel against the left and
right; the far wall against the top; the player's goal line and craft against
the bottom. The near ends of the side walls are deliberately left unconstrained,
which is what lets the bottom corners run off the edges. Distance and aim are
solved together, because balancing the vertical headroom first is what frees the
solve to keep pushing in until the width binds. See `_solveDistance`.

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
| Scene draw calls | ~89 |
| Triangles | ~81k |
| Post passes | 12 |
| Shader programs | ~57 |
| Textures | 13 |

The brick field costs two of those draw calls and about 4k triangles, which is
the payoff for instancing it and for generating the geometry rather than
placing a dozen props.

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
node tools/field.mjs     <url> <rolls>       # brick layout: symmetry, keep-outs, overlap
node tools/controls.mjs  <url>               # steering: direction, range, tap/hold, hand-off
node tools/framing.mjs   <url>               # where the arena lands in NDC, per viewport
node tools/balance.mjs   <url> <n> <diff>    # seat-symmetry check
npm run models:sync                          # re-extract public/models from the zips
```

`balance.mjs` runs scored matches with all four pilots on the same AI. If the
rules are fair, wins spread evenly across the four seats; a seat that
consistently wins or loses means the geometry, serve logic or targeting weights
are biased rather than that one pilot is better.

`field.mjs` re-rolls the brick layout a few dozen times and asserts the
properties the rules depend on: four-fold rotational symmetry, nothing in the
serve keep-out or the goal approach lanes, no overlaps, and a field that
actually filled. The layout is random per match, so eyeballing one of them is
not evidence of anything.

`playtest.mjs` samples the live brick count and every pilot's salvage bank
alongside the scores. A field that never erodes and a bank that never pays out
are both pacing bugs that look perfectly fine in a screenshot.

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
