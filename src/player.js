// Jorge: movimento, combo de espada, lança Ascalon, esquiva e Fúria Sagrada

import { TILE_PX, SCALE, PLAYER_SPEED } from './constants.js';
import { input } from './input.js';
import { buildPlayerSprites } from './sprites.js';

const SPRITE_PX = 16 * SCALE;

const DIR_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const DIR_VEC = {
  right: { x: 1, y: 0 }, left: { x: -1, y: 0 },
  down: { x: 0, y: 1 }, up: { x: 0, y: -1 },
};

// combo de espada: 3 golpes, o último mais forte e com knockback
const LIGHT = [
  { dmg: 10, kb: 150, dur: 0.22, radius: 42 },
  { dmg: 10, kb: 150, dur: 0.22, radius: 42 },
  { dmg: 16, kb: 320, dur: 0.3, radius: 54 },
];
const HEAVY = { dmg: 24, kb: 240, dur: 0.5, reach: 86 };
const DODGE = { dur: 0.32, speed: 340, cd: 0.45 };
const FURY_DURATION = 6;

export class Player {
  constructor(tileX, tileY) {
    // posição do CENTRO dos pés, em pixels de mundo
    this.x = (tileX + 0.5) * TILE_PX;
    this.y = (tileY + 0.5) * TILE_PX;
    this.facing = 'down';
    this.moving = false;
    this.animTime = 0;
    this.sprites = buildPlayerSprites();

    // hitbox dos pés (para colisão), centrada em (x, y)
    this.hbW = 9 * SCALE;
    this.hbH = 5 * SCALE;

    this.hp = 100; this.hpMax = 100;
    this.faith = 40; this.faithMax = 100;
    this.fury = 0; this.furyMax = 100;

    // progressão e posses
    this.level = 1;
    this.xp = 0;
    this.xpNext = 40;
    this.gold = 0;
    this.potions = 0;
    this.inventory = [];
    this.equip = {}; // arma / escudo / armadura / medalha
    this.refreshStats();

    // máquina de estados de combate
    this.state = 'normal'; // normal | attack | heavy | dodge | dead
    this.stateTime = 0;
    this.comboStep = 0;
    this.comboWindow = 0;
    this.queuedAttack = false;
    this.didHit = false;
    this.invuln = 0;
    this.hurtFlash = 0;
    this.dodgeCd = 0;
    this.dodgeX = 0;
    this.dodgeY = 1;
    this.furyTime = 0;
    this.kbX = 0;
    this.kbY = 0;
  }

  get alive() {
    return this.state !== 'dead';
  }

  // centro do corpo (origem dos ataques), um pouco acima dos pés
  get cy() {
    return this.y - 5 * SCALE;
  }

  gainFury(n) {
    if (this.furyTime > 0) return;
    this.fury = Math.min(this.furyMax, this.fury + n * this.furyMult);
  }

  get dmgMult() {
    return this.furyTime > 0 ? 2 : 1;
  }

  // ---------- progressão e equipamento ----------

  get attackBonus() {
    return (this.equip.arma?.value || 0) + (this.level - 1);
  }

  get defense() {
    return this.equip.escudo?.value || 0;
  }

  get furyMult() {
    return 1 + (this.equip.medalha?.value || 0) / 100;
  }

  refreshStats() {
    this.hpMax = 90 + this.level * 10 + (this.equip.armadura?.value || 0);
    this.hp = Math.min(this.hp, this.hpMax);
  }

