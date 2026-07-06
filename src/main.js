// A Lenda Áurea: Jorge e o Dragão — boot, mundo, mapas e game loop

import { TILE, TILE_PX, VIEW_W, VIEW_H, T, SCALE } from './constants.js';
import { input } from './input.js';
import { buildTiles, buildAltarSprite } from './sprites.js';
import { GameMap } from './map.js';
import { MAP_DEFS } from './maps.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Imundo, ImundoChefe, Serpe } from './enemies.js';
import { Npc } from './npc.js';
import { Fx } from './fx.js';
import {
  renderHud, renderTitle, renderDeath, renderVictory,
  renderLocation, renderDialogue,
} from './hud.js';
import { renderInventory } from './inventory.js';
import { serializeWorld, applyPlayer, saveGame, loadSave } from './save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const tiles = buildTiles();
const camera = new Camera();

// mapas e NPCs são construídos uma única vez e reaproveitados
const gameMaps = {};
const mapNpcs = {};

function getMap(id) {
  if (!gameMaps[id]) {
    gameMaps[id] = new GameMap(MAP_DEFS[id]);
    mapNpcs[id] = (MAP_DEFS[id].npcs || []).map((d) => new Npc(d));
  }
  return gameMaps[id];
}

const ENEMY_TYPES = { imundo: Imundo, serpe: Serpe, chefe: ImundoChefe };

const world = {
  mapId: null,
  map: null,
  fx: new Fx(),
  player: null,
  enemies: [],
  projectiles: [],
  groundItems: [],
  altars: [],
  npcs: [],
  portals: [],
  kills: 0,
  total: 0,
  flags: {},
  mapStates: {},
};
// exposto para depuração e testes automatizados
window.world = world;

// acha o tile livre mais próximo (spawn nunca dentro de parede/água)
function findFree(map, tx, ty) {
  for (let r = 0; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (!map.isSolidTile(tx + dx, ty + dy)) return [tx + dx, ty + dy];
      }
    }
  }
  return [tx, ty];
}

function enterMap(id, tx, ty) {
  // guarda o estado do mapa que estamos deixando
  if (world.mapId) {
    world.mapStates[world.mapId] = {
      enemies: world.enemies,
      groundItems: world.groundItems,
      kills: world.kills,
    };
  }

  const def = MAP_DEFS[id];
  const map = getMap(id);
  world.mapId = id;
  world.map = map;
  world.portals = def.portals || [];
  world.npcs = mapNpcs[id];
  world.altars = (def.altars || []).map(([ax, ay]) => {
    const [fx0, fy0] = findFree(map, ax, ay);
    return { x: (fx0 + 0.5) * TILE_PX, y: (fy0 + 0.5) * TILE_PX };
  });
  world.projectiles = [];
  world.total = (def.spawns || []).length;

  // o portão das catacumbas permanece aberto se já foi destrancado
  if (id === 'pantano' && world.flags.catacumbasAbertas) openGate(map);

  const st = world.mapStates[id];
  if (st) {
    world.enemies = st.enemies;
    world.groundItems = st.groundItems;
    world.kills = st.kills;
  } else {
    world.kills = 0;
    world.groundItems = [];
    world.enemies = (def.spawns || []).map(([type, sx, sy]) => {
      const [fx0, fy0] = findFree(map, sx, sy);
      return new ENEMY_TYPES[type](fx0, fy0);
    });
  }

  const [px, py] = findFree(map, tx, ty);
  world.player.x = (px + 0.5) * TILE_PX;
  world.player.y = (py + 0.5) * TILE_PX;
  world.player.kbX = 0;
  world.player.kbY = 0;
  camera.follow(world.player.x, world.player.y, 0, map, true);
  locName = def.name;
  locTime = 3.5;
}

function openGate(map) {
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (map.get(x, y) === T.GATE) map.set(x, y, T.STONE);
    }
  }
}

// portão trancado: interação e aviso
function gateCenter() {
  const map = world.map;
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (map.get(x, y) === T.GATE) {
        sx += (x + 0.5) * TILE_PX;
        sy += (y + 0.5) * TILE_PX;
        n++;
      }
    }
  }
  return n ? { x: sx / n, y: sy / n } : null;
}

function fullReset(data) {
  world.mapStates = {};
  world.mapId = null;
  world.fx = new Fx();
  world.player = new Player(13, 20);
  if (data) applyPlayer(world.player, data, false);
  enterMap('capadocia', 13, 20);
  deathTime = 0;
  invOpen = false;
  dlg = null;
}

