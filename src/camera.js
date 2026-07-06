// Câmera com follow suave, presa aos limites do mapa

import { MAP_W, MAP_H, TILE_PX, VIEW_W, VIEW_H } from './constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  follow(targetX, targetY, dt, snap = false) {
    const goalX = targetX - VIEW_W / 2;
    const goalY = targetY - VIEW_H / 2;
    if (snap) {
      this.x = goalX;
      this.y = goalY;
    } else {
      // interpolação exponencial independente de framerate
      const k = 1 - Math.pow(0.02, dt);
      this.x += (goalX - this.x) * k;
      this.y += (goalY - this.y) * k;
    }
    const maxX = MAP_W * TILE_PX - VIEW_W;
    const maxY = MAP_H * TILE_PX - VIEW_H;
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }
}
