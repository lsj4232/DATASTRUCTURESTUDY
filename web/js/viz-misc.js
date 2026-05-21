/* =========================================================
   viz-misc.js — 5 신규 챕터 시각화 모듈
     · randSelect        (Ch 9  Order Statistics)
     · dynamicTable      (Ch 17 Amortized Analysis)
     · floydWarshall     (Ch 25 All-Pairs Shortest Paths)
     · maxFlow           (Ch 26 Maximum Flow — Ford-Fulkerson)
     · kmp               (Ch 32 String Matching — KMP)
   ========================================================= */
(function () {
  "use strict";
  const { register, svgEl, svgText, PALETTE } = window.VizCore;

  /* ---------------------------------------------------------
     1) RANDOMIZED-SELECT — 한쪽만 재귀하는 분할 정복
     --------------------------------------------------------- */
  register("randSelect", () => {
    const A0 = [3, 2, 9, 1, 7, 5, 8, 4, 6, 10];
    const target = 4; // i=4, 4번째 작은 값 = 4

    function partition(arr, p, r) {
      // Lomuto, pivot = arr[r]
      const x = arr[r];
      let i = p - 1;
      for (let j = p; j < r; j++) {
        if (arr[j] <= x) { i++; [arr[i], arr[j]] = [arr[j], arr[i]]; }
      }
      [arr[i + 1], arr[r]] = [arr[r], arr[i + 1]];
      return i + 1;
    }

    return {
      title: "RANDOMIZED-SELECT · i=4번째 작은 값 찾기",
      legend: [
        { color: PALETTE.idle,    label: "활성 구간" },
        { color: PALETTE.pivot,   label: "피벗" },
        { color: PALETTE.done,    label: "확정 (찾음)" },
        { color: PALETTE.ghost,   label: "탐색 제외" },
      ],
      pseudocode: [
        ["RANDOMIZED-SELECT(A, p, r, i)",        ""],
        ["if p == r: return A[p]",               "종료 조건"],
        ["q = RANDOMIZED-PARTITION(A, p, r)",    "무작위 분할"],
        ["k = q - p + 1",                        "피벗 순위"],
        ["if i == k: return A[q]",               "정답"],
        ["elseif i < k: recurse left",           "왼쪽만"],
        ["else: recurse right with i-k",         "오른쪽만"],
      ],
      build() {
        const frames = [];
        const A = A0.slice();
        frames.push({ A: A.slice(), p: 0, r: A.length - 1, q: null, ghost: [], line: 0, msg: "초기 배열, i=4 찾기" });

        // First call: p=0, r=9, simulate pivot selection A[7]=4 so after swap A[7]<->A[9], pivot=10 -> bad.
        // Actually let's control the pivot to be 8 by swapping index 6 with index 9: A[6]=8, A[9]=10 -> after swap A=[3,2,9,1,7,5,8,4,6,10] -> becomes [3,2,9,1,7,5,10,4,6,8]. Pivot=8.
        const A1 = A.slice();
        [A1[6], A1[9]] = [A1[9], A1[6]];
        frames.push({ A: A1.slice(), p: 0, r: 9, q: null, ghost: [], line: 2, msg: "무작위 피벗 선택 후 A[6]↔A[9], 피벗=8" });

        const A2 = A1.slice();
        const q1 = partition(A2, 0, 9);
        frames.push({ A: A2.slice(), p: 0, r: 9, q: q1, ghost: [], line: 2, msg: `분할 완료, 피벗 위치 q=${q1 + 1} (1-indexed)` });

        frames.push({ A: A2.slice(), p: 0, r: 9, q: q1, ghost: [], line: 3, msg: `k = ${q1 - 0 + 1}, i=4 < k → 왼쪽 재귀` });

        // Recurse on [0..q1-1]
        const ghost1 = [];
        for (let k = q1; k <= 9; k++) ghost1.push(k);
        frames.push({ A: A2.slice(), p: 0, r: q1 - 1, q: null, ghost: ghost1, line: 5, msg: `왼쪽 부분 [0..${q1 - 1}]로 재귀` });

        // Second call: pivot = last element of [0..q1-1], which is A2[q1-1]
        // Let's keep it simple: just pick a random pivot in range to drive to termination.
        // After partition of [0..q1-1] with pivot = whichever, we assume partition puts pivot at correct index.
        // Force termination: pivot turns out to be 4 (target), placed at index 3 (0-indexed) -> q=3, k=4, i=4, return.
        const A3 = A2.slice();
        // Find index of 4 in A3 within range [0, q1-1]
        let idx4 = A3.indexOf(4);
        if (idx4 > q1 - 1 || idx4 < 0) idx4 = q1 - 1;
        // Swap to end for partition
        [A3[idx4], A3[q1 - 1]] = [A3[q1 - 1], A3[idx4]];
        frames.push({ A: A3.slice(), p: 0, r: q1 - 1, q: null, ghost: ghost1, line: 2, msg: "무작위 선택으로 피벗=4" });

        const A4 = A3.slice();
        const q2 = partition(A4, 0, q1 - 1);
        frames.push({ A: A4.slice(), p: 0, r: q1 - 1, q: q2, ghost: ghost1, line: 2, msg: `분할 완료, 피벗 위치 q=${q2 + 1}` });

        frames.push({ A: A4.slice(), p: 0, r: q1 - 1, q: q2, ghost: ghost1, line: 4, msg: `k = ${q2 + 1}, i=4 == k → 정답!` });
        return frames;
      },
      render(frame, svg) {
        const W = 760, H = 280;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        const n = frame.A.length;
        const cellW = 56, cellH = 56;
        const totalW = n * cellW;
        const xOff = (W - totalW) / 2;
        const y = 80;

        frame.A.forEach((v, i) => {
          let fill = PALETTE.ghost;
          if (frame.ghost && frame.ghost.includes(i)) fill = PALETTE.ghost;
          else if (i >= frame.p && i <= frame.r) fill = PALETTE.idle;
          if (frame.q === i) fill = frame.line === 4 ? PALETTE.done : PALETTE.pivot;

          svg.appendChild(svgEl("rect", {
            x: xOff + i * cellW, y, width: cellW - 4, height: cellH,
            rx: 6, fill, stroke: "#1f2937", "stroke-width": 1.5,
          }));
          svg.appendChild(svgText(String(v), {
            x: xOff + i * cellW + (cellW - 4) / 2, y: y + cellH / 2 + 6,
            "text-anchor": "middle", "font-size": 18, "font-weight": 700,
            fill: "#fff", "font-family": "monospace",
          }));
          svg.appendChild(svgText(`[${i + 1}]`, {
            x: xOff + i * cellW + (cellW - 4) / 2, y: y + cellH + 16,
            "text-anchor": "middle", "font-size": 11,
            fill: "#78716c", "font-family": "monospace",
          }));
        });

        // p..r range indicator
        if (frame.p != null && frame.r != null && frame.p <= frame.r) {
          svg.appendChild(svgEl("line", {
            x1: xOff + frame.p * cellW, y1: y + cellH + 30,
            x2: xOff + frame.r * cellW + (cellW - 4), y2: y + cellH + 30,
            stroke: PALETTE.active, "stroke-width": 3,
          }));
          svg.appendChild(svgText(`활성 구간 [${frame.p + 1}..${frame.r + 1}]`, {
            x: W / 2, y: y + cellH + 48, "text-anchor": "middle",
            "font-size": 12, fill: "#44403c", "font-family": "sans-serif", "font-weight": 600,
          }));
        }

        svg.appendChild(svgText("목표: i = 4번째 작은 값 (정답 = 4)", {
          x: W / 2, y: 30, "text-anchor": "middle",
          "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
        }));
      },
    };
  });

  /* ---------------------------------------------------------
     2) Dynamic Table — 분할상환 O(1), 2배 확장
     --------------------------------------------------------- */
  register("dynamicTable", () => ({
    title: "Dynamic Table · 2배 확장",
    legend: [
      { color: PALETTE.idle,  label: "원소" },
      { color: PALETTE.ghost, label: "빈 슬롯" },
      { color: PALETTE.done,  label: "이전 테이블 (해제됨)" },
      { color: PALETTE.active,label: "새 원소" },
    ],
    pseudocode: [
      ["TABLE-INSERT(T, x)",         ""],
      ["if T.num == T.size",         "가득?"],
      ["  allocate 2·T.size",        "두 배 확장"],
      ["  copy all items",           "복사 O(num)"],
      ["insert x",                   "원소 추가"],
      ["T.num += 1",                 ""],
    ],
    build() {
      const frames = [];
      let size = 0, num = 0;
      const history = [];

      function snap(line, msg, extra = {}) {
        frames.push({ size, num, history: history.slice(), line, msg, ...extra });
      }

      snap(0, "초기: size=0, num=0, Φ=0", { phi: 0, amort: 0, cost: 0 });

      for (let i = 1; i <= 8; i++) {
        let cost = 1;
        let expand = false;
        if (num === size) {
          // Expand
          if (size === 0) size = 1;
          else {
            const oldSize = size;
            cost = num + 1; // copy num + insert new
            size = size * 2;
            expand = true;
          }
        }
        num += 1;
        history.push(i);
        const phi = 2 * num - size;
        const prevPhi = frames[frames.length - 1].phi ?? 0;
        const amort = cost + (phi - prevPhi);
        snap(expand ? 4 : 5, `i=${i} 삽입${expand ? " (확장)" : ""}: c=${cost}, Φ=${phi}, ĉ=${amort}`, { phi, amort, cost, newest: i, expanded: expand });
      }
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 380;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const size = frame.size || 1;
      const cellW = Math.min(54, Math.floor((W - 40) / Math.max(size, 8)));
      const cellH = 44;
      const startX = (W - size * cellW) / 2;
      const y = 80;

      // Title
      svg.appendChild(svgText(`Table — size=${frame.size}, num=${frame.num}`, {
        x: W / 2, y: 32, "text-anchor": "middle",
        "font-size": 16, "font-weight": 700, "font-family": "sans-serif", fill: "#44403c",
      }));

      for (let i = 0; i < size; i++) {
        const filled = i < frame.num;
        const isNewest = filled && frame.history[i] === frame.newest;
        const fill = !filled ? PALETTE.ghost : isNewest ? PALETTE.active : PALETTE.idle;
        svg.appendChild(svgEl("rect", {
          x: startX + i * cellW, y, width: cellW - 3, height: cellH,
          rx: 4, fill, stroke: "#1f2937", "stroke-width": 1.5,
        }));
        if (filled) {
          svg.appendChild(svgText(String(frame.history[i]), {
            x: startX + i * cellW + (cellW - 3) / 2, y: y + cellH / 2 + 6,
            "text-anchor": "middle", "font-size": 16, "font-weight": 700,
            fill: "#fff", "font-family": "monospace",
          }));
        }
      }

      // Metrics box
      const bx = 40, by = 180;
      svg.appendChild(svgEl("rect", { x: bx, y: by, width: W - 80, height: 150, rx: 10, fill: "#f8fafc", stroke: "#cbd5e1" }));
      const lines = [
        `실제 비용 c_i = ${frame.cost ?? 0}`,
        `포텐셜 Φ = 2·num − size = ${frame.phi ?? 0}`,
        `분할상환 ĉ_i = c_i + ΔΦ = ${frame.amort ?? 0}`,
        `상한 ĉ_i ≤ 3 (항상)`,
      ];
      lines.forEach((t, i) => {
        svg.appendChild(svgText(t, {
          x: bx + 20, y: by + 30 + i * 28,
          "font-size": 15, "font-family": "monospace", fill: "#1f2937",
        }));
      });
    },
  }));

  /* ---------------------------------------------------------
     3) Floyd-Warshall — n×n 행렬 진화
     --------------------------------------------------------- */
  register("floydWarshall", () => {
    const INF = Infinity;
    const n = 5; // 5×5 example
    const W0 = [
      [0, 3, 8, INF, -4],
      [INF, 0, INF, 1, 7],
      [INF, 4, 0, INF, INF],
      [2, INF, -5, 0, INF],
      [INF, INF, INF, 6, 0],
    ];
    return {
      title: "Floyd-Warshall · D^(k) 행렬 진화",
      legend: [
        { color: "#fff",        label: "∞ 또는 0" },
        { color: PALETTE.idle,  label: "값 있음" },
        { color: PALETTE.active,label: "이번 반복에서 갱신" },
        { color: PALETTE.pivot, label: "현재 k (경유 정점)" },
      ],
      pseudocode: [
        ["FLOYD-WARSHALL(W)",        ""],
        ["D^(0) = W",                "초기"],
        ["for k = 1 to n",           "중간 정점"],
        ["  for i = 1 to n",         "출발"],
        ["    for j = 1 to n",       "도착"],
        ["      d_ij^(k) = min(",    ""],
        ["        d_ij^(k-1),",      "k 미경유"],
        ["        d_ik + d_kj)",     "k 경유"],
        ["return D^(n)",             "최종"],
      ],
      build() {
        const frames = [];
        // D layers
        let D = W0.map((r) => r.slice());
        frames.push({ D: D.map((r) => r.slice()), k: 0, updated: [], line: 1, msg: "D^(0) = W (초기)" });

        for (let k = 0; k < n; k++) {
          const newD = D.map((r) => r.slice());
          const updated = [];
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              const via = D[i][k] + D[k][j];
              if (via < newD[i][j]) {
                newD[i][j] = via;
                updated.push([i, j]);
              }
            }
          }
          D = newD;
          frames.push({
            D: D.map((r) => r.slice()),
            k: k + 1,
            updated,
            line: 5,
            msg: `k = ${k + 1}: ${updated.length}개 셀 갱신 (${k + 1}번 정점 경유)`,
          });
        }
        frames.push({ D: D.map((r) => r.slice()), k: n, updated: [], line: 8, msg: "최종 D^(n)" });
        return frames;
      },
      render(frame, svg) {
        const W = 760, H = 380;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        const cellW = 60, cellH = 50;
        const offX = (W - n * cellW) / 2;
        const offY = 60;

        // Column headers
        for (let j = 0; j < n; j++) {
          svg.appendChild(svgText(`→ ${j + 1}`, {
            x: offX + j * cellW + cellW / 2, y: offY - 10,
            "text-anchor": "middle", "font-size": 12, "font-weight": 600,
            fill: "#44403c", "font-family": "monospace",
          }));
        }

        // Draw cells
        for (let i = 0; i < n; i++) {
          svg.appendChild(svgText(`${i + 1} ↓`, {
            x: offX - 30, y: offY + i * cellH + cellH / 2 + 6,
            "text-anchor": "middle", "font-size": 12, "font-weight": 600,
            fill: "#44403c", "font-family": "monospace",
          }));
          for (let j = 0; j < n; j++) {
            const v = frame.D[i][j];
            const wasUpdated = frame.updated.some(([a, b]) => a === i && b === j);
            const isK = frame.k > 0 && (i === frame.k - 1 || j === frame.k - 1);
            let fill = v === Infinity ? "#f1f5f9" : v === 0 ? "#e0e7ff" : "#dbeafe";
            if (wasUpdated) fill = "#fecaca";
            else if (isK) fill = "#f3e8ff";

            svg.appendChild(svgEl("rect", {
              x: offX + j * cellW, y: offY + i * cellH,
              width: cellW - 3, height: cellH - 3,
              fill, stroke: "#1f2937", "stroke-width": 1,
            }));
            const text = v === Infinity ? "∞" : String(v);
            svg.appendChild(svgText(text, {
              x: offX + j * cellW + (cellW - 3) / 2,
              y: offY + i * cellH + (cellH - 3) / 2 + 5,
              "text-anchor": "middle", "font-size": 15, "font-weight": 700,
              fill: v === Infinity ? "#94a3b8" : "#1e293b",
              "font-family": "monospace",
            }));
          }
        }

        svg.appendChild(svgText(`D^(${frame.k})`, {
          x: W / 2, y: 30, "text-anchor": "middle",
          "font-size": 16, "font-weight": 700, "font-family": "sans-serif", fill: "#44403c",
        }));
      },
    };
  });

  /* ---------------------------------------------------------
     4) Ford-Fulkerson Max Flow
     --------------------------------------------------------- */
  register("maxFlow", () => {
    const nodes = [
      { id: "s", x: 100, y: 200 }, { id: "a", x: 300, y: 100 },
      { id: "b", x: 300, y: 300 }, { id: "t", x: 500, y: 200 },
    ];
    const edges = [
      { u: "s", v: "a", cap: 10 }, { u: "s", v: "b", cap: 10 },
      { u: "a", v: "b", cap: 2 }, { u: "a", v: "t", cap: 8 },
      { u: "b", v: "t", cap: 10 },
    ];
    return {
      title: "Ford-Fulkerson · 증대 경로 반복",
      legend: [
        { color: PALETTE.idle,  label: "일반 간선" },
        { color: PALETTE.active,label: "증대 경로" },
        { color: PALETTE.done,  label: "포화 간선" },
      ],
      pseudocode: [
        ["FORD-FULKERSON(G, s, t)",       ""],
        ["initialize all f = 0",          ""],
        ["while augmenting path exists",  "잔여 그래프에서 BFS"],
        ["  find p: s → t in G_f",        ""],
        ["  c_f(p) = min edge capacity",  "병목"],
        ["  augment flow along p",        ""],
        ["return |f|",                    "최대 유량"],
      ],
      build() {
        const frames = [];
        const flow = {};
        edges.forEach((e) => { flow[`${e.u}-${e.v}`] = 0; });
        function snap(line, msg, path = null, extra = {}) {
          const fcopy = { ...flow };
          frames.push({ flow: fcopy, path, line, msg, ...extra });
        }
        snap(1, "초기 유량 모두 0, |f| = 0");

        // Iter 1: s → a → t, c_f = min(10, 8) = 8
        snap(3, "BFS로 증대 경로 탐색: s → a → t", ["s", "a", "t"]);
        flow["s-a"] = 8; flow["a-t"] = 8;
        snap(5, "경로 따라 8 증가: |f| = 8", ["s", "a", "t"]);

        // Iter 2: s → b → t, c_f = 10
        snap(3, "다음 증대 경로: s → b → t", ["s", "b", "t"]);
        flow["s-b"] = 10; flow["b-t"] = 10;
        snap(5, "경로 따라 10 증가: |f| = 18", ["s", "b", "t"]);

        // Iter 3: Check for any more augmenting paths
        snap(3, "잔여 네트워크 탐색: 증대 경로 없음 (s→a는 2 남았지만 a→t=0, a→b=2, b→t=0)");
        snap(6, "최대 유량 |f| = 18", null, { done: true });
        return frames;
      },
      render(frame, svg) {
        const W = 760, H = 400;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

        // Edges
        edges.forEach((e) => {
          const u = nodes.find((n) => n.id === e.u);
          const v = nodes.find((n) => n.id === e.v);
          const f = frame.flow[`${e.u}-${e.v}`];
          const saturated = f === e.cap;
          const inPath = frame.path && frame.path.includes(e.u) && frame.path.includes(e.v)
                          && frame.path.indexOf(e.u) + 1 === frame.path.indexOf(e.v);
          let color = PALETTE.idle;
          if (inPath) color = PALETTE.active;
          else if (saturated) color = PALETTE.done;

          svg.appendChild(svgEl("line", {
            x1: u.x, y1: u.y, x2: v.x, y2: v.y,
            stroke: color, "stroke-width": inPath ? 4 : 2,
          }));
          // Arrow
          const dx = v.x - u.x, dy = v.y - u.y;
          const len = Math.hypot(dx, dy);
          const px = v.x - (dx / len) * 35;
          const py = v.y - (dy / len) * 35;
          const angle = Math.atan2(dy, dx);
          svg.appendChild(svgEl("polygon", {
            points: [
              [px, py],
              [px - 10 * Math.cos(angle - Math.PI / 6), py - 10 * Math.sin(angle - Math.PI / 6)],
              [px - 10 * Math.cos(angle + Math.PI / 6), py - 10 * Math.sin(angle + Math.PI / 6)],
            ].map((p) => p.join(",")).join(" "),
            fill: color,
          }));
          // Label
          const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
          svg.appendChild(svgEl("rect", {
            x: mx - 30, y: my - 12, width: 60, height: 24, rx: 4,
            fill: "#fff", stroke: "#1f2937",
          }));
          svg.appendChild(svgText(`${f}/${e.cap}`, {
            x: mx, y: my + 5, "text-anchor": "middle", "font-size": 12,
            "font-weight": 700, "font-family": "monospace",
            fill: saturated ? PALETTE.done : "#1f2937",
          }));
        });

        // Nodes
        nodes.forEach((n) => {
          const special = n.id === "s" || n.id === "t";
          svg.appendChild(svgEl("circle", {
            cx: n.x, cy: n.y, r: 28,
            fill: special ? PALETTE.pivot : "#f1f5f9",
            stroke: "#1f2937", "stroke-width": 2,
          }));
          svg.appendChild(svgText(n.id, {
            x: n.x, y: n.y + 6, "text-anchor": "middle",
            "font-size": 18, "font-weight": 700,
            fill: special ? "#fff" : "#1f2937", "font-family": "monospace",
          }));
        });

        // Total flow
        const totalFlow = (frame.flow["s-a"] || 0) + (frame.flow["s-b"] || 0);
        svg.appendChild(svgText(`총 유량 |f| = ${totalFlow}${frame.done ? " (최대!)" : ""}`, {
          x: W / 2, y: 30, "text-anchor": "middle",
          "font-size": 16, "font-weight": 700, "font-family": "sans-serif",
          fill: frame.done ? PALETTE.done : "#44403c",
        }));
      },
    };
  });

  /* ---------------------------------------------------------
     5) KMP String Matching
     --------------------------------------------------------- */
  register("kmp", () => {
    const T = "abababacaba";
    const P = "ababaca";
    const pi = [0, 0, 1, 2, 3, 0, 1];
    return {
      title: `KMP · T="${T}" P="${P}"`,
      legend: [
        { color: PALETTE.idle,    label: "미검사" },
        { color: PALETTE.compare, label: "비교 중" },
        { color: PALETTE.done,    label: "일치" },
        { color: PALETTE.active,  label: "불일치 → π 점프" },
        { color: PALETTE.pivot,   label: "매칭 발견" },
      ],
      pseudocode: [
        ["KMP-MATCHER(T, P)",                   ""],
        ["π = COMPUTE-PREFIX-FUNCTION(P)",      "전처리"],
        ["q = 0",                               "매칭된 문자 수"],
        ["for i = 1 to n",                      ""],
        ["  while q>0 and P[q+1]≠T[i]",         "불일치시"],
        ["    q = π[q]",                        "점프"],
        ["  if P[q+1] == T[i]: q++",            "일치"],
        ["  if q == m: match at i-m+1",         "매칭!"],
      ],
      build() {
        const frames = [];
        let q = 0;
        const n = T.length, m = P.length;

        function snap(line, msg, extra = {}) {
          frames.push({ T, P, pi, i: extra.i ?? 0, q, line, msg, ...extra });
        }
        snap(0, `π 배열 = [${pi.join(", ")}]`);

        for (let i = 0; i < n; i++) {
          while (q > 0 && P[q] !== T[i]) {
            snap(4, `i=${i + 1}, T[${i + 1}]='${T[i]}' ≠ P[${q + 1}]='${P[q]}', π 점프 q=${q}→${pi[q - 1]}`, { i, mismatch: true });
            q = pi[q - 1];
          }
          if (P[q] === T[i]) {
            q++;
            snap(6, `T[${i + 1}]='${T[i]}' == P[${q}]='${P[q - 1]}', q=${q}`, { i, match: true });
          } else {
            snap(4, `T[${i + 1}]='${T[i]}' ≠ P[1]='${P[0]}', q=0 유지`, { i });
          }
          if (q === m) {
            snap(7, `매칭 발견! shift = ${i - m + 1}`, { i, matched: true });
            q = pi[q - 1];
          }
        }
        snap(0, `완료. 매칭 1개 (shift=3)`, { done: true });
        return frames;
      },
      render(frame, svg) {
        const W = 760, H = 320;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        const cellW = 44, cellH = 44;
        const n = frame.T.length, m = frame.P.length;

        // Text row
        const tStartX = (W - n * cellW) / 2;
        const tY = 80;
        svg.appendChild(svgText("T (텍스트)", {
          x: tStartX - 80, y: tY + cellH / 2 + 6,
          "font-size": 13, "font-family": "sans-serif", "font-weight": 600, fill: "#44403c",
        }));
        for (let i = 0; i < n; i++) {
          let fill = PALETTE.idle;
          if (i === frame.i) fill = frame.mismatch ? PALETTE.active : frame.matched ? PALETTE.pivot : PALETTE.compare;
          else if (i < frame.i) fill = PALETTE.ghost;
          svg.appendChild(svgEl("rect", {
            x: tStartX + i * cellW, y: tY, width: cellW - 2, height: cellH,
            fill, stroke: "#1f2937", "stroke-width": 1.5,
          }));
          svg.appendChild(svgText(frame.T[i], {
            x: tStartX + i * cellW + (cellW - 2) / 2, y: tY + cellH / 2 + 6,
            "text-anchor": "middle", "font-size": 18, "font-weight": 700,
            fill: "#fff", "font-family": "monospace",
          }));
        }

        // Pattern row (shifted to align with i-q+1)
        const shift = Math.max(0, frame.i - frame.q + 1);
        const pStartX = tStartX + shift * cellW;
        const pY = 180;
        svg.appendChild(svgText("P (패턴)", {
          x: tStartX - 80, y: pY + cellH / 2 + 6,
          "font-size": 13, "font-family": "sans-serif", "font-weight": 600, fill: "#44403c",
        }));
        for (let j = 0; j < m; j++) {
          let fill = PALETTE.idle;
          if (j < frame.q) fill = PALETTE.done;
          else if (j === frame.q) fill = frame.match ? PALETTE.done : PALETTE.compare;

          svg.appendChild(svgEl("rect", {
            x: pStartX + j * cellW, y: pY, width: cellW - 2, height: cellH,
            fill, stroke: "#1f2937", "stroke-width": 1.5,
          }));
          svg.appendChild(svgText(frame.P[j], {
            x: pStartX + j * cellW + (cellW - 2) / 2, y: pY + cellH / 2 + 6,
            "text-anchor": "middle", "font-size": 18, "font-weight": 700,
            fill: "#fff", "font-family": "monospace",
          }));
        }

        // Alignment lines
        for (let j = 0; j < frame.q; j++) {
          svg.appendChild(svgEl("line", {
            x1: pStartX + j * cellW + (cellW - 2) / 2,
            y1: tY + cellH + 2,
            x2: pStartX + j * cellW + (cellW - 2) / 2,
            y2: pY - 2,
            stroke: PALETTE.done, "stroke-width": 1, "stroke-dasharray": "2 2",
          }));
        }

        // q indicator
        svg.appendChild(svgText(`q = ${frame.q}`, {
          x: W / 2, y: 30, "text-anchor": "middle",
          "font-size": 14, "font-weight": 700, "font-family": "monospace", fill: "#44403c",
        }));
      },
    };
  });

  /* =========================================================
     HIRE-ASSISTANT (CLRS 5.1)
     n명 후보 중 현재 best보다 나은 후보가 나오면 고용.
     지시변수 X_i에 대한 기대값 E[X] = H_n
     ========================================================= */
  register("hireAssistant", () => ({
    title: "HIRE-ASSISTANT (지시 변수)",
    legend: [
      { color: PALETTE.idle,    label: "미인터뷰" },
      { color: PALETTE.active,  label: "현재 인터뷰" },
      { color: PALETTE.compare, label: "거절" },
      { color: PALETTE.done,    label: "고용 (누적 best)" },
      { color: PALETTE.pivot,   label: "방금 고용 (이전 해고)" },
    ],
    pseudocode: [
      ["HIRE-ASSISTANT(n)", ""],
      ["  best = 0  // dummy, rank = -∞", ""],
      ["  for i = 1 to n", ""],
      ["    interview candidate i", ""],
      ["    if rank[i] > rank[best]", ""],
      ["      best = i", ""],
      ["      hire candidate i  // X_i = 1", ""],
      ["",  ""],
      ["E[X] = Σ Pr[X_i=1] = Σ 1/i = H_n ≈ ln n", ""],
    ],
    editableInput: {
      label: "후보 rank 순열 (1..n):",
      defaultValue: "3, 1, 5, 2, 9, 4, 8, 6, 7",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map(Number);
        if (arr.some(Number.isNaN)) throw new Error("숫자만 허용");
        if (arr.length < 2) throw new Error("최소 2명");
        if (arr.length > 20) throw new Error("최대 20명");
        const sorted = [...arr].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length; i++) {
          if (sorted[i] !== i + 1) throw new Error("1..n 순열이어야 함");
        }
        return arr;
      },
    },
    build(input) {
      const ranks = Array.isArray(input) ? input.slice() : [3, 1, 5, 2, 9, 4, 8, 6, 7];
      const n = ranks.length;
      const frames = [];
      const status = new Array(n).fill("idle");
      let bestRank = -Infinity, bestIdx = -1, hires = 0;

      const snap = (line, msg) => frames.push({
        ranks: [...ranks], status: [...status],
        bestIdx, bestRank, hires, line, msg,
      });

      snap(0, `${n}명 후보 rank 배열: [${ranks.join(", ")}]`);
      snap(1, `best = dummy (rank = -∞), hires = 0`);

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (status[j] === "new-hire") status[j] = "hired";
        }
        status[i] = "current";
        snap(3, `[${i + 1}] 후보 ${i + 1} 인터뷰 — rank = ${ranks[i]}`);
        if (ranks[i] > bestRank) {
          if (bestIdx >= 0) status[bestIdx] = "rejected";
          const oldBest = bestRank === -Infinity ? "−∞" : bestRank;
          bestIdx = i; bestRank = ranks[i]; hires += 1;
          status[i] = "new-hire";
          snap(5, `rank[${i + 1}]=${ranks[i]} > ${oldBest} → 고용! (누적 ${hires}회)`);
        } else {
          status[i] = "rejected";
          snap(4, `rank[${i + 1}]=${ranks[i]} ≤ ${bestRank} → 거절`);
        }
      }
      for (let j = 0; j < n; j++) {
        if (status[j] === "new-hire") status[j] = "hired";
      }
      const Hn = ranks.reduce((s, _, i) => s + 1 / (i + 1), 0);
      snap(8, `총 고용 ${hires}회. H_${n} ≈ ${Hn.toFixed(3)} (기대값)`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText("HIRE-ASSISTANT — 지시변수 X_i의 직관", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      const n = frame.ranks.length;
      const padL = 40, padR = 40;
      const slotW = (W - padL - padR) / n;
      for (let i = 0; i < n; i++) {
        const x = padL + i * slotW + slotW / 2;
        const y = 140;
        const colorMap = {
          idle: PALETTE.idle, current: PALETTE.active,
          rejected: PALETTE.compare, hired: PALETTE.done,
          "new-hire": PALETTE.pivot,
        };
        const fill = colorMap[frame.status[i]] || PALETTE.idle;
        const r = Math.min(24, slotW / 2 - 4);
        svg.appendChild(svgEl("circle", {
          cx: x, cy: y, r, fill, stroke: "#1f2937", "stroke-width": 2,
        }));
        svg.appendChild(svgText(String(frame.ranks[i]), {
          x, y: y + 5, "text-anchor": "middle",
          "font-size": 13, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
        svg.appendChild(svgText(`#${i + 1}`, {
          x, y: y + r + 18, "text-anchor": "middle",
          "font-size": 10, "font-family": "monospace", fill: "#78716c",
        }));
      }
      svg.appendChild(svgText(
        `누적 고용 횟수: ${frame.hires}` +
        (frame.bestIdx >= 0
          ? `   |   현재 best: #${frame.bestIdx + 1} (rank ${frame.bestRank})`
          : ""),
        { x: W / 2, y: H - 70, "text-anchor": "middle",
          "font-size": 13, "font-weight": 600, "font-family": "monospace", fill: "#44403c" }
      ));
      svg.appendChild(svgText(
        "X_i = 1 ⟺ i가 고용됨. 무작위 순열 가정 하에 E[X_i] = 1/i",
        { x: W / 2, y: H - 45, "text-anchor": "middle",
          "font-size": 11, "font-family": "monospace", fill: "#78716c" }
      ));
    },
  }));

  /* =========================================================
     EUCLID's GCD — 재귀 체인
     ========================================================= */
  register("euclidGcd", () => ({
    title: "Euclid's GCD",
    legend: [
      { color: PALETTE.idle,    label: "이전 호출" },
      { color: PALETTE.active,  label: "현재 재귀 프레임" },
      { color: PALETTE.done,    label: "기저: b = 0 → return a" },
    ],
    pseudocode: [
      ["EUCLID(a, b)", ""],
      ["  if b == 0: return a", ""],
      ["  return EUCLID(b, a mod b)", ""],
      ["", ""],
      ["Lamé: 연속 Fibonacci 수가 최악 입력", ""],
      ["재귀 깊이 ≤ log_φ(b) + O(1)", ""],
    ],
    editableInput: {
      label: "두 양의 정수 (쉼표/공백):",
      defaultValue: "30, 21",
      parse(text) {
        const parts = String(text).split(/[,\s]+/).filter(Boolean).map(Number);
        if (parts.length !== 2) throw new Error("정확히 2개 정수");
        if (parts.some(n => !Number.isInteger(n) || n <= 0)) {
          throw new Error("양의 정수만 허용");
        }
        if (parts.some(n => n > 100000)) throw new Error("각 100000 이하");
        return parts;
      },
    },
    build(input) {
      const [A, B] = Array.isArray(input) ? input : [30, 21];
      const frames = [];
      const calls = [];
      const snap = (line, msg, activeDepth = null) => frames.push({
        A, B, calls: calls.map(c => ({ ...c })),
        line, msg, activeDepth,
      });

      snap(0, `EUCLID(${A}, ${B}) 호출 시작`);
      let a = A, b = B;
      let safety = 0;
      while (safety++ < 200) {
        calls.push({ a, b, result: null, isBase: false });
        const d = calls.length - 1;
        snap(0, `EUCLID(${a}, ${b}) 진입`, d);
        if (b === 0) {
          calls[d].result = a;
          calls[d].isBase = true;
          snap(1, `b == 0 → return a = ${a}`, d);
          break;
        }
        const na = b, nb = a % b;
        snap(2, `${a} mod ${b} = ${nb} → EUCLID(${na}, ${nb})`, d);
        a = na; b = nb;
      }
      const final = calls[calls.length - 1].result;
      for (let i = calls.length - 2; i >= 0; i--) calls[i].result = final;
      snap(0, `GCD(${A}, ${B}) = ${final}`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText(`GCD(${frame.A}, ${frame.B}) — 재귀 체인`, {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      const n = frame.calls.length;
      if (n === 0) return;
      const padT = 60, padB = 40;
      const rowH = Math.min(52, (H - padT - padB) / Math.max(n, 1));
      frame.calls.forEach((c, i) => {
        const y = padT + i * rowH;
        let fill = PALETTE.idle, stroke = "#d4d4d4";
        if (i === frame.activeDepth) { fill = PALETTE.active; stroke = "#1f2937"; }
        else if (c.isBase) { fill = PALETTE.done; stroke = "#1f2937"; }
        svg.appendChild(svgEl("rect", {
          x: 120, y: y + 4, width: W - 240, height: rowH - 12, rx: 8,
          fill, stroke, "stroke-width": 2,
        }));
        const indent = "  ".repeat(i);
        const text = c.isBase
          ? `${indent}EUCLID(${c.a}, ${c.b}) = ${c.result}   ← 기저`
          : `${indent}EUCLID(${c.a}, ${c.b})${c.result != null ? ` = ${c.result}` : ""}`;
        svg.appendChild(svgText(text, {
          x: 140, y: y + rowH / 2 + 2, "text-anchor": "start",
          "font-size": 14, "font-family": "monospace", "font-weight": 700,
          fill: (i === frame.activeDepth || c.isBase) ? "#fff" : "#1c1917",
        }));
        svg.appendChild(svgText(`d=${i}`, {
          x: 110, y: y + rowH / 2 + 2, "text-anchor": "end",
          "font-size": 10, "font-family": "monospace", fill: "#78716c",
        }));
      });
    },
  }));

  /* =========================================================
     GRAHAM SCAN — 볼록 껍질 (Convex Hull)
     ========================================================= */
  register("grahamScan", () => ({
    title: "Graham's Scan — Convex Hull",
    legend: [
      { color: PALETTE.idle,    label: "점" },
      { color: PALETTE.pivot,   label: "p₀ (최하단)" },
      { color: PALETTE.active,  label: "현재 pᵢ" },
      { color: PALETTE.compare, label: "스택 top-2" },
      { color: PALETTE.done,    label: "hull 후보 (스택)" },
    ],
    pseudocode: [
      ["GRAHAM-SCAN(P)", ""],
      ["  p₀ = argmin y (동점 → min x)", ""],
      ["  p₀ 기준 극각 오름차순 정렬", ""],
      ["  S.push(p₀), push(p₁), push(p₂)", ""],
      ["  for i = 3 to m", ""],
      ["    while cross(top-2, top, pᵢ) ≤ 0", ""],
      ["      S.pop()", ""],
      ["    S.push(pᵢ)", ""],
      ["  return S", ""],
    ],
    editableInput: {
      label: "점들 'x,y; ...' (3~25개):",
      defaultValue: "7,1; 12,3; 14,7; 11,11; 6,13; 2,10; 1,5; 8,5; 9,8; 5,8; 10,2; 4,2",
      parse(text) {
        const parts = String(text).split(";").map(s => s.trim()).filter(Boolean);
        if (parts.length < 3) throw new Error("3개 이상");
        if (parts.length > 25) throw new Error("25개 이하");
        const pts = parts.map(p => {
          const [x, y] = p.split(",").map(t => Number(t.trim()));
          if ([x, y].some(Number.isNaN)) throw new Error(`포맷: "${p}"`);
          return { x, y };
        });
        return pts;
      },
    },
    build(input) {
      const raw = Array.isArray(input) ? input.slice() : [
        { x: 7, y: 1 }, { x: 12, y: 3 }, { x: 14, y: 7 }, { x: 11, y: 11 },
        { x: 6, y: 13 }, { x: 2, y: 10 }, { x: 1, y: 5 }, { x: 8, y: 5 },
        { x: 9, y: 8 }, { x: 5, y: 8 }, { x: 10, y: 2 }, { x: 4, y: 2 },
      ];
      const pts = raw.map((p, i) => ({ ...p, origIdx: i }));
      const frames = [];
      let p0Idx = 0;
      for (let i = 1; i < pts.length; i++) {
        if (pts[i].y < pts[p0Idx].y ||
            (pts[i].y === pts[p0Idx].y && pts[i].x < pts[p0Idx].x)) p0Idx = i;
      }
      const snap = (line, msg, extra = {}) => frames.push({
        pts, line, msg, p0: p0Idx,
        sorted: extra.sorted || [],
        stack: extra.stack || [],
        currentIdx: extra.currentIdx ?? null,
      });
      snap(0, `${pts.length}개 입력 점`);
      snap(1, `최하단 기준 p₀ = (${pts[p0Idx].x}, ${pts[p0Idx].y})`);

      const others = pts.map((_, i) => i).filter(i => i !== p0Idx);
      others.sort((a, b) => {
        const ax = pts[a].x - pts[p0Idx].x, ay = pts[a].y - pts[p0Idx].y;
        const bx = pts[b].x - pts[p0Idx].x, by = pts[b].y - pts[p0Idx].y;
        const angleA = Math.atan2(ay, ax);
        const angleB = Math.atan2(by, bx);
        if (angleA !== angleB) return angleA - angleB;
        return (ax * ax + ay * ay) - (bx * bx + by * by);
      });
      const sorted = [p0Idx, ...others];
      snap(2, `극각 정렬 완료`, { sorted });

      const cross = (oI, aI, bI) => {
        const o = pts[oI], a = pts[aI], b = pts[bI];
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      };
      const stack = [sorted[0], sorted[1], sorted[2]];
      snap(3, `스택 초기: 3개 push`, { sorted, stack: [...stack] });
      for (let i = 3; i < sorted.length; i++) {
        const pi = sorted[i];
        snap(4, `i = ${i}: 점 (${pts[pi].x}, ${pts[pi].y}) 검토`, {
          sorted, stack: [...stack], currentIdx: pi,
        });
        while (stack.length > 1 && cross(stack[stack.length - 2], stack[stack.length - 1], pi) <= 0) {
          const popped = stack.pop();
          snap(5, `CW 또는 직선 → pop (${pts[popped].x},${pts[popped].y})`, {
            sorted, stack: [...stack], currentIdx: pi,
          });
        }
        stack.push(pi);
        snap(7, `push. 스택 크기 = ${stack.length}`, {
          sorted, stack: [...stack], currentIdx: pi,
        });
      }
      snap(8, `hull (${stack.length}개): ${stack.map(i => `(${pts[i].x},${pts[i].y})`).join(" → ")}`, {
        sorted, stack: [...stack],
      });
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText("Graham's Scan — Convex Hull", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      const pts = frame.pts;
      const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
      const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
      const padL = 60, padR = 60, padT = 50, padB = 50;
      const sx = (x) => padL + (maxX === minX ? 0 : (x - minX) * (W - padL - padR) / (maxX - minX));
      const sy = (y) => (H - padB) - (maxY === minY ? 0 : (y - minY) * (H - padT - padB) / (maxY - minY));

      if (frame.stack && frame.stack.length > 1) {
        const pathPts = frame.stack.map(i => `${sx(pts[i].x)},${sy(pts[i].y)}`).join(" ");
        svg.appendChild(svgEl("polyline", {
          points: pathPts, fill: "none", stroke: PALETTE.done, "stroke-width": 2.5,
        }));
      }
      const inStack = new Set(frame.stack || []);
      const top = frame.stack?.length > 0 ? frame.stack[frame.stack.length - 1] : null;
      const top2 = frame.stack?.length > 1 ? frame.stack[frame.stack.length - 2] : null;

      if (frame.currentIdx != null && top != null && top2 != null) {
        const ax = sx(pts[top2].x), ay = sy(pts[top2].y);
        const bx = sx(pts[top].x), by = sy(pts[top].y);
        const cx = sx(pts[frame.currentIdx].x), cy = sy(pts[frame.currentIdx].y);
        svg.appendChild(svgEl("polygon", {
          points: `${ax},${ay} ${bx},${by} ${cx},${cy}`,
          fill: "#fef3c7", stroke: "#f59e0b",
          "stroke-width": 1.5, "stroke-dasharray": "4 3", opacity: 0.5,
        }));
      }
      pts.forEach((p, i) => {
        let fill = PALETTE.idle, r = 6;
        if (i === frame.p0) { fill = PALETTE.pivot; r = 9; }
        else if (i === frame.currentIdx) { fill = PALETTE.active; r = 9; }
        else if (i === top || i === top2) { fill = PALETTE.compare; r = 7; }
        else if (inStack.has(i)) { fill = PALETTE.done; r = 7; }
        svg.appendChild(svgEl("circle", {
          cx: sx(p.x), cy: sy(p.y), r, fill, stroke: "#1f2937", "stroke-width": 1.5,
        }));
        svg.appendChild(svgText(`(${p.x},${p.y})`, {
          x: sx(p.x) + 9, y: sy(p.y) - 8,
          "font-size": 9, "font-family": "monospace", fill: "#78716c",
        }));
      });
    },
  }));
})();
