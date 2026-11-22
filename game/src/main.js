// main.js — Boot + loop utama + mesin layar (title/play/win/loss/pause) + staging
// ?shot=start|play|win|loss&seed=N untuk screenshot deterministik.
// Loop: fixed step 1/60 dtk, input dibaca tiap frame, renderer menggambar state.
import { createState, stepGame, stepTitle, loadRoom, finishLoss, SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS, SCREEN_PAUSE } from './state.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE } from './input.js';
import { createRenderer } from './render.js';
import { drawTitle, drawWin, drawLoss, drawPause } from './ui.js';
import { createAudio } from './audio.js';
import { inGuardCone, lineBlocked } from './guards.js';
import { solidRects } from './rooms.js';
import { cameraSeesPlayer } from './cameras.js';
import { lootValue } from './loot.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 7;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const renderer = createRenderer(canvas);
let state = createState(seed);

function announce(message) { status.textContent = message; }

/** Titik (x,y) sedang berada di dalam cone guard/kamera yang aktif? */
function dangerAt(st, x, y) {
  const solids = solidRects(st.room);
  for (const g of st.guards) {
    if (inGuardCone(g, x, y) && !lineBlocked(g.x, g.y, x, y, solids)) return true;
  }
  for (const c of st.cameras) {
    if (cameraSeesPlayer(c, x, y, solids, false)) return true;
  }
  return false;
}

/** Autopilot untuk shot play: koin dulu (3), lalu artefak, lalu koin terjauh. */
function autopilot(st) {
  const thief = st.thief;
  let pool = st.loot.filter((i) => !i.taken);
  let target = null;
  if (thief.coins < 3) {
    pool = pool.filter((i) => i.kind === 'coin');
  } else {
    const arts = pool.filter((i) => i.kind !== 'coin');
    if (arts.length) pool = arts;
  }
  if (!pool.length) pool = st.loot.filter((i) => !i.taken);
  if (thief.coins >= 3 && !pool.some((i) => i.kind !== 'coin')) {
    // Artefak habis: ke koin terjauh supaya tetap menyeberang ruangan.
    let best = -1;
    for (const item of pool) {
      const d = Math.hypot(item.x - thief.x, item.y - thief.y);
      if (d > best) { best = d; target = item; }
    }
  } else {
    let best = Infinity;
    for (const item of pool) {
      const d = Math.hypot(item.x - thief.x, item.y - thief.y);
      if (d < best) { best = d; target = item; }
    }
  }
  if (!target) target = { x: st.room.exit.x, y: st.room.exit.y + 38 };
  const dx = target.x - thief.x, dy = target.y - thief.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist, ny = dy / dist;
  // Sedang terlihat: lari menjauhi sumber cone terdekat.
  let seer = null, seerDist = Infinity;
  for (const g of st.guards) {
    if (g.see > 0.05) { const d = Math.hypot(g.x - thief.x, g.y - thief.y); if (d < seerDist) { seerDist = d; seer = g; } }
  }
  for (const c of st.cameras) {
    if (cameraSeesPlayer(c, thief.x, thief.y, solidRects(st.room), false)) { seer = { x: c.x, y: c.y }; seerDist = 0; }
  }
  if (seer) {
    const ax = thief.x - seer.x, ay = thief.y - seer.y;
    const al = Math.hypot(ax, ay) || 1;
    return { dx: ax / al, dy: ay / al, sneak: true, actions: 0, mouse: { x: thief.x, y: thief.y } };
  }
  // Langkah berikut masuk cone? Coba belok tegak lurus, kalau tidak bisa: tunggu.
  const aheadX = thief.x + nx * 46, aheadY = thief.y + ny * 46;
  if (dangerAt(st, aheadX, aheadY)) {
    const px = -ny, py = nx;
    if (!dangerAt(st, thief.x + px * 46, thief.y + py * 46)) return { dx: px, dy: py, sneak: true, actions: 0, mouse: { x: thief.x, y: thief.y } };
    if (!dangerAt(st, thief.x - px * 46, thief.y - py * 46)) return { dx: -px, dy: -py, sneak: true, actions: 0, mouse: { x: thief.x, y: thief.y } };
    return { dx: 0, dy: 0, sneak: true, actions: 0, mouse: { x: thief.x, y: thief.y } };
  }
  const nearGuard = st.guards.some((g) => Math.hypot(g.x - thief.x, g.y - thief.y) < 210);
  return { dx: nx, dy: ny, sneak: nearGuard, actions: 0, mouse: { x: thief.x, y: thief.y } };
}

