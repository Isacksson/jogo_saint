// Demônios: Imundo (bando, corpo a corpo) e Serpe (cospe veneno à distância)

import { TILE_PX, SCALE } from './constants.js';
import { buildEnemySprites, buildDragonSprites, buildPlayerSprites } from './sprites.js';
import { images } from './assets.js';
import { rollDrop, GroundItem } from './items.js';
import { sfx } from './audio.js';

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
    this.dir = 'down'; // direção do sprite (4 vias)
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
    if (Math.abs(vx) >= Math.abs(vy)) {
      if (vx !== 0) this.dir = vx < 0 ? 'left' : 'right';
    } else {
      this.dir = vy < 0 ? 'up' : 'down';
    }
  }

  updateCommon(dt, world) {
    this.flash = Math.max(0, this.flash - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.stunT = Math.max(0, (this.stunT || 0) - dt);
    if (this.stunT > 0 && Math.random() < dt * 8) {
      world.fx.spark(this.x + (Math.random() - 0.5) * 20, this.y - 30, '#f8f0c0');
    }
    // amarrado pela Corda de Sebastião: imóvel enquanto o laço aperta
    this.bindT = Math.max(0, (this.bindT || 0) - dt);
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
    sfx('hit');
    world.fx.burst(this.x, this.y - 12, this.blood, 8, 150);
    world.fx.text(this.x, this.y - 36, String(Math.round(dmg)), '#f8f0dc');
    if (this.hp <= 0) {
      sfx('die');
      this.dead = true;
      world.kills++;
      world.player.gainFury(12);
      world.player.addXp(this.xpValue, world);
      world.player.faith = Math.min(world.player.faithMax, world.player.faith + 6);
      if (this.keyCarrier && !world.flags[this.keyFlag || 'temChave']) {
        world.groundItems.push(new GroundItem(this.x, this.y, {
          kind: 'chave', flag: this.keyFlag, label: this.keyLabel,
        }));
      }
      // missão cumprida: o chefe (ou mini-chefe) não revive ao reentrar/recarregar
      if (this.isBoss || this.keyCarrier) {
        world.flags.defeated = world.flags.defeated || {};
        world.flags.defeated[world.mapId] = true;
      }
      if (this.opensGate) {
        world.map.openGates();
        world.flags.sealsBroken = world.flags.sealsBroken || {};
        world.flags.sealsBroken[world.mapId] = true;
        world.fx.text(this.x, this.y - 60, 'Os selos da fossa se rompem!', '#e8dcb8');
        world.fx.addShake(6);
      }
      this.onDeath?.(world);
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
    ctx.drawImage(sprite, sx, sy, px, px);
    ctx.restore();

    // as voltas do laço da Corda de Sebastião
    if (this.bindT > 0 && this.alive) {
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const ly = this.y - cam.y - (8 + i * 7) * this.scale;
        ctx.beginPath();
        ctx.moveTo(this.x - cam.x - 7 * this.scale, ly);
        ctx.lineTo(this.x - cam.x + 7 * this.scale, ly + 2);
        ctx.stroke();
      }
    }

    // nome de mini-chefe pairando sobre a criatura
    if (this.miniName && this.alive) {
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.fillStyle = this.miniNameColor || '#e8c860';
      const ny = this.y - cam.y - px - 12;
      ctx.strokeText(this.miniName, this.x - cam.x, ny);
      ctx.fillText(this.miniName, this.x - cam.x, ny);
    }

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
    if (this.stunT > 0 || this.bindT > 0) return; // cegado pela Luz ou amarrado
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
    const sheet = buildEnemySprites()[this.sheetName || 'imundo'];
    const frame = sheet[this.dir][Math.floor(this.animTime * 7) % 4];
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
    this.sheetName = 'golgor';
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
    this.sheetName = 'amon';
    this.minionType = Imundo;
    this.summonCry = 'LEVANTAI-VOS, IMUNDOS!';
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
    if (this.stunT > 0 || this.bindT > 0) return; // até os príncipes vacilam diante da Luz
    this.animTime += dt * (this.enraged ? 1.6 : 1);
    this.chargeCd = Math.max(0, this.chargeCd - dt);

    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // aos 50% de vida, convoca seus servos (uma única vez)
    if (!this.summoned && this.hp <= this.hpMax * 0.5) {
      this.summoned = true;
      world.fx.text(this.x, this.y - 70, this.summonCry, '#e88060');
      world.fx.addShake(6);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const m = new this.minionType(0, 0);
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
    const sheet = buildEnemySprites()[this.sheetName];
    const frame = sheet[this.dir][Math.floor(this.animTime * 7) % 4];
    ctx.save();
    if (this.enraged) ctx.filter = 'saturate(1.8) brightness(1.15)';
    if (this.windup > 0) ctx.translate((Math.random() - 0.5) * 5, 0);
    this.renderSprite(ctx, cam, frame);
    ctx.restore();
  }
}

// ---------- Invejoso: espírito verde que cobiça e persegue ----------

export class Invejoso extends Imundo {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 44;
    this.hp = 44;
    this.speed = 125;
    this.dmg = 11;
    this.xpValue = 20;
    this.blood = '#3c6428';
    this.sheetName = 'invejoso';
  }
}

