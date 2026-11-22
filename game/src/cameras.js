// cameras.js — Kamera pengawas di dinding: cone merah menyapu bolak-balik.
// Terlihat kamera = alarm naik cepat. Jammer menonaktifkan kamera terdekat 10 detik.
import { lineBlocked } from './guards.js';

export const CAMERA_HALF_ANGLE = 0.5; // ~28 derajat

export function createCameras(room) {
  return room.cameras.map((def, i) => ({
    id: i,
    x: def.x, y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    phase: 0,
    angle: def.baseAngle,
    jammed: 0, // detik tersisa nonaktif
  }));
}

export function updateCamera(camera, dt) {
  camera.phase += dt * camera.speed;
  camera.angle = camera.baseAngle + Math.sin(camera.phase) * camera.sweep;
  if (camera.jammed > 0) camera.jammed -= dt;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Kamera sedang melihat pemain? (cone + garis pandang, tidak saat di-jammer / asap). */
export function cameraSeesPlayer(camera, px, py, solids, hiddenInSmoke) {
  if (camera.jammed > 0 || hiddenInSmoke) return false;
  const dx = px - camera.x, dy = py - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > camera.range) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), camera.angle)) > CAMERA_HALF_ANGLE) return false;
  return !lineBlocked(camera.x, camera.y, px, py, solids);
}

/** Nonaktifkan kamera terdekat dari pemain selama 10 detik. */
export function jamNearestCamera(cameras, px, py) {
  let best = null, bestDist = Infinity;
  for (const c of cameras) {
    const d = Math.hypot(c.x - px, c.y - py);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  if (!best) return false;
  best.jammed = 10;
  return true;
}
