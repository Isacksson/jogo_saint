// Jorge: movimento em 4 direções, animação de caminhada e colisão com o mapa

import { TILE_PX, SCALE, PLAYER_SPEED } from './constants.js';
import { input } from './input.js';
import { buildPlayerSprites } from './sprites.js';

const SPRITE_PX = 16 * SCALE; // 48px na tela

export class Player {
  constructor(tileX, tileY) {
    // posição do CENTRO dos pés, em pixels de mundo
    this.x = (tileX + 0.5) * TILE_PX;
    this.y = (tileY + 0.5) * TILE_PX;
    this.facing = 'down';
    this.moving = false;
    this.animTime = 0;
    this.sprites = buildPlayerSprites();

    // hitbox dos pés (para colisão), centrada em (x, y)
    this.hbW = 9 * SCALE;
    this.hbH = 5 * SCALE;

    // atributos (usados de verdade a partir do Turno 2)
    this.hp = 100; this.hpMax = 100;
    this.faith = 40; this.faithMax = 100;
    this.fury = 0; this.furyMax = 100;
  }

  update(dt, map) {
    let dx = 0, dy = 0;
    if (input.isHeld('up')) dy -= 1;
    if (input.isHeld('down')) dy += 1;
    if (input.isHeld('left')) dx -= 1;
    if (input.isHeld('right')) dx += 1;

    this.moving = dx !== 0 || dy !== 0;

    if (this.moving) {
      // direção do sprite: prioriza o eixo horizontal
      if (dx < 0) this.facing = 'left';
      else if (dx > 0) this.facing = 'right';
      else if (dy < 0) this.facing = 'up';
      else this.facing = 'down';

      const len = Math.hypot(dx, dy);
      const step = PLAYER_SPEED * dt;
      this.moveAxis(map, (dx / len) * step, 0);
      this.moveAxis(map, 0, (dy / len) * step);
      this.animTime += dt;
    } else {
      this.animTime = 0;
    }
  }

  // move num único eixo, cancelando se a hitbox tocar tile sólido
  moveAxis(map, mx, my) {
    const nx = this.x + mx;
    const ny = this.y + my;
    const hw = this.hbW / 2, hh = this.hbH / 2;
    const corners = [
      [nx - hw, ny - hh], [nx + hw, ny - hh],
      [nx - hw, ny + hh], [nx + hw, ny + hh],
    ];
    for (const [cx, cy] of corners) {
      if (map.isSolidAt(cx, cy)) return;
    }
    this.x = nx;
    this.y = ny;
  }

  render(ctx, camera) {
    // 4 quadros por segundo de passo: A, parado, B, parado
    const cycle = [1, 0, 2, 0];
    const frame = this.moving ? cycle[Math.floor(this.animTime * 8) % 4] : 0;

    const dir = this.facing === 'left' ? 'right' : this.facing;
    const sprite = this.sprites[dir][frame];

    // sprite ancorado pelos pés
    const sx = Math.round(this.x - camera.x - SPRITE_PX / 2);
    const sy = Math.round(this.y - camera.y - SPRITE_PX + this.hbH / 2);

    // sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x - camera.x, this.y - camera.y + 2, 7 * SCALE / 2, 3 * SCALE / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.facing === 'left') {
      ctx.save();
      ctx.translate(sx + SPRITE_PX, sy);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, SPRITE_PX, SPRITE_PX);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, sx, sy, SPRITE_PX, SPRITE_PX);
    }
  }
}
