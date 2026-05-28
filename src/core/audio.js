import { midiToFrequency, sortScaleAscending } from "./theory.js";

let audioContext = null;

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(ctx, frequency, start, duration, type = "sine", gainValue = 0.08) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

export function playScale(notes, options = {}) {
  const { enabled = true, arpeggiate = true } = options;
  if (!enabled || !notes?.length) return;
  const ctx = getContext();
  const now = ctx.currentTime + 0.03;
  const sorted = sortScaleAscending(notes);
  const duration = arpeggiate ? 0.18 : 0.5;

  sorted.forEach(({ midi }, index) => {
    const start = arpeggiate ? now + index * 0.16 : now;
    playTone(ctx, midiToFrequency(midi), start, duration, "triangle", 0.075);
  });

  if (arpeggiate && sorted.length) {
    const octaveMidi = sorted[0].midi + 12;
    playTone(ctx, midiToFrequency(octaveMidi), now + sorted.length * 0.16, 0.32, "triangle", 0.075);
  }
}

export function playChord(notes, options = {}) {
  const { enabled = true } = options;
  if (!enabled || !notes?.length) return;
  const ctx = getContext();
  const now = ctx.currentTime + 0.03;
  const sorted = sortScaleAscending(notes).slice(0, 5);
  sorted.forEach(({ midi }, index) => {
    playTone(ctx, midiToFrequency(midi), now + index * 0.015, 0.75, "sine", 0.045);
  });
}

export function playFeedback(ok, enabled = true) {
  if (!enabled) return;
  const ctx = getContext();
  const now = ctx.currentTime + 0.02;
  const midi = ok ? [60, 64, 67, 72] : [60, 59, 54, 48];
  midi.forEach((note, index) => {
    playTone(ctx, midiToFrequency(note), now + index * 0.08, 0.16, ok ? "triangle" : "sawtooth", ok ? 0.06 : 0.035);
  });
}
