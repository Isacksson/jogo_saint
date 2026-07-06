// Pixel art gerada por código: grids de caracteres viram canvases 16x16.
// Sem assets externos — toda a arte do jogo nasce aqui.

import { TILE, T } from './constants.js';

// ---------- utilitários ----------

// RNG determinístico (mulberry32) para texturas consistentes entre sessões
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

// Converte um grid de caracteres numa imagem, usando a paleta char->cor.
// Linhas mais curtas são tratadas como completadas com '.' (transparente).
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

// ---------- Jorge ----------

const PAL = {
  D: '#2b2018', // contorno
  H: '#6b4a2b', // cabelo
  S: '#e8b088', // pele
  K: '#201810', // olhos
  W: '#ece4d2', // túnica branca
  R: '#c23428', // cruz vermelha
  A: '#98a2ac', // aço dos ombros
  B: '#7a5230', // botas / couro
};

const BODY_DOWN = [
  '......DDDD......',
  '.....DHHHHD.....',
  '....DHHHHHHD....',
  '....DSSSSSSD....',
  '....DSKSSKSD....',
  '....DSSSSSSD....',
  '.....DSSSSD.....',
  '..DAWWWRRWWWAD..',
  '..DAWRRRRRRWAD..',
  '..DAWWWRRWWWAD..',
  '...DWWWRRWWWD...',
  '...DWWWWWWWWD...',
];

const BODY_UP = [
  '......DDDD......',
  '.....DHHHHD.....',
  '....DHHHHHHD....',
  '....DHHHHHHD....',
  '....DHHHHHHD....',
  '....DHHHHHHD....',
  '.....DHHHHD.....',
  '..DAWWWRRWWWAD..',
  '..DAWRRRRRRWAD..',
  '..DAWWWRRWWWAD..',
  '...DWWWRRWWWD...',
  '...DWWWWWWWWD...',
];

const BODY_RIGHT = [
  '......DDDD......',
  '.....DHHHHD.....',
  '....DHHHHHHD....',
  '....DHSSSSSD....',
  '....DHSSSKSD....',
  '....DHSSSSSD....',
  '.....DSSSSD.....',
  '...DAWWWWWWAD...',
  '...DAWWRRWWAD...',
  '...DAWWRRWWAD...',
  '....DWWRRWWD....',
  '....DWWWWWWD....',
];

const LEGS_IDLE = [
  '....DBBDDBBD....',
  '....DBB..BBD....',
  '....DBB..BBD....',
  '....DDD..DDD....',
];

const LEGS_WALK_A = [
  '....DBBDDBBD....',
  '....DBB..BBD....',
  '...DBB...DDD....',
  '...DDD..........',
];

const LEGS_WALK_B = [
  '....DBBDDBBD....',
  '....DBB..BBD....',
  '....DDD...BBD...',
  '..........DDD...',
];

function frames(body) {
  return [
    makeSprite([...body, ...LEGS_IDLE], PAL),
    makeSprite([...body, ...LEGS_WALK_A], PAL),
    makeSprite([...body, ...LEGS_WALK_B], PAL),
  ];
}

// { down: [idle, andarA, andarB], up: [...], right: [...] }
// "left" é desenhado espelhando "right" na hora de renderizar.
export function buildPlayerSprites() {
  return {
    down: frames(BODY_DOWN),
    up: frames(BODY_UP),
    right: frames(BODY_RIGHT),
  };
}

// Aldeões: mesmo corpo do Jorge com outras cores (túnica, cabelo, pele)
export function makeVillagerSprite(overrides = {}) {
  return makeSprite([...BODY_DOWN, ...LEGS_IDLE], { ...PAL, ...overrides });
}

// ---------- Demônios ----------

const IMUNDO_PAL = {
  D: '#1a100c', // contorno
  R: '#9c3424', // pele
  r: '#7c2418', // sombra
  E: '#f0d848', // olhos
  H: '#d8c8a0', // chifres
  C: '#e8e0d0', // garras
};

const IMUNDO_BODY = [
  '...DD......DD...',
  '..DHHD....DHHD..',
  '..DDRRD..DRRDD..',
  '...DRRRRRRRRD...',
  '..DRRRRRRRRRRD..',
  '..DREDRRRRDERD..',
  '..DRRRRRRRRRRD..',
  '...DRDDDDDDRD...',
  '...DRRRRRRRRD...',
  '..DRRRRRRRRRRD..',
  '..DCRRRrrRRRCD..',
  '...DRRrrrrRRD...',
  '....DRRDDRRD....',
];

const IMUNDO_LEGS_A = [
  '....DRD..DRD....',
  '...DCCD..DCCD...',
  '................',
];

