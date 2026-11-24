// Content you'll update most often lives here.

export const email = "hasnainkabir120@gmail.com";
export const github = "https://github.com/HasnainKabir-repos";

// The `top`-style status table under the header. Update monthly.
// state: "R" running, "S" sleeping (queued / next up)
export const processes: { state: "R" | "S"; command: string }[] = [
  { state: "R", command: 'apply --phd --term "Fall 2027" --area "ML systems"' },
  { state: "R", command: "expand --depth systems" },
  { state: "S", command: "design block-kv-cache --toy-server" },
];

// "stack" section, newest frame on top.
export const stack: { when: string; title: string; text: string }[] = [
  {
    when: "Dec 2025 – Jul 2026",
    title: "Python Developer, SuperAnnotate",
    text: "Production Python services and backend APIs for AI data and annotation workflows, SDK integrations, and browser automation with Pyodide and TypeScript. Fully remote, overlapping US hours.",
  },
  {
    when: "Jan – Nov 2025",
    title: "Software Engineer and co-founder, Logicri",
    text: "Led four developers through three end-to-end client projects and owned the client side: requirements, sprint planning, demos and acceptance testing.",
  },
  {
    when: "2021 – 2025",
    title: "B.Sc. in Software Engineering, Islamic University of Technology",
    text: "CGPA 3.88/4.0, graduated with honors.",
  },
  {
    when: "Jun – Sep 2024",
    title: "Software Engineer Intern, Kaz Software",
    text: "",
  },
];
