// Tiny procedural audio engine (WebAudio synthesis, no asset downloads).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: { osc: OscillatorNode[]; gain: GainNode } | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
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

export const sfx = {
  unlock() {
    ac();
  },
  setVolume(v: number) {
    ac();
    if (master) master.gain.value = v;
  },
  shot() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    env(g, now, 0.12, 0.005, 0.11);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.16);
  },
  enemyShot() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(320, now);
    o.frequency.exponentialRampToValueAtTime(90, now + 0.18);
    env(g, now, 0.08, 0.01, 0.16);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.22);
  },
  hit() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.12);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2600;
    const g = c.createGain();
    env(g, now, 0.16, 0.003, 0.1);
    src.connect(f).connect(g).connect(master);
    src.start(now);
  },
  explosion() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.7);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(1400, now);
    f.frequency.exponentialRampToValueAtTime(120, now + 0.6);
    const g = c.createGain();
    env(g, now, 0.35, 0.01, 0.6);
    src.connect(f).connect(g).connect(master);
    src.start(now);
  },
  emp() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(60, now);
    o.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
    env(g, now, 0.25, 0.02, 0.5);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.6);
  },
  dash() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.3);
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 900;
    const g = c.createGain();
    env(g, now, 0.14, 0.01, 0.25);
    src.connect(f).connect(g).connect(master);
    src.start(now);
  },
  melee() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(1200, now);
    o.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    env(g, now, 0.14, 0.005, 0.2);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.26);
  },
  step() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, now);
    o.frequency.exponentialRampToValueAtTime(60, now + 0.09);
    env(g, now, 0.07, 0.004, 0.08);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.12);
  },
  ui() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.value = 660;
    env(g, now, 0.05, 0.005, 0.07);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.1);
  },
  alarm() {
    const c = ac();
    if (!c || !master) return;
    const now = c.currentTime;
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(440, now + i * 0.45);
      o.frequency.linearRampToValueAtTime(300, now + i * 0.45 + 0.35);
      env(g, now + i * 0.45, 0.14, 0.05, 0.3);
      o.connect(g).connect(master);
      o.start(now + i * 0.45);
      o.stop(now + i * 0.45 + 0.45);
    }
  },
  startAmbient(boss = false) {
    const c = ac();
    if (!c || !master || ambient) return;
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.gain.linearRampToValueAtTime(boss ? 0.09 : 0.05, c.currentTime + 2);
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = boss ? 420 : 260;
    gain.connect(master);
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
