// Ixtiyoriy tovushlar (WebAudio sintezi, fayllarsiz): "paq", darz ketish, shishirash, qaynash, chiqillash.
let ctx = null;
let enabled = false;
let master = null;
const loops = new Map();

export function setSoundEnabled(on) {
  enabled = !!on;
  if (!enabled) for (const [, l] of loops) l.gain.gain.value = 0;
}
export function soundEnabled() { return enabled; }

function ac() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function noiseBuffer(c, seconds = 1) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function burst(c, { dur = 0.15, freq = 800, q = 1, gain = 0.6, type = 'bandpass' }) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur);
  const f = c.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start();
}

/** Bir martalik tovush */
export function play(kind) {
  const c = ac();
  if (!c) return;
  switch (kind) {
    case 'pop': burst(c, { dur: 0.18, freq: 600, q: 0.7, gain: 1 }); break;
    case 'crack': burst(c, { dur: 0.08, freq: 3500, q: 4, gain: 0.8 }); setTimeout(() => burst(c, { dur: 0.06, freq: 2600, q: 5, gain: 0.5 }), 60); break;
    case 'click': burst(c, { dur: 0.03, freq: 2000, q: 2, gain: 0.3 }); break;
    case 'pour': burst(c, { dur: 0.4, freq: 900, q: 0.8, gain: 0.15 }); break;
    case 'whoosh': burst(c, { dur: 0.5, freq: 300, q: 0.5, gain: 0.4, type: 'lowpass' }); break;
    case 'splash': burst(c, { dur: 0.3, freq: 1500, q: 0.6, gain: 0.5 }); break;
    case 'spark': burst(c, { dur: 0.05, freq: 5000, q: 3, gain: 0.25 }); break;
    default: break;
  }
}

/** Uzluksiz tovush darajasi (0..1): 'fizz' (gaz), 'boil' (qaynash), 'burner' (gorelka) */
export function level(kind, value) {
  const c = ac();
  if (!c) return;
  let l = loops.get(kind);
  if (!l) {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 2);
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = kind === 'burner' ? 'lowpass' : 'bandpass';
    f.frequency.value = kind === 'fizz' ? 4500 : kind === 'boil' ? 400 : 250;
    f.Q.value = kind === 'boil' ? 2 : 0.7;
    const gain = c.createGain();
    gain.gain.value = 0;
    src.connect(f); f.connect(gain); gain.connect(master);
    src.start();
    l = { src, gain };
    loops.set(kind, l);
  }
  const target = Math.max(0, Math.min(1, value)) * (kind === 'fizz' ? 0.12 : kind === 'boil' ? 0.25 : 0.08);
  l.gain.gain.setTargetAtTime(target, c.currentTime, 0.15);
}
