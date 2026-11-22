// render.js — Semua gambar canvas: lantai museum malam, kolam cahaya lampu,
// etalase/peti/pilar, cone penglihatan, sprite guard/kamera/pencuri, loot
// bercahaya, asap, dan HUD (alarm tebal, loot, timer, kartu tool).
import { FLOOR, EXIT_W, EXIT_H } from './rooms.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE, STATE_CHASE, STATE_SUSPICIOUS } from './guards.js';
import { CAMERA_HALF_ANGLE } from './cameras.js';
import { LOOT_INFO } from './loot.js';
import { alarmColor } from './alarm.js';
import { TOOLS } from './thief.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

const GOLD = '#E8B84B';
const RED = '#E5484D';
const CONE_YELLOW = '#F5C542';
const GREEN = '#2E7D5B';
const NAVY = '#0E1626';

export function createRenderer(canvas) {
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d');
  return { ctx, draw(state, screen) { drawScene(ctx, state, screen); } };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, state) {
  const f = FLOOR;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Lantai marmer gelap + ubin.
  ctx.fillStyle = '#16233A';
  ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.strokeStyle = 'rgba(232,184,75,0.07)';
  ctx.lineWidth = 1;
  for (let x = f.x + 61; x < f.x + f.w; x += 61) {
    ctx.beginPath(); ctx.moveTo(x, f.y); ctx.lineTo(x, f.y + f.h); ctx.stroke();
  }
  for (let y = f.y + 58; y < f.y + f.h; y += 58) {
    ctx.beginPath(); ctx.moveTo(f.x, y); ctx.lineTo(f.x + f.w, y); ctx.stroke();
  }
  // Kolam cahaya lampu hangat.
  const lamps = [[260, 220], [640, 220], [1020, 220], [260, 640], [640, 640], [1020, 640], [640, 430]];
  for (const [lx, ly] of lamps) {
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 190);
    g.addColorStop(0, 'rgba(232,184,75,0.13)');
    g.addColorStop(1, 'rgba(232,184,75,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 190, ly - 190, 380, 380);
  }
  // Bayangan aman di sudut (zona gelap tempat bersembunyi).
  ctx.fillStyle = 'rgba(46,125,91,0.10)';
  ctx.fillRect(f.x, f.y + f.h - 120, 200, 120);
  ctx.fillRect(f.x + f.w - 200, f.y, 200, 120);
  // Dinding luar.
  ctx.strokeStyle = '#3A4A66';
  ctx.lineWidth = 6;
  ctx.strokeRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6);
}

function drawCover(ctx, room) {
  for (const c of room.cover) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#1B2A44';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 1.5, c.y + 1.5, c.w - 3, c.h - 3);
      // Kilau kaca.
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath();
      ctx.moveTo(c.x + 8, c.y + c.h - 6);
      ctx.lineTo(c.x + c.w * 0.45, c.y + 6);
      ctx.lineTo(c.x + c.w * 0.65, c.y + 6);
      ctx.lineTo(c.x + 28, c.y + c.h - 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(232,184,75,0.25)';
      ctx.fillRect(c.x + c.w / 2 - 14, c.y + c.h / 2 - 4, 28, 8);
    } else if (c.kind === 'crate') {
      ctx.fillStyle = '#6B4A26';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#8A6238';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(c.x, c.y + c.h - 10, c.w, 10);
    } else if (c.kind === 'pillar') {
      ctx.fillStyle = '#2A3A58';
      ctx.fillRect(c.x - 4, c.y - 4, c.w + 8, c.h + 8);
      ctx.fillStyle = '#46587C';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5C7194';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 7, 0, Math.PI * 2); ctx.fill();
    } else if (c.kind === 'pedestal') {
      ctx.fillStyle = '#241C10';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 1.5, c.y + 1.5, c.w - 3, c.h - 3);
      ctx.fillStyle = 'rgba(232,184,75,0.18)';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, 10);
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KERIS PUSAKA', c.x + c.w / 2, c.y + c.h + 18);
    }
  }
  for (const w of room.walls) {
    ctx.fillStyle = '#2A3A58';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#46587C';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
}

