// Costa Serena — config.js: the city's fixed facts. Districts, streets, the road grid,
// the patrol's unit roster, the weapon locker and Nadia's six story jobs all live here,
// so every other file reads the same city. Nothing in this file touches the DOM or three.js.

function costaSerenaConfig() {
  return {
    world: { half: 450, roadEvery: 120, roadWidth: 24, beachZ: 384, waterZ: 428 },
    // Vertical avenues run north-south (constant x), horizontal avenues run east-west (constant z).
    avenuesX: [-360, -240, -120, 0, 120, 240, 360],
    avenuesZ: [-360, -240, -120, 0, 120, 240, 360],
    streetNamesX: { '-360': 'Calle Faro Viejo', '-240': 'Calle Faro', '-120': 'Via Manglar', '0': 'Via Coral', '120': 'Via Delfin', '240': 'Avenida Tiburon', '360': 'Paseo Levante' },
    streetNamesZ: { '-360': 'Calle Alta', '-240': 'Calle Palma', '-120': 'Calle Mercado', '0': 'Avenida del Sol', '120': 'Calle Vela', '240': 'Boulevard Brisa', '360': 'Paseo del Puerto' },
    districts: [
      { name: 'Old Port', short: 'OLD PORT', x0: -450, x1: -130, z0: -450, z1: -130, tint: '#5d6d7e' },
      { name: 'Hillcrest', short: 'HILLCREST', x0: -130, x1: 130, z0: -450, z1: -130, tint: '#7e6d5d' },
      { name: 'The Flats', short: 'THE FLATS', x0: 130, x1: 450, z0: -450, z1: -70, tint: '#6d7e5d' },
      { name: 'Neon Mile', short: 'NEON MILE', x0: -450, x1: -130, z0: -130, z1: 130, tint: '#8a4d7e' },
      { name: 'Centro', short: 'CENTRO', x0: -130, x1: 130, z0: -130, z1: 384, tint: '#7e5d4d' },
      { name: 'Docklands', short: 'DOCKLANDS', x0: 130, x1: 450, z0: -70, z1: 250, tint: '#5d7e7a' },
      { name: 'Marina', short: 'MARINA', x0: 130, x1: 450, z0: 250, z1: 450, tint: '#4d6d8a' }
    ],
    garage: { x: 24, z: 132, name: 'Taller Brisa' },
    hospital: { x: -96, z: 96 },
    policeUnits: ['VIPER-2', 'ORCA-5', 'JAGUAR-3', 'COBRA-4', 'MANTA-6', 'SIROCO-7', 'PIQUERO-8'],
    helicopter: { name: 'FALCON-1', height: 46 },
    weapons: [
      { id: 'fists', name: 'FISTS', slot: 1, damage: 14, rate: 0.38, range: 2.6, spread: 0, pellets: 1, auto: false, unlockRespect: 0 },
      { id: 'pistol', name: 'P9 SERENA', slot: 2, damage: 22, rate: 0.30, range: 90, spread: 0.012, pellets: 1, auto: false, unlockRespect: 0 },
      { id: 'smg', name: 'RATON SMG', slot: 3, damage: 13, rate: 0.085, range: 70, spread: 0.035, pellets: 1, auto: true, unlockRespect: 120 },
      { id: 'shotgun', name: 'MAREA 12G', slot: 4, damage: 11, rate: 0.85, range: 38, spread: 0.09, pellets: 6, auto: false, unlockRespect: 300 }
    ],
    respectLevels: [
      { at: 0, name: 'NOBODY' }, { at: 120, name: 'RUNNER' }, { at: 300, name: 'EARNER' },
      { at: 560, name: 'FIXER' }, { at: 900, name: 'MADE MAN' }, { at: 1400, name: 'KINGPIN OF THE COAST' }
    ],
    carNames: ['Palma Coupe', 'Brisa Sedan', 'Tiburon GT', 'Vela Hatch', 'Coral Wagon', 'Faro Pickup', 'Levante Roadster', 'Manglar Van'],
    radioStations: [
      { name: 'SERENA FM', tag: 'synth tides', base: 110, wave: 'sawtooth', tempo: 0.42 },
      { name: 'COSTA GOLD', tag: 'slow brass & chords', base: 130.8, wave: 'triangle', tempo: 0.8 },
      { name: 'RADIO FARO', tag: 'harbour talk & static', base: 87.3, wave: 'square', tempo: 0.26 }
    ]
  };
}

const CS = costaSerenaConfig();

// One shared mutable game state. Every system reads and writes through G, which keeps
// the files decoupled: police.js never imports missions.js, they meet in G.
var G = {
  started: false, paused: false, down: false, scene: null, seed: 7,
  time: 0, clockMinutes: 18 * 60 + 4, money: 350, respect: 0,
  health: 100, armour: 0, wanted: 0, heat: 0, lastCrimeAt: -99, lastSeenAt: -99,
  weaponIndex: 0, inCar: null, currentCar: null, garageCar: null, personalCar: null,
  upgrades: { engine: 0, armour: 0 }, mission: null, missionsDone: [],
  radioIndex: 0, radioOn: false, kills: 0, carsStolen: 0,
  player: null, camera: null, scene3: null, renderer: null,
  traffic: [], peds: [], police: [], officers: [], bullets: [], markers: [],
  colliders: [], unitSeq: 0, message: '', messageUntil: 0
};

// Deterministic RNG (mulberry32) so the city — and the staged screenshot scenes —
// build identically on every load. Gameplay randomness after boot uses Math.random.
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampValue(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function distance2D(ax, az, bx, bz) { const dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }
function angleLerp(a, b, t) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; }

function districtAt(x, z) {
  for (const d of CS.districts) if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) return d;
  return CS.districts[4];
}
function nearestStreetName(x, z) {
  let best = null, bestD = 1e9;
  for (const ax of CS.avenuesX) { const d = Math.abs(x - ax); if (d < bestD) { bestD = d; best = CS.streetNamesX[String(ax)]; } }
  for (const az of CS.avenuesZ) { const d = Math.abs(z - az); if (d < bestD) { bestD = d; best = CS.streetNamesZ[String(az)]; } }
  return best || 'Boulevard Brisa';
}
function respectLevel() {
  let lvl = CS.respectLevels[0];
  for (const l of CS.respectLevels) if (G.respect >= l.at) lvl = l;
  return lvl;
}
function showToast(text, seconds) {
  G.message = text; G.messageUntil = G.time + (seconds || 3.2);
  const el = document.getElementById('toast');
  if (el) { el.textContent = text; el.style.display = 'block'; }
}
