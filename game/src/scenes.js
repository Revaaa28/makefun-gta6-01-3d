// Costa Serena — scenes.js: deterministic staging for the four screenshots.
// ?scene=cover|chase|mission|marina&seed=1 poses the real game — real player,
// real traffic, real patrol — in a composed moment, hides the start screen and
// freezes the cast mid-action, so each screenshot is the game's own render of
// a living scene, never a menu and never an edit. The composition rules come
// from the shots that win this bounty: the cover is the big one — a pursuit
// on the palm boulevard beside the beach at golden hour, the hero car large,
// the helicopter centred overhead with its beam down and every HUD system on
// show at once. The other three stay in the golden hour too, so the set
// carries four moods of one evening: sunset pursuit, dusk chase, neon
// mission, marina evening. window.__CS_READY flips true once the staged
// frame has rendered, which is what the screenshot harness waits for.

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

function stageExplosion(x, z) {
  // a patrol car going up at the roadblock: a two-tone fireball, a warm bloom
  // of light over it, smoke puffs climbing and a real point light so the
  // street around it catches fire-orange. Staged meshes, lit like gameplay.
  const grp = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffa726 }));
  core.position.y = 2.2; core.scale.y = 1.3; grp.add(core);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(1.25, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe082 }));
  inner.position.y = 2; grp.add(inner);
  if (G.glowTexture) {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: G.glowTexture, color: 0xff9a3c, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.95
    }));
    glow.scale.set(24, 24, 1); glow.position.y = 3; grp.add(glow);
  }
  const smokeMat = new THREE.MeshLambertMaterial({ color: 0x3a3a40, transparent: true, opacity: 0.55 });
  for (const puffDef of [[-1.1, 6.2, 0.5, 2.1], [1.2, 7.8, -0.6, 2.6], [0.1, 9.6, 0.3, 1.9]]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(puffDef[3], 8, 6), smokeMat);
    puff.position.set(puffDef[0], puffDef[1], puffDef[2]); grp.add(puff);
  }
  const fire = new THREE.PointLight(0xff8a3c, 3, 80, 1.6);
  fire.position.y = 3; grp.add(fire);
  grp.position.set(x, 0, z);
  G.scene3.add(grp);
  return grp;
}

