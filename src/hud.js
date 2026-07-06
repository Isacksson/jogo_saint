// HUD: barras de Vida, Fé e Fúria Sagrada + banner do título

import { VIEW_W } from './constants.js';

function bar(ctx, x, y, w, h, ratio, fill, label) {
  ctx.fillStyle = 'rgba(20, 14, 8, 0.75)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.strokeStyle = '#8a7442';
  ctx.lineWidth = 1;
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

export function renderHud(ctx, player) {
  bar(ctx, 16, 14, 180, 14, player.hp / player.hpMax, '#a8281e', 'VIDA');
  bar(ctx, 16, 34, 140, 12, player.faith / player.faithMax, '#2c5e9e', 'FÉ');
  bar(ctx, 16, 52, 140, 12, player.fury / player.furyMax, '#d8a020', 'FÚRIA SAGRADA');
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