const IMUNDO_LEGS_B = [
  '.....DRDDRD.....',
  '....DCCDDCCD....',
  '................',
];

const SERPE_PAL = {
  D: '#14200f', // contorno
  G: '#4a9038', // escamas
  g: '#35682a', // sombra
  Y: '#cad584', // ventre
  E: '#e04828', // olhos
  T: '#c03838', // língua
};

const SERPE_A = [
  '.....DDDD.......',
  '....DGGGGD......',
  '...DGEGGEGD.....',
  '...DGGGGGGD.....',
  '....DGYYGD......',
  '....DGYYGD......',
  '...DGGYYGGD.....',
  '..DGGGYYGGGD....',
  '.DGgGGYYGGgGD...',
  '.DGggGYYGGggGD..',
  '.DGgGGGGGGGgGD..',
  '..DGgggggggGD...',
  '...DDGGGGGDD....',
  '.....DDDDD......',
];

const SERPE_B = [
  '.....DDDD.......',
  '....DGGGGD......',
  '...DGEGGEGD.....',
  'TT.DGGGGGGD.....',
  '....DGYYGD......',
  '....DGYYGD......',
  '...DGGYYGGD.....',
  '..DGGGYYGGGD....',
  '.DGgGGYYGGgGD...',
  '.DGggGYYGGggGD..',
  '.DGgGGGGGGGgGD..',
  '..DGgggggggGD...',
  '...DDGGGGGDD....',
  '.....DDDDD......',
];

let enemyCache = null;

export function buildEnemySprites() {
  if (!enemyCache) {
    enemyCache = {
      imundo: [
        makeSprite([...IMUNDO_BODY, ...IMUNDO_LEGS_A], IMUNDO_PAL),
        makeSprite([...IMUNDO_BODY, ...IMUNDO_LEGS_B], IMUNDO_PAL),
      ],
      serpe: [
        makeSprite(SERPE_A, SERPE_PAL),
        makeSprite(SERPE_B, SERPE_PAL),
      ],
    };
  }
  return enemyCache;
}

// ---------- O Dragão de Silena (32x24, asas em 2 poses) ----------

const DRAGON_PAL = {
  D: '#101a0c', // contorno
  G: '#3e7030', // escamas
  g: '#2c501f', // escamas escuras
  Y: '#d8c878', // ventre
  R: '#a83028', // membrana das asas
  r: '#701c14', // membrana escura
  E: '#f0d030', // olho
  H: '#d8c8a8', // chifres e garras
};

const DRAGON_A = [
  '....DD..........DDDD............',
  '...DHHD........DRRRRDD..........',
  '...DHHD.......DRRRRRRRDD........',
  '..DGGGGD......DRRRRRRRRRDD......',
  '..DGEGGGD.....DRrrRRRRRRRRD.....',
  '..DGGGGGGD.....DRrrrRRRRRRD.....',
  '...DGYGGGGD.....DRrrrrRRRD......',
  '....DGYGGGGDD....DDrrrrRDD......',
  '.....DGYGGGGGDDDDDGGDDDDD.......',
  '.....DGYGGGGGGGGGGGGGD..........',
  '....DGYYGGGGGGGGGGGGGGDD........',
  '....DGYYGGGGGGGGGGGGGGGGDDD.....',
  '....DGYYGGGGGGGGgGGGGGGGGGGDD...',
  '.....DGYYGGGGGGGgggGGGGGGGGGGDD.',
  '......DGYYYGGGGGGgggGGGDDDGGGGD.',
  '.......DGYYYYGGGGGGggGD...DDGGD.',
  '........DDGGGGGGGGGGGD.....DDD..',
  '.........DGGDDGGGDDGGD..........',
  '.........DGGD.DGGD.DGGD.........',
  '.........DHHD.DHHD.DHHD.........',
  '..........DD...DD...DD..........',
];

const DRAGON_B = [
  '....DD..........................',
  '...DHHD.........................',
  '...DHHD..........DDDD...........',
  '..DGGGGD........DRRRRDD.........',
  '..DGEGGGD.......DRRRRRRDD.......',
  '..DGGGGGGD......DRrrRRRRRD......',
  '...DGYGGGGD......DRrrrRRRRD.....',
  '....DGYGGGGDD.....DDrrrrRRD.....',
  '.....DGYGGGGGDDDDDGGDDDDDD......',
  '.....DGYGGGGGGGGGGGGGD..........',
  '....DGYYGGGGGGGGGGGGGGDD........',
  '....DGYYGGGGGGGGGGGGGGGGDDD.....',
  '....DGYYGGGGGGGGgGGGGGGGGGGDD...',
  '.....DGYYGGGGGGGgggGGGGGGGGGGDD.',
  '......DGYYYGGGGGGgggGGGDDDGGGGD.',
  '.......DGYYYYGGGGGGggGD...DDGGD.',
  '........DDGGGGGGGGGGGD.....DDD..',
  '.........DGGDDGGGDDGGD..........',
  '.........DGGD.DGGD.DGGD.........',
  '.........DHHD.DHHD.DHHD.........',
  '..........DD...DD...DD..........',
];

