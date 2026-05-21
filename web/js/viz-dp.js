/* =========================================================
   viz-dp.js — DP & Greedy 시각화
   등록: rodCutting, matrixChain, fibonacci, activitySelection, huffman,
         knapsack01, editDistance, lcs
   ========================================================= */

(function () {
  "use strict";
  const { register, PALETTE, svgEl, svgText } = window.VizCore;

  /* =========================================================
     Rod Cutting
     ========================================================= */
  register("rodCutting", () => ({
    title: "Rod Cutting (DP Bottom-up)",
    legend: [
      { color: PALETTE.idle,    label: "r[j] 미계산" },
      { color: PALETTE.active,  label: "현재 j (계산 중)" },
      { color: PALETTE.compare, label: "후보 p[i]+r[j-i]" },
      { color: PALETTE.done,    label: "r[j] 확정" },
    ],
    pseudocode: [
      ["BOTTOM-UP-CUT-ROD(p, n)", ""],
      ["  r[0] = 0", ""],
      ["  for j = 1 to n", ""],
      ["    q = -∞", ""],
      ["    for i = 1 to j", ""],
      ["      q = max(q, p[i] + r[j-i])", ""],
      ["    r[j] = q", ""],
      ["  return r[n]", ""],
    ],
    build() {
      const p = [0, 1, 5, 8, 9, 10, 17, 17, 20]; // p[0]=0, p[1..8]
      const n = 8;
      const r = new Array(n + 1).fill(null);
      r[0] = 0;
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        p: [...p], r: [...r], line, msg, hi,
      });
      snap(0, "가격표 p[1..8] 주어짐");
      snap(1, "r[0] = 0");
      for (let j = 1; j <= n; j++) {
        let q = -Infinity;
        snap(2, `j = ${j}`, { j });
        snap(3, `q = -∞`, { j });
        for (let i = 1; i <= j; i++) {
          const cand = p[i] + r[j - i];
          snap(4, `i = ${i}`, { j, i });
          snap(5, `p[${i}]+r[${j - i}] = ${p[i]}+${r[j - i]} = ${cand}` + (cand > q ? " ✓" : ""), { j, i, cand });
          if (cand > q) q = cand;
        }
        r[j] = q;
        snap(6, `r[${j}] = ${q}`, { j, done: true });
      }
      snap(7, `결과: r[${n}] = ${r[n]}`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 380;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const cells = 9; // 0..8
      const boxW = 64, gap = 8, startX = 40;
      const drawRow = (arr, label, y, colorFn) => {
        svg.appendChild(svgText(label, {
          x: 16, y: y + 32, "font-size": 14, "font-weight": 700, "font-family": "sans-serif", fill: "#1c1917",
        }));
        for (let i = 0; i < cells; i++) {
          const x = startX + 40 + i * (boxW + gap);
          svg.appendChild(svgEl("rect", {
            x, y, width: boxW, height: 48, rx: 6,
            fill: colorFn(i), stroke: "#1f2937", "stroke-width": 2,
          }));
          svg.appendChild(svgText(arr[i] == null ? "·" : String(arr[i]), {
            x: x + boxW / 2, y: y + 32, "text-anchor": "middle",
            "font-size": 16, "font-weight": 700, "font-family": "sans-serif", fill: "#1c1917",
          }));
          svg.appendChild(svgText(String(i), {
            x: x + boxW / 2, y: y + 66, "text-anchor": "middle",
            "font-size": 11, "font-family": "monospace", fill: "#78716c",
          }));
        }
      };
      const hi = frame.hi;
      drawRow(frame.p, "p", 60, (i) => (i === hi.i ? PALETTE.compare : PALETTE.idle));
      drawRow(frame.r, "r", 200, (i) => {
        if (i === hi.j) return PALETTE.active;
        if (frame.r[i] != null) return PALETTE.done;
        return "#f5f5f4";
      });
      svg.appendChild(svgText("Rod Cutting — Bottom-up DP", {
        x: W / 2, y: 30, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     Matrix Chain Multiplication
     ========================================================= */
  register("matrixChain", () => ({
    title: "Matrix-Chain Order",
    legend: [
      { color: PALETTE.done,    label: "m[i,j] 확정" },
      { color: PALETTE.active,  label: "현재 (i,j)" },
      { color: PALETTE.compare, label: "분할점 k 후보" },
      { color: PALETTE.idle,    label: "미계산" },
    ],
    pseudocode: [
      ["MATRIX-CHAIN-ORDER(p)", ""],
      ["  n = p.length - 1", ""],
      ["  m[i,i] = 0 for all i", ""],
      ["  for l = 2 to n", "// 체인 길이"],
      ["    for i = 1 to n-l+1", ""],
      ["      j = i + l - 1", ""],
      ["      m[i,j] = ∞", ""],
      ["      for k = i to j-1", ""],
      ["        q = m[i,k]+m[k+1,j]+p[i-1]·p[k]·p[j]", ""],
      ["        if q < m[i,j]", ""],
      ["          m[i,j] = q", ""],
    ],
    build() {
      const p = [30, 35, 15, 5, 10, 20, 25]; // 6 matrices
      const n = p.length - 1;
      const m = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(null));
      for (let i = 1; i <= n; i++) m[i][i] = 0;
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        m: m.map((r) => [...r]), n, line, msg, hi,
      });
      snap(0, `p = [${p.join(", ")}]`);
      snap(2, "대각선 m[i,i] = 0");
      for (let l = 2; l <= n; l++) {
        snap(3, `l = ${l} (체인 길이)`, {});
        for (let i = 1; i <= n - l + 1; i++) {
          const j = i + l - 1;
          m[i][j] = Infinity;
          snap(4, `i = ${i}, j = ${j}`, { i, j });
          let bestK = -1;
          for (let k = i; k < j; k++) {
            const q = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
            snap(7, `k=${k}: ${m[i][k]}+${m[k + 1][j]}+${p[i - 1]}·${p[k]}·${p[j]} = ${q}`, { i, j, k });
            if (q < m[i][j]) {
              m[i][j] = q;
              bestK = k;
            }
          }
          snap(10, `m[${i},${j}] = ${m[i][j]} (k*=${bestK})`, { i, j, done: true });
        }
      }
      snap(0, `최소 곱셈 수 = ${m[1][n]}`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 400;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const n = frame.n;
      const size = 46;
      const startX = 120, startY = 60;
      // Labels
      for (let j = 1; j <= n; j++) {
        svg.appendChild(svgText(String(j), {
          x: startX + (j - 1) * size + size / 2, y: startY - 10,
          "text-anchor": "middle", "font-size": 12, "font-family": "monospace", fill: "#78716c",
        }));
      }
      for (let i = 1; i <= n; i++) {
        svg.appendChild(svgText(String(i), {
          x: startX - 18, y: startY + (i - 1) * size + size / 2 + 4,
          "text-anchor": "middle", "font-size": 12, "font-family": "monospace", fill: "#78716c",
        }));
      }
      const hi = frame.hi || {};
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= n; j++) {
          const x = startX + (j - 1) * size;
          const y = startY + (i - 1) * size;
          if (j < i) {
            svg.appendChild(svgEl("rect", { x, y, width: size, height: size, fill: "#f5f5f4", stroke: "#e7e5e4" }));
            continue;
          }
          let color = "#ffffff";
          if (i === hi.i && j === hi.j) color = PALETTE.active;
          else if (frame.m[i][j] != null && frame.m[i][j] !== Infinity) color = PALETTE.done;
          svg.appendChild(svgEl("rect", {
            x, y, width: size, height: size,
            fill: color, stroke: "#1f2937", "stroke-width": 1.5,
          }));
          const v = frame.m[i][j];
          const txt = v == null ? "·" : (v === Infinity ? "∞" : String(v));
          svg.appendChild(svgText(txt, {
            x: x + size / 2, y: y + size / 2 + 4, "text-anchor": "middle",
            "font-size": 12, "font-weight": 700, "font-family": "monospace", fill: "#1c1917",
          }));
        }
      }
      svg.appendChild(svgText("Matrix-Chain Order · m[i,j] 테이블", {
        x: W / 2, y: 30, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     Fibonacci — Memo vs Naive (tree)
     ========================================================= */
  register("fibonacci", () => ({
    title: "Fibonacci — 중복 부분 문제",
    legend: [
      { color: PALETTE.idle,    label: "미계산" },
      { color: PALETTE.active,  label: "계산 중" },
      { color: PALETTE.done,    label: "Memo 히트" },
    ],
    pseudocode: [
      ["FIB(n)", ""],
      ["  if n ≤ 1 return n", ""],
      ["  if memo[n] exists return memo[n]  // DP", ""],
      ["  memo[n] = FIB(n-1) + FIB(n-2)", ""],
      ["  return memo[n]", ""],
    ],
    build() {
      const n = 6;
      const frames = [];
      const computed = new Set();
      const snap = (line, msg, hi = {}) => frames.push({
        n, line, msg, computed: new Set(computed), hi,
      });
      snap(0, `FIB(${n}) 호출 트리 (DP 관점)`);
      for (let k = 0; k <= n; k++) {
        computed.add(k);
        snap(3, `FIB(${k}) 계산 완료 — 이후 호출은 즉시 반환`, { active: k });
      }
      snap(0, `F(${n}) = 8. Memoization으로 Θ(n) 시간.`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const n = frame.n;
      // Draw naive recursion tree (limited depth)
      const nodes = [];
      const edges = [];
      function build(k, depth, x, width) {
        const id = nodes.length;
        nodes.push({ id, k, depth, x, y: 50 + depth * 60 });
        if (k > 1 && depth < 5) {
          const l = build(k - 1, depth + 1, x - width / 2, width / 2);
          const r = build(k - 2, depth + 1, x + width / 2, width / 2);
          edges.push([id, l]); edges.push([id, r]);
        }
        return id;
      }
      build(n, 0, W / 2, W / 2);
      edges.forEach(([a, b]) => {
        const A = nodes[a], B = nodes[b];
        svg.appendChild(svgEl("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: "#94a3b8", "stroke-width": 1.2 }));
      });
      nodes.forEach((node) => {
        const isDone = frame.computed.has(node.k);
        const isActive = frame.hi && frame.hi.active === node.k;
        svg.appendChild(svgEl("circle", {
          cx: node.x, cy: node.y, r: 16,
          fill: isActive ? PALETTE.active : (isDone ? PALETTE.done : PALETTE.idle),
          stroke: "#1f2937", "stroke-width": 1.5,
        }));
        svg.appendChild(svgText(String(node.k), {
          x: node.x, y: node.y + 4, "text-anchor": "middle",
          "font-size": 11, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      });
      svg.appendChild(svgText(`Naive recursion tree for FIB(${n}) — 색칠된 노드는 memo로 즉시 반환`, {
        x: W / 2, y: 25, "text-anchor": "middle",
        "font-size": 13, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     Activity Selection
     ========================================================= */
  register("activitySelection", () => ({
    title: "Activity Selection (Greedy)",
    legend: [
      { color: PALETTE.done,   label: "선택됨" },
      { color: PALETTE.active, label: "검사 중" },
      { color: PALETTE.idle,   label: "호환 실패" },
      { color: "#fbbf24",      label: "기준 k" },
    ],
    pseudocode: [
      ["GREEDY-ACTIVITY-SELECTOR(s, f)", ""],
      ["  A = {a₁}", "// 가장 빨리 끝나는 활동"],
      ["  k = 1", ""],
      ["  for m = 2 to n", ""],
      ["    if s[m] ≥ f[k]", "// 호환 가능?"],
      ["      A = A ∪ {aₘ}", ""],
      ["      k = m", ""],
      ["  return A", ""],
    ],
    build() {
      const s = [1, 3, 0, 5, 3, 5, 6, 8, 8, 2];
      const f = [4, 5, 6, 7, 9, 9, 10, 11, 12, 14];
      // sort by f (already sorted)
      const n = s.length;
      const frames = [];
      const selected = new Set([0]);
      let k = 0;
      const snap = (line, msg, hi = {}) => frames.push({
        s: [...s], f: [...f], selected: new Set(selected), k, line, msg, hi,
      });
      snap(0, "활동을 f 기준 정렬 (이미 정렬됨)");
      snap(1, `A = {a₁}, k = 1`);
      for (let m = 1; m < n; m++) {
        snap(3, `m = ${m + 1}: 검사`, { m });
        if (s[m] >= f[k]) {
          snap(4, `s[${m + 1}]=${s[m]} ≥ f[${k + 1}]=${f[k]} → 선택`, { m, ok: true });
          selected.add(m);
          k = m;
          snap(5, `A ∪ {a${m + 1}}`, { m });
          snap(6, `k = ${k + 1}`, {});
        } else {
          snap(4, `s[${m + 1}]=${s[m]} < f[${k + 1}]=${f[k]} → 건너뜀`, { m, ok: false });
        }
      }
      snap(7, `최종: ${[...selected].map((i) => "a" + (i + 1)).join(", ")}`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 400;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const n = frame.s.length;
      const maxT = Math.max(...frame.f);
      const padL = 60, padR = 40, padT = 50, rowH = 30;
      const scale = (W - padL - padR) / maxT;
      // Time axis
      for (let t = 0; t <= maxT; t++) {
        const x = padL + t * scale;
        svg.appendChild(svgEl("line", { x1: x, y1: padT - 8, x2: x, y2: padT - 4, stroke: "#78716c" }));
        svg.appendChild(svgText(String(t), {
          x, y: padT - 12, "text-anchor": "middle", "font-size": 10, "font-family": "monospace", fill: "#78716c",
        }));
      }
      svg.appendChild(svgEl("line", { x1: padL, y1: padT - 4, x2: padL + maxT * scale, y2: padT - 4, stroke: "#78716c" }));
      // Activities
      for (let i = 0; i < n; i++) {
        const y = padT + i * rowH;
        const x = padL + frame.s[i] * scale;
        const w = (frame.f[i] - frame.s[i]) * scale;
        let color = PALETTE.idle;
        if (frame.selected.has(i)) color = PALETTE.done;
        if (i === frame.k) color = "#fbbf24";
        if (frame.hi && frame.hi.m === i) color = PALETTE.active;
        svg.appendChild(svgEl("rect", {
          x, y, width: w, height: rowH - 6, rx: 4,
          fill: color, stroke: "#1f2937", "stroke-width": 1.5,
        }));
        svg.appendChild(svgText(`a${i + 1}`, {
          x: x + w / 2, y: y + 16, "text-anchor": "middle",
          "font-size": 11, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
        svg.appendChild(svgText(`[${frame.s[i]}, ${frame.f[i]}]`, {
          x: padL - 8, y: y + 18, "text-anchor": "end",
          "font-size": 10, "font-family": "monospace", fill: "#78716c",
        }));
      }
      svg.appendChild(svgText("Activity Selection — 종료 시간 기준 탐욕", {
        x: W / 2, y: 24, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     Huffman Coding
     ========================================================= */
  register("huffman", () => ({
    title: "Huffman Coding",
    legend: [
      { color: PALETTE.idle,    label: "Leaf 문자" },
      { color: PALETTE.active,  label: "EXTRACT-MIN" },
      { color: PALETTE.done,    label: "합친 내부 노드" },
    ],
    pseudocode: [
      ["HUFFMAN(C)", ""],
      ["  Q = C", "// min-heap"],
      ["  for i = 1 to n-1", ""],
      ["    z = new node", ""],
      ["    z.left = x = EXTRACT-MIN(Q)", ""],
      ["    z.right = y = EXTRACT-MIN(Q)", ""],
      ["    z.freq = x.freq + y.freq", ""],
      ["    INSERT(Q, z)", ""],
      ["  return EXTRACT-MIN(Q)", ""],
    ],
    build() {
      // input frequencies
      const input = [
        { ch: "f", freq: 5 },
        { ch: "e", freq: 9 },
        { ch: "c", freq: 12 },
        { ch: "b", freq: 13 },
        { ch: "d", freq: 16 },
        { ch: "a", freq: 45 },
      ];
      // build nodes
      let idCounter = 0;
      const nodes = input.map((x) => ({ id: idCounter++, ch: x.ch, freq: x.freq, left: null, right: null, internal: false }));
      let queue = [...nodes];
      const allNodes = [...nodes];

      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        queue: queue.map((q) => ({ ...q })),
        allNodes: allNodes.map((n) => ({ ...n })),
        edges: buildEdges(),
        line, msg, hi,
      });
      function buildEdges() {
        const es = [];
        for (const n of allNodes) {
          if (n.left != null) es.push([n.id, n.left]);
          if (n.right != null) es.push([n.id, n.right]);
        }
        return es;
      }

      snap(0, `빈도: ${input.map((x) => x.ch + ":" + x.freq).join(", ")}`);
      snap(1, "Q = C (최소 힙)");
      while (queue.length > 1) {
        queue.sort((a, b) => a.freq - b.freq);
        const x = queue.shift();
        snap(4, `x = EXTRACT-MIN → ${x.ch || "•"}(${x.freq})`, { extract: x.id });
        const y = queue.shift();
        snap(5, `y = EXTRACT-MIN → ${y.ch || "•"}(${y.freq})`, { extract: y.id });
        const z = { id: idCounter++, ch: null, freq: x.freq + y.freq, left: x.id, right: y.id, internal: true };
        allNodes.push(z);
        snap(6, `z.freq = ${x.freq} + ${y.freq} = ${z.freq}`, { newId: z.id });
        queue.push(z);
        snap(7, `INSERT(Q, z)`, { newId: z.id });
      }
      snap(8, "최종 허프만 트리 완성");
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 400;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      // Simple layout: assign positions by BFS-like. Place leaves on bottom row, internals above.
      const nodes = frame.allNodes;
      const edges = frame.edges;
      const positions = {};
      // find root(s): nodes not referenced as child
      const childIds = new Set();
      edges.forEach(([p, c]) => childIds.add(c));
      const roots = nodes.filter((n) => !childIds.has(n.id));
      // Layout each tree
      let offset = 40;
      roots.forEach((root) => {
        const leafCount = countLeaves(root.id);
        const width = Math.max(140, leafCount * 60);
        layout(root.id, offset, offset + width, 0);
        offset += width + 20;
      });
      function countLeaves(id) {
        const node = nodes.find((n) => n.id === id);
        if (!node || (node.left == null && node.right == null)) return 1;
        return countLeaves(node.left) + (node.right != null ? countLeaves(node.right) : 0);
      }
      function layout(id, l, r, depth) {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        const cx = (l + r) / 2;
        const cy = 80 + depth * 65;
        positions[id] = { x: cx, y: cy };
        if (node.left != null && node.right != null) {
          const ll = countLeaves(node.left);
          const rl = countLeaves(node.right);
          const split = l + ((r - l) * ll) / (ll + rl);
          layout(node.left, l, split, depth + 1);
          layout(node.right, split, r, depth + 1);
        }
      }
      // draw edges
      edges.forEach(([p, c]) => {
        if (!positions[p] || !positions[c]) return;
        const P = positions[p], C = positions[c];
        svg.appendChild(svgEl("line", {
          x1: P.x, y1: P.y, x2: C.x, y2: C.y,
          stroke: "#94a3b8", "stroke-width": 1.8,
        }));
      });
      // draw nodes
      nodes.forEach((n) => {
        const pos = positions[n.id];
        if (!pos) return;
        const hi = frame.hi || {};
        let color = n.internal ? PALETTE.done : PALETTE.idle;
        if (hi.newId === n.id) color = PALETTE.active;
        if (hi.extract === n.id) color = PALETTE.active;
        svg.appendChild(svgEl("circle", {
          cx: pos.x, cy: pos.y, r: 20,
          fill: color, stroke: "#1f2937", "stroke-width": 2,
        }));
        svg.appendChild(svgText(n.ch ? `${n.ch}:${n.freq}` : String(n.freq), {
          x: pos.x, y: pos.y + 4, "text-anchor": "middle",
          "font-size": 11, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      });
      svg.appendChild(svgText("Huffman Tree", {
        x: W / 2, y: 24, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     0-1 KNAPSACK — DP table fill
     K[i][w] = max value using first i items with capacity w
     ========================================================= */
  register("knapsack01", () => ({
    title: "0-1 Knapsack (DP)",
    legend: [
      { color: PALETTE.idle,    label: "미계산 셀" },
      { color: PALETTE.compare, label: "참조 셀 K[i-1][w] / K[i-1][w-wi]" },
      { color: PALETTE.active,  label: "현재 셀 K[i][w]" },
      { color: PALETTE.done,    label: "계산 완료" },
      { color: PALETTE.pivot,   label: "최적 해 K[n][W]" },
    ],
    pseudocode: [
      ["KNAPSACK-01(w[], v[], W)", ""],
      ["  for w = 0 to W: K[0][w] = 0", ""],
      ["  for i = 1 to n", ""],
      ["    for w = 0 to W", ""],
      ["      if w[i] > w: K[i][w] = K[i-1][w]", "// 못 넣음"],
      ["      else K[i][w] = max(", ""],
      ["         K[i-1][w],              ", "// 안 넣음"],
      ["         v[i] + K[i-1][w-w[i]])  ", "// 넣음"],
      ["  return K[n][W]", ""],
    ],
    editableInput: {
      label: "items (무게,가치; ...) | W — 예: 1,1; 3,4; 4,5; 5,7 | 7",
      defaultValue: "1,1; 3,4; 4,5; 5,7 | 7",
      parse(text) {
        const m = String(text).match(/^\s*(.+?)\s*\|\s*(\d+)\s*$/);
        if (!m) throw new Error("형식: '무게,가치; ... | W'");
        const items = m[1].split(";").map(s => s.trim()).filter(Boolean).map((pair) => {
          const p = pair.split(",").map(t => Number(t.trim()));
          if (p.length !== 2 || p.some(Number.isNaN) || p[0] <= 0) {
            throw new Error(`항목 오류: "${pair}" (형식: 무게,가치)`);
          }
          return { w: p[0], v: p[1] };
        });
        const W = +m[2];
        if (!items.length) throw new Error("아이템 1개 이상 필요");
        if (items.length > 8) throw new Error("아이템 최대 8개");
        if (W < 1 || W > 20) throw new Error("배낭 용량 1~20");
        return { items, W };
      },
    },
    build(input) {
      const { items, W } = input || {
        items: [{ w: 1, v: 1 }, { w: 3, v: 4 }, { w: 4, v: 5 }, { w: 5, v: 7 }],
        W: 7,
      };
      const n = items.length;
      const K = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
      const frames = [];
      const snap = (line, msg, extra = {}) => frames.push({
        K: K.map(row => [...row]),
        items, W, n,
        line, msg,
        cur: extra.cur ?? null,
        refs: extra.refs || [],
        highlightResult: extra.highlightResult ?? false,
      });

      snap(0, `items: ${items.map((it, i) => `(w${i+1}=${it.w}, v${i+1}=${it.v})`).join(", ")}, W=${W}`);
      snap(1, `K[0][·] = 0 (아이템 0개면 가치 0)`);
      for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= W; w++) {
          const it = items[i - 1];
          snap(3, `셀 K[${i}][${w}] 계산 — item ${i} (w=${it.w}, v=${it.v})`, {
            cur: [i, w],
          });
          if (it.w > w) {
            K[i][w] = K[i - 1][w];
            snap(4, `w[${i}]=${it.w} > ${w} → 못 넣음: K[${i}][${w}] = K[${i-1}][${w}] = ${K[i][w]}`, {
              cur: [i, w], refs: [[i - 1, w]],
            });
          } else {
            const skip = K[i - 1][w];
            const take = it.v + K[i - 1][w - it.w];
            K[i][w] = Math.max(skip, take);
            snap(5, `max(${skip}, ${it.v} + ${K[i - 1][w - it.w]}) = ${K[i][w]}`, {
              cur: [i, w], refs: [[i - 1, w], [i - 1, w - it.w]],
            });
          }
        }
      }
      snap(8, `최적해 K[${n}][${W}] = ${K[n][W]}`, {
        cur: [n, W], highlightResult: true,
      });
      return frames;
    },
    render(frame, svg) {
      const W_px = 760, H_px = 420;
      svg.setAttribute("viewBox", `0 0 ${W_px} ${H_px}`);
      const { K, n, W, cur, refs, highlightResult, items } = frame;
      const cols = W + 1, rows = n + 1;
      const padL = 90, padR = 40, padT = 60, padB = 50;
      const cellW = (W_px - padL - padR) / cols;
      const cellH = (H_px - padT - padB) / rows;

      svg.appendChild(svgText("0-1 Knapsack DP Table", {
        x: W_px / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));

      for (let w = 0; w <= W; w++) {
        svg.appendChild(svgText(String(w), {
          x: padL + (w + 0.5) * cellW, y: padT - 6,
          "text-anchor": "middle", "font-size": 11,
          "font-family": "monospace", fill: "#78716c",
        }));
      }
      svg.appendChild(svgText("w →", {
        x: padL - 8, y: padT - 6, "text-anchor": "end",
        "font-size": 11, "font-family": "monospace", fill: "#78716c",
      }));
      for (let i = 0; i <= n; i++) {
        const lbl = i === 0 ? "∅" : `(${items[i-1].w},${items[i-1].v})`;
        svg.appendChild(svgText(lbl, {
          x: padL - 8, y: padT + (i + 0.5) * cellH + 4, "text-anchor": "end",
          "font-size": 11, "font-family": "monospace", fill: "#78716c",
        }));
      }

      const refSet = new Set(refs.map(([i, w]) => `${i}:${w}`));
      for (let i = 0; i <= n; i++) {
        for (let w = 0; w <= W; w++) {
          const x = padL + w * cellW, y = padT + i * cellH;
          let fill = "#f5f5f4";
          let stroke = "#d4d4d4";
          if (cur && cur[0] === i && cur[1] === w) {
            fill = highlightResult ? PALETTE.pivot : PALETTE.active;
            stroke = "#1f2937";
          } else if (refSet.has(`${i}:${w}`)) {
            fill = PALETTE.compare;
          } else if (cur && (i < cur[0] || (i === cur[0] && w < cur[1]))) {
            fill = "#dcfce7";
          }
          svg.appendChild(svgEl("rect", {
            x, y, width: cellW, height: cellH, fill, stroke, "stroke-width": 1,
          }));
          svg.appendChild(svgText(String(K[i][w]), {
            x: x + cellW / 2, y: y + cellH / 2 + 4,
            "text-anchor": "middle", "font-size": 11, "font-family": "monospace",
            fill: "#1f2937",
          }));
        }
      }
    },
  }));

  /* =========================================================
     EDIT DISTANCE (Levenshtein) — DP table fill
     c[i][j] = min edits to turn X[1..i] into Y[1..j]
     ========================================================= */
  register("editDistance", () => ({
    title: "Edit Distance (Levenshtein DP)",
    legend: [
      { color: PALETTE.idle,    label: "미계산" },
      { color: PALETTE.compare, label: "참조 c[i-1][j-1/j], c[i][j-1]" },
      { color: PALETTE.active,  label: "현재 c[i][j]" },
      { color: PALETTE.done,    label: "계산 완료" },
      { color: PALETTE.pivot,   label: "최종 거리" },
    ],
    pseudocode: [
      ["EDIT-DISTANCE(X, Y)", ""],
      ["  m = |X|, n = |Y|", ""],
      ["  c[i][0] = i;  c[0][j] = j", "// 기저"],
      ["  for i = 1 to m", ""],
      ["    for j = 1 to n", ""],
      ["      if X[i] = Y[j]: c[i][j] = c[i-1][j-1]", "// 일치"],
      ["      else c[i][j] = 1 + min(", ""],
      ["         c[i-1][j],    ", "// 삭제"],
      ["         c[i][j-1],    ", "// 삽입"],
      ["         c[i-1][j-1])  ", "// 치환"],
      ["  return c[m][n]", ""],
    ],
    editableInput: {
      label: "두 문자열을 '|'로 구분 (예: kitten|sitting)",
      defaultValue: "kitten|sitting",
      parse(text) {
        const parts = String(text).split("|");
        if (parts.length !== 2) throw new Error("형식: 'X|Y'");
        const [X, Y] = parts.map(s => s.trim());
        if (!X.length || !Y.length) throw new Error("둘 다 1자 이상");
        if (X.length > 10 || Y.length > 10) throw new Error("각 10자 이하");
        return { X, Y };
      },
    },
    build(input) {
      const { X, Y } = input || { X: "kitten", Y: "sitting" };
      const m = X.length, n = Y.length;
      const c = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) c[i][0] = i;
      for (let j = 0; j <= n; j++) c[0][j] = j;

      const frames = [];
      const snap = (line, msg, extra = {}) => frames.push({
        c: c.map(row => [...row]), m, n, X, Y,
        line, msg,
        cur: extra.cur ?? null,
        refs: extra.refs || [],
        highlightResult: extra.highlightResult ?? false,
      });

      snap(0, `X = "${X}" (m=${m}), Y = "${Y}" (n=${n})`);
      snap(2, `기저: c[i][0] = i, c[0][j] = j`);
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          snap(4, `셀 c[${i}][${j}]: X[${i}]='${X[i-1]}', Y[${j}]='${Y[j-1]}'`, {
            cur: [i, j],
          });
          if (X[i - 1] === Y[j - 1]) {
            c[i][j] = c[i - 1][j - 1];
            snap(5, `일치 → c[${i}][${j}] = c[${i-1}][${j-1}] = ${c[i][j]}`, {
              cur: [i, j], refs: [[i - 1, j - 1]],
            });
          } else {
            const del = c[i - 1][j];
            const ins = c[i][j - 1];
            const sub = c[i - 1][j - 1];
            c[i][j] = 1 + Math.min(del, ins, sub);
            snap(6, `불일치 → 1 + min(${del}, ${ins}, ${sub}) = ${c[i][j]}`, {
              cur: [i, j], refs: [[i - 1, j], [i, j - 1], [i - 1, j - 1]],
            });
          }
        }
      }
      snap(10, `최종 거리 c[${m}][${n}] = ${c[m][n]}`, {
        cur: [m, n], highlightResult: true,
      });
      return frames;
    },
    render(frame, svg) {
      const W_px = 760, H_px = 420;
      svg.setAttribute("viewBox", `0 0 ${W_px} ${H_px}`);
      const { c, m, n, X, Y, cur, refs, highlightResult } = frame;
      const cols = n + 1, rows = m + 1;
      const padL = 70, padR = 40, padT = 70, padB = 40;
      const cellW = (W_px - padL - padR) / cols;
      const cellH = (H_px - padT - padB) / rows;

      svg.appendChild(svgText("Edit Distance DP Table", {
        x: W_px / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));

      const yHdr = [" ", ...Y.split("")];
      yHdr.forEach((ch, j) => {
        svg.appendChild(svgText(ch, {
          x: padL + (j + 0.5) * cellW, y: padT - 10, "text-anchor": "middle",
          "font-size": 13, "font-weight": 600, "font-family": "monospace", fill: "#1f2937",
        }));
      });
      const xHdr = [" ", ...X.split("")];
      xHdr.forEach((ch, i) => {
        svg.appendChild(svgText(ch, {
          x: padL - 14, y: padT + (i + 0.5) * cellH + 4, "text-anchor": "middle",
          "font-size": 13, "font-weight": 600, "font-family": "monospace", fill: "#1f2937",
        }));
      });

      const refSet = new Set(refs.map(([i, j]) => `${i}:${j}`));
      for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
          const x = padL + j * cellW, y = padT + i * cellH;
          let fill = "#f5f5f4";
          let stroke = "#d4d4d4";
          if (cur && cur[0] === i && cur[1] === j) {
            fill = highlightResult ? PALETTE.pivot : PALETTE.active;
            stroke = "#1f2937";
          } else if (refSet.has(`${i}:${j}`)) {
            fill = PALETTE.compare;
          } else if (cur && (i < cur[0] || (i === cur[0] && j < cur[1]))) {
            fill = "#dcfce7";
          }
          svg.appendChild(svgEl("rect", {
            x, y, width: cellW, height: cellH, fill, stroke, "stroke-width": 1,
          }));
          svg.appendChild(svgText(String(c[i][j]), {
            x: x + cellW / 2, y: y + cellH / 2 + 4,
            "text-anchor": "middle", "font-size": 11, "font-family": "monospace",
            fill: "#1f2937",
          }));
        }
      }
    },
  }));

  /* =========================================================
     LCS — Longest Common Subsequence (CLRS 15.4)
     점화식 (15.9):
       c[i,j] = 0                            if i=0 or j=0
              = c[i-1,j-1] + 1               if X_i == Y_j
              = max(c[i-1,j], c[i,j-1])      otherwise
     b[i,j] ∈ {↖, ↑, ←} 으로 역추적 방향 저장
     ========================================================= */
  register("lcs", () => ({
    title: "Longest Common Subsequence — LCS-LENGTH",
    legend: [
      { color: "#f5f5f4",       label: "미계산" },
      { color: PALETTE.compare, label: "참조 c[i-1][j-1] / c[i-1][j] / c[i][j-1]" },
      { color: PALETTE.active,  label: "현재 c[i][j]" },
      { color: "#dcfce7",       label: "계산 완료" },
      { color: PALETTE.pivot,   label: "역추적 LCS 경로" },
    ],
    pseudocode: [
      ["LCS-LENGTH(X, Y)", ""],
      ["  m = X.length, n = Y.length", ""],
      ["  c[i][0] = 0;  c[0][j] = 0", "// 기저"],
      ["  for i = 1 to m", ""],
      ["    for j = 1 to n", ""],
      ["      if X[i] == Y[j]:", "// 일치"],
      ["         c[i][j] = c[i-1][j-1] + 1; b[i][j] = '↖'", ""],
      ["      elif c[i-1][j] >= c[i][j-1]:", "// 위에서"],
      ["         c[i][j] = c[i-1][j]; b[i][j] = '↑'", ""],
      ["      else:", "// 왼쪽에서"],
      ["         c[i][j] = c[i][j-1]; b[i][j] = '←'", ""],
      ["  return c[m][n]  // = |LCS|", ""],
    ],
    editableInput: {
      label: "두 문자열을 '|'로 구분 (예: ABCBDAB|BDCABA)",
      defaultValue: "ABCBDAB|BDCABA",
      parse(text) {
        const parts = String(text).split("|");
        if (parts.length !== 2) throw new Error("형식: 'X|Y'");
        const [X, Y] = parts.map(s => s.trim());
        if (!X.length || !Y.length) throw new Error("둘 다 1자 이상");
        if (X.length > 10 || Y.length > 10) throw new Error("각 10자 이하");
        return { X, Y };
      },
    },
    build(input) {
      const { X, Y } = input || { X: "ABCBDAB", Y: "BDCABA" };
      const m = X.length, n = Y.length;
      const c = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      const b = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(""));

      const frames = [];
      const snap = (line, msg, extra = {}) => frames.push({
        c: c.map(row => [...row]),
        b: b.map(row => [...row]),
        m, n, X, Y,
        line, msg,
        cur: extra.cur ?? null,
        refs: extra.refs || [],
        pathCells: extra.pathCells || null,
        lcsString: extra.lcsString ?? null,
      });

      snap(0, `X = "${X}" (m=${m}), Y = "${Y}" (n=${n})`);
      snap(2, `기저: 첫 행/첫 열 = 0`);
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          snap(4, `셀 c[${i}][${j}]: X[${i}]='${X[i-1]}', Y[${j}]='${Y[j-1]}'`, {
            cur: [i, j],
          });
          if (X[i - 1] === Y[j - 1]) {
            c[i][j] = c[i - 1][j - 1] + 1;
            b[i][j] = "↖";
            snap(6, `일치 → c = c[${i-1}][${j-1}] + 1 = ${c[i][j]}, b='↖'`, {
              cur: [i, j], refs: [[i - 1, j - 1]],
            });
          } else if (c[i - 1][j] >= c[i][j - 1]) {
            c[i][j] = c[i - 1][j];
            b[i][j] = "↑";
            snap(8, `불일치, c[${i-1}][${j}]=${c[i-1][j]} ≥ c[${i}][${j-1}]=${c[i][j-1]} → c=${c[i][j]}, b='↑'`, {
              cur: [i, j], refs: [[i - 1, j], [i, j - 1]],
            });
          } else {
            c[i][j] = c[i][j - 1];
            b[i][j] = "←";
            snap(10, `불일치, c[${i-1}][${j}]=${c[i-1][j]} < c[${i}][${j-1}]=${c[i][j-1]} → c=${c[i][j]}, b='←'`, {
              cur: [i, j], refs: [[i - 1, j], [i, j - 1]],
            });
          }
        }
      }

      /* PRINT-LCS 역추적 (CLRS p.395) */
      const path = [];
      let lcs = "";
      let i = m, j = n;
      while (i > 0 && j > 0) {
        path.push([i, j]);
        if (b[i][j] === "↖") { lcs = X[i - 1] + lcs; i--; j--; }
        else if (b[i][j] === "↑") { i--; }
        else { j--; }
      }
      snap(11, `최종: |LCS| = c[${m}][${n}] = ${c[m][n]}, LCS = "${lcs}"`, {
        cur: [m, n], pathCells: path, lcsString: lcs,
      });
      return frames;
    },
    render(frame, svg) {
      const W_px = 760, H_px = 420;
      svg.setAttribute("viewBox", `0 0 ${W_px} ${H_px}`);
      const { c, b, m, n, X, Y, cur, refs, pathCells, lcsString } = frame;
      const cols = n + 1, rows = m + 1;
      const padL = 70, padR = 40, padT = 70, padB = 40;
      const cellW = (W_px - padL - padR) / cols;
      const cellH = (H_px - padT - padB) / rows;

      svg.appendChild(svgText("LCS DP Table", {
        x: W_px / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));

      if (lcsString != null) {
        svg.appendChild(svgText(`LCS = "${lcsString}"`, {
          x: W_px - 20, y: 22, "text-anchor": "end",
          "font-size": 13, "font-weight": 700, "font-family": "monospace",
          fill: "#7c3aed",
        }));
      }

      const yHdr = [" ", ...Y.split("")];
      yHdr.forEach((ch, j) => {
        svg.appendChild(svgText(ch, {
          x: padL + (j + 0.5) * cellW, y: padT - 10, "text-anchor": "middle",
          "font-size": 13, "font-weight": 600, "font-family": "monospace", fill: "#1f2937",
        }));
      });
      const xHdr = [" ", ...X.split("")];
      xHdr.forEach((ch, i) => {
        svg.appendChild(svgText(ch, {
          x: padL - 14, y: padT + (i + 0.5) * cellH + 4, "text-anchor": "middle",
          "font-size": 13, "font-weight": 600, "font-family": "monospace", fill: "#1f2937",
        }));
      });

      const refSet = new Set(refs.map(([i, j]) => `${i}:${j}`));
      const pathSet = new Set((pathCells || []).map(([i, j]) => `${i}:${j}`));
      for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
          const x = padL + j * cellW, y = padT + i * cellH;
          let fill = "#f5f5f4";
          let stroke = "#d4d4d4";
          if (pathSet.has(`${i}:${j}`)) {
            fill = PALETTE.pivot;
            stroke = "#1f2937";
          } else if (cur && cur[0] === i && cur[1] === j) {
            fill = PALETTE.active;
            stroke = "#1f2937";
          } else if (refSet.has(`${i}:${j}`)) {
            fill = PALETTE.compare;
          } else if (cur && (i < cur[0] || (i === cur[0] && j < cur[1]))) {
            fill = "#dcfce7";
          }
          svg.appendChild(svgEl("rect", {
            x, y, width: cellW, height: cellH, fill, stroke, "stroke-width": 1,
          }));
          const numText = String(c[i][j]);
          const arrowText = b[i][j] || "";
          const isPath = pathSet.has(`${i}:${j}`);
          const numFill = isPath ? "#fff" : "#1f2937";
          if (arrowText) {
            svg.appendChild(svgText(numText, {
              x: x + cellW / 2 - 7, y: y + cellH / 2 + 4,
              "text-anchor": "middle", "font-size": 11, "font-family": "monospace",
              fill: numFill, "font-weight": isPath ? 700 : 400,
            }));
            svg.appendChild(svgText(arrowText, {
              x: x + cellW / 2 + 8, y: y + cellH / 2 + 4,
              "text-anchor": "middle", "font-size": 11, "font-family": "monospace",
              fill: isPath ? "#fff" : "#7c3aed", "font-weight": 700,
            }));
          } else {
            svg.appendChild(svgText(numText, {
              x: x + cellW / 2, y: y + cellH / 2 + 4,
              "text-anchor": "middle", "font-size": 11, "font-family": "monospace",
              fill: numFill, "font-weight": isPath ? 700 : 400,
            }));
          }
        }
      }
    },
  }));
})();
