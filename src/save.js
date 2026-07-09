// Salvamento: orar num altar grava a jornada no localStorage

import { Spear } from './spear.js';

const KEY = 'lenda-aurea-save';

export function serializeWorld(world) {
  const p = world.player;
  return {
    level: p.level,
    xp: p.xp,
    xpNext: p.xpNext,
    gold: p.gold,
    potions: p.potions,
    inventory: p.inventory,
    equip: p.equip,
    spear: p.spear.toJSON(),
    x: p.x,
    y: p.y,
    mapId: world.mapId,
    flags: world.flags,
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
  p.spear = Spear.from(data.spear);
  if (keepPos) {
    p.x = data.x;
    p.y = data.y;
  }
  p.refreshStats();
  p.hp = p.hpMax;
}

export function saveGame(world) {
  try {
    localStorage.setItem(KEY, JSON.stringify(serializeWorld(world)));
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
