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
  HELLWALL: 17, // rocha das fossas
  HELLFLOOR: 18,// cinzas das fossas
  LAVA: 19,     // fogo líquido (sólido)
  STAIRS: 20,   // escada descendo
  ENVYFLOOR: 21,// pedra esverdeada da Fossa da Inveja
  FEASTFLOOR: 22,// salão dourado da Fossa da Gula
  TREASURE: 23, // piso com moedas da Fossa da Avareza
  ROSEFLOOR: 24,// piso de pétalas da Fossa da Luxúria
  SLOTHFLOOR: 25,// pedra tomada de musgo da Fossa da Preguiça
};

// Tiles que bloqueiam movimento
export const SOLID = new Set([
  T.WATER, T.TREE, T.ROCK, T.POISON, T.DEADTREE,
  T.ROOF, T.WALL, T.DOOR, T.CWALL, T.GATE,
  T.HELLWALL, T.LAVA,
]);

export const PLAYER_SPEED = 150; // px de tela por segundo
