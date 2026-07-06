// Salvamento: orar num altar grava a jornada no localStorage

const KEY = 'lenda-aurea-save';

export function serializePlayer(p) {
  return {
    level: p.level,
    xp: p.xp,
    xpNext: p.xpNext,
    gold: p.gold,
    potions: p.potions,
    inventory: p.inventory,
    equip: p.equip,
    x: p.x,
    y: p.y,
  };
}

export function applyPlayer(p, data, keepPos = false) {
  p.level = data.level;
  p.xp = data.xp;
  p.xpNext = data.xpNext;
  p.gold = data.gold;
  p.potions = data.potions;
  p.inventory = data.inventory || [];
  p.equip = data.equip || {};
  if (keepPos) {
    p.x = data.x;
    p.y = data.y;
  }
  p.refreshStats();
  p.hp = p.hpMax;
}

export function saveGame(player) {
  try {
    localStorage.setItem(KEY, JSON.stringify(serializePlayer(player)));
    return true;
  } catch {
    return false;
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
