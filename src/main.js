// A Lenda Áurea: Jorge e o Dragão — boot, mundo e game loop

import { TILE, TILE_PX, VIEW_W, VIEW_H, T } from './constants.js';
import { input } from './input.js';
import { buildTiles } from './sprites.js';
import { GameMap } from './map.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Imundo, Serpe } from './enemies.js';
import { Fx } from './fx.js';
import { renderHud, renderTitle, renderDeath, renderVictory } from './hud.js';

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
  kills: 0,
  total: SPAWNS.length,
};
// exposto para depuração e testes automatizados
window.world = world;

function reset() {
  world.fx = new Fx();
  world.player = new Player(13, 20); // nasce no cruzamento das estradas
  world.projectiles = [];
  world.kills = 0;
  world.enemies = SPAWNS.map(([type, tx, ty]) => {
    const [fx0, fy0] = findFree(tx, ty);
    return type === 'imundo' ? new Imundo(fx0, fy0) : new Serpe(fx0, fy0);
  });
  camera.follow(world.player.x, world.player.y, 0, true);
  deathTime = 0;
}

let elapsed = 0;
let deathTime = 0;
let last = performance.now();

reset();

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

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;

  // --- update ---
  const player = world.player;
  player.update(dt, world);
  for (const e of world.enemies) e.update(dt, world);
  for (const p of world.projectiles) p.update(dt, world);
  world.projectiles = world.projectiles.filter((p) => !p.dead);
  world.fx.update(dt);
  camera.follow(player.x, player.y, dt);

  if (!player.alive) {
    deathTime += dt;
    if (input.wasPressed('interact')) reset();
  }

  // --- render ---
  const shake = world.fx.shake;
  const cam = {
    x: camera.x + (Math.random() - 0.5) * shake,
    y: camera.y + (Math.random() - 0.5) * shake,
  };

  ctx.fillStyle = '#12100d';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  renderMap(cam);

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

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
