// Os mapas do Ato I: Capadócia, Silena, o Pântano e as Catacumbas.
// Cada definição traz geração, inimigos, altares, NPCs e portais.

import { T } from './constants.js';
import { rng } from './map.js';

export const MAP_DEFS = {
  // ---------- clareira inicial ----------
  capadocia: {
    name: 'Clareira da Capadócia',
    w: 48, h: 36,
    generate(m) {
      const rand = rng(2026);
      m.border(2, T.TREE);

      // lago no nordeste, com margem de areia
      const lakeCX = 36, lakeCY = 9, lakeRX = 6, lakeRY = 4;
      for (let y = 2; y < m.h - 2; y++) {
        for (let x = 2; x < m.w - 2; x++) {
          const dx = (x - lakeCX) / lakeRX;
          const dy = (y - lakeCY) / lakeRY;
          const d = dx * dx + dy * dy;
          if (d <= 1) m.set(x, y, T.WATER);
          else if (d <= 1.7) m.set(x, y, T.SAND);
        }
      }

      // estrada em cruz: leste-oeste (até a borda: caminho para Silena) e descida ao sul
      for (let x = 2; x < m.w; x++) {
        m.set(x, 18, T.PATH);
        m.set(x, 19, T.PATH);
      }
      for (let y = 19; y < m.h - 2; y++) {
        m.set(12, y, T.PATH);
        m.set(13, y, T.PATH);
      }

      // bosques espalhados
      for (let i = 0; i < 26; i++) {
        const cx = 3 + Math.floor(rand() * (m.w - 6));
        const cy = 3 + Math.floor(rand() * (m.h - 6));
        for (let j = 0; j < 4; j++) {
          const x = cx + Math.floor(rand() * 3) - 1;
          const y = cy + Math.floor(rand() * 3) - 1;
          if (m.get(x, y) === T.GRASS) m.set(x, y, T.TREE);
        }
      }
      m.scatter(rand, T.ROCK, 14);
      m.scatter(rand, T.FLOWER, 30);

      // área livre no spawn
      for (let y = 16; y <= 22; y++) {
        for (let x = 10; x <= 16; x++) {
          if (m.isSolidTile(x, y)) m.set(x, y, T.GRASS);
        }
      }
    },
    spawns: [
      ['imundo', 22, 8], ['imundo', 24, 9], ['imundo', 23, 11],
      ['serpe', 8, 8], ['serpe', 6, 12],
      ['imundo', 40, 16], ['serpe', 41, 14],
      ['imundo', 34, 24], ['imundo', 36, 25],
      ['imundo', 20, 28], ['imundo', 18, 30], ['serpe', 30, 30],
    ],
    altars: [[15, 16], [20, 29]],
    npcs: [],
    portals: [
      { x: 47, y: 17, w: 1, h: 4, to: 'silena', tx: 2, ty: 15 },
    ],
  },

  // ---------- a cidade sob o terror do Dragão ----------
  silena: {
    name: 'Silena, a Cidade do Dragão',
    w: 44, h: 30,
    generate(m) {
      const rand = rng(313);
      m.border(2, T.TREE);

      // estradas: oeste-leste (vinda da Capadócia) e descida ao pântano
      for (let x = 0; x < m.w - 2; x++) {
        m.set(x, 15, T.PATH);
        m.set(x, 16, T.PATH);
      }
      for (let y = 16; y < m.h; y++) {
        m.set(22, y, T.PATH);
        m.set(23, y, T.PATH);
      }

      // casas de Silena
      m.house(6, 6, 6, 5);
      m.house(15, 5, 5, 5);
      m.house(28, 6, 6, 5);
      m.house(8, 20, 5, 5);
      m.house(30, 20, 6, 5);
      m.house(37, 10, 4, 4);

      // praça central calçada
      m.fillRect(19, 11, 9, 4, T.PATH);
      m.set(20, 12, T.ROCK); // o poço da praça

      m.scatter(rand, T.FLOWER, 24);
      m.scatter(rand, T.TREE, 8);
    },
    spawns: [], // cidade segura
    altars: [[26, 12]],
    npcs: [
      {
        tx: 25, ty: 17, name: 'Princesa Sabra',
        palette: { W: '#c8a8e0', R: '#8a5cb8', H: '#3a2a18', A: '#e8c860' },
        lines: (flags) => flags.catacumbasAbertas
          ? ['As catacumbas estão abertas... Os mártires te esperam, cavaleiro. Que tua lança não hesite.']
          : flags.temChave
            ? ['A chave! Deus seja louvado. Desce ao fundo do pântano: o portão das catacumbas cederá a ela.']
            : [
              'Cavaleiro... eu sou Sabra. Meu nome foi sorteado: sou o próximo tributo do Dragão.',
              'Mas ainda há esperança. Sob a cidade dormem as catacumbas dos mártires — e nelas, poder para ferir a besta.',
              'Os imundos roubaram a chave do portão. O chefe deles se esconde no pântano, ao sul. Traga-a de volta!',
            ],
      },
      {
        tx: 27, ty: 13, name: 'Padre Anastácio',
        palette: { W: '#4a4038', R: '#4a4038', H: '#c8c0b0' },
        lines: () => [
          'Ora nos altares, filho — a oração cura o corpo e guarda a jornada.',
          'E não desperdices tua Fúria: ela é dom do Alto para a hora mais escura.',
        ],
      },
      {
        tx: 17, ty: 14, name: 'Mira, a tecelã',
        palette: { W: '#b86838', R: '#7a3820', H: '#6b4a2b' },
        lines: () => ['O Dragão exige um tributo a cada lua cheia... Ontem levaram o filho do ferreiro. Ninguém mais dorme em Silena.'],
      },
      {
        tx: 30, ty: 17, name: 'Ancião Teodoro',
        palette: { W: '#8a9a78', R: '#5a6a48', H: '#d8d0c0' },
        lines: () => [
          'O hálito da besta envenenou o pântano ao sul. Nem os corvos voam por lá.',
          'Dizem que o veneno queima até a alma... Leva poções, moço.',
        ],
      },
    ],
    portals: [
      { x: 0, y: 14, w: 1, h: 4, to: 'capadocia', tx: 45, ty: 18 },
      { x: 21, y: 29, w: 4, h: 1, to: 'pantano', tx: 22, ty: 3 },
    ],
  },

  // ---------- o pântano envenenado ----------
  pantano: {
    name: 'Pântano Envenenado',
    w: 44, h: 34,
    base: T.MUD,
    outside: T.DEADTREE,
    generate(m) {
      const rand = rng(666);
      m.border(2, T.DEADTREE);

      // trilha norte-sul, de Silena ao portão das catacumbas
      for (let y = 0; y < m.h - 2; y++) {
        m.set(22, y, T.PATH);
        m.set(23, y, T.PATH);
      }

      // charcos de veneno
      const pools = [[10, 9, 5, 3], [32, 8, 6, 4], [8, 22, 6, 4], [33, 24, 5, 3], [17, 15, 4, 2], [27, 18, 5, 3]];
      for (const [px, py, pw, ph] of pools) {
        for (let y = py; y < py + ph; y++) {
          for (let x = px; x < px + pw; x++) {
            const dx = (x - px - pw / 2 + 0.5) / (pw / 2);
            const dy = (y - py - ph / 2 + 0.5) / (ph / 2);
            if (dx * dx + dy * dy <= 1.2 && m.get(x, y) === T.MUD) m.set(x, y, T.POISON);
          }
        }
      }

      m.scatter(rand, T.DEADTREE, 40, T.MUD);
      m.scatter(rand, T.ROCK, 8, T.MUD);

      // o portão das catacumbas, no extremo sul da trilha
      m.fillRect(19, 30, 8, 2, T.CWALL);
      m.set(22, 30, T.GATE);
      m.set(23, 30, T.GATE);
      m.fillRect(22, 31, 2, 1, T.STONE);

      // área livre na chegada
      m.fillRect(21, 2, 4, 3, T.PATH);
    },
    spawns: [
      ['imundo', 12, 7], ['imundo', 14, 9], ['serpe', 9, 12],
      ['imundo', 30, 10], ['serpe', 34, 13],
      ['imundo', 12, 24], ['imundo', 15, 26], ['serpe', 30, 26],
      ['imundo', 27, 21], ['chefe', 23, 24],
    ],
    altars: [[7, 5]],
    npcs: [],
    portals: [
      { x: 21, y: 0, w: 4, h: 1, to: 'silena', tx: 22, ty: 27 },
      { x: 22, y: 31, w: 2, h: 1, to: 'catacumbas', tx: 17, ty: 3 },
    ],
  },

  // ---------- as catacumbas dos mártires ----------
  catacumbas: {
    name: 'Catacumbas dos Mártires',
    w: 36, h: 30,
    base: T.CWALL,
    outside: T.CWALL,
    generate(m) {
      const rand = rng(777);
      // sala de entrada
      m.fillRect(14, 2, 8, 6, T.STONE);
      // corredor central
      m.fillRect(16, 8, 4, 8, T.STONE);
      // salas laterais
      m.fillRect(5, 10, 9, 7, T.STONE);
      m.fillRect(14, 12, 2, 2, T.STONE);
      m.fillRect(24, 10, 8, 7, T.STONE);
      m.fillRect(20, 12, 4, 2, T.STONE);
      // corredor para o santuário
      m.fillRect(17, 16, 2, 6, T.STONE);
      // santuário dos mártires
      m.fillRect(10, 22, 16, 6, T.STONE);

      // ossadas espalhadas
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(rand() * m.w);
        const y = Math.floor(rand() * m.h);
        if (m.get(x, y) === T.STONE && rand() < 0.6) m.set(x, y, T.BONES);
      }
    },
    spawns: [
      ['imundo', 8, 12], ['imundo', 11, 14], ['serpe', 7, 15],
      ['imundo', 27, 12], ['imundo', 29, 14], ['serpe', 26, 15],
      ['imundo', 14, 25], ['imundo', 21, 25], ['serpe', 18, 26],
    ],
    altars: [[12, 23]],
    npcs: [
      {
        tx: 18, ty: 24, name: 'Relíquia de Santa Bárbara',
        relic: true,
        lines: (flags) => [
          'Sobre o pedestal repousa uma relíquia. Um trovão distante ecoa quando tua mão se aproxima...',
          '"Aguenta firme, cavaleiro. Quando a tempestade vier, eu serei o raio na tua mão." (Turno 5)',
        ],
      },
    ],
    portals: [
      { x: 14, y: 2, w: 8, h: 1, to: 'pantano', tx: 22, ty: 28 },
    ],
  },
};
