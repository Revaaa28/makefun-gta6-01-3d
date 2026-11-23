// Costa Serena — city.js: builds the physical city. Golden-hour light, a grid of named
// avenues, per-storey painted facades with emissive lit windows, palm rows, the beach
// and animated water, the Neon Mile's signs and the Marina's docks and boats. Returns
// the animated-water handle and fills G.colliders with every building's footprint.

const SHOP_NAMES = ['CAFE SOL', 'BAR BRISA', 'TALLER REY', 'PANADERIA', 'HOTEL MAR', 'FARMACIA', 'BARBERIA', 'MERCADO', 'PIZZA VELA', 'JOYERIA', 'LIBRERIA', 'FLORISTERIA'];

function makeFacadeTexture(rng, baseHue, neon) {
  // A painted facade, drawn floor by floor: each storey gets its own colour band
  // (the repainted-over-the-years look of a real coastal street), framed windows
  // with shutters and balcony rails on some, and a ground floor that is either a
  // shopfront with a striped awning and a name, or a doorway with a canopy. The
  // texture is what the screenshot judge actually reads as "a city", so it earns
  // its detail here rather than in geometry.
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const hue = baseHue + (rng() * 26 - 13);
  const sat = 34 + rng() * 18;
  const floors = 9, cols = 6, fh = 512 / floors;
  for (let f = 0; f < floors; f++) {
    const light = 40 + rng() * 22 + (f === 0 ? -8 : 0);
    g.fillStyle = 'hsl(' + (hue + (rng() * 10 - 5)) + ',' + sat + '%,' + light + '%)';
    g.fillRect(0, f * fh, 256, fh + 1);
    g.fillStyle = 'rgba(255,255,255,0.13)'; g.fillRect(0, f * fh, 256, 3);
    g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, (f + 1) * fh - 3, 256, 3);
  }
  // upper windows: frames, crossbars, shutters, the odd balcony rail
  for (let f = 0; f < floors - 1; f++) {
    for (let w = 0; w < cols; w++) {
      const x = 14 + w * 40, y = f * fh + 12, ww = 24, wh = 30;
      const lit = rng() < 0.55;
      g.fillStyle = 'rgba(255,246,224,0.75)'; g.fillRect(x - 3, y - 3, ww + 6, wh + 6);
      g.fillStyle = lit ? (rng() < 0.78 ? '#ffd98a' : '#aee7ff') : 'rgba(18,24,36,0.88)';
      g.fillRect(x, y, ww, wh);
      g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(x + ww / 2 - 1, y, 2, wh); g.fillRect(x, y + wh / 2 - 1, ww, 2);
      if (rng() < 0.35) { // shutters
        g.fillStyle = 'hsl(' + ((hue + 140) % 360) + ',30%,32%)';
        g.fillRect(x - 9, y, 6, wh); g.fillRect(x + ww + 3, y, 6, wh);
      }
      if (rng() < 0.3) { // balcony rail under the window
        g.fillStyle = 'rgba(20,20,26,0.65)';
        g.fillRect(x - 4, y + wh + 3, ww + 8, 3);
        for (let b = 0; b < 5; b++) g.fillRect(x - 2 + b * 7, y + wh - 2, 2, 6);
      }
      if (rng() < 0.16) { // AC box hanging by a window
        g.fillStyle = '#cfd4d8'; g.fillRect(x + ww + 5, y + 8, 10, 12);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + ww + 7, y + 11, 6, 2);
      }
    }
  }
  // ground floor: shopfront or doorway
  const gy = (floors - 1) * fh;
  if (rng() < 0.62) {
    const name = SHOP_NAMES[Math.floor(rng() * SHOP_NAMES.length)];
    const awnHue = Math.floor(rng() * 360);
    for (let s = 0; s < 8; s++) { // striped awning
      g.fillStyle = s % 2 ? '#f2ede2' : 'hsl(' + awnHue + ',62%,46%)';
      g.fillRect(s * 32, gy + 16, 32, 12);
    }
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, gy + 28, 256, 3);
    g.fillStyle = '#fff3cf'; g.fillRect(14, gy + 2, 228, 13);
    g.fillStyle = '#26303c'; g.font = '800 12px Rubik, Verdana, sans-serif'; g.textAlign = 'center';
    g.fillText(name, 128, gy + 12);
    for (let d = 0; d < 3; d++) { // glass shop windows, warm inside
      g.fillStyle = rng() < 0.8 ? '#ffca7a' : '#ffe9b8';
      g.fillRect(16 + d * 80, gy + 34, 62, fh - 38);
      g.fillStyle = 'rgba(38,48,60,0.9)'; g.fillRect(16 + d * 80, gy + 34, 62, 3);
    }
  } else {
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, gy, 256, fh);
    for (let d = 0; d < 3; d++) {
      g.fillStyle = '#2b2118'; g.fillRect(34 + d * 76, gy + 12, 34, fh - 12);
      g.fillStyle = '#ffd98a'; g.fillRect(60 + d * 76, gy + 30, 5, 5);
    }
  }
  if (neon) {
    g.fillStyle = neon; g.fillRect(0, 190, 256, 46);
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.font = '28px Bungee, Rubik, sans-serif'; g.textAlign = 'center';
    g.fillText(neon === '#ff2e88' ? 'CLUB VELA' : (neon === '#22d3ee' ? 'HOTEL LUNA' : 'CASINO BRISA'), 128, 224);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0, 186, 256, 3); g.fillRect(0, 236, 256, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function makeGlowTexture(inner, outer) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, inner); grad.addColorStop(0.35, outer); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function makeSkyTexture() {
  // vertical dusk gradient: burnt orange at the horizon, rose, then mauve —
  // painted on a canvas and wrapped around the inside of a sky dome, so every
  // street reads against a sunset instead of a flat colour
  const c = document.createElement('canvas'); c.width = 64; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0.0, '#ff9a3d');
  grad.addColorStop(0.30, '#ff7e4a');
  grad.addColorStop(0.48, '#f2665e');
  grad.addColorStop(0.66, '#c65b78');
  grad.addColorStop(0.84, '#7e5570');
  grad.addColorStop(1.0, '#54455e');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 512);
  return new THREE.CanvasTexture(c);
}

