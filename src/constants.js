// Constantes globais do jogo

export const TILE = 16;          // tamanho do tile em pixels de arte
export const SCALE = 3;          // fator de ampliação na tela
export const TILE_PX = TILE * SCALE;

export const VIEW_W = 960;
export const VIEW_H = 540;

// Tipos de tile
export const T = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  TREE: 3,
  ROCK: 4,
  FLOWER: 5,
  SAND: 6,
  MUD: 7,       // lama do pântano
  POISON: 8,    // charco envenenado (sólido)
  DEADTREE: 9,  // árvore morta
  ROOF: 10,     // telhado de casa
  WALL: 11,     // parede de casa
  DOOR: 12,     // porta de casa (decorativa)
  STONE: 13,    // piso das catacumbas
  CWALL: 14,    // parede das catacumbas
  GATE: 15,     // portão trancado
  BONES: 16,    // ossadas no piso
};

// Tiles que bloqueiam movimento
export const SOLID = new Set([
  T.WATER, T.TREE, T.ROCK, T.POISON, T.DEADTREE,
  T.ROOF, T.WALL, T.DOOR, T.CWALL, T.GATE,
]);

export const PLAYER_SPEED = 150; // px de tela por segundo
