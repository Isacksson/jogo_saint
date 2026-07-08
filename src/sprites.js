// Sprites e tiles: recortados do Ninja Adventure Pack (CC0, Pixel-boy).
// O que o pack não cobre (lava, paredes das fossas, escada) é gerado por código.

import { TILE, T } from './constants.js';
import { images } from './assets.js';

// ---------- utilitários ----------

// RNG determinístico para texturas consistentes entre sessões
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w = TILE, h = TILE) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// recorta uma região do tileset (em coordenadas de tile 16px)
function cut(tx, ty, tw = 1, th = 1) {
  const c = makeCanvas(tw * TILE, th * TILE);
  c.getContext('2d').drawImage(
    images.tileset,
    tx * TILE, ty * TILE, tw * TILE, th * TILE,
    0, 0, tw * TILE, th * TILE
  );
  return c;
}

// Converte um grid de caracteres numa imagem (ainda usado pelos ícones de equipamento)
export function makeSprite(rows, palette) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// ---------- personagens e monstros (sheets 4 direções) ----------

// sheets do pack: 4 colunas = [baixo, cima, esquerda, direita], linhas = frames
const DIR_COLS = { down: 0, up: 1, left: 2, right: 3 };

function sheetDirs(img, frames = 4) {
  const out = {};
  for (const [dir, col] of Object.entries(DIR_COLS)) {
    out[dir] = [];
    for (let f = 0; f < frames; f++) {
      const c = makeCanvas(TILE, TILE);
      c.getContext('2d').drawImage(img, col * TILE, f * TILE, TILE, TILE, 0, 0, TILE, TILE);
      out[dir].push(c);
    }
  }
  return out;
}

let playerCache = null;
export function buildPlayerSprites() {
  if (!playerCache) playerCache = sheetDirs(images.jorge);
  return playerCache;
}

let enemyCache = null;
export function buildEnemySprites() {
  if (!enemyCache) {
    enemyCache = {
      imundo: sheetDirs(images.imundo),
      serpe: sheetDirs(images.serpe),
      golgor: sheetDirs(images.golgor),
      amon: sheetDirs(images.amon),
      invejoso: sheetDirs(images.invejoso),
      leviata: sheetDirs(images.leviata),
      possesso: sheetDirs(images.possesso),
      belzebu: sheetDirs(images.belzebu),
      mamon: sheetDirs(images.mamon),
      asmodeu: sheetDirs(images.asmodeu),
      belfegor: sheetDirs(images.belfegor),
    };
  }
  return enemyCache;
}

let dragonCache = null;
export function buildDragonSprites() {
  if (!dragonCache) dragonCache = sheetDirs(images.dragao);
  return dragonCache;
}

const npcCache = {};
export function npcSprite(name) {
  if (!npcCache[name]) npcCache[name] = sheetDirs(images[name]);
  return npcCache[name];
}

// ---------- objetos do cenário (recortes com transparência) ----------

let objectCache = null;
export function buildObjects() {
  if (!objectCache) {
    objectCache = {
      tree: cut(11, 8, 2, 2),        // árvore frondosa
      morta: cut(0, 28, 2, 2),       // árvore queimada do pântano
      boulder: cut(12, 10, 2, 2),    // rochedo
      houseThatch: cut(0, 0, 4, 3),  // casa de sapê
      houseCream: cut(4, 0, 4, 3),   // casa caiada
      cross: cut(8, 7, 1, 1),        // cruz de madeira (altar)
      grave: cut(9, 7, 1, 1),        // lápide
      lantern: cut(11, 27, 1, 2),    // lanterna de pedra
    };
  }
  return objectCache;
}

export function buildAltarSprite() {
  return buildObjects().cross;
}

// ---------- FX em sprite (5 frames de 32px) ----------

let fxCache = null;
export function buildFxFrames() {
  if (!fxCache) {
    const slice = (img) => {
      const frames = [];
      for (let i = 0; i < 5; i++) {
        const c = makeCanvas(32, 32);
        c.getContext('2d').drawImage(img, i * 32, 0, 32, 32, 0, 0, 32, 32);
        frames.push(c);
      }
      return frames;
    };
    fxCache = {
      slash: slice(images.fxSlash),
      heavy: slice(images.fxHeavy),
      hit: slice(images.fxHit),
    };
  }
  return fxCache;
}

// ---------- tiles ----------

// tiles vindos do tileset (variações escolhidas por posição no mapa)
const SHEET_TILES = {
  [T.GRASS]: [[19, 17], [14, 16]],
  [T.PATH]: [[9, 32]],
  [T.SAND]: [[23, 12]],
  [T.MUD]: [[21, 16], [26, 16]],
  [T.STONE]: [[17, 33], [16, 31]],
  [T.HELLFLOOR]: [[3, 33], [2, 31]],
  [T.ENVYFLOOR]: [[24, 33], [23, 31]],
  [T.FEASTFLOOR]: [[20, 11]],
  [T.GATE]: [[16, 37]],
};

// flores brancas compostas sobre a grama
function flowerTile() {
  const c = cut(19, 17);
  c.getContext('2d').drawImage(cut(1, 8), 0, 0);
  return c;
}

function tintedWater(green) {
  // água do lago; para o veneno, tinge de verde
  const frames = [];
  for (const [tx, ty] of [[23, 6], [23, 7]]) {
    const c = cut(tx, ty);
    if (green) {
      const ctx = c.getContext('2d');
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(70, 130, 30, 0.55)';
      ctx.fillRect(0, 0, TILE, TILE);
    }
    frames.push(c);
  }
  return frames;
}

