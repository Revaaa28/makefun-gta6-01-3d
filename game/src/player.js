// Costa Serena — player.js: the protagonist. A low-poly figure with a swinging walk
// on foot, a mouse-orbit third-person camera, and the enter/exit-car flow that turns
// any traffic car, patrol car or the Serena GT into the player's ride.

function makePlayerMesh() {
  // the protagonist reads from behind, over the shoulder, in almost every frame
  // the player ever sees — so he is built for that angle: sunset-orange jacket
  // with a white chest stripe, a teal backpack, navy cap, white sneakers
  const p = new THREE.Group();
  const jacket = new THREE.MeshLambertMaterial({ color: 0xff7a2e });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc98d5f });
  const denim = new THREE.MeshLambertMaterial({ color: 0x2e4a7a });
  const navy = new THREE.MeshLambertMaterial({ color: 0x14213d });
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.38), jacket);
  chest.position.y = 1.3; chest.castShadow = true; p.add(chest);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.4),
    new THREE.MeshLambertMaterial({ color: 0xf5f2ea }));
  stripe.position.y = 1.38; p.add(stripe);
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.34), denim);
  hips.position.y = 0.92; p.add(hips);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.24),
    new THREE.MeshLambertMaterial({ color: 0x0f766e }));
  pack.position.set(0, 1.28, -0.32); pack.castShadow = true; p.add(pack);
  const packFlap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.2, 0.26),
    new THREE.MeshLambertMaterial({ color: 0xf2b13d }));
  packFlap.position.set(0, 1.52, -0.32); p.add(packFlap);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.38), skin);
  head.position.y = 1.76; head.castShadow = true; p.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x1c1410 }));
  hair.position.set(0, 1.8, -0.16); p.add(hair);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.44), navy);
  cap.position.y = 2.0; p.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.3), navy);
  brim.position.set(0, 1.95, 0.32); p.add(brim);
  const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.26);
  const legL = new THREE.Mesh(legGeo, denim);
  legL.position.set(-0.17, 0.36, 0); p.add(legL);
  const legR = new THREE.Mesh(legGeo, denim); legR.position.x = 0.17; legR.position.y = 0.36; p.add(legR);
  for (const leg of [legL, legR]) {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.11, 0.38),
      new THREE.MeshLambertMaterial({ color: 0xf5f2ea }));
    shoe.position.set(0, -0.33, 0.05); leg.add(shoe);
  }
  const armGeo = new THREE.BoxGeometry(0.17, 0.64, 0.21);
  const armL = new THREE.Mesh(armGeo, jacket);
  armL.position.set(-0.43, 1.14, 0); p.add(armL);
  const armR = new THREE.Mesh(armGeo, jacket); armR.position.x = 0.43; armR.position.y = 1.14; p.add(armR);
  for (const arm of [armL, armR]) {
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.17, 0.19), skin);
    hand.position.set(0, -0.37, 0); arm.add(hand);
  }
  p.userData = { legL: legL, legR: legR, armL: armL, armR: armR };
  return p;
}

function spawnPlayer(scene, x, z) {
  const mesh = makePlayerMesh();
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  G.player = {
    mesh: mesh, pos: mesh.position, angle: Math.PI, speed: 0, phase: 0,
    camYaw: Math.PI, camPitch: 0.32, camDist: 8.5, radius: 0.55
  };
  return G.player;
}

const keysDown = {};
let mouseDX = 0, mouseDY = 0, mouseDown = false;

function bindPlayerInput(canvas) {
  window.addEventListener('keydown', function (e) {
    keysDown[e.code] = true;
    if (e.code === 'KeyP' && G.started && !G.scene) togglePause();
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keysDown[e.code] = false; });
  canvas.addEventListener('mousedown', function (e) { if (e.button === 0) mouseDown = true; });
  window.addEventListener('mouseup', function (e) { if (e.button === 0) mouseDown = false; });
  canvas.addEventListener('mousemove', function (e) {
    if (document.pointerLockElement === canvas || G.scene) { mouseDX += e.movementX || 0; mouseDY += e.movementY || 0; }
  });
  canvas.addEventListener('click', function () {
    if (G.started && !G.paused && !G.scene && document.pointerLockElement !== canvas) canvas.requestPointerLock();
  });
}

function togglePause() {
  G.paused = !G.paused;
  document.getElementById('pause-screen').style.display = G.paused ? 'flex' : 'none';
  if (document.pointerLockElement) document.exitPointerLock();
}

