// Costa Serena — police.js: the Costa Serena Patrol. Heat becomes stars, stars
// become an escalating response: patrol cars that hunt and ram, roadblocks across
// the avenue ahead at three stars, officers on foot, and at four stars FALCON-1
// overhead with its searchlight. Every unit carries a name, and hud.js reads the
// same roster to fill the CSP RESPONSE panel.

function commitCrime(amount) {
  if (G.down) return;
  G.heat = clampValue(G.heat + amount, 0, 500);
  G.lastCrimeAt = G.time;
  G.lastSeenAt = G.time;
}

function wantedStars() { return G.heat <= 0 ? 0 : Math.ceil(G.heat / 100); }

function makeOfficerMesh() {
  const o = new THREE.Group();
  const uniform = new THREE.MeshLambertMaterial({ color: 0x1d3557 });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc98d5f });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.8, 0.36), uniform);
  torso.position.y = 1.09; torso.castShadow = true; o.add(torso);
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.4, 0.4),
    new THREE.MeshLambertMaterial({ color: 0xf2b13d }));
  vest.position.y = 1.2; o.add(vest);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.41, 0.37), skin);
  head.position.y = 1.7; o.add(head);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), uniform);
  cap.position.y = 1.96; o.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.7, 0.25), uniform);
  legL.position.set(-0.16, 0.36, 0); o.add(legL);
  const legR = legL.clone(); legR.position.x = 0.16; o.add(legR);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.62),
    new THREE.MeshLambertMaterial({ color: 0x14161a }));
  gun.position.set(0.42, 1.28, 0.34); o.add(gun);
  o.userData = { legL: legL, legR: legR };
  return o;
}

function spawnPoliceCar(scene, x, z) {
  const car = spawnCar(scene, x, z, Math.random() * 6.28, 0xf2f4f6, 'police', 'CSP Interceptor');
  const unit = { car: car, name: CS.policeUnits[G.unitSeq % CS.policeUnits.length], state: 'EN ROUTE', shootIn: 2 + Math.random() * 2 };
  G.unitSeq++;
  G.police.push(unit);
  return unit;
}

function spawnRoadblock(scene, bx, bz, angle) {
  const group = { units: [], barrier: null };
  for (const side of [-3.4, 3.4]) {
    const ox = bx + Math.cos(angle) * side, oz = bz - Math.sin(angle) * side;
    const unit = spawnPoliceCar(scene, ox, oz);
    unit.car.angle = angle + (side < 0 ? 0.5 : -0.5);
    unit.car.mesh.rotation.y = unit.car.angle;
    unit.car.parked = true;
    unit.state = 'ROADBLOCK';
    group.units.push(unit);
    // an officer stands by each car, gun up
    const om = makeOfficerMesh();
    om.position.set(ox + Math.sin(angle) * 2.4, 0, oz + Math.cos(angle) * 2.4);
    om.rotation.y = angle + Math.PI;
    scene.add(om);
    G.officers.push({ mesh: om, pos: om.position, health: 50, dead: false, shootIn: 1 + Math.random() * 2, phase: Math.random() * 6 });
  }
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.0, 0.5),
    new THREE.MeshLambertMaterial({ color: 0xff7a2e }));
  barrier.position.set(bx, 0.5, bz);
  barrier.rotation.y = angle;
  scene.add(barrier);
  G.colliders.push({ x0: bx - 3.4, x1: bx + 3.4, z0: bz - 0.6, z1: bz + 0.6, temp: true });
  return group;
}

