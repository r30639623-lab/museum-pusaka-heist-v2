// state.js — Satu tempat kebenaran permainan: ruangan, pencuri, guard, kamera,
// loot, alarm, skor, dan transisi menang/kalah. main.js hanya memanggil step()
// tiap frame dan render.js menggambar state ini.
import { buildRooms, EXIT_W, EXIT_H, solidRects } from './rooms.js';
import { createThief, moveThief, pickupThief, useTool, TOOL_BATU, TOOL_JAMMER, TOOL_ASAP } from './thief.js';
import { createGuards, updateGuard, distractGuard } from './guards.js';
import { createCameras, updateCamera, cameraSeesPlayer, jamNearestCamera } from './cameras.js';
import { createLoot, lootValue, hasTarget, LOOT_INFO } from './loot.js';
import { createAlarm, raiseAlarm, decayAlarm, updateAlarm, ALARM_MAX } from './alarm.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';
export const SCREEN_PAUSE = 'pause';

export function createState(seed) {
  const rooms = buildRooms();
  const state = {
    seed,
    rooms,
    roomIndex: 0,
    screen: SCREEN_TITLE,
    time: 0,
    alarm: createAlarm(),
    collected: [],
    lootValueTotal: 0,
    coinsEarned: 0,
    roomStartTime: 0,
    message: null, // {text, t} pesan singkat di layar (mis. "Koin kurang!")
    messageTimer: 0,
    lossReason: '',
    winStats: null,
    thief: null,
    guards: [],
    cameras: [],
    loot: [],
    room: null,
    titleTime: 0,
  };
  loadRoom(state, 0);
  return state;
}

export function loadRoom(state, index) {
  const room = state.rooms[index];
  state.roomIndex = index;
  state.room = room;
  state.thief = createThief(room.start);
  state.thief.coins = state.coinsEarned; // koin terbawa antar ruangan
  state.guards = createGuards(room);
  state.cameras = createCameras(room);
  state.loot = createLoot(room);
  state.alarm.value = Math.max(0, state.alarm.value - 25); // napas lega di ruangan baru
  state.alarm.spotted = false;
  state.alarm.caught = false;
  state.alarm.grace = 0;
  state.alarm.flash = 0;
  state.roomStartTime = state.time;
}

export function currentObjective(state) {
  return state.room.objective;
}

export function roomProgress(state) {
  return { room: state.roomIndex + 1, total: state.rooms.length };
}

function showMessage(state, text) {
  state.message = text;
  state.messageTimer = 2.2;
}

/** Pindah ruangan (pintu timur) atau menang bila itu Ruang Pusaka + target dibawa. */
function tryExit(state) {
  const thief = state.thief;
  const exit = state.room.exit;
  const inDoor = thief.x + 13 > exit.x && thief.x - 13 < exit.x + EXIT_W &&
    thief.y > exit.y - 6 && thief.y < exit.y + EXIT_H + 6;
  if (!inDoor) return false;
  if (state.roomIndex === state.rooms.length - 1) {
    if (!hasTarget(state.collected)) {
      showMessage(state, 'Keris Pusaka belum dicuri!');
      return false;
    }
    finishWin(state);
    return true;
  }
  loadRoom(state, state.roomIndex + 1);
  showMessage(state, `${state.room.name} — ${state.room.subtitle}`);
  return true;
}

function finishWin(state) {
  state.screen = SCREEN_WIN;
  const loot = state.lootValueTotal;
  const t = state.time;
  const peak = Math.round(state.alarm.peak);
  let rank = 'PERAK';
  if (loot >= 1200 && peak < 55) rank = 'PUSAKA';
  else if (loot >= 800) rank = 'EMAS';
  state.winStats = { loot, time: t, peak, rank, rooms: state.rooms.length };
}

/** Kalah: tertangkap guard / alarm penuh. */
export function finishLoss(state, reason) {
  if (state.screen === SCREEN_LOSS) return;
  state.screen = SCREEN_LOSS;
  state.lossReason = reason;
  state.alarm.value = ALARM_MAX;
}

/**
 * Satu langkah simulasi (dt detik). input: {dx, dy, sneak, actions, mouse}.
 * Mengembalikan event untuk suara: {pickup, artifact, spotted, caught, win, stone, jammer, smoke}.
 */
