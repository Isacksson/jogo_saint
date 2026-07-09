// Loot: raridades, geração de drops, itens no chão e seus ícones em pixel art

import { SCALE } from './constants.js';
import { makeSprite } from './sprites.js';
import { images } from './assets.js';
import { sfx } from './audio.js';

export const RARITY = [
  { name: 'Comum', color: '#e8e0d0' },
  { name: 'Abençoado', color: '#6aa8f0' },
  { name: 'Consagrado', color: '#f0c040' },
];

// ---------- ícones ----------

const PAL = {
  D: '#2a2118', G: '#d8a020', y: '#f0d060', g: '#6a4a10',
  R: '#c02830', r: '#8a1820', w: '#e8d8d0',
  s: '#d0d4dc', h: '#7a5230',
  W: '#ece4d2', X: '#c23428',
  A: '#98a2ac', a: '#6a747e',
};

const COIN = [
  '.....DDDDDD.....',
  '....DGGGGGGD....',
  '...DGGGyyGGGD...',
  '...DGGGyyGGGD...',
  '...DGyyyyyyGD...',
  '...DGyyyyyyGD...',
  '...DGGGyyGGGD...',
  '...DGGGyyGGGD...',
  '....DGGGGGGD....',
  '.....DDDDDD.....',
];

const POTION = [
  '......DDDD......',
  '......DwwD......',
  '......DwwD......',
  '.....DDwwDD.....',
  '....DwRRRRwD....',
  '...DwRRRRRRwD...',
  '...DRRRrrRRRD...',
  '...DRRRRRRRRD...',
  '....DRRRRRRD....',
  '.....DDDDDD.....',
];

const SWORD = [
  '.......DD.......',
  '......DssD......',
  '......DssD......',
  '......DssD......',
  '......DssD......',
  '......DssD......',
  '......DssD......',
  '....DDDssDDD....',
  '......DhhD......',
  '......DhhD......',
  '......DGGD......',
];

const SHIELD = [
  '...DDDDDDDDDD...',
  '..DWWWWXXWWWWD..',
  '..DWWWWXXWWWWD..',
  '..DWXXXXXXXXWD..',
  '..DWWWWXXWWWWD..',
  '...DWWWXXWWWD...',
  '...DWWWXXWWWD...',
  '....DWWXXWWD....',
  '.....DWXXWD.....',
  '......DDDD......',
];

const ARMOR = [
  '..DAADDDDDDAAD..',
  '..DAAAAAAAAAAD..',
  '..DAAAAAAAAAAD..',
  '...DAAAAAAAAD...',
  '...DAAaaaaAAD...',
  '...DAAaaaaAAD...',
  '....DAAAAAAD....',
  '....DDDDDDDD....',
];

const KEY = [
  '....DDDD........',
  '...DGGGGD.......',
  '...DGyyGD.......',
  '...DGGGGD.......',
  '....DGGD........',
  '....DGGD........',
  '....DGGDD.......',
  '....DGGGGD......',
  '....DGGDD.......',
  '....DGGGGD......',
  '.....DDDD.......',
];

const MEDAL = [
  '.....DrrrrD.....',
  '.....Dr..rD.....',
  '....Dr....rD....',
  '....DDGGGGDD....',
  '....DGGyyGGD....',
  '....DGyyyyGD....',
  '....DGyyyyGD....',
  '....DGGyyGGD....',
  '.....DGGGGD.....',
  '......DDDD......',
];

let iconCache = null;

export function buildItemSprites() {
  if (!iconCache) {
    iconCache = {
      gold: makeSprite(COIN, PAL),
      potion: makeSprite(POTION, PAL),
      arma: makeSprite(SWORD, PAL),
      escudo: makeSprite(SHIELD, PAL),
      armadura: makeSprite(ARMOR, PAL),
      medalha: makeSprite(MEDAL, PAL),
      chave: makeSprite(KEY, PAL),
    };
  }
  return iconCache;
}

// ---------- geração de drops ----------

const BASES = {
  arma: { names: ['Gládio', 'Espada Longa', 'Lâmina de Éfeso'], values: [2, 4, 7], unit: 'de dano' },
  escudo: { names: ['Escudo Redondo', 'Escudo do Legionário', 'Pavês'], values: [1, 2, 4], unit: 'de defesa' },
  armadura: { names: ['Cota de Malha', 'Couraça', 'Loriga'], values: [15, 30, 50], unit: 'de vida máx.' },
  medalha: { names: ['Medalha de Estanho', 'Medalha de Prata', 'Relicário'], values: [25, 50, 100], unit: '% de fúria' },
};