// ---------- Cobrador: o coletor possesso do Distrito do Tesouro ----------

export class Cobrador extends Invejoso {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 180;
    this.hp = 180;
    this.speed = 115;
    this.dmg = 18;
    this.xpValue = 110;
    this.scale = 1.5;
    this.hbW = 13 * SCALE;
    this.hbH = 7 * SCALE;
    this.keyCarrier = true;
    this.keyFlag = 'chaveCofre';
    this.keyLabel = '✝ As chaves do Cofre Grande!';
    this.miniName = 'O Cobrador Possesso';
    this.miniNameColor = '#a8d060';
  }

  // ferido, deixa escapar o que cobrou dos pobres
  takeDamage(dmg, kbX, kbY, world) {
    const wasAlive = this.alive;
    super.takeDamage(dmg, kbX, kbY, world);
    if (wasAlive && Math.random() < 0.3) {
      world.groundItems.push(new GroundItem(this.x, this.y, {
        kind: 'gold',
        amount: 2 + Math.floor(Math.random() * 5),
      }));
    }
  }
}

// ---------- A Sombra do Pretendente: a obsessão de Corvino, encarnada ----------
// (não é o homem — é o desejo dele com dentes; vencê-la o liberta, como Inês
// devolveu ao pretendente a vida que a própria cobiça lhe tirou)

export class Pretendente extends Invejoso {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 200;
    this.hp = 200;
    this.speed = 120;
    this.dmg = 18;
    this.xpValue = 120;
    this.scale = 1.5;
    this.hbW = 13 * SCALE;
    this.hbH = 7 * SCALE;
    this.blood = '#8a2040';
    this.keyCarrier = true;
    this.keyFlag = 'chaveJardim';
    this.keyLabel = '✝ A chave do roseiral!';
    this.miniName = 'A Sombra do Pretendente';
    this.miniNameColor = '#f090b0';
  }
}

// ---------- Leviatã: príncipe da Fossa da Inveja ----------

export class Leviata extends Amon {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 380;
    this.hp = 380;
    this.dmg = 20;
    this.xpValue = 220;
    this.blood = '#2c5040';
    this.bossName = 'Leviatã — Príncipe da Inveja';
    this.sheetName = 'leviata';
    this.minionType = Invejoso;
    this.summonCry = 'O QUE É TEU SERÁ MEU!';
  }
}

// ---------- Possesso: lento e voraz; explode em miasma ao morrer ----------

export class Possesso extends Imundo {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 70;
    this.hp = 70;
    this.speed = 58;
    this.dmg = 12;
    this.xpValue = 26;
    this.blood = '#5a7a30';
    this.sheetName = 'possesso';
  }

  onDeath(world) {
    // o miasma da gula
    world.fx.burst(this.x, this.y - 10, '#8ab040', 22, 200);
    world.fx.addShake(3);
    const p = world.player;
    if (p.alive && Math.hypot(p.x - this.x, p.y - this.y) < 84) {
      p.takeDamage(14, this.x, this.y, world);
    }
  }
}

// ---------- Carcereiro: o chaveiro possesso de Forte Sebaste ----------

