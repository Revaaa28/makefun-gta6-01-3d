// Costa Serena — main.js: boots the game and runs the loop. Builds the renderer,
// the city, the cast and the systems in dependency order, wires the start screen,
// and steps every system once a frame: player, traffic, pedestrians, the patrol,
// combat, missions, water and the HUD. In ?scene= mode it stages a screenshot
// scene instead of the start screen and holds the pose for the camera.

function bootCostaSerena() {
  const params = new URLSearchParams(window.location.search);
  const sceneName = params.get('scene');
  if (params.get('seed')) G.seed = parseInt(params.get('seed'), 10) || 7;

  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  G.renderer = renderer;

  const scene = new THREE.Scene();
  G.scene3 = scene;
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1600);
  camera.position.set(0, 4, -10);
  G.camera = camera;

  buildCostaSerenaCity(scene);
  spawnPlayer(scene, 6, 268);
  buildTraffic(scene);
  buildPedestrians(scene);
  buildCrewCards();
  updateWeaponSlots();
  bindPlayerInput(canvas);
  bindCombatInput();
  bindGarageInput();
  bindCrewInput();

  const save = loadSaveData();
  if (save) document.getElementById('continue-btn').style.display = 'inline-block';

  document.getElementById('play-btn').addEventListener('click', function () { startGame(false); });
  document.getElementById('continue-btn').addEventListener('click', function () { startGame(true); });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  if (sceneName) stageScene(sceneName);
  requestAnimationFrame(gameLoop);
}

function startGame(withSave) {
  ensureAudio();
  if (withSave) applySaveData(loadSaveData());
  G.started = true;
  document.getElementById('start-screen').style.display = 'none';
  setRadio(true);
  showToast(withSave ? 'Welcome back to Costa Serena' : 'Costa Serena — Nadia is waiting in Centro', 3.6);
  updateBanner();
}

let lastFrameAt = 0, sceneFrames = 0;

function gameLoop(nowMs) {
  requestAnimationFrame(gameLoop);
  const now = nowMs / 1000;
  let dt = Math.min(0.05, now - (lastFrameAt || now));
  lastFrameAt = now;
  if (G.paused || G.down) { G.renderer.render(G.scene3, G.camera); return; }
  G.time += dt;
  G.clockMinutes += dt * 0.55;
  if (G.clockMinutes > 19 * 60 + 40) G.clockMinutes = 17 * 60 + 30;

  // the water breathes and the boats ride it, in play and in staged scenes alike
  if (G.waterMesh) {
    const posAttr = G.waterMesh.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      posAttr.setZ(i, Math.sin(G.time * 1.3 + i * 0.7) * 0.22);
    }
    posAttr.needsUpdate = true;
    if (G.foamMesh) { // the foam line breathes against the sand
      G.foamMesh.material.opacity = 0.36 + Math.sin(G.time * 0.9) * 0.16;
      G.foamMesh.position.z = CS.world.waterZ - 3 + Math.sin(G.time * 0.55) * 1.1;
    }
    if (G.boats) for (let i = 0; i < G.boats.length; i++) {
      G.boats[i].position.y = 0.5 + Math.sin(G.time * 1.1 + i * 1.7) * 0.14;
      G.boats[i].rotation.z = Math.sin(G.time * 0.9 + i) * 0.02;
    }
  }
  // the palm crowns sway in the sea breeze — a few degrees of group rotation
  // on the crown only, so the trees feel planted but alive
  if (G.palmCrowns) for (let i = 0; i < G.palmCrowns.length; i++) {
    const pc = G.palmCrowns[i];
    pc.g.rotation.z = Math.sin(G.time * 0.9 + pc.p) * 0.045;
    pc.g.rotation.x = Math.cos(G.time * 0.73 + pc.p * 1.3) * 0.03;
  }

  if (G.scene) {
    // staged screenshot: hold the pose, let peds stroll and the light sit still.
    // scenes.js may set G.sceneCam {dist, height} to compose its frame; the
    // defaults are the old framing
    const sc = G.sceneCam || {};
    updatePedestrians(dt * 0.4);
    if (G.inCar) updateChaseCamera(dt, G.inCar.pos, G.inCar.angle, sc.dist || 12, sc.height != null ? sc.height : 2.4);
    else if (G.player) updateChaseCamera(dt, G.player.pos, G.player.camYaw, sc.dist || 8.5, sc.height != null ? sc.height : 2.4 + G.player.camPitch * 4.2);
    if (G.helicopter) G.helicopter.rotor.rotation.y += dt * 26;
    updateHud();
    G.renderer.render(G.scene3, G.camera);
    sceneFrames++;
    if (sceneFrames > 40) window.__CS_READY = true;
    return;
  }

  if (G.started) {
    updatePlayer(dt);
    updateTraffic(dt);
    updatePedestrians(dt);
    updateWanted(dt);
    playerShoot(dt);
    updateBullets();
    updateMissions(dt);
    // entering cars rides the E key too; updateMissions already had its chance at
    // the same keypress (it consumes E when a job starts), so this only fires for cars
    if (!G.inCar && keysDown['KeyE']) {
      const car = nearestCarToPlayer(3.6);
      if (car) { keysDown['KeyE'] = false; enterCar(car); }
    }
    // sirens breathe near the player when the patrol is close
    if (G.wanted > 0 && Math.floor(G.time * 2) !== Math.floor((G.time - dt) * 2)) playSfx('siren');
  }
  updateHud();
  G.renderer.render(G.scene3, G.camera);
}

// Boot once the vendored fonts land (or a timeout passes): the facade canvases
// and the minimap draw with Bungee/Rubik, and a texture baked in a fallback
// font would keep the wrong letterforms for the whole session.
let csBooted = false;
function bootCostaSerenaOnce() { if (!csBooted) { csBooted = true; bootCostaSerena(); } }
window.addEventListener('DOMContentLoaded', function () {
  if (document.fonts && document.fonts.load) {
    const loads = Promise.all([
      document.fonts.load('16px Bungee'),
      document.fonts.load('400 16px Rubik'),
      document.fonts.load('700 16px Rubik')
    ]);
    const timeout = new Promise(function (res) { setTimeout(res, 1500); });
    Promise.race([loads, timeout]).then(bootCostaSerenaOnce, bootCostaSerenaOnce);
    setTimeout(bootCostaSerenaOnce, 2500); // absolute fallback
  } else {
    bootCostaSerenaOnce();
  }
});
