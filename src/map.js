// Mapa da clareira da Capadócia — área inicial do protótipo

import { MAP_W, MAP_H, T, SOLID, TILE_PX } from './constants.js';

// RNG determinístico para o mapa ser sempre o mesmo
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GameMap {
  constructor() {
    this.w = MAP_W;
    this.h = MAP_H;
    this.tiles = new Uint8Array(this.w * this.h).fill(T.GRASS);
    this.generate();
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T.TREE;
    return this.tiles[y * this.w + x];
  }

  set(x, y, t) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.tiles[y * this.w + x] = t;
  }

  isSolidTile(x, y) {
    return SOLID.has(this.get(x, y));
  }

  // colisão por ponto em coordenadas de mundo (pixels de tela)
  isSolidAt(px, py) {
    return this.isSolidTile(Math.floor(px / TILE_PX), Math.floor(py / TILE_PX));
  }

  generate() {
    const rand = rng(2026);

    // borda de floresta (2 tiles de espessura)
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (x < 2 || y < 2 || x >= this.w - 2 || y >= this.h - 2) {
          this.set(x, y, T.TREE);
        }
      }
    }

    // lago no nordeste, com margem de areia
    const lakeCX = 36, lakeCY = 9, lakeRX = 6, lakeRY = 4;
    for (let y = 2; y < this.h - 2; y++) {
      for (let x = 2; x < this.w - 2; x++) {
        const dx = (x - lakeCX) / lakeRX;
        const dy = (y - lakeCY) / lakeRY;
        const d = dx * dx + dy * dy;
        if (d <= 1) this.set(x, y, T.WATER);
        else if (d <= 1.7) this.set(x, y, T.SAND);
      }
    }

    // estrada em cruz: leste-oeste e uma descida ao sul
    for (let x = 2; x < this.w - 2; x++) {
      this.set(x, 18, T.PATH);
      this.set(x, 19, T.PATH);
    }
    for (let y = 19; y < this.h - 2; y++) {
      this.set(12, y, T.PATH);
      this.set(13, y, T.PATH);
    }

    // bosques espalhados (evitando estrada, lago e areia)
    for (let i = 0; i < 26; i++) {
      const cx = 3 + Math.floor(rand() * (this.w - 6));
      const cy = 3 + Math.floor(rand() * (this.h - 6));
      for (let j = 0; j < 4; j++) {
        const x = cx + Math.floor(rand() * 3) - 1;
        const y = cy + Math.floor(rand() * 3) - 1;
        if (this.get(x, y) === T.GRASS) this.set(x, y, T.TREE);
      }
    }

    // pedras e flores
    for (let i = 0; i < 14; i++) {
      const x = 3 + Math.floor(rand() * (this.w - 6));
      const y = 3 + Math.floor(rand() * (this.h - 6));
      if (this.get(x, y) === T.GRASS) this.set(x, y, T.ROCK);
    }
    for (let i = 0; i < 30; i++) {
      const x = 3 + Math.floor(rand() * (this.w - 6));
      const y = 3 + Math.floor(rand() * (this.h - 6));
      if (this.get(x, y) === T.GRASS) this.set(x, y, T.FLOWER);
    }

    // garante área livre em volta do spawn (cruzamento das estradas)
    for (let y = 16; y <= 22; y++) {
      for (let x = 10; x <= 16; x++) {
        if (this.isSolidTile(x, y)) this.set(x, y, T.GRASS);
      }
    }
  }
}
