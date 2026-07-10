// A Lenda Áurea: Jorge e o Dragão — boot, mundo, mapas e game loop

import { TILE, TILE_PX, VIEW_W, VIEW_H, T, SCALE } from './constants.js';
import { input } from './input.js';
import { loadAssets } from './assets.js';
import { buildTiles, buildAltarSprite, buildObjects } from './sprites.js';
import { GameMap } from './map.js';
import { MAP_DEFS } from './maps.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import {
  Imundo, ImundoChefe, Amon, Dragao, Serpe,
  Invejoso, Leviata, Possesso, Belzebu, Mamon, Asmodeu, Belfegor,
  Carcereiro, CavaleiroGuerra, CavaleiroConquista,
} from './enemies.js';
import { initAudio, updateMusic, setMood, toggleMute, sfx } from './audio.js';
import { Npc } from './npc.js';
import { Fx } from './fx.js';
import { MIRACLES } from './miracles.js';
import {
  renderHud, renderDeath, renderVictory,
  renderLocation, renderDialogue, renderMiracles, renderBossBar,
} from './hud.js';
import { renderInventory } from './inventory.js';
import { Shop, VENDORS, renderShop } from './economy.js';
import { FRAGMENTS, MIRACLE_FRAGMENT, grantFragment } from './fragments.js';
import { MIRACLE_INSTRUMENT, hasInstrument } from './instruments.js';
import { GroundItem } from './items.js';
import { RoadsScreen, renderRoads, nodeForMap } from './roads.js';
import { Angel } from './angel.js';
import { serializeWorld, applyPlayer, saveGame, loadSave } from './save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// carrega a arte (Ninja Adventure Pack) antes de construir qualquer coisa
await loadAssets();

const tiles = buildTiles();
const camera = new Camera();

// cenografia: objeto desenhado com profundidade (o jogador passa por trás)
class Prop {
  constructor(img, x, baseY, scale = SCALE) {
    this.img = img;
    this.x = x;
    this.y = baseY;
    this.w = img.width * scale;
    this.h = img.height * scale;
  }

  render(ctx, cam) {
    ctx.drawImage(
      this.img,
      Math.round(this.x - cam.x - this.w / 2),
      Math.round(this.y - cam.y - this.h + 6),
      this.w, this.h
    );
  }
}

// tiles sólidos que viram cenografia: desenha-se o piso por baixo e um Prop por cima
const PROP_TILES = {
  [T.TREE]: ['tree', SCALE],
  [T.DEADTREE]: ['morta', SCALE],
  [T.ROCK]: ['boulder', 2],
};

function buildProps(map, def) {
  const objects = buildObjects();
  const props = [];
  for (let ty = 0; ty < map.h; ty++) {
    for (let tx = 0; tx < map.w; tx++) {
      const spec = PROP_TILES[map.get(tx, ty)];
      if (spec) {
        props.push(new Prop(objects[spec[0]], (tx + 0.5) * TILE_PX, (ty + 1) * TILE_PX, spec[1]));
      }
    }
  }
  for (const [name, tx, ty] of def.stamps || []) {
    const img = objects[name];
    props.push(new Prop(img, (tx + img.width / TILE / 2) * TILE_PX, (ty + img.height / TILE) * TILE_PX));
  }
  return props;
}

// mapas e NPCs são construídos uma única vez e reaproveitados
const gameMaps = {};
const mapNpcs = {};

function getMap(id) {
  if (!gameMaps[id]) {
    gameMaps[id] = new GameMap(MAP_DEFS[id]);
    mapNpcs[id] = (MAP_DEFS[id].npcs || []).map((d) => new Npc(d));
  }
  return gameMaps[id];
}

const ENEMY_TYPES = {
  imundo: Imundo, serpe: Serpe, chefe: ImundoChefe,
  amon: Amon, dragao: Dragao,
  invejoso: Invejoso, leviata: Leviata,
  possesso: Possesso, belzebu: Belzebu, mamon: Mamon, asmodeu: Asmodeu, belfegor: Belfegor,
  carcereiro: Carcereiro, guerra: CavaleiroGuerra, conquista: CavaleiroConquista,
};

// os Quatro Cavaleiros emboscam a primeira viagem a cada destino (GDD §2.6):
// viajar para `dest` sem a flag `need` desvia para o mapa da estrada
const AMBUSHES = {
  sebaste: {
    need: 'guerra', to: 'estrada_sebaste', tx: 2, ty: 7,
    warn: 'Um cavaleiro vermelho barra a estrada adiante...',
  },
  porto_luzia: {
    need: 'conquista', to: 'estrada_porto', tx: 2, ty: 7,
    warn: 'Um vulto branco como osso aguarda na estrada da costa...',
  },
};

// o navegador só libera áudio após o primeiro gesto do usuário
window.addEventListener('keydown', initAudio, { once: true });

