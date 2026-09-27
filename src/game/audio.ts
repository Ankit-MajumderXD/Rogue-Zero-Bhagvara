// Procedural audio engine (WebAudio synthesis, no asset downloads).
// All music and SFX are original, generated at runtime: warm pads, harp-like
// plucks and soft strings for a whimsical, cinematic orchestral mood.

export type MusicMode = "menu" | "game" | "boss" | "victory" | "defeat";

export type AudioPrefs = { music: number; sfx: number; muted: boolean };

const PREFS_KEY = "rogue-zero-audio-v1";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let ambient: { osc: OscillatorNode[]; gain: GainNode } | null = null;

let prefs: AudioPrefs = { music: 0.8, sfx: 0.9, muted: false };

function loadPrefs(): AudioPrefs {
  if (typeof localStorage === "undefined") return prefs;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...prefs, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return prefs;
}
prefs = loadPrefs();

function persistPrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

// Tiny external store so React sliders stay in sync.
const prefListeners = new Set<() => void>();
export const audioStore = {
  get: () => prefs,
  subscribe(fn: () => void) {
    prefListeners.add(fn);
    return () => prefListeners.delete(fn);
  },
};

function applyPrefs() {
  if (!master || !musicBus || !sfxBus || !ctx) return;
  const now = ctx.currentTime;
  master.gain.setTargetAtTime(prefs.muted ? 0 : 0.9, now, 0.05);
  musicBus.gain.setTargetAtTime(prefs.music * 0.85, now, 0.05);
  sfxBus.gain.setTargetAtTime(prefs.sfx, now, 0.05);
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    applyPrefs();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function env(g: GainNode, now: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(peak, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// ---------- procedural music ----------

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Chord progressions (midi note arrays), one chord per bar.
const PROG: Record<MusicMode, number[][]> = {
  // Warm, wondrous: Cmaj9 — Am9 — Fmaj9 — G6
  menu: [
    [48, 52, 55, 59, 62],
    [45, 48, 52, 55, 59],
    [41, 45, 48, 52, 55],
    [43, 47, 50, 52, 57],
  ],
  // Soft, floating tension: Am — F — C — E(sus)
  game: [
    [45, 48, 52, 57],
    [41, 45, 48, 53],
    [48, 52, 55, 60],
    [40, 44, 47, 52],
  ],
  // Darker, driving: Dm — Bb — Gm — A
  boss: [
    [38, 41, 45, 50],
    [34, 38, 41, 46],
    [43, 46, 50, 55],
    [33, 37, 40, 45],
  ],
  // Uplifting resolution: F — C — G — C
  victory: [
    [41, 45, 48, 53],
    [48, 52, 55, 60],
    [43, 47, 50, 55],
    [48, 52, 55, 64],
  ],
  // Somber: Am — Em — F — E
  defeat: [
    [45, 48, 52, 57],
    [40, 43, 47, 52],
    [41, 45, 48, 53],
    [40, 44, 47, 52],
  ],
};

// Gentle pentatonic melody pool per mode (midi).
const MELODY: Record<MusicMode, number[]> = {
  menu: [64, 67, 69, 72, 74, 76, 79],
  game: [57, 60, 62, 64, 67, 69],
  boss: [50, 53, 55, 57, 58, 62],
  victory: [60, 64, 67, 72, 76, 79, 84],
  defeat: [57, 60, 62, 64, 65, 69],
};

type MusicState = {
  mode: MusicMode;
  timer: ReturnType<typeof setInterval>;
  nextBeat: number;
  beat: number;
};

let music: MusicState | null = null;

function padChord(c: AudioContext, notes: number[], at: number, dur: number, level: number) {
  if (!musicBus) return;
  for (const m of notes) {
    for (const det of [-4, 3]) {
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.value = mtof(m);
      o.detune.value = det;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(level, at + dur * 0.35);
      g.gain.setValueAtTime(level, at + dur * 0.7);
      g.gain.linearRampToValueAtTime(0.0001, at + dur * 1.05);
      o.connect(f).connect(g).connect(musicBus);
      o.start(at);
      o.stop(at + dur * 1.1);
    }
  }
}

function pluck(c: AudioContext, midi: number, at: number, level: number, decay = 1.4) {
  if (!musicBus) return;
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.value = mtof(midi);
  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.value = mtof(midi + 12);
  const g = c.createGain();
  env(g, at, level, 0.008, decay);
  const g2 = c.createGain();
  env(g2, at, level * 0.35, 0.005, decay * 0.5);
  o.connect(g).connect(musicBus);
  o2.connect(g2).connect(musicBus);
  o.start(at);
  o.stop(at + decay + 0.1);
  o2.start(at);
  o2.stop(at + decay * 0.6);
}

function bassNote(c: AudioContext, midi: number, at: number, dur: number, level: number) {
  if (!musicBus) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = mtof(midi - 12);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(level, at + 0.08);
  g.gain.setTargetAtTime(0.0001, at + dur * 0.7, 0.2);
  o.connect(g).connect(musicBus);
  o.start(at);
  o.stop(at + dur + 0.4);
}

function scheduleBeat(c: AudioContext, st: MusicState) {
  const mode = st.mode;
  const prog = PROG[mode];
  const beatLen = mode === "boss" ? 0.42 : 0.55;
  const barLen = beatLen * 4;
  const beatInBar = st.beat % 4;
  const bar = Math.floor(st.beat / 4);
  const chord = prog[bar % prog.length]!;
  const at = st.nextBeat;

  if (beatInBar === 0) {
    // Pad swells each bar; boss pads are quieter and darker.
    padChord(c, chord, at, barLen, mode === "boss" ? 0.028 : 0.04);
    bassNote(c, chord[0]!, at, barLen, mode === "boss" ? 0.09 : 0.06);
  }
  // Harp-like arpeggio: gentle in menu/game, driving in boss.
  const arpChance = mode === "boss" ? 0.9 : mode === "game" ? 0.45 : 0.7;
  if (Math.random() < arpChance) {
    const n = chord[1 + Math.floor(Math.random() * (chord.length - 1))]! + 12;
    pluck(c, n, at + (mode === "boss" ? 0 : Math.random() * beatLen * 0.5), mode === "boss" ? 0.05 : 0.045);
  }
  // Sparse melody line, mostly on menu/victory/defeat.
  const melChance = mode === "menu" ? 0.4 : mode === "victory" ? 0.55 : mode === "defeat" ? 0.3 : 0.16;
  if (beatInBar === 2 && Math.random() < melChance) {
    const pool = MELODY[mode];
    const n = pool[Math.floor(Math.random() * pool.length)]!;
    pluck(c, n, at, 0.05, 2.2);
  }
  // Victory sparkle.
  if (mode === "victory" && beatInBar === 0 && Math.random() < 0.6) {
    pluck(c, chord[chord.length - 1]! + 24, at + beatLen * 1.5, 0.03, 1.8);
  }

  st.beat++;
  st.nextBeat += beatLen;
}

function startMusic(mode: MusicMode) {
  const c = ac();
  if (!c) return;
  if (music?.mode === mode) return;
  stopMusic();
  const st: MusicState = {
    mode,
    nextBeat: c.currentTime + 0.1,
    beat: 0,
    timer: setInterval(() => {
      if (!ctx || !music) return;
      // Lookahead scheduler: stay ~0.35s ahead of the clock. If the context
      // was suspended (autoplay policy), snap forward instead of bursting.
      if (music.nextBeat < ctx.currentTime - 0.5) music.nextBeat = ctx.currentTime + 0.05;
      while (music.nextBeat < ctx.currentTime + 0.35) scheduleBeat(ctx, music);
    }, 120),
  };
  music = st;
}

function stopMusic() {
  if (!music) return;
  clearInterval(music.timer);
  music = null;
}

// ---------- public API ----------

export const sfx = {
  unlock() {
    ac();
  },
  getPrefs: () => prefs,
  setMusicVolume(v: number) {
    prefs = { ...prefs, music: Math.max(0, Math.min(1, v)) };
    persistPrefs();
    applyPrefs();
    prefListeners.forEach((l) => l());
  },
  setSfxVolume(v: number) {
    prefs = { ...prefs, sfx: Math.max(0, Math.min(1, v)) };
    persistPrefs();
    applyPrefs();
    prefListeners.forEach((l) => l());
  },
  setMuted(m: boolean) {
    prefs = { ...prefs, muted: m };
    persistPrefs();
    applyPrefs();
    prefListeners.forEach((l) => l());
  },
  setVolume(v: number) {
    // Legacy master shortcut: scales both buses.
    this.setSfxVolume(v);
    this.setMusicVolume(v);
  },
  playMusic(mode: MusicMode) {
    startMusic(mode);
  },
  stopMusic() {
    stopMusic();
  },
  shot() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    env(g, now, 0.12, 0.005, 0.11);
    o.connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 0.16);
  },
  enemyShot() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(320, now);
    o.frequency.exponentialRampToValueAtTime(90, now + 0.18);
    env(g, now, 0.08, 0.01, 0.16);
    o.connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 0.22);
  },
  hit() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.12);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2600;
    const g = c.createGain();
    env(g, now, 0.16, 0.003, 0.1);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(now);
  },
  explosion() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.7);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(1400, now);
    f.frequency.exponentialRampToValueAtTime(120, now + 0.6);
    const g = c.createGain();
    env(g, now, 0.35, 0.01, 0.6);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(now);
  },
  emp() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(60, now);
    o.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
    env(g, now, 0.25, 0.02, 0.5);
    o.connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 0.6);
  },
  dash() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.3);
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 900;
    const g = c.createGain();
    env(g, now, 0.14, 0.01, 0.25);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(now);
  },
  melee() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(1200, now);
    o.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    env(g, now, 0.14, 0.005, 0.2);
    o.connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 0.26);
  },
  step() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, now);
    o.frequency.exponentialRampToValueAtTime(60, now + 0.09);
    env(g, now, 0.07, 0.004, 0.08);
    o.connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 0.12);
  },
  ui() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.value = 660;
    env(g, now, 0.05, 0.005, 0.07);
    o.connect(g).connect(sfxBus);
    o.start(now);
    o.stop(now + 0.1);
  },
  pickup() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = i === 0 ? 880 : 1320;
      env(g, now + i * 0.07, 0.07, 0.005, 0.14);
      o.connect(g).connect(sfxBus);
      o.start(now + i * 0.07);
      o.stop(now + i * 0.07 + 0.2);
    }
  },
  alarm() {
    const c = ac();
    if (!c || !sfxBus) return;
    const now = c.currentTime;
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(440, now + i * 0.45);
      o.frequency.linearRampToValueAtTime(300, now + i * 0.45 + 0.35);
      env(g, now + i * 0.45, 0.14, 0.05, 0.3);
      o.connect(g).connect(sfxBus);
      o.start(now + i * 0.45);
      o.stop(now + i * 0.45 + 0.45);
    }
  },
  startAmbient(boss = false) {
    const c = ac();
    if (!c || !musicBus || ambient) return;
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.gain.linearRampToValueAtTime(boss ? 0.07 : 0.04, c.currentTime + 2);
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = boss ? 420 : 260;
    gain.connect(musicBus);
    const freqs = boss ? [55, 82.5, 110, 164] : [41, 61.5, 82];
    const osc = freqs.map((f, i) => {
      const o = c.createOscillator();
      o.type = i % 2 === 0 ? "sawtooth" : "sine";
      o.frequency.value = f;
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.08 + i * 0.05;
      lfoGain.gain.value = 2.5;
      lfo.connect(lfoGain).connect(o.frequency);
      lfo.start();
      o.connect(filt).connect(gain);
      o.start();
      return o;
    });
    ambient = { osc, gain };
  },
  stopAmbient() {
    if (!ambient || !ctx) return;
    const now = ctx.currentTime;
    ambient.gain.gain.cancelScheduledValues(now);
    ambient.gain.gain.setValueAtTime(ambient.gain.gain.value, now);
    ambient.gain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    const dead = ambient;
    ambient = null;
    setTimeout(() => dead.osc.forEach((o) => o.stop()), 800);
  },
};
