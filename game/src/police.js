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

function unitRole(unit) {
  // what a unit is DOING, read off its live behaviour — the RESPONSE panel
  // prints this, so it is derived, never scripted: a parked car is holding a
  // roadblock, a unit ahead of the player's heading is running to cut them
  // off (flanking), a unit on the bumper at speed is ramming, the rest pursue
  const car = unit.car;
  if (car.dead) return 'DISABLED';
  if (car.parked) return 'ROADBLOCK';
  const px = G.player.pos.x, pz = G.player.pos.z;
  const dx = car.pos.x - px, dz = car.pos.z - pz;
  const d = Math.sqrt(dx * dx + dz * dz);
  const heading = G.inCar ? G.inCar.angle : G.player.angle;
  const fx = Math.sin(heading), fz = Math.cos(heading);
  const ahead = d > 0.01 ? (dx * fx + dz * fz) / d : 0;
  if (ahead > 0.45 && d > 10) return 'FLANKING';
  if (d < 13 && Math.abs(car.speed) > 5) return 'RAMMING';
  return 'PURSUIT';
}

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
  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.07, 0.04),
    new THREE.MeshLambertMaterial({ color: 0x0c0e12 }));
  shades.position.set(0, 1.74, 0.19); o.add(shades);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), uniform);
  cap.position.y = 1.96; o.add(cap);
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.26), uniform);
  capBrim.position.set(0, 1.91, 0.3); o.add(capBrim);
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
  // a roadblock that reads at a glance: two interceptors angled nose-in, a
  // red-white striped barrier on trestle legs between them, a spike strip in
  // front of it and a drift of traffic cones — not one orange slab
  const group = { units: [], barrier: null, props: [] };
  for (const side of [-3.6, 3.6]) {
    const ox = bx + Math.cos(angle) * side, oz = bz - Math.sin(angle) * side;
    const unit = spawnPoliceCar(scene, ox, oz);
    unit.car.angle = angle + (side < 0 ? 0.55 : -0.55);
    unit.car.mesh.rotation.y = unit.car.angle;
    unit.car.parked = true;
    unit.state = 'ROADBLOCK';
    group.units.push(unit);
    // an officer stands by each car, gun up
    const om = makeOfficerMesh();
    om.position.set(ox + Math.sin(angle) * 2.6, 0, oz + Math.cos(angle) * 2.6);
    om.rotation.y = angle + Math.PI;
    scene.add(om);
    G.officers.push({ mesh: om, pos: om.position, health: 50, dead: false, shootIn: 1 + Math.random() * 2, phase: Math.random() * 6 });
  }
  const barrierGroup = new THREE.Group();
  const stripeMat = new THREE.MeshLambertMaterial({ map: makeStripeTexture() });
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.85, 0.3), stripeMat);
  barrier.position.y = 0.95; barrier.castShadow = true;
  barrierGroup.add(barrier);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x2b2e33 });
  for (const lx of [-3.6, 0, 3.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.7), legMat);
    leg.position.set(lx, 0.48, 0); barrierGroup.add(leg);
  }
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  sign.position.set(0, 1.75, 0); barrierGroup.add(sign);
  barrierGroup.position.set(bx, 0, bz);
  barrierGroup.rotation.y = angle;
  scene.add(barrierGroup);
  group.barrier = barrierGroup;
  group.props.push(barrierGroup);
  // spike strip across the lane in front, and cones scattered at the mouth
  const fx = Math.sin(angle), fz = Math.cos(angle);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.09, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x1c1e22 }));
  strip.position.set(bx - fx * 4.2, 0.1, bz - fz * 4.2);
  strip.rotation.y = angle;
  scene.add(strip);
  group.props.push(strip);
  const coneGeo = new THREE.ConeGeometry(0.34, 0.85, 7);
  const coneMat = new THREE.MeshLambertMaterial({ color: 0xff6a26 });
  for (let i = 0; i < 6; i++) {
    const t = (i - 2.5) * 1.9;
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(bx + Math.cos(angle) * t - fx * 6.4, 0.43, bz - Math.sin(angle) * t - fz * 6.4);
    cone.castShadow = true;
    scene.add(cone);
    group.props.push(cone);
  }
  G.colliders.push({ x0: bx - 3.4, x1: bx + 3.4, z0: bz - 0.6, z1: bz + 0.6, temp: true });
  return group;
}