const world = {
  mapId: null,
  map: null,
  fx: new Fx(),
  player: null,
  enemies: [],
  projectiles: [],
  spells: [],
  groundItems: [],
  altars: [],
  anchors: [],
  beacons: [],
  mirages: [],
  props: [],
  npcs: [],
  portals: [],
  kills: 0,
  total: 0,
  flags: {},
  mapStates: {},
};
// o Anjo da Guarda acompanha Jorge quando concedido (flags.anjo)
const angel = new Angel();

// exposto para depuração e testes automatizados
window.world = world;
window.angel = angel;
window.enterMap = (id, tx, ty) => enterMap(id, tx, ty);

// acha o tile livre mais próximo (spawn nunca dentro de parede/água)
function findFree(map, tx, ty) {
  for (let r = 0; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (!map.isSolidTile(tx + dx, ty + dy)) return [tx + dx, ty + dy];
      }
    }
  }
  return [tx, ty];
}

function enterMap(id, tx, ty) {
  // guarda o estado do mapa que estamos deixando
  if (world.mapId) {
    world.mapStates[world.mapId] = {
      enemies: world.enemies,
      groundItems: world.groundItems,
      kills: world.kills,
    };
  }

  const def = MAP_DEFS[id];
  const map = getMap(id);
  world.mapId = id;
  world.map = map;
  world.portals = def.portals || [];
  world.npcs = mapNpcs[id];
  world.props = buildProps(map, def);
  world.altars = (def.altars || []).map(([ax, ay]) => {
    const [fx0, fy0] = findFree(map, ax, ay);
    return { x: (fx0 + 0.5) * TILE_PX, y: (fy0 + 0.5) * TILE_PX };
  });
  // estacas onde a Corda de Sebastião pode prender (travessia de fossos)
  world.anchors = (def.anchors || []).map(([ax, ay]) => ({
    x: (ax + 0.5) * TILE_PX, y: (ay + 0.5) * TILE_PX,
  }));
  // piras que o Espelho de Luzia reacende (aceso fica em flags.farois)
  world.beacons = (def.beacons || []).map((b, i) => ({
    x: (b.tx + 0.5) * TILE_PX, y: (b.ty + 0.5) * TILE_PX,
    key: `${id}:${i}`, msg: b.msg, gold: b.gold,
  }));
  // miragens que o Cajado de Antão desfaz (chão falso vira passagem real);
  // as já reveladas são reaplicadas ao tilemap, que é cacheado entre visitas
  world.mirages = (def.mirages || []).map((mir, i) => ({
    x: (mir.tx + 0.5) * TILE_PX, y: (mir.ty + 0.5) * TILE_PX,
    key: `${id}:${i}`, tiles: mir.tiles, to: mir.to,
  }));
  for (const mir of world.mirages) {
    if (world.flags.miragens?.[mir.key]) {
      for (const [mx, my] of mir.tiles) map.set(mx, my, mir.to);
    }
  }
  world.projectiles = [];
  world.spells = [];
  world.total = (def.spawns || []).length;

  // o portão das catacumbas permanece aberto se já foi destrancado
  if (id === 'pantano' && world.flags.catacumbasAbertas) map.openGates();
  // o cárcere de Forte Sebaste permanece aberto depois de Marcelino livre
  if (id === 'sebaste' && world.flags.sebasteLivre) map.openGates();
  // o poço da Gula permanece escancarado depois do banquete rompido
  if (id === 'ermo_antao' && world.flags.miragemRompida) map.openGates();
  // alcovas de fossa cujo selo já foi rompido continuam abertas
  if (world.flags.sealsBroken?.[id]) map.openGates();

  const st = world.mapStates[id];
  if (st) {
    world.enemies = st.enemies;
    world.groundItems = st.groundItems;
    world.kills = st.kills;
  } else {
    world.kills = 0;
    world.groundItems = [];
    world.enemies = [];
    for (const [type, sx, sy] of def.spawns || []) {
      const [fx0, fy0] = findFree(map, sx, sy);
      const e = new ENEMY_TYPES[type](fx0, fy0);
      // chefe/mini-chefe já derrotado não renasce (missão cumprida)
      if ((e.isBoss || e.keyCarrier) && world.flags.defeated?.[id]) continue;
      world.enemies.push(e);
    }
    // tesouros de mapa: aparecem só enquanto não coletados (flag em tesouros)
    (def.treasures || []).forEach((t, i) => {
      const key = `${id}:${i}`;
      if (world.flags.tesouros?.[key]) return;
      world.groundItems.push(new GroundItem(
        (t.tx + 0.5) * TILE_PX, (t.ty + 0.5) * TILE_PX, { ...t.item, tesouro: key }
      ));
    });
  }

  const [px, py] = findFree(map, tx, ty);
  world.player.x = (px + 0.5) * TILE_PX;
  world.player.y = (py + 0.5) * TILE_PX;
  world.player.kbX = 0;
  world.player.kbY = 0;
  camera.follow(world.player.x, world.player.y, 0, map, true);
  locName = def.name;
  locTime = 3.5;

  // a emboscada: um Cavaleiro barra a estrada adiante (GDD §2.6)
  const amb = Object.values(AMBUSHES).find((a) => a.to === id);
  if (amb && !world.flags.cavaleiros?.[amb.need]) {
    world.fx.text(world.player.x, world.player.y - 70, amb.warn, '#e88060');
  }
}