const SLOTS = Object.keys(BASES);

export function describeItem(item) {
  const base = BASES[item.slot];
  return `+${item.value} ${base.unit}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// rola o que um demônio deixa cair (ou null)
export function rollDrop() {
  const r = Math.random();
  if (r < 0.5) {
    return { kind: 'gold', amount: 8 + Math.floor(Math.random() * 13) };
  }
  if (r < 0.68) {
    return { kind: 'potion' };
  }
  if (r < 0.9) {
    const rr = Math.random();
    const rarity = rr < 0.62 ? 0 : rr < 0.9 ? 1 : 2;
    const slot = pick(SLOTS);
    const base = BASES[slot];
    return {
      kind: 'equip',
      slot,
      rarity,
      name: pick(base.names),
      value: base.values[rarity] + Math.floor(Math.random() * 2),
    };
  }
  return null;
}

// ---------- item caído no chão ----------

const ICON_PX = 16 * SCALE * 0.55;

export class GroundItem {
  constructor(x, y, item) {
    this.x = x + (Math.random() - 0.5) * 24;
    this.y = y + (Math.random() - 0.5) * 24;
    this.item = item;
    this.t = Math.random() * 10;
    this.dead = false;
    this.fullMsgT = 0;
  }

  update(dt, world) {
    this.t += dt;
    this.fullMsgT = Math.max(0, this.fullMsgT - dt);
    const p = world.player;
    if (!p.alive) return;
    const dx = p.x - this.x;
    const dy = (p.y - 12) - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // magnetismo: o item voa até o cavaleiro
    if (dist < 70) {
      this.x += (dx / dist) * 260 * dt;
      this.y += (dy / dist) * 260 * dt;
    }
    if (dist > 26) return;

    const it = this.item;
    if (it.kind !== 'equip' || p.inventory.length < 10) sfx('pickup');
    if (it.kind === 'chave') {
      world.flags[it.flag || 'temChave'] = true;
      world.fx.text(p.x, p.y - 54, it.label || '✝ Chave das Catacumbas!', '#f0c040');
      world.fx.burst(this.x, this.y, '#f0c040', 14, 160);
      this.dead = true;
    } else if (it.kind === 'gold') {
      p.gold += it.amount;
      world.fx.text(p.x, p.y - 54, `+${it.amount} denários`, '#f0d060');
      this.dead = true;
    } else if (it.kind === 'potion') {
      p.potions++;
      world.fx.text(p.x, p.y - 54, '+1 poção (Q)', '#f08060');
      this.dead = true;
    } else if (p.inventory.length < 10) {
      p.inventory.push(it);
      world.fx.text(p.x, p.y - 54, `${it.name}!`, RARITY[it.rarity].color);
      this.dead = true;
    } else if (this.fullMsgT <= 0) {
      world.fx.text(p.x, p.y - 54, 'Bolsa cheia! (I)', '#c0b090');
      this.fullMsgT = 1.5;
    }
  }

  render(ctx, cam) {
    // moeda, poção e chave usam a arte do pack; equipamento usa os ícones da UI
    const PACK = { gold: 'coin', potion: 'potion', chave: 'key' };
    const icon = this.item.kind === 'equip'
      ? buildItemSprites()[this.item.slot]
      : images[PACK[this.item.kind]];
    const bob = Math.sin(this.t * 4) * 3;
    const x = this.x - cam.x;
    const y = this.y - cam.y + bob;

    // brilho no chão, na cor da raridade
    const color = this.item.kind === 'equip'
      ? RARITY[this.item.rarity].color
      : this.item.kind === 'potion' ? '#f08060' : '#f0d060';
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.t * 5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(this.x - cam.x, this.y - cam.y + 12, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const w = this.item.kind === 'equip' ? ICON_PX : icon.width * SCALE;
    const h = this.item.kind === 'equip'
      ? Math.round(icon.height / icon.width * ICON_PX)
      : icon.height * SCALE;
    ctx.drawImage(icon, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
  }
}
