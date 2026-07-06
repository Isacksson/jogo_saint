// Efeitos: partículas, números de dano flutuantes e tremor de tela

export class Fx {
  constructor() {
    this.parts = [];
    this.texts = [];
    this.shake = 0;
  }

  addShake(m) {
    this.shake = Math.max(this.shake, m);
  }

  burst(x, y, color, n = 10, speed = 160) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const v = (0.3 + Math.random() * 0.7) * speed;
      this.parts.push({
        x, y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v - 60,
        life: 0.3 + Math.random() * 0.35,
        t: 0,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  spark(x, y, color) {
    this.parts.push({
      x, y,
      vx: (Math.random() - 0.5) * 40,
      vy: -60 - Math.random() * 60,
      life: 0.4 + Math.random() * 0.3,
      t: 0, color,
      size: 2 + Math.random() * 3,
    });
  }

  text(x, y, str, color) {
    this.texts.push({ x, y, str, color, t: 0, life: 0.8 });
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - 26 * dt);
    for (const p of this.parts) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
    for (const t of this.texts) {
      t.t += dt;
      t.y -= 42 * dt;
    }
    this.texts = this.texts.filter((t) => t.t < t.life);
  }

  render(ctx, cam) {
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(Math.round(p.x - cam.x - s / 2), Math.round(p.y - cam.y - s / 2), s, s);
    }
    ctx.globalAlpha = 1;
  }

  renderTexts(ctx, cam) {
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, 1 - Math.pow(t.t / t.life, 2));
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.str, t.x - cam.x, t.y - cam.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x - cam.x, t.y - cam.y);
    }
    ctx.globalAlpha = 1;
  }
}
