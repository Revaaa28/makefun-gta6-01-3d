// Costa Serena — missions.js: Nadia's six story jobs. Each mission is data — a
// giver point, a briefing line and a list of objectives — and one small state
// machine walks the player through them: drive-to markers, a marked car to steal,
// packages to collect, a hold-the-point robbery and two escapes where the real
// objective is shaking the Costa Serena Patrol.

const MISSION_DEFS = [
  {
    id: 'first-wheels', name: 'FIRST WHEELS', giver: { x: 14, z: 252 }, district: 'Centro',
    line: 'Nadia: "A Palma Coupe in Centro needs to reach the Marina garage. No scratches, no stories."',
    reward: 450, respect: 40,
    objectives: [
      { kind: 'enterMarkedCar', text: 'Get into the marked Palma Coupe', carAt: { x: 36, z: 246 }, carName: 'Palma Coupe' },
      { kind: 'driveTo', text: 'Deliver the coupe to the Marina garage', at: { x: 236, z: 300 }, radius: 9 }
    ]
  },
  {
    id: 'package-run', name: 'PACKAGE RUN', giver: { x: -238, z: 8 }, district: 'Neon Mile',
    line: 'Nadia: "Three packages walked out of Club Vela. Pick them up before anyone asks questions."',
    reward: 600, respect: 55,
    objectives: [
      { kind: 'collect', text: 'Collect the packages around the Neon Mile', points: [{ x: -246, z: -108 }, { x: -352, z: 44 }, { x: -128, z: 118 }] },
      { kind: 'driveTo', text: 'Bring the packages back to Nadia', at: { x: -238, z: 8 }, radius: 8 }
    ]
  },
  {
    id: 'hot-water', name: 'HOT WATER', giver: { x: -352, z: -238 }, district: 'Old Port',
    line: 'Nadia: "The Levante Roadster at the Old Port is borrowed. Permanently. The Patrol will mind."',
    reward: 800, respect: 70,
    objectives: [
      { kind: 'enterMarkedCar', text: 'Steal the marked Levante Roadster', carAt: { x: -330, z: -262 }, carName: 'Levante Roadster', heatOnEnter: 210 },
      { kind: 'loseHeat', text: 'Lose the Costa Serena Patrol' },
      { kind: 'driveTo', text: 'Deliver the roadster to the Hillcrest lookout', at: { x: 8, z: -352 }, radius: 9 }
    ]
  },
  {
    id: 'sunset-run', name: 'SUNSET RUN', giver: { x: 128, z: 246 }, district: 'Boulevard Brisa',
    line: 'Nadia: "A buyer waits at the Hillcrest lookout and the light is going. Seventy-five seconds."',
    reward: 700, respect: 60,
    objectives: [
      { kind: 'timed', text: 'Reach the Hillcrest lookout before the light goes', at: { x: 8, z: -352 }, radius: 10, seconds: 75 }
    ]
  },
  {
    id: 'dockside', name: 'DOCKSIDE DIPLOMACY', giver: { x: 246, z: 128 }, district: 'Docklands',
    line: 'Nadia: "Meet the harbourmaster at the Marina crane. Stand your ground, then be anywhere else."',
    reward: 950, respect: 80,
    objectives: [
      { kind: 'holdPoint', text: 'Stand with the harbourmaster at the crane', at: { x: 384, z: 322 }, radius: 7, seconds: 6, heatOnStart: 160 },
      { kind: 'loseHeat', text: 'Lose the Costa Serena Patrol' },
      { kind: 'driveTo', text: 'Return to the Centro safehouse', at: { x: -108, z: 108 }, radius: 9 }
    ]
  },
  {
    id: 'golden-hour-job', name: 'THE GOLDEN HOUR JOB', giver: { x: -238, z: 8 }, district: 'Neon Mile',
    line: 'Nadia: "The cage at Casino Brisa. One crew, one car, out before the stars are out. This is the big one."',
    reward: 2000, respect: 160,
    objectives: [
      { kind: 'driveTo', text: 'Pick up the crew outside Club Vela', at: { x: -246, z: -60 }, radius: 8 },
      { kind: 'holdPoint', text: 'Hold the Casino Brisa cage while the crew works', at: { x: -352, z: 60 }, radius: 8, seconds: 8, heatOnStart: 330 },
      { kind: 'loseHeat', text: 'Lose the Costa Serena Patrol' },
      { kind: 'driveTo', text: 'Get everyone to the Old Port hideout', at: { x: -420, z: -352 }, radius: 10 }
    ]
  }
];

function nextMissionDef() {
  for (const def of MISSION_DEFS) if (!G.missionsDone.includes(def.id)) return def;
  return null;
}

function makeMarker(x, z, color) {
  const group = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 30, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = 15;
  group.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 8, 24),
    new THREE.MeshBasicMaterial({ color: color }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.4;
  ring.name = 'ring';
  group.add(ring);
  group.position.set(x, 0, z);
  G.scene3.add(group);
  return { group: group, x: x, z: z };
}

function clearMarkers() {
  for (const m of G.markers) G.scene3.remove(m.group);
  G.markers = [];
}

function startMission(def) {
  G.mission = { def: def, step: 0, collected: 0, timer: null, holdFor: 0, startedAt: G.time };
  setupObjective();
  showToast('MISSION STARTED — ' + def.name, 3);
  const dlg = dialogueFromLine(def.line);
  showDialogueStrip(dlg.speaker, dlg.text, 6);
  playSfx('mission');
}