function stageShot(name) {
  if (name === 'start') {
    state.screen = SCREEN_TITLE;
    for (let i = 0; i < 5 / STEP; i += 1) stepTitle(state, STEP);
    paintShot(SCREEN_TITLE);
    return;
  }
  if (name === 'win') {
    // Menang lewat jalur asli: kumpulkan loot Ruang Pusaka, bawa Keris Pusaka ke pintu.
    loadRoom(state, 2);
    for (const item of state.loot) {
      item.taken = true;
      state.collected.push(item);
    }
    state.lootValueTotal = lootValue(state.collected);
    state.coinsEarned = state.thief.coins;
    state.time = 248;
    state.alarm.peak = 61;
    state.thief.x = state.room.exit.x - 24;
    state.thief.y = state.room.exit.y + 38;
    for (let i = 0; i < 120 && state.screen !== SCREEN_WIN; i += 1) {
      stepGame(state, STEP, { dx: 1, dy: 0, sneak: false, actions: 0, mouse: { x: 0, y: 0 } }, null);
    }
    paintShot(SCREEN_WIN);
    return;
  }
  if (name === 'loss') {
    // Kalah lewat jalur asli: pencuri berdiri di cone kamera dengan alarm 99.
    state.collected.push(...state.loot.slice(0, 2).map((i) => { i.taken = true; return i; }));
    state.lootValueTotal = lootValue(state.collected);
    state.thief.x = 640;
    state.thief.y = 200;
    state.alarm.value = 99;
    state.time = 87;
    state.screen = SCREEN_PLAY;
    for (let i = 0; i < 600 && state.screen !== SCREEN_LOSS; i += 1) {
      stepGame(state, STEP, { dx: 0, dy: 0, sneak: false, actions: 0, mouse: { x: 0, y: 0 } }, null);
    }
    if (state.screen !== SCREEN_LOSS) finishLoss(state, 'Alarm mencapai 100 — seluruh museum terbangun!');
    paintShot(SCREEN_LOSS);
    return;
  }
  // play: autopilot nyata di Galeri; coba durasi panjang dulu, mundur bila tertangkap.
  for (const seconds of [12, 8, 5]) {
    state = createState(seed);
    state.screen = SCREEN_PLAY;
    let caught = false;
    for (let i = 0; i < seconds / STEP; i += 1) {
      stepGame(state, STEP, autopilot(state), null);
      if (state.screen !== SCREEN_PLAY) { caught = true; break; }
    }
    if (!caught) break;
  }
  paintShot(SCREEN_PLAY);
}

function paintShot(screen) {
  let painted = 0;
  function paint() {
    renderer.draw(state, screen);
    drawOverlay(screen);
    painted += 1;
    if (painted < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function drawOverlay(screen) {
  const ctx = renderer.ctx;
  if (screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (screen === SCREEN_WIN) drawWin(ctx, state);
  else if (screen === SCREEN_LOSS) drawLoss(ctx, state);
  else if (screen === SCREEN_PAUSE) drawPause(ctx);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();
  let stepSoundAt = 0;

  function startGame() {
    state = createState(seed);
    state.screen = SCREEN_PLAY;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startDrone();
    announce('Bermain. Curi Keris Pusaka, lalu kabur lewat pintu timur.');
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSS) startGame();
      else if (screen === SCREEN_PAUSE) { screen = SCREEN_PLAY; state.screen = SCREEN_PLAY; }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSE; state.screen = SCREEN_PAUSE; announce('Jeda.'); }
      else if (screen === SCREEN_PAUSE) { screen = SCREEN_PLAY; state.screen = SCREEN_PLAY; }
    }
    // Sisa aksi (tool 1/2/3) diteruskan ke langkah simulasi pertama frame ini.
    let pendingActions = actions & ~(ACTION_CONFIRM | ACTION_PAUSE);
    if (screen === SCREEN_TITLE) {
      while (accumulator >= STEP) { stepTitle(state, STEP); accumulator -= STEP; }
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const dir = input.direction();
        const mouse = input.mouse();
        const acts = pendingActions;
        pendingActions = 0;
        stepGame(state, STEP, { dx: dir.dx, dy: dir.dy, sneak: dir.sneak, actions: acts, mouse }, audio);
        if (state.thief.moving && state.time - stepSoundAt > (state.thief.sneaking ? 0.45 : 0.3)) {
          stepSoundAt = state.time;
          audio.step(state.thief.sneaking);
        }
        if (state.screen !== SCREEN_PLAY) screen = state.screen;
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) break;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(state, screen);
    drawOverlay(screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSE;
      state.screen = SCREEN_PAUSE;
      announce('Jeda.');
    }
  });

  announce('Museum Pusaka: Pencurian Tengah Malam. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

// Hook untuk play-test headless (bukan bagian gameplay).
window.__heist = {
  get state() { return state; },
  createState, stepGame, loadRoom, finishLoss,
  actions: { CONFIRM: ACTION_CONFIRM, PAUSE: ACTION_PAUSE },
};

if (shot) stageShot(shot);
else runGame();