// portão trancado: interação e aviso
function gateCenter() {
  const map = world.map;
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (map.get(x, y) === T.GATE) {
        sx += (x + 0.5) * TILE_PX;
        sy += (y + 0.5) * TILE_PX;
        n++;
      }
    }
  }
  return n ? { x: sx / n, y: sy / n } : null;
}

function fullReset(data) {
  world.mapStates = {};
  world.mapId = null;
  world.fx = new Fx();
  world.player = new Player(13, 20);
  if (data) applyPlayer(world.player, data, false);
  enterMap('capadocia', 13, 20);
  deathTime = 0;
  invOpen = false;
  dlg = null;
  shop = null;
  roads = null;
}

let elapsed = 0;
let deathTime = 0;
let invOpen = false;
let invSel = 0;
let dlg = null;
let shop = null;
let roads = null;
let locName = '';
let locTime = 0;
let gameState = 'title'; // title | play
let trans = null;        // transição de mapa com fade
const FADE = 0.24;       // duração de cada metade do fade (escurecer / clarear)
let last = performance.now();

const saved = loadSave();
if (saved) {
  world.flags = saved.flags || {};
  world.player = new Player(13, 20);
  applyPlayer(world.player, saved, false);
  enterMap(saved.mapId || 'capadocia', Math.floor(saved.x / TILE_PX), Math.floor(saved.y / TILE_PX));
  world.fx.text(world.player.x, world.player.y - 60, 'Jornada restaurada', '#e8dcb8');
} else {
  world.player = new Player(13, 20);
  enterMap('capadocia', 13, 20);
}

function tryInteract() {
  const p = world.player;

  // conversar (ou negociar) com quem estiver perto
  for (const npc of world.npcs) {
    if (npc.isNear(p)) {
      if (npc.vendor && VENDORS[npc.vendor]) {
        shop = new Shop(VENDORS[npc.vendor]);
        return;
      }
      dlg = {
        name: npc.name, lines: npc.getLines(world), idx: 0, grant: npc.grant,
        grantFlag: npc.grantFlag, portrait: npc.sprite, ghost: npc.ghost, reveal: 0,
      };
      return;
    }
  }

  // orar num altar
  for (const a of world.altars) {
    if (Math.hypot(p.x - a.x, p.y - a.y) < 60) {
      p.hp = p.hpMax;
      sfx('pray');
      const ok = saveGame(world);
      world.fx.text(a.x, a.y - 70, ok ? '✝ Jornada salva' : '✝ Restaurado', '#f8d860');
      world.fx.burst(a.x, a.y - 30, '#f0c040', 18, 160);
      return;
    }
  }

  // o cárcere de Forte Sebaste: as chaves do Carcereiro soltam Marcelino
  if (world.mapId === 'sebaste') {
    const gate = gateCenter();
    if (gate && Math.hypot(p.x - gate.x, p.y - gate.y) < 130) {
      if (world.flags.chaveForte) {
        world.map.openGates();
        world.flags.sebasteLivre = true;
        world.fx.text(gate.x, gate.y - 40, 'Os ferrolhos do cárcere cedem!', '#e8dcb8');
        world.fx.burst(gate.x, gate.y, '#c8c8d0', 16, 140);
        world.fx.addShake(4);
      } else {
        world.fx.text(gate.x, gate.y - 40, 'Trancado. As chaves ficaram com o Carcereiro...', '#c0b090');
      }
    }
    return;
  }

  // destrancar o portão das catacumbas (o da fossa só abre com a queda de Amon)
  if (world.mapId !== 'pantano') return;
  const gate = gateCenter();
  if (gate && Math.hypot(p.x - gate.x, p.y - gate.y) < 130) {
    if (world.flags.temChave) {
      world.map.openGates();
      world.flags.catacumbasAbertas = true;
      world.fx.text(gate.x, gate.y - 40, 'O portão range e cede...', '#e8dcb8');
      world.fx.burst(gate.x, gate.y, '#c8c8d0', 16, 140);
      world.fx.addShake(4);
    } else {
      world.fx.text(gate.x, gate.y - 40, 'Trancado. Os imundos levaram a chave...', '#c0b090');
    }
  }
}

// recua o cavaleiro um passo para dentro do mapa, na direção oposta à saída
function portalPushback(portal, p) {
  const side = portal.h >= portal.w
    ? (portal.x <= world.map.w - (portal.x + portal.w) ? -1 : 1)
    : 0;
  const vert = portal.h >= portal.w
    ? 0
    : (portal.y <= world.map.h - (portal.y + portal.h) ? -1 : 1);
  p.x -= side * TILE_PX * 1.6;
  p.y -= vert * TILE_PX * 1.6;
}