function setupObjective() {
  clearMarkers();
  const m = G.mission; if (!m) return;
  const obj = m.def.objectives[m.step];
  m.timer = obj.seconds || null;
  m.holdFor = 0;
  if (obj.kind === 'enterMarkedCar') {
    const car = spawnCar(G.scene3, obj.carAt.x, obj.carAt.z, Math.PI / 2, 0xf2b13d, 'car', obj.carName);
    car.missionCar = true;
    m.markedCar = car;
    G.markers.push(makeMarker(obj.carAt.x, obj.carAt.z, 0xffd23d));
  } else if (obj.kind === 'collect') {
    for (const pt of obj.points) G.markers.push(makeMarker(pt.x, pt.z, 0x3dd9a4));
  } else if (obj.kind === 'driveTo' || obj.kind === 'timed') {
    G.markers.push(makeMarker(obj.at.x, obj.at.z, 0xffd23d));
  } else if (obj.kind === 'holdPoint') {
    G.markers.push(makeMarker(obj.at.x, obj.at.z, 0xff5c8a));
  }
  updateBanner();
}

function completeObjective() {
  const m = G.mission; if (!m) return;
  m.step++; m.collected = 0;
  playSfx('pickup');
  if (m.step >= m.def.objectives.length) {
    G.money += m.def.reward;
    G.respect += m.def.respect;
    G.missionsDone.push(m.def.id);
    showToast(m.def.name + ' COMPLETE  +₡' + m.def.reward + '  ·  +' + m.def.respect + ' RESPECT', 4.5);
    playSfx('mission');
    G.mission = null;
    clearMarkers();
    saveGame();
    updateBanner();
  } else {
    showToast('Objective done — keep moving', 2);
    setupObjective();
  }
}

function failMission(reason) {
  if (!G.mission) return;
  showToast('MISSION FAILED — ' + reason, 3.5);
  if (G.mission.markedCar && G.mission.markedCar.missionCar) G.mission.markedCar.missionCar = false;
  G.mission = null;
  clearMarkers();
  updateBanner();
}

function currentObjectiveTarget() {
  const m = G.mission; if (!m) return null;
  const obj = m.def.objectives[m.step];
  if (!obj) return null;
  if (obj.kind === 'enterMarkedCar') return obj.carAt;
  if (obj.kind === 'collect') {
    const left = G.markers.filter(function (mk) { return !mk.taken; });
    if (!left.length) return null;
    let best = left[0], bd = 1e18;
    for (const mk of left) { const d = distance2D(G.player.pos.x, G.player.pos.z, mk.x, mk.z); if (d < bd) { bd = d; best = mk; } }
    return best;
  }
  if (obj.at) return obj.at;
  return null;
}

function updateMissions(dt) {
  // idle: offer the next mission at its giver point
  if (!G.mission) {
    const def = nextMissionDef();
    if (def && !G.inCar && distance2D(G.player.pos.x, G.player.pos.z, def.giver.x, def.giver.z) < 4.5) {
      if (keysDown['KeyE'] || keysDown['KeyM']) { keysDown['KeyE'] = false; keysDown['KeyM'] = false; startMission(def); }
    }
    return;
  }
  const m = G.mission;
  const obj = m.def.objectives[m.step];
  const px = G.player.pos.x, pz = G.player.pos.z;
  for (const mk of G.markers) { const r = mk.group.getObjectByName('ring'); if (r) r.rotation.z += dt * 1.4; }

  if (obj.kind === 'enterMarkedCar') {
    if (G.inCar && G.inCar === m.markedCar) {
      if (obj.heatOnEnter) commitCrime(obj.heatOnEnter);
      m.markedCar.missionCar = false;
      completeObjective();
    } else if (m.markedCar && m.markedCar.dead) failMission('the marked car was wrecked');
  } else if (obj.kind === 'collect') {
    for (const mk of G.markers) {
      if (!mk.taken && distance2D(px, pz, mk.x, mk.z) < 3.4) {
        mk.taken = true; G.scene3.remove(mk.group); m.collected++;
        G.money += 25; playSfx('pickup');
        showToast('Package ' + m.collected + ' of ' + obj.points.length + '  (+₡25)', 1.8);
      }
    }
    if (m.collected >= obj.points.length) completeObjective();
  } else if (obj.kind === 'driveTo') {
    const inPlace = G.inCar ? distance2D(G.inCar.pos.x, G.inCar.pos.z, obj.at.x, obj.at.z) < obj.radius
      : distance2D(px, pz, obj.at.x, obj.at.z) < obj.radius;
    if (inPlace) completeObjective();
  } else if (obj.kind === 'timed') {
    m.timer -= dt;
    if (m.timer <= 0) { failMission('the light went'); return; }
    if (distance2D(px, pz, obj.at.x, obj.at.z) < obj.radius || (G.inCar && distance2D(G.inCar.pos.x, G.inCar.pos.z, obj.at.x, obj.at.z) < obj.radius)) completeObjective();
  } else if (obj.kind === 'holdPoint') {
    if (m.holdFor === 0 && obj.heatOnStart && distance2D(px, pz, obj.at.x, obj.at.z) < obj.radius + 6) {
      commitCrime(obj.heatOnStart); obj.heatOnStart = 0;
      showToast('The Patrol is coming — hold the point!', 2.4);
    }
    if (distance2D(px, pz, obj.at.x, obj.at.z) < obj.radius) {
      m.holdFor += dt;
      if (m.holdFor >= obj.seconds) completeObjective();
    } else m.holdFor = Math.max(0, m.holdFor - dt * 0.5);
  } else if (obj.kind === 'loseHeat') {
    if (G.wanted === 0) completeObjective();
  }
}

function missionPromptVisible() {
  if (G.mission || G.inCar || !G.player) return null;
  const def = nextMissionDef();
  if (!def) return null;
  return distance2D(G.player.pos.x, G.player.pos.z, def.giver.x, def.giver.z) < 26 ? def : null;
}