export class Carcereiro extends Possesso {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 150;
    this.hp = 150;
    this.speed = 74;
    this.dmg = 16;
    this.xpValue = 80;
    this.scale = 1.5;
    this.hbW = 13 * SCALE;
    this.hbH = 7 * SCALE;
    this.keyCarrier = true;
    this.keyFlag = 'chaveForte';
    this.keyLabel = '✝ As chaves do Carcereiro!';
  }

  render(ctx, cam) {
    super.render(ctx, cam);
    if (this.alive) {
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(10, 6, 2, 0.9)';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#a8d060';
      const y = this.y - cam.y - SPRITE_PX * this.scale - 12;
      ctx.strokeText('O Carcereiro Possesso', this.x - cam.x, y);
      ctx.fillText('O Carcereiro Possesso', this.x - cam.x, y);
    }
  }
}

// ---------- Os Quatro Cavaleiros do Apocalipse (GDD §2.6) ----------
//
// Não são príncipes das fossas: aparecem como emboscadas semi-roteirizadas nas
// Estradas do Império. Silhuetas de Jorge tingidas — espelhos sombrios do
// cavaleiro. Derrotá-los não os mata: figuras apocalípticas se dissolvem e
// prometem voltar (e voltam, fundidas como arauto da Serpente, no Ato III).

