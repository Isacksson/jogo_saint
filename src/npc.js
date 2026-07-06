// NPCs: aldeões de Silena e objetos sagrados com diálogo

import { TILE_PX, SCALE } from './constants.js';
import { makeVillagerSprite, buildAltarSprite } from './sprites.js';

const SPRITE_PX = 16 * SCALE;

export class Npc {
  constructor(def) {
    this.x = (def.tx + 0.5) * TILE_PX;
    this.y = (def.ty + 0.5) * TILE_PX;
    this.name = def.name;
    this.relic = !!def.relic;
    this.lines = def.lines;
    this.sprite = this.relic ? buildAltarSprite() : makeVillagerSprite(def.palette || {});
  }

  getLines(world) {
    return this.lines(world.flags);
  }

  isNear(player) {
    return Math.hypot(player.x - this.x, player.y - this.y) < 56;
  }

  render(ctx, cam, world, elapsed) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;

    if (this.relic) {
      // pedestal com brilho místico
      const pulse = 0.18 + 0.1 * Math.sin(elapsed * 3);
      const g = ctx.createRadialGradient(x, y - 14, 4, x, y - 14, 40);
      g.addColorStop(0, `rgba(180, 200, 255, ${pulse})`);
      g.addColorStop(1, 'rgba(180, 200, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 40, y - 54, 80, 80);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(
      this.sprite,
      Math.round(x - SPRITE_PX / 2),
      Math.round(y - SPRITE_PX + 8),
      SPRITE_PX, SPRITE_PX
    );

    if (world.player.alive && this.isNear(world.player)) {
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#f0e0b0';
      const label = this.relic ? 'E — Examinar' : `E — Falar (${this.name})`;
      ctx.strokeText(label, x, y - SPRITE_PX - 2);
      ctx.fillText(label, x, y - SPRITE_PX - 2);
    }
  }
}
