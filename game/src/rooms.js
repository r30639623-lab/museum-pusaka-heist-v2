// rooms.js — Tiga ruangan museum: dinding, cover, rute patroli, kamera, loot, pintu keluar.
// Satu ruangan = satu lantai yang muat penuh di layar 1280x800 (tanpa kamera geser),
// supaya semua elemen heist terbaca dalam satu frame.
// Koordinat: lantai x 30..1250, y 80..780. HUD menempati y 0..64.
export const FLOOR = { x: 30, y: 80, w: 1220, h: 700 };
export const EXIT_W = 26;
export const EXIT_H = 76;

/** Loot yang bisa dicuri di tiap ruangan. kind menentukan nilai & ikon di loot.js. */
function coin(x, y) { return { x, y, kind: 'coin' }; }

export function buildRooms() {
  return [
    {
      id: 1,
      name: 'GALERI',
      subtitle: 'Ruang pamer utama — etalase kaca di mana-mana',
      objective: 'Curi Wayang Kulit, lalu keluar lewat pintu timur',
      start: { x: 78, y: 700 },
      exit: { x: 1250 - EXIT_W, y: 392 },
      walls: [
        { x: 580, y: 140, w: 26, h: 90 },
        { x: 680, y: 520, w: 26, h: 130 },
      ],
      cover: [
        { x: 200, y: 118, w: 150, h: 66, kind: 'case' },
        { x: 500, y: 118, w: 150, h: 66, kind: 'case' },
        { x: 800, y: 118, w: 150, h: 66, kind: 'case' },
        { x: 420, y: 380, w: 46, h: 46, kind: 'pillar' },
        { x: 820, y: 380, w: 46, h: 46, kind: 'pillar' },
        { x: 150, y: 600, w: 92, h: 92, kind: 'crate' },
        { x: 262, y: 622, w: 70, h: 70, kind: 'crate' },
        { x: 1050, y: 600, w: 92, h: 92, kind: 'crate' },
      ],
      guards: [
        { path: [[380, 250], [920, 250], [920, 660], [380, 660]], speed: 56 },
        { path: [[640, 180], [640, 720]], speed: 62 },
      ],
      cameras: [
        { x: 640, y: 82, baseAngle: Math.PI / 2, sweep: 0.95, speed: 0.55, range: 300 },
      ],
      loot: [
        coin(180, 210), coin(350, 500), coin(700, 700), coin(960, 210),
        coin(1100, 450), coin(500, 660), coin(110, 450), coin(1150, 700),
        { x: 880, y: 215, kind: 'wayang' },
      ],
      targetKind: null,
    },
    {
      id: 2,
      name: 'GUDANG',
      subtitle: 'Gudang penyimpanan — tumpukan peti dan lorong sempit',
      objective: 'Curi Guci & Topeng, lalu keluar lewat pintu timur',
      start: { x: 78, y: 700 },
      exit: { x: 1250 - EXIT_W, y: 392 },
      walls: [
        { x: 400, y: 300, w: 26, h: 180 },
        { x: 880, y: 300, w: 26, h: 120 },
      ],
      cover: [
        { x: 150, y: 150, w: 120, h: 90, kind: 'crate' },
        { x: 300, y: 150, w: 80, h: 80, kind: 'crate' },
        { x: 150, y: 560, w: 120, h: 90, kind: 'crate' },
        { x: 950, y: 150, w: 120, h: 90, kind: 'crate' },
        { x: 1050, y: 560, w: 120, h: 90, kind: 'crate' },
        { x: 700, y: 300, w: 90, h: 90, kind: 'crate' },
        { x: 520, y: 680, w: 90, h: 70, kind: 'crate' },
        { x: 640, y: 400, w: 46, h: 46, kind: 'pillar' },
      ],
      guards: [
        { path: [[200, 280], [620, 280], [620, 660], [200, 660]], speed: 58 },
        { path: [[700, 450], [1150, 450]], speed: 66 },
        { path: [[480, 200], [480, 720]], speed: 52 },
      ],
      cameras: [
        { x: 400, y: 82, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.5, range: 290 },
        { x: 900, y: 778, baseAngle: -Math.PI / 2, sweep: 0.8, speed: 0.65, range: 290 },
      ],
      loot: [
        coin(200, 480), coin(600, 180), coin(760, 660), coin(1150, 300),
        coin(340, 420), coin(960, 500), coin(90, 300), coin(1180, 680),
        { x: 1100, y: 185, kind: 'guci' },
        { x: 185, y: 690, kind: 'topeng' },
      ],
      targetKind: null,
    },
    {
      id: 3,
      name: 'RUANG PUSAKA',
      subtitle: 'Ruang paling dijaga — Keris Pusaka di tengah ruangan',
      objective: 'Curi KERIS PUSAKA, lalu kabur lewat pintu timur!',
      start: { x: 78, y: 700 },
      exit: { x: 1250 - EXIT_W, y: 392 },
      walls: [],
      cover: [
        { x: 590, y: 360, w: 100, h: 80, kind: 'pedestal' },
        { x: 200, y: 140, w: 160, h: 70, kind: 'case' },
        { x: 920, y: 140, w: 160, h: 70, kind: 'case' },
        { x: 200, y: 620, w: 160, h: 70, kind: 'case' },
        { x: 920, y: 620, w: 160, h: 70, kind: 'case' },
        { x: 400, y: 400, w: 46, h: 46, kind: 'pillar' },
        { x: 840, y: 400, w: 46, h: 46, kind: 'pillar' },
      ],
      guards: [
        { path: [[300, 250], [900, 250], [900, 560], [300, 560]], speed: 60 },
        { path: [[700, 180], [700, 320]], speed: 64 },
      ],
      cameras: [
        { x: 640, y: 82, baseAngle: Math.PI / 2, sweep: 1.05, speed: 0.6, range: 340 },
      ],
      loot: [
        coin(180, 400), coin(1100, 400), coin(640, 700), coin(320, 120),
        coin(960, 120), coin(320, 740), coin(960, 740), coin(640, 140),
        { x: 250, y: 235, kind: 'kerisnaga' },
        { x: 1030, y: 235, kind: 'gamelan' },
        { x: 640, y: 400, kind: 'kerispusaka' },
      ],
      targetKind: 'kerispusaka',
    },
  ];
}

/** Semua penghalang padat di ruangan: dinding + cover (menghalangi gerak & pandangan). */
export function solidRects(room) {
  return [...room.walls, ...room.cover];
}
