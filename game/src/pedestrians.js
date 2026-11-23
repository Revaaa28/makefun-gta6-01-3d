// Costa Serena — pedestrians.js: the people of the city. Low-poly walkers in beach
// colours stroll the sidewalks, cross at corners, and run when the shooting starts
// or a car comes at them. Each ped is a small object the combat system can hurt and
// the police system can witness.

const PED_SHIRTS = [0xff8a5c, 0x5cc8ff, 0xffe066, 0xff5c8a, 0x7dff8a, 0xf2f0e6, 0xc792ff, 0x5cffd4];
const PED_SKIN = [0xf2c49b, 0xc98d5f, 0x8a5a33, 0x6e4226, 0xffdbb4];

function makePedestrianMesh(rng) {
  const ped = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: PED_SHIRTS[Math.floor(rng() * PED_SHIRTS.length)] });
  const skin = new THREE.MeshLambertMaterial({ color: PED_SKIN[Math.floor(rng() * PED_SKIN.length)] });
  const legs = new THREE.MeshLambertMaterial({ color: [0x33415c, 0x5c4333, 0xe8e4da, 0x333333][Math.floor(rng() * 4)] });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.34), shirt);
  torso.position.y = 1.08; torso.castShadow = true; ped.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.36), skin);
  head.position.y = 1.68; ped.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 0.24), legs);
  legL.position.set(-0.16, 0.35, 0); ped.add(legL);
  const legR = legL.clone(); legR.position.x = 0.16; ped.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.2), shirt);
  armL.position.set(-0.4, 1.1, 0); ped.add(armL);
  const armR = armL.clone(); armR.position.x = 0.4; ped.add(armR);
  ped.userData = { legL: legL, legR: legR, armL: armL, armR: armR };
  return ped;
}

function spawnPedestrian(scene, rng, x, z) {
  const mesh = makePedestrianMesh(rng);
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  const ped = {
    mesh: mesh, pos: mesh.position, angle: rng() * Math.PI * 2,
    speed: 0, walkSpeed: 1.1 + rng() * 0.9, health: 40, dead: false,
    state: 'walk', panicUntil: 0, phase: rng() * 6.28, targetX: x, targetZ: z, retargetIn: 2 + rng() * 5
  };
  pickPedTarget(ped, rng);
  return ped;
}

function pickPedTarget(ped, rng) {
  // wander the sidewalk grid: pick a point on a nearby avenue edge
  const useX = (rng || Math.random)() < 0.5;
  const r = rng || Math.random;
  if (useX) {
    const ax = CS.avenuesX[Math.floor(r() * CS.avenuesX.length)];
    ped.targetX = ax + (r() < 0.5 ? -16 : 16);
    ped.targetZ = clampValue(ped.pos.z + (r() - 0.5) * 260, -440, 370);
  } else {
    const az = CS.avenuesZ[Math.floor(r() * CS.avenuesZ.length)];
    ped.targetZ = az + (r() < 0.5 ? -16 : 16);
    ped.targetX = clampValue(ped.pos.x + (r() - 0.5) * 260, -440, 440);
  }
}

function buildPedestrians(scene) {
  const rng = seededRandom(G.seed * 13 + 3);
  for (let i = 0; i < 46; i++) {
    const ax = CS.avenuesX[Math.floor(rng() * CS.avenuesX.length)];
    const az = CS.avenuesZ[Math.floor(rng() * CS.avenuesZ.length)];
    const x = clampValue(ax + (rng() - 0.5) * 200, -440, 440);
    const z = clampValue(az + (rng() - 0.5) * 200, -440, 370);
    G.peds.push(spawnPedestrian(scene, rng, x, z));
  }
}

function updatePedestrians(dt) {
  for (const ped of G.peds) {
    if (ped.dead) continue;
    let want = ped.walkSpeed;
    // panic: gunfire nearby, a wanted player close, or a fast car bearing down
    const playerDist = G.player ? distance2D(ped.pos.x, ped.pos.z, G.player.pos.x, G.player.pos.z) : 99;
    if (G.time < ped.panicUntil || (G.wanted >= 2 && playerDist < 16)) {
      want = 4.6;
      if (G.player && playerDist < 30) { ped.targetX = ped.pos.x + (ped.pos.x - G.player.pos.x); ped.targetZ = ped.pos.z + (ped.pos.z - G.player.pos.z); }
    }
    const dx = ped.targetX - ped.pos.x, dz = ped.targetZ - ped.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    ped.retargetIn -= dt;
    if (dist < 2 || ped.retargetIn <= 0) { pickPedTarget(ped); ped.retargetIn = 4 + Math.random() * 6; }
    const targetAngle = Math.atan2(dx, dz);
    ped.angle = angleLerp(ped.angle, targetAngle, Math.min(1, dt * 6));
    ped.speed += clampValue(want - ped.speed, -8 * dt, 5 * dt);
    ped.pos.x += Math.sin(ped.angle) * ped.speed * dt;
    ped.pos.z += Math.cos(ped.angle) * ped.speed * dt;
    collideCircle(ped.pos, 0.5);
    ped.mesh.position.copy(ped.pos);
    ped.mesh.rotation.y = ped.angle;
    ped.phase += dt * (3 + ped.speed * 2.4);
    const swing = Math.sin(ped.phase) * 0.5 * clampValue(ped.speed / 2, 0, 1);
    ped.mesh.userData.legL.rotation.x = swing;
    ped.mesh.userData.legR.rotation.x = -swing;
    ped.mesh.userData.armL.rotation.x = -swing * 0.8;
    ped.mesh.userData.armR.rotation.x = swing * 0.8;
    ped.mesh.position.y = Math.abs(Math.sin(ped.phase)) * 0.05;
  }
}

function hurtPedestrian(ped, amount) {
  if (ped.dead) return;
  ped.health -= amount;
  ped.panicUntil = G.time + 6;
  for (const p of G.peds) if (distance2D(p.pos.x, p.pos.z, ped.pos.x, ped.pos.z) < 22) p.panicUntil = G.time + 5;
  if (ped.health <= 0) {
    ped.dead = true;
    ped.mesh.rotation.x = -Math.PI / 2;
    ped.mesh.position.y = 0.25;
    G.kills++;
  }
}