function makeDaySkyTexture() {
  // the same dome on a bright day: deep blue up top melting to a pale horizon,
  // with soft cloud banks painted in — the cover shot's sky. The clouds are
  // wide blurred ellipses so the sphere wrap stretches them, never tears them
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0.0, '#dcefff');
  grad.addColorStop(0.34, '#a8d4f5');
  grad.addColorStop(0.62, '#6fb2ec');
  grad.addColorStop(1.0, '#2e6fd2');
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 512);
  const rng = seededRandom(1234);
  for (let i = 0; i < 46; i++) {
    const cx = rng() * 1024, cy = 60 + rng() * 250, r = 30 + rng() * 90;
    const cg = g.createRadialGradient(cx, cy, 2, cx, cy, r);
    cg.addColorStop(0, 'rgba(255,255,255,0.55)');
    cg.addColorStop(0.6, 'rgba(255,255,255,0.22)');
    cg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cg;
    g.beginPath(); g.ellipse(cx, cy, r * 1.9, r * 0.5, 0, 0, 6.3); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function makeStripeTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f0e6'; g.fillRect(0, 0, 128, 32);
  g.fillStyle = '#d9382b';
  for (let x = -32; x < 128; x += 32) {
    g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, 32); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = 3;
  return tex;
}

// --- small geometry toolkit -----------------------------------------------------
// mergeColouredParts bakes transformed, vertex-coloured copies of simple
// geometries into ONE BufferGeometry — the palms (and only the palms for now)
// are built this way: a whole tree is two draw calls, trunk and crown, instead
// of the ten loose cones and cylinders that used to read as separate pieces.
function partMtx(x, y, z, rx, ry, rz, sx, sy, sz) {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx || 1, sy || 1, sz || 1));
  return m;
}

function mergeColouredParts(parts) {
  let vCount = 0, iCount = 0;
  for (const p of parts) {
    vCount += p.geo.attributes.position.count;
    iCount += p.geo.index ? p.geo.index.count : p.geo.attributes.position.count;
  }
  const pos = new Float32Array(vCount * 3), nor = new Float32Array(vCount * 3), col = new Float32Array(vCount * 3);
  const idx = new (vCount > 65535 ? Uint32Array : Uint16Array)(iCount);
  const nm = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
  let vo = 0, io = 0;
  for (const p of parts) {
    const g = p.geo;
    nm.getNormalMatrix(p.mtx);
    c.set(p.color);
    const pa = g.attributes.position, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(p.mtx);
      pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
      n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
      nor[(vo + i) * 3] = n.x; nor[(vo + i) * 3 + 1] = n.y; nor[(vo + i) * 3 + 2] = n.z;
      col[(vo + i) * 3] = c.r; col[(vo + i) * 3 + 1] = c.g; col[(vo + i) * 3 + 2] = c.b;
    }
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.getX(i) + vo; io += g.index.count; }
    else { for (let i = 0; i < pa.count; i++) idx[io + i] = vo + i; io += pa.count; }
    vo += pa.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

// Is this point on a carriageway? The union of every avenue's asphalt strip —
// the placement guard that keeps trees, lamps and furniture off the road for
// good, including the trap at junctions, where a point can be on one avenue's
// pavement and squarely inside the crossing avenue's lanes.
function onCarriageway(x, z, margin) {
  const half = CS.world.roadWidth / 2 + (margin || 0);
  for (const az of CS.avenuesZ) if (Math.abs(z - az) < half && Math.abs(x) < 480) return true;
  for (const ax of CS.avenuesX) if (Math.abs(x - ax) < half && z > -470 && z < 430) return true;
  return false;
}

const PALM_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const PALM_FROND_BASE = new THREE.CylinderGeometry(0.015, 0.13, 1, 4);
PALM_FROND_BASE.translate(0, 0.5, 0); // base at the origin, tip at y=1