function spawnHelicopter(scene) {
  const heli = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x243447 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 6.4), bodyMat);
  body.castShadow = true; heli.add(body);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 5.4), bodyMat);
  tail.position.set(0, 0.4, -5.4); heli.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.8, 1.1), bodyMat);
  fin.position.set(0, 1, -7.8); heli.add(fin);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.08, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x14161a }));
  rotor.position.y = 1.5; rotor.name = 'rotor'; heli.add(rotor);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(9, CS.helicopter.height, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.y = -CS.helicopter.height / 2 - 1;
  cone.name = 'beam';
  heli.add(cone);
  const spot = new THREE.SpotLight(0xffe9a8, 1.6, 130, 0.32, 0.5, 0.6);
  spot.position.set(0, -1, 0);
  heli.add(spot); heli.add(spot.target);
  scene.add(heli);
  G.helicopter = { mesh: heli, rotor: rotor, spot: spot, angle: 0, name: CS.helicopter.name, state: 'SPOTLIGHT ON YOU' };
  return G.helicopter;
}

function updateWanted(dt) {
  const stars = wantedStars();
  G.wanted = stars;
  // heat cools when the patrol loses sight of you
  const playerPos = G.player.pos;
  let seen = false;
  for (const u of G.police) if (distance2D(u.car.pos.x, u.car.pos.z, playerPos.x, playerPos.z) < 85) seen = true;
  if (G.helicopter && stars >= 4) seen = true;
  if (seen) G.lastSeenAt = G.time;
  if (G.time - G.lastSeenAt > 7 && G.time - G.lastCrimeAt > 4 && stars > 0) {
    G.heat = Math.max(0, G.heat - dt * 9);
    if (G.heat <= 0) clearPolice();
  }

  // --- maintain the response strength -----------------------------------------
  const wantCars = stars === 0 ? 0 : Math.min(2 + stars, 7);
  if (stars > 0 && G.police.length < wantCars && (G.spawnCooldown || 0) <= 0) {
    G.spawnCooldown = 1.4;
    const a = Math.random() * Math.PI * 2, r = 95 + Math.random() * 40;
    let sx = clampValue(playerPos.x + Math.sin(a) * r, -440, 440);
    let sz = clampValue(playerPos.z + Math.cos(a) * r, -440, 360);
    spawnPoliceCar(G.scene3, sx, sz);
  }
  G.spawnCooldown = Math.max(0, (G.spawnCooldown || 0) - dt);

  if (stars >= 3 && !G.roadblock && G.inCar) {
    const car = G.inCar;
    const bx = car.pos.x + Math.sin(car.angle) * 78;
    const bz = car.pos.z + Math.cos(car.angle) * 78;
    if (Math.abs(bx) < 430 && bz > -440 && bz < 370) {
      G.roadblock = spawnRoadblock(G.scene3, bx, bz, car.angle + Math.PI / 2);
      showToast('CSP ROADBLOCK AHEAD', 2.2);
    }
  }
  if (stars >= 4 && !G.helicopter) { spawnHelicopter(G.scene3); showToast('FALCON-1 IS OVERHEAD', 2.4); }
  if (stars < 4 && G.helicopter) { G.scene3.remove(G.helicopter.mesh); G.helicopter = null; }
  if (stars < 2 && G.roadblock) clearRoadblock();

  // --- chase AI -------------------------------------------------------------------
  for (const unit of G.police) {
    const car = unit.car;
    if (car.dead) { unit.state = 'DISABLED'; continue; }
    if (car === G.inCar) { unit.state = 'STOLEN'; continue; }
    if (car.parked) { unit.state = 'ROADBLOCK'; continue; }
    const d = distance2D(car.pos.x, car.pos.z, playerPos.x, playerPos.z);
    const targetAngle = Math.atan2(playerPos.x - car.pos.x, playerPos.z - car.pos.z);
    car.angle = angleLerp(car.angle, targetAngle, Math.min(1, dt * 1.7));
    const want = d > 9 ? carTopSpeed(car) * 0.94 : car.speed * 0.4;
    car.speed += clampValue(want - car.speed, -30 * dt, 14 * dt);
    car.pos.x += Math.sin(car.angle) * car.speed * dt;
    car.pos.z += Math.cos(car.angle) * car.speed * dt;
    collideCircle(car.pos, 2.1);
    car.mesh.position.copy(car.pos);
    car.mesh.rotation.y = car.angle;
    const bar = car.mesh.getObjectByName('lightbar');
    if (bar) bar.material.color.setHex(Math.floor(G.time * 6) % 2 ? 0xff3b30 : 0x3d7ad9);
    unit.state = d < 26 ? 'PURSUIT' : 'EN ROUTE';
    // ramming hurts
    const victim = G.inCar || null;
    if (victim && d < 4.4 && Math.abs(car.speed) > 6) { damageCar(victim, 7 * dt * 4, 0); }
    if (!G.inCar && d < 3.2 && Math.abs(car.speed) > 5) hurtPlayer(10 * dt * 3);
  }
  // despawn far units when calm
  if (stars === 0) clearPolice();

  // officers on foot shoot at a wanted player in range
  for (const off of G.officers) {
    if (off.dead) continue;
    const d = distance2D(off.pos.x, off.pos.z, playerPos.x, playerPos.z);
    off.mesh.rotation.y = Math.atan2(playerPos.x - off.pos.x, playerPos.z - off.pos.z);
    off.shootIn -= dt;
    if (stars >= 2 && d < 34 && off.shootIn <= 0) {
      off.shootIn = 1.1 + Math.random() * 1.2;
      fireHitscan(off.pos, 1.35, playerPos, 1.1, 5, 0xff5040);
      if (Math.random() < 0.55) hurtPlayer(4);
      playSfx('shot');
    }
  }

  // helicopter tracks and lights the player
  if (G.helicopter) {
    const h = G.helicopter;
    h.angle += dt * 0.5;
    const hx = playerPos.x + Math.sin(h.angle) * 16;
    const hz = playerPos.z + Math.cos(h.angle) * 16;
    h.mesh.position.set(hx, CS.helicopter.height, hz);
    h.mesh.rotation.y = h.angle + Math.PI / 2;
    h.rotor.rotation.y += dt * 28;
    h.spot.target.position.set(playerPos.x - hx, -CS.helicopter.height, playerPos.z - hz);
    h.state = stars >= 4 ? 'SPOTLIGHT ON YOU' : 'TRACKING';
  }
}

