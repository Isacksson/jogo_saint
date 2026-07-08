// GameMap genérico: grade de tiles com colisão e helpers de construção.
// Os mapas do jogo em si são definidos em maps.js.

import { T, SOLID, TILE_PX } from './constants.js';

// RNG determinístico para os mapas serem sempre os mesmos
export function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GameMap {
  constructor(def) {
    this.w = def.w;
    this.h = def.h;
    this.outside = def.outside ?? T.TREE; // o que existe "fora" do mapa
    this.base = def.base ?? T.GRASS;      // piso desenhado sob a cenografia
    this.gateFloor = def.gateFloor ?? T.STONE; // o que fica no lugar do portão aberto
    this.tiles = new Uint8Array(this.w * this.h).fill(def.base ?? T.GRASS);
    def.generate(this);
  }

  // abre todos os portões do mapa
  openGates() {
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i] === T.GATE) this.tiles[i] = this.gateFloor;
    }
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this.outside;
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

  // ---------- helpers de construção ----------

  fillRect(x, y, w, h, t) {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) this.set(i, j, t);
    }
  }

  border(thick, t) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (x < thick || y < thick || x >= this.w - thick || y >= this.h - thick) {
          this.set(x, y, t);
        }
      }
    }
  }

  scatter(rand, t, count, over = T.GRASS, margin = 3) {
    for (let i = 0; i < count; i++) {
      const x = margin + Math.floor(rand() * (this.w - margin * 2));
      const y = margin + Math.floor(rand() * (this.h - margin * 2));
      if (this.get(x, y) === over) this.set(x, y, t);
    }
  }

  // casa estilo Lufia: telhado sólido com porta decorativa na frente
  house(x, y, w, h) {
    this.fillRect(x, y, w, h - 1, T.ROOF);
    this.fillRect(x, y + h - 1, w, 1, T.WALL);
    this.set(x + Math.floor(w / 2), y + h - 1, T.DOOR);
  }
}
