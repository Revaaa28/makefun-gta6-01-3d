// Costa Serena — hud.js: everything the player reads. Money and respect, the clock
// and the wanted stars, the mission banner (name, Nadia's line, the live objective),
// the CSP RESPONSE panel with its named units and states, speed and vitals, and the
// street + district readout. One updateHud() call a frame keeps the DOM honest.

let hudTick = 0;

function updateBanner() {
  const banner = document.getElementById('banner');
  const prompt = missionPromptVisible();
  if (G.mission) {
    const m = G.mission, obj = m.def.objectives[m.step];
    banner.style.display = 'block';
    document.getElementById('mission-name').textContent = 'MISSION ' + (MISSION_DEFS.indexOf(m.def) + 1) + ' — ' + m.def.name;
    document.getElementById('mission-line').textContent = m.def.line;
    let objText = '▸ ' + obj.text;
    if (obj.kind === 'collect') objText += '  (' + m.collected + '/' + obj.points.length + ')';
    if (obj.kind === 'timed' && m.timer !== null) objText += '  — ' + Math.max(0, Math.ceil(m.timer)) + 's';
    if (obj.kind === 'holdPoint') objText += '  — hold ' + Math.max(0, Math.ceil(obj.seconds - m.holdFor)) + 's';
    if (obj.kind === 'loseHeat') objText += '  — stars: ' + G.wanted;
    document.getElementById('mission-obj').textContent = objText;
  } else if (prompt) {
    banner.style.display = 'block';
    document.getElementById('mission-name').textContent = 'NEXT JOB — ' + prompt.name;
    document.getElementById('mission-line').textContent = prompt.line;
    document.getElementById('mission-obj').textContent = '▸ Press E to take the job  ·  pays $' + prompt.reward + '  ·  +' + prompt.respect + ' respect';
  } else if (!nextMissionDef()) {
    banner.style.display = 'block';
    document.getElementById('mission-name').textContent = 'COSTA SERENA IS YOURS';
    document.getElementById('mission-line').textContent = 'Every job is done. The city, the garage and the Patrol remain.';
    document.getElementById('mission-obj').textContent = '▸ Free roam — steal, race the light, mind FALCON-1';
  } else {
    banner.style.display = 'none';
  }
}

function updateResponsePanel() {
  const panel = document.getElementById('response');
  if (G.wanted < 2 || (!G.police.length && !G.helicopter)) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  const rows = [];
  if (G.helicopter) {
    rows.push('<div class="unit"><span><b>' + G.helicopter.name + '</b></span><span class="st">' + G.helicopter.state + '</span></div>');
  }
  const sorted = G.police.slice().sort(function (a, b) {
    return distance2D(a.car.pos.x, a.car.pos.z, G.player.pos.x, G.player.pos.z) - distance2D(b.car.pos.x, b.car.pos.z, G.player.pos.x, G.player.pos.z);
  });
  for (const u of sorted.slice(0, 5)) {
    const d = Math.round(distance2D(u.car.pos.x, u.car.pos.z, G.player.pos.x, G.player.pos.z));
    rows.push('<div class="unit"><span><b>' + u.name + '</b> · ' + d + 'm</span><span class="st">' + u.state + '</span></div>');
  }
  document.getElementById('response-units').innerHTML = rows.join('');
}

function updateHud() {
  hudTick++;
  document.getElementById('money').textContent = '$' + G.money.toLocaleString('en-US');
  const lvl = respectLevel();
  document.getElementById('rep-level').textContent = lvl.name;
  const idx = CS.respectLevels.indexOf(lvl);
  const next = CS.respectLevels[idx + 1];
  const pct = next ? 100 * (G.respect - lvl.at) / (next.at - lvl.at) : 100;
  document.getElementById('repfill').style.width = clampValue(pct, 0, 100) + '%';
  const hh = Math.floor(G.clockMinutes / 60) % 24, mm = Math.floor(G.clockMinutes % 60);
  document.getElementById('clock').textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  const starsEl = document.getElementById('stars').children;
  for (let i = 0; i < 5; i++) starsEl[i].className = i < G.wanted ? 'lit' : '';
  const p = G.player;
  if (p) {
    document.getElementById('district').textContent = districtAt(p.pos.x, p.pos.z).name;
    document.getElementById('streetname').textContent = nearestStreetName(p.pos.x, p.pos.z);
  }
  const w = currentWeapon();
  const ammo = w.id === 'fists' ? '—' : '∞';
  document.getElementById('weapon').innerHTML = w.name + ' <span class="ammo">' + ammo + (weaponUnlocked(w) ? '' : ' · LOCKED') + '</span>';
  document.getElementById('healthfill').style.width = clampValue(G.health, 0, 100) + '%';
  document.getElementById('armourfill').style.width = clampValue(G.armour, 0, 100) + '%';
  const speedEl = document.getElementById('speed'), carEl = document.getElementById('carname');
  if (G.inCar) {
    speedEl.style.display = 'block'; carEl.style.display = 'block';
    speedEl.innerHTML = Math.abs(Math.round(G.inCar.speed * 3.6)) + ' <small>KM/H</small>';
    carEl.textContent = G.inCar.name + ' · hull ' + Math.max(0, Math.round(100 * G.inCar.health / carMaxHealth(G.inCar))) + '%';
  } else { speedEl.style.display = 'none'; carEl.style.display = 'none'; }
  if (G.time >= G.messageUntil) document.getElementById('toast').style.display = 'none';
  // the banner's live counters refresh a few times a second, not every frame
  if (hudTick % 12 === 0) { updateBanner(); updateResponsePanel(); }
  drawMinimap();
}
