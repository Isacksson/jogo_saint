// Fragmentos de Ascalon — uma relíquia física por bênção de santo (GDD §2.3).
//
// Cada espírito de santo entrega, além do milagre, um fragmento: um prego, uma
// farpa de grelha, um elo de corrente... São itens de QUEST, não-vendáveis, um
// por bênção, reunidos ao longo do Bloco C e consumidos na forja de Ascalon no
// Mosteiro de Núrsia (fecho do Ato II). Aqui ficam só o registro, a contagem e
// os utilitários; quem os concede é o conteúdo de cada capítulo.

export const FRAGMENTS = [
  { id: 'barbara',   saint: 'Santa Bárbara', relic: 'o Prego do Martírio' },
  { id: 'sebastiao', saint: 'São Sebastião', relic: 'a Farpa da Flecha' },
  { id: 'luzia',     saint: 'Santa Luzia',   relic: 'o Elo da Corrente' },
  { id: 'antao',     saint: 'Santo Antão',   relic: 'a Cruz em Tau de Ferro' },
  { id: 'lourenco',  saint: 'São Lourenço',  relic: 'a Farpa da Grelha' },
  { id: 'ines',      saint: 'Santa Inês',    relic: 'a Lâmina da Inocência' },
  { id: 'bento',     saint: 'São Bento',     relic: 'a Medalha de Ferro' },
];

export const FRAGMENT_TOTAL = FRAGMENTS.length;

// concede um fragmento (chamado pelos santos no Bloco C); false se já possuía
export function grantFragment(world, id) {
  if (!FRAGMENTS.some((f) => f.id === id)) return false;
  world.flags.fragments = world.flags.fragments || {};
  if (world.flags.fragments[id]) return false;
  world.flags.fragments[id] = true;
  return true;
}

export function hasFragment(flags, id) {
  return !!(flags.fragments && flags.fragments[id]);
}

export function fragmentCount(flags) {
  const f = flags.fragments || {};
  return FRAGMENTS.reduce((n, x) => n + (f[x.id] ? 1 : 0), 0);
}

export function hasAllFragments(flags) {
  return fragmentCount(flags) >= FRAGMENT_TOTAL;
}