function nearestCarToPlayer(maxDist) {
  let best = null, bestD = maxDist;
  const pools = G.traffic.concat(G.police.map(function (p) { return p.car; }));
  if (G.personalCar) pools.push(G.personalCar);
  for (const car of pools) {
    if (car.dead) continue;
    const d = distance2D(G.player.pos.x, G.player.pos.z, car.pos.x, car.pos.z);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

function enterCar(car) {
  G.inCar = car; G.currentCar = car;
  G.player.mesh.visible = false;
  car.driver = 'player';
  if (car.kind === 'police') commitCrime(26);
  else if (car.traffic) { commitCrime(14); G.carsStolen++; }
  car.traffic = null;
  playSfx('door');
  showToast('Driving: ' + car.name, 1.6);
}

function exitCar() {
  const car = G.inCar;
  if (!car) return;
  G.inCar = null; car.driver = null;
  const side = car.angle + Math.PI / 2;
  G.player.pos.x = car.pos.x + Math.sin(side) * 2.6;
  G.player.pos.z = car.pos.z + Math.cos(side) * 2.6;
  collideCircle(G.player.pos, 0.55);
  G.player.mesh.visible = true;
  G.player.angle = car.angle;
  playSfx('door');
}

function updatePlayer(dt) {
  const p = G.player;
  if (!p || G.down) return;
  // camera orbit from accumulated mouse movement
  p.camYaw -= mouseDX * 0.0032;
  p.camPitch = clampValue(p.camPitch + mouseDY * 0.0026, 0.06, 1.15);
  mouseDX = 0; mouseDY = 0;

  if (G.inCar) {
    const car = G.inCar;
    let throttle = 0, steer = 0;
    if (keysDown['KeyW'] || keysDown['ArrowUp']) throttle = 1;
    if (keysDown['KeyS'] || keysDown['ArrowDown']) throttle = -1;
    if (keysDown['KeyA'] || keysDown['ArrowLeft']) steer = 1;
    if (keysDown['KeyD'] || keysDown['ArrowRight']) steer = -1;
    driveCar(car, dt, throttle, steer, !!keysDown['Space']);
    p.pos.copy(car.pos); p.angle = car.angle;
    if (keysDown['KeyE']) { keysDown['KeyE'] = false; exitCar(); }
    updateChaseCamera(dt, car.pos, car.angle, 10.5, 3.6);
    updateEngineSound(Math.abs(car.speed) / carTopSpeed(car));
    return;
  }
  updateEngineSound(0);

  let mx = 0, mz = 0;
  if (keysDown['KeyW'] || keysDown['ArrowUp']) mz += 1;
  if (keysDown['KeyS'] || keysDown['ArrowDown']) mz -= 1;
  if (keysDown['KeyA'] || keysDown['ArrowLeft']) mx -= 1;
  if (keysDown['KeyD'] || keysDown['ArrowRight']) mx += 1;
  const moving = (mx !== 0 || mz !== 0);
  const sprint = keysDown['ShiftLeft'] || keysDown['ShiftRight'];
  const speedTarget = moving ? (sprint ? 9.4 : 5.2) : 0;
  p.speed += clampValue(speedTarget - p.speed, -30 * dt, 18 * dt);
  if (moving) {
    const moveAngle = p.camYaw + Math.atan2(mx, mz);
    p.angle = angleLerp(p.angle, moveAngle, Math.min(1, dt * 12));
    p.pos.x += Math.sin(p.angle) * p.speed * dt;
    p.pos.z += Math.cos(p.angle) * p.speed * dt;
    collideCircle(p.pos, p.radius);
  }
  p.phase += dt * (2.5 + p.speed * 1.9);
  const swing = Math.sin(p.phase) * 0.55 * clampValue(p.speed / 5, 0, 1);
  p.mesh.userData.legL.rotation.x = swing;
  p.mesh.userData.legR.rotation.x = -swing;
  p.mesh.userData.armL.rotation.x = -swing * 0.85;
  p.mesh.userData.armR.rotation.x = swing * 0.85;
  p.mesh.position.copy(p.pos);
  p.mesh.rotation.y = p.angle;
  p.mesh.position.y = Math.abs(Math.sin(p.phase)) * 0.06 * clampValue(p.speed / 5, 0, 1);
  updateChaseCamera(dt, p.pos, p.camYaw, p.camDist, 2.4 + p.camPitch * 4.2);
}

function updateChaseCamera(dt, target, yaw, dist, height) {
  const cam = G.camera;
  const cx = target.x - Math.sin(yaw) * dist * Math.cos(G.player.camPitch * 0.6);
  const cz = target.z - Math.cos(yaw) * dist * Math.cos(G.player.camPitch * 0.6);
  const cy = height + Math.sin(G.player.camPitch) * dist * 0.55;
  if (!cam.userData.init) { cam.position.set(cx, cy, cz); cam.userData.init = true; }
  const k = Math.min(1, dt * 7);
  cam.position.x += (cx - cam.position.x) * k;
  cam.position.y += (cy - cam.position.y) * k;
  cam.position.z += (cz - cam.position.z) * k;
  cam.lookAt(target.x, 1.6, target.z);
  // keep the sun's shadow frustum centred near the action
  if (G.sunLight) {
    G.sunLight.position.set(target.x - 420, 128, target.z + 260);
    G.sunLight.target.position.set(target.x, 0, target.z);
  }
}
