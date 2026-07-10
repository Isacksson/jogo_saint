// Economia: mercadores da v0.2 e a loja simples de comprar/vender (GDD §4.3).
//
// A moeda resolve poder bruto (poções, reforços de arma, revenda de loot); a fé
// resolve a história — por isso fragmentos de Ascalon e milagres NUNCA entram
// aqui. Prisca vende consumíveis e compra o loot dos demônios; Rufo (B2b) reforça
// a lança. Este módulo guarda o estado da loja e a desenha; quem a abre é o NPC.

import { VIEW_W, VIEW_H } from './constants.js';
import { RARITY, describeItem, buildItemSprites } from './items.js';
import { sfx } from './audio.js';

// preço de revenda de um equipamento de loot: escala com valor e raridade
export function sellPrice(item) {
  const perSlot = { arma: 3, escudo: 3, armadura: 1, medalha: 1 }[item.slot] || 2;
  return Math.max(3, Math.round(item.value * perSlot * (1 + item.rarity * 0.5)));
}

// custo do próximo reforço da lança: sobe a cada reforço (40, 75, 110, 145, 180)
export function reinforceCost(spear) {
  return 40 + spear.reinforce * 35;
}

// catálogo dos mercadores. `stock` são itens à venda; `buysLoot` habilita a aba
// de venda do inventário do jogador.
export const VENDORS = {
  prisca: {
    name: 'Prisca, a mercadora',
    sprite: 'mira',
    greeting: 'Denários falam mais alto que orações por aqui. O que vais levar?',
    farewell: 'Que a estrada te seja generosa, cavaleiro.',
    broke: 'Volta quando teus denários pesarem mais.',
    buysLoot: true,
    stock: [
      { id: 'potion', name: 'Poção de cura', desc: 'restaura quase metade da vida', price: 30 },
    ],
  },
  rufo: {
    name: 'Rufo, o ferreiro',
    sprite: 'teodoro',
    greeting: 'Traz denários e essa lança sai da minha forja mais mortal, cavaleiro.',
    farewell: 'Que a ponta se mantenha afiada.',
    broke: 'Ferro custa, rapaz. Volta com mais denários.',
    buysLoot: false,
    reforge: true, // acrescenta o serviço de reforço da lança à aba de compra
    stock: [
      { id: 'potion', name: 'Poção de cura', desc: 'restaura quase metade da vida', price: 35 },
    ],
  },
};

// aplica a compra de um item de estoque ao jogador; false se não pôde
function applyPurchase(entry, player) {
  if (entry.id === 'potion') { player.potions++; return true; }
  if (entry.id === 'reinforce') return player.spear.reinforceOnce();
  return false;
}

// monta o serviço de reforço da lança conforme o estado atual dela
function reinforceEntry(spear) {
  if (spear.forged) {
    return { id: 'reinforce', name: 'Lança já forjada', disabled: true,
      desc: 'Ascalon não aceita reforços de ferreiro', price: 0 };
  }
  if (!spear.canReinforce) {
    return { id: 'reinforce', name: `Lança no limite (+${spear.reinforce})`, disabled: true,
      desc: 'a têmpera não aguenta mais reforços', price: 0 };
  }
  return { id: 'reinforce',
    name: `Reforçar a lança (+${spear.reinforce} → +${spear.reinforce + 1})`,
    desc: 'cabo e ponta reforçados: +3 de dano', price: reinforceCost(spear) };
}

export class Shop {
  constructor(vendor) {
    this.vendor = vendor;
    this.tab = 0;        // 0 = comprar, 1 = vender
    this.sel = 0;
    this.msg = vendor.greeting;
    this.msgColor = '#e8dcb8';
  }

  get tabs() {
    return this.vendor.buysLoot ? ['COMPRAR', 'VENDER'] : ['COMPRAR'];
  }

  // itens da aba de compra: estoque fixo + (se ferreiro) o serviço de reforço
  buyEntries(player) {
    const out = this.vendor.stock ? this.vendor.stock.slice() : [];
    if (this.vendor.reforge) out.push(reinforceEntry(player.spear));
    return out;
  }

  list(player) {
    return this.tab === 0 ? this.buyEntries(player) : player.inventory;
  }

  setTab(t, player) {
    const max = this.tabs.length;
    this.tab = (t + max) % max;
    this.sel = 0;
    void player;
  }

  move(dir, player) {
    const n = this.list(player).length;
    if (n === 0) return;
    this.sel = (this.sel + dir + n) % n;
  }

  say(text, color = '#e8dcb8') { this.msg = text; this.msgColor = color; }

