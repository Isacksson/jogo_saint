// Os mapas do Ato I: Capadócia, Silena, o Pântano e as Catacumbas.
// Cada definição traz geração, inimigos, altares, NPCs e portais.

import { T } from './constants.js';
import { rng } from './map.js';

// Fábrica das Fossas: monta a estrutura comum a todas (antecâmara, arena, alcova
// selada com portões, escada de descida, altar, portais e o espírito do santo) e
// delega ao `carve(m, floor)` apenas a geometria única de cada fossa (o corredor
// serpenteante, os perigos e os obstáculos). Elimina o copy-paste das 6 fossas e
// deixa trivial acrescentar novos pontos de entrada (Bloco C da v0.2).
//
// Deriva de poucos parâmetros:
//   floor    — tile de piso da fossa (também o chão que fica sob o portão aberto)
//   arenaY   — linha do topo da arena do chefe (base retangular 20×9)
//   alcoveY  — linha do topo da alcova selada; dela saem o portão, o espírito e
//              a escada de descida (gateY = alcoveY+1, escada = alcoveY+4..29)
//   anteW    — largura da antecâmara (quase sempre 7)
//   returnTo — para onde a saída de volta leva { to, tx, ty }
//   descendTo— próxima fossa { to } (tx/ty da chegada são sempre 4,3); null na última
//   spirit   — { name, sprite, grant, lines } do santo na alcova
function makeFossa(cfg) {
  const {
    name, floor, dark, arenaY = 19, alcoveY = 22, anteW = 7,
    returnTo, descendTo = null, spirit, spawns, carve,
  } = cfg;
  const gateY = alcoveY + 1;
  const stairY = alcoveY + 4;

  const portals = [
    { x: 2, y: 2, w: 1, h: 5, to: returnTo.to, tx: returnTo.tx, ty: returnTo.ty },
  ];
  if (descendTo) {
    portals.push({ x: 30, y: 29, w: 2, h: 1, to: descendTo.to, tx: 4, ty: 3 });
  }

  return {
    name, w: 34, h: 32,
    base: T.HELLWALL, outside: T.HELLWALL, gateFloor: floor,
    dark, mood: 'dark',
    generate(m) {
      m.fillRect(2, 2, anteW, 5, floor);      // antecâmara (chegada da escada)
      m.fillRect(8, arenaY, 20, 9, floor);    // piso base da arena do chefe
      carve(m, floor);                        // corredor + perigos únicos da fossa
      m.fillRect(26, gateY, 2, 2, floor);     // vau: piso diante do portão selado
      m.fillRect(29, alcoveY, 4, 4, floor);   // alcova do espírito
      m.set(28, gateY, T.GATE);
      m.set(28, gateY + 1, T.GATE);
      if (descendTo) {                        // escada de descida (exceto na última)
        m.fillRect(30, stairY, 2, 29 - stairY, floor);
        m.set(30, 29, T.STAIRS);
        m.set(31, 29, T.STAIRS);
      }
    },
    spawns,
    altars: [[4, 4]],
    npcs: [{
      tx: 31, ty: gateY, name: spirit.name, sprite: spirit.sprite,
      ghost: true, grant: spirit.grant, lines: spirit.lines,
    }],
    portals,
  };
}

