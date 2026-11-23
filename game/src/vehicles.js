// Costa Serena — vehicles.js: every car in the city is built here, and the arcade
// driving model lives here too. One factory makes traffic cars, patrol cars, the
// marked mission cars and the Serena GT, so a car looks and drives the same whoever
// owns it. A car is a plain object: { mesh, pos, angle, speed, health, name, ... }.

const CAR_PAINTS = [0xd94f3d, 0x3d7ad9, 0xf2b13d, 0x3dd9a4, 0xe8e4da, 0x8a4dd9, 0xd93d8a, 0x4dd0e1, 0x9ccc3c, 0xff7043];

function makeCarMesh(paint, kind) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: paint });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1c2a3a });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x22242a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, 4.5), bodyMat);
  body.position.y = 0.62; body.castShadow = true;
  car.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 1.1), bodyMat);
  hood.position.set(0, 0.78, 1.9); car.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.62, 2.1), glassMat);
  cabin.position.set(0, 1.2, -0.25); cabin.castShadow = true;
  car.add(cabin);
  if (kind === 'pickup') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 1.6), trimMat);
    bed.position.set(0, 0.95, -1.7); car.add(bed);
  }
  if (kind === 'police') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
    bar.position.set(0, 1.62, -0.25); bar.name = 'lightbar';
    car.add(bar);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.2, 4.54),
      new THREE.MeshLambertMaterial({ color: 0xf2f4f6 }));
    stripe.position.y = 0.44; car.add(stripe);
  }
  if (kind === 'gt') {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.5), trimMat);
    spoiler.position.set(0, 1.15, -2.2); car.add(spoiler);
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.9), trimMat);
    scoop.position.set(0, 0.98, 1.85); car.add(scoop);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x15161a });
  const wheels = [];
  for (const [wx, wz] of [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.42, wz);
    car.add(w); wheels.push(w);
  }
  const lightGeo = new THREE.BoxGeometry(0.42, 0.16, 0.06);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff5040 });
  for (const sx of [-0.62, 0.62]) {
    const hl = new THREE.Mesh(lightGeo, headMat); hl.position.set(sx, 0.68, 2.26); car.add(hl);
    const tl = new THREE.Mesh(lightGeo, tailMat); tl.position.set(sx, 0.68, -2.26); car.add(tl);
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
  let base = car.kind === 'gt' ? 52 : (car.kind === 'police' ? 47 : 42);
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
