// A Lenda Áurea: Jorge e o Dragão — boot, mundo e game loop

import { TILE, TILE_PX, VIEW_W, VIEW_H, T, SCALE } from './constants.js';
import { input } from './input.js';
import { buildTiles, buildAltarSprite } from './sprites.js';
import { GameMap } from './map.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Imundo, Serpe } from './enemies.js';
import { Fx } from './fx.js';
import { renderHud, renderTitle, renderDeath, renderVictory } from './hud.js';
import { renderInventory } from './inventory.js';
import { serializePlayer, applyPlayer, saveGame, loadSave } from './save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const tiles = buildTiles();
const map = new GameMap();
const camera = new Camera();

const SPAWNS = [
  ['imundo', 22, 8], ['imundo', 24, 9], ['imundo', 23, 11],
  ['serpe', 8, 8], ['serpe', 6, 12],
  ['imundo', 40, 16], ['serpe', 41, 14],
  ['imundo', 34, 24], ['imundo', 36, 25],
  ['imundo', 20, 28], ['imundo', 18, 30], ['serpe', 30, 30],
];

const ALTAR_TILES = [[15, 16], [36, 15], [20, 29]];

// acha o tile livre mais próximo (spawn nunca dentro de árvore/água)
function findFree(tx, ty) {
  for (let r = 0; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (!map.isSolidTile(tx + dx, ty + dy)) return [tx + dx, ty + dy];
      }
    }
  }
  return [tx, ty];
}

const world = {
  map,
  fx: new Fx(),
  player: null,
  enemies: [],
  projectiles: [],
  groundItems: [],
  altars: ALTAR_TILES.map(([tx, ty]) => {
    const [fx0, fy0] = findFree(tx, ty);
    return { x: (fx0 + 0.5) * TILE_PX, y: (fy0 + 0.5) * TILE_PX };
  }),
  kills: 0,
  total: SPAWNS.length,
};
// exposto para depuração e testes automatizados
window.world = world;

function reset(data = null, keepPos = false) {
  world.fx = new Fx();
  world.player = new Player(13, 20); // nasce no cruzamento das estradas
  world.projectiles = [];
  world.groundItems = [];
  world.kills = 0;
  world.enemies = SPAWNS.map(([type, tx, ty]) => {
    const [fx0, fy0] = findFree(tx, ty);
    return type === 'imundo' ? new Imundo(fx0, fy0) : new Serpe(fx0, fy0);
  });
  if (data) applyPlayer(world.player, data, keepPos);
  camera.follow(world.player.x, world.player.y, 0, true);
  deathTime = 0;
  invOpen = false;
}

let elapsed = 0;
let deathTime = 0;
let invOpen = false;
let invSel = 0;
let last = performance.now();

const saved = loadSave();
reset(saved, true);
if (saved) world.fx.text(world.player.x, world.player.y - 60, 'Jornada restaurada', '#e8dcb8');

function renderMap(cam) {
  const x0 = Math.floor(cam.x / TILE_PX);
  const y0 = Math.floor(cam.y / TILE_PX);
  const x1 = Math.ceil((cam.x + VIEW_W) / TILE_PX);
  const y1 = Math.ceil((cam.y + VIEW_H) / TILE_PX);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const type = map.get(tx, ty);
      const frames = tiles[type];
      let frame;
      if (type === T.WATER) {
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
    // halo de santidade
    const pulse = 0.16 + 0.08 * Math.sin(elapsed * 2.5);
    const g = ctx.createRadialGradient(a.x - cam.x, a.y - cam.y - 10, 4, a.x - cam.x, a.y - cam.y - 10, 46);
    g.addColorStop(0, `rgba(248, 220, 120, ${pulse})`);
    g.addColorStop(1, 'rgba(248, 220, 120, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(a.x - cam.x - 46, a.y - cam.y - 56, 92, 92);
    ctx.drawImage(sprite, Math.round(a.x - cam.x - px / 2), Math.round(a.y - cam.y - px + 8), px, px);

    // convite à oração
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

function tryPray() {
  const p = world.player;
  for (const a of world.altars) {
    if (Math.hypot(p.x - a.x, p.y - a.y) < 60) {
      p.hp = p.hpMax;
      const ok = saveGame(p);
      world.fx.text(a.x, a.y - 70, ok ? '✝ Jornada salva' : '✝ Restaurado', '#f8d860');
      world.fx.burst(a.x, a.y - 30, '#f0c040', 18, 160);
      return true;
    }
  }
  return false;
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;

  const player = world.player;

  // --- update ---
  if (input.wasPressed('inventory') && player.alive) {
    invOpen = !invOpen;
    invSel = 0;
  }

  if (invOpen) {
    // jogo pausado: só navegação da bolsa
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
    player.update(dt, world);
    if (player.alive && player.state === 'normal' && input.wasPressed('interact')) tryPray();
    if (input.wasPressed('potion')) player.usePotion(world);
    for (const e of world.enemies) e.update(dt, world);
    for (const p of world.projectiles) p.update(dt, world);
    world.projectiles = world.projectiles.filter((p) => !p.dead);
    for (const g of world.groundItems) g.update(dt, world);
    world.groundItems = world.groundItems.filter((g) => !g.dead);
    world.fx.update(dt);
    camera.follow(player.x, player.y, dt);

    if (!player.alive) {
      deathTime += dt;
      // a morte preserva a jornada (nível, ouro, itens), mas o mal renasce
      if (input.wasPressed('interact')) reset(serializePlayer(player), false);
    }
  }

  // --- render ---
  const shake = invOpen ? 0 : world.fx.shake;
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
  const entities = [...world.enemies.filter((e) => e.alive), world.player];
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) e.render(ctx, cam);

  for (const p of world.projectiles) p.render(ctx, cam);
  world.fx.render(ctx, cam);
  world.fx.renderTexts(ctx, cam);

  renderHud(ctx, world.player, world, elapsed);
  renderTitle(ctx, Math.min(1, Math.max(0, (6 - elapsed) / 2)));
  if (world.kills >= world.total) renderVictory(ctx, elapsed);
  if (!world.player.alive) renderDeath(ctx, deathTime);
  if (invOpen) renderInventory(ctx, world.player, invSel);

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
