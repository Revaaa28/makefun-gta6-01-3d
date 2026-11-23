// Costa Serena — minimap.js: the circular minimap, drawn from the same layout
// constants the city itself is built from — CS.avenuesX/Z for the road grid,
// CS.districts for the tinted quarters, CS.world for the coastline, CS.marina
// for the docks, CS.garage for the G. Nothing here is a decorative grid: every
// street, beach and dock finger on the map sits where it sits in the world,
// so the route line can run along real avenues to the objective. Police blips
// are range-limited (130 units, roughly line of gossip) unless Alba's Eyes Out
// is running — then every unit in the city shows, ringed in her colour.

function drawMinimap() {
  const cv = document.getElementById('minimap');
  if (!cv || !G.player) return;
  const g = cv.getContext('2d');
  const S = cv.width, C = S / 2, scale = S / 980;
  const wx = function (x) { return C + x * scale; };
  const wz = function (z) { return C + z * scale; };
  const W = CS.world;
  g.clearRect(0, 0, S, S);

  // --- terrain, from the world's own planes -----------------------------------
  // water first: the sea plane's near edge is the coastline
  const waterStartZ = W.waterZ - 20; // water plane: centre waterZ+190, 420 deep
  g.fillStyle = '#274b63'; g.fillRect(0, 0, S, S);
  // the city slab (ground plane spans x ±550, z -530..470; the sea covers it
  // from waterStartZ southward, so land is drawn only down to the waterline)
  g.fillStyle = '#57493a';
  g.fillRect(wx(-550), wz(-530), 1100 * scale, (waterStartZ + 530) * scale);
  // the beach: the sand plane runs z beachZ-28..beachZ+92, visible until the sea
  g.fillStyle = '#c9ae76';
  g.fillRect(wx(-550), wz(W.beachZ - 28), 1100 * scale, (waterStartZ - (W.beachZ - 28)) * scale);
  // the marina docks: wooden fingers into the water, from CS.marina itself
  g.fillStyle = '#7a6248';
  for (let i = 0; i < CS.marina.dockCount; i++) {
    const dx = CS.marina.dockX0 + i * CS.marina.dockStep;
    const dz = W.waterZ + CS.marina.dockZOff;
    g.fillRect(wx(dx - CS.marina.dockW / 2), wz(dz - CS.marina.dockL / 2), CS.marina.dockW * scale, CS.marina.dockL * scale);
  }

  // --- districts: subtle tint + our label style --------------------------------
  g.font = '700 15px Verdana'; g.textAlign = 'center';
  for (const d of CS.districts) {
    g.fillStyle = d.tint + '4D';
    g.fillRect(wx(d.x0), wz(d.z0), (d.x1 - d.x0) * scale, (d.z1 - d.z0) * scale);
    g.fillStyle = 'rgba(255,240,214,0.85)';
    g.fillText(d.short, wx((d.x0 + d.x1) / 2), wz((d.z0 + d.z1) / 2));
  }

  // --- the street network: every avenue at its true width -----------------------
  // road planes: avenuesX strips run z -460..420, avenuesZ strips run
  // x -470..470, each roadWidth wide over a roadWidth+7 sidewalk bed
  const rw = W.roadWidth;
  g.fillStyle = '#8a7c64';
  for (const ax of CS.avenuesX) g.fillRect(wx(ax - (rw + 7) / 2), wz(-460), (rw + 7) * scale, 880 * scale);
  for (const az of CS.avenuesZ) g.fillRect(wx(-470), wz(az - (rw + 7) / 2), 940 * scale, (rw + 7) * scale);
  g.fillStyle = '#43484f';
  for (const ax of CS.avenuesX) g.fillRect(wx(ax - rw / 2), wz(-460), rw * scale, 880 * scale);
  for (const az of CS.avenuesZ) g.fillRect(wx(-470), wz(az - rw / 2), 940 * scale, rw * scale);
  // centre dashes, like the merged yellow dashes on the real avenues
  g.strokeStyle = 'rgba(255,223,126,0.45)'; g.lineWidth = 1.6; g.setLineDash([6, 6]);
  for (const ax of CS.avenuesX) { g.beginPath(); g.moveTo(wx(ax), wz(-460)); g.lineTo(wx(ax), wz(420)); g.stroke(); }
  for (const az of CS.avenuesZ) { g.beginPath(); g.moveTo(wx(-470), wz(az)); g.lineTo(wx(470), wz(az)); g.stroke(); }
  g.setLineDash([]);

  const px = G.player.pos.x, pz = G.player.pos.z;
  // route: snap the player and the objective to the avenue grid, run the avenues.
  // With no job active the route runs to the next giver instead — a minimap with
  // a route on it reads as a game being played, not a map being shown
  let target = currentObjectiveTarget ? currentObjectiveTarget() : null;
  if (!target && typeof nextMissionDef === 'function') {
    const nextDef = nextMissionDef();
    if (nextDef) target = nextDef.giver;
  }
  if (target) {
    const snap = function (v, arr) { let b = arr[0]; for (const a of arr) if (Math.abs(a - v) < Math.abs(b - v)) b = a; return b; };
    const sx = snap(px, CS.avenuesX), sz = snap(pz, CS.avenuesZ);
    const tx = snap(target.x, CS.avenuesX), tz = snap(target.z, CS.avenuesZ);
    g.strokeStyle = '#ffd23d'; g.lineWidth = 4; g.setLineDash([9, 6]);
    g.beginPath();
    g.moveTo(wx(px), wz(pz));
    g.lineTo(wx(sx), wz(sz));
    g.lineTo(wx(tx), wz(sz));
    g.lineTo(wx(tx), wz(tz));
    g.lineTo(wx(target.x), wz(target.z));
    g.stroke(); g.setLineDash([]);
    // objective diamond
    g.fillStyle = '#ffd23d';
    g.save(); g.translate(wx(target.x), wz(target.z)); g.rotate(Math.PI / 4); g.fillRect(-7, -7, 14, 14); g.restore();
  }
  // garage + personal car
  g.fillStyle = '#ffb020';
  g.fillRect(wx(CS.garage.x) - 6, wz(CS.garage.z) - 6, 12, 12);
  g.fillStyle = '#10131a'; g.font = '700 11px Verdana'; g.fillText('G', wx(CS.garage.x), wz(CS.garage.z) + 4);
  if (G.personalCar && G.inCar !== G.personalCar) {
    g.fillStyle = '#ff5c8a';
    g.beginPath(); g.arc(wx(G.personalCar.pos.x), wz(G.personalCar.pos.z), 6, 0, 6.3); g.fill();
  }
  // police blips: nearby units flash blue/red; under Eyes Out every unit in
  // the city is drawn, the far ones ringed in Alba's violet
  const eyesOut = G.eyesOutUntil > G.time;
  const flash = Math.floor(G.time * 3) % 2 === 0;
  for (const u of G.police) {
    const d = distance2D(u.car.pos.x, u.car.pos.z, px, pz);
    if (!eyesOut && d >= 130) continue;
    if (eyesOut && d >= 130) {
      g.fillStyle = '#c792ff';
      g.beginPath(); g.arc(wx(u.car.pos.x), wz(u.car.pos.z), 6, 0, 6.3); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(wx(u.car.pos.x), wz(u.car.pos.z), 8, 0, 6.3); g.stroke();
    } else {
      g.fillStyle = flash ? '#3d7ad9' : '#ff5040';
      g.beginPath(); g.arc(wx(u.car.pos.x), wz(u.car.pos.z), 5.5, 0, 6.3); g.fill();
    }
  }
  if (G.helicopter) {
    const hp = G.helicopter.mesh.position;
    g.fillStyle = '#ff5040';
    g.beginPath(); g.arc(wx(hp.x), wz(hp.z), 5, 0, 6.3); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.4;
    g.beginPath(); g.arc(wx(hp.x), wz(hp.z), 7.5, 0, 6.3); g.stroke();
  }
  // mission giver (idle)
  if (!G.mission && typeof nextMissionDef === 'function') {
    const def = nextMissionDef();
    if (def) {
      g.fillStyle = '#3dd9a4';
      g.save(); g.translate(wx(def.giver.x), wz(def.giver.z)); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore();
    }
  }
  // player arrow
  g.save();
  g.translate(wx(px), wz(pz));
  g.rotate(-(G.inCar ? G.inCar.angle : G.player.angle) + Math.PI);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(0, -11); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.fill();
  g.restore();
  // rim shading
  const grad = g.createRadialGradient(C, C, S * 0.32, C, C, S * 0.5);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
}
