// audio.js — Semua suara prosedural WebAudio (tanpa file audio):
// langkah kaki, koin, alarm, ambil artefak, jingle menang/kalah, drone malam.
// AudioContext dibuat malas dan aman bila browser memblokir autoplay.
export function createAudio() {
  let ctx = null;
  let drone = null;
  let enabled = true;

  function context() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    const c = context();
    if (!c || !enabled) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() { context(); },
    step(sneak) { tone(sneak ? 130 : 95, 0.05, 'triangle', sneak ? 0.02 : 0.035); },
    coin() { tone(880, 0.09, 'sine', 0.06); tone(1320, 0.12, 'sine', 0.05, 0.06); },
    artifact() { tone(523, 0.14, 'sine', 0.07); tone(659, 0.14, 'sine', 0.07, 0.1); tone(784, 0.22, 'sine', 0.07, 0.2); },
    stone() { tone(300, 0.08, 'square', 0.04, 0, 120); },
    jammer() { tone(1200, 0.18, 'sawtooth', 0.03, 0, 300); },
    smoke() { tone(220, 0.4, 'sine', 0.05, 0, 90); },
    spotted() { tone(660, 0.16, 'square', 0.05); tone(660, 0.16, 'square', 0.05, 0.2); },
    alarmBeep() { tone(980, 0.1, 'square', 0.035); },
    caught() { tone(392, 0.3, 'sawtooth', 0.06, 0, 110); tone(196, 0.5, 'sawtooth', 0.06, 0.25, 65); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.07, i * 0.13));
      tone(1319, 0.5, 'sine', 0.06, 0.55);
    },
    roomClear() { tone(784, 0.15, 'sine', 0.06); tone(1047, 0.25, 'sine', 0.06, 0.12); },
    startDrone() {
      const c = context();
      if (!c || drone || !enabled) return;
      try {
        const osc = c.createOscillator();
        const osc2 = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine'; osc.frequency.value = 55;
        osc2.type = 'sine'; osc2.frequency.value = 55.7;
        g.gain.value = 0.018;
        osc.connect(g); osc2.connect(g); g.connect(c.destination);
        osc.start(); osc2.start();
        drone = { osc, osc2, g };
      } catch { /* abaikan */ }
    },
    toggle() { enabled = !enabled; return enabled; },
  };
}
