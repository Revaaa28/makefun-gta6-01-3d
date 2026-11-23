// Costa Serena — garage.js: Taller Brisa, the Centro garage. Drive or walk onto
// the forecourt pad and press G: engine and armour upgrades for the car you came
// in, a respray, a repair, and the Serena GT — the fastest car in the city —
// waiting on the pad once bought. Everything is priced against G.money and the
// result is written into the save by save.js.

let garageOpen = false;

function garageTargetCar() {
  if (G.inCar) return G.inCar;
  const near = nearestCarToPlayer(9);
  return near;
}

const GARAGE_GOODS = [
  { id: 'engine', name: 'Engine tune', desc: 'Top speed +16% a level (max 3)', price: function (car) { return 400 + 250 * (car.engineLevel || 0); }, can: function (car) { return (car.engineLevel || 0) < 3; }, apply: function (car) { car.engineLevel = (car.engineLevel || 0) + 1; } },
  { id: 'armour', name: 'Panel armour', desc: '+60 hull a level (max 3)', price: function (car) { return 500 + 300 * (car.armourLevel || 0); }, can: function (car) { return (car.armourLevel || 0) < 3; }, apply: function (car) { car.armourLevel = (car.armourLevel || 0) + 1; car.health = Math.min(carMaxHealth(car), car.health + 60); } },
  { id: 'repair', name: 'Full repair', desc: 'Back to a full hull', price: function () { return 120; }, can: function (car) { return car.health < carMaxHealth(car); }, apply: function (car) { car.health = carMaxHealth(car); car.dead = false; } },
  { id: 'paint', name: 'Respray', desc: 'A fresh colour, questions unasked', price: function () { return 150; }, can: function () { return true; }, apply: function (car) { car.paint = CAR_PAINTS[Math.floor(Math.random() * CAR_PAINTS.length)]; car.mesh.children[0].material = new THREE.MeshLambertMaterial({ color: car.paint }); } },
  { id: 'gt', name: 'Serena GT (buy)', desc: 'Your own car. It waits on this pad, always.', price: function () { return 2500; }, can: function () { return !G.personalCar; }, apply: function () { buyPersonalCar(); } }
];

function buyPersonalCar() {
  const car = spawnCar(G.scene3, CS.garage.x + 10, CS.garage.z + 4, Math.PI / 2, 0xd92632, 'gt', 'Serena GT');
  car.engineLevel = 1;
  G.personalCar = car;
  showToast('The Serena GT is yours — it waits at Taller Brisa', 3.4);
}

function renderGaragePanel() {
  const rows = document.getElementById('garage-rows');
  const car = garageTargetCar();
  rows.innerHTML = '';
  if (!car && !true) { rows.innerHTML = '<div class="shop-row">Bring a car to the pad first.</div>'; return; }
  for (const good of GARAGE_GOODS) {
    const row = document.createElement('div');
    row.className = 'shop-row';
    const target = good.id === 'gt' ? null : car;
    const price = good.price(target || { engineLevel: 0, armourLevel: 0, health: 0 });
    const ok = car || good.id === 'gt' ? (good.can(target || car || {}) && G.money >= price) : false;
    row.innerHTML = '<span><b>' + good.name + '</b><br><small>' + good.desc + '</small></span>';
    const btn = document.createElement('button');
    btn.textContent = '$' + price;
    btn.disabled = !ok;
    btn.addEventListener('click', function () {
      if (G.money < price) return;
      G.money -= price;
      good.apply(target || car);
      playSfx('buy');
      showToast(good.name + ' fitted', 1.8);
      saveGame();
      renderGaragePanel();
    });
    row.appendChild(btn);
    rows.appendChild(row);
  }
  if (!car) {
    const note = document.createElement('div');
    note.className = 'shop-row';
    note.textContent = 'Bring a car onto the pad to tune it.';
    rows.appendChild(note);
  }
}

function setGarageOpen(open) {
  garageOpen = open;
  document.getElementById('garage').style.display = open ? 'block' : 'none';
  if (open) renderGaragePanel();
}

function nearGarage() {
  return distance2D(G.player.pos.x, G.player.pos.z, CS.garage.x, CS.garage.z) < 17;
}

function bindGarageInput() {
  window.addEventListener('keydown', function (e) {
    if (e.code !== 'KeyG' || !G.started || G.paused) return;
    if (garageOpen) { setGarageOpen(false); return; }
    if (nearGarage()) setGarageOpen(true);
    else if (!G.inCar) showToast('The garage is Taller Brisa, in Centro', 2);
  });
}
