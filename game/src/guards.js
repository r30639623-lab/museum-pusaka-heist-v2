// guards.js — Satpam museum: patroli, curiga, kejar, kembali.
// Cone penglihatan (jarak + sudut) hanya "melihat" bila garis pandang tidak
// terhalang dinding/cover. Deteksi mengisi pelan (see 0..1): curiga di 0,35,
// kejar di 1,0. Sneak memperlambat pengisian; asap mematikan deteksi.
import { FLOOR } from './rooms.js';

export const GUARD_RANGE = 175;
export const GUARD_HALF_ANGLE = 0.62; // ~35 derajat
export const STATE_PATROL = 'patrol';
export const STATE_SUSPICIOUS = 'curiga';
export const STATE_CHASE = 'kejar';
export const STATE_RETURN = 'kembali';

export function createGuards(room) {
  return room.guards.map((def, i) => ({
    id: i,
    path: def.path,
    speed: def.speed,
    x: def.path[0][0],
    y: def.path[0][1],
    waypoint: 1 % def.path.length,
    dir: 0,
    state: STATE_PATROL,
    see: 0,
    lastSeen: null,
    investigate: null,
    lookTimer: 0,
    returnTo: 0,
    bob: Math.random() * 6.28,
  }));
}

/** Sudut hadap guard saat ini (dari gerakan / arah investigasi). */
export function guardAngle(guard) {
  return guard.dir;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Apakah titik (x,y) berada di dalam cone guard (tanpa cek halangan). */
export function inGuardCone(guard, x, y) {
  const dx = x - guard.x, dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_RANGE) return false;
  if (dist < 14) return true;
  return Math.abs(angleDiff(Math.atan2(dy, dx), guard.dir)) < GUARD_HALF_ANGLE;
}

/** Segmen (x1,y1)-(x2,y2) memotong rect? (tes garis pandang). */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  // Ujung di dalam rect.
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx, t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy, t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function lineBlocked(x1, y1, x2, y2, solids) {
  for (const r of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

/** Guard benar-benar melihat pemain? Cone + garis pandang + tidak dalam asap. */
export function guardSeesPlayer(guard, px, py, solids, hiddenInSmoke) {
  if (hiddenInSmoke) return false;
  if (!inGuardCone(guard, px, py)) return false;
  return !lineBlocked(guard.x, guard.y, px, py, solids);
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x, dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.dir = Math.atan2(dy, dx);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.bob += dt * 9;
  return dist - step < 2;
}

/**
 * Satu langkah AI guard. Mengembalikan { seeing, touched } untuk frame ini.
 * seeing: guard sedang melihat pemain (alarm naik). touched: guard menyentuh pemain.
 */
export function updateGuard(guard, dt, player, solids) {
  const seeing = guardSeesPlayer(guard, player.x, player.y, solids, player.inSmoke);
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);

  if (seeing) {
    const closeness = 1.7 - Math.min(1, dist / GUARD_RANGE);
    guard.see = Math.min(1, guard.see + dt * closeness * (player.sneaking ? 0.45 : 1));
    guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.see = Math.max(0, guard.see - dt * 0.35);
  }

  if (guard.state === STATE_CHASE) {
    if (guard.see <= 0.05 && !seeing) {
      guard.state = STATE_SUSPICIOUS;
      guard.investigate = guard.lastSeen ? { ...guard.lastSeen } : { x: guard.x, y: guard.y };
      guard.lookTimer = 0;
    } else {
      moveToward(guard, player.x, player.y, 138, dt);
    }
  } else if (guard.state === STATE_SUSPICIOUS) {
    if (guard.see >= 1) {
      guard.state = STATE_CHASE;
    } else if (guard.investigate) {
      const arrived = moveToward(guard, guard.investigate.x, guard.investigate.y, 88, dt);
      if (arrived) {
        guard.lookTimer += dt;
        guard.dir += dt * 1.6; // menoleh ke sekeliling
        if (guard.lookTimer > 2.2) {
          guard.state = STATE_RETURN;
          guard.investigate = null;
        }
      }
    } else {
      guard.state = STATE_RETURN;
    }
  } else if (guard.state === STATE_RETURN) {
    const target = guard.path[guard.returnTo];
    const arrived = moveToward(guard, target[0], target[1], 80, dt);
    if (arrived) {
      guard.waypoint = (guard.returnTo + 1) % guard.path.length;
      guard.state = STATE_PATROL;
    }
  } else {
    // PATROL
    if (guard.see >= 1) {
      guard.state = STATE_CHASE;
    } else if (guard.see > 0.35) {
      guard.state = STATE_SUSPICIOUS;
      guard.investigate = guard.lastSeen ? { ...guard.lastSeen } : { x: player.x, y: player.y };
      guard.lookTimer = 0;
    } else {
      const target = guard.path[guard.waypoint];
      const arrived = moveToward(guard, target[0], target[1], guard.speed, dt);
      if (arrived) guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    }
  }

  // Jaga guard tetap di lantai.
  guard.x = Math.max(FLOOR.x + 14, Math.min(FLOOR.x + FLOOR.w - 14, guard.x));
  guard.y = Math.max(FLOOR.y + 14, Math.min(FLOOR.y + FLOOR.h - 14, guard.y));

  return { seeing, touched: dist < 24 && guard.state === STATE_CHASE };
}

/** Panggil Batu: guard terdekat dari titik lemparan pergi menyelidiki titik itu. */
export function distractGuard(guards, x, y) {
  let best = null, bestDist = 450;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) { bestDist = d; best = g; }
  }
  if (!best) return false;
  best.state = STATE_SUSPICIOUS;
  best.investigate = { x, y };
  best.lookTimer = 0;
  best.see = Math.max(0, best.see - 0.5);
  return true;
}
