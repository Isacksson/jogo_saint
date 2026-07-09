// Estradas do Império — a tela de viagem que liga Silena aos hubs da v0.2 (GDD §2.2).
//
// Um mapa de nós ligados por caminhos, como o overworld de Lufia: cada região é
// um mapa próprio e a estrada é a costura entre elas. Os destinos se desbloqueiam
// um a um conforme a história avança — o Bloco C só precisa gravar
// `world.flags.roads[id] = true` (persistido no save) e apontar `dest` para o
// mapa novo quando ele existir.

import { VIEW_W, VIEW_H } from './constants.js';
import { sfx } from './audio.js';

// posições em fração do painel (x, y) — um esboço de província romana:
// Capadócia a oeste, a costa a leste, o mosteiro nas montanhas do norte.
export const NODES = [
  {
    id: 'capadocia', name: 'Capadócia', px: 0.13, py: 0.66,
    desc: 'A guarnição onde tudo começou. O lago, a estrada, a casa.',
    dest: { to: 'capadocia', tx: 45, ty: 18 },
    unlocked: () => true,
  },
  {
    id: 'silena', name: 'Silena', px: 0.32, py: 0.58,
    desc: 'A Cidade do Dragão. As Portas do Abismo dormem sob ela.',
    dest: { to: 'silena', tx: 41, ty: 15 },
    unlocked: () => true,
  },
  {
    id: 'sebaste', name: 'Forte Sebaste', px: 0.44, py: 0.32,
    desc: 'Quartel do Oriente, onde serviu São Sebastião. O primeiro edito chegou antes de ti.',
    dest: { to: 'sebaste', tx: 2, ty: 12 },
    // a estrada reabre quando o Dragão cai (começa a peregrinação do Ato II)
    unlocked: (f) => !!f.dragaoDerrotado || !!f.roads?.sebaste,
  },
  {
    id: 'porto_luzia', name: 'Porto de Luzia', px: 0.72, py: 0.62,
    desc: 'Porto do trigo e das lamparinas. Nenhum navio atraca desde os editos.',
    dest: null, // C2
    unlocked: (f) => !!f.roads?.porto_luzia,
  },
  {
    id: 'ermo_antao', name: 'Ermo de Antão', px: 0.88, py: 0.38,
    desc: 'O deserto dos eremitas. Só loucos e santos cruzam essas areias.',
    dest: null, // C3
    unlocked: (f) => !!f.roads?.ermo_antao,
  },
  {
    id: 'tesouro', name: 'Distrito do Tesouro', px: 0.56, py: 0.50,
    desc: 'Os cofres do Império, guardados a sete chaves — e a sete pecados.',
    dest: null, // C4
    unlocked: (f) => !!f.roads?.tesouro,
  },
  {
    id: 'jardim_ines', name: 'Vila do Jardim de Inês', px: 0.48, py: 0.80,
    desc: 'Vinhas e roseirais. Dizem que as rosas florescem fora de estação.',
    dest: null, // C5
    unlocked: (f) => !!f.roads?.jardim_ines,
  },
  {
    id: 'nursia', name: 'Mosteiro de Núrsia', px: 0.70, py: 0.16,
    desc: 'O mosteiro na montanha, e a forja fria que espera os sete fragmentos.',
    dest: null, // C6
    unlocked: (f) => !!f.roads?.nursia,
  },
];

// estradas desenhadas entre os nós (pares de ids), na ordem da história
const EDGES = [
  ['capadocia', 'silena'],
  ['silena', 'sebaste'],
  ['sebaste', 'porto_luzia'],
  ['porto_luzia', 'ermo_antao'],
  ['silena', 'tesouro'],
  ['tesouro', 'jardim_ines'],
  ['tesouro', 'nursia'],
];

// nó correspondente a um mapa (para marcar "estás aqui")
export function nodeForMap(mapId) {
  return NODES.find((n) => n.dest?.to === mapId)?.id || 'silena';
}

export class RoadsScreen {
  constructor(currentId, flags) {
    this.currentId = currentId;
    this.sel = Math.max(0, NODES.findIndex((n) => n.id === currentId));
    this.msg = null;
    void flags;
  }

  get selected() { return NODES[this.sel]; }

  move(dir) {
    this.sel = (this.sel + dir + NODES.length) % NODES.length;
    this.msg = null;
  }

  // E: viajar. Retorna o destino {to, tx, ty} ou null (fica na tela / fecha)
  confirm(flags) {
    const n = this.selected;
    if (!n.unlocked(flags)) {
      this.msg = 'A estrada está fechada. A história ainda não a abriu.';
      sfx('hurt');
      return null;
    }
    if (n.id === this.currentId) {
      this.msg = 'Já estás aqui, cavaleiro.';
      return null;
    }
    if (!n.dest) {
      this.msg = 'Este caminho ainda será trilhado...';
      return null;
    }
    sfx('cast');
    return n.dest;
  }
}

// ---------- render ----------

export function renderRoads(ctx, screen, flags, elapsed) {
  const w = 780, h = 460;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;

  ctx.save();
  // pergaminho
  ctx.fillStyle = 'rgba(14, 9, 5, 0.96)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(58, 44, 24, 0.35)';
  ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
  ctx.strokeStyle = '#8a7442';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = '#4a3820';
  ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8c860';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('ESTRADAS DO IMPÉRIO', x + w / 2, y + 42);

  // área do mapa (as frações px/py dos nós são relativas a este retângulo)
  const mx = x + 40, my = y + 62, mw = w - 80, mh = h - 150;
  const nx = (n) => mx + n.px * mw;
  const ny = (n) => my + n.py * mh;

  // estradas pontilhadas entre os nós
  ctx.strokeStyle = '#6a5636';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  for (const [a, b] of EDGES) {
    const na = NODES.find((n) => n.id === a);
    const nb = NODES.find((n) => n.id === b);
    ctx.beginPath();
    ctx.moveTo(nx(na), ny(na));
    ctx.lineTo(nx(nb), ny(nb));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // nós
  for (const n of NODES) {
    const open = n.unlocked(flags);
    const cx = nx(n), cy = ny(n);
    const isSel = n === screen.selected;
    const isHere = n.id === screen.currentId;

    // anel de seleção pulsante
    if (isSel) {
      ctx.strokeStyle = '#f8e8a0';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(elapsed * 5);
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = open ? '#f0c040' : '#4a4038';
    ctx.fill();
    ctx.strokeStyle = open ? '#8a7442' : '#3a3028';
    ctx.lineWidth = 2;
    ctx.stroke();

    // "estás aqui": uma cruz sobre o nó
    if (isHere) {
      ctx.fillStyle = '#fff4c8';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.fillText('✝', cx, cy - 12);
    }

    // nome do nó
    ctx.font = isSel ? 'bold 13px Georgia, serif' : '12px Georgia, serif';
    ctx.fillStyle = open ? (isSel ? '#f8e8b0' : '#c8b890') : '#6a5c48';
    ctx.fillText(n.name, cx, cy + 24);
  }

  // descrição do nó selecionado (ou aviso)
  const n = screen.selected;
  const open = n.unlocked(flags);
  ctx.fillStyle = screen.msg ? '#c88060' : open ? '#e8dcb8' : '#9a8a62';
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillText(screen.msg || `${n.name} — ${n.desc}${open ? '' : ' (fechada)'}`, x + w / 2, y + h - 46);

  // rodapé
  ctx.fillStyle = '#9a8a62';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('←/→ ou ↑/↓ escolher destino · E — viajar · I/Esc voltar à estrada', x + w / 2, y + h - 22);
  ctx.restore();
}
