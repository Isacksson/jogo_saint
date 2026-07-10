// Jorge: movimento, combo de espada, lança Ascalon, esquiva e Fúria Sagrada

import { TILE_PX, SCALE, PLAYER_SPEED } from './constants.js';
import { input } from './input.js';
import { buildPlayerSprites, buildFxFrames } from './sprites.js';
import { MIRACLES } from './miracles.js';
import { Spear } from './spear.js';
import { hasInstrument } from './instruments.js';
import { sfx } from './audio.js';

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
// dano e alcance vêm da Spear; aqui ficam só o tempo do golpe e o empurrão
const HEAVY = { kb: 240, dur: 0.5 };
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
    this.spear = new Spear(); // lança de guarnição -> Ascalon (GDD §2.3)
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
    this.castCd = 0;
    this.shieldT = 0; // Jejum que Fortalece
    this.ropeCd = 0;  // Corda de Sebastião
    this.grapple = null;
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

  // a lança é mortal, não mágica: não escala com a espada de loot, só com nível
  get lanceBonus() {
    return this.level - 1;
  }

  get defense() {
    return (this.equip.escudo?.value || 0) + (this.shieldT > 0 ? 6 : 0);
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
      sfx('level');
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

  tryCast(id, world) {
    if (this.castCd > 0) return;
    const m = MIRACLES[id];
    if (!world.flags.milagres?.[id]) return;
    if (this.faith < m.cost) {
      world.fx.text(this.x, this.y - 58, 'Fé insuficiente...', '#8098c0');
      this.castCd = 0.3;
      return;
    }
    this.faith -= m.cost;
    this.castCd = 0.5;
    sfx('cast');
    m.cast(world, this);
    world.fx.text(this.x, this.y - 62, m.name + '!', '#a8c8f8');
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
    this.castCd = Math.max(0, this.castCd - dt);
    this.shieldT = Math.max(0, this.shieldT - dt);
    this.ropeCd = Math.max(0, this.ropeCd - dt);

    // a Fé se recompõe devagar
    this.faith = Math.min(this.faithMax, this.faith + 2.5 * dt);

    // milagres (teclas 1-2)
    if (this.state === 'normal') {
      if (input.wasPressed('mir1')) this.tryCast('raio', world);
      if (input.wasPressed('mir2')) this.tryCast('setas', world);
      if (input.wasPressed('mir3')) this.tryCast('luz', world);
      if (input.wasPressed('mir4')) this.tryCast('jejum', world);
      if (input.wasPressed('mir5')) this.tryCast('fogo', world);
      if (input.wasPressed('mir6')) this.tryCast('cordeiro', world);
      if (input.wasPressed('mir7')) this.tryCast('vade', world);
    }

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
      sfx('fury');
      world.fx.burst(this.x, this.cy, '#f0c040', 26, 240);
      world.fx.text(this.x, this.y - 62, 'FÚRIA SAGRADA!', '#f8d860');
      world.fx.addShake(6);
    }

    switch (this.state) {
      case 'normal': this.updateNormal(dt, world); break;
      case 'attack': this.updateAttack(dt, world); break;
      case 'heavy': this.updateHeavy(dt, world); break;
      case 'dodge': this.updateDodge(dt, world); break;
      case 'grapple': this.updateGrapple(dt, world); break;
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
      sfx('heavy');
    } else if (input.wasPressed('corda')) {
      this.useInstrument(world);
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
    sfx('swing');
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
      const reach = this.spear.reach;
      const cx = this.x + v.x * reach * 0.55;
      const cy = this.cy + v.y * reach * 0.55;
      // corredor estreito e comprido: a lança perfura em linha
      const alongX = Math.abs(v.x) > 0 ? reach * 0.65 : 22;
      const alongY = Math.abs(v.y) > 0 ? reach * 0.65 : 22;
      const dmg = (this.spear.dmg + this.lanceBonus) * this.dmgMult;
      let hitAny = false;
      for (const e of world.enemies) {
        if (!e.alive) continue;
        if (Math.abs(e.x - cx) < alongX && Math.abs((e.y - 10) - cy) < alongY) {
          hitAny = true;
          e.takeDamage(dmg, v.x * HEAVY.kb, v.y * HEAVY.kb, world);
          this.gainFury(8);
        }
      }
      if (hitAny) world.fx.addShake(5);
    }
    if (this.stateTime >= HEAVY.dur) this.setState('normal');
  }

  // Os instrumentos das fossas (R), por prioridade de contexto (GDD §3.7):
  // pira apagada → Espelho; miragem → Cajado; âncora → Corda (travessia);
  // horda colada → repelão do Cajado; grupo em volta → clarão do Espelho;
  // senão → laço da Corda (imobiliza o mais próximo por 2 s)
  useInstrument(world) {
    if (this.ropeCd > 0) return;
    const temCorda = hasInstrument(world.flags, 'corda');
    const temEspelho = hasInstrument(world.flags, 'espelho');
    const temCajado = hasInstrument(world.flags, 'cajado');
    const temBalanca = hasInstrument(world.flags, 'balanca');
    const temGrinalda = hasInstrument(world.flags, 'grinalda');
    if (!temCorda && !temEspelho && !temCajado && !temBalanca && !temGrinalda) return;

    // 1) o Espelho diante de uma pira apagada: a luz da santa a reacende
    for (const b of world.beacons || []) {
      if (world.flags.farois?.[b.key]) continue;
      if (Math.hypot(b.x - this.x, b.y - this.y) > 90) continue;
      if (!temEspelho) {
        world.fx.text(this.x, this.y - 58, 'A pira está fria. Só a luz da santa a acende...', '#c0b090');
        this.ropeCd = 0.6;
        return;
      }
      world.flags.farois = world.flags.farois || {};
      world.flags.farois[b.key] = true;
      world.fx.whiteFlash = Math.max(world.fx.whiteFlash, 0.25);
      world.fx.burst(b.x, b.y - 30, '#f8e8a0', 26, 220);
      sfx('pray');
      if (b.msg) world.fx.text(b.x, b.y - 74, b.msg, '#f8d860');
      if (b.gold) {
        this.gold += b.gold;
        world.fx.text(this.x, this.y - 46, `+${b.gold} denários dos gratos do porto`, '#f0d060');
      }
      this.ropeCd = 0.6;
      return;
    }

    // 2) um selo no cenário (miragem, contrapeso...): o instrumento certo o desfaz
    for (const mir of world.mirages || []) {
      if (world.flags.miragens?.[mir.key]) continue;
      if (Math.hypot(mir.x - this.x, mir.y - this.y) > 90) continue;
      if (!hasInstrument(world.flags, mir.inst || 'cajado')) {
        world.fx.text(this.x, this.y - 58,
          mir.hint || 'O ar treme sobre a água... Falta-te o Cajado do eremita.', '#c0b090');
        this.ropeCd = 0.6;
        return;
      }
      world.flags.miragens = world.flags.miragens || {};
      world.flags.miragens[mir.key] = true;
      for (const [mx, my] of mir.tiles) {
        world.map.set(mx, my, mir.to);
        world.fx.burst((mx + 0.5) * TILE_PX, (my + 0.5) * TILE_PX, '#e8d8a0', 12, 140);
      }
      sfx('cast');
      world.fx.text(this.x, this.y - 58,
        mir.msg || 'O Cajado desfaz a miragem: há chão sob a água!', '#e8d8a0');
      this.ropeCd = 0.6;
      return;
    }

    // 3) uma âncora alinhada com o olhar: lança-se por sobre o que houver
    const v = DIR_VEC[this.facing];
    if (temCorda) {
      let best = null, bestD = Infinity;
      for (const a of world.anchors || []) {
        const dx = a.x - this.x, dy = a.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 40 || d > 330) continue;
        if ((dx * v.x + dy * v.y) / d < 0.72) continue;
        if (d < bestD) { best = a; bestD = d; }
      }
      if (best) {
        this.grapple = { x: best.x, y: best.y };
        this.invuln = Math.max(this.invuln, 1);
        this.ropeCd = 0.6;
        sfx('swing');
        this.setState('grapple');
        return;
      }
    }

    // 4) o repelão do Cajado: empurra a horda colada ao cavaleiro
    if (temCajado) {
      const colados = world.enemies.filter(
        (e) => e.alive && Math.hypot(e.x - this.x, e.y - this.y) < 130
      );
      if (colados.length >= 2) {
        for (const e of colados) {
          const dx = e.x - this.x, dy = e.y - this.y;
          const d = Math.hypot(dx, dy) || 1;
          e.takeDamage(8, (dx / d) * 520, (dy / d) * 520, world);
        }
        sfx('heavy');
        world.fx.burst(this.x, this.cy, '#e8d8a0', 18, 240);
        world.fx.text(this.x, this.y - 58, 'O golpe de recuo do Cajado!', '#e8d8a0');
        world.fx.addShake(4);
        this.ropeCd = 5;
        return;
      }
    }

    // 5) a zona da paz da Grinalda: uma horda inteira (3+) se aquieta
    if (temGrinalda) {
      const roda = world.enemies.filter(
        (e) => e.alive && Math.hypot(e.x - this.x, e.y - this.y) < 220
      );
      if (roda.length >= 3) {
        world.spells.push(new CalmZone(this.x, this.cy));
        sfx('pray');
        world.fx.text(this.x, this.y - 58, 'A paz da Grinalda se espalha...', '#f0b0c8');
        this.ropeCd = 9;
        return;
      }
    }

    // 6) o clarão do Espelho: cega o grupo que cerca o cavaleiro
    if (temEspelho) {
      const cercam = world.enemies.filter(
        (e) => e.alive && Math.hypot(e.x - this.x, e.y - this.y) < 220
      );
      if (cercam.length >= 2) {
        for (const e of cercam) e.stunT = Math.max(e.stunT || 0, 1.3);
        world.fx.whiteFlash = Math.max(world.fx.whiteFlash, 0.16);
        sfx('cast');
        world.fx.text(this.x, this.y - 58, 'O clarão do Espelho!', '#f8f4d8');
        this.ropeCd = 6;
        return;
      }
    }

    // 7) o laço: amarra o inimigo mais próximo
    if (!temCorda) {
      world.fx.text(this.x, this.y - 58, 'Nenhum instrumento acha uso aqui...', '#c0b090');
      this.ropeCd = 0.4;
      return;
    }
    let e0 = null, bestD = 240;
    for (const e of world.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < bestD) { e0 = e; bestD = d; }
    }
    if (e0) {
      e0.bindT = 2;
      this.ropeCd = 4.5;
      sfx('swing');
      for (let i = 0; i <= 8; i++) {
        world.fx.spark(
          this.x + (e0.x - this.x) * i / 8,
          this.cy + (e0.y - 20 - this.cy) * i / 8,
          '#c8a060'
        );
      }
      world.fx.text(e0.x, e0.y - 50, 'Amarrado!', '#c8a060');
    } else {
      world.fx.text(this.x, this.y - 58, 'A corda não acha onde prender...', '#c0b090');
      this.ropeCd = 0.4;
    }
  }

  // voando pela corda: em linha reta até a âncora, por cima de lava e fossos
  updateGrapple(dt, world) {
    const dx = this.grapple.x - this.x;
    const dy = this.grapple.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = 560 * dt;
    if (d <= step + 2) {
      this.x = this.grapple.x;
      this.y = this.grapple.y;
      this.grapple = null;
      this.setState('normal');
      return;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    if (Math.random() < dt * 30) world.fx.spark(this.x, this.y, '#c8a060');
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
    // a Balança de Lourenço cobra dos agressores a esmola que negaram
    if (hasInstrument(world.flags, 'balanca')) {
      const esmola = Math.ceil(dmg / 3);
      this.gold += esmola;
      world.fx.text(this.x + 26, this.y - 40, `+${esmola}⚖`, '#f0d060');
    }
    sfx('hurt');
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
    const useWalk = this.moving || this.state === 'dodge';
    const frame = useWalk ? Math.floor((this.animTime || this.stateTime) * 9) % 4 : 0;
    const sprite = this.sprites[this.facing][frame];

    const sx = Math.round(this.x - camera.x - SPRITE_PX / 2);
    const sy = Math.round(this.y - camera.y - SPRITE_PX + this.hbH / 2);

    // sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x - camera.x, this.y - camera.y + 2, 7 * SCALE / 2, 3 * SCALE / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // anel do Jejum que Fortalece
    if (this.shieldT > 0 && this.alive) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.6, this.shieldT * 0.4) * (0.7 + 0.3 * Math.sin(this.shieldT * 6));
      ctx.strokeStyle = '#b8d8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x - camera.x, this.cy - camera.y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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
    } else {
      ctx.drawImage(sprite, sx, sy, SPRITE_PX, SPRITE_PX);
    }
    ctx.restore();

    if (this.state === 'attack') this.renderSlash(ctx, camera);
    if (this.state === 'heavy') this.renderLance(ctx, camera);

    // a corda esticada até a âncora durante a travessia
    if (this.state === 'grapple' && this.grapple) {
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x - camera.x, this.cy - camera.y);
      ctx.lineTo(this.grapple.x - camera.x, this.grapple.y - camera.y - 18);
      ctx.stroke();
    }
  }

  // corte de espada em sprite, girado conforme a direção
  renderSlash(ctx, camera) {
    const spec = LIGHT[this.comboStep];
    const p = Math.min(1, this.stateTime / spec.dur);
    const frames = buildFxFrames().slash;
    const frame = frames[Math.min(4, Math.floor(p * 5))];
    const ang = DIR_ANGLE[this.facing];
    const size = 32 * SCALE * (this.comboStep === 2 ? 1.25 : 1);
    const dist = spec.radius * 0.75;

    ctx.save();
    ctx.translate(this.x - camera.x + Math.cos(ang) * dist, this.cy - camera.y + Math.sin(ang) * dist);
    ctx.rotate(ang + Math.PI / 2 + (this.comboStep % 2 ? Math.PI : 0));
    if (this.furyTime > 0) ctx.filter = 'sepia(1) saturate(4) hue-rotate(-15deg) brightness(1.3)';
    ctx.drawImage(frame, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  // investida da lança em sprite — a aparência muda com o estágio (GDD §2.3)
  renderLance(ctx, camera) {
    const p = Math.min(1, this.stateTime / HEAVY.dur);
    const frames = buildFxFrames().heavy;
    const frame = frames[Math.min(4, Math.floor(p * 5))];
    const ang = DIR_ANGLE[this.facing];
    const ext = Math.sin(p * Math.PI) * this.spear.reach * 0.75;
    const size = 32 * SCALE * 1.15;
    const style = this.spear.style;
    const tx = this.x - camera.x + Math.cos(ang) * ext;
    const ty = this.cy - camera.y + Math.sin(ang) * ext;

    // halo dourado da lança forjada/consagrada
    if (style.glow > 0) {
      const halo = Math.sin(p * Math.PI) * style.glow;
      const g = ctx.createRadialGradient(tx, ty, 4, tx, ty, size * 0.7);
      g.addColorStop(0, `rgba(255, 225, 130, ${0.45 * halo})`);
      g.addColorStop(1, 'rgba(255, 225, 130, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(tx - size * 0.7, ty - size * 0.7, size * 1.4, size * 1.4);
    }

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(ang + Math.PI / 2);
    // tingimento da ponta reforçada/Ascalon (a Fúria já reforça no golpe leve)
    if (style.tint) {
      ctx.filter = this.spear.forged
        ? 'sepia(1) saturate(3) hue-rotate(-12deg) brightness(1.35)'
        : 'brightness(1.15) saturate(0.7)';
    }
    ctx.drawImage(frame, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

// ---------- a zona da paz da Grinalda de Inês (GDD §3.7) ----------
// um círculo de calmaria: enquanto dura, quem está dentro esquece a fúria

class CalmZone {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 220; // cobre todo o gatilho: quem a acionou está dentro dela
    this.life = 5;
    this.t = 0;
    this.dead = false;
  }

  update(dt, world) {
    this.t += dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    for (const e of world.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.x - this.x, e.y - this.y) < this.r) {
        e.stunT = Math.max(e.stunT || 0, 0.35); // aquietado enquanto dentro
      }
    }
    // pétalas à deriva
    if (Math.random() < dt * 16) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * this.r;
      world.fx.spark(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d - 10, '#f0b0c8');
    }
  }

  render(ctx, cam) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const fade = Math.min(1, this.life / 1.2);
    const g = ctx.createRadialGradient(x, y, 20, x, y, this.r);
    g.addColorStop(0, `rgba(240, 176, 200, ${0.16 * fade})`);
    g.addColorStop(1, 'rgba(240, 176, 200, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - this.r, y - this.r, this.r * 2, this.r * 2);
    ctx.save();
    ctx.globalAlpha = (0.4 + 0.2 * Math.sin(this.t * 3)) * fade;
    ctx.strokeStyle = '#f0b0c8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, this.r * (0.94 + 0.06 * Math.sin(this.t * 2)), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
