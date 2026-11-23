// Costa Serena — save.js: the save game. Money, respect, finished jobs, the
// garage's upgrade levels and whether the Serena GT is owned ride in localStorage
// under one key; the start screen offers Continue when a save exists. Saving
// happens on mission completion, garage purchases and after a hospital visit —
// never mid-chase, so a save can never strand the player inside a pursuit.

const SAVE_KEY = 'costaSerenaSaveV1';

function saveGame() {
  try {
    const data = {
      money: G.money, respect: G.respect, missionsDone: G.missionsDone,
      hasPersonalCar: !!G.personalCar,
      personalEngine: G.personalCar ? G.personalCar.engineLevel : 1,
      personalArmour: G.personalCar ? G.personalCar.armourLevel : 0,
      carsStolen: G.carsStolen, kills: G.kills
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable: the game simply runs unsaved */ }
}

function loadSaveData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function applySaveData(data) {
  if (!data) return false;
  G.money = data.money != null ? data.money : G.money;
  G.respect = data.respect || 0;
  G.missionsDone = data.missionsDone || [];
  G.carsStolen = data.carsStolen || 0;
  G.kills = data.kills || 0;
  if (data.hasPersonalCar && !G.personalCar) {
    buyPersonalCar();
    if (G.personalCar) {
      G.personalCar.engineLevel = data.personalEngine || 1;
      G.personalCar.armourLevel = data.personalArmour || 0;
    }
  }
  return true;
}

function wipeSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nothing to wipe */ }
}