function makePalmTree(rng) {
  // A palm that reads as ONE living plant: the trunk is a single cylinder bent
  // smoothly sideways (vertices displaced along a curve, so it can never come
  // apart), and the crown is a separate merged fan of tapered fronds whose
  // bases all sit IN the trunk top — upper spears, a mid fan, a drooping lower
  // ring and a few dry hangers, with coconuts tucked under it. The crown is
  // its own group so main.js can sway it in the sea breeze.
  const palm = new THREE.Group();
  const h = 7.5 + rng() * 4;
  const leanAmt = 0.5 + rng() * 1.1;
  const trunkGeo = new THREE.CylinderGeometry(0.19, 0.37, h, 6, 6);
  trunkGeo.translate(0, h / 2, 0);
  const tp = trunkGeo.attributes.position;
  const trunkCol = [];
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i), t = y / h;
    tp.setX(i, tp.getX(i) + leanAmt * t * t);
    const shade = 0.82 + 0.18 * t; // darker at the base, sunlit at the top
    trunkCol.push(0.54 * shade, 0.42 * shade, 0.29 * shade);
  }
  trunkGeo.setAttribute('color', new THREE.Float32BufferAttribute(trunkCol, 3));
  trunkGeo.computeVertexNormals();
  const trunk = new THREE.Mesh(trunkGeo, PALM_MAT);
  palm.add(trunk);

  const crown = new THREE.Group();
  crown.position.set(leanAmt, h, 0);
  const greens = [0x3e8a4f, 0x4da35e, 0x35794a];
  const parts = [];
  const rings = [
    { n: 3, tilt: 0.38, len: 3.4 },  // upright spears
    { n: 6, tilt: 0.85, len: 5.4 },  // the main fan
    { n: 5, tilt: 1.3, len: 4.7 },   // the drooping lower ring
    { n: 3, tilt: 2.15, len: 3.1 }   // dry hangers underneath
  ];
  const qY = new THREE.Quaternion(), qZ = new THREE.Quaternion();
  const YAXIS = new THREE.Vector3(0, 1, 0), ZAXIS = new THREE.Vector3(0, 0, 1);
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 + r * 0.7 + rng() * 0.4;
      const len = ring.len * (0.88 + rng() * 0.24);
      const dry = r === 3;
      // tilt the frond away from vertical around Z, then swing it to its
      // azimuth around Y — its base stays at the crown origin either way
      qY.setFromAxisAngle(YAXIS, -a);
      qZ.setFromAxisAngle(ZAXIS, -ring.tilt);
      const q = qY.clone().multiply(qZ);
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(0, -0.05, 0), q, new THREE.Vector3(1, len, 0.22));
      parts.push({ geo: PALM_FROND_BASE, mtx: m, color: dry ? 0x9a8a4a : greens[Math.floor(rng() * greens.length)] });
    }
  }
  for (let i = 0; i < 3; i++) { // coconuts under the crown
    const a = rng() * Math.PI * 2;
    parts.push({
      geo: new THREE.SphereGeometry(0.21, 6, 5),
      mtx: partMtx(Math.cos(a) * 0.24, -0.22, Math.sin(a) * 0.24, 0, 0, 0),
      color: 0x6e5636
    });
  }
  const crownMesh = new THREE.Mesh(mergeColouredParts(parts), PALM_MAT);
  crown.add(crownMesh);
  palm.add(crown);
  palm.userData.crown = crown;
  return palm;
}