export function stepGame(state, dt, input, audio) {
  const events = {};
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;

  const thief = state.thief;
  thief.sneaking = input.sneak;
  moveThief(thief, input.dx, input.dy, dt, state.room);

  // Tool.
  const actions = input.actions || 0;
  const mouse = input.mouse || { x: thief.x, y: thief.y };
  if (actions & 4) { // Batu (klik / tombol 1)
    const r = useTool(thief, TOOL_BATU, { x: mouse.clickX ?? mouse.x, y: mouse.clickY ?? mouse.y });
    if (r.ok) {
      events.stone = true;
      distractGuard(state.guards, mouse.clickX ?? mouse.x, mouse.clickY ?? mouse.y);
      if (audio) audio.stone();
    } else showMessage(state, r.reason);
  }
  if (actions & 8) { // Jammer
    const r = useTool(thief, TOOL_JAMMER);
    if (r.ok) {
      events.jammer = true;
      jamNearestCamera(state.cameras, thief.x, thief.y);
      if (audio) audio.jammer();
    } else showMessage(state, r.reason);
  }
  if (actions & 16) { // Asap
    const r = useTool(thief, TOOL_ASAP);
    if (r.ok) {
      events.smoke = true;
      if (audio) audio.smoke();
    } else showMessage(state, r.reason);
  }

  // Loot.
  const got = pickupThief(thief, state.loot);
  if (got.length) {
    state.collected.push(...got);
    state.lootValueTotal = lootValue(state.collected);
    state.coinsEarned = thief.coins;
    const art = got.find((g) => g.kind !== 'coin');
    events.pickup = true;
    if (art) {
      events.artifact = LOOT_INFO[art.kind].name;
      if (audio) audio.artifact();
      if (art.kind === state.room.targetKind) showMessage(state, 'KERIS PUSAKA didapat! Kabur ke pintu timur!');
    } else if (audio) audio.coin();
  }

  // Kamera.
  let seenByCamera = false;
  for (const cam of state.cameras) {
    updateCamera(cam, dt);
    if (cameraSeesPlayer(cam, thief.x, thief.y, solidRects(state.room), thief.inSmoke)) seenByCamera = true;
  }

  // Guard.
  let seenByGuard = false;
  let touched = false;
  for (const g of state.guards) {
    const r = updateGuard(g, dt, thief, solidRects(state.room));
    if (r.seeing) seenByGuard = true;
    if (r.touched) touched = true;
  }

  // Alarm.
  const wasSpotted = state.alarm.spotted;
  if (seenByGuard) raiseAlarm(state.alarm, 11, dt);
  if (seenByCamera) raiseAlarm(state.alarm, 24, dt);
  if (!seenByGuard && !seenByCamera) decayAlarm(state.alarm, 5.5, dt);
  updateAlarm(state.alarm, dt);
  if (!wasSpotted && state.alarm.spotted) {
    events.spotted = true;
    if (audio) audio.spotted();
  }
  if (state.alarm.value >= 70 && Math.floor(state.time * 2) !== Math.floor((state.time - dt) * 2)) {
    if (audio) audio.alarmBeep();
  }

  // Kalah / menang.
  if (touched) {
    finishLoss(state, 'Satpam menangkapmu di tempat!');
    events.caught = true;
    if (audio) audio.caught();
    return events;
  }
  if (state.alarm.caught) {
    finishLoss(state, 'Alarm mencapai 100 — seluruh museum terbangun!');
    events.caught = true;
    if (audio) audio.caught();
    return events;
  }
  if (tryExit(state)) {
    if (state.screen === SCREEN_WIN) {
      events.win = true;
      if (audio) audio.win();
    } else if (audio) audio.roomClear();
  }
  return events;
}

/** Animasi latar judul: patroli berjalan tanpa pemain. */
export function stepTitle(state, dt) {
  state.titleTime += dt;
  const dummy = { x: -9999, y: -9999, sneaking: false, inSmoke: false };
  for (const g of state.guards) updateGuard(g, dt, dummy, solidRects(state.room));
  for (const c of state.cameras) updateCamera(c, dt);
  for (const item of state.loot) item.sparkle = (Math.sin(state.titleTime * 2 + item.x) + 1) / 2;
}