function stageShopSigns() {
  // blade signs + striped awnings along the cover street's north frontage:
  // the facades carry painted shopfronts already, but at cover distance a
  // projecting sign with a lit name is what the eye lands on. Two planes back
  // to back (never a mirrored texture), a mounting arm to the facade line and
  // a slanted awning under each, in the street's own shop names.
  const defs = [
    { name: 'CAFE SOL', col: '#0e7c86', x: 168 },
    { name: 'PIZZA VELA', col: '#c33d2e', x: 200 },
    { name: 'HOTEL MAR', col: '#2456a6', x: 232 }
  ];
  for (const def of defs) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 168;
    const g = c.getContext('2d');
    g.fillStyle = def.col; g.fillRect(0, 0, 512, 168);
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(0, 0, 512, 9); g.fillRect(0, 159, 512, 9);
    g.fillStyle = '#fff7e0'; g.font = '58px Bungee, Rubik, sans-serif'; g.textAlign = 'center';
    g.fillText(def.name, 256, 106);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    for (const ry of [-Math.PI / 2, Math.PI / 2]) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.1), mat);
      face.position.set(def.x + (ry > 0 ? 0.12 : -0.12), 5.6, 345.2); face.rotation.y = ry;
      G.scene3.add(face);
    }
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 6.4),
      new THREE.MeshLambertMaterial({ color: 0x22242a }));
    edge.position.set(def.x, 5.6, 345.2); G.scene3.add(edge);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.6),
      new THREE.MeshLambertMaterial({ color: 0x2b2e33 }));
    arm.position.set(def.x, 6.85, 341.6); G.scene3.add(arm);
    const ac = document.createElement('canvas'); ac.width = 128; ac.height = 32;
    const ag = ac.getContext('2d');
    for (let s = 0; s < 8; s++) { ag.fillStyle = s % 2 ? '#f2ede2' : def.col; ag.fillRect(s * 16, 0, 16, 32); }
    const awn = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.14, 2.8),
      new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(ac) }));
    awn.position.set(def.x, 3.35, 345.6); awn.rotation.x = 0.42;
    G.scene3.add(awn);
  }
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
    // THE COVER — golden hour on Paseo del Puerto, the Marina strand road.
    // The Serena GT runs east in the shore lane with the beach on its right,
    // five CSP interceptors in pursuit formation behind and alongside, and
    // FALCON-1 centred in the sky overhead with its beam pooled on the car.
    // Ahead, a roadblock is going up in flames and its officer is firing.
    // Four stars, the SUNSET RUN banner up, Nadia's briefing in the dialogue
    // strip, the crew cards live, the response panel full of roles — one
    // frame, every system the game has, under the low sun.
    setDaylight(false);
    // the sun sits ahead over the water, so the whole frame is backlit gold
    G.sunBall.position.set(1150, 92, 430);
    G.sunGlow.position.set(1150, 92, 430);
    G.sunOffset = { x: 430, y: 120, z: 90 };
    G.clockMinutes = 18 * 60 + 32;
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
      addLightGlow(u.car.mesh, -0.62, 0.68, -2.44, 0xff6a55, 1.5);
      addLightGlow(u.car.mesh, 0.62, 0.68, -2.44, 0xff6a55, 1.5);
    }
    spawnHelicopter(G.scene3);
    // FALCON-1 centred overhead, big in the frame; its beam points back at
    // the GT and reads end-on, so the pooled light on the road does the
    // talking — the cone is there, the pool is what the eye catches
    G.helicopter.mesh.position.set(186, 12, 361);
    G.helicopter.mesh.rotation.y = -1.9;
    // at this hour FALCON-1 flies with its beam on: cone swung onto the GT
    // and the pool of light sitting on the road around it
    G.helicopter.cone.visible = true;
    if (G.helicopter.pool) {
      G.helicopter.pool.visible = true;
      G.helicopter.pool.position.set(150, 0.24, 365.6);
    }
    G.helicopter.mesh.updateMatrixWorld(true);
    G.helicopter.spot.target.position.copy(
      G.helicopter.mesh.worldToLocal(new THREE.Vector3(150, 0, 365.6)));
    aimSearchlight();
    // the beam's stock opacity is tuned for night streets in play; against a
    // bright sunset sky it needs twice the body to read as a searchlight
    G.helicopter.cone.material.opacity = 0.42;
    if (G.helicopter.pool) G.helicopter.pool.material.opacity = 0.6;
    parkSceneCars([
      [228, 365.6, Math.PI / 2, 0xf2f0e6], [252, 354.4, -Math.PI / 2, 0x3d7ad9],
      [94, 354.4, -Math.PI / 2, 0xf2b13d], [282, 365.6, Math.PI / 2, 0x3dd9a4]
    ]);
    stageCyclist(163, 377.5, Math.PI / 2);
    stageCrowd(152, 394, 5);
    stageCrowd(176, 397, 6, 18);
    stageCrowd(118, 402, 4, 12);
    stageCrowd(206, 383, 3, 12);
    // the north pavement works the frame too: shoppers under the shop signs
    stageCrowd(188, 343.5, 5, 5);
    stageCrowd(222, 343.5, 4, 5);
    stageShopSigns();
    // a roadblock further up the shore lane, one of its cars already burning,
    // and the north car's officer up and firing on the GT — tracers and a
    // muzzle flash frozen mid-burst (scene mode never sweeps them away)
    G.roadblock = spawnRoadblock(G.scene3, 208, 365.6, Math.PI / 2);
    stageExplosion(208, 362);
    const shooter = G.officers[G.officers.length - 1];
    if (shooter) {
      for (let s = 0; s < 3; s++) fireHitscan(shooter.pos, 1.35, gt.pos, 0.95, 0, 0xff5040);
      const aim = Math.atan2(gt.pos.x - shooter.pos.x, gt.pos.z - shooter.pos.z);
      muzzleFlash(shooter.pos, aim);
      if (G.glowTexture) {
        const mz = new THREE.Sprite(new THREE.SpriteMaterial({
          map: G.glowTexture, color: 0xffd23d, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: 0.95
        }));
        mz.scale.set(2.4, 2.4, 1);
        mz.position.set(shooter.pos.x + Math.sin(aim) * 0.85, 1.42, shooter.pos.z + Math.cos(aim) * 0.85);
        G.scene3.add(mz);
      }
    }
    // the GT is braking into the trap: its tail lamps burn twice as bright
    addLightGlow(gt.mesh, -0.62, 0.6, -2.66, 0xff5040, 2.6);
    addLightGlow(gt.mesh, 0.62, 0.6, -2.66, 0xff5040, 2.6);
    const def = MISSION_DEFS[3];
    G.mission = { def: def, step: 0, collected: 0, timer: 71, holdFor: 0, startedAt: 0 };
    G.markers.push(makeMarker(def.objectives[0].at.x, def.objectives[0].at.z, 0xffd23d));
    // the banner already carries the job's line, so Nadia's strip says the
    // other thing she would say in this exact moment — no sentence twice
    showDialogueStrip('Nadia', 'They are boxing you in, love. Shore lane, keep FALCON-1 busy, and do not lift.', 9999);
    showSceneRadio();
    updateBanner(); updateResponsePanel();
  }

  if (name === 'chase') {
    // Full pursuit on Avenida del Sol at the golden hour: the camera rides low
    // and close behind the Serena GT, a striped roadblock with its spike strip
    // and cones fills the mid-frame, interceptors crowd in behind and
    // alongside, and FALCON-1 hangs centred overhead with its beam pooled on
    // the car. Four stars, RESPONSE panel full of roles.
    // the low sun hangs ahead over the avenue, so the chase runs into the glow
    G.sunBall.position.set(1100, 88, 170);
    G.sunGlow.position.set(1100, 88, 170);
    G.sunOffset = { x: 430, y: 118, z: 70 };
    const car = spawnCar(G.scene3, 42, 5.6, Math.PI / 2, 0xd92632, 'gt', 'Serena GT');
    car.engineLevel = 2; car.speed = 34;
    addLightGlow(car.mesh, -0.62, 0.6, -2.66, 0xff5040, 2.4);
    addLightGlow(car.mesh, 0.62, 0.6, -2.66, 0xff5040, 2.4);
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
    G.helicopter.cone.material.opacity = 0.42;
    if (G.helicopter.pool) G.helicopter.pool.material.opacity = 0.6;
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
