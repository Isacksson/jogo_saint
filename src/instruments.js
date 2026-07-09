// Instrumentos das Fossas — as ferramentas emprestadas pelos santos (GDD §3.7).
//
// Cada bênção traz, além do milagre e do fragmento de Ascalon, o objeto físico
// do santo: uma corda, um espelho, um sino... A posse é DERIVADA dos milagres
// (flags.milagres), como a patente do Anjo — nada novo para salvar, e saves
// antigos recebem os instrumentos retroativamente. Cada capítulo do Bloco C
// implementa a mecânica do seu instrumento; aqui fica só o registro.

export const INSTRUMENTS = [
  { id: 'cirio',    saint: 'Santa Bárbara', name: 'Círio de Bárbara',    miracle: 'raio' },
  { id: 'corda',    saint: 'São Sebastião', name: 'Corda de Sebastião',  miracle: 'setas' },
  { id: 'espelho',  saint: 'Santa Luzia',   name: 'Espelho de Luzia',    miracle: 'luz' },
  { id: 'cajado',   saint: 'Santo Antão',   name: 'Cajado de Antão',     miracle: 'jejum' },
  { id: 'balanca',  saint: 'São Lourenço',  name: 'Balança de Lourenço', miracle: 'fogo' },
  { id: 'grinalda', saint: 'Santa Inês',    name: 'Grinalda de Inês',    miracle: 'cordeiro' },
  { id: 'sino',     saint: 'São Bento',     name: 'Sino de Bento',       miracle: 'vade' },
];

export const INSTRUMENT_TOTAL = INSTRUMENTS.length;

// milagre concedido → instrumento que vem junto (para anunciar na bênção)
export const MIRACLE_INSTRUMENT = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.miracle, i])
);

export function hasInstrument(flags, id) {
  const inst = INSTRUMENTS.find((i) => i.id === id);
  return !!(inst && flags.milagres?.[inst.miracle]);
}

export function instrumentCount(flags) {
  return INSTRUMENTS.reduce((n, i) => n + (flags.milagres?.[i.miracle] ? 1 : 0), 0);
}
