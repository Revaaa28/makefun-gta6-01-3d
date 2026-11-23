// Costa Serena — crew.js: the three people who ride with you. Nadia plans the
// jobs, Bruno keeps the cars alive, Alba watches the Patrol — and each of them
// has one ability on a real cooldown, fired from the keyboard and rendered by
// hud.js as the crew cards. The abilities are honest mechanics, not buttons
// that pretend: Swap Plates edits the same heat the patrol reads, Quick Fix
// repairs the same hull the rams damage, and Eyes Out lifts the same range
// limit the minimap draws police blips under.

const CREW_DEFS = [
  { id: 'swap', name: 'NADIA', role: 'Driver', ability: 'SWAP PLATES', key: 'KeyZ', keyLabel: 'Z', cooldown: 120, color: '#22d3ee' },
  { id: 'fix', name: 'BRUNO', role: 'Mechanic', ability: 'QUICK FIX', key: 'KeyX', keyLabel: 'X', cooldown: 90, color: '#ffb020' },
  { id: 'eyes', name: 'ALBA', role: 'Lookout', ability: 'EYES OUT', key: 'KeyC', keyLabel: 'C', cooldown: 60, color: '#c792ff' }
];

function crewDef(id) {
  for (const m of CREW_DEFS) if (m.id === id) return m;
  return null;
}

function crewReadyIn(id) {
  return Math.max(0, (G.crewReadyAt[id] || 0) - G.time);
}

function useCrewAbility(id) {
  const def = crewDef(id);
  if (!def || !G.started || G.paused || G.down || G.scene) return;
  if (crewReadyIn(id) > 0) { showToast(def.name + ' needs ' + Math.ceil(crewReadyIn(id)) + 's', 1.4); return; }

  if (id === 'swap') {
    const stars = wantedStars();
    if (stars <= 0) { showToast('NADIA: "No heat to shed — save the plates."', 2); return; }
    // drop exactly one star: heat falls to the top of the band below
    G.heat = (stars - 1) * 100;
    G.lastSeenAt = -99; // the patrol is suddenly looking for another car
    if (G.heat <= 0) clearPolice();
    showToast('NADIA swapped the plates — one star gone', 2.6);
    playSfx('click');
  } else if (id === 'fix') {
    const car = G.inCar;
    if (!car) { showToast('BRUNO: "Get in a car first, then I work."', 2); return; }
    if (car.dead) { showToast('BRUNO: "That one is scrap. Even I have limits."', 2.2); return; }
    const max = carMaxHealth(car);
    if (car.health >= max - 0.5) { showToast('BRUNO: "Hull is already whole."', 1.8); return; }
    car.health = Math.min(max, car.health + 0.3 * max);
    showToast('BRUNO patched the hull +' + Math.round(0.3 * max) + '%', 2.4);
    playSfx('buy');
  } else if (id === 'eyes') {
    G.eyesOutUntil = G.time + 20;
    showToast('ALBA is watching — every unit is on your map (20s)', 2.6);
    playSfx('click');
  }
  G.crewReadyAt[id] = G.time + def.cooldown;
}

function bindCrewInput() {
  window.addEventListener('keydown', function (e) {
    for (const m of CREW_DEFS) if (e.code === m.key) useCrewAbility(m.id);
  });
}