// o Cordeiro Guardião: o cão do pack alvejado como um cordeiro (2 frames)
let cordeiroCache = null;
export function buildCordeiro() {
  if (!cordeiroCache) {
    cordeiroCache = [0, 1].map((i) => {
      const c = makeCanvas(TILE, TILE);
      const ctx = c.getContext('2d');
      ctx.filter = 'saturate(0.15) brightness(1.75)';
      ctx.drawImage(images.cordeiro, i * TILE, 0, TILE, TILE, 0, 0, TILE, TILE);
      return c;
    });
  }
  return cordeiroCache;
}

// piso da Luxúria: pedra clara coberta de pétalas
function roseTiles() {
  return [[3, 5, 11, 9], [8, 12, 2, 4]].map((pts) => {
    const c = cut(16, 31);
    const ctx = c.getContext('2d');
    for (let i = 0; i < pts.length; i += 2) {
      ctx.fillStyle = '#e06880';
      ctx.fillRect(pts[i], pts[i + 1], 2, 1);
      ctx.fillStyle = '#f0a0b0';
      ctx.fillRect(pts[i] + 1, pts[i + 1] + 1, 1, 1);
    }
    return c;
  });
}

// piso da Preguiça: pedra tomada de musgo e poeira
function slothTiles() {
  return [[2, 4, 10, 11, 6, 13], [12, 3, 4, 9]].map((pts) => {
    const c = cut(17, 33);
    const ctx = c.getContext('2d');
    for (let i = 0; i < pts.length; i += 2) {
      ctx.fillStyle = '#6a7458';
      ctx.fillRect(pts[i], pts[i + 1], 3, 2);
      ctx.fillStyle = '#7e8868';
      ctx.fillRect(pts[i] + 1, pts[i + 1], 1, 1);
    }
    return c;
  });
}

// piso da Avareza: pedra clara com moedas perdidas
function treasureTiles() {
  const plain = cut(16, 31);
  const coined = [[3, 7], [8, 2]].map(([ox, oy]) => {
    const c = cut(17, 33);
    c.getContext('2d').drawImage(images.coin, ox, oy);
    return c;
  });
  return [plain, ...coined];
}

function bonesTiles() {
  // ossadas compostas sobre o piso de pedra
  const skull = cut(2, 17);
  const bone = cut(3, 17);
  return [skull, bone].map((overlay) => {
    const c = cut(17, 33);
    c.getContext('2d').drawImage(overlay, 0, 0);
    return c;
  });
}

// -- procedurais que o pack não cobre --

function tileCatacombWall() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#32323a';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#26262c';
  for (let y = 0; y < TILE; y += 4) {
    ctx.fillRect(0, y, TILE, 1);
    for (let x = (y / 4) % 2 === 0 ? 4 : 8; x < TILE; x += 8) {
      ctx.fillRect(x, y, 1, 4);
    }
  }
  ctx.fillStyle = '#3e3e48';
  ctx.fillRect(2, 2, 2, 1);
  ctx.fillRect(10, 9, 2, 1);
  return c;
}

function tileHellWall() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#42262a';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#301a1e';
  for (let y = 0; y < TILE; y += 4) {
    ctx.fillRect(0, y, TILE, 1);
    for (let x = (y / 4) % 2 === 0 ? 4 : 8; x < TILE; x += 8) {
      ctx.fillRect(x, y, 1, 4);
    }
  }
  ctx.fillStyle = '#582e30';
  ctx.fillRect(3, 6, 2, 1);
  ctx.fillRect(11, 13, 2, 1);
  return c;
}

function tileLava(phase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#a83c10';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#d86018';
  const off = phase === 0 ? 0 : 3;
  for (let y = 1; y < TILE; y += 4) {
    ctx.fillRect((2 + off) % TILE, y, 4, 2);
    ctx.fillRect((10 + off) % TILE, y + 2, 3, 1);
  }
  ctx.fillStyle = '#f8a838';
  ctx.fillRect((5 + off) % TILE, 5, 2, 1);
  ctx.fillRect((12 + off) % TILE, 11, 2, 1);
  return c;
}

function tileStairs() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1214';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = ['#5a5a58', '#4a4a48', '#3a3a38', '#2a2a28'][i];
    ctx.fillRect(2, 2 + i * 3, 12, 3);
  }
  return c;
}

// Retorna { [tipoDeTile]: [frames...] } — a maioria tem 1+ variações, líquidos têm 2 fases.
export function buildTiles() {
  const tiles = {};
  for (const [type, coords] of Object.entries(SHEET_TILES)) {
    tiles[type] = coords.map(([tx, ty]) => cut(tx, ty));
  }
  tiles[T.FLOWER] = [flowerTile()];
  tiles[T.TREASURE] = treasureTiles();
  tiles[T.ROSEFLOOR] = roseTiles();
  tiles[T.SLOTHFLOOR] = slothTiles();
  tiles[T.WATER] = tintedWater(false);
  tiles[T.POISON] = tintedWater(true);
  tiles[T.BONES] = bonesTiles();
  tiles[T.CWALL] = [tileCatacombWall()];
  tiles[T.HELLWALL] = [tileHellWall()];
  tiles[T.LAVA] = [tileLava(0), tileLava(1)];
  tiles[T.STAIRS] = [tileStairs()];
  // nunca desenhados diretamente (viram objetos sobre um piso base),
  // mas mantidos aqui como reserva
  tiles[T.TREE] = [cut(19, 17)];
  tiles[T.DEADTREE] = [cut(21, 16)];
  tiles[T.ROCK] = [cut(19, 17)];
  tiles[T.ROOF] = [cut(19, 17)];
  tiles[T.WALL] = [cut(19, 17)];
  tiles[T.DOOR] = [cut(19, 17)];
  return tiles;
}
