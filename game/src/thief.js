// thief.js — Raka si pencuri: gerak WASD/panah, sneak (Shift), tool, dan ambil loot.
// Gerak memakai pemisahan sumbu (x lalu y) supaya menempel dinding terasa mulus.
import { FLOOR, solidRects } from './rooms.js';
import { collectLoot } from './loot.js';

export const WALK_SPEED = 178;
export const SNEAK_SPEED = 96;
export const PLAYER_RADIUS = 13;

export const TOOL_BATU = { key: '1', name: 'Batu', cost: 2, hint: 'Klik / tombol 1' };
export const TOOL_JAMMER = { key: '2', name: 'Jammer', cost: 5, hint: 'Tombol 2' };
export const TOOL_ASAP = { key: '3', name: 'Asap', cost: 4, hint: 'Tombol 3' };
export const TOOLS = [TOOL_BATU, TOOL_JAMMER, TOOL_ASAP];

export function createThief(start) {
  return {
    x: start.x, y: start.y,
    vx: 0, vy: 0,
    dir: 0,
    sneaking: false,
    moving: false,
    bob: 0,
    coins: 0,
    smoke: 0, // detik asap tersisa
    inSmoke: false,
    smokeX: 0, smokeY: 0,
    stoneFx: null, // {x, y, t} efek lemparan batu
  };
}

function hitsSolid(x, y, solids) {
  for (const r of solids) {
    if (x + PLAYER_RADIUS > r.x && x - PLAYER_RADIUS < r.x + r.w &&
        y + PLAYER_RADIUS > r.y && y - PLAYER_RADIUS < r.y + r.h) return true;
  }
  return false;
}

export function moveThief(thief, dx, dy, dt, room) {
  const solids = solidRects(room);
  const speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
  const len = Math.hypot(dx, dy);
  thief.moving = len > 0;
  if (len > 0) {
    const nx = dx / len, ny = dy / len;
    thief.dir = Math.atan2(ny, nx);
    const stepX = nx * speed * dt, stepY = ny * speed * dt;
    const tryX = Math.max(FLOOR.x + PLAYER_RADIUS, Math.min(FLOOR.x + FLOOR.w - PLAYER_RADIUS, thief.x + stepX));
    if (!hitsSolid(tryX, thief.y, solids)) thief.x = tryX;
    const tryY = Math.max(FLOOR.y + PLAYER_RADIUS, Math.min(FLOOR.y + FLOOR.h - PLAYER_RADIUS, thief.y + stepY));
    if (!hitsSolid(thief.x, tryY, solids)) thief.y = tryY;
    thief.bob += dt * (thief.sneaking ? 6 : 11);
  }
  // Asap mengikuti pemain hanya saat dipakai di tempat; awan diam di titik pakai.
  thief.inSmoke = thief.smoke > 0 &&
    Math.hypot(thief.x - thief.smokeX, thief.y - thief.smokeY) < 70;
  if (thief.smoke > 0) thief.smoke -= dt;
  if (thief.stoneFx) {
    thief.stoneFx.t -= dt;
    if (thief.stoneFx.t <= 0) thief.stoneFx = null;
  }
}

/** Ambil loot di sekitar; kembalikan yang baru didapat (koin masuk kantong tool). */
export function pickupThief(thief, loot) {
  const got = collectLoot(loot, thief.x, thief.y);
  for (const item of got) {
    if (item.kind === 'coin') thief.coins += 1;
  }
  return got;
}

/** Pakai tool; kembalikan {ok, reason} — koin adalah mata uangnya. */
export function useTool(thief, tool, target) {
  if (thief.coins < tool.cost) return { ok: false, reason: 'Koin kurang!' };
  thief.coins -= tool.cost;
  if (tool === TOOL_ASAP) {
    thief.smoke = 5;
    thief.smokeX = thief.x;
    thief.smokeY = thief.y;
    thief.inSmoke = true;
  } else if (tool === TOOL_BATU) {
    thief.stoneFx = { x: target.x, y: target.y, t: 0.9 };
  }
  return { ok: true };
}