export const MAP_DEFS = {
  // ---------- clareira inicial ----------
  capadocia: {
    name: 'Clareira da Capadócia',
    w: 48, h: 36,
    mood: 'peace',
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
    mood: 'peace',
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

      // casas de Silena (4x3, carimbadas com a arte do pack)
      for (const [hx, hy] of [[6, 6], [15, 5], [28, 6], [8, 20], [30, 20], [37, 10]]) {
        m.fillRect(hx, hy, 4, 3, T.ROOF);
      }

      // praça central calçada
      m.fillRect(19, 11, 9, 4, T.PATH);
      m.set(20, 12, T.ROCK); // o poço da praça

      m.scatter(rand, T.FLOWER, 24);
      m.scatter(rand, T.TREE, 8);
    },
    stamps: [
      ['houseThatch', 6, 6], ['houseCream', 15, 5], ['houseThatch', 28, 6],
      ['houseCream', 8, 20], ['houseThatch', 30, 20], ['houseCream', 37, 10],
    ],
    spawns: [], // cidade segura
    altars: [[26, 12]],
    npcs: [
      {
        tx: 25, ty: 17, name: 'Princesa Sabra',
        sprite: 'sabra',
        lines: (flags) => flags.dragaoDerrotado
          ? [
            'O Dragão... tombou? Silena está livre do tributo!',
            'Que as rosas floresçam onde teu sangue caiu, cavaleiro. Mas eu sinto... isto ainda não é o fim. As Portas continuam abertas lá embaixo.',
          ]
          : flags.catacumbasAbertas
            ? [
              'As catacumbas estão abertas... Os mártires te esperam, cavaleiro.',
              'E mais uma coisa: os batedores viram a besta pousar no covil, a LESTE do pântano. Quando estiveres pronto — e armado dos milagres — vai até lá.',
            ]
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
        sprite: 'anastacio',
        lines: () => [
          'Ora nos altares, filho — a oração cura o corpo e guarda a jornada.',
          'E não desperdices tua Fúria: ela é dom do Alto para a hora mais escura.',
        ],
      },
      {
        tx: 17, ty: 14, name: 'Mira, a tecelã',
        sprite: 'mira',
        lines: () => ['O Dragão exige um tributo a cada lua cheia... Ontem levaram o filho do ferreiro. Ninguém mais dorme em Silena.'],
      },
      {
        tx: 30, ty: 17, name: 'Ancião Teodoro',
        sprite: 'teodoro',
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
    mood: 'dark',
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

      // trilha para o covil do Dragão, a leste
      for (let x = 24; x < m.w; x++) {
        m.set(x, 16, T.PATH);
        m.set(x, 17, T.PATH);
      }

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
      { x: 43, y: 15, w: 1, h: 4, to: 'covil', tx: 4, ty: 12 },
    ],
  },

  // ---------- o covil do Dragão ----------
  covil: {
    name: 'Covil do Dragão',
    w: 32, h: 26,
    base: T.CWALL,
    outside: T.CWALL,
    dark: 'torch',
    mood: 'dark',
    generate(m) {
      const rand = rng(999);
      // caverna oval
      const cx = 17, cy = 13, rx = 12, ry = 9;
      for (let y = 0; y < m.h; y++) {
        for (let x = 0; x < m.w; x++) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) m.set(x, y, T.STONE);
        }
      }
      // túnel de entrada, a oeste
      m.fillRect(2, 11, 6, 3, T.STONE);
      // poças de fogo
      m.fillRect(12, 6, 3, 2, T.LAVA);
      m.fillRect(22, 19, 3, 2, T.LAVA);
      // ossadas das vítimas
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(rand() * m.w);
        const y = Math.floor(rand() * m.h);
        if (m.get(x, y) === T.STONE && rand() < 0.7) m.set(x, y, T.BONES);
      }
    },
    spawns: [['dragao', 21, 13]],
    altars: [[4, 10]],
    npcs: [],
    portals: [
      { x: 2, y: 11, w: 1, h: 3, to: 'pantano', tx: 41, ty: 16 },
    ],
  },

  // ---------- as catacumbas dos mártires ----------
  catacumbas: {
    name: 'Catacumbas dos Mártires',
    w: 36, h: 30,
    base: T.CWALL,
    outside: T.CWALL,
    dark: 'torch',
    mood: 'dark',
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
      // a escada que desce à Primeira Fossa
      m.fillRect(26, 24, 4, 2, T.STONE);
      m.set(29, 24, T.STAIRS);
      m.set(29, 25, T.STAIRS);

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
        grant: 'raio',
        lines: (flags) => flags.milagres?.raio
          ? ['O pedestal está vazio. O trovão agora habita tua mão.']
          : [
            'Sobre o pedestal repousa uma relíquia. Um trovão distante ecoa quando tua mão se aproxima...',
            '"Aguenta firme, cavaleiro. Quando a tempestade vier, eu serei o raio na tua mão."',
            '✝ Milagre recebido: RAIO DO TROVÃO — tecla 1 (30 de Fé)',
          ],
      },
    ],
    portals: [
      { x: 14, y: 2, w: 8, h: 1, to: 'pantano', tx: 22, ty: 28 },
      { x: 29, y: 24, w: 1, h: 2, to: 'fossa_ira', tx: 4, ty: 3 },
    ],
  },

  // ---------- Primeira Fossa: a Ira ----------
  fossa_ira: makeFossa({
    name: 'Primeira Fossa — A Ira',
    floor: T.HELLFLOOR, dark: 'hell', anteW: 8, arenaY: 19, alcoveY: 22,
    returnTo: { to: 'catacumbas', tx: 27, ty: 24 },
    descendTo: { to: 'fossa_inveja' },
    carve(m, f) {
      // descida serpenteante
      m.fillRect(8, 6, 3, 6, f);
      m.fillRect(8, 11, 12, 4, f);
      m.fillRect(18, 14, 3, 6, f);
      // rios de fogo nas bordas da arena
      m.fillRect(8, 19, 2, 9, T.LAVA);
      m.fillRect(26, 19, 2, 9, T.LAVA);
      m.fillRect(13, 11, 2, 2, T.LAVA);
    },
    spawns: [
      ['imundo', 9, 12], ['imundo', 12, 13], ['serpe', 17, 12],
      ['imundo', 19, 16], ['serpe', 19, 18],
      ['amon', 18, 23],
    ],
    spirit: {
      name: 'Espírito de São Sebastião', sprite: 'espirito', grant: 'setas',
      lines: (flags) => flags.milagres?.setas
        ? ['"Vai, cavaleiro. Minhas setas voam contigo."']
        : [
          'Um vulto translúcido se ergue entre as brasas: um jovem soldado, o corpo marcado por cem flechas.',
          '"Fui alvejado por ordem do imperador, e sobrevivi para ser alvejado de novo. Conheço a ira — e a venci com paciência."',
          '"Toma minhas setas, irmão de armas. Que elas caiam sobre os malignos como caíram sobre mim."',
          '✝ Milagre recebido: CHUVA DE SETAS — tecla 2 (25 de Fé)',
        ],
    },
  }),

  // ---------- Segunda Fossa: a Inveja ----------
  fossa_inveja: makeFossa({
    name: 'Segunda Fossa — A Inveja',
    floor: T.ENVYFLOOR, dark: 'torch', arenaY: 20, alcoveY: 22,
    returnTo: { to: 'fossa_ira', tx: 30, ty: 27 },
    descendTo: { to: 'fossa_gula' },
    carve(m, f) {
      // galeria em zigue-zague
      m.fillRect(7, 6, 3, 7, f);
      m.fillRect(7, 12, 14, 4, f);
      m.fillRect(19, 15, 3, 5, f);
      // charcos de cobiça
      m.fillRect(10, 13, 2, 2, T.POISON);
      m.fillRect(16, 12, 2, 2, T.POISON);
      // charcos nas bordas da arena
      m.fillRect(8, 20, 2, 9, T.POISON);
      m.fillRect(26, 20, 2, 9, T.POISON);
    },
    spawns: [
      ['invejoso', 8, 8], ['invejoso', 9, 13], ['serpe', 14, 14],
      ['invejoso', 18, 13], ['invejoso', 20, 17], ['serpe', 12, 12],
      ['leviata', 18, 24],
    ],
    spirit: {
      name: 'Espírito de Santa Luzia', sprite: 'luzia', grant: 'luz',
      lines: (flags) => flags.milagres?.luz
        ? ['"Vai com a Luz, cavaleiro. Nenhuma treva prevalece contra ela."']
        : [
          'Entre as pedras verdes de cobiça, ergue-se uma jovem de olhar sereno — sereno, embora tenham-lhe tirado os olhos.',
          '"Quiseram apagar a minha vista, e eu passei a ver mais longe. A inveja é isto: olhos que ardem pelo que não lhes pertence."',
          '"Toma a minha Luz. Diante dela, todo olho maligno se fecha."',
          '✝ Milagre recebido: LUZ QUE CEGA — tecla 3 (35 de Fé)',
        ],
    },
  }),

  // ---------- Terceira Fossa: a Gula ----------
  fossa_gula: makeFossa({
    name: 'Terceira Fossa — A Gula',
    floor: T.FEASTFLOOR, dark: 'hell', arenaY: 19, alcoveY: 21,
    returnTo: { to: 'fossa_inveja', tx: 30, ty: 27 },
    descendTo: { to: 'fossa_avareza' },
    carve(m, f) {
      // corredor das migalhas
      m.fillRect(8, 6, 3, 6, f);
      m.fillRect(8, 11, 16, 4, f);
      m.fillRect(21, 14, 3, 5, f);
      // caldeirões ferventes
      m.fillRect(12, 12, 2, 2, T.LAVA);
      m.fillRect(18, 11, 2, 2, T.LAVA);
      // fogo nas bordas do salão
      m.fillRect(8, 19, 2, 9, T.LAVA);
      m.fillRect(26, 19, 2, 9, T.LAVA);
      // a mesa interminável (obstáculo)
      m.fillRect(13, 22, 8, 1, T.CWALL);
    },
    spawns: [
      ['possesso', 9, 8], ['possesso', 10, 13], ['serpe', 16, 13],
      ['possesso', 20, 12], ['invejoso', 22, 16],
      ['possesso', 12, 25], ['belzebu', 18, 25],
    ],
    spirit: {
      name: 'Espírito de Santo Antão', sprite: 'espirito', grant: 'jejum',
      lines: (flags) => flags.milagres?.jejum
        ? ['"Que o teu pão seja a Palavra, cavaleiro. O resto é migalha."']
        : [
          'Junto ao banquete apodrecido, um eremita de hábito branco ora de olhos fechados, indiferente ao festim.',
          '"No deserto, os demônios me ofereceram mesas fartas. Recusei — e cada recusa me fez mais forte que a fome."',
          '"Aprende o meu Jejum: quando a carne renuncia, nem o dente da besta a atravessa."',
          '✝ Milagre recebido: JEJUM QUE FORTALECE — tecla 4 (30 de Fé)',
        ],
    },
  }),

  // ---------- Quarta Fossa: a Avareza ----------
  fossa_avareza: makeFossa({
    name: 'Quarta Fossa — A Avareza',
    floor: T.TREASURE, dark: 'torch', arenaY: 20, alcoveY: 22,
    returnTo: { to: 'fossa_gula', tx: 30, ty: 26 },
    descendTo: { to: 'fossa_luxuria' },
    carve(m, f) {
      // o corredor dos cofres
      m.fillRect(8, 6, 3, 7, f);
      m.fillRect(8, 12, 15, 4, f);
      m.fillRect(20, 15, 3, 5, f);
      // pilhas de ouro amaldiçoado (obstáculos)
      m.fillRect(12, 13, 1, 2, T.CWALL);
      m.fillRect(17, 12, 1, 2, T.CWALL);
      m.fillRect(13, 23, 2, 2, T.CWALL);
      m.fillRect(21, 23, 2, 2, T.CWALL);
    },
    spawns: [
      ['invejoso', 9, 8], ['invejoso', 10, 13], ['possesso', 15, 14],
      ['serpe', 19, 13], ['invejoso', 21, 17], ['possesso', 11, 25],
      ['mamon', 18, 24],
    ],
    spirit: {
      name: 'Espírito de São Lourenço', sprite: 'espirito', grant: 'fogo',
      lines: (flags) => flags.milagres?.fogo
        ? ['"Podes virar-me deste lado: este já está no ponto." Ele sorri. "Vai, e queima o que não presta."']
        : [
          'Sobre as moedas frias, um jovem diácono irradia calor como brasa viva.',
          '"O prefeito exigiu os tesouros da Igreja. Eu lhe trouxe os pobres. Ele me deitou na grelha."',
          '"Aprendi no fogo o que o avarento nunca aprende: só é teu o que deste. Toma a minha chama."',
          '✝ Milagre recebido: FOGO QUE PURIFICA — tecla 5 (40 de Fé)',
        ],
    },
  }),

  // ---------- Quinta Fossa: a Luxúria ----------
  fossa_luxuria: makeFossa({
    name: 'Quinta Fossa — A Luxúria',
    floor: T.ROSEFLOOR, dark: 'hell', arenaY: 19, alcoveY: 22,
    returnTo: { to: 'fossa_avareza', tx: 30, ty: 27 },
    descendTo: { to: 'fossa_preguica' },
    carve(m, f) {
      // o corredor perfumado, serpenteante
      m.fillRect(8, 4, 3, 5, f);
      m.fillRect(11, 7, 6, 3, f);
      m.fillRect(15, 10, 3, 6, f);
      m.fillRect(12, 14, 4, 3, f);
      m.fillRect(18, 13, 6, 4, f);
      m.fillRect(20, 16, 3, 4, f); // descida ao jardim
      // espelhos d'água perfumada (venenosa)
      m.fillRect(13, 8, 2, 1, T.POISON);
      m.fillRect(19, 15, 2, 1, T.POISON);
      m.fillRect(11, 21, 2, 2, T.POISON);
      m.fillRect(23, 25, 2, 2, T.POISON);
    },
    spawns: [
      ['invejoso', 9, 6], ['serpe', 13, 8], ['possesso', 16, 12],
      ['serpe', 14, 15], ['invejoso', 20, 15], ['possesso', 22, 21],
      ['asmodeu', 18, 24],
    ],
    spirit: {
      name: 'Espírito de Santa Inês', sprite: 'mira', grant: 'cordeiro',
      lines: (flags) => flags.milagres?.cordeiro
        ? ['"Agnus custodit." Ela sorri, e o cordeiro invisível roça tua perna.']
        : [
          'No meio do jardim envenenado, uma menina de doze anos segura um cordeiro que não está lá.',
          '"Prometeram-me casamentos, riquezas, prazeres. Eu já tinha esposo: aquele a quem os anjos servem."',
          '"Recusei até a espada. Leva contigo o meu Cordeiro — ele guarda os que guardam o coração."',
          '✝ Milagre recebido: CORDEIRO GUARDIÃO — tecla 6 (45 de Fé)',
        ],
    },
  }),

  // ---------- Sexta Fossa: a Preguiça (fecho do Ato II) ----------
  fossa_preguica: makeFossa({
    name: 'Sexta Fossa — A Preguiça',
    floor: T.SLOTHFLOOR, dark: 'torch', arenaY: 19, alcoveY: 22,
    returnTo: { to: 'fossa_luxuria', tx: 30, ty: 27 },
    descendTo: null, // última fossa: sem descida
    carve(m, f) {
      // corredor lento e arrastado
      m.fillRect(8, 5, 3, 6, f);
      m.fillRect(8, 10, 15, 4, f);
      m.fillRect(20, 13, 3, 7, f);
      // escombros do descuido (obstáculos)
      m.fillRect(13, 11, 1, 2, T.CWALL);
      m.fillRect(17, 12, 1, 2, T.CWALL);
      m.fillRect(12, 22, 3, 2, T.CWALL);
      m.fillRect(20, 24, 3, 2, T.CWALL);
    },
    spawns: [
      ['possesso', 9, 7], ['possesso', 11, 12], ['serpe', 16, 11],
      ['possesso', 20, 15], ['invejoso', 14, 13], ['possesso', 12, 25],
      ['belfegor', 18, 24],
    ],
    spirit: {
      name: 'Espírito de São Bento', sprite: 'anastacio', grant: 'vade',
      lines: (flags) => flags.milagres?.vade
        ? ['"Ora et labora, cavaleiro. Nem o inferno resiste a uma alma que trabalha e reza."']
        : [
          'Entre os escombros do descuido, um velho monge de olhos vivos aponta uma cruz de metal.',
          '"A preguiça não é o descanso — é a alma que desiste de lutar. Eu enfrentei o demônio no meu próprio copo de vinho envenenado, e o parti com o sinal da cruz."',
          '"Grava na tua lança as palavras que gravei na minha medalha: VADE RETRO. Diante delas, as legiões recuam."',
          '✝ Milagre recebido: VADE RETRO — tecla 7 (40 de Fé)',
        ],
    },
  }),
};
