// Costa Serena — minimap.js: the circular minimap. The avenue grid and the seven
// district names are drawn every frame on a 2D canvas, with a Manhattan route line
// along the avenues to the mission objective, blips for the patrol, the garage and
// the player's own car, and the player as a white arrow at the centre. North-up,
// world scaled to fit, the way the top entries in this bounty draw theirs.

function drawMinimap() {
  const cv = document.getElementById('minimap');
  if (!cv || !G.player) return;
  const g = cv.getContext('2d');
  const S = cv.width, C = S / 2, scale = S / 980;
  g.clearRect(0, 0, S, S);
  // sea and land
  g.fillStyle = '#274b63'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#4c4438'; g.fillRect(C - 450 * scale, C - 450 * scale, 900 * scale, 880 * scale);
  const wx = function (x) { return C + x * scale; };
  const wz = function (z) { return C + z * scale; };
  // beach
  g.fillStyle = '#c9ae76'; g.fillRect(0, wz(CS.world.beachZ), S, (CS.world.waterZ - CS.world.beachZ) * scale + 4);
  // districts tint + labels
  g.font = '700 15px Verdana'; g.textAlign = 'center';
  for (const d of CS.districts) {
    g.fillStyle = d.tint + '55';
    g.fillRect(wx(d.x0), wz(d.z0), (d.x1 - d.x0) * scale, (d.z1 - d.z0) * scale);
    g.fillStyle = 'rgba(255,240,214,0.85)';
    g.fillText(d.short, wx((d.x0 + d.x1) / 2), wz((d.z0 + d.z1) / 2));
  }
  // avenues
  g.strokeStyle = 'rgba(230,225,210,0.55)'; g.lineWidth = 5;
  for (const ax of CS.avenuesX) { g.beginPath(); g.moveTo(wx(ax), wz(-450)); g.lineTo(wx(ax), wz(420)); g.stroke(); }
  for (const az of CS.avenuesZ) { g.beginPath(); g.moveTo(wx(-450), wz(az)); g.lineTo(wx(450), wz(az)); g.stroke(); }

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
  // police blips flash blue/red
  const flash = Math.floor(G.time * 3) % 2 === 0;
  for (const u of G.police) {
    g.fillStyle = flash ? '#3d7ad9' : '#ff5040';
    g.beginPath(); g.arc(wx(u.car.pos.x), wz(u.car.pos.z), 5.5, 0, 6.3); g.fill();
  }
  if (G.helicopter) {
    g.fillStyle = '#ff5040';
    g.beginPath(); g.arc(wx(G.player.pos.x + 14), wz(G.player.pos.z - 14), 5, 0, 6.3); g.fill();
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