function clearRoadblock() {
  if (!G.roadblock) return;
  for (const u of G.roadblock.units) { u.car.parked = false; u.state = 'EN ROUTE'; }
  G.roadblock = null;
  G.colliders = G.colliders.filter(function (c) { return !c.temp; });
}

function clearPolice() {
  for (const u of G.police) G.scene3.remove(u.car.mesh);
  G.police = [];
  if (G.helicopter) { G.scene3.remove(G.helicopter.mesh); G.helicopter = null; }
  clearRoadblock();
}

function hurtPlayer(amount) {
  if (G.down || G.scene) return;
  if (G.armour > 0) { const absorbed = Math.min(G.armour, amount); G.armour -= absorbed; amount -= absorbed; }
  G.health -= amount;
  if (G.health <= 0) {
    G.health = 0; G.down = true;
    document.getElementById('down-screen').style.display = 'flex';
    document.getElementById('down-title').textContent = G.wanted >= 3 ? 'BUSTED' : 'WASTED';
    document.getElementById('down-line').textContent = G.wanted >= 3
      ? 'The Costa Serena Patrol got their collar. The fine cost you $200 and your heat is gone.'
      : 'The tide took that one. The hospital patched you up for $200.';
    setTimeout(respawnPlayer, 2600);
  }
}

function respawnPlayer() {
  G.money = Math.max(0, G.money - 200);
  G.health = 100; G.heat = 0; G.down = false;
  if (G.inCar) { G.inCar = null; G.player.mesh.visible = true; }
  clearPolice();
  G.player.pos.set(CS.hospital.x, 0, CS.hospital.z);
  document.getElementById('down-screen').style.display = 'none';
  saveGame();
}