function drawExit(ctx, room, hasTarget, isLast) {
  const e = room.exit;
  const open = !isLast || hasTarget;
  ctx.fillStyle = open ? '#1E5C46' : '#3A2A1A';
  ctx.fillRect(e.x, e.y, EXIT_W, EXIT_H);
  ctx.strokeStyle = open ? GREEN : '#8A6D3B';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 1.5, e.y + 1.5, EXIT_W - 3, EXIT_H - 3);
  ctx.fillStyle = open ? '#7ED3A8' : GOLD;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(e.x + EXIT_W / 2, e.y + EXIT_H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText(isLast ? 'KABUR' : 'KELUAR', 0, 5);
  ctx.restore();
  // Panah pintu.
  ctx.fillStyle = 'rgba(126,211,168,0.8)';
  ctx.beginPath();
  ctx.moveTo(e.x - 26, e.y + EXIT_H / 2);
  ctx.lineTo(e.x - 10, e.y + EXIT_H / 2 - 8);
  ctx.lineTo(e.x - 10, e.y + EXIT_H / 2 + 8);
  ctx.closePath(); ctx.fill();
}

function drawCone(ctx, x, y, angle, range, halfAngle, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 8, x, y, range);
  g.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, '0'));
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = color + '55';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

function drawLootIcon(ctx, kind, x, y, scale, glow) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (glow > 0) {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    g.addColorStop(0, `rgba(232,184,75,${0.5 * glow})`);
    g.addColorStop(1, 'rgba(232,184,75,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = '#8A6D3B';
  ctx.lineWidth = 1.5;
  if (kind === 'coin') {
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8A6D3B';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 0, 4);
  } else if (kind === 'wayang') {
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(7, -4); ctx.lineTo(4, 12); ctx.lineTo(-4, 12); ctx.lineTo(-7, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(0, -20); ctx.lineTo(6, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8A6D3B'; ctx.beginPath(); ctx.arc(0, -6, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'guci') {
    ctx.beginPath();
    ctx.moveTo(-4, -13); ctx.lineTo(4, -13); ctx.lineTo(7, -6);
    ctx.bezierCurveTo(11, 0, 11, 8, 5, 12); ctx.lineTo(-5, 12);
    ctx.bezierCurveTo(-11, 8, -11, 0, -7, -6); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (kind === 'topeng') {
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0E1626';
    ctx.beginPath(); ctx.ellipse(-4, -2, 2.4, 3.4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -2, 2.4, 3.4, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(-13, -16); ctx.moveTo(9, -10); ctx.lineTo(13, -16); ctx.stroke();
  } else if (kind === 'gamelan') {
    ctx.beginPath(); ctx.arc(0, -2, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8A6D3B'; ctx.beginPath(); ctx.arc(0, -2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(11, 8); ctx.stroke();
  } else if (kind === 'kerisnaga' || kind === 'kerispusaka') {
    const big = kind === 'kerispusaka';
    ctx.rotate(-0.7);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(6, -8, 1, 0); ctx.quadraticCurveTo(6, 8, 0, 14);
    ctx.quadraticCurveTo(-5, 6, -1, 0); ctx.quadraticCurveTo(-6, -8, 0, -18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5C3A1A';
    ctx.fillRect(-2.5, 12, 5, 7);
    if (big) {
      ctx.fillStyle = '#FFD76A';
      ctx.beginPath(); ctx.arc(0, -21, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const pulse = 0.55 + 0.45 * Math.sin(time * 3 + item.x * 0.13);
    const scale = item.kind === 'kerispusaka' ? 1.7 : 1.25;
    drawLootIcon(ctx, item.kind, item.x, item.y + Math.sin(time * 2 + item.y) * 2, scale, pulse);
    if (item.kind !== 'coin') {
      ctx.fillStyle = 'rgba(232,184,75,0.9)';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(LOOT_INFO[item.kind].name.toUpperCase(), item.x, item.y + 30);
    }
  }
}

function drawGuard(ctx, g, time) {
  const chasing = g.state === STATE_CHASE;
  const suspicious = g.state === STATE_SUSPICIOUS;
  const color = chasing ? RED : suspicious ? CONE_YELLOW : CONE_YELLOW;
  const alpha = chasing ? 0.5 : suspicious ? 0.42 : 0.30;
  drawCone(ctx, g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF_ANGLE, color, alpha);
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y + 12, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Badan navy + kepala.
  const bobY = Math.sin(g.bob) * 1.5;
  ctx.fillStyle = '#2B3A55';
  ctx.beginPath(); ctx.arc(g.x, g.y + bobY, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5C7194'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(g.x, g.y + bobY, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#C9A06A';
  ctx.beginPath(); ctx.arc(g.x, g.y + bobY - 4, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1B2A44';
  ctx.beginPath(); ctx.arc(g.x, g.y + bobY - 6, 6.5, Math.PI, 0); ctx.fill();
  // Arah hadap.
  ctx.strokeStyle = '#E8EDF5'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(g.x + Math.cos(g.dir) * 10, g.y + bobY + Math.sin(g.dir) * 10);
  ctx.lineTo(g.x + Math.cos(g.dir) * 20, g.y + bobY + Math.sin(g.dir) * 20);
  ctx.stroke();
  // Tanda seru / tanya.
  if (chasing || suspicious) {
    ctx.fillStyle = chasing ? RED : CONE_YELLOW;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(chasing ? '!' : '?', g.x, g.y + bobY - 22);
  }
}

function drawCamera(ctx, cam) {
  if (cam.jammed > 0) {
    ctx.fillStyle = 'rgba(120,120,120,0.25)';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2); ctx.fill();
  } else {
    drawCone(ctx, cam.x, cam.y, cam.angle, cam.range, CAMERA_HALF_ANGLE, RED, 0.30);
  }
  ctx.fillStyle = '#1B2A44';
  ctx.fillRect(cam.x - 9, cam.y - 7, 18, 14);
  ctx.strokeStyle = cam.jammed > 0 ? '#777' : RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(cam.x - 9, cam.y - 7, 18, 14);
  ctx.fillStyle = cam.jammed > 0 ? '#777' : RED;
  ctx.beginPath(); ctx.arc(cam.x, cam.y, 3.5, 0, Math.PI * 2); ctx.fill();
  if (cam.jammed > 0) {
    ctx.fillStyle = '#DDD';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`JAM ${Math.ceil(cam.jammed)}s`, cam.x, cam.y + 24);
  }
}

function drawThief(ctx, thief, time) {
  const bobY = thief.moving ? Math.sin(thief.bob) * 2 : Math.sin(time * 2) * 0.8;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(thief.x, thief.y + 13, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Jubah hijau gelap + tudung.
  ctx.fillStyle = thief.sneaking ? '#14402F' : '#1E5C46';
  ctx.beginPath(); ctx.arc(thief.x, thief.y + bobY, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(thief.x, thief.y + bobY, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#14402F';
  ctx.beginPath();
  ctx.moveTo(thief.x - 8, thief.y + bobY - 4);
  ctx.quadraticCurveTo(thief.x, thief.y + bobY - 20, thief.x + 8, thief.y + bobY - 4);
  ctx.quadraticCurveTo(thief.x, thief.y + bobY + 2, thief.x - 8, thief.y + bobY - 4);
  ctx.fill();
  ctx.fillStyle = '#E8D9B0';
  ctx.beginPath(); ctx.arc(thief.x, thief.y + bobY - 5, 4.5, 0, Math.PI * 2); ctx.fill();
  // Arah hadap.
  ctx.strokeStyle = '#E8EDF5'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thief.x + Math.cos(thief.dir) * 8, thief.y + bobY + Math.sin(thief.dir) * 8);
  ctx.lineTo(thief.x + Math.cos(thief.dir) * 16, thief.y + bobY + Math.sin(thief.dir) * 16);
  ctx.stroke();
  if (thief.sneaking) {
    ctx.fillStyle = '#7ED3A8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', thief.x, thief.y + bobY - 24);
  }
}

function drawSmoke(ctx, thief) {
  if (thief.smoke <= 0) return;
  const alpha = Math.min(0.5, thief.smoke * 0.2);
  const g = ctx.createRadialGradient(thief.smokeX, thief.smokeY, 5, thief.smokeX, thief.smokeY, 70);
  g.addColorStop(0, `rgba(200,200,210,${alpha})`);
  g.addColorStop(1, 'rgba(200,200,210,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(thief.smokeX, thief.smokeY, 70, 0, Math.PI * 2); ctx.fill();
}

function drawStoneFx(ctx, thief) {
  if (!thief.stoneFx) return;
  const f = thief.stoneFx;
  ctx.strokeStyle = `rgba(245,197,66,${f.t})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(f.x, f.y, (0.9 - f.t) * 40 + 6, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#F5C542';
  ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, Math.PI * 2); ctx.fill();
}

function formatTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function drawHUD(ctx, state) {
  const alarm = state.alarm;
  // Bar atas.
  ctx.fillStyle = 'rgba(10,16,30,0.92)';
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = 'rgba(232,184,75,0.25)';
  ctx.fillRect(0, 64, VIEW_W, 2);
  // Kiri: ruangan + objektif.
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 21px system-ui, sans-serif';
  ctx.fillText(`RUANG ${state.roomIndex + 1}/${state.rooms.length} — ${state.room.name}`, 18, 26);
  ctx.fillStyle = '#C7D2E4';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(state.room.objective, 18, 49);
  // Tengah: alarm.
  const ax = 470, ay = 16, aw = 340, ah = 26;
  ctx.fillStyle = '#C7D2E4';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('ALARM', ax - 62, ay + 19);
  const pulse = alarm.value >= 75 ? 0.6 + 0.4 * Math.sin(state.time * 8) : 1;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#0A1424';
  roundRect(ctx, ax, ay, aw, ah, 6); ctx.fill();
  ctx.fillStyle = alarmColor(alarm.value);
  if (alarm.value > 0) {
    roundRect(ctx, ax + 2, ay + 2, Math.max(8, (aw - 4) * alarm.value / 100), ah - 4, 5); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#46587C'; ctx.lineWidth = 2;
  roundRect(ctx, ax, ay, aw, ah, 6); ctx.stroke();
  ctx.fillStyle = alarm.value >= 75 ? RED : '#E8EDF5';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(alarm.value)}`, ax + aw + 10, ay + 21);
  // Kanan: loot + timer.
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(880, 30, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8A6D3B';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', 880, 34);
  ctx.fillStyle = '#E8EDF5';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${state.lootValueTotal}`, 898, 39);
  ctx.fillStyle = '#C7D2E4';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(formatTime(state.time), 898, 58);
  // Kartu tool.
  let tx = 1010;
  for (const tool of TOOLS) {
    const afford = state.thief.coins >= tool.cost;
    ctx.fillStyle = afford ? 'rgba(46,125,91,0.25)' : 'rgba(120,120,120,0.18)';
    roundRect(ctx, tx, 8, 82, 48, 7); ctx.fill();
    ctx.strokeStyle = afford ? GREEN : '#555';
    ctx.lineWidth = 1.5;
    roundRect(ctx, tx, 8, 82, 48, 7); ctx.stroke();
    ctx.fillStyle = '#E8EDF5';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${tool.key} ${tool.name.toUpperCase()}`, tx + 8, 27);
    ctx.fillStyle = afford ? GOLD : '#999';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`${tool.cost} koin`, tx + 8, 46);
    tx += 88;
  }
}

function drawScene(ctx, state, screen) {
  const time = state.time + state.titleTime;
  drawFloor(ctx, state);
  drawCover(ctx, state.room);
  drawExit(ctx, state.room, state.collected.some((i) => i.kind === 'kerispusaka'), state.roomIndex === state.rooms.length - 1);
  drawLoot(ctx, state.loot, time);
  drawSmoke(ctx, state.thief);
  for (const cam of state.cameras) drawCamera(ctx, cam);
  for (const g of state.guards) drawGuard(ctx, g, time);
  drawStoneFx(ctx, state.thief);
  drawThief(ctx, state.thief, time);
  if (screen === 'play' || screen === 'pause') drawHUD(ctx, state);
  // Banner TERLIHAT!
  if (state.alarm.flash > 0 && screen === 'play') {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.alarm.flash);
    ctx.fillStyle = RED;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TERLIHAT!', VIEW_W / 2, 150);
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Putus garis pandang — sembunyi!', VIEW_W / 2, 182);
    ctx.restore();
  }
  // Pesan singkat.
  if (state.messageTimer > 0 && state.message) {
    ctx.fillStyle = 'rgba(10,16,30,0.85)';
    const w = ctx.measureText(state.message).width + 36;
    roundRect(ctx, VIEW_W / 2 - w / 2, 700, w, 40, 8); ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
    roundRect(ctx, VIEW_W / 2 - w / 2, 700, w, 40, 8); ctx.stroke();
    ctx.fillStyle = '#E8EDF5';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, 726);
  }
}
