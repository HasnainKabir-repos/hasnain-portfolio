// Discrete-event model of an LLM serving scheduler with two admission gates:
//   gate 1: a free batch slot
//   gate 2: enough free KV-cache blocks to reserve prompt + full output
// Step times are calibrated to measured numbers from the toy inference server:
// ~9.3 tok/s for a single request, ~2.4x that with four requests batched (CPU, Qwen3-0.6B).

export type Mode = "seq" | "static" | "cont";
export type Mix = "mixed" | "uniform";

export interface SimConfig {
  mode: Mode;
  mix: Mix;
  load: number; // arrival rate as a multiple of sequential capacity
  blocks: number; // size of the KV block pool
}

export interface Req {
  id: number;
  at: number; // arrival time (s)
  prompt: number; // prompt tokens
  out: number; // output tokens to generate
  gen: number; // tokens generated so far
  color: string;
  fin?: number;
}

export interface SimState {
  clock: number;
  arrivals: Req[];
  next: number;
  queue: Req[];
  active: Req[];
  done: Req[];
  tokens: number;
  slotTime: number;
  free: number;
  why: "" | "slots" | "blocks";
}

export const BLOCK = 16;
export const MAX_SLOTS = 4;
const T1 = 1 / 9.3;
const COLORS = ["#1d2bd8", "#0e7f96", "#6a4fe0", "#2f6fd6", "#138a8a", "#8a3fd1", "#3a52a8", "#1aa0b8"];

export const stepTime = (n: number) => T1 * (1 + 0.23 * (n - 1));
export const blocksNeeded = (r: Req) => Math.ceil((r.prompt + r.out) / BLOCK);
export const slotCap = (mode: Mode) => (mode === "seq" ? 1 : MAX_SLOTS);

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function createSim(cfg: SimConfig): SimState {
  const r = rng(12345);
  const meanOut = 48;
  const lambda = cfg.load / (meanOut * T1);
  let t = 0;
  const arrivals: Req[] = [];
  for (let i = 0; i < 400; i++) {
    t += -Math.log(1 - r()) / lambda;
    const out = cfg.mix === "uniform" ? 48 : Math.round(12 + r() * 72 * (r() < 0.35 ? 2 : 0.9));
    arrivals.push({
      id: i + 1,
      at: t,
      prompt: 24 + Math.floor(r() * 72),
      out: Math.max(8, out),
      gen: 0,
      color: COLORS[i % COLORS.length],
    });
  }
  return { clock: 0, arrivals, next: 0, queue: [], active: [], done: [], tokens: 0, slotTime: 0, free: cfg.blocks, why: "" };
}

function admit(s: SimState, cfg: SimConfig) {
  while (s.next < s.arrivals.length && s.arrivals[s.next].at <= s.clock) s.queue.push(s.arrivals[s.next++]);
  if (cfg.mode === "static" && s.active.length) return; // static: wait for the whole batch to finish
  const cap = slotCap(cfg.mode);
  s.why = "";
  while (s.queue.length) {
    if (s.active.length >= cap) { s.why = "slots"; break; }
    const q = s.queue[0];
    if (blocksNeeded(q) > s.free) { s.why = "blocks"; break; }
    s.free -= blocksNeeded(q);
    s.queue.shift();
    s.active.push(q);
  }
}

export function step(s: SimState, cfg: SimConfig) {
  admit(s, cfg);
  if (!s.active.length) {
    if (s.next < s.arrivals.length) s.clock = Math.max(s.clock, s.arrivals[s.next].at);
    return;
  }
  const dt = stepTime(s.active.length);
  s.clock += dt;
  s.slotTime += dt * s.active.length;
  for (const q of s.active) { q.gen++; s.tokens++; }
  s.active = s.active.filter((q) => {
    if (q.gen < q.out) return true;
    q.fin = s.clock;
    s.done.push(q);
    if (cfg.mode !== "static") s.free += blocksNeeded(q);
    return false;
  });
  if (cfg.mode === "static" && !s.active.length) s.free = cfg.blocks;
}

export const finished = (s: SimState) => s.next >= s.arrivals.length && !s.active.length && !s.queue.length;

export function medianLatency(s: SimState): number | null {
  const lat = s.done.slice(-40).map((q) => (q.fin ?? 0) - q.at).sort((a, b) => a - b);
  return lat.length ? lat[Math.floor(lat.length / 2)] : null;
}
