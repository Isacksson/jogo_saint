// Anjo da Guarda — o companheiro celeste de Jorge (GDD §3.6).
//
// Uma pequena luz concedida por São Miguel no Prólogo, que voa junto a Jorge e
// ataca sozinha (fraco, mas constante). Diferente dos Capsule Monsters de Lufia,
// é UM só companheiro que cresce: sobe a hierarquia angélica clássica a cada
// bênção recebida. Patentes iniciais só atacam; da Virtude em diante cura Jorge
// aos poucos; o Serafim ganha o socorro — um escudo breve que se recarrega.
//
// Nada aqui é salvo à parte: a posse vem de `flags.anjo` e a patente é derivada
// das bênçãos (`flags.milagres`), então o save existente já cobre tudo.

import { sfx } from './audio.js';

export const RANKS = ['Anjo', 'Arcanjo', 'Principado', 'Virtude', 'Potestade', 'Domínio', 'Serafim'];

const ATTACK_CD = 2.2;   // segundos entre raios de luz
const RANGE = 170;       // alcance do ataque, em px de mundo
const HEAL_RANK = 3;     // Virtude: começa a curar
const GUARD_RANK = 6;    // Serafim: ganha o socorro
const GUARD_CD = 45, GUARD_DUR = 2.5, GUARD_HP = 0.25;

// patente atual: uma promoção por bênção (as duas últimas coroam o Serafim)
export function angelRank(flags) {
  const m = flags.milagres || {};
  const blessings = Object.values(m).filter(Boolean).length;
  return Math.min(RANKS.length - 1, blessings);
}

export class Angel {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.t = Math.random() * 10;
    this.lastRank = -1;
    this.atkT = 1.2;
    this.guardT = 0;
    this.zap = null; // raio de luz até o alvo, por um instante
  }

  update(dt, world) {
    if (!world.flags.anjo) return;
    const p = world.player;
    this.t += dt;
    const rank = angelRank(world.flags);

    // primeira aparição: surge junto a Jorge; depois, anuncia cada promoção
    if (this.lastRank === -1) {
      this.lastRank = rank;
      this.x = p.x;
      this.y = p.y - 60;
    } else if (rank > this.lastRank) {
      this.lastRank = rank;
      world.fx.text(p.x, p.y - 78, `✝ O Anjo ascendeu: ${RANKS[rank]}!`, '#b8d8f8');
      world.fx.burst(this.x, this.y, '#d8e8ff', 22, 200);
      sfx('level');
    }

    // voo: órbita suave ao lado de Jorge (teleporta se ficou para trás na troca de mapa)
    const tx = p.x + Math.cos(this.t * 0.9) * 34;
    const ty = p.y - 52 + Math.sin(this.t * 1.7) * 8;
    if (Math.hypot(tx - this.x, ty - this.y) > 500) { this.x = tx; this.y = ty; }
    const k = Math.min(1, dt * 4.5);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;

    if (this.zap) { this.zap.t -= dt; if (this.zap.t <= 0) this.zap = null; }
    if (!p.alive) return;

    // ataque: um raio de luz no inimigo mais próximo
    this.atkT -= dt;
    if (this.atkT <= 0) {
      let best = null, bd = RANGE;
      for (const e of world.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        this.atkT = ATTACK_CD;
        best.takeDamage(4 + rank * 2, (best.x - this.x) * 0.4, (best.y - this.y) * 0.4, world);
        this.zap = { x: best.x, y: best.y - 14, t: 0.16 };
        world.fx.spark(best.x, best.y - 14, '#d8e8ff');
      } else {
        this.atkT = 0.35; // ninguém ao alcance: re-verifica logo
      }
    }

    // Virtude em diante: cura Jorge aos poucos
    if (rank >= HEAL_RANK && p.hp < p.hpMax) {
      p.hp = Math.min(p.hpMax, p.hp + 1.5 * dt);
    }

    // Serafim: socorro — escudo breve quando Jorge está por um fio
    this.guardT = Math.max(0, this.guardT - dt);
    if (rank >= GUARD_RANK && this.guardT <= 0 && p.hp < p.hpMax * GUARD_HP) {
      this.guardT = GUARD_CD;
      p.invuln = Math.max(p.invuln, GUARD_DUR);
      p.shieldT = Math.max(p.shieldT, GUARD_DUR);
      world.fx.text(p.x, p.y - 70, '✝ Socorro do Serafim!', '#d8e8ff');
      world.fx.burst(p.x, p.y - 20, '#d8e8ff', 26, 230);
      sfx('pray');
    }
  }

  // desenhado depois da escuridão: o anjo é uma luz, brilha através dela
  render(ctx, cam, world) {
    if (!world.flags.anjo || this.lastRank === -1) return;
    const rank = this.lastRank;
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const flick = 0.85 + 0.15 * Math.sin(this.t * 9);

    ctx.save();

    // raio de luz do ataque
    if (this.zap) {
      ctx.globalAlpha = Math.min(1, this.zap.t / 0.16) * 0.9;
      ctx.strokeStyle = '#e8f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(this.zap.x - cam.x, this.zap.y - cam.y);
      ctx.stroke();
    }

    // brilho: cresce com a patente
    const glow = (14 + rank * 3) * flick;
    const g = ctx.createRadialGradient(x, y, 2, x, y, glow);
    g.addColorStop(0, 'rgba(232, 240, 255, 0.85)');
    g.addColorStop(0.5, 'rgba(184, 208, 248, 0.35)');
    g.addColorStop(1, 'rgba(184, 208, 248, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(x - glow, y - glow, glow * 2, glow * 2);

    // asas: mais pares conforme sobe a hierarquia (1 a 3 pares)
    const pairs = 1 + Math.floor(rank / 3);
    const beat = Math.sin(this.t * 7) * 0.35;
    ctx.strokeStyle = 'rgba(232, 240, 255, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < pairs; i++) {
      const span = 8 + i * 5;
      const lift = 3 + i * 3;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + s * 3, y - 1);
        ctx.quadraticCurveTo(
          x + s * span, y - lift - beat * span * 0.6,
          x + s * (span + 4), y + 2 - beat * span * 0.4
        );
        ctx.stroke();
      }
    }

    // auréola a partir da Potestade
    if (rank >= 4) {
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = '#f0e0a0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y - 8, 6, 2.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // o corpo de luz
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
