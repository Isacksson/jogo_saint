// Tela de inventário e equipamento (pausa o jogo enquanto aberta)

import { VIEW_W, VIEW_H } from './constants.js';
import { RARITY, describeItem, buildItemSprites } from './items.js';
import { fragmentCount, FRAGMENT_TOTAL } from './fragments.js';
import { instrumentCount, INSTRUMENT_TOTAL } from './instruments.js';

const SLOT_LABEL = { arma: 'Arma', escudo: 'Escudo', armadura: 'Armadura', medalha: 'Medalha' };
const SLOTS = ['arma', 'escudo', 'armadura', 'medalha'];

export function renderInventory(ctx, player, sel, flags = {}) {
  const w = 660, h = 400;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  const icons = buildItemSprites();

  ctx.save();
  // painel
  ctx.fillStyle = 'rgba(14, 9, 5, 0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#8a7442';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = '#4a3820';
  ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);

  // cabeçalho
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8c860';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('INVENTÁRIO', x + w / 2, y + 40);
  ctx.fillStyle = '#c8b890';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(
    `Nível ${player.level} · Dano +${player.attackBonus} · Defesa ${player.defense} · ` +
    `Vida ${Math.ceil(player.hp)}/${player.hpMax} · ${player.gold} denários`,
    x + w / 2, y + 62
  );
  // lança (estágio atual) e progresso dos fragmentos de Ascalon
  ctx.fillStyle = '#bcae86';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(
    `Lança: ${player.spear.name}  ·  Fragmentos de Ascalon ${fragmentCount(flags)}/${FRAGMENT_TOTAL}` +
    `  ·  Instrumentos ${instrumentCount(flags)}/${INSTRUMENT_TOTAL}`,
    x + w / 2, y + 80
  );

  // coluna esquerda: equipado
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8a7442';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('EQUIPADO', x + 30, y + 92);
  SLOTS.forEach((slot, i) => {
    const sy = y + 106 + i * 62;
    ctx.fillStyle = 'rgba(60, 44, 24, 0.35)';
    ctx.fillRect(x + 26, sy, 280, 54);
    ctx.strokeStyle = '#4a3820';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 26.5, sy + 0.5, 280, 54);
    const icon = icons[slot];
    ctx.globalAlpha = player.equip[slot] ? 1 : 0.25;
    ctx.drawImage(icon, x + 34, sy + 8, 38, Math.round(icon.height / icon.width * 38));
    ctx.globalAlpha = 1;
    const it = player.equip[slot];
    ctx.font = 'bold 13px Georgia, serif';
    if (it) {
      ctx.fillStyle = RARITY[it.rarity].color;
      ctx.fillText(`${it.name} · ${RARITY[it.rarity].name}`, x + 82, sy + 22);
      ctx.fillStyle = '#c8b890';
      ctx.font = '12px Georgia, serif';
      ctx.fillText(describeItem(it), x + 82, sy + 40);
    } else {
      ctx.fillStyle = '#7a6a4c';
      ctx.fillText(`${SLOT_LABEL[slot]} — vazio`, x + 82, sy + 30);
    }
  });

  // coluna direita: bolsa
  ctx.fillStyle = '#8a7442';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(`BOLSA (${player.inventory.length}/10)`, x + 340, y + 92);
  if (player.inventory.length === 0) {
    ctx.fillStyle = '#7a6a4c';
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillText('Vazia — os demônios guardam tesouros...', x + 340, y + 120);
  }
  player.inventory.forEach((it, i) => {
    const sy = y + 102 + i * 26;
    if (i === sel) {
      ctx.fillStyle = 'rgba(232, 200, 96, 0.18)';
      ctx.fillRect(x + 334, sy - 2, 296, 24);
      ctx.strokeStyle = '#e8c860';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 334.5, sy - 1.5, 296, 24);
    }
    const icon = icons[it.slot];
    ctx.drawImage(icon, x + 340, sy, 18, Math.round(icon.height / icon.width * 18));
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = RARITY[it.rarity].color;
    ctx.fillText(`${it.name} · ${describeItem(it)}`, x + 366, sy + 14);
  });

  // rodapé
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9a8a62';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('↑/↓ escolher · E/Enter equipar · K descartar · I/Esc fechar', x + w / 2, y + h - 20);
  ctx.restore();
}
