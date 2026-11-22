[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/r30639623-lab/museum-pusaka-heist-v2/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/r30639623-lab/museum-pusaka-heist-v2/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# Museum Pusaka: Pencurian Tengah Malam — v2

Game heist top-down 2D berbahasa Indonesia. Kamu **Raka**, pencuri yang menyelinap
ke museum di tengah malam untuk mencuri **Keris Pusaka** — lalu kabur sebelum fajar.

Tiga ruangan, masing-masing dengan beberapa rute: **Galeri**, **Gudang**, dan
**Ruang Pusaka**. Satpam berpatroli dengan cone penglihatan kuning yang menyapu,
kamera dinding dengan cone merah yang berputar, dan meter alarm yang naik setiap
kali kamu terlihat. Alarm 100 — atau satpam yang menyentuhmu — berarti tertangkap.

## Cara main

| Kontrol | Aksi |
| --- | --- |
| WASD / Panah | Bergerak |
| Shift | Menyelinap (lebih pelan, lebih sulit terlihat) |
| Klik mouse | Lempar Batu ke titik itu (2 koin — pancing satpam menyelidiki) |
| 1 / 2 / 3 | Batu (2 koin) / Jammer kamera 10 detik (5 koin) / Asap 5 detik (4 koin) |
| Esc | Jeda |
| Spasi | Mulai / coba lagi |

Koin emas yang kamu kumpulkan adalah mata uang tool — loot mahal (Wayang Kulit,
Guci Majapahit, Topeng Barong, Keris Naga) sengaja diletakkan di tempat berisiko,
di dalam cone atau dekat satpam. Saat pertama ketahuan ada masa tenggang 1,5 detik
("TERLIHAT!") untuk memutus garis pandang sebelum alarm melonjak.

Menang: curi Keris Pusaka di Ruang Pusaka, lalu keluar lewat pintu timur.
Rank pencuri (Perak / Emas / Pusaka) dihitung dari total loot, waktu, dan puncak alarm.

## Mainkan

Game statis tanpa build step dan tanpa network:

```sh
node serve.ts
# buka http://localhost:8080
```

Atau buka `game/index.html` lewat server statis apa pun. Semua seni digambar
canvas dan semua suara prosedural WebAudio — tanpa file eksternal.

## Struktur kode

- `game/src/main.js` — loop, mesin layar, staging screenshot `?shot=`
- `game/src/state.js` — state permainan + transisi menang/kalah
- `game/src/rooms.js` — layout 3 ruangan
- `game/src/thief.js` — gerak, sneak, tool, ambil loot
- `game/src/guards.js` — AI satpam (patroli → curiga → kejar → kembali) + cone
- `game/src/cameras.js` — kamera berputar + jammer
- `game/src/loot.js` — loot & nilai artefak
- `game/src/alarm.js` — meter alarm + masa tenggang
- `game/src/audio.js` — suara prosedural WebAudio
- `game/src/render.js` — gambar canvas (lantai, cone, sprite, HUD)
- `game/src/ui.js` — layar judul / menang / kalah / jeda
- `game/src/input.js` — keyboard + mouse

## Lisensi

MIT — lihat [LICENSE](LICENSE).