export class CavaleiroGuerra extends Amon {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 340;
    this.hp = 340;
    this.dmg = 20;
    this.xpValue = 240;
    this.scale = 2;
    this.hbW = 13 * SCALE;
    this.hbH = 7 * SCALE;
    this.blood = '#7a1010';
    this.bossName = 'GUERRA, o Primeiro Cavaleiro';
    this.opensGate = false;
    this.minionType = Imundo;
    this.summonCry = 'A GUERRA NÃO POUPA NINGUÉM!';
    // identidade apocalíptica: flag, cores e despedida de cada Cavaleiro
    this.horseman = 'guerra';
    this.tint = 'sepia(1) saturate(9) hue-rotate(-42deg) brightness(0.52)'; // cavalo vermelho
    this.aura = '200, 40, 24';
    this.farewell = '"Voltarei quando a hora chegar, cavaleiro de Cristo."';
  }

  // os Cavaleiros enchem a Fúria mais depressa: sobreviver a eles é o prêmio
  update(dt, world) {
    const hpBefore = world.player.hp;
    super.update(dt, world);
    if (world.player.hp < hpBefore) world.player.gainFury(10);
  }

  onDeath(world) {
    world.flags.cavaleiros = world.flags.cavaleiros || {};
    world.flags.cavaleiros[this.horseman] = true;
    world.fx.addShake(9);
    world.fx.burst(this.x, this.y - 20, this.blood, 40, 300);
    world.fx.burst(this.x, this.y - 20, '#2a2018', 26, 220);
    world.fx.text(this.x, this.y - 96, this.farewell, '#e88060');
    world.fx.text(this.x, this.y - 72, 'O Cavaleiro se dissolve em cinza e ferro. A estrada está livre.', '#e8dcb8');
  }

  render(ctx, cam) {
    if (!this.alive) return;
    const frame = buildPlayerSprites()[this.dir][Math.floor(this.animTime * 6) % 4];

    // a aura do cavalo
    const x = this.x - cam.x, y = this.y - cam.y - 16 * this.scale;
    const pulse = 0.3 + 0.1 * Math.sin(this.animTime * 4);
    const g = ctx.createRadialGradient(x, y, 6, x, y, 70);
    g.addColorStop(0, `rgba(${this.aura}, ${this.enraged ? pulse + 0.15 : pulse})`);
    g.addColorStop(1, `rgba(${this.aura}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - 70, y - 70, 140, 140);

    ctx.save();
    if (this.flash <= 0) ctx.filter = this.tint;
    if (this.windup > 0) ctx.translate((Math.random() - 0.5) * 5, 0);
    this.renderSprite(ctx, cam, frame);
    ctx.restore();
  }
}

// Conquista: coroa, arco e cavalo branco — cobiça o que é do outro.
// Além do repertório do irmão, dispara rajadas de flechas à distância.
export class CavaleiroConquista extends CavaleiroGuerra {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 400;
    this.hp = 400;
    this.dmg = 22;
    this.xpValue = 280;
    this.blood = '#8a8a96';
    this.bossName = 'CONQUISTA, o Segundo Cavaleiro';
    this.minionType = Invejoso;
    this.summonCry = 'O QUE É VOSSO SERÁ MEU!';
    this.horseman = 'conquista';
    this.tint = 'saturate(0.12) brightness(1.45) contrast(1.15)'; // cavalo branco
    this.aura = '225, 225, 240';
    this.farewell = '"Toda coroa é minha por direito. Guarda a tua — por enquanto."';
    this.volleyCd = 0.9; // apresenta-se com o arco, antes do primeiro bote
  }

  update(dt, world) {
    // o arco do conquistador dispara ANTES do bote deste frame decidir:
    // um leque de flechas sempre que o alvo guarda distância
    this.volleyCd = Math.max(0, this.volleyCd - dt);
    const livre = this.alive && this.stunT <= 0 && (this.bindT || 0) <= 0
      && this.windup <= 0 && this.chargeT <= 0;
    const p = world.player;
    if (livre && this.volleyCd <= 0 && p.alive) {
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 140 && dist < 460) {
        this.volleyCd = this.enraged ? 1.8 : 3.2;
        const base = Math.atan2(dy, dx);
        for (let i = -1; i <= 1; i++) {
          const a = base + i * 0.18;
          world.projectiles.push(new Dart(this.x + Math.cos(a) * 30, this.y - 24, Math.cos(a), Math.sin(a)));
        }
        sfx('swing');
      }
    }
    super.update(dt, world);
  }
}

// ---------- Flecha do Cavaleiro Conquista ----------

export class Dart {
  constructor(x, y, dirX, dirY) {
    this.x = x;
    this.y = y;
    this.vx = dirX * 330;
    this.vy = dirY * 330;
    this.dmg = 12;
    this.life = 1.8;
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
    world.fx.burst(this.x, this.y, '#d8d8e0', 5, 100);
  }

  render(ctx, cam) {
    const img = images.arrow;
    ctx.save();
    ctx.translate(this.x - cam.x, this.y - cam.y);
    ctx.rotate(Math.atan2(this.vy, this.vx));
    ctx.drawImage(img, -img.width * 1.5, -img.height * 1.5, img.width * 3, img.height * 3);
    ctx.restore();
  }
}

// Fome: balança, cavalo negro — apetites que nunca se saciam. O que ele
// arranca de ti o alimenta: cada golpe que acerta lhe devolve a carne.
export class CavaleiroFome extends CavaleiroGuerra {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 460;
    this.hp = 460;
    this.dmg = 24;
    this.xpValue = 320;
    this.blood = '#3a3020';
    this.bossName = 'FOME, o Terceiro Cavaleiro';
    this.minionType = Possesso;
    this.summonCry = 'TUDO DEVORO — E NADA ME FARTA!';
    this.horseman = 'fome';
    this.tint = 'brightness(0.3) saturate(0.4) contrast(1.4)'; // cavalo negro
    this.aura = '120, 90, 30';
    this.farewell = '"A fome volta sempre, cavaleiro. Sempre."';
  }

  update(dt, world) {
    const before = world.player.hp;
    super.update(dt, world);
    const dealt = before - world.player.hp;
    if (dealt > 0 && this.alive) {
      this.hp = Math.min(this.hpMax, this.hp + dealt);
      world.fx.text(this.x, this.y - 70, 'A Fome se farta de ti!', '#c8a860');
      world.fx.burst(this.x, this.y - 30, '#3a3020', 8, 130);
    }
  }
}

// ---------- Belzebu: príncipe da Fossa da Gula ----------

export class Belzebu extends Amon {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 440;
    this.hp = 440;
    this.dmg = 22;
    this.xpValue = 260;
    this.blood = '#6a5020';
    this.bossName = 'Belzebu — Príncipe da Gula';
    this.sheetName = 'belzebu';
    this.minionType = Possesso;
    this.summonCry = 'DEVORAI TUDO!';
  }
}

// ---------- Mamon: príncipe da Fossa da Avareza ----------

export class Mamon extends Amon {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 500;
    this.hp = 500;
    this.dmg = 24;
    this.xpValue = 300;
    this.blood = '#6a5a20';
    this.bossName = 'Mamon — Príncipe da Avareza';
    this.sheetName = 'mamon';
    this.minionType = Invejoso;
    this.summonCry = 'TUDO TEM PREÇO!';
  }

  takeDamage(dmg, kbX, kbY, world) {
    const wasAlive = this.alive;
    super.takeDamage(dmg, kbX, kbY, world);
    // a avareza sangra ouro
    if (wasAlive && Math.random() < 0.35) {
      world.groundItems.push(new GroundItem(this.x, this.y, {
        kind: 'gold',
        amount: 3 + Math.floor(Math.random() * 6),
      }));
    }
  }
}

// ---------- Asmodeu: príncipe da Fossa da Luxúria ----------

export class Asmodeu extends Amon {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 560;
    this.hp = 560;
    this.dmg = 26;
    this.xpValue = 340;
    this.blood = '#8a2040';
    this.bossName = 'Asmodeu — Príncipe da Luxúria';
    this.sheetName = 'asmodeu';
    this.minionType = Invejoso;
    this.summonCry = 'VINDE, MEUS AMORES!';
    this.seduceCd = 5;
  }

  update(dt, world) {
    super.update(dt, world);
    if (!this.alive || this.stunT > 0 || this.bindT > 0) return;

    // a sedução: puxa o cavaleiro para o abraço da morte
    this.seduceCd = Math.max(0, this.seduceCd - dt);
    const p = world.player;
    const dx = this.x - p.x;
    const dy = this.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (this.seduceCd <= 0 && p.alive && dist < 380 && dist > 90) {
      this.seduceCd = 6.5;
      this.seduceT = 1.1;
      world.fx.text(this.x, this.y - 80, '"Vem a mim, cavaleiro..."', '#f090b0');
    }
    if (this.seduceT > 0) {
      this.seduceT -= dt;
      if (p.alive && p.state !== 'dodge') {
        p.moveAxis(world.map, (dx / dist) * 150 * dt, 0);
        p.moveAxis(world.map, 0, (dy / dist) * 150 * dt);
        if (Math.random() < dt * 20) world.fx.spark(p.x, p.y - 20, '#f090b0');
      }
    }
  }
}

// ---------- Belfegor: príncipe da Fossa da Preguiça ----------

export class Belfegor extends Amon {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 620;
    this.hp = 620;
    this.dmg = 28;
    this.xpValue = 400;
    this.blood = '#4a5a68';
    this.bossName = 'Belfegor — Príncipe da Preguiça';
    this.sheetName = 'belfegor';
    this.minionType = Possesso;
    this.summonCry = 'DEIXAI-ME... DORMIR...';
    this.sleepCd = 4;
    this.sleepT = 0;
  }

  // sonolento: dorme para regenerar, mas o sono o deixa vulnerável
  update(dt, world) {
    if (!this.alive) return;

    if (this.sleepT > 0) {
      this.updateCommon(dt, world);
      this.sleepT -= dt;
      this.hp = Math.min(this.hpMax, this.hp + 22 * dt); // ressona e sara
      this.animTime += dt * 0.3;
      if (Math.random() < dt * 6) {
        world.fx.text(this.x + (Math.random() - 0.5) * 30, this.y - 40 - Math.random() * 10, 'z', '#a8b8c8');
      }
      // um golpe forte o desperta na hora
      if (this.sleepT <= 0) {
        world.fx.text(this.x, this.y - 70, 'GRRR... QUEM OUSA?', '#c8d8e8');
      }
      return;
    }

    super.update(dt, world);

    // fora de combate próximo, volta a cochilar
    this.sleepCd = Math.max(0, this.sleepCd - dt);
    const p = world.player;
    if (this.sleepCd <= 0 && this.state === 'chase' && p.alive) {
      this.sleepCd = 8;
      this.sleepT = 3.2;
      world.fx.text(this.x, this.y - 70, 'Que sono...', '#a8b8c8');
    }
  }

  takeDamage(dmg, kbX, kbY, world) {
    // dobro de dano enquanto dorme; qualquer golpe encurta o sono
    const asleep = this.sleepT > 0;
    if (asleep) {
      this.sleepT = Math.min(this.sleepT, 0.3);
      world.fx.text(this.x, this.y - 54, 'DESPERTOU!', '#f8d860');
    }
    super.takeDamage(asleep ? dmg * 2 : dmg, kbX, kbY, world);
  }

  render(ctx, cam) {
    super.render(ctx, cam);
    if (this.alive && this.sleepT > 0) {
      // olhos fechados: um "zzz" sobre a cabeça
      ctx.font = 'bold 16px Georgia, serif';
      ctx.fillStyle = '#c8d8e8';
      ctx.textAlign = 'center';
      const py = this.y - cam.y - 32 * this.scale - 6 + Math.sin(this.animTime * 2) * 3;
      ctx.fillText('z Z z', this.x - cam.x, py);
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
    if (this.stunT > 0 || this.bindT > 0) return; // cegada pela Luz ou amarrada
    this.animTime += dt;

    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (p.alive && dist < 340) {
      this.facingLeft = dx < 0;
      this.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
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
    const sheet = buildEnemySprites().serpe;
    const frame = sheet[this.dir][Math.floor(this.animTime * 5) % 4];
    this.renderSprite(ctx, cam, frame);
  }
}

// ---------- O Dragão de Silena: chefe do Ato I ----------

const DRAGON_PX = 32 * SCALE;

export class Dragao extends Enemy {
  constructor(tx, ty) {
    super(tx, ty);
    this.hpMax = 550;
    this.hp = 550;
    this.dmg = 20;
    this.xpValue = 400;
    this.blood = '#2c501f';
    this.hbW = 20 * SCALE;
    this.hbH = 10 * SCALE;
    this.isBoss = true;
    this.bossName = 'O Dragão de Silena';
    this.state = 'chase'; // chase | spit | rise | hover | crash
    this.actT = 0;
    this.spitCd = 2;
    this.flyCd = 5;
    this.biteCd = 0;
    this.altitude = 0; // altura do voo, em px
    this.roared = false;
  }

  get enraged() {
    return this.hp <= this.hpMax * 0.3;
  }

  get airborne() {
    return this.altitude > 20;
  }

  takeDamage(dmg, kbX, kbY, world) {
    if (this.airborne) {
      world.fx.text(this.x, this.y - 80, 'Fora de alcance!', '#c0b090');
      return;
    }
    // pesado demais para ser arremessado
    super.takeDamage(dmg, kbX * 0.15, kbY * 0.15, world);
  }

  onDeath(world) {
    world.flags.dragaoDerrotado = true;
    sfx('roar');
    world.fx.addShake(10);
    world.fx.burst(this.x, this.y - 20, '#f08030', 40, 300);
    world.fx.burst(this.x, this.y - 20, '#2c501f', 30, 240);
    world.fx.text(this.x, this.y - 90, 'O DRAGÃO TOMBOU!', '#f8d860');
    // o tesouro do covil
    const drop = rollDrop();
    world.groundItems.push(new GroundItem(this.x, this.y, { kind: 'gold', amount: 150 }));
    world.groundItems.push(new GroundItem(this.x + 20, this.y, { kind: 'potion' }));
    if (drop && drop.kind === 'equip') {
      drop.rarity = 2;
      world.groundItems.push(new GroundItem(this.x - 20, this.y, drop));
    }
  }

  update(dt, world) {
    if (!this.alive) return;
    this.updateCommon(dt, world);
    if ((this.stunT > 0 || this.bindT > 0) && !this.airborne) return;
    this.animTime += dt;
    this.actT += dt;
    this.spitCd = Math.max(0, this.spitCd - dt);
    this.flyCd = Math.max(0, this.flyCd - dt);
    this.biteCd = Math.max(0, this.biteCd - dt);

    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (this.state !== 'crash' && p.alive) {
      this.facingLeft = dx < 0;
      this.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }

    switch (this.state) {
      case 'chase': {
        if (!p.alive) { this.wander(dt, world, 24); break; }
        // levanta voo a partir de 60% de vida
        if (this.hp <= this.hpMax * 0.6 && this.flyCd <= 0 && dist < 500) {
          this.setAct('rise');
          sfx('roar');
          world.fx.text(this.x, this.y - 80, 'O Dragão alça voo!', '#e88060');
          break;
        }
        if (this.spitCd <= 0 && dist < 420 && dist > 70) {
          this.setAct('spit');
          break;
        }
        if (dist > 60) {
          const spd = this.enraged ? 105 : 70;
          this.move(world.map, (dx / dist) * spd, (dy / dist) * spd, dt);
        } else if (this.biteCd <= 0 && p.alive) {
          p.takeDamage(this.dmg, this.x, this.y, world);
          this.biteCd = 1.2;
        }
        break;
      }
      case 'spit': {
        // pausa e cospe um leque de fogo
        if (this.actT >= 0.45) {
          const n = this.enraged ? 5 : 3;
          const base = Math.atan2(dy, dx);
          for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.22;
            world.projectiles.push(new Fireball(this.x + Math.cos(a) * 40, this.y - 24, Math.cos(a), Math.sin(a)));
          }
          this.spitCd = this.enraged ? 1.5 : 2.6;
          this.setAct('chase');
        }
        break;
      }
      case 'rise': {
        this.altitude = Math.min(90, this.altitude + 160 * dt);
        if (this.actT >= 0.8) this.setAct('hover');
        break;
      }
      case 'hover': {
        // paira e persegue a sombra do cavaleiro
        const spd = 240;
        if (dist > 12) {
          this.x += (dx / dist) * spd * dt; // voa por cima de tudo
          this.y += (dy / dist) * spd * dt;
        }
        if (this.actT >= 1.3) {
          this.setAct('crash');
          world.fx.text(this.x, this.y - 100, '!', '#e88060');
        }
        break;
      }
      case 'crash': {
        this.altitude = Math.max(0, this.altitude - 300 * dt);
        if (this.altitude <= 0) {
          // impacto devastador em área
          world.fx.addShake(9);
          sfx('heavy');
          world.fx.burst(this.x, this.y, '#c8a060', 24, 260);
          if (p.alive && Math.hypot(p.x - this.x, p.y - this.y) < 110) {
            p.takeDamage(26, this.x, this.y, world);
          }
          this.flyCd = this.enraged ? 4 : 7;
          this.spitCd = 1;
          this.setAct('chase');
        }
        break;
      }
    }
  }

  setAct(s) {
    this.state = s;
    this.actT = 0;
  }

  render(ctx, cam) {
    if (!this.alive) return;
    const sheet = buildDragonSprites();
    const animSpeed = this.airborne ? 14 : 6;
    const sprite = sheet[this.dir][Math.floor(this.animTime * animSpeed) % 4];

    // sombra no chão (encolhe quando voa)
    const shScale = 1 - this.altitude / 240;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.35 * shScale})`;
    ctx.beginPath();
    ctx.ellipse(this.x - cam.x, this.y - cam.y + 4, 34 * shScale, 12 * shScale, 0, 0, Math.PI * 2);
    ctx.fill();

    const sx = Math.round(this.x - cam.x - DRAGON_PX / 2);
    const sy = Math.round(this.y - cam.y - DRAGON_PX * 0.85 - this.altitude);
    ctx.save();
    if (this.flash > 0) ctx.filter = 'brightness(2.6) saturate(0.3)';
    else if (this.enraged) ctx.filter = 'saturate(1.6) hue-rotate(90deg)';
    ctx.drawImage(sprite, sx, sy, DRAGON_PX, DRAGON_PX);
    ctx.restore();

    if (this.hurtTimer > 0) {
      const w = 60;
      const bx = this.x - cam.x - w / 2;
      const by = this.y - cam.y - DRAGON_PX * 0.8 - this.altitude - 8;
      ctx.fillStyle = 'rgba(10, 6, 2, 0.8)';
      ctx.fillRect(bx - 1, by - 1, w + 2, 5);
      ctx.fillStyle = '#a8281e';
      ctx.fillRect(bx, by, (this.hp / this.hpMax) * w, 3);
    }
  }
}

// ---------- Bola de fogo do Dragão ----------

export class Fireball {
  constructor(x, y, dirX, dirY) {
    this.x = x;
    this.y = y;
    this.vx = dirX * 290;
    this.vy = dirY * 290;
    this.dmg = 14;
    this.life = 2.4;
    this.dead = false;
  }

  update(dt, world) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Math.random() < dt * 30) world.fx.spark(this.x, this.y, '#f08030');
    if (this.life <= 0 || world.map.isSolidAt(this.x, this.y)) {
      this.splash(world);
      return;
    }
    const p = world.player;
    if (p.alive && Math.hypot(p.x - this.x, (p.y - 14) - this.y) < 22) {
      p.takeDamage(this.dmg, this.x, this.y, world);
      this.splash(world);
    }
  }

  splash(world) {
    this.dead = true;
    world.fx.burst(this.x, this.y, '#f08030', 8, 130);
  }

  render(ctx, cam) {
    const img = images.fireball;
    const ang = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x - cam.x, this.y - cam.y);
    ctx.rotate(ang + Math.PI); // a arte aponta a cauda para a direita
    ctx.drawImage(img, -img.width * 1.5, -img.height * 1.5, img.width * 3, img.height * 3);
    ctx.restore();
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