let dragonCache = null;

export function buildDragonSprites() {
  if (!dragonCache) {
    dragonCache = [makeSprite(DRAGON_A, DRAGON_PAL), makeSprite(DRAGON_B, DRAGON_PAL)];
  }
  return dragonCache;
}

// ---------- Altar (cruz de pedra) ----------

const ALTAR_PAL = {
  D: '#2a2620',
  S: '#b8b4a8',
  s: '#8a867a',
};

const ALTAR = [
  '......DDDD......',
  '.....DSSSSD.....',
  '.....DSSSSD.....',
  '..DDDDSSSSDDDD..',
  '..DSSSSSSSSSSD..',
  '..DDDDSSSSDDDD..',
  '.....DSSSSD.....',
  '.....DSSSSD.....',
  '.....DSSSSD.....',
  '....DDSSSSDD....',
  '...DSSSSSSSSD...',
  '..DSssssssssSD..',
  '..DSSSSSSSSSSD..',
  '..DDDDDDDDDDDD..',
];

let altarCache = null;

export function buildAltarSprite() {
  if (!altarCache) altarCache = makeSprite(ALTAR, ALTAR_PAL);
  return altarCache;
}

// ---------- Tiles ----------

function grassBase(ctx, rand) {
  ctx.fillStyle = '#4f8a3d';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = rand() < 0.5 ? '#468035' : '#5a9647';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 1, 1);
  }
}

function tileGrass(seed) {
  const c = makeCanvas();
  grassBase(c.getContext('2d'), rng(seed));
  return c;
}

function tilePath(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = '#c2a066';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = rand() < 0.5 ? '#b28f56' : '#cfae74';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 1, 1);
  }
  return c;
}

function tileSand(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = '#d8c489';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#c9b478';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 1, 1);
  }
  return c;
}

// duas fases de animação da água
function tileWater(phase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2c5e9e';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#3d74b5';
  const off = phase === 0 ? 0 : 2;
  for (let y = 2; y < TILE; y += 5) {
    ctx.fillRect((3 + off) % TILE, y, 3, 1);
    ctx.fillRect((10 + off) % TILE, y + 2, 3, 1);
  }
  return c;
}

function tileTree(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  grassBase(ctx, rand);
  // tronco
  ctx.fillStyle = '#5c4023';
  ctx.fillRect(6, 11, 4, 4);
  // copa
  ctx.fillStyle = '#2e5c26';
  ctx.fillRect(2, 2, 12, 10);
  ctx.fillRect(4, 0, 8, 2);
  ctx.fillRect(0, 4, 2, 6);
  ctx.fillRect(14, 4, 2, 6);
  ctx.fillStyle = '#3a7030';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect((1 + rand() * 13) | 0, (1 + rand() * 9) | 0, 2, 1);
  }
  return c;
}

function tileRock(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  grassBase(ctx, rand);
  ctx.fillStyle = '#2b2018';
  ctx.fillRect(3, 6, 10, 8);
  ctx.fillStyle = '#8a8a86';
  ctx.fillRect(4, 7, 8, 6);
  ctx.fillRect(6, 5, 5, 2);
  ctx.fillStyle = '#a8a8a2';
  ctx.fillRect(5, 8, 3, 2);
  return c;
}

function tileFlower(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  grassBase(ctx, rand);
  // rosas de São Jorge
  ctx.fillStyle = '#c23428';
  ctx.fillRect(4, 5, 2, 2);
  ctx.fillRect(10, 9, 2, 2);
  ctx.fillStyle = '#ece4d2';
  ctx.fillRect(11, 3, 2, 2);
  return c;
}

function tileMud(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = '#6a5230';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = rand() < 0.5 ? '#5a4426' : '#7a6038';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 2, 1);
  }
  return c;
}

// charco venenoso animado (2 fases de bolhas)
function tilePoison(phase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3c6420';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#548430';
  const off = phase === 0 ? 0 : 3;
  for (let y = 2; y < TILE; y += 5) {
    ctx.fillRect((2 + off) % TILE, y, 2, 2);
    ctx.fillRect((9 + off) % TILE, y + 2, 2, 2);
  }
  ctx.fillStyle = '#78a848';
  ctx.fillRect((5 + off) % TILE, 6, 1, 1);
  ctx.fillRect((12 + off) % TILE, 11, 1, 1);
  return c;
}