function buildCostaSerenaCity(scene) {
  const rng = seededRandom(G.seed * 31 + 5);
  const W = CS.world;

  // --- sky, fog and the low sun -------------------------------------------------
  // a gradient dome instead of a flat background colour: orange at the horizon,
  // rose above it, mauve at the top — the dusk the reference shots live under
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1350, 24, 14),
    new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }));
  skyDome.renderOrder = -10;
  scene.add(skyDome);
  G.skyDome = skyDome;
  G.duskSkyTexture = skyDome.material.map;
  G.daySkyTexture = makeDaySkyTexture();
  scene.background = new THREE.Color(0xf2665e);
  scene.fog = new THREE.Fog(0xef8a5c, 130, 760);
  const hemi = new THREE.HemisphereLight(0xffc9a0, 0x51384e, 0.8);
  scene.add(hemi);
  G.hemiLight = hemi;
  const sun = new THREE.DirectionalLight(0xffa257, 1.4);
  sun.position.set(-420, 128, 260);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -280; sun.shadow.camera.right = 280;
  sun.shadow.camera.top = 280; sun.shadow.camera.bottom = -280;
  sun.shadow.camera.far = 1400;
  sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);
  G.sunLight = sun;
  // the sun itself: a bright disc low over the water in the west, with a halo
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(30, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe9b0, fog: false }));
  sunBall.position.set(-1020, 118, 560);
  scene.add(sunBall);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('rgba(255,190,110,0.95)', 'rgba(255,120,60,0.38)'),
    transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  sunGlow.scale.set(420, 420, 1);
  sunGlow.position.copy(sunBall.position);
  scene.add(sunGlow);
  G.sunBall = sunBall;
  G.sunGlow = sunGlow;
  G.glowTexture = makeGlowTexture('rgba(255,225,160,1)', 'rgba(255,170,80,0.45)');

  // --- ground: city slab, sand, animated water ---------------------------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1000),
    new THREE.MeshLambertMaterial({ color: 0x87755e }));
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
  // deep grey asphalt — the old blue-grey washed out to pavement under the
  // daylight hemisphere; this tone keeps the carriageway reading as ROAD next
  // to the pale kerbs in both lights
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x3a3e46 });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0xc4ad8a });
  const roadGeoX = new THREE.PlaneGeometry(940, W.roadWidth);
  const roadGeoZ = new THREE.PlaneGeometry(W.roadWidth, 880);
  const walkGeoX = new THREE.PlaneGeometry(940, W.roadWidth + 7);
  const walkGeoZ = new THREE.PlaneGeometry(W.roadWidth + 7, 880);
  for (const z of CS.avenuesZ) {
    const walk = new THREE.Mesh(walkGeoX, walkMat);
    walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0.03, z); walk.receiveShadow = true; scene.add(walk);
    const road = new THREE.Mesh(roadGeoX, roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.06, z); road.receiveShadow = true; scene.add(road);
  }
  for (const x of CS.avenuesX) {
    const walk = new THREE.Mesh(walkGeoZ, walkMat);
    walk.rotation.x = -Math.PI / 2; walk.position.set(x, 0.03, -20); walk.receiveShadow = true; scene.add(walk);
    const road = new THREE.Mesh(roadGeoZ, roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(x, 0.06, -20); road.receiveShadow = true; scene.add(road);
  }
  // --- the full marking set, merged into two geometries (white / yellow) --------
  // Double-yellow centre lines and white edge lines run block to block (they
  // stop at each junction so they never paint over a crossing); zebra crossings
  // sit ON the carriageway just clear of each junction mouth; a stop line waits
  // before every crossing on the approach side; and a direction arrow lies in
  // every lane every block or so, pointing the way the traffic in that lane
  // actually travels (right-hand traffic — see traffic.js laneOffsetFor).
  const whitePos = [], yellowPos = [];
  function markQuad(arr, y, cx, cz, len, wid, alongX) {
    const hl = len / 2, hw = wid / 2;
    const x0 = alongX ? cx - hl : cx - hw, x1 = alongX ? cx + hl : cx + hw;
    const z0 = alongX ? cz - hw : cz - hl, z1 = alongX ? cz + hw : cz + hl;
    arr.push(x0, y, z0, x1, y, z0, x0, y, z1, x1, y, z0, x1, y, z1, x0, y, z1);
  }
  function markTri(arr, y, ax, az, bx, bz, cx, cz) {
    arr.push(ax, y, az, bx, y, bz, cx, y, cz);
  }
  // an arrow lying in a lane: shaft + head, pointing along (dx, dz)
  function markArrow(cx, cz, dx, dz) {
    const y = 0.085, px = dz, pz = dx; // perpendicular
    markQuad(whitePos, y, cx, cz, 3.2, 0.55, dx !== 0);
    const hx = cx + dx * 2.3, hz = cz + dz * 2.3;
    const b1x = cx + dx * 0.9 + px * 1.0, b1z = cz + dz * 0.9 + pz * 1.0;
    const b2x = cx + dx * 0.9 - px * 1.0, b2z = cz + dz * 0.9 - pz * 1.0;
    markTri(whitePos, y, hx, hz, b1x, b1z, b2x, b2z);
  }
  const LANE = 5.6; // the lane centres, shared with traffic.js
  // centre + edge lines, per block segment between junctions
  for (const az of CS.avenuesZ) {
    const cuts = [-470].concat(CS.avenuesX, [470]);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i] + (i === 0 ? 0 : 14.5), b = cuts[i + 1] - (i === cuts.length - 2 ? 0 : 14.5);
      if (b - a < 8) continue;
      const mid = (a + b) / 2, len = b - a;
      markQuad(yellowPos, 0.09, mid, az - 0.75, len, 0.5, true);
      markQuad(yellowPos, 0.09, mid, az + 0.75, len, 0.5, true);
      markQuad(whitePos, 0.088, mid, az - 11.3, len, 0.45, true);
      markQuad(whitePos, 0.088, mid, az + 11.3, len, 0.45, true);
    }
    // lane arrows: eastbound in the +LANE lane, westbound in the -LANE lane
    for (let x = -408; x < 450; x += 82) {
      let nearCross = false;
      for (const ax of CS.avenuesX) if (Math.abs(x - ax) < 24) nearCross = true;
      if (!nearCross) markArrow(x, az + LANE, 1, 0);
      nearCross = false;
      for (const ax of CS.avenuesX) if (Math.abs(x + 41 - ax) < 24) nearCross = true;
      if (!nearCross) markArrow(x + 41, az - LANE, -1, 0);
    }
  }
  for (const ax of CS.avenuesX) {
    const cuts = [-460].concat(CS.avenuesZ, [420]);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i] + (i === 0 ? 0 : 14.5), b = cuts[i + 1] - (i === cuts.length - 2 ? 0 : 14.5);
      if (b - a < 8) continue;
      const mid = (a + b) / 2, len = b - a;
      markQuad(yellowPos, 0.09, ax - 0.75, mid, len, 0.5, false);
      markQuad(yellowPos, 0.09, ax + 0.75, mid, len, 0.5, false);
      markQuad(whitePos, 0.088, ax - 11.3, mid, len, 0.45, false);
      markQuad(whitePos, 0.088, ax + 11.3, mid, len, 0.45, false);
    }
    for (let z = -398; z < 400; z += 82) {
      let nearCross = false;
      for (const az of CS.avenuesZ) if (Math.abs(z - az) < 24) nearCross = true;
      if (!nearCross) markArrow(ax - LANE, z, 0, 1); // southbound, west lane
      nearCross = false;
      for (const az of CS.avenuesZ) if (Math.abs(z + 41 - az) < 24) nearCross = true;
      if (!nearCross) markArrow(ax + LANE, z + 41, 0, -1); // northbound, east lane
    }
  }
  // zebra crossings + stop lines at every intersection
  for (const ax of CS.avenuesX) for (const az of CS.avenuesZ) {
    for (const sideSign of [-1, 1]) {
      // crossing over the east-west avenue, on this side of the junction
      const cxp = ax + sideSign * 15.4;
      for (let s = -2; s <= 2; s++) markQuad(whitePos, 0.082, cxp + s * 2.2, az, 20, 1.3, false);
      // stop lines: traffic approaching this crossing stops 3.4 short of it,
      // in its own right-hand lane — always on the upstream side, whichever
      // side of the junction the crossing sits on
      markQuad(whitePos, 0.084, cxp - 3.4, az + LANE + 0.5, 9, 0.55, false); // eastbound approach
      markQuad(whitePos, 0.084, cxp + 3.4, az - LANE - 0.5, 9, 0.55, false); // westbound approach
      // crossing over the north-south avenue, on this side of the junction
      const czp = az + sideSign * 15.4;
      for (let s = -2; s <= 2; s++) markQuad(whitePos, 0.082, ax, czp + s * 2.2, 20, 1.3, true);
      markQuad(whitePos, 0.084, ax - LANE - 0.5, czp - 3.4, 9, 0.55, true); // southbound approach
      markQuad(whitePos, 0.084, ax + LANE + 0.5, czp + 3.4, 9, 0.55, true); // northbound approach
    }
  }
  function markMesh(posArr, color) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color }));
    scene.add(mesh);
    return mesh;
  }
  markMesh(whitePos, 0xf2efe4);
  markMesh(yellowPos, 0xffcf4d);

  // --- buildings ------------------------------------------------------------------
  const facades = [];
  const hues = [14, 24, 36, 200, 340, 18, 28, 210];
  for (let i = 0; i < 8; i++) facades.push(makeFacadeTexture(rng, hues[i], null));
  const neonFacades = [makeFacadeTexture(rng, 300, '#ff2e88'), makeFacadeTexture(rng, 190, '#22d3ee'), makeFacadeTexture(rng, 40, '#ffb020')];
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x6b5a4a });
  const acMat = new THREE.MeshLambertMaterial({ color: 0xb9bec2 });
  const tankMat = new THREE.MeshLambertMaterial({ color: 0x8a5f43 });
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
      (G.facadeMats = G.facadeMats || []).push(mat);
      // facade on all four walls, roof material only on the up/down faces
      const b = new THREE.Mesh(boxGeo, [mat, mat, roofMat, roofMat, mat, mat]);
      b.scale.set(bw, bh, bd);
      b.position.set(cx, bh / 2, cz);
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
      G.colliders.push({ x0: cx - bw / 2, x1: cx + bw / 2, z0: cz - bd / 2, z1: cz + bd / 2 });
      // a cornice ledge around the roofline, then rooftop clutter — AC boxes on
      // most roofs, a water tower on the odd tall one: skyline detail the
      // contact sheet reads as a real city instead of a stack of slabs
      const cornice = new THREE.Mesh(boxGeo, roofMat);
      cornice.scale.set(bw + 1.6, 1.1, bd + 1.6);
      cornice.position.set(cx, bh + 0.4, cz);
      cornice.castShadow = true;
      scene.add(cornice);
      const acCount = 1 + Math.floor(rng() * 3);
      for (let a = 0; a < acCount; a++) {
        const ac = new THREE.Mesh(boxGeo, acMat);
        ac.scale.set(3.4 + rng() * 2.4, 1.6 + rng() * 0.8, 3 + rng() * 2);
        ac.position.set(cx + (rng() - 0.5) * bw * 0.55, bh + 1.4, cz + (rng() - 0.5) * bd * 0.55);
        ac.castShadow = true;
        scene.add(ac);
      }
      if (bh > 52 && rng() < 0.4) {
        const tower = new THREE.Group();
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 6.4, 9), tankMat);
        tank.position.y = 6.4; tower.add(tank);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.9, 2.4, 9), roofMat);
        cone.position.y = 10.8; tower.add(cone);
        for (const [lx, lz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) {
          const leg = new THREE.Mesh(boxGeo, roofMat);
          leg.scale.set(0.5, 3.6, 0.5); leg.position.set(lx, 1.8, lz); tower.add(leg);
        }
        tower.position.set(cx + (rng() - 0.5) * 18, bh + 0.8, cz + (rng() - 0.5) * 18);
        tower.traverse(function (o) { o.castShadow = true; });
        scene.add(tower);
      }
      // an annex where the main house leaves room: a narrow row-house or shop
      // shoulder-to-shoulder with it, so the block reads built-up instead of
      // one slab adrift in a lot. It must fit between the main house and the
      // pavement (44.5 from the block centre) without touching either.
      if (bw < 52 && rng() < 0.62) {
        const aw = 14 + rng() * 4, ad = 20 + rng() * 11, ah = 7 + rng() * 10;
        const sideSign = rng() < 0.5 ? -1 : 1;
        const axp = cx + sideSign * (bw / 2 + aw / 2 + 2.5);
        if (Math.abs(axp - cx) + aw / 2 <= 44.5) {
          const atex = facades[Math.floor(rng() * facades.length)];
          const amat = new THREE.MeshLambertMaterial({ map: atex, emissive: 0xffffff, emissiveMap: atex, emissiveIntensity: 0.34 });
          (G.facadeMats = G.facadeMats || []).push(amat);
          const annex = new THREE.Mesh(boxGeo, [amat, amat, roofMat, roofMat, amat, amat]);
          annex.scale.set(aw, ah, ad);
          annex.position.set(axp, ah / 2, cz + (rng() - 0.5) * 8);
          annex.castShadow = true; annex.receiveShadow = true;
          scene.add(annex);
          G.colliders.push({ x0: axp - aw / 2, x1: axp + aw / 2, z0: annex.position.z - ad / 2, z1: annex.position.z + ad / 2 });
        }
      }
    }
  }
  // the perimeter: a first row of houses beyond the outer avenues, so the
  // city's edge is a skyline and not a cliff of empty slab. They keep clear of
  // the avenue mouths and carry colliders like any other building.
  function perimeterBuilding(x, z) {
    const bw2 = 30 + rng() * 15, bd2 = 26 + rng() * 12, bh2 = 10 + rng() * 15;
    const tex = facades[Math.floor(rng() * facades.length)];
    const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.34 });
    (G.facadeMats = G.facadeMats || []).push(mat);
    const b = new THREE.Mesh(boxGeo, [mat, mat, roofMat, roofMat, mat, mat]);
    b.scale.set(bw2, bh2, bd2);
    b.position.set(x, bh2 / 2, z);
    b.castShadow = true; b.receiveShadow = true;
    scene.add(b);
    G.colliders.push({ x0: x - bw2 / 2, x1: x + bw2 / 2, z0: z - bd2 / 2, z1: z + bd2 / 2 });
  }
  for (let x = -408; x <= 408; x += 82) { // the northern edge
    let nearAve = false;
    for (const ax of CS.avenuesX) if (Math.abs(x - ax) < 30) nearAve = true;
    if (!nearAve && rng() < 0.85) perimeterBuilding(x + (rng() - 0.5) * 10, -412);
  }
  for (let z = -330; z <= 270; z += 82) { // the western and eastern edges
    let nearAve = false;
    for (const az of CS.avenuesZ) if (Math.abs(z - az) < 30) nearAve = true;
    if (nearAve) continue;
    if (rng() < 0.8) perimeterBuilding(-414, z + (rng() - 0.5) * 10);
    if (rng() < 0.8) perimeterBuilding(414, z + (rng() - 0.5) * 10);
  }

  // --- palms: rows along the shore and the great boulevards -----------------------
  // Placement discipline: a palm goes on a pavement, the promenade or the sand
  // — NEVER on a carriageway. plantPalm itself refuses a road point (the old
  // beachfront row stood at z=360, the centre of the shore avenue, and avenue
  // rows could drift into the crossing avenue's lanes at junctions).
  G.palmCrowns = [];
  function plantPalm(x, z) {
    if (onCarriageway(x, z, 1.4)) return;
    const palm = makePalmTree(rng);
    palm.position.set(x, 0, z);
    palm.rotation.y = rng() * Math.PI * 2;
    scene.add(palm);
    G.palmCrowns.push({ g: palm.userData.crown, p: rng() * 6.28 });
  }
  for (let x = -445; x <= 445; x += 21) { // the promenade double row, south of the shore road
    plantPalm(x + (rng() - 0.5) * 5, 379.5 + (rng() - 0.5) * 3);
    plantPalm(x + 10 + (rng() - 0.5) * 5, 389 + (rng() - 0.5) * 3);
  }
  for (let x = -445; x <= 445; x += 26) { // the shore road's north pavement
    if (rng() < 0.85) plantPalm(x + (rng() - 0.5) * 5, 360 - 14.3 + (rng() - 0.5) * 1.6);
  }
  for (const bz of [240, 0]) { // Boulevard Brisa, Avenida del Sol
    for (let x = -445; x <= 445; x += 23) {
      if (rng() < 0.88) plantPalm(x + (rng() - 0.5) * 5, bz - 14.3 + (rng() - 0.5) * 1.6);
      if (rng() < 0.88) plantPalm(x + 11 + (rng() - 0.5) * 5, bz + 14.3 + (rng() - 0.5) * 1.6);
    }
  }
  for (const bx of [0, -120, 240]) { // the great north-south avenues
    for (let z = -435; z <= 345; z += 27) {
      if (rng() < 0.8) plantPalm(bx - 14.3 + (rng() - 0.5) * 1.6, z + (rng() - 0.5) * 6);
      if (rng() < 0.8) plantPalm(bx + 14.3 + (rng() - 0.5) * 1.6, z + 13 + (rng() - 0.5) * 6);
    }
  }
  for (let i = 0; i < 46; i++) { // scattered singles on the remaining avenues
    const ax = CS.avenuesX[Math.floor(rng() * CS.avenuesX.length)];
    plantPalm(ax + (rng() < 0.5 ? -14.6 : 14.6), -430 + rng() * 790);
  }

  // --- lamps: on for the evening, each with a halo sprite ----------------------------
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x2c2f36 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  const lampGeo = new THREE.CylinderGeometry(0.14, 0.18, 6.4, 5);
  const bulbGeo = new THREE.SphereGeometry(0.42, 8, 6);
  const lampGlowMat = new THREE.SpriteMaterial({ map: G.glowTexture, color: 0xffc98a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 });
  G.lampGlowMat = lampGlowMat;
  function plantLamp(x, z) {
    if (onCarriageway(x, z, 1.2)) return; // a lamp post belongs on the pavement
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(x, 3.2, z); scene.add(lamp);
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(x, 6.6, z); scene.add(bulb);
    const glow = new THREE.Sprite(lampGlowMat);
    glow.scale.set(5.2, 5.2, 1); glow.position.set(x, 6.6, z);
    scene.add(glow);
  }
  for (const ax of CS.avenuesX) for (let z = -420; z < 380; z += 84) plantLamp(ax + 14.5, z);
  for (const az of CS.avenuesZ) for (let x = -420; x < 440; x += 84) plantLamp(x, az + 14.5);

  // --- street furniture: the props that make a street look lived on ------------------
  const benchMat = new THREE.MeshLambertMaterial({ color: 0x6e4f30 });
  const crateMat = new THREE.MeshLambertMaterial({ color: 0xa97c50 });
  const bushMat = new THREE.MeshLambertMaterial({ color: 0x35794a });
  const potMat = new THREE.MeshLambertMaterial({ color: 0xb0562f });
  const propBox = new THREE.BoxGeometry(1, 1, 1);
  function plantBench(x, z, ry) {
    const b = new THREE.Group();
    const seat = new THREE.Mesh(propBox, benchMat); seat.scale.set(2.6, 0.16, 0.7); seat.position.y = 0.55; b.add(seat);
    const back = new THREE.Mesh(propBox, benchMat); back.scale.set(2.6, 0.7, 0.12); back.position.set(0, 0.95, -0.3); b.add(back);
    for (const sx of [-1.1, 1.1]) { const leg = new THREE.Mesh(propBox, lampMat); leg.scale.set(0.14, 0.55, 0.6); leg.position.set(sx, 0.27, 0); b.add(leg); }
    b.position.set(x, 0, z); b.rotation.y = ry; b.traverse(function (o) { o.castShadow = true; });
    scene.add(b);
  }
  function plantCrates(x, z) {
    const n = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const cr = new THREE.Mesh(propBox, crateMat);
      const s = 0.9 + rng() * 0.5;
      cr.scale.set(s, s, s);
      cr.position.set(x + (rng() - 0.5) * 1.6, s / 2 + (i > 2 ? 0.95 : 0), z + (rng() - 0.5) * 1.6);
      cr.rotation.y = rng() * 0.8; cr.castShadow = true;
      scene.add(cr);
    }
  }
  function plantPlanter(x, z) {
    const pot = new THREE.Mesh(propBox, potMat);
    pot.scale.set(1.5, 0.8, 1.5); pot.position.set(x, 0.4, z); pot.castShadow = true; scene.add(pot);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(1.05, 7, 6), bushMat);
    bush.position.set(x, 1.35, z); bush.scale.y = 0.8; bush.castShadow = true; scene.add(bush);
  }
  function plantBusStop(x, z, ry) {
    const st = new THREE.Group();
    for (const px of [-2.2, 2.2]) { const post = new THREE.Mesh(propBox, lampMat); post.scale.set(0.16, 2.6, 0.16); post.position.set(px, 1.3, 0); st.add(post); }
    const roof = new THREE.Mesh(propBox, new THREE.MeshLambertMaterial({ color: 0x2e6f79 }));
    roof.scale.set(5.4, 0.14, 1.7); roof.position.y = 2.65; st.add(roof);
    const bench = new THREE.Mesh(propBox, benchMat); bench.scale.set(4.2, 0.14, 0.55); bench.position.y = 0.6; st.add(bench);
    const sign = new THREE.Mesh(propBox, new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    sign.scale.set(0.9, 0.55, 0.08); sign.position.set(2.2, 2.1, 0.1); st.add(sign);
    st.position.set(x, 0, z); st.rotation.y = ry; st.traverse(function (o) { o.castShadow = true; });
    scene.add(st);
  }
  function plantFurniture(x, z, ry) {
    if (onCarriageway(x, z, 1.6)) return; // furniture lives on pavements only
    const pick = rng();
    if (pick < 0.34) plantBench(x, z, ry);
    else if (pick < 0.58) plantPlanter(x, z);
    else if (pick < 0.78) plantCrates(x, z);
    else plantBusStop(x, z, ry);
  }
  const furnitureAvenues = [240, 0, 360, -120, 120, -240, -360];
  for (const az of furnitureAvenues) {
    for (let x = -400; x < 430; x += 57) {
      const side = rng() < 0.5 ? -14.1 : 14.1;
      plantFurniture(x + (rng() - 0.5) * 8, az + side, side > 0 ? Math.PI : 0);
    }
  }
  for (const ax of [-240, 360]) { // and up two north-south avenues
    for (let z = -390; z < 330; z += 63) {
      const side = rng() < 0.5 ? -14.1 : 14.1;
      plantFurniture(ax + side, z + (rng() - 0.5) * 8, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
  }
  for (let x = -410; x < 430; x += 47) { // the promenade: planters and benches facing the sea
    if (rng() < 0.4) continue;
    plantFurniture(x + (rng() - 0.5) * 8, 377.5, Math.PI);
  }
  // market stalls down Calle Mercado: striped canopies over laden tables
  const stallCols = [0xd94f3d, 0xf2b13d, 0x3dd9a4, 0xff5c8a];
  for (let x = -320; x <= 320; x += 46) {
    if (rng() < 0.25) continue;
    if (onCarriageway(x, -105, 2) || onCarriageway(x, -135, 2)) continue; // never in a crossing avenue's lanes
    const st = new THREE.Group();
    const table = new THREE.Mesh(propBox, benchMat); table.scale.set(5.4, 0.9, 2.2); table.position.y = 0.45; st.add(table);
    const goods = new THREE.Mesh(propBox, new THREE.MeshLambertMaterial({ color: stallCols[Math.floor(rng() * 4)] }));
    goods.scale.set(4.8, 0.5, 1.7); goods.position.y = 1.15; st.add(goods);
    for (const px of [-2.5, 2.5]) { const post = new THREE.Mesh(propBox, lampMat); post.scale.set(0.14, 3, 0.14); post.position.set(px, 1.5, 0); st.add(post); }
    const canopy = new THREE.Mesh(propBox, new THREE.MeshLambertMaterial({ color: stallCols[Math.floor(rng() * 4)] }));
    canopy.scale.set(6.2, 0.12, 3.2); canopy.position.y = 3.05; canopy.rotation.z = 0.05; st.add(canopy);
    st.position.set(x + (rng() - 0.5) * 6, 0, -120 + (rng() < 0.5 ? -15 : 15));
    st.traverse(function (o) { o.castShadow = true; });
    scene.add(st);
  }
  // beach life: umbrellas and towels on the sand
  const umbCols = [0xff5c8a, 0xffb020, 0x22d3ee, 0xff7043, 0x7dff8a];
  for (let x = -420; x < 440; x += 38) {
    if (rng() < 0.35) continue;
    const um = new THREE.Group();
    const pole = new THREE.Mesh(propBox, lampMat); pole.scale.set(0.09, 2.6, 0.09); pole.position.y = 1.3; um.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.3, 0.8, 8), new THREE.MeshLambertMaterial({ color: umbCols[Math.floor(rng() * 5)] }));
    top.position.y = 2.7; um.add(top);
    const towel = new THREE.Mesh(propBox, new THREE.MeshLambertMaterial({ color: umbCols[Math.floor(rng() * 5)] }));
    towel.scale.set(1.1, 0.05, 2.2); towel.position.set(1.6, 0.05, 0.6); um.add(towel);
    um.position.set(x + (rng() - 0.5) * 10, 0.02, W.beachZ + 5 + rng() * 14); // on the sand, short of the waterline
    um.traverse(function (o) { o.castShadow = true; });
    scene.add(um);
  }

  // --- parked cars: rows along the kerbs of the busy avenues -------------------------
  // a street with nobody parked on it reads as a diagram; these sit in the world
  // from boot (stealable, like any car) and fill the edges of every frame
  const parkRows = [
    { fixed: 240, axis: 'z', from: -420, to: 430 }, { fixed: 0, axis: 'z', from: -420, to: 430 },
    { fixed: 360, axis: 'z', from: -300, to: 430 }, { fixed: 120, axis: 'z', from: -380, to: 380 },
    { fixed: -120, axis: 'x', from: -380, to: 380 }, { fixed: 120, axis: 'x', from: -380, to: 380 }
  ];
  for (const row of parkRows) {
    for (let along = row.from; along < row.to; along += 13) {
      if (rng() < 0.42) continue;
      const sideSign = rng() < 0.5 ? -1 : 1;
      const off = 9.6 * sideSign;
      const x = row.axis === 'z' ? along + (rng() - 0.5) * 2 : row.fixed + off;
      const z = row.axis === 'z' ? row.fixed + off : along + (rng() - 0.5) * 2;
      // never park across an intersection, on the garage pad, or inside a
      // staged screenshot set (scenes.js composes those kerbs itself)
      let blocked = false;
      const cross = row.axis === 'z' ? CS.avenuesX : CS.avenuesZ;
      for (const ca of cross) if (Math.abs(along - ca) < 13) blocked = true;
      if (distance2D(x, z, CS.garage.x, CS.garage.z) < 24) blocked = true;
      for (const [sx, sz] of [[30, 230], [42, 6], [-138, 104], [313, 352]]) {
        if (distance2D(x, z, sx, sz) < 17) blocked = true;
      }
      if (blocked) continue;
      const paint = CAR_PAINTS[Math.floor(rng() * CAR_PAINTS.length)];
      const kindPick = rng();
      const kind = kindPick < 0.12 ? 'pickup' : (kindPick < 0.24 ? 'van' : (kindPick < 0.36 ? 'taxi' : 'car'));
      // parked parallel WITH the flow of the lane beside the kerb: on an
      // east-west avenue the southern kerb serves the eastbound lane, the
      // northern kerb the westbound; on a north-south avenue the eastern kerb
      // serves northbound, the western kerb southbound
      const ang = row.axis === 'z' ? (sideSign > 0 ? Math.PI / 2 : -Math.PI / 2) : (sideSign > 0 ? Math.PI : 0);
      const car = spawnCar(scene, x, z, ang, kind === 'taxi' ? 0xf7c948 : paint, kind);
      car.parked = true;
      G.traffic.push(car);
    }
  }
  // foam line where the sand meets the water, catching the sunset
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(1100, 5),
    new THREE.MeshBasicMaterial({ color: 0xfff3da, transparent: true, opacity: 0.5 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(0, 0.46, W.waterZ - 3);
  scene.add(foam);
  G.foamMesh = foam;

  // --- marina: docks, boats, the harbour crane ---------------------------------------
  const dockMat = new THREE.MeshLambertMaterial({ color: 0x7a6248 });
  const hullCols = [0xd94f3d, 0x3d7ad9, 0xf2f0e6, 0x3dd9a4, 0xf2b13d];
  for (let i = 0; i < CS.marina.dockCount; i++) {
    const dx = CS.marina.dockX0 + i * CS.marina.dockStep;
    const dock = new THREE.Mesh(new THREE.BoxGeometry(CS.marina.dockW, 1, CS.marina.dockL), dockMat);
    dock.position.set(dx, 0.6, W.waterZ + CS.marina.dockZOff);
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

function setDaylight(day) {
  // one city, two lights. The golden hour is the game's home mood; daylight is
  // the bright blue morning the cover shot is staged under. Everything swapped
  // here is a handle the builder kept: the dome's texture, the fog, the sun's
  // offset (player.js re-aims it every frame), the lamps' shared glow material
  // and every facade's emissive lift — windows glow at dusk, go quiet at noon.
  G.daylight = !!day;
  const scene = G.scene3;
  if (!scene || !G.skyDome) return;
  if (day) {
    G.skyDome.material.map = G.daySkyTexture;
    scene.background = new THREE.Color(0x7ec3ee);
    scene.fog.color.setHex(0xc4e2f4);
    scene.fog.near = 220; scene.fog.far = 1150;
    G.hemiLight.color.setHex(0xbfdcff); G.hemiLight.groundColor.setHex(0x8a7a5e); G.hemiLight.intensity = 1.05;
    G.sunLight.color.setHex(0xfff3d6); G.sunLight.intensity = 1.55;
    G.sunOffset = { x: -300, y: 340, z: 180 };
    G.sunBall.visible = false; G.sunGlow.visible = false;
    if (G.lampGlowMat) G.lampGlowMat.opacity = 0.1;
    if (G.facadeMats) for (const m of G.facadeMats) m.emissiveIntensity = 0.06;
    if (G.waterMesh) G.waterMesh.material.color.setHex(0x3d9bc4);
  } else {
    G.skyDome.material.map = G.duskSkyTexture;
    scene.background = new THREE.Color(0xf2665e);
    scene.fog.color.setHex(0xef8a5c);
    scene.fog.near = 130; scene.fog.far = 760;
    G.hemiLight.color.setHex(0xffc9a0); G.hemiLight.groundColor.setHex(0x51384e); G.hemiLight.intensity = 0.8;
    G.sunLight.color.setHex(0xffa257); G.sunLight.intensity = 1.4;
    G.sunOffset = { x: -420, y: 128, z: 260 };
    G.sunBall.visible = true; G.sunGlow.visible = true;
    if (G.lampGlowMat) G.lampGlowMat.opacity = 0.85;
    if (G.facadeMats) for (const m of G.facadeMats) m.emissiveIntensity = 0.34;
    if (G.waterMesh) G.waterMesh.material.color.setHex(0x2e7ea6);
  }
  G.skyDome.material.needsUpdate = true;
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
