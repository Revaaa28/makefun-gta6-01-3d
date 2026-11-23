// Costa Serena — scenes.js: deterministic staging for the four screenshots.
// ?scene=cover|chase|mission|marina&seed=1 poses the real game — real player,
// real traffic, real patrol — in a composed moment, hides the start screen and
// freezes the cast mid-action, so each screenshot is the game's own render of
// a living scene, never a menu and never an edit. The composition rules come
// from the shots that win this bounty: the cover is the big one — bright day,
// a pursuit on the palm boulevard beside the beach, the hero car large, the
// helicopter centred overhead and every HUD system on show at once. The other
// three stay in the golden hour, so the set carries four moods: day pursuit,
// dusk chase, neon mission, marina evening. window.__CS_READY flips true once
// the staged frame has rendered, which is what the screenshot harness waits for.

function stageCrowd(x, z, n, spreadZ) {
  const rng = seededRandom(G.seed * 3 + n * 17 + Math.floor(x));
  for (let i = 0; i < n; i++) {
    const ped = spawnPedestrian(G.scene3, rng, x + (rng() - 0.5) * 30, z + (rng() - 0.5) * (spreadZ || 26));
    G.peds.push(ped);
  }
}

function stageCyclist(x, z, angle) {
  // a resident on a bicycle, built from two torus wheels and a parts-bin frame
  // with a real pedestrian mesh seated on it — the beachfront promenade has
  // one in every living frame of this city
  const grp = new THREE.Group();
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xd94f3d });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1c1e22 });
  const wheelGeo = new THREE.TorusGeometry(0.34, 0.045, 6, 14);
  for (const dz of [-0.52, 0.52]) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(0, 0.34, dz); w.castShadow = true; grp.add(w);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1.05), frameMat);
  bar.position.set(0, 0.6, 0); bar.rotation.x = 0.28; grp.add(bar);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.07), frameMat);
  post.position.set(0, 0.7, -0.44); post.rotation.x = -0.2; grp.add(post);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.3), darkMat);
  seat.position.set(0, 0.97, -0.48); grp.add(seat);
  const bars = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.08), darkMat);
  bars.position.set(0, 1.04, 0.52); grp.add(bars);
  const rider = makePedestrianMesh(seededRandom(99));
  rider.position.set(0, 0.18, -0.42);
  rider.userData.legL.rotation.x = -1.15;
  rider.userData.legR.rotation.x = -0.45;
  rider.userData.armL.rotation.x = -0.72;
  rider.userData.armR.rotation.x = -0.72;
  grp.add(rider);
  grp.position.set(x, 0, z);
  grp.rotation.y = angle;
  G.scene3.add(grp);
  return grp;
}

function hidePalmsNear(x, z, r) {
  // Screenshot composition only: a palm whose trunk stands within r of the
  // camera would fill the frame with a brown pole, so staged scenes hide the
  // one or two crowns in the lens. Play mode never calls this — the palms are
  // all still there in the game.
  if (!G.palmCrowns) return;
  for (const pc of G.palmCrowns) {
    const palm = pc.g.parent;
    if (!palm) continue;
    const dx = palm.position.x - x, dz = palm.position.z - z;
    if (dx * dx + dz * dz < r * r) {
      palm.visible = false;
      // the palm's string lights live in one city-wide Points cloud, not in
      // the palm group — sink this tree's bulbs below the world with it, or
      // they would hang in the air where the trunk stood
      if (pc.slStart !== undefined && G.stringGeo) {
        const attr = G.stringGeo.attributes.position;
        for (let i = pc.slStart; i < pc.slStart + pc.slCount; i++) attr.setY(i, -100);
        attr.needsUpdate = true;
      }
    }
  }
}

function showSceneRadio() {
  const st = CS.radioStations[G.radioIndex];
  const el = document.getElementById('radio');
  el.textContent = '♪ ' + st.name + ' — ' + st.tag;
  el.style.display = 'block';
}

