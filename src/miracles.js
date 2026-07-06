// Milagres: os dons dos santos, pagos com Fé

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
    // setas caindo em diagonal
    for (const ar of this.arrows) {
      if (ar.t > 0.35) continue;
      const fall = Math.min(1, ar.t / 0.22);
      const x = ar.x - cam.x + (1 - fall) * 60;
      const y = ar.y - cam.y - (1 - fall) * 220;
      ctx.strokeStyle = '#d8c8a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 7, y - 24);
      ctx.lineTo(x, y);
      ctx.stroke();
      if (fall >= 1) {
        ctx.strokeStyle = '#8a7050';
        ctx.beginPath();
        ctx.moveTo(ar.x - cam.x + 3, ar.y - cam.y - 10);
        ctx.lineTo(ar.x - cam.x, ar.y - cam.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function castSetas(world, player) {
  const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[player.facing];
  world.spells.push(new ArrowRain(player.x + v[0] * 130, player.y + v[1] * 130));
}

// ---------- registro ----------

export const MIRACLES = {
  raio: { key: '1', name: 'Raio do Trovão', saint: 'Santa Bárbara', cost: 30, cast: castRaio },
  setas: { key: '2', name: 'Chuva de Setas', saint: 'São Sebastião', cost: 25, cast: castSetas },
};
