"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  BLOCK, MAX_SLOTS, blocksNeeded, createSim, finished, medianLatency, slotCap, step,
  type Mix, type Mode, type SimConfig, type SimState,
} from "@/lib/sim";

const SPEED = 8; // simulated seconds per real second
const MODES: { v: Mode; label: string }[] = [
  { v: "seq", label: "Sequential" },
  { v: "static", label: "Static" },
  { v: "cont", label: "Continuous" },
];
const MIXES: { v: Mix; label: string }[] = [
  { v: "mixed", label: "Mixed" },
  { v: "uniform", label: "Uniform" },
];

type Cell = { cls: "" | "u" | "r"; color?: string };

function poolCells(s: SimState, cfg: SimConfig): Cell[] {
  const cells: Cell[] = [];
  for (const q of s.active) {
    const used = Math.ceil((q.prompt + q.gen) / BLOCK);
    for (let j = 0; j < blocksNeeded(q); j++) cells.push({ cls: j < used ? "u" : "r", color: q.color });
  }
  if (cfg.mode === "static") {
    // finished members of a static batch keep their blocks until the whole batch ends
    const held = cfg.blocks - s.free - cells.length;
    for (let j = 0; j < held; j++) cells.push({ cls: "r", color: "var(--mute)" });
  }
  while (cells.length < cfg.blocks) cells.push({ cls: "" });
  return cells.slice(0, cfg.blocks);
}

export default function BatchingSim() {
  const [cfg, setCfg] = useState<SimConfig>({ mode: "cont", mix: "mixed", load: 2, blocks: 64 });
  const sim = useRef<SimState>(createSim(cfg));
  const [, setFrame] = useState(0);

  useEffect(() => {
    sim.current = createSim(cfg);
    let simT = 0;
    let last = 0;
    let raf = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      while (sim.current.clock < 120) step(sim.current, cfg);
      setFrame((f) => f + 1);
      return;
    }

    const loop = (ts: number) => {
      if (!last) last = ts;
      const d = Math.min(0.1, (ts - last) / 1000);
      last = ts;
      simT += d * SPEED;
      let n = 0;
      while (sim.current.clock < simT && n < 400) { step(sim.current, cfg); n++; }
      if (finished(sim.current)) { sim.current = createSim(cfg); simT = 0; }
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cfg]);

  const s = sim.current;
  const cap = slotCap(cfg.mode);
  const cells = poolCells(s, cfg);
  const med = medianLatency(s);
  const queueNote = !s.queue.length
    ? ""
    : s.why === "blocks" ? "blocked at gate 2: no free blocks"
    : s.why === "slots" ? "blocked at gate 1: no free slot"
    : "waiting";

  return (
    <div className="sim">
      <div className="simtop">
        <div>
          <p className="lbl">
            <span>KV block pool, 16 tokens per block</span>
            <span className="m">{cfg.blocks - s.free}/{cfg.blocks} held</span>
          </p>
          <div
            className="pool"
            aria-label="KV cache blocks"
            style={{ gridTemplateColumns: `repeat(${cfg.blocks <= 32 ? 8 : 16},minmax(0,1fr))` }}
          >
            {cells.map((c, i) => (
              <b key={i} className={c.cls} style={c.color ? ({ "--c": c.color } as CSSProperties) : undefined} />
            ))}
          </div>
          <p className="cap">Filled: tokens written. Outlined: reserved for the request’s remaining output.</p>
        </div>

        <div>
          <p className="lbl"><span>Batch slots</span><span className="m">t = {s.clock.toFixed(0)} s</span></p>
          <div className="slots">
            {Array.from({ length: MAX_SLOTS }, (_, i) => {
              const q = s.active[i];
              if (i >= cap)
                return (
                  <div key={i} className="slot idle">
                    <span>—</span><span className="ui" style={{ fontSize: 13 }}>unused by this policy</span><span />
                  </div>
                );
              if (!q)
                return (
                  <div key={i} className="slot idle"><span>#–</span><span className="p" /><span>idle</span></div>
                );
              return (
                <div key={i} className="slot" style={{ "--c": q.color } as CSSProperties}>
                  <span>#{q.id}</span>
                  <span className="p"><i style={{ width: `${((100 * q.gen) / q.out).toFixed(1)}%` }} /></span>
                  <span>{q.gen}/{q.out}</span>
                </div>
              );
            })}
          </div>
          <p className="lbl" style={{ marginTop: 12 }}><span>Waiting queue</span><span className="m">{queueNote}</span></p>
          <div className="queue">
            {s.queue.slice(0, 14).map((q, i) => (
              <span key={q.id} className={i === 0 && s.why === "blocks" ? "k" : ""}>#{q.id}</span>
            ))}
            {s.queue.length > 14 && <span>+{s.queue.length - 14}</span>}
            {!s.queue.length && <span style={{ borderStyle: "solid" }}>empty</span>}
          </div>
        </div>
      </div>

      <div className="readout">
        <div><small>Throughput</small><strong>{s.clock > 0 ? (s.tokens / s.clock).toFixed(1) : "0.0"}</strong> <small style={{ display: "inline" }}>tok/s</small></div>
        <div><small>Median end-to-end latency</small><strong>{med == null ? "–" : `${med.toFixed(1)} s`}</strong></div>
        <div><small>Slots in use, on average</small><strong>{s.clock > 0 ? `${(s.slotTime / s.clock).toFixed(1)} / ${cap}` : "–"}</strong></div>
      </div>

      <div className="ctl">
        <div>
          <div className="lbl"><span>Policy</span></div>
          <div className="seg-btn">
            {MODES.map((m) => (
              <button key={m.v} aria-pressed={cfg.mode === m.v} onClick={() => setCfg({ ...cfg, mode: m.v })}>{m.label}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="lbl"><span>Output lengths</span></div>
          <div className="seg-btn">
            {MIXES.map((m) => (
              <button key={m.v} aria-pressed={cfg.mix === m.v} onClick={() => setCfg({ ...cfg, mix: m.v })}>{m.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="load">Arrival rate <output>{cfg.load}× seq. capacity</output></label>
          <input id="load" type="range" min={1} max={3} step={0.5} value={cfg.load}
            onChange={(e) => setCfg({ ...cfg, load: +e.target.value })} />
        </div>
        <div>
          <label htmlFor="blocks">Block pool <output>{cfg.blocks} blocks</output></label>
          <input id="blocks" type="range" min={16} max={96} step={8} value={cfg.blocks}
            onChange={(e) => setCfg({ ...cfg, blocks: +e.target.value })} />
        </div>
      </div>
      <p className="status">
        A simulation, not the model. Step times are set from my measured numbers: about 9.3 tok/s for one request and
        about 2.4× that with four in a batch, on one CPU with Qwen3-0.6B. Sim time runs 8× faster than real time.
      </p>
    </div>
  );
}