let elapsed = 0;
let deathTime = 0;
let invOpen = false;
let invSel = 0;
let dlg = null;
let locName = '';
let locTime = 0;
let last = performance.now();

const saved = loadSave();
if (saved) {
  world.flags = saved.flags || {};
  world.player = new Player(13, 20);
  applyPlayer(world.player, saved, false);
  enterMap(saved.mapId || 'capadocia', Math.floor(saved.x / TILE_PX), Math.floor(saved.y / TILE_PX));
  world.fx.text(world.player.x, world.player.y - 60, 'Jornada restaurada', '#e8dcb8');
} else {
  world.player = new Player(13, 20);
  enterMap('capadocia', 13, 20);
}

function tryInteract() {
  const p = world.player;

  // conversar com quem estiver perto
  for (const npc of world.npcs) {
    if (npc.isNear(p)) {
      dlg = { name: npc.name, lines: npc.getLines(world), idx: 0 };
      return;
    }
  }

  // orar num altar
  for (const a of world.altars) {
    if (Math.hypot(p.x - a.x, p.y - a.y) < 60) {
      p.hp = p.hpMax;
      const ok = saveGame(world);
      world.fx.text(a.x, a.y - 70, ok ? '✝ Jornada salva' : '✝ Restaurado', '#f8d860');
      world.fx.burst(a.x, a.y - 30, '#f0c040', 18, 160);
      return;
    }
  }

  // destrancar o portão das catacumbas
  const gate = gateCenter();
  if (gate && Math.hypot(p.x - gate.x, p.y - gate.y) < 130) {
    if (world.flags.temChave) {
      openGate(world.map);
      world.flags.catacumbasAbertas = true;
      world.fx.text(gate.x, gate.y - 40, 'O portão range e cede...', '#e8dcb8');
      world.fx.burst(gate.x, gate.y, '#c8c8d0', 16, 140);
      world.fx.addShake(4);
    } else {
      world.fx.text(gate.x, gate.y - 40, 'Trancado. Os imundos levaram a chave...', '#c0b090');
    }
  }
}

function checkPortals() {
  const p = world.player;
  const tx = Math.floor(p.x / TILE_PX);
  const ty = Math.floor(p.y / TILE_PX);
  for (const portal of world.portals) {
    if (tx >= portal.x && tx < portal.x + portal.w && ty >= portal.y && ty < portal.y + portal.h) {
      enterMap(portal.to, portal.tx, portal.ty);
      return;
    }
  }
}

function renderMap(cam) {
  const map = world.map;
  const x0 = Math.floor(cam.x / TILE_PX);
  const y0 = Math.floor(cam.y / TILE_PX);
  const x1 = Math.ceil((cam.x + VIEW_W) / TILE_PX);
  const y1 = Math.ceil((cam.y + VIEW_H) / TILE_PX);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const type = map.get(tx, ty);
      const frames = tiles[type];
      let frame;
      if (type === T.WATER || type === T.POISON) {
        frame = frames[Math.floor(elapsed * 1.6) % frames.length]; // ondulação
      } else {
        frame = frames[(tx * 7 + ty * 13) % frames.length]; // variação fixa
      }
      ctx.drawImage(
        frame, 0, 0, TILE, TILE,
        Math.round(tx * TILE_PX - cam.x),
        Math.round(ty * TILE_PX - cam.y),
        TILE_PX, TILE_PX
      );
    }
  }
}

