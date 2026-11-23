// Costa Serena — city.js: builds the physical city. Golden-hour light, a grid of named
// avenues, per-storey painted facades with emissive lit windows, palm rows, the beach
// and animated water, the Neon Mile's signs and the Marina's docks and boats. Returns
// the animated-water handle and fills G.colliders with every building's footprint.

function makeFacadeTexture(rng, baseHue, neon) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  const hue = baseHue + (rng() * 24 - 12);
  g.fillStyle = 'hsl(' + hue + ',38%,' + (46 + rng() * 16) + '%)';
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, 244, 128, 12);
  const floors = 8, cols = 4;
  for (let f = 0; f < floors; f++) {
    for (let w = 0; w < cols; w++) {
      const lit = rng() < 0.52;
      const x = 10 + w * 29, y = 12 + f * 29;
      g.fillStyle = lit ? (rng() < 0.75 ? '#ffd98a' : '#aee7ff') : 'rgba(20,26,38,0.85)';
      g.fillRect(x, y, 19, 20);
      if (lit && rng() < 0.4) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 8, y, 2, 20); }
    }
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 8 + f * 29, 128, 2);
  }
  if (neon) {
    g.fillStyle = neon; g.fillRect(0, 96, 128, 26);
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.font = 'bold 17px Verdana'; g.textAlign = 'center';
    g.fillText(neon === '#ff2e88' ? 'CLUB VELA' : (neon === '#22d3ee' ? 'HOTEL LUNA' : 'CASINO BRISA'), 64, 115);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

const PALM_TRUNK_GEO = new THREE.CylinderGeometry(0.22, 0.34, 1, 5);
const PALM_FROND_GEO = new THREE.ConeGeometry(0.55, 5.2, 4);

function makePalmTree(rng, trunkMat, frondMat) {
  // shared geometries and four fronds: a palm costs five cheap meshes, and the
  // whole city carries under a hundred of them, so the frame stays light
  const palm = new THREE.Group();
  const h = 7 + rng() * 3.5;
  const trunk = new THREE.Mesh(PALM_TRUNK_GEO, trunkMat);
  trunk.scale.y = h;
  trunk.position.y = h / 2; trunk.rotation.z = (rng() - 0.5) * 0.16;
  palm.add(trunk);
  for (let i = 0; i < 4; i++) {
    const frond = new THREE.Mesh(PALM_FROND_GEO, frondMat);
    const a = (i / 4) * Math.PI * 2 + rng() * 0.6;
    frond.position.set(Math.cos(a) * 1.9, h + 0.4, Math.sin(a) * 1.9);
    frond.rotation.set(Math.PI / 2.3 * Math.sin(a), 0, -Math.PI / 2.3 * Math.cos(a));
    palm.add(frond);
  }
  return palm;
}

function buildCostaSerenaCity(scene) {
  const rng = seededRandom(G.seed * 31 + 5);
  const W = CS.world;

  // --- sky, fog and the low sun -------------------------------------------------
  scene.background = new THREE.Color(0xf7a56b);
  scene.fog = new THREE.Fog(0xe8906a, 180, 880);
  const hemi = new THREE.HemisphereLight(0xffd9b0, 0x4a3550, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb36b, 1.35);
  sun.position.set(-420, 190, 260);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -260; sun.shadow.camera.right = 260;
  sun.shadow.camera.top = 260; sun.shadow.camera.bottom = -260;
  sun.shadow.camera.far = 1400;
  sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);
  G.sunLight = sun;
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(26, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe3a3, fog: false }));
  sunBall.position.set(-760, 150, 470);
  scene.add(sunBall);

  // --- ground: city slab, sand, animated water ---------------------------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1000),
    new THREE.MeshLambertMaterial({ color: 0x9c8a76 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, -30);
  ground.receiveShadow = true;
  scene.add(ground);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(1100, 120),
    new THREE.MeshLambertMaterial({ color: 0xe8cf9e }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.01, W.beachZ + 32);
  sand.receiveShadow = true;
  scene.add(sand);
  const waterMat = new THREE.MeshPhongMaterial({ color: 0x2e7ea6, shininess: 160, specular: 0xffc98a, transparent: true, opacity: 0.94 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 420, 28, 10), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.4, W.waterZ + 190);
  scene.add(water);
  G.waterMesh = water;

  // --- roads --------------------------------------------------------------------
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x474a52 });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0xb8a88f });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf5d76e });
  const roadGeoX = new THREE.PlaneGeometry(940, W.roadWidth);
  const roadGeoZ = new THREE.PlaneGeometry(W.roadWidth, 880);
  const walkGeoX = new THREE.PlaneGeometry(940, W.roadWidth + 7);
  const walkGeoZ = new THREE.PlaneGeometry(W.roadWidth + 7, 880);
  // centre dashes for every avenue are merged into ONE geometry per orientation —
  // four hundred separate dash meshes would cost four hundred draw calls
  const dashPos = [];
  function dashQuad(cx, cz, len, wid, alongX) {
    const hl = len / 2, hw = wid / 2;
    const x0 = alongX ? cx - hl : cx - hw, x1 = alongX ? cx + hl : cx + hw;
    const z0 = alongX ? cz - hw : cz - hl, z1 = alongX ? cz + hw : cz + hl;
    dashPos.push(x0, 0.09, z0, x1, 0.09, z0, x0, 0.09, z1, x1, 0.09, z0, x1, 0.09, z1, x0, 0.09, z1);
  }
  for (const z of CS.avenuesZ) {
    const walk = new THREE.Mesh(walkGeoX, walkMat);
    walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0.03, z); walk.receiveShadow = true; scene.add(walk);
    const road = new THREE.Mesh(roadGeoX, roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.06, z); road.receiveShadow = true; scene.add(road);
    for (let x = -450; x < 460; x += 30) dashQuad(x, z, 9, 0.7, true);
  }
  for (const x of CS.avenuesX) {
    const walk = new THREE.Mesh(walkGeoZ, walkMat);
    walk.rotation.x = -Math.PI / 2; walk.position.set(x, 0.03, -20); walk.receiveShadow = true; scene.add(walk);
    const road = new THREE.Mesh(roadGeoZ, roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(x, 0.06, -20); road.receiveShadow = true; scene.add(road);
    for (let z = -450; z < 400; z += 30) dashQuad(x, z, 9, 0.7, false);
  }
  const dashGeo = new THREE.BufferGeometry();
  dashGeo.setAttribute('position', new THREE.Float32BufferAttribute(dashPos, 3));
  const dashes = new THREE.Mesh(dashGeo, lineMat);
  scene.add(dashes);

  // --- buildings ------------------------------------------------------------------
  const facades = [];
  const hues = [14, 24, 36, 200, 340, 18, 28, 210];
  for (let i = 0; i < 8; i++) facades.push(makeFacadeTexture(rng, hues[i], null));
  const neonFacades = [makeFacadeTexture(rng, 300, '#ff2e88'), makeFacadeTexture(rng, 190, '#22d3ee'), makeFacadeTexture(rng, 40, '#ffb020')];
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x6b5a4a });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const neonDistrict = CS.districts[3];
  for (let bx = 0; bx < CS.avenuesX.length - 1; bx++) {
    for (let bz = 0; bz < CS.avenuesZ.length - 1; bz++) {
      const cx = (CS.avenuesX[bx] + CS.avenuesX[bx + 1]) / 2;
      const cz = (CS.avenuesZ[bz] + CS.avenuesZ[bz + 1]) / 2;
      const inNeon = cx > neonDistrict.x0 && cx < neonDistrict.x1 && cz > neonDistrict.z0 && cz < neonDistrict.z1;
      const inCentro = Math.abs(cx) < 130 && cz > -130;
      const tall = inCentro || inNeon;
      const bw = 62 + rng() * 22, bd = 62 + rng() * 22;
      const bh = tall ? 30 + rng() * 42 : 13 + rng() * 26;
      const tex = inNeon ? neonFacades[Math.floor(rng() * 3)] : facades[Math.floor(rng() * facades.length)];
      const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.34 });
      // facade on all four walls, roof material only on the up/down faces
      const b = new THREE.Mesh(boxGeo, [mat, mat, roofMat, roofMat, mat, mat]);
      b.scale.set(bw, bh, bd);
      b.position.set(cx, bh / 2, cz);
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
      G.colliders.push({ x0: cx - bw / 2, x1: cx + bw / 2, z0: cz - bd / 2, z1: cz + bd / 2 });
      // parapet + rooftop box, the skyline detail the contact sheet reads
      const par = new THREE.Mesh(boxGeo, roofMat);
      par.scale.set(bw * 0.4, 2.2, bd * 0.4);
      par.position.set(cx + (rng() - 0.5) * 14, bh + 1.1, cz + (rng() - 0.5) * 14);
      par.castShadow = true;
      scene.add(par);
    }
  }

  // --- palms and lamps --------------------------------------------------------------
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6a4a });
  const frondMat = new THREE.MeshLambertMaterial({ color: 0x3e8a4f });
  for (let x = -440; x <= 440; x += 44) {
    for (const zSide of [W.beachZ - 26, 240 - 20]) {
      const palm = makePalmTree(rng, trunkMat, frondMat);
      palm.position.set(x + (rng() - 0.5) * 8, 0, zSide + (rng() - 0.5) * 5);
      scene.add(palm);
    }
  }
  for (let i = 0; i < 40; i++) {
    const palm = makePalmTree(rng, trunkMat, frondMat);
    const ax = CS.avenuesX[Math.floor(rng() * CS.avenuesX.length)];
    palm.position.set(ax + (rng() < 0.5 ? -17 : 17), 0, -430 + rng() * 790);
    scene.add(palm);
  }
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x2c2f36 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  const lampGeo = new THREE.CylinderGeometry(0.14, 0.18, 6.4, 5);
  const bulbGeo = new THREE.SphereGeometry(0.42, 8, 6);
  for (const ax of CS.avenuesX) for (let z = -420; z < 380; z += 118) {
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(ax + 14, 3.2, z); scene.add(lamp);
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(ax + 14, 6.6, z); scene.add(bulb);
  }

  // --- marina: docks, boats, the harbour crane ---------------------------------------
  const dockMat = new THREE.MeshLambertMaterial({ color: 0x7a6248 });
  const hullCols = [0xd94f3d, 0x3d7ad9, 0xf2f0e6, 0x3dd9a4, 0xf2b13d];
  for (let i = 0; i < 4; i++) {
    const dx = 268 + i * 44;
    const dock = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 74), dockMat);
    dock.position.set(dx, 0.6, W.waterZ + 26);
    scene.add(dock);
    G.colliders.push({ x0: dx - 3.5, x1: dx + 3.5, z0: W.waterZ - 8, z1: W.waterZ + 60 });
    for (let bIdx = 0; bIdx < 3; bIdx++) {
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.6, 11),
        new THREE.MeshLambertMaterial({ color: hullCols[Math.floor(rng() * hullCols.length)] }));
      hull.position.y = 0.8; boat.add(hull);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(3, 1.7, 4),
        new THREE.MeshLambertMaterial({ color: 0xf5f2ea }));
      cabin.position.set(0, 2.2, -0.6); boat.add(cabin);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 8, 5), lampMat);
      mast.position.set(0, 5.4, 1.8); boat.add(mast);
      boat.position.set(dx + (bIdx % 2 === 0 ? -7 : 7), 0.5, W.waterZ + 2 + bIdx * 22);
      boat.rotation.y = (rng() - 0.5) * 0.14;
      scene.add(boat);
      G.boats = G.boats || []; G.boats.push(boat);
    }
  }
  const craneMat = new THREE.MeshLambertMaterial({ color: 0xd9762e });
  const craneLeg = new THREE.Mesh(new THREE.BoxGeometry(2, 34, 2), craneMat);
  craneLeg.position.set(392, 17, 330); craneLeg.castShadow = true; scene.add(craneLeg);
  const craneArm = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 44), craneMat);
  craneArm.position.set(392, 34, 352); scene.add(craneArm);
  G.colliders.push({ x0: 388, x1: 396, z0: 326, z1: 334 });

  // garage forecourt marker pad
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(30, 22),
    new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.3 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(CS.garage.x, 0.12, CS.garage.z);
  scene.add(pad);

  return { sun: sun, water: water };
}

function collideCircle(pos, radius) {
  for (const c of G.colliders) {
    if (pos.x > c.x0 - radius && pos.x < c.x1 + radius && pos.z > c.z0 - radius && pos.z < c.z1 + radius) {
      const dxl = pos.x - (c.x0 - radius), dxr = (c.x1 + radius) - pos.x;
      const dzl = pos.z - (c.z0 - radius), dzr = (c.z1 + radius) - pos.z;
      const m = Math.min(dxl, dxr, dzl, dzr);
      if (m === dxl) pos.x = c.x0 - radius; else if (m === dxr) pos.x = c.x1 + radius;
      else if (m === dzl) pos.z = c.z0 - radius; else pos.z = c.z1 + radius;
    }
  }
  pos.x = clampValue(pos.x, -CS.world.half + 2, CS.world.half - 2);
  pos.z = clampValue(pos.z, -CS.world.half + 2, CS.world.waterZ - 4);
}