function checkPortals() {
  const p = world.player;
  const tx = Math.floor(p.x / TILE_PX);
  const ty = Math.floor(p.y / TILE_PX);
  for (const portal of world.portals) {
    if (tx >= portal.x && tx < portal.x + portal.w && ty >= portal.y && ty < portal.y + portal.h) {
      // passagem barrada pela história (ex.: o Cavaleiro Guerra na estrada)
      if (portal.locked?.(world.flags)) {
        portalPushback(portal, p);
        world.fx.text(p.x, p.y - 64, portal.lockedMsg || 'O caminho está bloqueado.', '#e88060');
        sfx('hurt');
        return;
      }
      if (portal.roads) {
        // encruzilhada: abre a tela de viagem (recuo para que fechar
        // a tela não a reabra no mesmo tile)
        portalPushback(portal, p);
        roads = new RoadsScreen(nodeForMap(world.mapId), world.flags);
        return;
      }
      // não troca na hora: inicia a transição com fade (a troca ocorre no escuro)
      trans = { t: 0, to: portal.to, tx: portal.tx, ty: portal.ty, swapped: false };
      return;
    }
  }
}

function renderMap(cam) {
  const map = world.map;
  const x0 = Math.floor(cam.x / TILE_PX);
  const y0 = Math.floor(cam.y / TILE_PX);
  const x1 = Math.ceil((cam.x + VIEW_W) / TILE_PX);
  const y1 = Math.ceil((cam.y + VIEW_H) / TILE_PX);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      let type = map.get(tx, ty);
      // cenografia e casas mostram o piso do mapa por baixo
      if (PROP_TILES[type] !== undefined || type === T.ROOF || type === T.WALL || type === T.DOOR) {
        type = map.base;
      }
      const frames = tiles[type];
      let frame;
      if (type === T.WATER || type === T.POISON || type === T.LAVA) {
        frame = frames[Math.floor(elapsed * 1.6) % frames.length]; // ondulação
      } else {
        frame = frames[(tx * 7 + ty * 13) % frames.length]; // variação fixa
      }
      ctx.drawImage(
        frame, 0, 0, TILE, TILE,
        Math.round(tx * TILE_PX - cam.x),
        Math.round(ty * TILE_PX - cam.y),
        TILE_PX, TILE_PX
      );
    }
  }
}

function renderAltars(cam) {
  const sprite = buildAltarSprite();
  const px = 16 * SCALE;
  for (const a of world.altars) {
    const pulse = 0.16 + 0.08 * Math.sin(elapsed * 2.5);
    const g = ctx.createRadialGradient(a.x - cam.x, a.y - cam.y - 10, 4, a.x - cam.x, a.y - cam.y - 10, 46);
    g.addColorStop(0, `rgba(248, 220, 120, ${pulse})`);
    g.addColorStop(1, 'rgba(248, 220, 120, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(a.x - cam.x - 46, a.y - cam.y - 56, 92, 92);
    ctx.drawImage(sprite, Math.round(a.x - cam.x - px / 2), Math.round(a.y - cam.y - px + 8), px, px);

    const p = world.player;
    if (p.alive && Math.hypot(p.x - a.x, p.y - a.y) < 60) {
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0e0b0';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText('E — Orar', a.x - cam.x, a.y - cam.y - px - 2);
      ctx.fillText('E — Orar', a.x - cam.x, a.y - cam.y - px - 2);
    }
  }
}

// estacas de amarração: onde a Corda de Sebastião prende para cruzar fossos
function renderAnchors(cam) {
  const p = world.player;
  const temCorda = hasInstrument(world.flags, 'corda');
  for (const a of world.anchors) {
    const x = a.x - cam.x, y = a.y - cam.y;
    // a estaca de madeira
    ctx.fillStyle = '#4a3420';
    ctx.fillRect(x - 4, y - 24, 8, 26);
    ctx.fillStyle = '#6a4e30';
    ctx.fillRect(x - 4, y - 24, 3, 26);
    // o rolo de corda no topo
    ctx.strokeStyle = '#c8a060';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 22, 6, 0, Math.PI * 2);
    ctx.stroke();

    if (temCorda && p.alive && Math.hypot(p.x - a.x, p.y - a.y) < 340) {
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText('R — Corda', x, y - 34);
      ctx.fillStyle = '#e8cf9a';
      ctx.fillText('R — Corda', x, y - 34);
    }
  }
}

