// alarm.js — Meter alarm 0..100. Naik saat terlihat (guard / kamera / suara),
// turun saat bersembunyi. Momen tertangkap yang adil: saat alarm melewati ambang
// TERLIHAT, ada masa tenggang 1,5 detik (alarm diam, banner "TERLIHAT!") supaya
// pemain bisa memutus garis pandang sebelum lonjakan.
export const ALARM_MAX = 100;
export const GRACE_SECONDS = 1.5;
export const SPOTTED_AT = 60;

export function createAlarm() {
  return {
    value: 0,
    peak: 0,
    grace: 0,
    spotted: false, // sedang dalam episode terlihat
    flash: 0, // timer banner TERLIHAT!
    caught: false,
  };
}

/** Naikkan alarm (dipanggil tiap frame saat pemain terlihat). */
export function raiseAlarm(alarm, amount, dt) {
  if (alarm.grace > 0) return;
  if (!alarm.spotted && alarm.value < SPOTTED_AT && alarm.value + amount * dt >= SPOTTED_AT) {
    // Baru saja ketahuan: masa tenggang + banner, bukan lonjakan langsung.
    alarm.grace = GRACE_SECONDS;
    alarm.flash = GRACE_SECONDS;
    alarm.spotted = true;
  }
  alarm.value = Math.min(ALARM_MAX, alarm.value + amount * dt);
  if (alarm.value > alarm.peak) alarm.peak = alarm.value;
  if (alarm.value >= ALARM_MAX) alarm.caught = true;
}

export function decayAlarm(alarm, amount, dt) {
  alarm.value = Math.max(0, alarm.value - amount * dt);
  if (alarm.value < SPOTTED_AT * 0.5) alarm.spotted = false;
}

export function updateAlarm(alarm, dt) {
  if (alarm.grace > 0) alarm.grace -= dt;
  if (alarm.flash > 0) alarm.flash -= dt;
}

export function alarmColor(value) {
  if (value >= 75) return '#E5484D';
  if (value >= 40) return '#F5C542';
  return '#2E7D5B';
}
