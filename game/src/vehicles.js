// Costa Serena — vehicles.js: every car in the city is built here, and the arcade
// driving model lives here too. One factory makes traffic cars, patrol cars, the
// marked mission cars and the Serena GT, so a car looks and drives the same whoever
// owns it. A car is a plain object: { mesh, pos, angle, speed, health, name, ... }.

const CAR_PAINTS = [0xd94f3d, 0x3d7ad9, 0xf2b13d, 0x3dd9a4, 0xe8e4da, 0x8a4dd9, 0xd93d8a, 0x4dd0e1, 0x9ccc3c, 0xff7043];

const HUBCAP_GEO = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 8);
const HUBCAP_MAT = new THREE.MeshLambertMaterial({ color: 0xb9bec2 });

function addLightGlow(car, x, y, z, color, scale) {
  if (!G.glowTexture) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: G.glowTexture, color: color, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.75
  }));
  s.scale.set(scale, scale, 1);
  s.position.set(x, y, z);
  car.add(s);
}

function buildSerenaGT(car, bodyMat, glassMat, trimMat) {
  // the hero car, shaped rather than stacked: a low wide hull, a nose that
  // dives, a black glass canopy teardropped over the middle, haunches over the
  // rear wheels, a wing on struts and two exhausts. It is the car on the cover,
  // the car in the garage and the fastest thing in the city — it has to read
  // as a sports car at contact-sheet size, from behind, at speed.
  // NOTE: the hull is added FIRST — garage.js resprays mesh.children[0].
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.52, 4.9), bodyMat);
  hull.position.y = 0.56; hull.castShadow = true;
  car.add(hull);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.2, 4.96), trimMat);
  skirt.position.y = 0.28; car.add(skirt);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.34, 1.5), bodyMat);
  nose.position.set(0, 0.52, 2.2); nose.rotation.x = 0.13; car.add(nose);
  const intake = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.3), trimMat);
  intake.position.set(0, 0.38, 2.52); car.add(intake);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.5, 2.3), glassMat);
  canopy.position.set(0, 1.02, -0.35); canopy.castShadow = true; car.add(canopy);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.44, 0.12), glassMat);
  shield.position.set(0, 0.98, 0.86); shield.rotation.x = -0.5; car.add(shield);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.16, 1.1), bodyMat);
  deck.position.set(0, 0.9, -1.95); car.add(deck);
  for (const sx of [-1.08, 1.08]) { // rear haunches over the wide wheels
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.44, 1.5), bodyMat);
    h.position.set(sx, 0.62, -1.55); car.add(h);
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.2), trimMat);
    mir.position.set(sx * 0.94, 1.12, 0.62); car.add(mir);
  }
  for (const sx of [-0.72, 0.72]) { // wing struts + the wing itself
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.3), trimMat);
    strut.position.set(sx, 1.12, -2.28); car.add(strut);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.1, 0.52), bodyMat);
  wing.position.set(0, 1.36, -2.3); wing.rotation.x = 0.1; car.add(wing);
  for (const sx of [-1.14, 1.14]) { // wing endplates, so the spoiler reads as one
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.56), trimMat);
    plate.position.set(sx, 1.38, -2.3); car.add(plate);
  }
  const pipeMat = new THREE.MeshLambertMaterial({ color: 0x8f979e });
  for (const sx of [-0.52, 0.52]) { // twin exhausts
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.34, 8), pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(sx, 0.34, -2.52); car.add(pipe);
  }
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 0.24), trimMat);
  diffuser.position.set(0, 0.3, -2.48); car.add(diffuser);
}

