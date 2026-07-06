// Áudio: chiptune generativo e efeitos via Web Audio API (sem assets)

let ac = null;
let muted = false;
let mood = 'peace'; // peace | dark | boss
let nextBeat = 0;
let beatCount = 0;

// escalas modais (frequências): dórico para a superfície, frígio para as trevas
const PEACE_NOTES = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33]; // ré dórico
const DARK_NOTES = [146.83, 155.56, 196.0, 220.0, 246.94];          // ré frígio grave
const BOSS_NOTES = [146.83, 174.61, 220.0, 233.08, 293.66];

export function initAudio() {
  if (ac) return;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    nextBeat = ac.currentTime + 0.1;
  } catch {
    ac = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

export function setMood(m) {
  mood = m;
}

// nota simples com envelope
function tone(freq, start, dur, type = 'square', vol = 0.04, slide = 0) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), start + dur);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// sopro de ruído (percussão / golpes)
function noise(start, dur, vol = 0.05, low = false) {
  const size = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, size, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  if (low) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 320;
    src.connect(f).connect(g).connect(ac.destination);
  } else {
    src.connect(g).connect(ac.destination);
  }
  src.start(start);
}

// chamado a cada frame: agenda os próximos compassos da música
export function updateMusic() {
  if (!ac || muted) return;
  const BEAT = mood === 'boss' ? 0.19 : 0.3;
  while (nextBeat < ac.currentTime + 0.25) {
    const t = nextBeat;
    const b = beatCount;

    if (mood === 'peace') {
      if (b % 4 === 0) tone(73.42, t, 0.55, 'triangle', 0.05); // bordão em ré
      if (b % 2 === 0 && Math.random() < 0.65) {
        tone(PEACE_NOTES[Math.floor(Math.random() * PEACE_NOTES.length)], t, 0.34, 'square', 0.022);
      }
    } else if (mood === 'dark') {
      if (b % 8 === 0) {
        tone(73.42, t, 2.2, 'sawtooth', 0.028);
        tone(74.2, t, 2.2, 'sawtooth', 0.02); // batimento desafinado
      }
      if (b % 8 === 4 && Math.random() < 0.4) {
        tone(DARK_NOTES[Math.floor(Math.random() * DARK_NOTES.length)] * 2, t, 0.5, 'triangle', 0.018);
      }
    } else if (mood === 'boss') {
      tone(BOSS_NOTES[b % BOSS_NOTES.length] * (b % 8 < 4 ? 1 : 1.5), t, 0.16, 'square', 0.026);
      if (b % 4 === 0) tone(73.42, t, 0.3, 'sawtooth', 0.05);
      if (b % 4 === 2) noise(t, 0.08, 0.04);
    }

    nextBeat += BEAT;
    beatCount++;
  }
}

// ---------- efeitos ----------

export function sfx(name) {
  if (!ac || muted) return;
  const t = ac.currentTime;
  switch (name) {
    case 'swing': noise(t, 0.09, 0.04); tone(660, t, 0.06, 'square', 0.015, -300); break;
    case 'heavy': noise(t, 0.14, 0.05, true); tone(220, t, 0.12, 'square', 0.025, -120); break;
    case 'hit': noise(t, 0.07, 0.06, true); tone(180, t, 0.07, 'square', 0.03, -80); break;
    case 'hurt': tone(200, t, 0.18, 'sawtooth', 0.045, -120); break;
    case 'die': noise(t, 0.22, 0.05, true); tone(140, t, 0.3, 'sawtooth', 0.03, -90); break;
    case 'pickup': tone(660, t, 0.07, 'square', 0.03); tone(880, t + 0.07, 0.1, 'square', 0.03); break;
    case 'cast': tone(440, t, 0.1, 'triangle', 0.04); tone(660, t + 0.06, 0.12, 'triangle', 0.04); tone(880, t + 0.12, 0.2, 'triangle', 0.04); break;
    case 'pray': [293.66, 369.99, 440.0].forEach((f, i) => tone(f, t + i * 0.12, 0.7, 'triangle', 0.035)); break;
    case 'level': [440, 554.37, 659.25, 880].forEach((f, i) => tone(f, t + i * 0.09, 0.22, 'square', 0.03)); break;
    case 'fury': tone(110, t, 0.5, 'sawtooth', 0.05, 220); noise(t, 0.3, 0.04, true); break;
    case 'roar': tone(70, t, 0.9, 'sawtooth', 0.07, 40); noise(t, 0.5, 0.06, true); break;
  }
}
