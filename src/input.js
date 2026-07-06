// Teclado: estado de teclas seguradas e pressionadas neste frame

const held = new Set();
const pressed = new Set();

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyJ: 'attack', KeyZ: 'attack',
  KeyK: 'heavy', KeyX: 'heavy',
  Space: 'dodge', ShiftLeft: 'dodge', ShiftRight: 'dodge',
  KeyL: 'fury', KeyC: 'fury',
  KeyE: 'interact', Enter: 'interact',
};

window.addEventListener('keydown', (e) => {
  const action = KEYMAP[e.code];
  if (!action) return;
  e.preventDefault();
  if (!held.has(action)) pressed.add(action);
  held.add(action);
});

window.addEventListener('keyup', (e) => {
  const action = KEYMAP[e.code];
  if (!action) return;
  held.delete(action);
});

window.addEventListener('blur', () => held.clear());

export const input = {
  isHeld: (action) => held.has(action),
  wasPressed: (action) => pressed.has(action),
  // chamar ao fim de cada frame
  endFrame: () => pressed.clear(),
};
