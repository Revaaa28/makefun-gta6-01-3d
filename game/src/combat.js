// Costa Serena — combat.js: the weapon locker in action. Fists swing, guns are
// hitscan with tracer lines and a muzzle flash, and every shot fired in sight of
// the city is a crime the patrol answers. Police fire back through the same
// fireHitscan door, so a gunfight is one system, not two.

let fireCooldown = 0;

function currentWeapon() { return CS.weapons[G.weaponIndex]; }

function weaponUnlocked(w) { return G.respect >= w.unlockRespect; }

function selectWeapon(index) {
  const w = CS.weapons[index];
  if (!w) return;
  if (!weaponUnlocked(w)) { showToast(w.name + ' unlocks at respect ' + w.unlockRespect, 2); return; }
  G.weaponIndex = index;
  playSfx('click');
}

function fireHitscan(fromPos, fromHeight, toPos, toHeight, damage, tracerColor) {
  // a tracer that lives for a blink — the only "bullet" a hitscan game needs
  const start = new THREE.Vector3(fromPos.x, fromHeight, fromPos.z);
  const end = new THREE.Vector3(toPos.x + (Math.random() - 0.5) * 1.4, toHeight, toPos.z + (Math.random() - 0.5) * 1.4);
  const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: tracerColor || 0xffe9a8, transparent: true, opacity: 0.9 }));
  G.scene3.add(line);
  G.bullets.push({ line: line, until: G.time + 0.07 });
}

function playerShoot(dt) {
  fireCooldown -= dt;
  const w = currentWeapon();
  const wantFire = mouseDown || (w.id === 'fists' && keysDown['KeyF']);
  if (!wantFire || fireCooldown > 0 || G.inCar || G.down || G.paused) return;
  fireCooldown = w.rate;
  const p = G.player;
  // face the camera's aim while shooting
  p.angle = angleLerp(p.angle, p.camYaw + Math.PI, 0.9);
  p.mesh.rotation.y = p.angle;
  playSfx(w.id === 'fists' ? 'swing' : 'shot');
  if (w.id !== 'fists') {
    commitCrime(9);
    muzzleFlash(p.pos, p.angle);
  } else {
    commitCrime(4);
  }
  // aim: from the camera through the crosshair, fall back to the player's facing
  const origin = new THREE.Vector3(p.pos.x, 1.45, p.pos.z);
  const dir = new THREE.Vector3();
  G.camera.getWorldDirection(dir);
  let bestTarget = null, bestDist = w.range;
  const candidates = [];
  for (const ped of G.peds) if (!ped.dead) candidates.push({ obj: ped, pos: ped.pos, h: 1.1, kind: 'ped' });
  for (const off of G.officers) if (!off.dead) candidates.push({ obj: off, pos: off.pos, h: 1.1, kind: 'officer' });
  for (const car of G.traffic) if (!car.dead) candidates.push({ obj: car, pos: car.pos, h: 0.8, kind: 'car' });
  for (const u of G.police) if (!u.car.dead && u.car !== G.inCar) candidates.push({ obj: u.car, pos: u.car.pos, h: 0.8, kind: 'car' });
  for (let pellet = 0; pellet < w.pellets; pellet++) {
    const pdir = dir.clone();
    pdir.x += (Math.random() - 0.5) * w.spread * 2;
    pdir.y += (Math.random() - 0.5) * w.spread;
    pdir.z += (Math.random() - 0.5) * w.spread * 2;
    pdir.normalize();
    bestTarget = null; bestDist = w.range;
    for (const c of candidates) {
      const to = new THREE.Vector3(c.pos.x - origin.x, c.h - origin.y + 1.45 - 1.45, c.pos.z - origin.z);
      to.y = (c.h + 0.4) - origin.y;
      const t = to.dot(pdir);
      if (t < 0 || t > bestDist) continue;
      const closest = origin.clone().add(pdir.clone().multiplyScalar(t));
      const miss = Math.sqrt(Math.pow(closest.x - c.pos.x, 2) + Math.pow(closest.z - c.pos.z, 2));
      const radius = c.kind === 'car' ? 2.6 : 0.75;
      if (miss < radius) { bestTarget = c; bestDist = t; }
    }
    if (w.id !== 'fists') {
      const endPos = bestTarget ? bestTarget.pos : { x: origin.x + pdir.x * w.range, z: origin.z + pdir.z * w.range };
      fireHitscan(p.pos, 1.45, endPos, bestTarget ? bestTarget.h : 1.2, w.damage, 0xffe9a8);
    }
    if (bestTarget) {
      if (bestTarget.kind === 'ped') { hurtPedestrian(bestTarget.obj, w.damage); commitCrime(w.id === 'fists' ? 6 : 16); }
      else if (bestTarget.kind === 'officer') { hurtOfficer(bestTarget.obj, w.damage); commitCrime(22); }
      else if (bestTarget.kind === 'car') { damageCar(bestTarget.obj, w.damage, 8); }
    }
  }
  // nearby peds panic at gunfire even when nothing is hit
  if (w.id !== 'fists') for (const ped of G.peds) if (distance2D(ped.pos.x, ped.pos.z, p.pos.x, p.pos.z) < 30) ped.panicUntil = G.time + 5;
}

function muzzleFlash(pos, angle) {
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0xffd23d, transparent: true, opacity: 0.95 }));
  flash.position.set(pos.x + Math.sin(angle) * 0.7, 1.45, pos.z + Math.cos(angle) * 0.7);
  G.scene3.add(flash);
  G.bullets.push({ line: flash, until: G.time + 0.05, isMesh: true });
}

function hurtOfficer(off, amount) {
  if (off.dead) return;
  off.health -= amount;
  if (off.health <= 0) {
    off.dead = true;
    off.mesh.rotation.x = -Math.PI / 2;
    off.mesh.position.y = 0.25;
    G.kills++;
  }
}

function updateBullets() {
  for (let i = G.bullets.length - 1; i >= 0; i--) {
    const b = G.bullets[i];
    if (G.time >= b.until) {
      G.scene3.remove(b.line);
      if (b.line.geometry) b.line.geometry.dispose();
      G.bullets.splice(i, 1);
    } else if (b.line.material) {
      b.line.material.opacity = Math.max(0, (b.until - G.time) / 0.07);
    }
  }
}

function bindCombatInput() {
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Digit1') selectWeapon(0);
    if (e.code === 'Digit2') selectWeapon(1);
    if (e.code === 'Digit3') selectWeapon(2);
    if (e.code === 'Digit4') selectWeapon(3);
    if (e.code === 'KeyR') cycleRadio();
  });
}