  // E/Enter: comprar ou vender o item selecionado
  confirm(player, world) {
    const list = this.list(player);
    const item = list[this.sel];
    if (!item) return;

    if (this.tab === 0) {
      if (item.disabled) { this.say(item.desc, '#c8b090'); return; }
      if (player.gold < item.price) { this.say(this.vendor.broke, '#c88060'); sfx('hurt'); return; }
      if (!applyPurchase(item, player)) return;
      player.gold -= item.price;
      sfx('pickup');
      const label = item.id === 'reinforce' ? `Lança reforçada! (+${player.spear.reinforce})` : `Comprado: ${item.name}.`;
      this.say(`${label} (−${item.price} denários)`, '#f0d060');
      world.fx.text(player.x, player.y - 54, item.id === 'reinforce' ? '✦ Lança reforçada' : `−${item.price} denários`, '#f0d060');
      if (item.id === 'reinforce') world.fx.burst(player.x, player.y - 20, '#dfe4ec', 16, 170);
    } else {
      const price = sellPrice(item);
      player.gold += price;
      player.inventory.splice(this.sel, 1);
      this.sel = Math.min(this.sel, Math.max(0, player.inventory.length - 1));
      sfx('pickup');
      this.say(`Vendido: ${item.name}. (+${price} denários)`, '#f0d060');
      world.fx.text(player.x, player.y - 54, `+${price} denários`, '#f0d060');
    }
  }
}

// ---------- render ----------

export function renderShop(ctx, shop, player) {
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

  // cabeçalho: mercador + denários
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8c860';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(shop.vendor.name.toUpperCase(), x + w / 2, y + 40);
  ctx.fillStyle = '#f0d060';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`${player.gold} denários`, x + w / 2, y + 62);

  // abas
  ctx.font = 'bold 14px Georgia, serif';
  const tabs = shop.tabs;
  const tw = 120;
  const tx0 = x + w / 2 - (tabs.length * tw) / 2;
  tabs.forEach((label, i) => {
    const tx = tx0 + i * tw;
    const active = i === shop.tab;
    ctx.fillStyle = active ? 'rgba(232, 200, 96, 0.18)' : 'rgba(60, 44, 24, 0.25)';
    ctx.fillRect(tx, y + 78, tw - 8, 26);
    ctx.strokeStyle = active ? '#e8c860' : '#4a3820';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, y + 78.5, tw - 8, 26);
    ctx.fillStyle = active ? '#e8c860' : '#9a8a62';
    ctx.fillText(label, tx + (tw - 8) / 2, y + 96);
  });

  // lista de itens
  const list = shop.list(player);
  ctx.textAlign = 'left';
  const listY = y + 122;
  if (list.length === 0) {
    ctx.fillStyle = '#7a6a4c';
    ctx.font = 'italic 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(shop.tab === 0 ? 'Nada à venda hoje.' : 'Tua bolsa está vazia.', x + w / 2, listY + 40);
  } else {
    list.forEach((it, i) => {
      const sy = listY + i * 34;
      if (i === shop.sel) {
        ctx.fillStyle = 'rgba(232, 200, 96, 0.16)';
        ctx.fillRect(x + 26, sy - 4, w - 52, 32);
        ctx.strokeStyle = '#e8c860';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 26.5, sy - 3.5, w - 52, 32);
      }
      // ícone
      const iconKey = shop.tab === 0
        ? (it.id === 'potion' ? 'potion' : it.id === 'reinforce' ? 'arma' : 'gold')
        : it.slot;
      const icon = icons[iconKey] || icons.gold;
      ctx.globalAlpha = it.disabled ? 0.4 : 1;
      ctx.drawImage(icon, x + 34, sy, 24, Math.round(icon.height / icon.width * 24));
      ctx.globalAlpha = 1;

      // nome + descrição
      if (shop.tab === 0) {
        ctx.fillStyle = it.disabled ? '#7a6a4c' : '#e8dcb8';
        ctx.font = 'bold 14px Georgia, serif';
        ctx.fillText(it.name, x + 70, sy + 12);
        ctx.fillStyle = it.disabled ? '#6a5c40' : '#a89a72';
        ctx.font = '12px Georgia, serif';
        ctx.fillText(it.desc, x + 70, sy + 26);
        // preço (entradas desabilitadas não mostram preço)
        if (!it.disabled) {
          const afford = player.gold >= it.price;
          ctx.fillStyle = afford ? '#f0d060' : '#a05040';
          ctx.font = 'bold 14px Georgia, serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${it.price} d`, x + w - 34, sy + 20);
          ctx.textAlign = 'left';
        }
      } else {
        ctx.fillStyle = RARITY[it.rarity].color;
        ctx.font = 'bold 14px Georgia, serif';
        ctx.fillText(it.name, x + 70, sy + 12);
        ctx.fillStyle = '#a89a72';
        ctx.font = '12px Georgia, serif';
        ctx.fillText(`${describeItem(it)} · ${RARITY[it.rarity].name}`, x + 70, sy + 26);
        ctx.fillStyle = '#f0d060';
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'right';
        ctx.fillText(`+${sellPrice(it)} d`, x + w - 34, sy + 20);
        ctx.textAlign = 'left';
      }
    });
  }

  // fala do mercador
  ctx.textAlign = 'center';
  ctx.fillStyle = shop.msgColor;
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillText(shop.msg, x + w / 2, y + h - 44);

  // rodapé
  ctx.fillStyle = '#9a8a62';
  ctx.font = '12px Georgia, serif';
  const act = shop.tab === 0 ? 'comprar' : 'vender';
  ctx.fillText(`←/→ aba · ↑/↓ escolher · E — ${act} · I/Esc sair`, x + w / 2, y + h - 20);
  ctx.restore();
}