function tileDeadTree(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = '#5a4a30';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#4c3e26';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 2, 1);
  }
  // tronco retorcido e galhos secos
  ctx.fillStyle = '#3a3028';
  ctx.fillRect(7, 6, 3, 9);
  ctx.fillRect(5, 3, 2, 4);
  ctx.fillRect(10, 2, 2, 5);
  ctx.fillRect(3, 2, 3, 2);
  ctx.fillRect(11, 1, 4, 2);
  ctx.fillStyle = '#524438';
  ctx.fillRect(8, 7, 1, 7);
  return c;
}

function tileRoof(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = '#a05838';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#8a4830';
  for (let y = 3; y < TILE; y += 4) ctx.fillRect(0, y, TILE, 1);
  ctx.fillStyle = '#b06844';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 2, 1);
  }
  return c;
}

function tileWall() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8b088';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#a89068';
  for (let y = 0; y < TILE; y += 4) {
    ctx.fillRect(0, y, TILE, 1);
    for (let x = (y / 4) % 2 === 0 ? 4 : 8; x < TILE; x += 8) {
      ctx.fillRect(x, y, 1, 4);
    }
  }
  return c;
}

function tileDoorHouse() {
  const c = tileWall();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(4, 4, 8, 12);
  ctx.fillStyle = '#5a4228';
  ctx.fillRect(5, 5, 6, 11);
  ctx.fillStyle = '#d8a020';
  ctx.fillRect(9, 10, 1, 1);
  return c;
}

function tileStone(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = '#5a5a58';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = rand() < 0.5 ? '#4e4e4c' : '#666664';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 2, 1);
  }
  ctx.fillStyle = '#454543';
  ctx.fillRect(0, 7, TILE, 1);
  ctx.fillRect(8, 0, 1, 7);
  ctx.fillRect(4, 8, 1, 8);
  return c;
}

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

function tileGate() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#26262c';
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.fillStyle = '#6a6a72';
  for (let x = 2; x < TILE; x += 4) ctx.fillRect(x, 0, 2, TILE);
  ctx.fillStyle = '#8a8a92';
  ctx.fillRect(0, 3, TILE, 2);
  ctx.fillRect(0, 11, TILE, 2);
  ctx.fillStyle = '#d8a020';
  ctx.fillRect(7, 7, 2, 2);
  return c;
}

function tileBones(seed) {
  const c = tileStone(seed);
  const ctx = c.getContext('2d');
  const rand = rng(seed + 99);
  ctx.fillStyle = '#c8c0a8';
  ctx.fillRect(3, 5, 4, 1);
  ctx.fillRect(9, 10, 1, 4);
  ctx.fillRect(11, 3, 2, 2);
  if (rand() < 0.5) ctx.fillRect(5, 12, 3, 1);
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

function tileHellFloor(seed) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  const rand = rng(seed);
  ctx.fillStyle = '#38282a';
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = rand() < 0.6 ? '#2e2022' : '#443034';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 2, 1);
  }
  // brasas
  if (rand() < 0.5) {
    ctx.fillStyle = '#c85820';
    ctx.fillRect((rand() * TILE) | 0, (rand() * TILE) | 0, 1, 1);
  }
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

// Retorna { [tipoDeTile]: [frames...] } — a maioria tem 1 frame, líquidos têm 2.
export function buildTiles() {
  return {
    [T.GRASS]: [tileGrass(11), tileGrass(23), tileGrass(37)],
    [T.PATH]: [tilePath(7)],
    [T.SAND]: [tileSand(5)],
    [T.WATER]: [tileWater(0), tileWater(1)],
    [T.TREE]: [tileTree(13)],
    [T.ROCK]: [tileRock(17)],
    [T.FLOWER]: [tileFlower(29)],
    [T.MUD]: [tileMud(41), tileMud(43)],
    [T.POISON]: [tilePoison(0), tilePoison(1)],
    [T.DEADTREE]: [tileDeadTree(47)],
    [T.ROOF]: [tileRoof(53)],
    [T.WALL]: [tileWall()],
    [T.DOOR]: [tileDoorHouse()],
    [T.STONE]: [tileStone(59), tileStone(61)],
    [T.CWALL]: [tileCatacombWall()],
    [T.GATE]: [tileGate()],
    [T.BONES]: [tileBones(67)],
    [T.HELLWALL]: [tileHellWall()],
    [T.HELLFLOOR]: [tileHellFloor(71), tileHellFloor(73)],
    [T.LAVA]: [tileLava(0), tileLava(1)],
    [T.STAIRS]: [tileStairs()],
  };
}
