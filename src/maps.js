// Os mapas do Ato I: Capadócia, Silena, o Pântano e as Catacumbas.
// Cada definição traz geração, inimigos, altares, NPCs e portais.

import { T } from './constants.js';
import { rng } from './map.js';
import { FRAGMENT_TOTAL, fragmentCount } from './fragments.js';

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
  // entradas extras da v0.2 (ex.: o poço de Forte Sebaste na Fossa da Ira)
  if (cfg.extraPortals) portals.push(...cfg.extraPortals);

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
    anchors: cfg.anchors,
    treasures: cfg.treasures,
    mirages: cfg.mirages,
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
    npcs: [
      {
        tx: 14, ty: 18, name: 'São Miguel Arcanjo',
        sprite: 'anastacio', ghost: true, grantFlag: 'anjo',
        lines: (flags) => flags.anjo
          ? ['Guarda a fé, cavaleiro. A pequena luz cresce contigo — patente a patente, até o Serafim.']
          : [
            'Jorge. Não temas: o sonho era verdadeiro, e a estrada que se abre diante de ti não será andada sozinho.',
            'Recebe esta pequena luz: um anjo da guarda. Ele fere o que te cerca e crescerá contigo — a cada bênção dos santos, sobe uma patente da hierarquia celeste.',
            'Anjo, Arcanjo, Principado, Virtude, Potestade, Domínio... e, no cume, Serafim. Eu velarei de longe.',
          ],
      },
    ],
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

      // estradas: oeste-leste (da Capadócia à encruzilhada do Império) e descida ao pântano
      for (let x = 0; x < m.w; x++) {
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
        lines: (flags) => flags.serpenteDerrotada
          ? [
            'Voltaste. E as Portas... fecharam-se. Eu senti a terra suspirar de alívio.',
            'Silena inteira pede o batismo, cavaleiro. O rio vai ficar pequeno para tanta gente.',
            '(Ela sorri, entre lágrimas.) E tu vais mesmo... para Nicomédia. Vai. Que as rosas floresçam onde teu sangue cair, Jorge.',
          ]
          : flags.ascalonForjada
          ? [
            'Ascalon... Vejo-a brilhar daqui, cavaleiro. Os sete mártires numa só haste.',
            'O poço da praça. As mães ouvem sussurros subindo dele à noite — as Portas esperam por ti, lá embaixo.',
            'Silena inteira reza por ti. Vai... e volta.',
          ]
          : flags.dragaoDerrotado
          ? [
            'O Dragão... tombou? Silena está livre do tributo!',
            'Que as rosas floresçam onde teu sangue caiu, cavaleiro. Mas eu sinto... isto ainda não é o fim. As Portas continuam abertas lá embaixo.',
            'Os batedores dizem que a estrada a LESTE reabriu. Procura Forte Sebaste, a guarnição de São Sebastião — tua peregrinação começa por lá.',
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
        tx: 21, ty: 13, name: 'Prisca, a mercadora',
        sprite: 'mira', vendor: 'prisca',
        lines: () => ['Denários falam mais alto que orações por aqui.'],
      },
      {
        tx: 34, ty: 15, name: 'Rufo, o ferreiro',
        sprite: 'teodoro', vendor: 'rufo',
        lines: () => ['Traz denários e essa lança sai da minha forja mais mortal.'],
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
      { x: 43, y: 15, w: 1, h: 2, roads: true }, // encruzilhada: Estradas do Império
      // o poço da praça: a descida às Portas do Abismo (Ato III, D1)
      {
        x: 20, y: 13, w: 2, h: 1, to: 'portas_abismo', tx: 17, ty: 3,
        locked: (f) => !f.ascalonForjada,
        lockedMsg: 'Do poço sobe um sussurro antigo. O que dorme lá embaixo só teme uma lança que ainda não foi forjada.',
      },
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

  // ---------- Capítulo 1: Forte Sebaste (superfície de São Sebastião) ----------
  sebaste: {
    name: 'Forte Sebaste',
    w: 40, h: 26,
    mood: 'dark',
    gateFloor: T.STONE,
    generate(m) {
      m.border(2, T.TREE);

      // a estrada do Império chega pelo oeste
      m.fillRect(0, 12, 6, 2, T.PATH);

      // a muralha da guarnição e o pátio de pedra
      m.fillRect(5, 4, 30, 18, T.CWALL);
      m.fillRect(6, 5, 28, 16, T.STONE);
      m.set(5, 12, T.PATH); // o portão oeste do forte
      m.set(5, 13, T.PATH);

      // casernas
      m.fillRect(8, 6, 4, 3, T.ROOF);
      m.fillRect(14, 6, 4, 3, T.ROOF);
      m.fillRect(8, 15, 4, 3, T.ROOF);

      // o cárcere, ao norte do pátio leste (Marcelino espera lá dentro)
      m.fillRect(26, 5, 8, 6, T.CWALL);
      m.fillRect(27, 6, 6, 4, T.STONE);
      m.set(29, 10, T.GATE);
      m.set(30, 10, T.GATE);

      // o poço velho no canto sudeste — por ele os possessos subiram; desce à Fossa da Ira
      m.fillRect(29, 15, 6, 6, T.CWALL);
      m.fillRect(30, 16, 4, 4, T.STONE);
      m.set(31, 16, T.STAIRS);
      m.set(32, 16, T.STAIRS);
      m.set(31, 20, T.STONE); // a boca do poço ficou escancarada
      m.set(32, 20, T.STONE);
    },
    stamps: [
      ['houseThatch', 8, 6], ['houseCream', 14, 6], ['houseThatch', 8, 15],
    ],
    spawns: [
      ['possesso', 26, 12], ['possesso', 32, 12], ['possesso', 27, 14],
      ['possesso', 25, 17], ['carcereiro', 30, 13],
    ],
    altars: [[13, 17]],
    npcs: [
      {
        tx: 12, ty: 13, name: 'Pregoeiro Imperial',
        sprite: 'anastacio',
        lines: () => [
          '"POR ORDEM DO DIVINO IMPERADOR DIOCLECIANO, AUGUSTO: os que se disserem cristãos serão riscados das legiões, seus bens tomados, seus nomes lançados aos registros."',
          'O pregoeiro enrola o edito e evita teu olhar. "Primeiro edito, soldado. Dizem que virão outros... Eu só leio o que me mandam ler."',
        ],
      },
      {
        tx: 18, ty: 12, name: 'Cassiano, soldado',
        sprite: 'teodoro',
        lines: (flags) => flags.sebasteLivre
          ? [
            'Marcelino está livre, e a guarnição finge que não viu. Enquanto houver braços como o teu, ainda há honra nesta farda.',
            'O poço velho segue aberto, no canto do pátio. Que Deus te acompanhe lá embaixo, irmão.',
          ]
          : flags.chaveForte
            ? ['As chaves! Corre ao cárcere, ao norte do pátio — abre os ferrolhos antes que mudem de ideia.']
            : [
              'Jorge?! Pensei que estivesses em Silena... Chegaste em má hora, irmão: o primeiro edito chegou antes de ti.',
              'Marcelino recusou-se a queimar incenso ao imperador. Prenderam-no, e amanhã o entregam a Nicomédia.',
              'E há coisa pior: desde a leitura do edito, possessos rondam o pátio leste. O carcereiro é um deles agora — e as chaves ficaram com AQUILO.',
            ],
      },
      {
        tx: 29, ty: 7, name: 'Marcelino, o preso',
        sprite: 'anastacio',
        lines: (flags) => flags.sebasteLivre
          ? [
            '"Abriste o ferrolho... Deus te pague, irmão. Sebastião também vestiu esta farda — e foi por ela que o flecharam."',
            '"Escuta: os possessos subiram pelo poço velho, no canto leste do pátio. Lá embaixo arde a Fossa da Ira. Se buscas a bênção do santo, é por ali que se desce."',
          ]
          : [
            '(Atrás das grades, um soldado jovem ora baixinho, o rosto sereno.)',
            '"Se vieste zombar, zomba. Se vieste em nome Dele... então estas correntes já não pesam nada."',
          ],
      },
      {
        tx: 15, ty: 16, name: 'Prisca, a mercadora',
        sprite: 'mira', vendor: 'prisca',
        lines: () => ['Até aqui os denários chegam antes das más notícias.'],
      },
      {
        tx: 10, ty: 12, name: 'Rufo, o ferreiro',
        sprite: 'teodoro', vendor: 'rufo',
        lines: () => ['A forja do Império agora marca ferro de denúncia. Prefiro afiar a tua lança.'],
      },
    ],
    portals: [
      { x: 0, y: 12, w: 1, h: 2, roads: true }, // de volta às Estradas do Império
      { x: 31, y: 16, w: 2, h: 1, to: 'fossa_ira', tx: 4, ty: 3 }, // o poço da Ira
    ],
  },

  // ---------- a emboscada do Cavaleiro Guerra na estrada (GDD §2.6) ----------
  estrada_sebaste: {
    name: 'Estrada para Sebaste',
    w: 36, h: 16,
    mood: 'dark',
    generate(m) {
      const rand = rng(616);
      m.border(2, T.TREE);
      // a via romana, reta de oeste a leste
      for (let x = 0; x < m.w; x++) {
        m.set(x, 7, T.PATH);
        m.set(x, 8, T.PATH);
      }
      // beira de estrada calcinada: por onde a Guerra passa, nada verdeja
      m.scatter(rand, T.DEADTREE, 16);
      m.scatter(rand, T.ROCK, 6);
    },
    spawns: [['guerra', 20, 7]],
    altars: [[4, 5]],
    npcs: [],
    portals: [
      { x: 0, y: 6, w: 1, h: 4, roads: true }, // recuar para as Estradas
      {
        x: 35, y: 6, w: 1, h: 4, to: 'sebaste', tx: 2, ty: 12,
        // o Cavaleiro bloqueia a passagem enquanto não for vencido
        locked: (f) => !f.cavaleiros?.guerra,
        lockedMsg: '"NINGUÉM passa. A guerra cobra o seu pedágio." O Cavaleiro barra a estrada.',
      },
    ],
  },

  // ---------- Capítulo 2: Porto de Luzia (superfície de Santa Luzia) ----------
  porto_luzia: {
    name: 'Porto de Luzia',
    w: 42, h: 28,
    mood: 'peace',
    generate(m) {
      const rand = rng(1304);
      m.border(2, T.TREE);

      // o mar a leste, com a faixa de areia da praia
      m.fillRect(34, 0, 8, 28, T.WATER);
      m.fillRect(32, 0, 2, 28, T.SAND);

      // a estrada do Império chega pelo oeste e morre no cais
      m.fillRect(0, 14, 34, 2, T.PATH);
      // o cais de tábuas, avançando sobre a água até o farol
      m.fillRect(34, 14, 6, 2, T.PATH);

      // o farol da santa, num pontão de pedra sobre o mar
      m.fillRect(36, 10, 3, 4, T.CWALL);

      // praça do mercado
      m.fillRect(17, 11, 9, 5, T.PATH);

      // casario do porto
      for (const [hx, hy] of [[6, 6], [14, 5], [24, 6], [8, 20], [16, 21]]) {
        m.fillRect(hx, hy, 4, 3, T.ROOF);
      }

      // o armazém velho, de pedra — sob ele, escadas que ninguém cavou
      m.fillRect(25, 20, 6, 5, T.CWALL);
      m.fillRect(26, 21, 4, 3, T.STONE);
      m.set(25, 22, T.STONE); // a porta arrombada, a oeste

      m.scatter(rand, T.FLOWER, 18);
      m.scatter(rand, T.ROCK, 6);
    },
    stamps: [
      ['houseThatch', 6, 6], ['houseCream', 14, 5], ['houseThatch', 24, 6],
      ['houseCream', 8, 20], ['houseThatch', 16, 21],
    ],
    spawns: [
      ['invejoso', 28, 18], ['invejoso', 22, 19], ['invejoso', 30, 16],
      ['invejoso', 24, 23], ['serpe', 27, 17],
    ],
    altars: [[19, 12]],
    // a pira do farol, apagada desde os editos: o Espelho de Luzia a reacende
    beacons: [
      { tx: 37, ty: 14, msg: '✝ O Farol de Luzia arde de novo! A rota do Ermo reabre.', gold: 120 },
    ],
    npcs: [
      {
        tx: 10, ty: 13, name: 'Pregoeiro Imperial',
        sprite: 'anastacio',
        lines: () => [
          '"SEGUNDO EDITO DO DIVINO IMPERADOR: os bispos, presbíteros e diáconos dos cristãos serão lançados ao cárcere. As escrituras, entregues ao fogo."',
          'Ele baixa a voz: "O primeiro edito tomou os bens. Este toma os pastores. Não me perguntes o que o terceiro tomará, soldado."',
        ],
      },
      {
        tx: 22, ty: 12, name: 'Zósimo, o mercador',
        sprite: 'teodoro',
        lines: (flags) => flags.farois?.['porto_luzia:0']
          ? [
            'O farol... aceso? Sem óleo, sem pavio, sem pagar NADA?',
            'Ele conta moedas sem te olhar. "Fica com a tua luz, cavaleiro. Há coisas que não se compram... eu odeio isso."',
          ]
          : [
            'Aquele farol devia ser MEU. Quem guia os navios cobra o preço que quiser — e a cega velha o deixa apagar!',
            '"Comprei o óleo de toda a costa. Sem óleo, sem farol; sem farol, compram de mim as lamparinas. É só... comércio."',
          ],
      },
      {
        tx: 38, ty: 15, name: 'Lucila, a faroleira cega',
        sprite: 'mira',
        lines: (flags) => flags.farois?.['porto_luzia:0']
          ? [
            '"Sinto o calor no rosto... a pira arde! Deus te pague, cavaleiro."',
            '"Eu não preciso dela para ver — mas o mar precisa. E a costa do deserto, a LESTE, volta a ter caminho."',
          ]
          : flags.milagres?.luz
            ? ['"Trazes a luz da santa contigo — eu a sinto. Sobe ao cais e ergue o Espelho diante da pira (tecla R)."']
            : [
              '"O óleo, Zósimo comprou todo. Mas a pira desta torre nunca ardeu de óleo, cavaleiro — ardia da luz de Luzia."',
              '"Desde os editos, a chama morreu, e o que subiu do porão do armazém velho não foi fumaça... Desce lá, se tens coragem. A santa espera no fundo."',
            ],
      },
      {
        tx: 30, ty: 15, name: 'Talassia, a pescadora',
        sprite: 'mira',
        lines: (flags) => flags.milagres?.luz
          ? ['Os olhos verdes sumiram das águas... Os peixes voltam, cavaleiro. Ainda haverá ceia neste porto.']
          : [
            'O peixe fugiu da baía. Dizem que há OLHOS verdes na água, cobiçando as redes dos outros.',
            'E no armazém velho apareceram escadas que ninguém cavou. Ninguém desce. Quem desceu não conta.',
          ],
      },
      {
        tx: 18, ty: 16, name: 'Prisca, a mercadora',
        sprite: 'mira', vendor: 'prisca',
        lines: () => ['Num porto sem navios, até poção vende mais que peixe.'],
      },
      {
        tx: 24, ty: 16, name: 'Rufo, o ferreiro',
        sprite: 'teodoro', vendor: 'rufo',
        lines: () => ['Âncoras enferrujam no cais. Tua lança, não — ela tem para onde ir.'],
      },
    ],
    portals: [
      { x: 0, y: 13, w: 1, h: 4, roads: true }, // de volta às Estradas do Império
      { x: 28, y: 22, w: 1, h: 1, to: 'fossa_inveja', tx: 4, ty: 3 }, // o porão do armazém
    ],
  },

  // ---------- Capítulo 3: Ermo de Antão (superfície de Santo Antão) ----------
  ermo_antao: {
    name: 'Ermo de Antão',
    w: 44, h: 30,
    base: T.SAND,
    outside: T.ROCK,
    mood: 'peace',
    gateFloor: T.STONE,
    generate(m) {
      const rand = rng(251);
      m.border(2, T.ROCK);

      // a estrada do Império morre na areia, a oeste
      m.fillRect(0, 14, 14, 2, T.PATH);

      // o oásis dos eremitas, com sua ilhota inalcançável
      for (let y = 4; y <= 12; y++) {
        for (let x = 5; x <= 15; x++) {
          const dx = (x - 10) / 4.2;
          const dy = (y - 8) / 3;
          if (dx * dx + dy * dy <= 1) m.set(x, y, T.WATER);
        }
      }
      m.set(10, 8, T.SAND); // a ilhota do tesouro, cercada d'água

      // as celas de barro dos eremitas
      m.fillRect(6, 18, 4, 3, T.ROOF);
      m.fillRect(13, 20, 4, 3, T.ROOF);

      // o sítio escavado do banquete, no fundo do deserto: a boca da Gula
      m.fillRect(31, 15, 6, 5, T.CWALL);
      m.fillRect(32, 16, 4, 3, T.STONE);
      m.set(33, 15, T.GATE);
      m.set(34, 15, T.GATE);
      m.set(33, 18, T.STAIRS);
      m.set(34, 18, T.STAIRS);

      // dunas, ossadas e árvores ressequidas
      m.scatter(rand, T.ROCK, 16);
      m.scatter(rand, T.DEADTREE, 12);
      m.scatter(rand, T.BONES, 10);
    },
    stamps: [
      ['houseThatch', 6, 18], ['houseThatch', 13, 20],
    ],
    spawns: [
      ['imundo', 20, 10], ['serpe', 24, 18], ['imundo', 28, 8],
      ['serpe', 18, 24], ['imundo', 36, 10], ['imundo', 30, 24],
    ],
    altars: [[8, 16]],
    // a miragem do oásis: com o Cajado, a água falsa vira o passadiço da ilhota
    mirages: [
      { tx: 10, ty: 12, tiles: [[10, 9], [10, 10], [10, 11]], to: T.SAND },
    ],
    treasures: [
      { tx: 10, ty: 8, item: { kind: 'gold', amount: 140 } },
    ],
    npcs: [
      {
        tx: 4, ty: 13, name: 'Pregoeiro Imperial',
        sprite: 'anastacio',
        lines: () => [
          '"TERCEIRO EDITO DO DIVINO IMPERADOR: os sacerdotes presos que sacrificarem aos deuses serão soltos. Os que recusarem conhecerão os tormentos."',
          'A voz dele falha no fim. "Vim ler para a areia, soldado. Até os lagartos têm mais fé que Nicomédia."',
        ],
      },
      {
        tx: 9, ty: 15, name: 'Eremita Paulo',
        sprite: 'anastacio',
        lines: (flags) => flags.milagres?.jejum
          ? ['"Voltaste com o Jejum do santo... Sinto no teu passo: a fome já não te morde. Vai em paz, cavaleiro."']
          : flags.miragemRompida
            ? ['"Rompeste o banquete... Deus seja louvado. O poço da Gula está aberto — desce, e que Antão te guarde do que ronca lá embaixo."']
            : [
              'Bem-vindo ao Ermo, cavaleiro. Aqui jejuamos por escolha — mas ultimamente a fome anda... com fome de nós.',
              'Miragens de mesas fartas caminham sobre as dunas. O irmão Hilário seguiu o cheiro de pão assado para LESTE, três dias faz.',
              'Se o encontrares, não proves NADA do que a areia te oferecer.',
            ],
      },
      {
        tx: 12, ty: 17, name: 'Eremita Macário',
        sprite: 'teodoro',
        lines: () => [
          'Antão viveu oitenta anos nestas areias. Os demônios lhe mostravam banquetes, ouro, glória — e ele respondia com o silêncio.',
          '"A barriga vazia", dizia ele, "ouve melhor a Deus."',
        ],
      },
      {
        tx: 35, ty: 14, name: 'Irmão Hilário',
        sprite: 'anastacio',
        lines: (flags) => flags.miragemRompida
          ? [
            '"O pão... virou areia na minha boca. Três dias comi areia, irmão." Ele chora de vergonha e alívio.',
            '"Lá embaixo mora o dono da mesa: Belzebu, o Senhor das Moscas. Eu ouvia as asas dele em cada bocado. Cuidado."',
          ]
          : ['(Ele olha o vazio, salivando.) "Sentes o cheiro? Pão quente... mel... Senta comigo, irmão. A mesa é farta e a anfitriã não cobra nada..."'],
      },
      {
        tx: 33, ty: 13, name: 'A Anfitriã do Banquete',
        sprite: 'espirito', ghost: true, relic: true,
        grantFlag: 'miragemRompida',
        lines: (flags) => flags.miragemRompida
          ? ['Restam só mesas de areia desfeita e um cheiro doce de podridão. O poço escancarado ronca lá embaixo.']
          : [
            'Entre as dunas, mesas se estendem a perder de vista: pão quente, vinho, mel, carne assada. Uma figura de véus te acena.',
            '"Senta, peregrino. Comeste tão pouco, andaste tão longe... Prova. PROVA."',
            'Jorge fecha os olhos e ergue a cruz da lança. "O meu pão é fazer a vontade dAquele que me enviou."',
            'O banquete GRITA.',
          ],
      },
      {
        tx: 15, ty: 16, name: 'Prisca, a mercadora',
        sprite: 'mira', vendor: 'prisca',
        lines: () => ['Vendo água no deserto. Chama-se comércio, cavaleiro — os eremitas chamam de outra coisa.'],
      },
    ],
    portals: [
      { x: 0, y: 13, w: 1, h: 4, roads: true }, // de volta às Estradas do Império
      { x: 33, y: 18, w: 2, h: 1, to: 'fossa_gula', tx: 4, ty: 3 }, // o poço da Gula
    ],
  },

  // ---------- a emboscada do Cavaleiro Conquista na estrada costeira ----------
  estrada_porto: {
    name: 'Estrada Costeira do Porto',
    w: 36, h: 16,
    mood: 'dark',
    generate(m) {
      const rand = rng(618);
      m.border(2, T.TREE);
      // o mar beira a estrada ao norte
      m.fillRect(0, 0, 36, 3, T.WATER);
      m.fillRect(0, 3, 36, 2, T.SAND);
      // a via costeira, reta de oeste a leste
      for (let x = 0; x < m.w; x++) {
        m.set(x, 7, T.PATH);
        m.set(x, 8, T.PATH);
      }
      m.scatter(rand, T.DEADTREE, 10);
      m.scatter(rand, T.ROCK, 8);
    },
    spawns: [['conquista', 20, 7]],
    altars: [[4, 11]],
    npcs: [],
    portals: [
      { x: 0, y: 6, w: 1, h: 4, roads: true }, // recuar para as Estradas
      {
        x: 35, y: 6, w: 1, h: 4, to: 'porto_luzia', tx: 2, ty: 14,
        locked: (f) => !f.cavaleiros?.conquista,
        lockedMsg: '"Este porto será MEU, como tudo o mais." O Cavaleiro barra a estrada.',
      },
    ],
  },

  // ---------- Capítulo 4: Distrito do Tesouro (superfície de São Lourenço) ----------
  tesouro: {
    name: 'Distrito do Tesouro',
    w: 40, h: 26,
    mood: 'dark',
    gateFloor: T.STONE,
    generate(m) {
      const rand = rng(258);
      m.border(2, T.TREE);

      // a estrada do Império chega pelo oeste
      m.fillRect(0, 14, 8, 2, T.PATH);

      // o distrito calçado da Cidade Imperial
      m.fillRect(8, 4, 28, 18, T.STONE);

      // as casas do fisco
      for (const [hx, hy] of [[10, 6], [16, 6], [10, 17], [16, 17]]) {
        m.fillRect(hx, hy, 4, 3, T.ROOF);
      }

      // o Cofre Grande: a tesouraria selada, e sob ela a Fossa da Avareza
      m.fillRect(26, 6, 9, 9, T.CWALL);
      m.fillRect(27, 7, 7, 7, T.STONE);
      m.set(28, 14, T.GATE);
      m.set(29, 14, T.GATE);
      m.set(30, 9, T.STAIRS);
      m.set(31, 9, T.STAIRS);

      m.scatter(rand, T.FLOWER, 8);
    },
    stamps: [
      ['houseCream', 10, 6], ['houseCream', 16, 6],
      ['houseThatch', 10, 17], ['houseCream', 16, 17],
    ],
    spawns: [
      ['invejoso', 22, 10], ['invejoso', 24, 18], ['invejoso', 32, 18],
      ['invejoso', 20, 20], ['cobrador', 30, 18],
    ],
    altars: [[13, 13]],
    npcs: [
      {
        tx: 10, ty: 13, name: 'Pregoeiro Imperial',
        sprite: 'anastacio',
        lines: () => [
          '(Ele segura um edito lacrado, sem abri-lo.) "Quarto edito. TODOS sacrificarão aos deuses, sob pena de morte. Todos. Até as crianças."',
          'Ele te encara pela primeira vez. "Eu li três. Este eu não leio. Prende-me tu mesmo, se quiseres — já não sirvo a essa voz."',
        ],
      },
      {
        tx: 20, ty: 10, name: 'Prefeito Símaco',
        sprite: 'teodoro',
        lines: (flags) => flags.milagres?.fogo
          ? [
            '"Tu... cheiras a fumaça. Como ELE cheirava." O prefeito recua um passo.',
            '"Fica com as esmolas. Fica com os pobres. Fica com tudo — mas leva esse fogo para longe de mim."',
          ]
          : flags.cofreAberto
            ? ['"Quem te deu as chaves do MEU cofre?! Guardas! ...Guardas?" Ninguém vem. Os guardas também sumiram.']
            : [
              '"Ah, um soldado. Que oportuno. A Igreja de Roma esconde tesouros, e o edito os declara do Império — MEUS de administrar."',
              '"O diácono jura que os cofres da Igreja estão vazios. Mentira: mandei o cobrador recolher as esmolas à força. Queres trabalho? Traze-me o resto."',
            ],
      },
      {
        tx: 14, ty: 15, name: 'Diácono Justo',
        sprite: 'anastacio',
        lines: (flags) => flags.milagres?.fogo
          ? ['"Lourenço te deu a chama... Então é verdade o que ele disse na grelha: a noite desta cidade é que vai queimar."']
          : flags.cofreAberto
            ? ['"Abriste o Cofre Grande... As esmolas roubadas estão lá dentro — e o buraco por onde a avareza sobe. Desce e fecha-o na raiz, irmão."']
            : flags.chaveCofre
              ? ['"As chaves do Cobrador! O portão do Cofre Grande fica ao norte, no grande edifício. As esmolas dos pobres estão lá dentro."']
              : [
                '"O prefeito exigiu os tesouros da Igreja. Eu lhe respondi como Lourenço: nossos tesouros são os pobres."',
                '"Ele mandou o cobrador — e o que voltou não era mais um homem. AQUILO arrastou o baú das esmolas para o Cofre Grande, e as chaves tinem no cinto dele."',
              ],
      },
      {
        tx: 18, ty: 16, name: 'Inácio, o mendigo',
        sprite: 'teodoro',
        lines: (flags) => flags.cofreAberto
          ? ['"Devolveram o pão de hoje, cavaleiro. Deus conta os teus passos — e os teus denários também."']
          : ['"O cobrador levou até a tigela. A TIGELA, moço." Ele ri sem dentes. "Sou tesouro da Igreja, dizem. Tesouro enferrujado..."'],
      },
      {
        tx: 12, ty: 10, name: 'Prisca, a mercadora',
        sprite: 'mira', vendor: 'prisca',
        lines: () => ['No bairro do dinheiro, tudo custa o dobro. Menos de mim — só uns trocados a mais.'],
      },
      {
        tx: 22, ty: 15, name: 'Rufo, o ferreiro',
        sprite: 'teodoro', vendor: 'rufo',
        lines: () => ['Forjei grades para o fisco a vida toda. Afiar tua lança paga melhor a alma.'],
      },
    ],
    portals: [
      { x: 0, y: 13, w: 1, h: 4, roads: true }, // de volta às Estradas do Império
      { x: 30, y: 9, w: 2, h: 1, to: 'fossa_avareza', tx: 4, ty: 3 }, // sob o Cofre
    ],
  },

  // ---------- a emboscada do Cavaleiro Fome na estrada dos campos ----------
  estrada_tesouro: {
    name: 'Estrada dos Campos Queimados',
    w: 36, h: 16,
    mood: 'dark',
    gateFloor: T.PATH,
    generate(m) {
      const rand = rng(304);
      m.border(2, T.TREE);
      // a via entre o Ermo e a Cidade Imperial
      for (let x = 0; x < m.w; x++) {
        m.set(x, 7, T.PATH);
        m.set(x, 8, T.PATH);
      }
      // campos de trigo queimados: lama e tocos por onde a Fome passou
      m.fillRect(6, 3, 10, 3, T.MUD);
      m.fillRect(20, 10, 11, 4, T.MUD);
      m.scatter(rand, T.DEADTREE, 18);
      m.scatter(rand, T.BONES, 6);
    },
    spawns: [['fome', 20, 7]],
    altars: [[4, 11]],
    npcs: [],
    portals: [
      { x: 0, y: 6, w: 1, h: 4, roads: true }, // recuar para as Estradas
      {
        x: 35, y: 6, w: 1, h: 4, to: 'tesouro', tx: 2, ty: 14,
        locked: (f) => !f.cavaleiros?.fome,
        lockedMsg: '"Uma medida de trigo por um denário — e a tua carne de graça." O Cavaleiro barra a estrada.',
      },
    ],
  },

  // ---------- Capítulo 5: Vila do Jardim de Inês (superfície de Santa Inês) ----------
  jardim_ines: {
    name: 'Vila do Jardim de Inês',
    w: 42, h: 28,
    mood: 'peace',
    gateFloor: T.GRASS,
    generate(m) {
      const rand = rng(121);
      m.border(2, T.TREE);

      // a estrada do Império chega pelo oeste, entre as vinhas
      m.fillRect(0, 14, 30, 2, T.PATH);

      // os renques de videira, com falhas por onde se passa
      for (const vy of [5, 8, 11]) {
        for (let x = 4; x <= 24; x++) {
          if (x % 6 !== 2) m.set(x, vy, T.TREE);
        }
      }

      // o casario da vila
      for (const [hx, hy] of [[6, 18], [12, 20], [18, 18]]) {
        m.fillRect(hx, hy, 4, 3, T.ROOF);
      }

      // o roseiral murado: dentro, o poço que desce à Fossa da Luxúria
      m.fillRect(30, 6, 8, 8, T.CWALL);
      m.fillRect(31, 7, 6, 6, T.GRASS);
      m.set(33, 13, T.GATE);
      m.set(34, 13, T.GATE);
      m.set(33, 9, T.STAIRS);
      m.set(34, 9, T.STAIRS);
      for (let i = 0; i < 10; i++) {
        const x = 31 + Math.floor(rand() * 6);
        const y = 7 + Math.floor(rand() * 6);
        if (m.get(x, y) === T.GRASS) m.set(x, y, T.FLOWER);
      }

      m.scatter(rand, T.FLOWER, 40);
      m.scatter(rand, T.ROCK, 4);
    },
    stamps: [
      ['houseThatch', 6, 18], ['houseCream', 12, 20], ['houseThatch', 18, 18],
    ],
    spawns: [
      ['invejoso', 28, 18], ['invejoso', 32, 20], ['invejoso', 26, 22],
      ['invejoso', 36, 17], ['pretendente', 32, 18],
    ],
    altars: [[9, 16]],
    npcs: [
      {
        tx: 14, ty: 13, name: 'Ágata, a vinhateira',
        sprite: 'mira',
        lines: (flags) => flags.milagres?.cordeiro
          ? [
            'As rosas floresceram fora de estação — TODAS, numa noite só. A vila inteira cheira a jardim.',
            '"O Cordeiro passou por aqui", disse o velho Vidal. Eu acho que ele passou contigo, cavaleiro.',
          ]
          : [
            'Corvino pediu-me em casamento três vezes. Três vezes eu disse: já sou prometida — a Deus.',
            'Ele não aceitou. Trancou-se no roseiral com a chave da vila... e o que anda lá dentro agora NÃO é ele.',
          ],
      },
      {
        tx: 10, ty: 21, name: 'Corvino, o pretendente',
        sprite: 'teodoro',
        lines: (flags) => flags.defeated?.jardim_ines
          ? [
            '(A cor voltou-lhe ao rosto.) "Eu vi... eu vi o que o meu querer virou, cavaleiro. Tinha os MEUS olhos."',
            '"Dize a Ágata que não a incomodo mais. Um homem que viu a própria sombra aprende a andar no sol."',
          ]
          : ['(Um homem jaz de olhos abertos, pálido, murmurando.) "...ela será minha... a rosa é minha... o jardim inteiro... meu..."'],
      },
      {
        tx: 16, ty: 21, name: 'Vidal, o vinhateiro',
        sprite: 'teodoro',
        lines: (flags) => flags.roseiralAberto
          ? ['"O roseiral aberto de novo... Cuidado com o poço velho lá dentro, moço. Meu avô dizia que ele desce até onde o desejo não tem fundo."']
          : [
            'O roseiral era da vila inteira: casamentos, colheitas, batizados. Corvino o tomou como quem toma uma noiva à força.',
            'A sombra dele ronda os muros à noite. Traze a chave de volta, cavaleiro — mas não faças mal ao rapaz, se puderes. Ele já era bom.',
          ],
      },
      {
        tx: 20, ty: 14, name: 'O pregoeiro fugido',
        sprite: 'anastacio',
        lines: () => [
          '"Lembras-te de mim, soldado? Eu lia os editos. Agora leio vinhas — este silêncio paga melhor."',
          '"Foge de Nicomédia enquanto podes. Dizem que o imperador pergunta pelo cavaleiro dos milagres... pelo NOME."',
        ],
      },
      {
        tx: 12, ty: 16, name: 'Prisca, a mercadora',
        sprite: 'mira', vendor: 'prisca',
        lines: () => ['Vinho eu não vendo — o Vidal me mataria. Poções, por sorte, não são da terra.'],
      },
      {
        tx: 22, ty: 16, name: 'Rufo, o ferreiro',
        sprite: 'teodoro', vendor: 'rufo',
        lines: () => ['Ferrei cavalos a vida toda nesta vila. Tua lança é o primeiro trabalho que me faz rezar antes de malhar.'],
      },
    ],
    portals: [
      { x: 0, y: 13, w: 1, h: 4, roads: true }, // de volta às Estradas do Império
      { x: 33, y: 9, w: 2, h: 1, to: 'fossa_luxuria', tx: 4, ty: 3 }, // o poço do roseiral
    ],
  },

  // ---------- Capítulo 6: Mosteiro de Núrsia (superfície de São Bento) ----------
  nursia: {
    name: 'Mosteiro de Núrsia',
    w: 40, h: 26,
    mood: 'dark',
    outside: T.ROCK,
    generate(m) {
      const rand = rng(480);
      m.border(2, T.ROCK);

      // a subida da montanha chega pelo oeste
      m.fillRect(0, 14, 10, 2, T.PATH);

      // o mosteiro murado e seu claustro de pedra
      m.fillRect(10, 4, 24, 16, T.CWALL);
      m.fillRect(11, 5, 22, 14, T.STONE);
      m.set(10, 14, T.STONE); // o portal do mosteiro, sempre aberto
      m.set(10, 15, T.STONE);

      // o jardim do claustro
      m.fillRect(17, 8, 6, 4, T.GRASS);
      m.set(18, 9, T.FLOWER);
      m.set(21, 10, T.FLOWER);

      // o campanário mudo
      m.fillRect(28, 6, 3, 3, T.CWALL);

      // a cripta: a escada desce à Fossa da Preguiça
      m.set(13, 7, T.STAIRS);
      m.set(14, 7, T.STAIRS);

      m.scatter(rand, T.ROCK, 14);
      m.scatter(rand, T.DEADTREE, 8);
    },
    spawns: [
      ['possesso', 20, 7], ['possesso', 24, 13], ['possesso', 16, 12],
      ['possesso', 28, 15], ['possesso', 21, 17],
    ],
    altars: [[12, 17]],
    // o sino de bronze do campanário: só o Sino de Bento o faz cantar de novo
    beacons: [
      {
        tx: 29, ty: 10, inst: 'sino', label: 'Sino', bell: true,
        msg: '✝ O sino canta — e o mosteiro DESPERTA!',
        hint: 'O bronze está mudo de torpor. Só o Sino do santo o desperta...',
      },
    ],
    npcs: [
      {
        tx: 13, ty: 15, name: 'Abade Honorato',
        sprite: 'anastacio',
        lines: (flags) => flags.ascalonForjada
          ? [
            '"Ascalon... Setenta gerações de monges guardaram esta forja sem saber para quem. Agora sabemos."',
            '"Vai, cavaleiro. As Portas do Abismo dormem sob Silena — e o que dorme lá embaixo não é sono: é espera."',
          ]
          : flags.farois?.['nursia:0']
            ? ['"O sino... há meses eu não ouvia o sino. Os irmãos acordam, as vozes voltam ao coro. Deus te pague — e a forja te espera, se trouxeres os sete."']
            : [
              'Bem-vindo a Núrsia, cavaleiro. Perdoa os irmãos: não é preguiça — é FEITIÇO. Um torpor sobe da cripta como neblina fria.',
              'Eu resisto rezando as horas em voz alta, mas estou só. Os salmos morrem na boca deles, o sino está mudo.',
              'Desce à cripta, se tens coragem. O que ronca lá embaixo é o dono deste sono.',
            ],
      },
      {
        tx: 24, ty: 12, name: 'Irmão Góis, o ferreiro-monge',
        sprite: 'teodoro',
        lines: (flags) => flags.ascalonForjada
          ? ['"Meu malho serviu ao céu hoje." Ele mostra as mãos chamuscadas, feliz. "Setenta anos de brasas não valeram este dia."']
          : flags.farois?.['nursia:0']
            ? ['"Acordei com o sino e o malho na mão, como se soubesse. A Forja Fria é ali adiante — traze os fragmentos, e ela arderá."']
            : ['(De pé, o malho caído aos pés, ele dorme.) "...zzz... o ferro... espera... zzz..."'],
      },
      {
        tx: 19, ty: 9, name: 'Monge Plácido',
        sprite: 'anastacio',
        lines: (flags) => flags.farois?.['nursia:0']
          ? ['"Cantávamos as vésperas quando o sono veio... Que dia é hoje? Que MÊS?" Ele corre para o coro, envergonhado.']
          : ['(Ajoelhado no jardim, dorme sobre as próprias mãos.) "...zzz... et ne nos inducas... zzz..."'],
      },
      {
        tx: 27, ty: 16, name: 'Monge Mauro',
        sprite: 'teodoro',
        lines: (flags) => flags.farois?.['nursia:0']
          ? ['"O Abade resistiu sozinho todo esse tempo?... Nunca mais reclamo das vigílias. NUNCA."']
          : ['(Deitado atravessado na porta, ressona.) "...zzz... só mais uma hora, irmão celeireiro... zzz..."'],
      },
      {
        tx: 26, ty: 8, name: 'A Forja Fria de Núrsia',
        relic: true, forge: true,
        lines: (flags) => flags.ascalonForjada
          ? ['A forja ainda arde, mansa. Sobre a bigorna, só cinza dourada — Ascalon já canta na tua mão.']
          : !flags.farois?.['nursia:0']
            ? ['Uma forja antiga, fria como sepulcro. O fole está imóvel; o ferreiro dorme em pé ao lado. Nada arderá enquanto o mosteiro dormir.']
            : fragmentCount(flags) < FRAGMENT_TOTAL
              ? [`A forja respira, morna, à espera. Sete encaixes na bigorna aguardam as relíquias dos mártires — trazes ${fragmentCount(flags)} de ${FRAGMENT_TOTAL}.`]
              : [
                'Os sete fragmentos saltam da tua bolsa como chamados: o prego, a farpa, o elo, a cruz, a grelha, a lâmina, a medalha.',
                'Góis malha, e cada golpe soa como sino. O ferro comum da tua lança bebe as sete relíquias, uma a uma.',
                'Quando o clarão morre, o que jaz na bigorna já não é lança de guarnição. Tem nome antigo. Tem GUME de martírio.',
                '⚔ ASCALON — a lança forjada dos sete mártires.',
              ],
      },
      {
        tx: 15, ty: 17, name: 'Rufo, o ferreiro',
        sprite: 'teodoro', vendor: 'rufo',
        lines: () => ['Subi a montanha só para ver ESTA forja. Se ela um dia arder, cavaleiro, meu ofício inteiro terá valido.'],
      },
    ],
    portals: [
      { x: 0, y: 13, w: 1, h: 4, roads: true }, // de volta às Estradas do Império
      { x: 13, y: 7, w: 2, h: 1, to: 'fossa_preguica', tx: 4, ty: 3 }, // a cripta
    ],
  },

  // ---------- a emboscada do Cavaleiro Morte na subida da montanha ----------
  estrada_nursia: {
    name: 'Subida de Núrsia',
    w: 36, h: 16,
    mood: 'dark',
    outside: T.ROCK,
    generate(m) {
      const rand = rng(68);
      m.border(2, T.ROCK);
      // a estrada da montanha, entre penhascos
      for (let x = 0; x < m.w; x++) {
        m.set(x, 7, T.PATH);
        m.set(x, 8, T.PATH);
      }
      // por onde a Morte passa, ficam ossadas e árvores mortas
      m.scatter(rand, T.ROCK, 16);
      m.scatter(rand, T.DEADTREE, 12);
      m.scatter(rand, T.BONES, 10);
    },
    spawns: [['morte', 20, 7]],
    altars: [[4, 11]],
    npcs: [],
    portals: [
      { x: 0, y: 6, w: 1, h: 4, roads: true }, // recuar para as Estradas
      {
        x: 35, y: 6, w: 1, h: 4, to: 'nursia', tx: 2, ty: 14,
        locked: (f) => !f.cavaleiros?.morte,
        lockedMsg: '"O mosteiro já é meu. Dorme, cavaleiro — todos dormem no fim." A Morte barra a subida.',
      },
    ],
  },

  // ---------- Primeira Fossa: a Ira ----------
  fossa_ira: makeFossa({
    name: 'Primeira Fossa — A Ira',
    floor: T.HELLFLOOR, dark: 'hell', anteW: 8, arenaY: 19, alcoveY: 22,
    returnTo: { to: 'catacumbas', tx: 27, ty: 24 },
    descendTo: { to: 'fossa_inveja' },
    // o poço velho de Forte Sebaste desemboca no teto da antecâmara (C1)
    extraPortals: [{ x: 5, y: 2, w: 2, h: 1, to: 'sebaste', tx: 32, ty: 19 }],
    // a saliência do tesouro, do outro lado do rio de fogo: só a Corda alcança
    anchors: [[5, 22], [11, 22]],
    treasures: [
      { tx: 5, ty: 21, item: { kind: 'gold', amount: 90 } },
      { tx: 6, ty: 23, item: { kind: 'equip', slot: 'medalha', rarity: 2, name: 'Relicário do Mártir', value: 100 } },
    ],
    carve(m, f) {
      // descida serpenteante
      m.fillRect(8, 6, 3, 6, f);
      m.fillRect(8, 11, 12, 4, f);
      m.fillRect(18, 14, 3, 6, f);
      // rios de fogo nas bordas da arena
      m.fillRect(8, 19, 2, 9, T.LAVA);
      m.fillRect(26, 19, 2, 9, T.LAVA);
      m.fillRect(13, 11, 2, 2, T.LAVA);
      // a saliência isolada além do fogo, a oeste da arena
      m.fillRect(4, 21, 4, 3, f);
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
          '"E leva a minha corda de soldado. Com ela cruzarás fossos onde vires uma estaca — e amarrarás os furiosos (tecla R)."',
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
    // o porão do armazém velho do Porto desemboca no teto da antecâmara (C2)
    extraPortals: [{ x: 5, y: 2, w: 2, h: 1, to: 'porto_luzia', tx: 26, ty: 22 }],
    // a saliência do tesouro, além do charco de cobiça: só a Corda alcança
    anchors: [[5, 23], [11, 23]],
    treasures: [
      { tx: 5, ty: 22, item: { kind: 'gold', amount: 110 } },
      { tx: 6, ty: 24, item: { kind: 'equip', slot: 'escudo', rarity: 2, name: 'Pavês de Luzia', value: 5 } },
    ],
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
      // a saliência isolada além do veneno, a oeste da arena
      m.fillRect(4, 22, 4, 3, f);
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
          '"E leva o meu Espelho. Ergue-o diante das piras apagadas (tecla R) — e, no aperto, seu clarão cega os que te cercam."',
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
    // o poço do banquete do Ermo desemboca no teto da antecâmara (C3)
    extraPortals: [{ x: 5, y: 2, w: 2, h: 1, to: 'ermo_antao', tx: 33, ty: 17 }],
    // a despensa isolada além do fogo: só a Corda alcança
    anchors: [[5, 22], [11, 22]],
    treasures: [
      { tx: 5, ty: 21, item: { kind: 'gold', amount: 130 } },
      { tx: 6, ty: 23, item: { kind: 'equip', slot: 'armadura', rarity: 2, name: 'Loriga do Eremita', value: 55 } },
    ],
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
      // a despensa isolada além do fogo, a oeste do salão
      m.fillRect(4, 21, 4, 3, f);
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
          '"E leva o meu Cajado. Ele prova o chão falso das miragens (tecla R) — e, de perto, repele a gula que te cerca."',
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
    // a fenda sob o Cofre Grande desemboca no teto da antecâmara (C4)
    extraPortals: [{ x: 5, y: 2, w: 2, h: 1, to: 'tesouro', tx: 28, ty: 16 }],
    // a casa-forte selada a peso e contrapeso: só a Balança de Lourenço abre
    mirages: [
      {
        tx: 15, ty: 13, tiles: [[15, 10], [15, 11]], to: T.TREASURE,
        inst: 'balanca', label: 'Balança',
        msg: 'Os contrapesos descem — a porta de ferro da casa-forte sobe!',
        hint: 'Pesos e contrapesos selam a porta. Falta-te a Balança do diácono.',
      },
    ],
    treasures: [
      { tx: 14, ty: 8, item: { kind: 'gold', amount: 150 } },
      { tx: 16, ty: 8, item: { kind: 'equip', slot: 'arma', rarity: 2, name: 'Lâmina do Diácono', value: 8 } },
    ],
    carve(m, f) {
      // o corredor dos cofres
      m.fillRect(8, 6, 3, 7, f);
      m.fillRect(8, 12, 15, 4, f);
      m.fillRect(20, 15, 3, 5, f);
      // a casa-forte murada ao norte do corredor (porta em 15,10-11)
      m.fillRect(13, 7, 5, 3, f);
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
          '"E leva a minha Balança. Ela move pesos e contrapesos selados (tecla R) — e cobra dos que te ferem a esmola que negaram."',
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
    // o poço do roseiral desemboca no teto da antecâmara (C5)
    extraPortals: [{ x: 5, y: 2, w: 2, h: 1, to: 'jardim_ines', tx: 33, ty: 15 }],
    // a porta de sebes vivas que só se abre a algo puro: a Grinalda de Inês
    mirages: [
      {
        tx: 8, ty: 22, tiles: [[7, 22]], to: T.ROSEFLOOR,
        inst: 'grinalda', label: 'Grinalda',
        msg: 'As sebes se afastam diante da Grinalda: a porta pura se abre!',
        hint: 'As sebes vivas recusam tua mão. Só se abrem a algo puro...',
      },
    ],
    treasures: [
      { tx: 4, ty: 22, item: { kind: 'gold', amount: 170 } },
      { tx: 5, ty: 23, item: { kind: 'equip', slot: 'medalha', rarity: 2, name: 'Relicário das Rosas', value: 110 } },
    ],
    carve(m, f) {
      // o jardim escondido atrás da porta de sebes (7,22)
      m.fillRect(3, 21, 4, 3, f);
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
          '"E leva a minha Grinalda. As portas de jardim se abrem a ela (tecla R) — e, cercado, ergue-a: a paz que ela espalha acalma até o desejo."',
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
    // a cripta do mosteiro desemboca no teto da antecâmara (C6)
    extraPortals: [{ x: 5, y: 2, w: 2, h: 1, to: 'nursia', tx: 13, ty: 9 }],
    // o mecanismo emperrado de torpor: só o Sino de Bento o desperta
    mirages: [
      {
        tx: 8, ty: 22, tiles: [[7, 22]], to: T.SLOTHFLOOR,
        inst: 'sino', label: 'Sino',
        msg: 'O Sino canta — engrenagens seculares despertam e a porta desce!',
        hint: 'Um mecanismo emperrado de musgo e torpor. Nada o move... a não ser um chamado.',
      },
    ],
    treasures: [
      { tx: 4, ty: 22, item: { kind: 'gold', amount: 190 } },
      { tx: 5, ty: 23, item: { kind: 'equip', slot: 'escudo', rarity: 2, name: 'Escudo do Abade', value: 6 } },
    ],
    carve(m, f) {
      // a cela esquecida atrás do mecanismo (7,22)
      m.fillRect(3, 21, 4, 3, f);
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
          '"E leva o meu Sino. O que dorme de torpor — monge, bronze ou engrenagem — desperta ao seu chamado (tecla R)."',
          '✝ Milagre recebido: VADE RETRO — tecla 7 (40 de Fé)',
        ],
    },
  }),

  // ---------- Ato III (D1): as Portas do Abismo, sob o poço de Silena ----------
  portas_abismo: {
    name: 'As Portas do Abismo',
    w: 36, h: 34,
    base: T.HELLWALL, outside: T.HELLWALL, gateFloor: T.HELLFLOOR,
    dark: 'hell', mood: 'dark',
    generate(m) {
      const rand = rng(666333);
      m.fillRect(15, 2, 6, 5, T.HELLFLOOR);   // antecâmara sob o poço da praça
      m.fillRect(16, 7, 4, 6, T.HELLFLOOR);   // a descida talhada na rocha viva
      m.fillRect(8, 13, 20, 11, T.HELLFLOOR); // o átrio onde o Arauto espera
      m.fillRect(9, 14, 3, 2, T.LAVA);        // fogo líquido vertendo das paredes
      m.fillRect(24, 21, 3, 2, T.LAVA);
      // as grandes Portas, ao sul do átrio — só cedem com o Arauto
      m.fillRect(15, 25, 6, 5, T.HELLFLOOR);  // salão atrás das Portas
      for (let x = 16; x <= 19; x++) m.set(x, 24, T.GATE);
      m.set(17, 29, T.STAIRS);                // a escada que desce à Garganta
      m.set(18, 29, T.STAIRS);
      // ossadas dos que desceram antes
      for (let i = 0; i < 24; i++) {
        const x = Math.floor(rand() * m.w);
        const y = Math.floor(rand() * m.h);
        if (m.get(x, y) === T.HELLFLOOR && rand() < 0.6) m.set(x, y, T.BONES);
      }
    },
    spawns: [
      ['arauto', 18, 18],
      ['possesso', 11, 21], ['possesso', 25, 15],
      ['serpe', 10, 16], ['serpe', 26, 22],
    ],
    altars: [[17, 4]],
    npcs: [],
    portals: [
      { x: 15, y: 2, w: 6, h: 1, to: 'silena', tx: 20, ty: 14 },
      { x: 17, y: 29, w: 2, h: 1, to: 'garganta', tx: 17, ty: 3 },
    ],
  },

  // ---------- a Garganta do Abismo: o covil da Serpente Antiga ----------
  garganta: {
    name: 'A Garganta do Abismo',
    w: 34, h: 32,
    base: T.HELLWALL, outside: T.HELLWALL, gateFloor: T.HELLFLOOR,
    dark: 'hell', mood: 'dark',
    generate(m) {
      const rand = rng(121212);
      m.fillRect(15, 2, 5, 4, T.HELLFLOOR);   // chegada da escada
      m.fillRect(6, 6, 22, 4, T.LAVA);        // o rio de fogo
      m.fillRect(16, 6, 3, 4, T.HELLFLOOR);   // a ponte de rocha sobre ele
      m.fillRect(12, 10, 11, 4, T.HELLFLOOR); // a borda do Fogo do Abismo
      // a arena da Serpente: o fundo oval da Garganta
      const cx = 17, cy = 21, rx = 12, ry = 7;
      for (let y = 0; y < m.h; y++) {
        for (let x = 0; x < m.w; x++) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) m.set(x, y, T.HELLFLOOR);
        }
      }
      m.fillRect(8, 18, 2, 2, T.LAVA);
      m.fillRect(25, 23, 2, 2, T.LAVA);
      // o fundo selado da Garganta (abre quando a Serpente recua, ferida)
      m.fillRect(16, 28, 2, 1, T.HELLFLOOR);
      m.set(16, 29, T.GATE);
      m.set(17, 29, T.GATE);
      m.fillRect(14, 30, 6, 2, T.HELLFLOOR);
      m.set(16, 31, T.STAIRS); // a descida que a Serpente guardava (Ato III/D2)
      m.set(17, 31, T.STAIRS);
      for (let i = 0; i < 20; i++) {
        const x = Math.floor(rand() * m.w);
        const y = Math.floor(rand() * m.h);
        if (m.get(x, y) === T.HELLFLOOR && rand() < 0.6) m.set(x, y, T.BONES);
      }
    },
    spawns: [
      ['serpente', 17, 21],
      ['serpe', 10, 20], ['serpe', 24, 20],
    ],
    altars: [[13, 11]],
    npcs: [
      {
        tx: 21, ty: 11, name: 'O Fogo do Abismo',
        relic: true, consecrate: true,
        lines: (flags) => flags.ascalonConsagrada
          ? ['A fenda arde, mansa. O fogo que caiu com os anjos agora arde do teu lado da guerra.']
          : [
            'Uma fenda no chão verte um fogo que não é desta terra — o mesmo que caiu com os anjos, no princípio.',
            'Ascalon vibra na tua mão, faminta. O que o Abismo forjou contra ti pode ser temperado contra o próprio Abismo.',
            '⚔ Mergulha a lança: ASCALON É CONSAGRADA no fogo que a esperava.',
          ],
      },
    ],
    portals: [
      { x: 15, y: 2, w: 5, h: 1, to: 'portas_abismo', tx: 17, ty: 28 },
      // o fundo que a Serpente guardava: a descida à sombra de Nicomédia (D2)
      { x: 16, y: 31, w: 2, h: 1, to: 'nicomedia', tx: 17, ty: 3 },
    ],
  },

  // ---------- a Sombra de Nicomédia: a corte conjurada pela Serpente (D2) ----------
  nicomedia: {
    name: 'Nicomédia — a Sombra da Corte',
    w: 36, h: 30,
    base: T.CWALL, outside: T.CWALL, gateFloor: T.STONE,
    dark: 'torch', mood: 'dark',
    generate(m) {
      const rand = rng(303);
      m.fillRect(14, 2, 8, 3, T.STONE);       // o desembarque da escada
      m.fillRect(6, 5, 24, 21, T.STONE);      // a grande corte de mármore
      m.fillRect(16, 5, 4, 21, T.ROSEFLOOR);  // o tapete de púrpura da ilusão
      m.fillRect(13, 5, 10, 3, T.TREASURE);   // o estrado do trono, coberto de ouro
      // colunatas espectrais
      for (const cy of [10, 14, 18, 22]) {
        m.set(9, cy, T.CWALL);
        m.set(12, cy, T.CWALL);
        m.set(23, cy, T.CWALL);
        m.set(26, cy, T.CWALL);
      }
      // a ilusão racha nas bordas: o Abismo aparece por baixo do mármore
      m.fillRect(6, 5, 2, 2, T.LAVA);
      m.fillRect(28, 5, 2, 2, T.LAVA);
      m.fillRect(6, 24, 3, 2, T.LAVA);
      m.fillRect(27, 24, 3, 2, T.LAVA);
      // ossadas sob a púrpura: o preço da corte
      for (let i = 0; i < 12; i++) {
        const x = Math.floor(rand() * m.w);
        const y = Math.floor(rand() * m.h);
        if (m.get(x, y) === T.STONE && rand() < 0.6) m.set(x, y, T.BONES);
      }
    },
    spawns: [['serpente_final', 18, 19]],
    altars: [[15, 3]],
    npcs: [
      {
        tx: 17, ty: 6, name: 'A Sombra de Diocleciano',
        ghost: true, sprite: 'teodoro', grantFlag: 'nomePedido',
        lines: (flags) => flags.serpenteDerrotada
          ? ['O trono está vazio. A púrpura, desfeita, é só cinza sobre o mármore.']
          : flags.nomePedido
          ? ['"GEÓRGIOS." A sombra saboreia o nome como um vinho. "Nicomédia te espera, cavaleiro."']
          : [
            'No trono, uma púrpura sem corpo dentro. A voz vem de todos os lados e de nenhum.',
            '"Chegaste. O pregoeiro tinha razão: eu andava perguntando pelo teu nome, cavaleiro dos milagres."',
            '"Dize-o. Em Nicomédia haverá lugar para ele — no ouro de um estandarte... ou no mármore de um túmulo. A escolha sempre foi tua."',
            '"GEÓRGIOS", respondes. E a sombra sorri sem boca. "Até breve, então."',
          ],
      },
    ],
    portals: [
      { x: 14, y: 2, w: 8, h: 1, to: 'garganta', tx: 16, ty: 30 },
    ],
  },
};
