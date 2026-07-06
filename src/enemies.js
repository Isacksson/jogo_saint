// Demônios: Imundo (bando, corpo a corpo) e Serpe (cospe veneno à distância)

import { TILE_PX, SCALE } from './constants.js';
import { buildEnemySprites } from './sprites.js';
import { rollDrop, GroundItem } from './items.js';

const SPRITE_PX = 16 * SCALE;

class Enemy {
  constructor(tileX, tileY) {
    this.x = (tileX + 0.5) * TILE_PX;
    this.y = (tileY + 0.5) * TILE_PX;
    this.hbW = 9 * SCALE;
    this.hbH = 5 * SCALE;
    this.kbX = 0;
    this.kbY = 0;
    this.flash = 0;
    this.hurtTimer = 0;    // controla exibição da barra de vida
    this.animTime = Math.random() * 10;
    this.wanderT = 0;
    this.dirX = 0;
    this.dirY = 0;
    this.dead = false;
    this.facingLeft = false;
  }

  get alive() {
    return !this.dead;
  }

  moveAxis(map, mx, my) {
    const nx = this.x + mx;
    const ny = this.y + my;
    const hw = this.hbW / 2, hh = this.hbH / 2;
    const corners = [
      [nx - hw, ny - hh], [nx + hw, ny - hh],
      [nx - hw, ny + hh], [nx + hw, ny + hh],
    ];
    for (const [cx, cy] of corners) {
      if (map.isSolidAt(cx, cy)) return;
    }
    this.x = nx;
    this.y = ny;
  }

  move(map, vx, vy, dt) {
    this.moveAxis(map, vx * dt, 0);
    this.moveAxis(map, 0, vy * dt);
    if (vx !== 0) this.facingLeft = vx < 0;
  }

  updateCommon(dt, world) {
    this.flash = Math.max(0, this.flash - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    if (Math.abs(this.kbX) + Math.abs(this.kbY) > 2) {
      this.moveAxis(world.map, this.kbX * dt, 0);
      this.moveAxis(world.map, 0, this.kbY * dt);
      const d = Math.pow(0.0004, dt);
      this.kbX *= d;
      this.kbY *= d;
    }
  }

  takeDamage(dmg, kbX, kbY, world) {
    if (!this.alive) return;
    this.hp -= dmg;
    this.flash = 0.13;
    this.hurtTimer = 2.5;
    this.kbX = kbX;
    this.kbY = kbY;
    world.fx.burst(this.x, this.y - 12, this.blood, 8, 150);
    world.fx.text(this.x, this.y - 36, String(Math.round(dmg)), '#f8f0dc');
    if (this.hp <= 0) {
      this.dead = true;
      world.kills++;
      world.player.gainFury(12);
      world.player.addXp(this.xpValue, world);
      const drop = rollDrop();
      if (drop) world.groundItems.push(new GroundItem(this.x, this.y, drop));
      world.fx.burst(this.x, this.y - 12, this.blood, 18, 220);
      world.fx.burst(this.x, this.y - 12, '#e8c860', 6, 120);
    }
  }

  wander(dt, world, speed) {
    this.wanderT -= dt;
    if (this.wanderT <= 0) {
      this.wanderT = 1 + Math.random() * 2;
      if (Math.random() < 0.4) {
        this.dirX = 0; this.dirY = 0;
      } else {
        const a = Math.random() * Math.PI * 2;
        this.dirX = Math.cos(a);
        this.dirY = Math.sin(a);
      }
    }
    this.move(world.map, this.dirX * speed, this.dirY * speed, dt);
  }

  renderSprite(ctx, cam, sprite) {
    // sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x - cam.x, this.y - cam.y + 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const sx = Math.round(this.x - cam.x - SPRITE_PX / 2);
    const sy = Math.round(this.y - cam.y - SPRITE_PX + this.hbH / 2);
    ctx.save();
    if (this.flash > 0) ctx.filter = 'brightness(2.6) saturate(0.3)';
    if (this.facingLeft) {
      ctx.translate(sx + SPRITE_PX, sy);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, SPRITE_PX, SPRITE_PX);
    } else {
      ctx.drawImage(sprite, sx, sy, SPRITE_PX, SPRITE_PX);
    }
    ctx.restore();

    // barra de vida (só quando ferido recentemente)
    if (this.hurtTimer > 0 && this.alive) {
      const w = 30;
      const bx = this.x - cam.x - w / 2;
      const by = this.y - cam.y - SPRITE_PX - 4;
      ctx.fillStyle = 'rgba(10, 6, 2, 0.8)';
      ctx.fillRect(bx - 1, by - 1, w + 2, 5);
      ctx.fillStyle = '#a8281e';
      ctx.fillRect(bx, by, (this.hp / this.hpMax) * w, 3);
    }
  }
}

