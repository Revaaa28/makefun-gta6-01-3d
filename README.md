[![make.fun bounty](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/Revaaa28/makefun-gta6-01-3d/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/Revaaa28/makefun-gta6-01-3d/reward.svg)](https://make.fun/bounty/gta6-01)

# Costa Serena — a golden-hour crime sandbox

An original 3D open-world crime game that runs in a desktop browser from static
files, built for the make.fun **Make GTA 6** bounty. One invented coastal city,
one endless golden hour, and every system of the genre wired together: a city to
explore on foot and by car, traffic and pedestrians, cars to steal and drive, a
five-star wanted system with a named police force that escalates to roadblocks
and a helicopter, six story missions, combat, a garage, a save game and a synth
radio. No Rockstar names, art, map or assets — Costa Serena is its own place.

## Play it

```sh
node serve.ts        # then open http://localhost:8080
```

Any static file server pointed at `game/` works the same way; the game makes no
network requests and needs no build step.

## The city

Seven named districts — **Old Port, Hillcrest, The Flats, Neon Mile, Centro,
Docklands, Marina** — on a grid of named avenues (Avenida del Sol, Boulevard
Brisa, Calle Palma, Via Coral…), with palm rows, a beach, animated water, a
working marina and a skyline of lit windows under a low orange sun.

## Systems

- **On foot & driving** — third-person WASD + mouse camera, sprint, and an arcade
  driving model with handbrake; every traffic car can be stolen and driven.
- **The Costa Serena Patrol (CSP)** — heat becomes stars (1–5). Patrol cars hunt
  and ram, at three stars they throw a **roadblock** across the avenue ahead, and
  at four stars **FALCON-1** arrives with a searchlight. Units are named —
  VIPER-2, ORCA-5, JAGUAR-3, COBRA-4, MANTA-6 — and the HUD's **CSP RESPONSE**
  panel lists each unit's state and distance live.
- **Six story missions** from Nadia: *First Wheels*, *Package Run*, *Hot Water*,
  *Sunset Run*, *Dockside Diplomacy* and *The Golden Hour Job* — deliveries,
  thefts, a timed run, hold-the-point jobs and escapes where the objective is
  losing the Patrol.
- **Combat** — Fists, the P9 Serena pistol, the Ratón SMG and the Marea 12G
  shotgun (the last two unlock with respect), hitscan tracers and officers who
  shoot back.
- **Progression** — respect ranks from *Nobody* to *Kingpin of the Coast*,
  mission payouts, and **Taller Brisa**, the Centro garage: engine tunes, panel
  armour, repairs, resprays and the **Serena GT**, your own car.
- **Save game** — money, respect, finished jobs and the GT persist in
  `localStorage`; Continue picks the story up.
- **Radio** — three synthesised stations (Serena FM, Costa Gold, Radio Faro)
  generated live with WebAudio, plus a procedural engine note and effects. No
  audio files.
- **HUD** — circular minimap with labelled districts, a routed line to the
  objective along the avenues, police blips, wanted stars, clock, money, vitals,
  weapon and speed readouts, and a mission banner that carries each job's
  briefing and live objective.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Move / drive |
| Mouse | Camera (click the game for pointer lock) |
| Shift | Sprint |
| E | Enter/exit car · take a job · talk |
| Click / F | Shoot / melee |
| 1–4 | Weapon slots |
| Space | Handbrake |
| R | Radio on / change station |
| G | Garage (at Taller Brisa) |
| M | Take the offered job |
| P | Pause |

## Layout

- `game/index.html` — the page and the HUD shell.
- `game/src/` — one file per job: `config.js` (the city's facts), `city.js`,
  `vehicles.js`, `traffic.js`, `pedestrians.js`, `player.js`, `police.js`,
  `combat.js`, `missions.js`, `garage.js`, `minimap.js`, `hud.js`, `audio.js`,
  `save.js`, `scenes.js` (the staged screenshot scenes), `main.js` (boot + loop).
- `game/vendor/three.min.js` — three.js r128, vendored (MIT, © Three.js Authors).
- `main.ts` — the entry program: copies `game/` + `screenshots/` out and writes
  the dossier with the vendored make.fun library.
- `screenshots/` — the four screenshots, staged by the game itself via
  `game/index.html?scene=cover|chase|mission|marina`.

## License

MIT — see `LICENSE`. three.js is MIT, © the Three.js Authors.
