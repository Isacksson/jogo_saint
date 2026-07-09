// A lança de Jorge — de guarnição a Ascalon consagrada (GDD §2.3).
//
// Por 2/3 do jogo Jorge luta com uma arma MORTAL, não mágica. A lança tem
// estágios visuais e de dano que a história vai destravando:
//
//   guarnição  — arma inicial, comum, sem nome (dano-base do ataque pesado)
//   reforçada  — após os reforços do ferreiro Rufo (denários, incremental)
//   Ascalon    — forjada no Mosteiro de Núrsia com os 7 fragmentos (fecho do Ato II)
//   consagrada — temperada no fogo do Abismo antes da Serpente Antiga (Ato III)
//
// Rufo dá upgrades numéricos (reforços); os santos dão fragmentos; a forja e a
// consagração são marcos de história, não itens de menu. Este módulo só guarda
// o estado e traduz para dano/alcance/aparência — quem os concede é o conteúdo.

export const REINFORCE_MAX = 5; // quantos reforços o ferreiro pode aplicar
export const REINFORCE_DMG = 3; // dano por reforço
const REINFORCE_VISUAL = 3;     // a partir daqui a lança comum PARECE reforçada

// aparência de cada estágio (tingimento e brilho do sprite da investida)
const LOOK = {
  guarnicao:  { name: 'Lança de Guarnição', tint: null,      glow: 0,    spark: '#c8c0a8' },
  reforcada:  { name: 'Lança Reforçada',    tint: '#dfe4ec', glow: 0,    spark: '#e8eef6' },
  ascalon:    { name: 'Ascalon',            tint: '#ffe58a', glow: 0.55, spark: '#ffd873' },
  consagrada: { name: 'Ascalon Consagrada', tint: '#fff4c4', glow: 1,    spark: '#ffe89a' },
};

export class Spear {
  constructor() {
    this.reinforce = 0;       // reforços do ferreiro (0..REINFORCE_MAX)
    this.forged = false;      // Ascalon forjada (Mosteiro de Núrsia)
    this.consecrated = false; // consagrada no Abismo (Ato III)
  }

  // qual das quatro aparências mostrar agora
  get look() {
    if (this.consecrated) return 'consagrada';
    if (this.forged) return 'ascalon';
    return this.reinforce >= REINFORCE_VISUAL ? 'reforcada' : 'guarnicao';
  }

  get style() { return LOOK[this.look]; }

  get name() {
    const base = this.style.name;
    // "+N" só faz sentido na lança comum; a forjada perde os reforços
    return (!this.forged && this.reinforce > 0) ? `${base} +${this.reinforce}` : base;
  }

  get dmg() {
    const base = this.forged ? (this.consecrated ? 60 : 44) : 24;
    return base + this.reinforce * REINFORCE_DMG;
  }

  get reach() {
    return this.forged ? (this.consecrated ? 104 : 96) : 86;
  }

  get canReinforce() { return !this.forged && this.reinforce < REINFORCE_MAX; }

  // reforço do ferreiro Rufo; retorna false se já no limite (ou já forjada)
  reinforceOnce() {
    if (!this.canReinforce) return false;
    this.reinforce++;
    return true;
  }

  // fecho do Ato II: a lança comum é consumida e renasce como Ascalon
  forge() {
    this.forged = true;
    this.reinforce = 0;
  }

  // Ato III: temperada no fogo do próprio Abismo
  consecrate() {
    this.forged = true;
    this.consecrated = true;
  }

  toJSON() {
    return { reinforce: this.reinforce, forged: this.forged, consecrated: this.consecrated };
  }

  static from(data) {
    const s = new Spear();
    if (data) {
      s.reinforce = data.reinforce | 0;
      s.forged = !!data.forged;
      s.consecrated = !!data.consecrated;
    }
    return s;
  }
}
