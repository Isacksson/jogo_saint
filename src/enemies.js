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
    this.scale = 1;
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
      world.player.faith = Math.min(world.player.faithMax, world.player.faith + 6);
      if (this.keyCarrier && !world.flags.temChave) {
        world.groundItems.push(new GroundItem(this.x, this.y, { kind: 'chave' }));
      }
      if (this.opensGate) {
        world.map.openGates();
        world.fx.text(this.x, this.y - 60, 'Os selos da fossa se rompem!', '#e8dcb8');
        world.fx.addShake(6);
      }
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
    const px = SPRITE_PX * this.scale;

    // sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x - cam.x, this.y - cam.y + 2, 10 * this.scale, 4 * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const sx = Math.round(this.x - cam.x - px / 2);
    const sy = Math.round(this.y - cam.y - px + this.hbH / 2);
    ctx.save();
    if (this.flash > 0) ctx.filter = 'brightness(2.6) saturate(0.3)';
    if (this.facingLeft) {
      ctx.translate(sx + px, sy);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, px, px);
    } else {
      ctx.drawImage(sprite, sx, sy, px, px);
    }
    ctx.restore();

    // barra de vida (só quando ferido recentemente)
    if (this.hurtTimer > 0 && this.alive) {
      const w = 30 * this.scale;
      const bx = this.x - cam.x - w / 2;
      const by = this.y - cam.y - px - 4;
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

// ---------- Imundo Chefe: o ladrão da chave das catacumbas ----------

export class ImundoChefe extends Imundo {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 120;
    this.hp = 120;
    this.speed = 90;
    this.dmg = 14;
    this.xpValue = 60;
    this.scale = 1.6;
    this.hbW = 13 * SCALE;
    this.hbH = 7 * SCALE;
    this.keyCarrier = true;
  }

  render(ctx, cam) {
    super.render(ctx, cam);
    // o nome do chefe paira sobre ele
    if (this.alive) {
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#e88060';
      const y = this.y - cam.y - SPRITE_PX * this.scale - 12;
      ctx.strokeText('Gólgor, o Ladrão da Chave', this.x - cam.x, y);
      ctx.fillText('Gólgor, o Ladrão da Chave', this.x - cam.x, y);
    }
  }
}

// ---------- Amon, o Furioso: príncipe da Fossa da Ira ----------

export class Amon extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 300;
    this.hp = 300;
    this.speed = 85;
    this.dmg = 18;
    this.xpValue = 150;
    this.scale = 2.3;
    this.hbW = 15 * SCALE;
    this.hbH = 8 * SCALE;
    this.blood = '#5c0c08';
    this.isBoss = true;
    this.bossName = 'Amon, o Furioso — Príncipe da Ira';
    this.opensGate = true;
    this.windup = 0;
    this.chargeT = 0;
    this.chargeX = 0;
    this.chargeY = 0;
    this.chargeCd = 2;
    this.summoned = false;
    this.hitInCharge = false;
    this.atkTick = 0;
  }

  get enraged() {
    return this.hp <= this.hpMax * 0.3;
  }

  update(dt, world) {
    if (!this.alive) return;
    this.updateCommon(dt, world);
    this.animTime += dt * (this.enraged ? 1.6 : 1);
    this.chargeCd = Math.max(0, this.chargeCd - dt);

    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // aos 50% de vida, convoca seus servos (uma única vez)
    if (!this.summoned && this.hp <= this.hpMax * 0.5) {
      this.summoned = true;
      world.fx.text(this.x, this.y - 70, 'LEVANTAI-VOS, IMUNDOS!', '#e88060');
      world.fx.addShake(6);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const m = new Imundo(0, 0);
        m.x = this.x + Math.cos(a) * 70;
        m.y = this.y + Math.sin(a) * 70;
        world.enemies.push(m);
        world.fx.burst(m.x, m.y - 10, '#7c1810', 10, 150);
      }
    }

    // preparando a investida: para e ruge
    if (this.windup > 0) {
      this.windup -= dt;
      if (this.windup <= 0) {
        this.chargeT = 0.55;
        this.hitInCharge = false;
        this.chargeX = dx / dist;
        this.chargeY = dy / dist;
      }
      return;
    }

    // investida devastadora
    if (this.chargeT > 0) {
      this.chargeT -= dt;
      this.move(world.map, this.chargeX * 480, this.chargeY * 480, dt);
      if (!this.hitInCharge && dist < 52 && p.alive) {
        this.hitInCharge = true;
        p.takeDamage(24, this.x, this.y, world);
      }
      if (this.chargeT <= 0) this.chargeCd = this.enraged ? 1.6 : 3;
      return;
    }

    if (p.alive && dist < 420) {
      if (dist > 90 && this.chargeCd <= 0) {
        this.windup = 0.55;
        world.fx.text(this.x, this.y - 64, '!', '#e88060');
      } else {
        const spd = this.enraged ? 135 : this.speed;
        this.move(world.map, (dx / dist) * spd, (dy / dist) * spd, dt);
        if (dist < 50 && p.alive && this.atkTick <= 0) {
          p.takeDamage(this.dmg, this.x, this.y, world);
          this.atkTick = 1.1;
        }
      }
    } else {
      this.wander(dt, world, 30);
    }
    this.atkTick = Math.max(0, this.atkTick - dt);
  }

  render(ctx, cam) {
    if (!this.alive) return;
    const sprites = buildEnemySprites().imundo;
    const frame = sprites[Math.floor(this.animTime * 6) % 2];
    ctx.save();
    if (this.enraged) ctx.filter = 'saturate(1.8) brightness(1.1)';
    if (this.windup > 0) ctx.translate((Math.random() - 0.5) * 5, 0);
    this.renderSprite(ctx, cam, frame);
    ctx.restore();
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
