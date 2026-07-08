// Milagres: os dons dos santos, pagos com Fé

import { images } from './assets.js';
import { SCALE } from './constants.js';
import { buildCordeiro } from './sprites.js';

// ---------- Raio do Trovão (Santa Bárbara) ----------

class Bolt {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.t = 0;
    this.dur = 0.4;
    this.struck = false;
    this.dead = false;
    // traçado dentado fixo do relâmpago
    this.jags = [];
    let jx = 0;
    for (let i = 0; i <= 8; i++) {
      this.jags.push(jx);
      jx += (Math.random() - 0.5) * 34;
    }
  }

  update(dt, world) {
    this.t += dt;
    if (!this.struck && this.t >= 0.08) {
      this.struck = true;
      world.fx.addShake(5);
      world.fx.burst(this.x, this.y - 6, '#f8e880', 14, 200);
      for (const e of world.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - this.x, e.y - this.y) < 55) {
          e.takeDamage(35, (e.x - this.x) * 3, (e.y - this.y) * 3, world);
        }
      }
    }
    if (this.t >= this.dur) this.dead = true;
  }

  render(ctx, cam) {
    const p = this.t / this.dur;
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const top = y - 300;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p * p);
    ctx.lineCap = 'round';
    for (const [w, color] of [[9, 'rgba(248, 232, 128, 0.5)'], [4, '#f8e880'], [1.5, '#ffffff']]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const py = top + (y - top) * (i / 8);
        const px = x + this.jags[i] * (i / 8);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // clarão no ponto de impacto
    ctx.fillStyle = `rgba(248, 232, 160, ${0.5 * (1 - p)})`;
    ctx.beginPath();
    ctx.arc(x + this.jags[8], y, 34 * (1 - p * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function castRaio(world, player) {
  // fere até 3 demônios próximos; sem alvos, cai à frente do cavaleiro
  const targets = world.enemies
    .filter((e) => e.alive && Math.hypot(e.x - player.x, e.y - player.y) < 320)
    .sort((a, b) =>
      Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))
    .slice(0, 3);
  if (targets.length === 0) {
    const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[player.facing];
    world.spells.push(new Bolt(player.x + v[0] * 140, player.y + v[1] * 140));
  } else {
    for (const e of targets) world.spells.push(new Bolt(e.x, e.y - 8));
  }
}

// ---------- Chuva de Setas (São Sebastião) ----------

class ArrowRain {
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;
    this.t = 0;
    this.dur = 1.1;
    this.next = 0;
    this.arrows = []; // {x, y, t}
    this.dead = false;
  }

  update(dt, world) {
    this.t += dt;
    // novas setas caem em sequência
    while (this.t >= this.next && this.next < 0.8) {
      this.next += 0.09;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 85;
      this.arrows.push({ x: this.cx + Math.cos(a) * r, y: this.cy + Math.sin(a) * r, t: 0, hit: false });
    }
    for (const ar of this.arrows) {
      ar.t += dt;
      if (!ar.hit && ar.t >= 0.22) {
        ar.hit = true;
        world.fx.burst(ar.x, ar.y, '#c8b890', 3, 70);
        for (const e of world.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - ar.x, e.y - ar.y) < 26) {
            e.takeDamage(12, (e.x - ar.x) * 2, (e.y - ar.y) * 2, world);
          }
        }
      }
    }
    if (this.t >= this.dur) this.dead = true;
  }

  render(ctx, cam) {
    ctx.save();
    // círculo-alvo no chão
    const p = Math.min(1, this.t / 0.8);
    ctx.globalAlpha = 0.3 * (1 - p * 0.5);
    ctx.strokeStyle = '#e8d8a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.cx - cam.x, this.cy - cam.y, 88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // setas caindo em diagonal (arte do pack)
    const img = images.arrow;
    for (const ar of this.arrows) {
      if (ar.t > 0.4) continue;
      const fall = Math.min(1, ar.t / 0.22);
      const x = ar.x - cam.x + (1 - fall) * 60;
      const y = ar.y - cam.y - (1 - fall) * 220;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI * 0.75); // apontando para baixo-esquerda, como a queda
      const s = fall >= 1 ? 2 : 3;
      ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s);
      ctx.restore();
    }
    ctx.restore();
  }
}

function castSetas(world, player) {
  const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[player.facing];
  world.spells.push(new ArrowRain(player.x + v[0] * 130, player.y + v[1] * 130));
}

// ---------- Luz que Cega (Santa Luzia) ----------

function castLuz(world, player) {
  world.fx.whiteFlash = 0.45;
  world.fx.addShake(3);
  world.fx.burst(player.x, player.y - 20, '#f8f4d8', 30, 300);
  let touched = 0;
  for (const e of world.enemies) {
    if (!e.alive) continue;
    if (Math.hypot(e.x - player.x, e.y - player.y) < 340) {
      e.stunT = e.isBoss ? 1.4 : 3.2;
      touched++;
    }
  }
  if (touched > 0) {
    world.fx.text(player.x, player.y - 78, 'Os malignos estão cegos!', '#f8f0c0');
  }
}

// ---------- Jejum que Fortalece (Santo Antão) ----------