function renderAltars(cam) {
  const sprite = buildAltarSprite();
  const px = 16 * SCALE;
  for (const a of world.altars) {
    const pulse = 0.16 + 0.08 * Math.sin(elapsed * 2.5);
    const g = ctx.createRadialGradient(a.x - cam.x, a.y - cam.y - 10, 4, a.x - cam.x, a.y - cam.y - 10, 46);
    g.addColorStop(0, `rgba(248, 220, 120, ${pulse})`);
    g.addColorStop(1, 'rgba(248, 220, 120, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(a.x - cam.x - 46, a.y - cam.y - 56, 92, 92);
    ctx.drawImage(sprite, Math.round(a.x - cam.x - px / 2), Math.round(a.y - cam.y - px + 8), px, px);

    const p = world.player;
    if (p.alive && Math.hypot(p.x - a.x, p.y - a.y) < 60) {
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0e0b0';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText('E — Orar', a.x - cam.x, a.y - cam.y - px - 2);
      ctx.fillText('E — Orar', a.x - cam.x, a.y - cam.y - px - 2);
    }
  }
}

// escuridão das catacumbas: só a luz da tocha em volta do cavaleiro
function renderDarkness(cam) {
  const p = world.player;
  const x = p.x - cam.x;
  const y = p.y - cam.y - 12;
  const flicker = 6 * Math.sin(elapsed * 9) + 4 * Math.sin(elapsed * 23);
  const g = ctx.createRadialGradient(x, y, 60, x, y, 240 + flicker);
  g.addColorStop(0, 'rgba(4, 3, 8, 0)');
  g.addColorStop(0.55, 'rgba(4, 3, 8, 0.45)');
  g.addColorStop(1, 'rgba(4, 3, 8, 0.93)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;
  locTime = Math.max(0, locTime - dt);

  const player = world.player;

  // --- update ---
  if (dlg) {
    // diálogo aberto: só avançar/fechar
    if (input.wasPressed('interact') || input.wasPressed('attack')) {
      dlg.idx++;
      if (dlg.idx >= dlg.lines.length) dlg = null;
    }
  } else if (invOpen) {
    // inventário aberto: navegação da bolsa
    if (input.wasPressed('inventory')) invOpen = false;
    const n = player.inventory.length;
    if (n > 0) {
      if (input.wasPressed('up')) invSel = (invSel + n - 1) % n;
      if (input.wasPressed('down')) invSel = (invSel + 1) % n;
      if (input.wasPressed('interact')) {
        player.equipItem(invSel, world);
        invSel = Math.min(invSel, Math.max(0, player.inventory.length - 1));
      }
      if (input.wasPressed('heavy')) {
        player.inventory.splice(invSel, 1);
        invSel = Math.min(invSel, Math.max(0, player.inventory.length - 1));
      }
    }
  } else {
    if (input.wasPressed('inventory') && player.alive) {
      invOpen = true;
      invSel = 0;
    }
    player.update(dt, world);
    if (player.alive && player.state === 'normal' && input.wasPressed('interact')) tryInteract();
    if (input.wasPressed('potion')) player.usePotion(world);
    for (const e of world.enemies) e.update(dt, world);
    for (const p of world.projectiles) p.update(dt, world);
    world.projectiles = world.projectiles.filter((p) => !p.dead);
    for (const g of world.groundItems) g.update(dt, world);
    world.groundItems = world.groundItems.filter((g) => !g.dead);
    world.fx.update(dt);
    if (player.alive) checkPortals();
    camera.follow(player.x, player.y, dt, world.map);

    if (!player.alive) {
      deathTime += dt;
      // a morte preserva a jornada (nível, ouro, itens), mas o mal renasce
      if (input.wasPressed('interact')) fullReset(serializeWorld(world));
    }
  }

  // --- render ---
  const shake = invOpen || dlg ? 0 : world.fx.shake;
  const cam = {
    x: camera.x + (Math.random() - 0.5) * shake,
    y: camera.y + (Math.random() - 0.5) * shake,
  };

  ctx.fillStyle = '#12100d';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  renderMap(cam);
  renderAltars(cam);
  for (const g of world.groundItems) g.render(ctx, cam);

  // entidades ordenadas por Y (quem está mais ao sul desenha por cima)
  const entities = [...world.enemies.filter((e) => e.alive), ...world.npcs, world.player];
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) {
    if (e instanceof Npc) e.render(ctx, cam, world, elapsed);
    else e.render(ctx, cam);
  }

  for (const p of world.projectiles) p.render(ctx, cam);
  world.fx.render(ctx, cam);
  world.fx.renderTexts(ctx, cam);

  if (world.mapId === 'catacumbas') renderDarkness(cam);

  renderHud(ctx, world.player, world, elapsed);
  renderTitle(ctx, Math.min(1, Math.max(0, (6 - elapsed) / 2)));
  renderLocation(ctx, locName, locTime);
  if (world.total > 0 && world.kills >= world.total) renderVictory(ctx, elapsed);
  if (!world.player.alive) renderDeath(ctx, deathTime);
  if (invOpen) renderInventory(ctx, world.player, invSel);
  if (dlg) renderDialogue(ctx, dlg);

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
