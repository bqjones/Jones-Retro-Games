// Chiptune-style cues via WebAudio. No assets to load — synthesized square
// waves, in keeping with the PC-speaker era. Sounds do the herding an adult
// normally would: rotation chime, low-time warning, reveal stinger, fanfare.

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function note(freq: number, startSec: number, durSec: number, gain = 0.15): void {
  const ac = audio();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + startSec);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + startSec + 0.01);
  g.gain.setValueAtTime(gain, ac.currentTime + startSec + durSec - 0.03);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + startSec + durSec);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + startSec);
  osc.stop(ac.currentTime + startSec + durSec + 0.05);
}

/** Rotation over — big attention-getter, repeated. */
export function playRotationChime(): void {
  const melody = [523, 659, 784, 1047];
  for (let rep = 0; rep < 3; rep++) {
    melody.forEach((f, i) => note(f, rep * 0.8 + i * 0.12, 0.15, 0.2));
  }
}

/** One minute left. */
export function playWarning(): void {
  note(880, 0, 0.12, 0.15);
  note(880, 0.2, 0.12, 0.15);
}

/** Finalist reveal stinger. */
export function playStinger(): void {
  [392, 494, 587, 784].forEach((f, i) => note(f, i * 0.09, 0.12, 0.18));
}

/** Trophy fanfare. */
export function playFanfare(): void {
  const seq: Array<[number, number, number]> = [
    [523, 0, 0.15],
    [523, 0.18, 0.15],
    [523, 0.36, 0.15],
    [659, 0.54, 0.3],
    [523, 0.9, 0.15],
    [659, 1.08, 0.15],
    [784, 1.26, 0.6],
  ];
  seq.forEach(([f, t, d]) => note(f, t, d, 0.2));
}

/** Short click for button feedback. */
export function playClick(): void {
  note(1047, 0, 0.05, 0.08);
}