function castJejum(world, player) {
  player.shieldT = 9;
  world.fx.burst(player.x, player.y - 20, '#b8d8f0', 18, 180);
  world.fx.text(player.x, player.y - 78, 'A carne renuncia; o espírito resiste.', '#b8d8f0');
}

// ---------- Fogo que Purifica (São Lourenço) ----------

class FireNova {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.t = 0;
    this.dur = 0.6;
    this.hit = false;
    this.dead = false;
  }

  update(dt, world) {
    this.t += dt;
    if (!this.hit && this.t >= 0.12) {
      this.hit = true;
      world.fx.addShake(5);
      for (const e of world.enemies) {
        if (!e.alive) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 190) {
          e.takeDamage(28, (dx / d) * 260, (dy / d) * 260, world);
        }
      }
    }
    // brasas voando no anel
    const r = (this.t / this.dur) * 200;
    if (Math.random() < dt * 60) {
      const a = Math.random() * Math.PI * 2;
      world.fx.spark(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r * 0.7, '#f08030');
    }
    if (this.t >= this.dur) this.dead = true;
  }

  render(ctx, cam) {
    const p = this.t / this.dur;
    const r = p * 200;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#e05818';
    ctx.beginPath();
    ctx.ellipse(this.x - cam.x, this.y - cam.y, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f8c048';
    ctx.beginPath();
    ctx.ellipse(this.x - cam.x, this.y - cam.y, r * 0.85, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function castFogo(world, player) {
  world.spells.push(new FireNova(player.x, player.cy));
  world.fx.burst(player.x, player.cy, '#f08030', 16, 220);
  world.fx.text(player.x, player.y - 78, 'Que o fogo purifique!', '#f8a848');
}

// ---------- Cordeiro Guardião (Santa Inês) ----------

class Cordeiro {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 14;
    this.hitCd = 0;
    this.anim = 0;
    this.faceLeft = false;
    this.dead = false;
  }

  update(dt, world) {
    this.life -= dt;
    this.hitCd = Math.max(0, this.hitCd - dt);
    this.anim += dt;
    if (this.life <= 0) {
      this.dead = true;
      world.fx.burst(this.x, this.y - 10, '#f8f4e8', 14, 150);
      return;
    }
    // persegue o maligno mais próximo (é espírito: atravessa tudo)
    let best = null;
    let bd = 1e9;
    for (const e of world.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (best && bd < 600) {
      const dx = best.x - this.x;
      const dy = best.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 20) {
        this.x += (dx / d) * 175 * dt;
        this.y += (dy / d) * 175 * dt;
        this.faceLeft = dx < 0;
      }
      if (d < 34 && this.hitCd <= 0) {
        this.hitCd = 0.55;
        best.takeDamage(11, (dx / d) * 160, (dy / d) * 160, world);
      }
    } else {
      // volta a trotar junto do cavaleiro
      const p = world.player;
      const d = Math.hypot(p.x - this.x, p.y - this.y) || 1;
      if (d > 60) {
        this.x += ((p.x - this.x) / d) * 150 * dt;
        this.y += ((p.y - this.y) / d) * 150 * dt;
        this.faceLeft = p.x < this.x;
      }
    }
  }

  render(ctx, cam) {
    const frames = buildCordeiro();
    const frame = frames[Math.floor(this.anim * 6) % 2];
    const px = 16 * SCALE;
    const x = this.x - cam.x;
    const y = this.y - cam.y + Math.sin(this.anim * 7) * 2;
    ctx.save();
    if (this.life < 2) ctx.globalAlpha = Math.max(0.2, this.life / 2);
    // auréola
    ctx.strokeStyle = 'rgba(248, 216, 96, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - px + 6, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (this.faceLeft) {
      ctx.translate(x + px / 2, y - px);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, 0, 0, px, px);
    } else {
      ctx.drawImage(frame, Math.round(x - px / 2), Math.round(y - px), px, px);
    }
    ctx.restore();
  }
}

function castCordeiro(world, player) {
  world.spells.push(new Cordeiro(player.x - 30, player.y));
  world.fx.burst(player.x - 30, player.y - 14, '#f8f4e8', 16, 160);
  world.fx.text(player.x, player.y - 78, 'O Cordeiro vela por ti.', '#f8f0dc');
}

// ---------- registro ----------

export const MIRACLES = {
  raio: { key: '1', name: 'Raio do Trovão', saint: 'Santa Bárbara', cost: 30, cast: castRaio },
  setas: { key: '2', name: 'Chuva de Setas', saint: 'São Sebastião', cost: 25, cast: castSetas },
  luz: { key: '3', name: 'Luz que Cega', saint: 'Santa Luzia', cost: 35, cast: castLuz },
  jejum: { key: '4', name: 'Jejum que Fortalece', saint: 'Santo Antão', cost: 30, cast: castJejum },
  fogo: { key: '5', name: 'Fogo que Purifica', saint: 'São Lourenço', cost: 40, cast: castFogo },
  cordeiro: { key: '6', name: 'Cordeiro Guardião', saint: 'Santa Inês', cost: 45, cast: castCordeiro },
};