function makeCarMesh(paint, kind) {
  // one factory, proper silhouettes: a skirted body, a glass cabin set into it
  // with a painted roof, bumpers, mirrors, hubcapped wheels and lit lamps with
  // halos — at dusk a car is mostly its lights and its outline, so both are here
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: paint });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x0d1622 });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x22242a });
  if (kind === 'gt') {
    buildSerenaGT(car, bodyMat, glassMat, trimMat);
  } else {
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, 4.5), bodyMat);
  body.position.y = 0.62; body.castShadow = true;
  car.add(body);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.22, 4.56), trimMat);
  skirt.position.y = 0.3; car.add(skirt);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 1.1), bodyMat);
  hood.position.set(0, 0.78, 1.9); car.add(hood);
  for (const bz of [2.32, -2.32]) { // bumpers
    const bump = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.26, 0.22), trimMat);
    bump.position.set(0, 0.42, bz); car.add(bump);
  }
  }
  if (kind === 'van') {
    const boxBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.15, 3.4), bodyMat);
    boxBody.position.set(0, 1.35, -0.45); boxBody.castShadow = true; car.add(boxBody);
    const shield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.1), glassMat);
    shield.position.set(0, 1.32, 1.28); shield.rotation.x = -0.18; car.add(shield);
    const winBand = new THREE.Mesh(new THREE.BoxGeometry(2.09, 0.4, 2.6), glassMat);
    winBand.position.set(0, 1.62, -0.6); car.add(winBand);
  } else if (kind !== 'gt') {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 2.15), glassMat);
    cabin.position.set(0, 1.18, -0.25); cabin.castShadow = true;
    car.add(cabin);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 1.7), bodyMat);
    roof.position.set(0, 1.52, -0.3); car.add(roof);
    for (const mx of [-1.02, 1.02]) { // mirrors
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.2), trimMat);
      mir.position.set(mx, 1.18, 0.72); car.add(mir);
    }
  }
  if (kind === 'pickup') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 1.6), trimMat);
    bed.position.set(0, 0.95, -1.7); car.add(bed);
  }
  if (kind === 'taxi') {
    const signBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.34), trimMat);
    signBase.position.set(0, 1.62, -0.3); car.add(signBase);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    sign.position.set(0, 1.76, -0.3); car.add(sign);
  }
  if (kind === 'police') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
    bar.position.set(0, 1.66, -0.25); bar.name = 'lightbar';
    car.add(bar);
    // the bar reads emissive, not painted: a red bloom on the left half and a
    // blue one on the right, the two colours every patrol lightbar throws
    addLightGlow(car, -0.4, 1.88, -0.25, 0xff5040, 1.15);
    addLightGlow(car, 0.4, 1.88, -0.25, 0x4da3ff, 1.15);
    // black-and-white livery: dark band around the waist, dark bonnet and boot
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.34, 4.54),
      new THREE.MeshLambertMaterial({ color: 0x14181f }));
    band.position.y = 0.6; car.add(band);
    const bonnet = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.32, 1.14),
      new THREE.MeshLambertMaterial({ color: 0x14181f }));
    bonnet.position.set(0, 0.8, 1.9); car.add(bonnet);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x15161a });
  const wheels = [];
  for (const [wx, wz] of [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.42, wz);
    if (kind === 'gt') { w.scale.set(1.16, 1, 1.16); w.position.y = 0.49; }
    car.add(w); wheels.push(w);
    const hub = new THREE.Mesh(HUBCAP_GEO, HUBCAP_MAT);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(wx * 1.01, 0.42, wz);
    if (kind === 'gt') { hub.scale.set(1.16, 1, 1.16); hub.position.y = 0.49; }
    car.add(hub); wheels.push(hub);
  }
  const lightGeo = new THREE.BoxGeometry(0.42, 0.16, 0.06);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff5040 });
  const lz = kind === 'gt' ? 2.47 : 2.26, ly = kind === 'gt' ? 0.6 : 0.68;
  for (const sx of [-0.62, 0.62]) {
    const hl = new THREE.Mesh(lightGeo, headMat); hl.position.set(sx, ly, lz); car.add(hl);
    const tl = new THREE.Mesh(lightGeo, tailMat); tl.position.set(sx, ly, -lz); car.add(tl);
    addLightGlow(car, sx, ly, lz + 0.16, 0xffd98a, 1.5);
    addLightGlow(car, sx, ly, -lz - 0.16, 0xff6a55, 0.9);
  }
  car.userData.wheels = wheels;
  return car;
}

function spawnCar(scene, x, z, angle, paint, kind, name) {
  const mesh = makeCarMesh(paint, kind || 'car');
  mesh.position.set(x, 0, z);
  mesh.rotation.y = angle;
  scene.add(mesh);
  return {
    mesh: mesh, pos: mesh.position, angle: angle, speed: 0, steer: 0,
    health: 100, paint: paint, kind: kind || 'car',
    name: name || CS.carNames[Math.floor(Math.random() * CS.carNames.length)],
    engineLevel: 0, armourLevel: 0, dead: false, driver: null
  };
}

function carTopSpeed(car) {
  let base = car.kind === 'gt' ? 52 : (car.kind === 'police' ? 47 : (car.kind === 'van' ? 36 : 42));
  return base * (1 + 0.16 * (car.engineLevel || 0));
}
function carMaxHealth(car) { return 100 + 60 * (car.armourLevel || 0); }

// Arcade driving: throttle builds speed, steering bites harder at low speed and
// bleeds off at the top end, handbrake lets the back step out. Shared by the player
// (input-driven) and nobody else — traffic and police run their own simpler models.
function driveCar(car, dt, throttle, steer, handbrake) {
  const top = carTopSpeed(car);
  const accel = car.kind === 'gt' ? 26 : 20;
  if (throttle > 0) car.speed += accel * throttle * dt * (1 - Math.max(0, car.speed) / (top * 1.25));
  else if (throttle < 0) car.speed += (car.speed > 0.5 ? -34 : -13) * dt;
  else car.speed -= car.speed * 0.55 * dt;
  if (handbrake) car.speed -= car.speed * 1.7 * dt;
  car.speed = clampValue(car.speed, -16, top);
  const steerAuthority = clampValue(Math.abs(car.speed) / 9, 0, 1) * (handbrake ? 1.7 : 1);
  car.angle -= steer * steerAuthority * dt * 1.55 * (car.speed < 0 ? -1 : 1);
  const fx = Math.sin(car.angle), fz = Math.cos(car.angle);
  car.pos.x += fx * car.speed * dt;
  car.pos.z += fz * car.speed * dt;
  collideCircle(car.pos, 2.1);
  car.mesh.position.copy(car.pos);
  car.mesh.rotation.y = car.angle;
  const spin = car.speed * dt / 0.42;
  for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
  if (car.health <= 0 && !car.dead) {
    car.dead = true; car.speed = 0;
    car.mesh.traverse(function (o) { if (o.material && o.material.color) o.material = o.material.clone(), o.material.color.multiplyScalar(0.35); });
  }
}

function damageCar(car, amount, crime) {
  if (!car || car.dead) return;
  car.health -= amount;
  if (car.health <= 0) driveCar(car, 0, 0, 0, false);
  if (crime) commitCrime(crime);
}
