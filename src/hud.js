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

// milagres desbloqueados (canto inferior esquerdo)
export function renderMiracles(ctx, player, world, miracles) {
  const unlocked = Object.entries(miracles).filter(([id]) => world.flags.milagres?.[id]);
  if (unlocked.length === 0) return;
  let x = 16;
  const y = VIEW_H - 64;
  ctx.save();
  for (const [id, m] of unlocked) {
    const can = player.faith >= m.cost;
    ctx.fillStyle = 'rgba(14, 9, 5, 0.8)';
    ctx.fillRect(x, y, 48, 48);
    ctx.strokeStyle = can ? '#8a7442' : '#4a3f2c';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, 46, 46);
    ctx.globalAlpha = can ? 1 : 0.35;
    // ícone desenhado à mão
    ctx.lineCap = 'round';
    if (id === 'raio') {
      ctx.strokeStyle = '#f8e880';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 28, y + 8);
      ctx.lineTo(x + 18, y + 24);
      ctx.lineTo(x + 26, y + 24);
      ctx.lineTo(x + 18, y + 40);
      ctx.stroke();
    } else if (id === 'setas') {
      ctx.strokeStyle = '#d8c8a0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 14 + i * 9, y + 10);
        ctx.lineTo(x + 10 + i * 9, y + 34);
        ctx.stroke();
      }
    } else if (id === 'jejum') {
      // escudo
      ctx.strokeStyle = '#b8d8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 9);
      ctx.lineTo(x + 34, y + 14);
      ctx.lineTo(x + 34, y + 24);
      ctx.quadraticCurveTo(x + 34, y + 34, x + 24, y + 39);
      ctx.quadraticCurveTo(x + 14, y + 34, x + 14, y + 24);
      ctx.lineTo(x + 14, y + 14);
      ctx.closePath();
      ctx.stroke();
    } else if (id === 'fogo') {
      // chama
      ctx.strokeStyle = '#f8a848';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 8);
      ctx.quadraticCurveTo(x + 34, y + 20, x + 30, y + 30);
      ctx.quadraticCurveTo(x + 27, y + 38, x + 24, y + 38);
      ctx.quadraticCurveTo(x + 15, y + 36, x + 17, y + 26);
      ctx.quadraticCurveTo(x + 19, y + 18, x + 24, y + 8);
      ctx.stroke();
      ctx.fillStyle = '#e05818';
      ctx.beginPath();
      ctx.arc(x + 24, y + 31, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'cordeiro') {
      // cordeiro com auréola
      ctx.strokeStyle = '#f8f0dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + 22, y + 28, 9, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 32, y + 24, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#f8d860';
      ctx.beginPath();
      ctx.ellipse(x + 32, y + 16, 5, 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (id === 'vade') {
      // cruz radiante de São Bento
      ctx.strokeStyle = '#f0e8d0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 8);
      ctx.lineTo(x + 24, y + 38);
      ctx.moveTo(x + 15, y + 17);
      ctx.lineTo(x + 33, y + 17);
      ctx.stroke();
    } else if (id === 'luz') {
      // sol radiante
      ctx.strokeStyle = '#f8f0c0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 24, y + 24, 7, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + 24 + Math.cos(a) * 11, y + 24 + Math.sin(a) * 11);
        ctx.lineTo(x + 24 + Math.cos(a) * 17, y + 24 + Math.sin(a) * 17);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e8dcb8';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(m.key, x + 4, y + 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = can ? '#6a9ee0' : '#4a5a74';
    ctx.fillText(m.cost, x + 44, y + 43);
    x += 56;
  }
  ctx.restore();
}

// barra de vida do chefe (topo da tela)
export function renderBossBar(ctx, boss) {
  const w = 420;
  const x = (VIEW_W - w) / 2;
  const y = 30;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
  ctx.lineWidth = 3;
  ctx.fillStyle = '#e88060';
  ctx.strokeText(boss.bossName, VIEW_W / 2, y - 6);
  ctx.fillText(boss.bossName, VIEW_W / 2, y - 6);
  ctx.fillStyle = 'rgba(14, 9, 5, 0.85)';
  ctx.fillRect(x - 2, y - 2, w + 4, 16);
  ctx.strokeStyle = '#8a4432';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1.5, y - 1.5, w + 3, 15);
  ctx.fillStyle = '#8a1810';
  ctx.fillRect(x, y, w, 12);
  ctx.fillStyle = '#d83020';
  ctx.fillRect(x, y, Math.max(0, boss.hp / boss.hpMax) * w, 12);
  ctx.restore();
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
  const w = 784, h = 134;
  const x = (VIEW_W - w) / 2;
  const y = VIEW_H - h - 18;

  ctx.save();
  // painel com moldura dupla estilo iluminura
  ctx.fillStyle = 'rgba(14, 9, 5, 0.95)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#8a7442';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.strokeStyle = '#4a3820';
  ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);

  // retrato do interlocutor, emoldurado à esquerda
  const ps = 92;
  const px = x + 16;
  const py = y + (h - ps) / 2;
  ctx.fillStyle = dlg.ghost ? 'rgba(120, 150, 200, 0.28)' : 'rgba(60, 44, 24, 0.5)';
  ctx.fillRect(px, py, ps, ps);
  if (dlg.portrait) {
    ctx.imageSmoothingEnabled = false;
    // recorta o alto do sprite (cabeça/tronco) para um enquadramento de retrato
    ctx.save();
    if (dlg.ghost) ctx.globalAlpha = 0.85;
    ctx.drawImage(dlg.portrait, 0, 0, 16, 13, px + 8, py + 8, ps - 16, (ps - 16) * 13 / 16);
    ctx.restore();
  }
  ctx.strokeStyle = '#8a7442';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, ps, ps);

  const tx = px + ps + 20;
  const tw = x + w - tx - 20;

  // nome + régua divisória
  ctx.textAlign = 'left';
  ctx.fillStyle = dlg.ghost ? '#bcd0f0' : '#e8c860';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(dlg.name, tx, y + 30);
  ctx.strokeStyle = 'rgba(138, 116, 66, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx, y + 39);
  ctx.lineTo(x + w - 20, y + 39);
  ctx.stroke();

  // fala com efeito máquina de escrever (reveal) e quebra de linha
  const full = dlg.lines[dlg.idx];
  const shown = full.slice(0, Math.floor(dlg.reveal ?? full.length));
  const revealed = (dlg.reveal ?? full.length) >= full.length;
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '14px Georgia, serif';
  const words = shown.split(' ');
  let line = '';
  let ly = y + 62;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > tw) {
      ctx.fillText(line, tx, ly);
      line = word;
      ly += 21;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, tx, ly);

  // pontos de página
  const n = dlg.lines.length;
  const dotY = y + h - 16;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i === dlg.idx ? '#e8c860' : '#5a4a2c';
    ctx.beginPath();
    ctx.arc(tx + 5 + i * 15, dotY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // prompt contextual
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9a8a62';
  ctx.font = 'italic 12px Georgia, serif';
  const prompt = !revealed
    ? 'E — pular'
    : (dlg.idx < n - 1 ? 'E — continuar ▸' : 'E — fechar ✕');
  ctx.fillText(prompt, x + w - 18, dotY + 4);
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