  addXp(n, world) {
    this.xp += n;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.xpNext = Math.round(this.xpNext * 1.35);
      this.level++;
      this.refreshStats();
      this.hp = this.hpMax;
      world.fx.text(this.x, this.y - 70, `NÍVEL ${this.level}!`, '#f8d860');
      world.fx.burst(this.x, this.cy, '#f0c040', 20, 200);
      world.fx.addShake(3);
    }
  }

  equipItem(idx, world) {
    const item = this.inventory[idx];
    if (!item) return;
    const prev = this.equip[item.slot];
    this.equip[item.slot] = item;
    this.inventory.splice(idx, 1);
    if (prev) this.inventory.push(prev);
    this.refreshStats();
    world.fx.text(this.x, this.y - 58, `Equipado: ${item.name}`, '#e8dcb8');
  }

  usePotion(world) {
    if (this.potions <= 0 || this.hp >= this.hpMax || !this.alive) return;
    this.potions--;
    this.hp = Math.min(this.hpMax, this.hp + 40);
    world.fx.text(this.x, this.y - 58, '+40', '#78d060');
    world.fx.burst(this.x, this.cy, '#78d060', 10, 130);
  }

  update(dt, world) {
    if (this.state === 'dead') return;
    this.stateTime += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.comboWindow = Math.max(0, this.comboWindow - dt);

    // empurrão recebido
    if (Math.abs(this.kbX) + Math.abs(this.kbY) > 2) {
      this.moveAxis(world.map, this.kbX * dt, 0);
      this.moveAxis(world.map, 0, this.kbY * dt);
      const d = Math.pow(0.0004, dt);
      this.kbX *= d;
      this.kbY *= d;
    }

    // Fúria Sagrada ativa: dano dobrado, regeneração, brasas douradas
    if (this.furyTime > 0) {
      this.furyTime -= dt;
      this.fury = this.furyMax * Math.max(0, this.furyTime) / FURY_DURATION;
      this.hp = Math.min(this.hpMax, this.hp + 4 * dt);
      if (Math.random() < dt * 26) {
        world.fx.spark(this.x + (Math.random() - 0.5) * 34, this.y - Math.random() * 44, '#f0c040');
      }
    }
    if (input.wasPressed('fury') && this.furyTime <= 0 && this.fury >= this.furyMax) {
      this.furyTime = FURY_DURATION;
      world.fx.burst(this.x, this.cy, '#f0c040', 26, 240);
      world.fx.text(this.x, this.y - 62, 'FÚRIA SAGRADA!', '#f8d860');
      world.fx.addShake(6);
    }

    switch (this.state) {
      case 'normal': this.updateNormal(dt, world); break;
      case 'attack': this.updateAttack(dt, world); break;
      case 'heavy': this.updateHeavy(dt, world); break;
      case 'dodge': this.updateDodge(dt, world); break;
    }
  }

  // ---------- estados ----------

  updateNormal(dt, world) {
    let dx = 0, dy = 0;
    if (input.isHeld('up')) dy -= 1;
    if (input.isHeld('down')) dy += 1;
    if (input.isHeld('left')) dx -= 1;
    if (input.isHeld('right')) dx += 1;

    this.moving = dx !== 0 || dy !== 0;

    if (this.moving) {
      if (dx < 0) this.facing = 'left';
      else if (dx > 0) this.facing = 'right';
      else if (dy < 0) this.facing = 'up';
      else this.facing = 'down';

      const len = Math.hypot(dx, dy);
      const step = PLAYER_SPEED * dt;
      this.moveAxis(world.map, (dx / len) * step, 0);
      this.moveAxis(world.map, 0, (dy / len) * step);
      this.animTime += dt;
    } else {
      this.animTime = 0;
    }

    if (input.wasPressed('attack')) {
      const step = this.comboWindow > 0 ? (this.comboStep + 1) % 3 : 0;
      this.startLight(step);
    } else if (input.wasPressed('heavy')) {
      this.setState('heavy');
      this.didHit = false;
    } else if (input.wasPressed('dodge') && this.dodgeCd <= 0) {
      const v = this.moving
        ? { x: dx / Math.hypot(dx, dy), y: dy / Math.hypot(dx, dy) }
        : DIR_VEC[this.facing];
      this.dodgeX = v.x;
      this.dodgeY = v.y;
      this.invuln = Math.max(this.invuln, DODGE.dur + 0.05);
      this.setState('dodge');
    }
  }

  startLight(step) {
    this.comboStep = step;
    this.didHit = false;
    this.queuedAttack = false;
    this.setState('attack');
  }

  setState(s) {
    this.state = s;
    this.stateTime = 0;
    this.moving = false;
  }

  updateAttack(dt, world) {
    const spec = LIGHT[this.comboStep];
    const v = DIR_VEC[this.facing];
    // pequeno avanço durante o golpe
    this.moveAxis(world.map, v.x * 75 * dt, 0);
    this.moveAxis(world.map, 0, v.y * 75 * dt);

    if (!this.didHit && this.stateTime >= spec.dur * 0.35) {
      this.didHit = true;
      this.applyArcHit(world, spec);
    }
    if (input.wasPressed('attack') && this.comboStep < 2) this.queuedAttack = true;

    if (this.stateTime >= spec.dur) {
      if (this.queuedAttack) {
        this.startLight(this.comboStep + 1);
      } else {
        this.setState('normal');
        this.comboWindow = 0.35;
      }
    }
  }

  applyArcHit(world, spec) {
    const v = DIR_VEC[this.facing];
    const cx = this.x + v.x * spec.radius * 0.7;
    const cy = this.cy + v.y * spec.radius * 0.7;
    const half = spec.radius * 0.85;
    let hitAny = false;
    for (const e of world.enemies) {
      if (!e.alive) continue;
      if (Math.abs(e.x - cx) < half + 14 && Math.abs((e.y - 10) - cy) < half + 14) {
        hitAny = true;
        e.takeDamage(
          (spec.dmg + this.attackBonus) * this.dmgMult,
          v.x * spec.kb + (e.x - this.x) * 0.6,
          v.y * spec.kb + (e.y - this.y) * 0.6,
          world
        );
        this.gainFury(6);
      }
    }
    if (hitAny && this.comboStep === 2) world.fx.addShake(4);
  }

  updateHeavy(dt, world) {
    if (!this.didHit && this.stateTime >= HEAVY.dur * 0.3) {
      this.didHit = true;
      const v = DIR_VEC[this.facing];
      const cx = this.x + v.x * HEAVY.reach * 0.55;
      const cy = this.cy + v.y * HEAVY.reach * 0.55;
      // corredor estreito e comprido: a lança perfura em linha
      const alongX = Math.abs(v.x) > 0 ? HEAVY.reach * 0.65 : 22;
      const alongY = Math.abs(v.y) > 0 ? HEAVY.reach * 0.65 : 22;
      let hitAny = false;
      for (const e of world.enemies) {
        if (!e.alive) continue;
        if (Math.abs(e.x - cx) < alongX && Math.abs((e.y - 10) - cy) < alongY) {
          hitAny = true;
          e.takeDamage((HEAVY.dmg + this.attackBonus) * this.dmgMult, v.x * HEAVY.kb, v.y * HEAVY.kb, world);
          this.gainFury(8);
        }
      }
      if (hitAny) world.fx.addShake(5);
    }
    if (this.stateTime >= HEAVY.dur) this.setState('normal');
  }

  updateDodge(dt, world) {
    this.moveAxis(world.map, this.dodgeX * DODGE.speed * dt, 0);
    this.moveAxis(world.map, 0, this.dodgeY * DODGE.speed * dt);
    if (Math.random() < dt * 40) {
      world.fx.spark(this.x, this.y, '#c8b890');
    }
    if (this.stateTime >= DODGE.dur) {
      this.setState('normal');
      this.dodgeCd = DODGE.cd;
    }
  }

  takeDamage(rawDmg, srcX, srcY, world) {
    if (!this.alive || this.invuln > 0 || this.state === 'dodge') return;
    const dmg = Math.max(1, rawDmg - this.defense);
    this.hp -= dmg;
    this.hurtFlash = 0.16;
    this.invuln = 0.9;
    this.gainFury(dmg * 1.2);
    const dx = this.x - srcX, dy = this.y - srcY;
    const d = Math.hypot(dx, dy) || 1;
    this.kbX = (dx / d) * 260;
    this.kbY = (dy / d) * 260;
    world.fx.burst(this.x, this.cy, '#a8281e', 10, 170);
    world.fx.text(this.x, this.y - 58, String(Math.round(dmg)), '#f08060');
    world.fx.addShake(3);
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
      world.fx.burst(this.x, this.cy, '#a8281e', 24, 240);
      world.fx.addShake(8);
    }
  }

  // move num único eixo, cancelando se a hitbox tocar tile sólido
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

  // ---------- render ----------

  render(ctx, camera) {
    const cycle = [1, 0, 2, 0];
    const useWalk = this.moving || this.state === 'dodge';
    const frame = useWalk ? cycle[Math.floor((this.animTime || this.stateTime) * 8) % 4] : 0;

    const dir = this.facing === 'left' ? 'right' : this.facing;
    const sprite = this.sprites[dir][frame];

    const sx = Math.round(this.x - camera.x - SPRITE_PX / 2);
    const sy = Math.round(this.y - camera.y - SPRITE_PX + this.hbH / 2);

    // sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x - camera.x, this.y - camera.y + 2, 7 * SCALE / 2, 3 * SCALE / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // aura da Fúria Sagrada
    if (this.furyTime > 0) {
      const pulse = 0.25 + 0.1 * Math.sin(this.furyTime * 12);
      const g = ctx.createRadialGradient(
        this.x - camera.x, this.cy - camera.y, 4,
        this.x - camera.x, this.cy - camera.y, 44
      );
      g.addColorStop(0, `rgba(248, 200, 80, ${pulse})`);
      g.addColorStop(1, 'rgba(248, 200, 80, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(this.x - camera.x - 44, this.cy - camera.y - 44, 88, 88);
    }

    ctx.save();
    if (this.hurtFlash > 0) ctx.filter = 'brightness(2.4) saturate(0.4)';
    else if (this.invuln > 0 && this.alive && this.state !== 'dodge') {
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(this.invuln * 40); // piscando
    }

    if (this.state === 'dead') {
      // caído no chão
      ctx.globalAlpha = 0.85;
      ctx.translate(this.x - camera.x, this.y - camera.y - 8);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(sprite, -SPRITE_PX / 2, -SPRITE_PX / 2, SPRITE_PX, SPRITE_PX);
    } else if (this.facing === 'left') {
      ctx.translate(sx + SPRITE_PX, sy);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, SPRITE_PX, SPRITE_PX);
    } else {
      ctx.drawImage(sprite, sx, sy, SPRITE_PX, SPRITE_PX);
    }
    ctx.restore();

    if (this.state === 'attack') this.renderSlash(ctx, camera);
    if (this.state === 'heavy') this.renderLance(ctx, camera);
  }

  renderSlash(ctx, camera) {
    const spec = LIGHT[this.comboStep];
    const p = Math.min(1, this.stateTime / spec.dur);
    const sweep = this.comboStep % 2 === 0 ? 1 : -1;
    const ang = DIR_ANGLE[this.facing] + sweep * (-1.1 + 2.2 * p);
    const cx = this.x - camera.x;
    const cy = this.cy - camera.y;

    ctx.save();
    ctx.lineCap = 'round';
    // rastro do corte
    ctx.globalAlpha = 0.85 * (1 - p * 0.5);
    ctx.strokeStyle = this.furyTime > 0 ? '#ffd860' : '#f0ead0';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, spec.radius, ang - 0.55, ang + 0.55);
    ctx.stroke();
    ctx.globalAlpha *= 0.6;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, spec.radius - 9, ang - 0.4, ang + 0.4);
    ctx.stroke();
    // a espada
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#c8ccd4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * (spec.radius - 4), cy + Math.sin(ang) * (spec.radius - 4));
    ctx.stroke();
    ctx.restore();
  }

  renderLance(ctx, camera) {
    const p = Math.min(1, this.stateTime / HEAVY.dur);
    const ext = Math.sin(p * Math.PI) * HEAVY.reach;
    const ang = DIR_ANGLE[this.facing];
    const cx = this.x - camera.x;
    const cy = this.cy - camera.y;
    const tx = cx + Math.cos(ang) * ext;
    const ty = cy + Math.sin(ang) * ext;

    ctx.save();
    ctx.lineCap = 'round';
    // haste de Ascalon
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // ponta de aço
    ctx.strokeStyle = this.furyTime > 0 ? '#ffd860' : '#d8dce4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * Math.max(0, ext - 16), cy + Math.sin(ang) * Math.max(0, ext - 16));
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
  }
}
