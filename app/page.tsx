import BatchingSim from "@/components/BatchingSim";
import PageTableNav from "@/components/PageTableNav";
import { Bars, Finding } from "@/components/Finding";
import { email, github, processes, stack } from "@/lib/content";

export default function Home() {
  return (
    <div className="wrap">
      <PageTableNav />

      <main>
        <header id="boot">
          <h1>A Z Hasnain Kabir</h1>
          <p className="lede">
            ML systems and AI infrastructure engineer. I work on how large language models are served: request
            scheduling, batching, KV-cache management and performance under load, backed by production Python backend
            experience on a remote team.
          </p>
          <div className="links">
            <a href={github}>{github.replace("https://", "")}</a>
            <span>{email}</span>
            <span>Dhaka, Bangladesh</span>
          </div>
          <div className="top" role="region" aria-label="Current status">
            <table>
              <thead>
                <tr><th>PID</th><th>USER</th><th>S</th><th>COMMAND</th></tr>
              </thead>
              <tbody>
                {processes.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>hasnain</td>
                    <td className={p.state === "R" ? "run" : undefined}>{p.state}</td>
                    <td>{p.command}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </header>

        <section id="sim" aria-labelledby="simh">
          <h2 id="simh">Two gates decide when a request runs</h2>
          <p className="seg">0x1000 · scheduler</p>
          <p style={{ maxWidth: "38em", margin: "0 0 14px" }}>
            A request waits until there is a free batch slot (gate 1) and enough free KV-cache blocks for it (gate 2).
            Change the policy, the load or the size of the block pool and watch which gate becomes the queue.
          </p>
          <BatchingSim />
        </section>

        <section id="data" aria-labelledby="datah">
          <h2 id="datah">What I measured</h2>
          <p className="seg">0x2000 · .data</p>

          <Finding
            title="Scheduling alone gives no speedup; batched decode does"
            big="2.36×"
            note={<>offline throughput over sequential (uniform), 1.96× on mixed lengths.<br /><br /><b>Limits.</b> One small model, one CPU, short prompts, small samples, one batch cap. Long contexts untested. Float16 batched outputs match sequential on 92–100% of requests.</>}
          >
            <p>
              I wrote sequential, static and continuous-batching engines from scratch (Python, PyTorch, Hugging Face
              Transformers) and ran each with seeded workloads, open-loop Poisson arrivals, repeated trials and 95%
              confidence intervals. Continuous batching with one forward pass per request ran at the sequential rate.
              The gain arrived only when decode steps were batched.
            </p>
            <Bars
              label="Offline throughput, uniform output lengths"
              caption="Offline throughput, tok/s, uniform 48-token outputs, batch cap 4."
              rows={[
                { name: "Sequential", value: 9.3, text: "~9.3", tone: "q" },
                { name: "Continuous, unbatched", value: 9.3, text: "~9.3", tone: "q" },
                { name: "Continuous, batched", value: 20.99 },
                { name: "Static", value: 22.56 },
              ]}
            />
            <p style={{ marginTop: 14 }}>
              Static wins by about 7% when every output is the same length. With mixed lengths it keeps only 2.1 of 4
              slots busy against 3.7 for continuous, and at twice sequential load continuous cuts median end-to-end
              latency from 27.6 s to 8.9 s. Rebuilding the KV cache on every admit and evict costs 5–7% of wall time.
            </p>
            <p><a href={`${github}/Toy-Inference-Server`}>Code and the report, “Where Does Batching Help?”</a></p>
          </Finding>

          <Finding
            title="vLLM’s latency spike was an admission cap, not preemption"
            big="5.8 s"
            note={<>P99 TTFT at 20 clients under a constrained KV budget, with flat per-token latency.<br /><br /><b>Stack.</b> vLLM, Docker, Minikube, Prometheus, Grafana, GCP spot T4, Qwen3-0.6B.</>}
          >
            <p>
              On a rented T4, time to first token held until somewhere between 40 and 50 concurrent clients, then fell
              off a wall. With the KV budget squeezed, P99 TTFT reached about 5.8 s at only 20 clients while time per
              output token stayed flat. The queue was growing, not the compute.
            </p>
            <p>
              My first guess was a preemption cascade. I traced vLLM’s scheduler admission path, reran the load while
              searching the logs for preemptions and found none. Latencies sat in one tight band, the shape of a stable
              FIFO queue. A starved KV block budget was capping admission: gate 2 in the simulator above.
            </p>
          </Finding>

          <Finding
            title="4-bit quantization made a small model slower"
            big="−41%"
            note={<>batched throughput on the T4 going from FP16 to NF4.<br /><br /><b>Caveat.</b> The GPU runs used an older bitsandbytes than the CPU runs. These came from an earlier engine version than the batching report.</>}
          >
            <p>
              I quantized the same model to NF4 with bitsandbytes and ran it through my batching engine. It was slower
              everywhere, and slower still in batches. The 4-bit kernels are built for the wide matrices of 7B-class
              models; Qwen3-0.6B’s hidden size of about 1024 sits well below that. I wrote up the negative result
              instead of hunting for a positive one.
            </p>
            <Bars
              label="FP16 versus NF4 batched throughput"
              caption="tok/s, same engine, prompts and hardware per pair."
              rows={[
                { name: "T4 FP16, batched", value: 43.55 },
                { name: "T4 NF4, batched", value: 25.65, tone: "w" },
                { name: "CPU FP16, batched", value: 17.35 },
                { name: "CPU NF4, batched", value: 7.24, tone: "w" },
              ]}
            />
          </Finding>

          <Finding
            title="SecRAG: finding vulnerable functions with retrieval"
            big="21.3 → 74.65"
            note={<>detection F1 (%), from the UniXcoder baseline.<br /><br /><b>Status.</b> Unpublished, 2025. Our datasets on Hugging Face have passed 10,000 downloads.</>}
          >
            <p>
              SecRAG takes a single function of source code and decides whether it is vulnerable, then names the
              weakness by its CWE class. It works in stages: a fine-tuned UniXcoder model embeds the function, retrieval
              brings in related examples and CWE knowledge from a curated knowledge base, and an LLM uses that context
              to give a verdict and a class.
            </p>
            <p>
              It is built on a curated dataset of 12 critical CWE classes, each paired with mitigations, drawn from
              BigVul and PrimeVul. SecRAG improved both detection F1 and CWE classification accuracy over the baseline
              models. Undergraduate thesis, team of three.
            </p>
          </Finding>
        </section>

        <section id="text" aria-labelledby="texth">
          <h2 id="texth">Software I’ve shipped</h2>
          <p className="seg">0x3000 · .text</p>
          <Finding
            title="ErrumBD, ERP and e-commerce for a footwear retailer"
            note={
              <>
                <b>Stack</b><br />
                <span className="m" style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.9 }}>
                  Next.js<br />Node.js<br />MongoDB<br />RabbitMQ<br />Docker<br />AWS EC2, ECR
                </span>
                <br /><br /><b>Team.</b> Four developers, 2025.
              </>
            }
          >
            <p>
              A full operations platform for a mid-sized footwear business, covering the online store and the back
              office: orders, point of sale, inventory, outlets, stock transfer, accounting and reports. Built at
              Logicri, where I was project lead.
            </p>
            <ul className="feat">
              <li><b>Variant-aware inventory.</b> Every shoe is tracked by brand, size, colour and grade, and stock levels are kept per outlet automatically.</li>
              <li><b>Three-step stock transfer.</b> Stock moves between outlets in three confirmed steps, from dispatch to acceptance, so every unit is accounted for along the way.</li>
              <li><b>One-click label printing.</b> Product stickers print straight to a thermal label printer at exact size and resolution, with no print dialog.</li>
              <li><b>Point of sale tied to inventory.</b> Sales in the outlets and orders online draw on the same stock, with accounting and reports built on top.</li>
              <li><b>Asynchronous processing.</b> Heavy work runs through a RabbitMQ queue, with query optimization and deduplication keeping the data consistent.</li>
            </ul>
          </Finding>
        </section>

        <section id="stack" aria-labelledby="stackh">
          <h2 id="stackh">Where I came from</h2>
          <p className="seg">0x4000 · stack, newest frame on top</p>
          <ul className="stack">
            {stack.map((f) => (
              <li key={f.title}>
                <span className="m">{f.when}</span>
                <div><b>{f.title}.</b> {f.text}</div>
              </li>
            ))}
          </ul>
        </section>

        <section id="heap" aria-labelledby="heaph">
          <h2 id="heaph">What I’m working on now</h2>
          <p className="seg">0x5000 · heap, still growing</p>
          <Finding note={<><b>Updated</b> November 2026.</>}>
            <p>
              I’m applying for PhD programs for Fall 2027 in efficient ML systems, with inference serving as my way in,
              and I’m interested in RA or TA positions. I’m widening my base in systems, going further into scheduling,
              memory management and GPU performance beneath the serving layer. Next, the toy server gets a block-based
              KV cache, PagedAttention-style, to remove the full rebuild on every admit.
            </p>
            <p>
              If your group works on serving, scheduling or memory management for ML, I’d like to hear from you:{" "}
              <span className="m">{email}</span>.
            </p>
          </Finding>
        </section>

        <footer>
          <p>
            Every result on this page came from one laptop CPU and a rented T4 spot instance. My own GPU, a GTX 1050
            Ti, is below vLLM’s minimum.
          </p>
          <p>A Z Hasnain Kabir · <a href={github}>GitHub</a> · {email}</p>
        </footer>
      </main>
    </div>
  );
}
