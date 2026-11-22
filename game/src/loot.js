// loot.js — Barang curian: koin (mata uang tool) dan artefak bernilai.
// Setiap artefak punya nilai, warna ikon, dan label — loot mahal diletakkan di
// tempat berisiko (di dalam cone / dekat guard) sebagai trade-off.
export const LOOT_INFO = {
  coin: { name: 'Koin Emas', value: 1, coin: true, color: '#E8B84B' },
  wayang: { name: 'Wayang Kulit', value: 150, color: '#E8B84B' },
  guci: { name: 'Guci Majapahit', value: 200, color: '#E8B84B' },
  topeng: { name: 'Topeng Barong', value: 250, color: '#E8B84B' },
  gamelan: { name: 'Gamelan Mini', value: 120, color: '#E8B84B' },
  kerisnaga: { name: 'Keris Naga', value: 300, color: '#E8B84B' },
  kerispusaka: { name: 'Keris Pusaka', value: 500, color: '#FFD76A', target: true },
};

/** Jarak ambil: artefak di atas pedestal (Ruang Pusaka) bisa diambil dari tepinya. */
export function pickupRadius(item) {
  return item.kind === 'kerispusaka' ? 86 : 30;
}

export function createLoot(room) {
  return room.loot.map((spot) => ({
    x: spot.x, y: spot.y, kind: spot.kind, taken: false, sparkle: 0,
  }));
}

/** Ambil semua loot dalam jangkauan; kembalikan daftar yang baru diambil. */
export function collectLoot(loot, px, py) {
  const got = [];
  for (const item of loot) {
    if (item.taken) continue;
    const dx = item.x - px, dy = item.y - py;
    if (dx * dx + dy * dy < pickupRadius(item) * pickupRadius(item)) {
      item.taken = true;
      item.sparkle = 1;
      got.push(item);
    }
  }
  return got;
}

export function lootValue(items) {
  return items.reduce((sum, item) => sum + LOOT_INFO[item.kind].value, 0);
}

export function hasTarget(collected) {
  return collected.some((item) => item.kind === 'kerispusaka');
}
