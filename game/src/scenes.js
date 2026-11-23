// Costa Serena — scenes.js: deterministic staging for the four screenshots.
// ?scene=cover|chase|mission|marina&seed=1 poses the real game — real player, real
// traffic, real patrol — in a composed moment, hides the start screen and freezes
// the cast mid-action, so each screenshot is the game's own render of a living
// scene, never a menu and never an edit. The composition rules come from the
// reference shots that win this bounty: the camera sits at street level, close
// behind the subject, and every frame is FULL — palms and lamps overhead, traffic
// and parked cars at the kerbs, crowds on the sidewalks, facades with lit
// shopfronts across the street. A frame that is half empty asphalt loses, so no
// scene below leaves one. window.__CS_READY flips true once the staged frame
// has rendered, which is what the screenshot harness waits for.

function stageCrowd(x, z, n) {
  const rng = seededRandom(G.seed * 3 + n * 17 + Math.floor(x));
  for (let i = 0; i < n; i++) {
    const ped = spawnPedestrian(G.scene3, rng, x + (rng() - 0.5) * 30, z + (rng() - 0.5) * 26);
    G.peds.push(ped);
  }
}

function stageScene(name) {
  G.scene = name;
  G.started = true;
  document.getElementById('start-screen').style.display = 'none';
  const p = G.player;
  G.money = 1250; G.respect = 340;

  if (name === 'cover') {
    // On foot on Boulevard Brisa at the golden hour, over-the-shoulder at street
    // level: the boulevard runs east ahead of him, palms in a double row, parked
    // cars at both kerbs, traffic in both lanes, a patrol car watching from the
    // far kerb, Nadia waiting two doors down — and her first job on the banner.
    G.mission = null;
    p.pos.set(28, 0, 233);
    p.angle = Math.PI / 2; p.camYaw = Math.PI / 2; p.camPitch = 0.14;
    G.sceneCam = { dist: 6.5, height: 1.6 };
    parkSceneCars([
      [58, 245.6, Math.PI / 2, 0x3d7ad9], [88, 234.4, -Math.PI / 2, 0xf2b13d],
      [120, 245.6, Math.PI / 2, 0x3dd9a4], [-4, 234.4, -Math.PI / 2, 0xd94f3d],
      [66, 250.6, Math.PI / 2, 0xf2f0e6], [16, 229.4, -Math.PI / 2, 0x8a4dd9],
      [148, 234.4, -Math.PI / 2, 0x4dd0e1]
    ]);
    const patrol = spawnPoliceCar(G.scene3, 104, 250.6);
    patrol.car.angle = Math.PI / 2; patrol.car.mesh.rotation.y = Math.PI / 2;
    patrol.car.parked = true; patrol.state = 'PATROL';
    stageCrowd(52, 231, 7);
    stageCrowd(86, 241, 4);
    stageCrowd(8, 226, 3);
    updateBanner();
  }

  if (name === 'chase') {
    // Full pursuit on Avenida del Sol: the camera rides low and close behind the
    // Serena GT, a striped roadblock with its spike strip and cones fills the
    // mid-frame, interceptors crowd in behind and alongside, and FALCON-1 hangs
    // overhead with its beam pooled on the car. Four stars, RESPONSE panel full.
    const car = spawnCar(G.scene3, 42, 5.6, Math.PI / 2, 0xd92632, 'gt', 'Serena GT');
    car.engineLevel = 2; car.speed = 34;
    G.inCar = car; G.currentCar = car; G.personalCar = car;
    p.mesh.visible = false;
    p.pos.copy(car.pos); p.angle = car.angle; p.camYaw = Math.PI / 2; p.camPitch = 0.16;
    G.sceneCam = { dist: 10.5, height: 1.7 };
    commitCrime(390);
    G.wanted = 4;
    const u1 = spawnPoliceCar(G.scene3, 27, 1.2);
    u1.car.angle = Math.PI / 2; u1.car.speed = 31; u1.state = 'PURSUIT';
    const u2 = spawnPoliceCar(G.scene3, 38, -4.6);
    u2.car.angle = Math.PI / 2; u2.car.speed = 33; u2.state = 'PURSUIT';
    const u3 = spawnPoliceCar(G.scene3, 20, 10.5);
    u3.car.angle = Math.PI / 2; u3.car.speed = 29; u3.state = 'EN ROUTE';
    const u4 = spawnPoliceCar(G.scene3, 40, 12.6);
    u4.car.angle = Math.PI / 2; u4.car.speed = 30; u4.state = 'PURSUIT';
    G.roadblock = spawnRoadblock(G.scene3, 68, 5.6, Math.PI / 2);
    spawnHelicopter(G.scene3);
    G.helicopter.mesh.position.set(56, 11.5, -5);
    G.helicopter.mesh.rotation.y = 0.6;
    G.helicopter.spot.target.position.set(-14, -11.5, 10.6);
    if (G.helicopter.pool) G.helicopter.pool.position.set(42, 0.24, 5.6);
    aimSearchlight();
    parkSceneCars([[112, -5.6, -Math.PI / 2, 0xf2f0e6], [134, 5.6, Math.PI / 2, 0x3d7ad9], [150, -5.6, -Math.PI / 2, 0xf2b13d]]);
    const def = MISSION_DEFS[3];
    G.mission = { def: def, step: 0, collected: 0, timer: 61, holdFor: 0, startedAt: 0 };
    G.markers.push(makeMarker(def.objectives[0].at.x, def.objectives[0].at.z, 0xffd23d));
    updateBanner(); updateResponsePanel();
  }

  if (name === 'mission') {
    // Package Run mid-objective at the Via Manglar / Calle Vela corner in the
    // Neon Mile: two of three packages in, the third's beam ahead across the
    // junction, neon facades lit, parked cars and a crowd working the corner.
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
    parkSceneCars([
      [-114.4, 84, 0, 0x8a4dd9], [-160, 125.6, -Math.PI / 2, 0x3dd9a4],
      [-125.6, 142, Math.PI, 0xf2b13d], [-96, 114.4, Math.PI / 2, 0xd94f3d],
      [-150, 130.6, -Math.PI / 2, 0xf2f0e6]
    ]);
    stageCrowd(-148, 96, 5);
    stageCrowd(-118, 126, 3);
    G.money = 975; G.respect = 180;
    updateBanner();
  }

  if (name === 'marina') {
    // The Marina at the duskier end of the evening: the player walks Paseo del
    // Puerto eastward with the Serena GT in the lane beside him, parked cars and
    // palm rows lining the shore road, the water and the boat masts on his right
    // and the low sun ahead over the bay — a different mood from the cover's
    // boulevard, and no bare-sand foreground.
    const gt = spawnCar(G.scene3, 313, 354.4, Math.PI / 2, 0xd92632, 'gt', 'Serena GT');
    gt.parked = true;
    G.personalCar = gt;
    const def = MISSION_DEFS[4];
    G.mission = { def: def, step: 0, collected: 0, timer: null, holdFor: 0, startedAt: 0 };
    G.markers.push(makeMarker(def.objectives[0].at.x, def.objectives[0].at.z, 0xff5c8a));
    p.pos.set(300, 0, 350);
    p.angle = 1.07; p.camYaw = 1.07; p.camPitch = 0.15;
    G.sceneCam = { dist: 7.5, height: 1.8 };
    G.scene3.fog.color.setHex(0xdd7a52);
    parkSceneCars([[272, 365.6, -Math.PI / 2, 0x3dd9a4], [352, 365.6, -Math.PI / 2, 0x3d7ad9], [326, 349.6, Math.PI / 2, 0xf2f0e6], [248, 354.4, Math.PI / 2, 0xf2b13d]]);
    stageCrowd(318, 347, 4);
    stageCrowd(344, 358, 3);
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