// ---------- Imundo: demônio menor, ataca em bando com investidas ----------

export class Imundo extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 30;
    this.hp = 30;
    this.speed = 105;
    this.dmg = 8;
    this.xpValue = 12;
    this.blood = '#7c1810';
    this.windup = 0;
    this.lungeT = 0;
    this.lungeX = 0;
    this.lungeY = 0;
    this.atkCd = 0;
  }

  update(dt, world) {
    if (!this.alive) return;
    this.updateCommon(dt, world);
    this.animTime += dt;
    this.atkCd = Math.max(0, this.atkCd - dt);

    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // preparando o bote (para, treme)
    if (this.windup > 0) {
      this.windup -= dt;
      if (this.windup <= 0) {
        this.lungeT = 0.26;
        this.lungeX = dx / dist;
        this.lungeY = dy / dist;
      }
      return;
    }

    // bote
    if (this.lungeT > 0) {
      this.lungeT -= dt;
      this.move(world.map, this.lungeX * 330, this.lungeY * 330, dt);
      if (dist < 36 && p.alive) {
        p.takeDamage(this.dmg, this.x, this.y, world);
        this.lungeT = 0;
      }
      if (this.lungeT <= 0) this.atkCd = 0.9;
      return;
    }

    if (p.alive && dist < 250) {
      if (dist < 58 && this.atkCd <= 0) {
        this.windup = 0.32;
      } else if (dist > 42) {
        this.move(world.map, (dx / dist) * this.speed, (dy / dist) * this.speed, dt);
      }
    } else {
      this.wander(dt, world, 38);
    }
  }

  render(ctx, cam) {
    if (!this.alive) return;
    const sprites = buildEnemySprites().imundo;
    const frame = sprites[Math.floor(this.animTime * 6) % 2];
    // tremor durante o windup
    if (this.windup > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * 3, 0);
      this.renderSprite(ctx, cam, frame);
      ctx.restore();
    } else {
      this.renderSprite(ctx, cam, frame);
    }
  }
}

// ---------- Serpe: cria do Dragão, mantém distância e cospe veneno ----------

export class Serpe extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 20;
    this.hp = 20;
    this.speed = 70;
    this.xpValue = 10;
    this.blood = '#3c6428';
    this.shootCd = 1 + Math.random();
  }

  update(dt, world) {
    if (!this.alive) return;
    this.updateCommon(dt, world);
    this.animTime += dt;

    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (p.alive && dist < 340) {
      this.facingLeft = dx < 0;
      // recua se o cavaleiro chegar perto
      if (dist < 140) {
        this.move(world.map, (-dx / dist) * this.speed, (-dy / dist) * this.speed, dt);
      }
      this.shootCd -= dt;
      if (this.shootCd <= 0) {
        this.shootCd = 2.2;
        world.projectiles.push(new Venom(this.x, this.y - 20, dx / dist, dy / dist));
      }
    } else {
      this.wander(dt, world, 26);
    }
  }

  render(ctx, cam) {
    if (!this.alive) return;
    const sprites = buildEnemySprites().serpe;
    const frame = sprites[Math.floor(this.animTime * 4) % 2];
    this.renderSprite(ctx, cam, frame);
  }
}

// ---------- Projétil de veneno ----------

export class Venom {
  constructor(x, y, dirX, dirY) {
    this.x = x;
    this.y = y;
    this.vx = dirX * 240;
    this.vy = dirY * 240;
    this.dmg = 10;
    this.life = 2.2;
    this.dead = false;
  }

  update(dt, world) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0 || world.map.isSolidAt(this.x, this.y)) {
      this.splash(world);
      return;
    }
    const p = world.player;
    if (p.alive && Math.hypot(p.x - this.x, (p.y - 14) - this.y) < 20) {
      p.takeDamage(this.dmg, this.x, this.y, world);
      this.splash(world);
    }
  }

  splash(world) {
    this.dead = true;
    world.fx.burst(this.x, this.y, '#6ab040', 6, 110);
  }

  render(ctx, cam) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    ctx.fillStyle = '#35682a';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8cc858';
    ctx.beginPath();
    ctx.arc(x - 1, y - 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