// piras de farol: apagadas até o Espelho de Luzia refleti-las de volta à vida
function renderBeacons(cam) {
  const p = world.player;
  const temEspelho = hasInstrument(world.flags, 'espelho');
  for (const b of world.beacons) {
    const x = b.x - cam.x, y = b.y - cam.y;
    const lit = !!world.flags.farois?.[b.key];

    // o pedestal de pedra com a taça da pira
    ctx.fillStyle = '#6a6a72';
    ctx.fillRect(x - 5, y - 26, 10, 28);
    ctx.fillStyle = '#8a8a92';
    ctx.fillRect(x - 5, y - 26, 4, 28);
    ctx.fillStyle = '#4a4a52';
    ctx.fillRect(x - 9, y - 30, 18, 6);

    if (lit) {
      // a chama e o halo do farol aceso
      const fl = 0.75 + 0.25 * Math.sin(elapsed * 11) + 0.1 * Math.sin(elapsed * 27);
      const g = ctx.createRadialGradient(x, y - 34, 3, x, y - 34, 70);
      g.addColorStop(0, `rgba(248, 216, 120, ${0.5 * fl})`);
      g.addColorStop(1, 'rgba(248, 216, 120, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 70, y - 104, 140, 140);
      ctx.fillStyle = '#f8d878';
      ctx.beginPath();
      ctx.ellipse(x, y - 36, 5, 8 * fl, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff4c8';
      ctx.beginPath();
      ctx.ellipse(x, y - 34, 2.5, 4 * fl, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (temEspelho && p.alive && Math.hypot(p.x - b.x, p.y - b.y) < 200) {
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText('R — Espelho', x, y - 40);
      ctx.fillStyle = '#e8cf9a';
      ctx.fillText('R — Espelho', x, y - 40);
    }
  }
}

// miragens: o ar treme sobre o chão falso até o Cajado de Antão prová-lo
function renderMirages(cam) {
  const p = world.player;
  const temCajado = hasInstrument(world.flags, 'cajado');
  for (const mir of world.mirages) {
    if (world.flags.miragens?.[mir.key]) continue;
    const x = mir.x - cam.x, y = mir.y - cam.y;

    // ondas de calor tremulando sobre a miragem
    ctx.save();
    ctx.strokeStyle = '#f0e8c0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const ph = elapsed * 3 + i * 2.1;
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(ph * 1.7);
      ctx.beginPath();
      const oy = y - 18 - i * 10 + Math.sin(ph) * 3;
      ctx.moveTo(x - 10, oy);
      ctx.quadraticCurveTo(x - 5, oy - 4, x, oy);
      ctx.quadraticCurveTo(x + 5, oy + 4, x + 10, oy);
      ctx.stroke();
    }
    ctx.restore();

    if (temCajado && p.alive && Math.hypot(p.x - mir.x, p.y - mir.y) < 200) {
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText('R — Cajado', x, y - 48);
      ctx.fillStyle = '#e8cf9a';
      ctx.fillText('R — Cajado', x, y - 48);
    }
  }
}

// Marca TODO portal com um limiar luminoso + seta de direção, para que toda
// saída seja visível — inclusive as de volta das catacumbas e das fossas, que
// antes eram piso comum colado na parede. Desenhado depois da escuridão para
// brilhar através dela.
function renderPortals(cam) {
  const map = world.map;
  const p = world.player;
  for (const portal of world.portals) {
    const rx = portal.x * TILE_PX - cam.x;
    const ry = portal.y * TILE_PX - cam.y;
    const rw = portal.w * TILE_PX;
    const rh = portal.h * TILE_PX;
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;

    // direção da saída pelo FORMATO do portal: faixa vertical (mais alta que
    // larga) é uma porta lateral (◄►); faixa horizontal, uma porta cima/baixo (▲▼).
    // O sentido é dado pela borda do mapa que aquele eixo encosta.
    const dL = portal.x, dR = map.w - (portal.x + portal.w);
    const dT = portal.y, dB = map.h - (portal.y + portal.h);
    let ax = 0, ay = 0, arrow = '▼';
    if (portal.h >= portal.w) {
      if (dL <= dR) { ax = -1; arrow = '◄'; } else { ax = 1; arrow = '►'; }
    } else {
      if (dT <= dB) { ay = -1; arrow = '▲'; } else { ay = 1; arrow = '▼'; }
    }

    const wcx = (portal.x + portal.w / 2) * TILE_PX;
    const wcy = (portal.y + portal.h / 2) * TILE_PX;
    const near = p.alive && Math.hypot(p.x - wcx, p.y - wcy) < 120;
    const pulse = 0.22 + 0.1 * Math.sin(elapsed * 3);

    ctx.save();
    // limiar luminoso sobre os tiles do portal
    ctx.globalAlpha = near ? 0.5 : pulse;
    ctx.fillStyle = '#f0d060';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.globalAlpha = near ? 0.95 : 0.45 + pulse;
    ctx.strokeStyle = '#f8e8a0';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);

    // setas deslizando para fora, indicando o sentido da passagem
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#fff4c8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const slide = (elapsed * 36) % 18;
    for (let i = 0; i < 2; i++) {
      const off = i * 12 + slide - 18;
      const bx = cx + ax * off;
      const by = cy + ay * off;
      ctx.beginPath();
      if (ax !== 0) {
        ctx.moveTo(bx - ax * 6, by - 8);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx - ax * 6, by + 8);
      } else {
        ctx.moveTo(bx - 8, by - ay * 6);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + 8, by - ay * 6);
      }
      ctx.stroke();
    }

    // rótulo com o destino, posicionado longe da parede que o portal encosta
    const name = portal.roads ? 'Estradas do Império' : (MAP_DEFS[portal.to]?.name || 'Passagem');
    let lx = cx, ly;
    if (ay < 0) ly = ry + rh + 18;      // saída em cima → rótulo abaixo (dentro da sala)
    else if (ay > 0) ly = ry - 8;        // saída embaixo → rótulo acima
    else ly = cy - 14;                   // saída lateral → rótulo acima do centro
    ctx.globalAlpha = near ? 1 : 0.75;
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
    ctx.lineWidth = 3;
    ctx.strokeText(`${arrow} ${name}`, lx, ly);
    ctx.fillStyle = '#f8e8b0';
    ctx.fillText(`${arrow} ${name}`, lx, ly);
    ctx.restore();
  }
}

