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
    rows.push('<div class="unit"><span><b>' + G.helicopter.name + '</b></span><span class="role air">AIR SUPPORT</span></div>');
  }
  const sorted = G.police.slice().sort(function (a, b) {
    return distance2D(a.car.pos.x, a.car.pos.z, G.player.pos.x, G.player.pos.z) - distance2D(b.car.pos.x, b.car.pos.z, G.player.pos.x, G.player.pos.z);
  });
  for (const u of sorted.slice(0, 5)) {
    const d = Math.round(distance2D(u.car.pos.x, u.car.pos.z, G.player.pos.x, G.player.pos.z));
    const role = unitRole(u);
    rows.push('<div class="unit"><span><b>' + u.name + '</b> · ' + d + 'm</span><span class="role">' + role + '</span></div>');
  }
  document.getElementById('response-units').innerHTML = rows.join('');
}

// --- weapon slots ---------------------------------------------------------------
// simple silhouettes, drawn once as inline SVG so they stay crisp at slot size
const WEAPON_GLYPHS = {
  fists: '<svg viewBox="0 0 24 24"><circle cx="6.5" cy="9" r="2.7"/><circle cx="11.5" cy="7.4" r="2.8"/><circle cx="16.5" cy="8.2" r="2.7"/><path d="M4.5 11.5h15V15c0 3.6-3.2 6-7.5 6s-7.5-2.4-7.5-6z"/></svg>',
  pistol: '<svg viewBox="0 0 24 24"><path d="M2 6.5h13.5v4.2H9.2L8 17.5H4.4l1.1-6.8H2z"/><rect x="15.5" y="7.4" width="6.5" height="2.3"/></svg>',
  smg: '<svg viewBox="0 0 24 24"><path d="M4 7.5h13v3.6h-3.4l-.9 5.4h-3l.8-5.4H7.8l-.7 3.4H4.2l.6-3.4H4z"/><rect x="17" y="8.3" width="6" height="2.1"/><rect x="0.8" y="7.9" width="3.2" height="2.8"/></svg>',
  shotgun: '<svg viewBox="0 0 24 24"><rect x="4.5" y="8.6" width="15" height="2.3"/><rect x="8" y="10.9" width="6" height="1.9" rx="0.9"/><path d="M19.5 8.6H23v2.3h-3.5z"/><path d="M0.8 7.8h3.7v4.6l-2.2 2.8H0.8z"/></svg>'
};
let weaponSlotsHtml = '';

function updateWeaponSlots() {
  let html = '';
  for (let i = 0; i < CS.weapons.length; i++) {
    const w = CS.weapons[i];
    const unlocked = weaponUnlocked(w);
    const cls = 'wslot' + (i === G.weaponIndex ? ' active' : '') + (unlocked ? '' : ' locked');
    const ammo = w.id === 'fists' ? '—' : '∞';
    html += '<div class="' + cls + '"><span class="wnum">' + w.slot + '</span>' +
      '<span class="wglyph">' + WEAPON_GLYPHS[w.id] + '</span>' +
      '<span class="wammo">' + (unlocked ? ammo : 'LOCK') + '</span></div>';
  }
  if (html !== weaponSlotsHtml) {
    weaponSlotsHtml = html;
    document.getElementById('weaponslots').innerHTML = html;
  }
  const w = currentWeapon();
  document.getElementById('weaponname').textContent = w.name + (weaponUnlocked(w) ? '' : ' · LOCKED');
}

// --- crew cards -------------------------------------------------------------------
let crewCardsBuilt = false;

function buildCrewCards() {
  const wrap = document.getElementById('crew');
  let html = '';
  for (const m of CREW_DEFS) {
    html += '<div class="crew-card" id="crew-' + m.id + '" style="--cc:' + m.color + '">' +
      '<div class="crew-port">' + m.name.charAt(0) + '</div>' +
      '<div class="crew-info"><div class="crew-ability">' + m.ability + '</div>' +
      '<div class="crew-name">' + m.name + ' · ' + m.role + '</div></div>' +
      '<div class="crew-key">' + m.keyLabel + '</div>' +
      '<div class="crew-cd"></div><div class="crew-cdtext"></div></div>';
  }
  wrap.innerHTML = html;
  crewCardsBuilt = true;
}

function updateCrewPanel() {
  if (!crewCardsBuilt) buildCrewCards();
  for (const m of CREW_DEFS) {
    const card = document.getElementById('crew-' + m.id);
    if (!card) continue;
    const left = crewReadyIn(m.id);
    const cd = card.querySelector('.crew-cd');
    const txt = card.querySelector('.crew-cdtext');
    if (left > 0) {
      card.classList.add('cooling');
      cd.style.height = clampValue(100 * left / m.cooldown, 0, 100) + '%';
      txt.textContent = Math.ceil(left) + 's';
    } else {
      card.classList.remove('cooling');
      cd.style.height = '0%';
      txt.textContent = (m.id === 'eyes' && G.eyesOutUntil > G.time) ? Math.ceil(G.eyesOutUntil - G.time) + 's LIVE' : '';
    }
  }
}

// --- dialogue strip -----------------------------------------------------------------
function showDialogueStrip(speaker, text, seconds) {
  G.dialogue = { speaker: speaker, text: text, until: G.time + (seconds || 5) };
  const el = document.getElementById('dialogue');
  document.getElementById('dlg-port').textContent = speaker.charAt(0);
  document.getElementById('dlg-name').textContent = speaker;
  document.getElementById('dlg-line').textContent = text;
  el.style.display = 'flex';
}

function dialogueFromLine(line) {
  // mission lines are written as  Nadia: "the words"  — split them for the strip
  const m = /^([^:]+):\s*"([\s\S]*)"$/.exec(line || '');
  if (m) return { speaker: m[1].toUpperCase(), text: m[2] };
  return { speaker: 'NADIA', text: line || '' };
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
  if (p) document.getElementById('standing').textContent =
    districtAt(p.pos.x, p.pos.z).short + ' · ' + lvl.name + ' ' + Math.round(clampValue(pct, 0, 100)) + '%';
  document.getElementById('healthfill').style.width = clampValue(G.health, 0, 100) + '%';
  document.getElementById('armourfill').style.width = clampValue(G.armour, 0, 100) + '%';
  const speedEl = document.getElementById('speed'), carEl = document.getElementById('carname');
  if (G.inCar) {
    speedEl.style.display = 'block'; carEl.style.display = 'block';
    speedEl.innerHTML = Math.abs(Math.round(G.inCar.speed * 3.6)) + ' <small>KM/H</small>';
    carEl.textContent = G.inCar.name + ' · hull ' + Math.max(0, Math.round(100 * G.inCar.health / carMaxHealth(G.inCar))) + '%';
  } else { speedEl.style.display = 'none'; carEl.style.display = 'none'; }
  if (G.time >= G.messageUntil) document.getElementById('toast').style.display = 'none';
  if (G.dialogue && G.time >= G.dialogue.until) {
    G.dialogue = null;
    document.getElementById('dialogue').style.display = 'none';
  }
  // the banner's live counters refresh a few times a second, not every frame
  if (hudTick % 12 === 0) { updateBanner(); updateResponsePanel(); }
  if (hudTick % 6 === 0) { updateWeaponSlots(); updateCrewPanel(); }
  drawMinimap();
}
