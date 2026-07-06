// HUD: barras de Vida, Fé e Fúria Sagrada, contador de demônios,
// banner do título e telas de morte/vitória

import { VIEW_W, VIEW_H } from './constants.js';

function bar(ctx, x, y, w, h, ratio, fill, label, glow = false) {
  ctx.fillStyle = 'rgba(20, 14, 8, 0.75)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.strokeStyle = glow ? '#f0d060' : '#8a7442';
  ctx.lineWidth = glow ? 2 : 1;
  ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.fillStyle = '#241a10';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * w, h);
  ctx.fillStyle = '#e8dcb8';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 4, y + h / 2 + 0.5);
}

export function renderHud(ctx, player, world, elapsed) {
  bar(ctx, 16, 14, 180, 14, player.hp / player.hpMax, '#a8281e', 'VIDA');
  bar(ctx, 16, 34, 140, 12, player.faith / player.faithMax, '#2c5e9e', 'FÉ');

  const furyFull = player.fury >= player.furyMax && player.furyTime <= 0;
  const pulse = furyFull && Math.sin(elapsed * 8) > 0;
  let furyLabel = 'FÚRIA SAGRADA';
  if (player.furyTime > 0) furyLabel = 'FÚRIA ATIVA!';
  else if (furyFull) furyLabel = 'FÚRIA PRONTA — L/C';
  bar(
    ctx, 16, 52, 140, 12,
    player.fury / player.furyMax,
    player.furyTime > 0 || pulse ? '#f8d040' : '#d8a020',
    furyLabel,
    furyFull || player.furyTime > 0
  );

  // XP e nível
  bar(ctx, 16, 70, 140, 7, player.xp / player.xpNext, '#b8a058', '');
  ctx.fillStyle = '#e0cda0';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Nv. ${player.level}`, 162, 74);

  // contador de demônios / bolso
  ctx.textAlign = 'right';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillStyle = 'rgba(20, 14, 8, 0.6)';
  ctx.fillRect(VIEW_W - 190, 8, 182, 44);
  ctx.fillStyle = '#e0cda0';
  ctx.fillText(
    world.total > 0 ? `Demônios abatidos: ${world.kills} / ${world.total}` : 'Silena está em paz... por ora',
    VIEW_W - 16, 20
  );
  ctx.fillStyle = '#f0d060';
  ctx.font = '12px Georgia, serif';
  const chave = world.flags.temChave && !world.flags.catacumbasAbertas ? ' · ✝chave' : '';
  ctx.fillText(`${player.gold} denários · ${player.potions} poções (Q)${chave}`, VIEW_W - 16, 40);
}

// nome do local, exibido ao entrar num mapa
export function renderLocation(ctx, name, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
  ctx.lineWidth = 4;
  ctx.fillStyle = '#e8c860';
  ctx.strokeText(name, VIEW_W / 2, 96);
  ctx.fillText(name, VIEW_W / 2, 96);
  ctx.restore();
}

// caixa de diálogo estilo Lufia
export function renderDialogue(ctx, dlg) {
  const w = 760, h = 108;
  const x = (VIEW_W - w) / 2;
  const y = VIEW_H - h - 24;

  ctx.save();
  ctx.fillStyle = 'rgba(14, 9, 5, 0.93)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#8a7442';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8c860';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(dlg.name, x + 18, y + 26);

  // quebra de linha simples
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '14px Georgia, serif';
  const words = dlg.lines[dlg.idx].split(' ');
  let line = '';
  let ly = y + 50;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > w - 40) {
      ctx.fillText(line, x + 18, ly);
      line = word;
      ly += 20;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x + 18, ly);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9a8a62';
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillText(dlg.idx < dlg.lines.length - 1 ? 'E — continuar ▸' : 'E — fechar ✕', x + w - 14, y + h - 12);
  ctx.restore();
}

// banner de abertura, com fade controlado por quem chama
export function renderTitle(ctx, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(12, 8, 4, 0.55)';
  ctx.fillRect(0, 84, VIEW_W, 96);
  ctx.fillStyle = '#e8c860';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.fillText('A LENDA ÁUREA', VIEW_W / 2, 128);
  ctx.fillStyle = '#d8ccaa';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText('Jorge e o Dragão — Capadócia, século III', VIEW_W / 2, 158);
  ctx.restore();
}

export function renderDeath(ctx, t) {
  ctx.save();
  ctx.globalAlpha = Math.min(0.65, t * 0.8);
  ctx.fillStyle = '#1a0604';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.globalAlpha = Math.min(1, t);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c03028';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText('Jorge caiu...', VIEW_W / 2, VIEW_H / 2 - 20);
  ctx.fillStyle = '#d8ccaa';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText('mas a fé o reergue. Pressione ENTER.', VIEW_W / 2, VIEW_H / 2 + 20);
  ctx.restore();
}

export function renderVictory(ctx, elapsed) {
  ctx.save();
  ctx.textAlign = 'center';
  const glow = 0.75 + 0.25 * Math.sin(elapsed * 3);
  ctx.fillStyle = 'rgba(12, 8, 4, 0.55)';
  ctx.fillRect(0, VIEW_H - 76, VIEW_W, 56);
  ctx.globalAlpha = glow;
  ctx.fillStyle = '#e8c860';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('✝ Este lugar foi purificado! ✝', VIEW_W / 2, VIEW_H - 52);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#d8ccaa';
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillText('O mal recua... por enquanto.', VIEW_W / 2, VIEW_H - 32);
  ctx.restore();
}
