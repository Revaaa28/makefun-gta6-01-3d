// Costa Serena — traffic.js: the ambient traffic. Cars pick a lane on the avenue
// grid, drive it, brake for whatever is ahead and choose a new heading at each
// intersection. Traffic cars are stealable: the player entering one hands it over
// (see player.js), and the traffic system simply stops updating it.

function trafficLaneOffset() { return 5.6; }

// A traffic car travels along one avenue; dir is +1 or -1 along the axis, axis is
// 'x' (east-west road, constant z) or 'z' (north-south road, constant x).
function spawnTrafficCar(scene, rng) {
  const axis = rng() < 0.5 ? 'x' : 'z';
  const avenues = axis === 'x' ? CS.avenuesZ : CS.avenuesX;
  const fixed = avenues[Math.floor(rng() * avenues.length)];
  const dir = rng() < 0.5 ? 1 : -1;
  const off = trafficLaneOffset() * dir * (axis === 'x' ? -1 : 1);
  const along = -430 + rng() * 800;
  const x = axis === 'x' ? along : fixed + off;
  const z = axis === 'x' ? fixed + off : (along > 370 ? 300 : along);
  const angle = axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
  const paint = CAR_PAINTS[Math.floor(rng() * CAR_PAINTS.length)];
  const kindRoll = rng();
  const kind = kindRoll < 0.13 ? 'pickup' : (kindRoll < 0.25 ? 'van' : (kindRoll < 0.37 ? 'taxi' : 'car'));
  const car = spawnCar(scene, x, z, angle, kind === 'taxi' ? 0xf7c948 : paint, kind);
  car.traffic = { axis: axis, dir: dir, fixed: fixed, cruise: 11 + rng() * 7, turnCooldown: 0 };
  return car;
}

function buildTraffic(scene) {
  const rng = seededRandom(G.seed * 7 + 21);
  for (let i = 0; i < 26; i++) G.traffic.push(spawnTrafficCar(scene, rng));
}

function trafficCarAhead(car, dist) {
  const fx = Math.sin(car.angle), fz = Math.cos(car.angle);
  const all = G.traffic.concat(G.police.map(function (p) { return p.car; }));
  if (G.inCar) all.push(G.inCar);
  for (const other of all) {
    if (other === car || other.dead) continue;
    const dx = other.pos.x - car.pos.x, dz = other.pos.z - car.pos.z;
    const ahead = dx * fx + dz * fz;
    const side = Math.abs(dx * fz - dz * fx);
    if (ahead > 0 && ahead < dist && side < 2.6) return other;
  }
  // the player on foot counts as an obstacle too — traffic brakes for people
  if (!G.inCar && G.player) {
    const dx = G.player.pos.x - car.pos.x, dz = G.player.pos.z - car.pos.z;
    const ahead = dx * fx + dz * fz;
    const side = Math.abs(dx * fz - dz * fx);
    if (ahead > 0 && ahead < dist + 2 && side < 2.4) return G.player;
  }
  return null;
}

function updateTraffic(dt) {
  for (const car of G.traffic) {
    if (car === G.inCar || car.dead || !car.traffic) continue;
    const t = car.traffic;
    t.turnCooldown -= dt;
    const blocker = trafficCarAhead(car, 11);
    const target = blocker ? 0 : t.cruise;
    car.speed += clampValue(target - car.speed, -26 * dt * 3, 9 * dt * 3) * 0.6;
    const fx = Math.sin(car.angle), fz = Math.cos(car.angle);
    car.pos.x += fx * car.speed * dt;
    car.pos.z += fz * car.speed * dt;
    // near an intersection on the cross axis, maybe turn onto it
    const crossAvenues = t.axis === 'x' ? CS.avenuesX : CS.avenuesZ;
    const along = t.axis === 'x' ? car.pos.x : car.pos.z;
    for (const ca of crossAvenues) {
      if (Math.abs(along - ca) < 3.2 && t.turnCooldown <= 0 && Math.abs(car.speed) > 2) {
        t.turnCooldown = 2.5;
        if (Math.random() < 0.45) {
          const newDir = Math.random() < 0.5 ? 1 : -1;
          const fixedNow = t.axis === 'x' ? car.pos.z : car.pos.x;
          const offNow = trafficLaneOffset();
          if (t.axis === 'x') {
            car.pos.x = ca + offNow * newDir;
            car.angle = newDir > 0 ? 0 : Math.PI;
            t.axis = 'z'; t.dir = newDir; t.fixed = ca;
          } else {
            car.pos.z = ca - offNow * newDir;
            car.angle = newDir > 0 ? Math.PI / 2 : -Math.PI / 2;
            t.axis = 'x'; t.dir = newDir; t.fixed = ca;
          }
          void fixedNow;
        }
        break;
      }
    }
    // despawn at the world edge and respawn on the far side, so the city never empties
    if (Math.abs(car.pos.x) > 445 || car.pos.z > 420 || car.pos.z < -445) {
      const fresh = spawnTrafficCar(G.scene3, Math.random);
      car.pos.copy(fresh.pos); car.angle = fresh.angle; car.traffic = fresh.traffic;
      G.scene3.remove(fresh.mesh);
    }
    car.mesh.position.copy(car.pos);
    car.mesh.rotation.y = car.angle;
    const spin = car.speed * dt / 0.42;
    for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
  }
}
