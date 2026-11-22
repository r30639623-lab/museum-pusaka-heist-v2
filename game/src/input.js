// input.js — Keyboard + mouse. WASD/panah gerak, Shift sneak, 1/2/3 tool,
// klik = lempar Batu ke titik itu, Esc jeda, Spasi/Enter konfirmasi.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_TOOL_BATU = 4;
export const ACTION_TOOL_JAMMER = 8;
export const ACTION_TOOL_ASAP = 16;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  function keyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (e.key === ' ' || e.key === 'Enter') actions |= ACTION_CONFIRM;
    if (e.key === 'Escape') actions |= ACTION_PAUSE;
    if (e.key === '1') actions |= ACTION_TOOL_BATU;
    if (e.key === '2') actions |= ACTION_TOOL_JAMMER;
    if (e.key === '3') actions |= ACTION_TOOL_ASAP;
  }
  function keyUp(e) {
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  }
  function mouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  }
  function mouseDown(e) {
    mouseMove(e);
    mouse.clicked = true;
    mouse.clickX = mouse.x;
    mouse.clickY = mouse.y;
    actions |= ACTION_TOOL_BATU;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('mousedown', mouseDown);

  return {
    /** Arah gerak -1..1 per sumbu + sneak. */
    direction() {
      let dx = 0, dy = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) dx += 1;
      if (keys.has('w') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) dy += 1;
      return { dx, dy, sneak: keys.has('Shift') };
    },
    mouse() { return mouse; },
    takeActions() {
      const out = actions;
      actions = 0;
      mouse.clicked = false;
      return out;
    },
  };
}