function stageScene(name) {
  G.scene = name;
  G.started = true;
  document.getElementById('start-screen').style.display = 'none';
  const p = G.player;
  G.money = 1250; G.respect = 340;

  if (name === 'cover') {
    // THE COVER — bright day on Paseo del Puerto, the Marina strand road.
    // The Serena GT runs east in the shore lane with the beach on its right,
    // five CSP interceptors in pursuit formation behind and alongside, and
    // FALCON-1 centred in the sky overhead. Four stars, the SUNSET RUN banner
    // up, Nadia's briefing in the dialogue strip, the crew cards live, the
    // response panel full of roles — one frame, every system the game has.
    setDaylight(true);
    G.clockMinutes = 11 * 60 + 24;
    G.money = 8450; G.respect = 620;
    const gt = spawnCar(G.scene3, 150, 365.6, Math.PI / 2, 0xd92632, 'gt', 'Serena GT');
    gt.engineLevel = 2; gt.speed = 34;
    G.inCar = gt; G.currentCar = gt; G.personalCar = gt;
    p.mesh.visible = false;
    p.pos.copy(gt.pos); p.angle = gt.angle; p.camYaw = Math.PI / 2; p.camPitch = 0.16;
    G.sceneCam = { dist: 10.5, height: 1.7 };
    commitCrime(380);
    G.wanted = 4;
    // the formation is composed for the chase camera at the GT's tail (the
    // camera rides ~10.5 behind the GT, ~2.6 up): every unit sits at least 9
    // units ahead of the camera and inside its cone — two flanking the GT in
    // the eastbound lanes, two closing ahead, one on the shoulder. Nothing
    // hugs the frame edge and nothing looms cropped over the lens.
    const formation = [
      [150, 357.8, 34], [147, 371.0, 34], [158, 371.2, 32], [164, 365.6, 31], [172, 354.4, 30]
    ];
    for (const [ux, uz, us] of formation) {
      const u = spawnPoliceCar(G.scene3, ux, uz);
      u.car.angle = Math.PI / 2; u.car.mesh.rotation.y = Math.PI / 2;
      u.car.speed = us; u.state = 'PURSUIT';
    }
    spawnHelicopter(G.scene3);
    G.helicopter.mesh.position.set(186, 12, 361);
    G.helicopter.mesh.rotation.y = -1.9;
    G.helicopter.cone.visible = false; // no beam in bright daylight
    if (G.helicopter.pool) G.helicopter.pool.visible = false;
    parkSceneCars([
      [228, 365.6, Math.PI / 2, 0xf2f0e6], [252, 354.4, -Math.PI / 2, 0x3d7ad9],
      [94, 354.4, -Math.PI / 2, 0xf2b13d], [282, 365.6, Math.PI / 2, 0x3dd9a4]
    ]);
    stageCyclist(163, 377.5, Math.PI / 2);
    stageCrowd(152, 394, 5);
    stageCrowd(176, 397, 6, 18);
    stageCrowd(118, 402, 4, 12);
    stageCrowd(206, 383, 3, 12);
    const def = MISSION_DEFS[3];
    G.mission = { def: def, step: 0, collected: 0, timer: 71, holdFor: 0, startedAt: 0 };
    G.markers.push(makeMarker(def.objectives[0].at.x, def.objectives[0].at.z, 0xffd23d));
    const dlg = dialogueFromLine(def.line);
    showDialogueStrip(dlg.speaker, dlg.text, 9999);
    showSceneRadio();
    updateBanner(); updateResponsePanel();
  }

  if (name === 'chase') {
    // Full pursuit on Avenida del Sol at the golden hour: the camera rides low
    // and close behind the Serena GT, a striped roadblock with its spike strip
    // and cones fills the mid-frame, interceptors crowd in behind and
    // alongside, and FALCON-1 hangs centred overhead with its beam pooled on
    // the car. Four stars, RESPONSE panel full of roles.
    const car = spawnCar(G.scene3, 42, 5.6, Math.PI / 2, 0xd92632, 'gt', 'Serena GT');
    car.engineLevel = 2; car.speed = 34;
    G.inCar = car; G.currentCar = car; G.personalCar = car;
    p.mesh.visible = false;
    p.pos.copy(car.pos); p.angle = car.angle; p.camYaw = Math.PI / 2; p.camPitch = 0.16;
    G.sceneCam = { dist: 10.5, height: 1.7 };
    commitCrime(390);
    G.wanted = 4;
    const u1 = spawnPoliceCar(G.scene3, 27, 1.2);
    u1.car.angle = Math.PI / 2; u1.car.mesh.rotation.y = Math.PI / 2; u1.car.speed = 31; u1.state = 'PURSUIT';
    const u2 = spawnPoliceCar(G.scene3, 38, -4.6);
    u2.car.angle = Math.PI / 2; u2.car.mesh.rotation.y = Math.PI / 2; u2.car.speed = 33; u2.state = 'PURSUIT';
    const u3 = spawnPoliceCar(G.scene3, 20, 10.5);
    u3.car.angle = Math.PI / 2; u3.car.mesh.rotation.y = Math.PI / 2; u3.car.speed = 29; u3.state = 'EN ROUTE';
    const u4 = spawnPoliceCar(G.scene3, 44, 10.8);
    u4.car.angle = Math.PI / 2; u4.car.mesh.rotation.y = Math.PI / 2; u4.car.speed = 30; u4.state = 'PURSUIT';
    G.roadblock = spawnRoadblock(G.scene3, 68, 5.6, Math.PI / 2);
    spawnHelicopter(G.scene3);
    G.helicopter.mesh.position.set(70, 12, 6);
    G.helicopter.mesh.rotation.y = -2.4;
    G.helicopter.spot.target.position.set(-21, -13.5, -0.9);
    if (G.helicopter.pool) G.helicopter.pool.position.set(42, 0.24, 5.6);
    aimSearchlight();
    parkSceneCars([[112, -5.6, -Math.PI / 2, 0xf2f0e6], [134, 5.6, Math.PI / 2, 0x3d7ad9], [150, -5.6, -Math.PI / 2, 0xf2b13d]]);
    const def = MISSION_DEFS[3];
    G.mission = { def: def, step: 0, collected: 0, timer: 61, holdFor: 0, startedAt: 0 };
    G.markers.push(makeMarker(def.objectives[0].at.x, def.objectives[0].at.z, 0xffd23d));
    showSceneRadio();
    updateBanner(); updateResponsePanel();
  }

  if (name === 'mission') {
    // Package Run mid-objective at the Via Manglar / Calle Vela corner in the
    // Neon Mile: two of three packages in, the third's beam ahead across the
    // junction, neon facades lit, Nadia's briefing still in the dialogue
    // strip, parked cars and a crowd working the corner.
    const def = MISSION_DEFS[1];
    G.mission = { def: def, step: 0, collected: 2, timer: null, holdFor: 0, startedAt: 0 };
    for (const pt of def.objectives[0].points) {
      const mk = makeMarker(pt.x, pt.z, 0x3dd9a4);
      G.markers.push(mk);
    }
    G.markers[0].taken = true; G.scene3.remove(G.markers[0].group);
    G.markers[1].taken = true; G.scene3.remove(G.markers[1].group);
    p.pos.set(-135, 0, 108);
    p.angle = 0.62; p.camYaw = 0.62; p.camPitch = 0.17;
    G.sceneCam = { dist: 7, height: 1.75 };
    hidePalmsNear(-139, 102, 11); // keep the camera's foreground clear of trunks
    hidePalmsNear(-135, 108, 6);
    parkSceneCars([
      [-125.6, 84, 0, 0x8a4dd9], [-160, 125.6, Math.PI / 2, 0x3dd9a4],
      [-114.4, 142, Math.PI, 0xf2b13d], [-96, 114.4, -Math.PI / 2, 0xd94f3d],
      [-150, 130.6, -Math.PI / 2, 0xf2f0e6]
    ]);
    stageCrowd(-106, 104, 5);
    stageCrowd(-106, 140, 3);
    G.money = 975; G.respect = 180;
    const dlg = dialogueFromLine(def.line);
    showDialogueStrip(dlg.speaker, dlg.text, 9999);
    updateBanner();
  }

  if (name === 'marina') {
    // The Marina at the duskier end of the evening: the player walks Paseo del
    // Puerto eastward with the Serena GT in the lane beside him, parked cars and
    // palm rows lining the shore road, the water and the boat masts on his right
    // and the low sun ahead over the bay — a different mood from the cover's
    // boulevard, and no bare-sand foreground.
    const gt = spawnCar(G.scene3, 313, 350.4, Math.PI / 2, 0xd92632, 'gt', 'Serena GT');
    gt.parked = true;
    G.personalCar = gt;
    const def = MISSION_DEFS[4];
    G.mission = { def: def, step: 0, collected: 0, timer: null, holdFor: 0, startedAt: 0 };
    G.markers.push(makeMarker(def.objectives[0].at.x, def.objectives[0].at.z, 0xff5c8a));
    p.pos.set(300, 0, 344.8); // on the shore road's south pavement, not in its lane
    p.angle = 1.07; p.camYaw = 1.07; p.camPitch = 0.15;
    G.sceneCam = { dist: 7.5, height: 1.8 };
    hidePalmsNear(293, 341, 10); // keep the camera's foreground clear of trunks
    G.scene3.fog.color.setHex(0xdd7a52);
    parkSceneCars([[272, 354.4, -Math.PI / 2, 0x3dd9a4], [352, 354.4, -Math.PI / 2, 0x3d7ad9], [326, 349.6, Math.PI / 2, 0xf2f0e6], [248, 365.6, Math.PI / 2, 0xf2b13d]]);
    stageCrowd(318, 343, 4, 8);
    stageCrowd(344, 383, 3, 12);
    G.money = 2140; G.respect = 470;
    updateBanner();
  }

  // freeze the cast: scene mode steps the world gently but keeps the pose
  G.sceneFrozen = true;
}

function parkSceneCars(list) {
  for (const [x, z, a, paint] of list) {
    const car = spawnCar(G.scene3, x, z, a, paint, 'car');
    car.parked = true;
    G.traffic.push(car);
  }
}
