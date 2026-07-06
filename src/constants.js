// Constantes globais do jogo

export const TILE = 16;          // tamanho do tile em pixels de arte
export const SCALE = 3;          // fator de ampliação na tela
export const TILE_PX = TILE * SCALE;

export const VIEW_W = 960;
export const VIEW_H = 540;

export const MAP_W = 48;         // largura do mapa em tiles
export const MAP_H = 36;         // altura do mapa em tiles

// Tipos de tile
export const T = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  TREE: 3,
  ROCK: 4,
  FLOWER: 5,
  SAND: 6,
};

// Tiles que bloqueiam movimento
export const SOLID = new Set([T.WATER, T.TREE, T.ROCK]);

export const PLAYER_SPEED = 150; // px de tela por segundo
