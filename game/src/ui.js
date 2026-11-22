// ui.js — Layar-layar game: judul, menang, kalah, jeda. Digambar di atas canvas
// dengan palet yang sama (navy, emas, merah) supaya semua layar terasa satu game.
import { VIEW_W, VIEW_H } from './render.js';
import { LOOT_INFO, lootValue } from './loot.js';

const GOLD = '#E8B84B';
const RED = '#E5484D';
const NAVY = '#0E1626';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,16,30,0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.stroke();
}

function bigButton(ctx, label, x, y, w, h, pulse) {
  ctx.fillStyle = pulse ? '#F0C45C' : GOLD;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 9);
}

export function drawTitle(ctx, state) {
  // Gelapkan ruangan di belakang.
  ctx.fillStyle = 'rgba(8,12,24,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('M U S E U M   P U S A K A', VIEW_W / 2, 148);
  ctx.fillStyle = '#E8EDF5';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('PENCURIAN', VIEW_W / 2, 214);
  ctx.fillText('TENGAH MALAM', VIEW_W / 2, 282);
  ctx.fillStyle = '#C7D2E4';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Curi Keris Pusaka dari museum paling dijaga — lalu kabur sebelum fajar.', VIEW_W / 2, 322);
  bigButton(ctx, '▶  MULAI MENCURI', VIEW_W / 2 - 170, 360, 340, 60, Math.sin(state.titleTime * 4) > 0);
  panel(ctx, VIEW_W / 2 - 390, 450, 780, 210);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('CARA MAIN', VIEW_W / 2, 480);
  ctx.fillStyle = '#E8EDF5';
  ctx.font = '16px system-ui, sans-serif';
  const lines = [
    'WASD / Panah — bergerak      SHIFT — menyelinap (pelan, sulit terlihat)',
    'Klik — lempar Batu (2 koin)      2 — Jammer kamera (5 koin)      3 — Asap (4 koin)',
    'ESC — jeda      Alarm 100 = tertangkap!',
    'Hindari cone kuning satpam & cone merah kamera.',
    'Curi artefak, kumpulkan koin, lalu kabur lewat pintu timur.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 512 + i * 26));
  ctx.fillStyle = '#8A97AD';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('3 ruangan  •  6 artefak pusaka  •  v2', VIEW_W / 2, 700);
}

function formatTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function drawWin(ctx, state) {
  ctx.fillStyle = 'rgba(8,12,24,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const s = state.winStats;
  panel(ctx, VIEW_W / 2 - 360, 110, 720, 560);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText('PELARIAN BERHASIL!', VIEW_W / 2, 180);
  ctx.fillStyle = '#E8EDF5';
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Keris Pusaka sudah di tanganmu. Fajar menyingsing — kamu sudah jauh.', VIEW_W / 2, 216);
  // Lencana rank.
  ctx.fillStyle = s.rank === 'PUSAKA' ? GOLD : s.rank === 'EMAS' ? '#D8A93B' : '#C0C8D8';
  ctx.beginPath(); ctx.arc(VIEW_W / 2, 300, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(s.rank, VIEW_W / 2, 307);
  ctx.fillStyle = '#E8EDF5';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('RANK PENCURI', VIEW_W / 2, 380);
  // Breakdown loot.
  ctx.textAlign = 'left';
  ctx.font = '17px system-ui, sans-serif';
  let y = 420;
  const counts = {};
  for (const item of state.collected) counts[item.kind] = (counts[item.kind] || 0) + 1;
  for (const [kind, n] of Object.entries(counts)) {
    const info = LOOT_INFO[kind];
    ctx.fillStyle = '#C7D2E4';
    ctx.fillText(`${info.name}  × ${n}`, VIEW_W / 2 - 220, y);
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'right';
    ctx.fillText(`${info.value * n}`, VIEW_W / 2 + 220, y);
    ctx.textAlign = 'left';
    y += 28;
  }
  ctx.strokeStyle = 'rgba(232,184,75,0.4)';
  ctx.beginPath(); ctx.moveTo(VIEW_W / 2 - 220, y + 2); ctx.lineTo(VIEW_W / 2 + 220, y + 2); ctx.stroke();
  y += 30;
  ctx.fillStyle = '#E8EDF5';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('TOTAL LOOT', VIEW_W / 2 - 220, y);
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'right';
  ctx.fillText(`${s.loot}`, VIEW_W / 2 + 220, y);
  ctx.textAlign = 'left';
  y += 32;
  ctx.fillStyle = '#C7D2E4';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(`Waktu  ${formatTime(s.time)}      Puncak alarm  ${s.peak}`, VIEW_W / 2 - 220, y);
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Tekan SPASI untuk main lagi', VIEW_W / 2, 640);
}

export function drawLoss(ctx, state) {
  ctx.fillStyle = 'rgba(30,8,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, VIEW_W / 2 - 360, 150, 720, 440);
  ctx.textAlign = 'center';
  ctx.fillStyle = RED;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('TERTANGKAP!', VIEW_W / 2, 230);
  ctx.fillStyle = '#E8EDF5';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(state.lossReason, VIEW_W / 2, 272);
  ctx.fillStyle = '#C7D2E4';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`Loot yang sempat dibawa: ${state.lootValueTotal}  •  Waktu: ${formatTime(state.time)}`, VIEW_W / 2, 330);
  ctx.fillStyle = GOLD;
  ctx.font = '17px system-ui, sans-serif';
  const tips = [
    'Tips: tunggu cone menyapu pergi sebelum menyeberang,',
    'gunakan Batu untuk memancing satpam menjauh, dan Asap saat terjepit.',
  ];
  tips.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 400 + i * 28));
  bigButton(ctx, 'COBA LAGI  (SPASI)', VIEW_W / 2 - 170, 470, 340, 58, Math.sin(state.time * 4) > 0);
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(8,12,24,0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#E8EDF5';
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.fillText('JEDA', VIEW_W / 2, 360);
  ctx.fillStyle = '#C7D2E4';
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Tekan ESC untuk lanjut mencuri', VIEW_W / 2, 410);
}
