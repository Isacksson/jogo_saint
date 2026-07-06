// A Lenda Áurea: Jorge e o Dragão — boot e game loop

import { TILE, TILE_PX, VIEW_W, VIEW_H, T } from './constants.js';
import { input } from './input.js';
import { buildTiles } from './sprites.js';
import { GameMap } from './map.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { renderHud, renderTitle } from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const tiles = buildTiles();
const map = new GameMap();
const player = new Player(13, 20); // nasce no cruzamento das estradas
const camera = new Camera();
camera.follow(player.x, player.y, 0, true);

let elapsed = 0;
let last = performance.now();

function renderMap() {
  const x0 = Math.floor(camera.x / TILE_PX);
  const y0 = Math.floor(camera.y / TILE_PX);
  const x1 = Math.ceil((camera.x + VIEW_W) / TILE_PX);
  const y1 = Math.ceil((camera.y + VIEW_H) / TILE_PX);

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
        Math.round(tx * TILE_PX - camera.x),
        Math.round(ty * TILE_PX - camera.y),
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
  player.update(dt, map);
  camera.follow(player.x, player.y, dt);

  // --- render ---
  ctx.fillStyle = '#12100d';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  renderMap();
  player.render(ctx, camera);
  renderHud(ctx, player);

  // título some entre 4s e 6s de jogo
  renderTitle(ctx, Math.min(1, Math.max(0, (6 - elapsed) / 2)));

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