function spawnHelicopter(scene) {
  // a helicopter silhouette, not a crate with a plank: rounded belly, glass
  // cockpit, tail boom with a fin and a spinning tail rotor, skids, and the main
  // rotor as a translucent blur disc over two faint blade boxes. The searchlight
  // cone is brighter now and lands in a visible pool of light on the street.
  const heli = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x243447 });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x141a24 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 5.6), bodyMat);
  body.castShadow = true; heli.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1.85, 10, 7), bodyMat);
  belly.scale.set(0.88, 0.5, 1.5); belly.position.set(0, -0.75, 0.3); heli.add(belly);
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.5, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x9fd4e8 }));
  cockpit.position.set(0, 0.28, 2.9); heli.add(cockpit);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.4, 5.66),
    new THREE.MeshBasicMaterial({ color: 0xffb020 }));
  stripe.position.y = -0.2; heli.add(stripe);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 5.6), bodyMat);
  tail.position.set(0, 0.45, -5.2); heli.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2, 1.15), bodyMat);
  fin.position.set(0, 1.05, -7.9); heli.add(fin);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.3), darkMat);
  tailRotor.position.set(0.24, 1.05, -7.9); tailRotor.name = 'tailrotor'; heli.add(tailRotor);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.7, 6), darkMat);
  mast.position.y = 1.35; heli.add(mast);
  const rotorGroup = new THREE.Group();
  rotorGroup.position.y = 1.78; rotorGroup.name = 'rotor';
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x14161a, transparent: true, opacity: 0.55 });
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.07, 0.65), bladeMat);
  const blade2 = blade1.clone(); blade2.rotation.y = Math.PI / 2;
  rotorGroup.add(blade1); rotorGroup.add(blade2);
  const blurDisc = new THREE.Mesh(new THREE.CircleGeometry(6.3, 24),
    new THREE.MeshBasicMaterial({ color: 0x2a2f38, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  blurDisc.rotation.x = -Math.PI / 2;
  rotorGroup.add(blurDisc);
  heli.add(rotorGroup);
  for (const sx of [-1.25, 1.25]) { // skids on struts
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 5.4, 6), darkMat);
    skid.rotation.x = Math.PI / 2; skid.position.set(sx, -1.95, 0.2); heli.add(skid);
    for (const sz of [-1.4, 1.6]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.14), darkMat);
      strut.position.set(sx, -1.45, sz); strut.rotation.z = sx > 0 ? -0.35 : 0.35; heli.add(strut);
    }
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  beacon.position.set(0, 0.4, -7.9); heli.add(beacon);
  // the beam's geometry is translated so its apex sits at the mesh origin —
  // aimSearchlight() can then swing the cone around the apex to land on the
  // player instead of hanging straight down wherever the helicopter drifts
  const coneGeo = new THREE.ConeGeometry(9.5, CS.helicopter.height, 20, 1, true);
  coneGeo.translate(0, -CS.helicopter.height / 2, 0);
  const cone = new THREE.Mesh(coneGeo,
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.21, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.y = -1.2;
  cone.name = 'beam';
  heli.add(cone);
  // the pool of light where the beam lands — a flat additive disc that the
  // update loop keeps under the player
  const pool = new THREE.Mesh(new THREE.CircleGeometry(9.5, 20),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2;
  pool.name = 'lightpool';
  scene.add(pool);
  const spot = new THREE.SpotLight(0xffe9a8, 1.9, 140, 0.34, 0.5, 0.6);
  spot.position.set(0, -1, 0);
  heli.add(spot); heli.add(spot.target);
  scene.add(heli);
  G.helicopter = { mesh: heli, rotor: rotorGroup, tailRotor: tailRotor, cone: cone, pool: pool, spot: spot, angle: 0, name: CS.helicopter.name, state: 'SPOTLIGHT ON YOU' };
  return G.helicopter;
}

function aimSearchlight() {
  // swing the beam cone (apex at its origin, hanging along -Y) onto the player:
  // compute the world direction, undo the helicopter's own yaw, and set the
  // cone's local quaternion from straight-down to that direction
  const h = G.helicopter;
  if (!h || !h.cone || !G.player) return;
  const hp = h.mesh.position, tp = G.player.pos;
  const dir = new THREE.Vector3(tp.x - hp.x, -hp.y, tp.z - hp.z);
  if (dir.lengthSq() < 1) return;
  dir.normalize();
  const inv = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -h.mesh.rotation.y);
  dir.applyQuaternion(inv);
  h.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
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
  if (stars < 4 && G.helicopter) {
    G.scene3.remove(G.helicopter.mesh);
    if (G.helicopter.pool) G.scene3.remove(G.helicopter.pool);
    G.helicopter = null;
  }
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
    if (h.tailRotor) h.tailRotor.rotation.x += dt * 40;
    if (h.pool) h.pool.position.set(playerPos.x, 0.22, playerPos.z);
    aimSearchlight();
    h.spot.target.position.set(playerPos.x - hx, -CS.helicopter.height, playerPos.z - hz);
    h.state = stars >= 4 ? 'SPOTLIGHT ON YOU' : 'TRACKING';
  }
}

function clearRoadblock() {
  if (!G.roadblock) return;
  for (const u of G.roadblock.units) { u.car.parked = false; u.state = 'EN ROUTE'; }
  if (G.roadblock.props) for (const m of G.roadblock.props) G.scene3.remove(m);
  G.roadblock = null;
  G.colliders = G.colliders.filter(function (c) { return !c.temp; });
}

function clearPolice() {
  for (const u of G.police) G.scene3.remove(u.car.mesh);
  G.police = [];
  if (G.helicopter) {
    G.scene3.remove(G.helicopter.mesh);
    if (G.helicopter.pool) G.scene3.remove(G.helicopter.pool);
    G.helicopter = null;
  }
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
      ? 'The Costa Serena Patrol got their collar. The fine cost you ₡200 and your heat is gone.'
      : 'The tide took that one. The hospital patched you up for ₡200.';
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