// Bússola de saídas: quando um portal está fora de quadro, uma seta na borda
// da tela aponta para ele com o nome do destino — o jogador nunca fica perdido
// sobre por onde sair, mesmo num mapa grande ou escuro.
function renderPortalCompass(cam) {
  // topo com folga para não colidir com as barras do HUD / barra de chefe
  const padX = 34, padTop = 88, padBottom = 34;
  const pulse = 0.7 + 0.2 * Math.sin(elapsed * 4);
  for (const portal of world.portals) {
    const sx = (portal.x + portal.w / 2) * TILE_PX - cam.x;
    const sy = (portal.y + portal.h / 2) * TILE_PX - cam.y;
    // se o portal aparece na tela, o marcador no chão já basta
    if (sx > 40 && sx < VIEW_W - 40 && sy > 40 && sy < VIEW_H - 40) continue;

    const ex = Math.max(padX, Math.min(VIEW_W - padX, sx));
    const ey = Math.max(padTop, Math.min(VIEW_H - padBottom, sy));
    const ang = Math.atan2(sy - ey, sx - ex);

    ctx.save();
    // disco de contraste + seta dourada apontando para a saída
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(14, 9, 5, 0.85)';
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = pulse;
    ctx.translate(ex, ey);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fillStyle = '#f0d060';
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 6, 2, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// escuridão das profundezas: tocha nas catacumbas, brasa avermelhada nas fossas
function renderDarkness(cam, mode) {
  const p = world.player;
  const x = p.x - cam.x;
  const y = p.y - cam.y - 12;
  const flicker = 6 * Math.sin(elapsed * 9) + 4 * Math.sin(elapsed * 23);
  const dark = mode === 'hell' ? '20, 5, 4' : '4, 3, 8';
  const radius = mode === 'hell' ? 300 : 240;
  const g = ctx.createRadialGradient(x, y, 60, x, y, radius + flicker);
  g.addColorStop(0, `rgba(${dark}, 0)`);
  g.addColorStop(0.55, `rgba(${dark}, 0.4)`);
  g.addColorStop(1, `rgba(${dark}, ${mode === 'hell' ? 0.82 : 0.93})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

// tela de título
function renderTitleScreen() {
  ctx.fillStyle = '#0c0a08';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.textAlign = 'center';
  // a cruz atrás do título
  ctx.globalAlpha = 0.12 + 0.03 * Math.sin(elapsed * 1.5);
  ctx.fillStyle = '#e8c860';
  ctx.fillRect(VIEW_W / 2 - 22, 60, 44, 300);
  ctx.fillRect(VIEW_W / 2 - 100, 130, 200, 44);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#8a7442';
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('Capadócia, século III', VIEW_W / 2, 150);
  ctx.fillStyle = '#e8c860';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('A LENDA ÁUREA', VIEW_W / 2, 205);
  ctx.fillStyle = '#d8ccaa';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('Jorge e o Dragão', VIEW_W / 2, 240);

  const pulse = 0.55 + 0.45 * Math.sin(elapsed * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#f0e0b0';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(saved ? 'ENTER — continuar a jornada' : 'ENTER — começar a jornada', VIEW_W / 2, 330);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#9a8a62';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('WASD mover · J espada · K lança · ESPAÇO esquiva · L fúria · 1-2 milagres', VIEW_W / 2, 400);
  ctx.fillText('E falar/orar · Q poção · R corda · I bolsa · M silenciar', VIEW_W / 2, 422);
  ctx.restore();
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;
  locTime = Math.max(0, locTime - dt);

  if (gameState === 'title') {
    if (input.wasPressed('interact')) {
      gameState = 'play';
      locTime = 3.5;
    }
    renderTitleScreen();
    input.endFrame();
    requestAnimationFrame(frame);
    return;
  }

  const player = world.player;

  // --- trilha sonora: chefe por perto manda na música ---
  updateMusic();
  if (input.wasPressed('mute')) {
    const m = toggleMute();
    world.fx.text(player.x, player.y - 60, m ? 'Silêncio' : 'Música', '#c0b090');
  }
  const bossNear = world.enemies.some(
    (e) => e.isBoss && e.alive && Math.hypot(e.x - player.x, e.y - player.y) < 620
  );
  setMood(bossNear ? 'boss' : (MAP_DEFS[world.mapId].mood || 'peace'));

  // --- update ---
  if (dlg) {
    // máquina de escrever: a fala se revela; E completa a linha ou avança a página
    const full = dlg.lines[dlg.idx];
    dlg.reveal = Math.min(full.length, dlg.reveal + dt * 48);
    if (input.wasPressed('interact') || input.wasPressed('attack')) {
      if (dlg.reveal < full.length) {
        dlg.reveal = full.length; // primeira pressão: revela a fala inteira
      } else {
        dlg.idx++;
        dlg.reveal = 0;
        if (dlg.idx >= dlg.lines.length) {
          // relíquias e espíritos concedem seu milagre ao fim da conversa
          if (dlg.grant && !world.flags.milagres?.[dlg.grant]) {
            world.flags.milagres = world.flags.milagres || {};
            world.flags.milagres[dlg.grant] = true;
            const m = MIRACLES[dlg.grant];
            world.fx.text(player.x, player.y - 66, `✝ ${m.name} (${m.key})`, '#a8c8f8');
            world.fx.burst(player.x, player.y - 20, '#a8c8f8', 20, 200);
            // cada bênção traz a relíquia física do santo: um fragmento de Ascalon
            const fragId = MIRACLE_FRAGMENT[dlg.grant];
            if (fragId && grantFragment(world, fragId)) {
              const f = FRAGMENTS.find((x) => x.id === fragId);
              world.fx.text(player.x, player.y - 90, `✦ Fragmento de Ascalon: ${f.relic}`, '#f0d060');
            }
            // ... e o instrumento do santo (posse derivada do próprio milagre)
            const inst = MIRACLE_INSTRUMENT[dlg.grant];
            if (inst) {
              world.fx.text(player.x, player.y - 114, `⚒ Instrumento: ${inst.name}`, '#c8a060');
            }
          }
          // dons que não são milagres (o Anjo da Guarda de São Miguel, etc.)
          if (dlg.grantFlag && !world.flags[dlg.grantFlag]) {
            world.flags[dlg.grantFlag] = true;
            if (dlg.grantFlag === 'anjo') {
              world.fx.text(player.x, player.y - 66, '✝ Anjo da Guarda!', '#b8d8f8');
              world.fx.burst(player.x, player.y - 40, '#d8e8ff', 24, 220);
            }
            // o banquete do Ermo se desfaz em possessos e escancara o poço
            if (dlg.grantFlag === 'miragemRompida') {
              world.map.openGates();
              world.fx.addShake(7);
              world.fx.text(player.x, player.y - 66, 'A miragem se desfaz! O poço da Gula se escancara...', '#e88060');
              for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2 + 0.5;
                const m = new Possesso(0, 0);
                m.x = player.x + Math.cos(a) * 90;
                m.y = player.y + Math.sin(a) * 90;
                world.enemies.push(m);
                world.total += 1;
                world.fx.burst(m.x, m.y - 10, '#8ab040', 12, 160);
              }
            }
          }
          dlg = null;
        }
      }
    }
  } else if (trans) {
    // transição de mapa: o jogo congela enquanto escurece e clareia;
    // a troca acontece no ponto mais escuro, então o corte não aparece
    trans.t += dt;
    if (!trans.swapped && trans.t >= FADE) {
      enterMap(trans.to, trans.tx, trans.ty);
      trans.swapped = true;
    }
    if (trans.t >= FADE * 2) trans = null;
  } else if (roads) {
    // tela de viagem aberta: o mundo congela
    if (input.wasPressed('inventory')) roads = null;
    else {
      if (input.wasPressed('left') || input.wasPressed('up')) roads.move(-1);
      if (input.wasPressed('right') || input.wasPressed('down')) roads.move(1);
      if (input.wasPressed('interact')) {
        let dest = roads.confirm(world.flags);
        // um Cavaleiro do Apocalipse embosca a primeira ida a cada destino
        const amb = dest && AMBUSHES[dest.to];
        if (amb && !world.flags.cavaleiros?.[amb.need]) dest = amb;
        if (dest) {
          trans = { t: 0, to: dest.to, tx: dest.tx, ty: dest.ty, swapped: false };
          roads = null;
        }
      }
    }
  } else if (shop) {
    // loja aberta: o mundo congela como no inventário
    if (input.wasPressed('inventory')) shop = null;
    else {
      if (input.wasPressed('left')) shop.setTab(shop.tab - 1, player);
      if (input.wasPressed('right')) shop.setTab(shop.tab + 1, player);
      if (input.wasPressed('up')) shop.move(-1, player);
      if (input.wasPressed('down')) shop.move(1, player);
      if (input.wasPressed('interact')) shop.confirm(player, world);
    }
  } else if (invOpen) {
    // inventário aberto: navegação da bolsa
    if (input.wasPressed('inventory')) invOpen = false;
    const n = player.inventory.length;
    if (n > 0) {
      if (input.wasPressed('up')) invSel = (invSel + n - 1) % n;
      if (input.wasPressed('down')) invSel = (invSel + 1) % n;
      if (input.wasPressed('interact')) {
        player.equipItem(invSel, world);
        invSel = Math.min(invSel, Math.max(0, player.inventory.length - 1));
      }
      if (input.wasPressed('heavy')) {
        player.inventory.splice(invSel, 1);
        invSel = Math.min(invSel, Math.max(0, player.inventory.length - 1));
      }
    }
  } else {
    if (input.wasPressed('inventory') && player.alive) {
      invOpen = true;
      invSel = 0;
    }
    player.update(dt, world);
    if (player.alive && player.state === 'normal' && input.wasPressed('interact')) tryInteract();
    if (input.wasPressed('potion')) player.usePotion(world);
    angel.update(dt, world);
    for (const e of world.enemies) e.update(dt, world);
    for (const p of world.projectiles) p.update(dt, world);
    world.projectiles = world.projectiles.filter((p) => !p.dead);
    for (const s of world.spells) s.update(dt, world);
    world.spells = world.spells.filter((s) => !s.dead);
    for (const g of world.groundItems) g.update(dt, world);
    world.groundItems = world.groundItems.filter((g) => !g.dead);
    world.fx.update(dt);
    if (player.alive) checkPortals();
    camera.follow(player.x, player.y, dt, world.map);

    if (!player.alive) {
      deathTime += dt;
      // a morte preserva a jornada (nível, ouro, itens), mas o mal renasce
      if (input.wasPressed('interact')) fullReset(serializeWorld(world));
    }
  }

  // --- render ---
  const shake = invOpen || dlg || shop || roads ? 0 : world.fx.shake;
  const cam = {
    x: camera.x + (Math.random() - 0.5) * shake,
    y: camera.y + (Math.random() - 0.5) * shake,
  };

  ctx.fillStyle = '#12100d';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  renderMap(cam);
  renderAltars(cam);
  renderAnchors(cam);
  renderBeacons(cam);
  renderMirages(cam);
  for (const g of world.groundItems) g.render(ctx, cam);

  // entidades e cenografia ordenadas por Y (quem está mais ao sul desenha por cima)
  const entities = [...world.enemies.filter((e) => e.alive), ...world.npcs, ...world.props, world.player];
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) {
    if (e instanceof Npc) e.render(ctx, cam, world, elapsed);
    else e.render(ctx, cam);
  }

  for (const p of world.projectiles) p.render(ctx, cam);
  for (const s of world.spells) s.render(ctx, cam);
  world.fx.render(ctx, cam);
  world.fx.renderTexts(ctx, cam);

  const darkMode = MAP_DEFS[world.mapId].dark;
  if (darkMode) renderDarkness(cam, darkMode);

  // o anjo é uma luz: desenhado por cima da escuridão
  angel.render(ctx, cam, world);

  // marcadores de portal por cima da escuridão: exits sempre visíveis
  renderPortals(cam);
  // bússola de borda para as saídas fora de quadro
  renderPortalCompass(cam);

  // clarão da Luz que Cega
  if (world.fx.whiteFlash > 0) {
    ctx.fillStyle = `rgba(248, 244, 216, ${Math.min(0.85, world.fx.whiteFlash * 2)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  renderHud(ctx, world.player, world, elapsed);
  renderMiracles(ctx, world.player, world, MIRACLES);
  const boss = world.enemies.find((e) => e.isBoss && e.alive);
  if (boss && Math.hypot(boss.x - world.player.x, boss.y - world.player.y) < 620) {
    renderBossBar(ctx, boss);
  }
  renderLocation(ctx, locName, locTime);
  if (world.total > 0 && world.kills >= world.total) renderVictory(ctx, elapsed);
  if (!world.player.alive) renderDeath(ctx, deathTime);
  if (invOpen) renderInventory(ctx, world.player, invSel, world.flags);
  if (shop) renderShop(ctx, shop, world.player);
  if (roads) renderRoads(ctx, roads, world.flags, elapsed);
  if (dlg) renderDialogue(ctx, dlg);

  // fade da transição de mapa, por cima de tudo (escurece → troca → clareia)
  if (trans) {
    const a = trans.t < FADE ? trans.t / FADE : 1 - (trans.t - FADE) / FADE;
    ctx.fillStyle = `rgba(8, 6, 4, ${Math.max(0, Math.min(1, a))})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
