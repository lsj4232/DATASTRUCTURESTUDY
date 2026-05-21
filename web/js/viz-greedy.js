/* =========================================================
   viz-greedy.js — 추가 Greedy / 근사 알고리즘 시각화
   등록: vcApprox
   주의: Activity Selection과 Huffman은 viz-dp.js에 먼저 등록되어 있음.
   ========================================================= */

(function () {
  "use strict";
  const { register, PALETTE, svgEl, svgText } = window.VizCore;

  /* =========================================================
     APPROX-VERTEX-COVER (2-근사, 탐욕적 매칭)
     CLRS 35.1절 Fig 35.1 스타일 그래프
     ========================================================= */
  register("vcApprox", () => ({
    title: "APPROX-VERTEX-COVER (2-근사)",
    legend: [
      { color: PALETTE.idle,    label: "미선택 정점" },
      { color: PALETTE.done,    label: "커버 C에 포함" },
      { color: PALETTE.active,  label: "선택된 간선 (u, v)" },
      { color: PALETTE.edge,    label: "남은 간선 E'" },
      { color: PALETTE.ghost,   label: "제거된 간선" },
    ],
    pseudocode: [
      ["APPROX-VERTEX-COVER(G)", ""],
      ["  C = ∅", ""],
      ["  E' = G.E", "// 남은 간선"],
      ["  while E' ≠ ∅", ""],
      ["    let (u, v) ∈ E'", "// 아무 간선"],
      ["    C = C ∪ {u, v}", ""],
      ["    remove from E' every edge incident on u or v", ""],
      ["  return C", ""],
    ],
    build() {
      // Fixed graph: 6 vertices, 7 edges
      const nodes = [
        { id: 0, label: "a", x: 140, y: 110 },
        { id: 1, label: "b", x: 340, y: 90  },
        { id: 2, label: "c", x: 540, y: 110 },
        { id: 3, label: "d", x: 540, y: 290 },
        { id: 4, label: "e", x: 340, y: 310 },
        { id: 5, label: "f", x: 140, y: 290 },
      ];
      // Edge list — (u, v) index pairs
      const edges = [
        { u: 0, v: 1 }, // a-b
        { u: 1, v: 2 }, // b-c
        { u: 2, v: 3 }, // c-d
        { u: 3, v: 4 }, // d-e
        { u: 4, v: 5 }, // e-f
        { u: 5, v: 0 }, // f-a
        { u: 1, v: 4 }, // b-e (cross)
      ];

      const frames = [];
      const cover = new Set();
      // removed[i] = true if edge i is no longer in E'
      const removed = new Array(edges.length).fill(false);

      const snap = (line, msg, extra = {}) => frames.push({
        nodes: nodes.map(n => ({ ...n, inCover: cover.has(n.id) })),
        edges: edges.map((e, i) => ({ ...e, removed: removed[i] })),
        cover: [...cover],
        line,
        msg,
        selectedEdge: extra.selectedEdge ?? null,
        justAdded: extra.justAdded ?? null,
      });

      snap(0, "APPROX-VERTEX-COVER(G): 그래프 G = (V, E)에서 시작");
      snap(1, "C = ∅ (커버 집합 초기화)");
      snap(2, `E' = G.E (남은 간선 ${edges.length}개)`);

      const activeIdx = () => edges.findIndex((_, i) => !removed[i]);

      let iter = 0;
      while (activeIdx() !== -1) {
        iter++;
        snap(3, `반복 ${iter}: E' ≠ ∅이므로 계속`);
        // Pick lowest-index remaining edge as "arbitrary"
        const idx = activeIdx();
        const { u, v } = edges[idx];
        const uL = nodes[u].label, vL = nodes[v].label;
        snap(4, `임의의 간선 (${uL}, ${vL}) 선택`, { selectedEdge: idx });
        cover.add(u); cover.add(v);
        snap(5, `C = C ∪ {${uL}, ${vL}} → |C| = ${cover.size}`, {
          selectedEdge: idx, justAdded: [u, v],
        });
        // Remove all edges incident on u or v
        const incidentCount = edges.reduce((acc, e, i) =>
          acc + (!removed[i] && (e.u === u || e.v === u || e.u === v || e.v === v) ? 1 : 0), 0);
        for (let i = 0; i < edges.length; i++) {
          if (!removed[i] && (edges[i].u === u || edges[i].v === u || edges[i].u === v || edges[i].v === v)) {
            removed[i] = true;
          }
        }
        const remaining = edges.filter((_, i) => !removed[i]).length;
        snap(6, `${uL}/${v === u ? "" : vL}와 닿은 간선 ${incidentCount}개 제거 (남은 E' = ${remaining})`);
      }

      snap(3, "E' = ∅ → while 종료");
      const coverStr = [...cover].map(i => nodes[i].label).sort().join(", ");
      snap(7, `반환 C = {${coverStr}}  |  |C| = ${cover.size} ≤ 2·|C*| (2-근사 보장)`);
      return frames;
    },
    render(frame, svg) {
      const W = 720, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

      // Title
      svg.appendChild(svgText("APPROX-VERTEX-COVER — 탐욕적 매칭으로 2-근사", {
        x: W / 2, y: 24, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));

      // Edges first (under nodes)
      for (let i = 0; i < frame.edges.length; i++) {
        const e = frame.edges[i];
        const a = frame.nodes[e.u], b = frame.nodes[e.v];
        const isSelected = frame.selectedEdge === i && !e.removed;
        let stroke = e.removed ? PALETTE.ghost : PALETTE.edge;
        let strokeWidth = 2;
        let dash = null;
        if (e.removed) { dash = "4 4"; strokeWidth = 1.5; }
        if (isSelected) { stroke = PALETTE.active; strokeWidth = 4; dash = null; }
        svg.appendChild(svgEl("line", {
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          stroke, "stroke-width": strokeWidth,
          "stroke-dasharray": dash, opacity: e.removed ? 0.5 : 1,
        }));
      }

      // Nodes
      for (const n of frame.nodes) {
        const justAdded = Array.isArray(frame.justAdded) && frame.justAdded.includes(n.id);
        let fill = PALETTE.idle;
        let strokeW = 2;
        if (n.inCover) fill = PALETTE.done;
        if (justAdded) strokeW = 4;
        svg.appendChild(svgEl("circle", {
          cx: n.x, cy: n.y, r: 22, fill,
          stroke: justAdded ? PALETTE.active : "#1f2937", "stroke-width": strokeW,
        }));
        svg.appendChild(svgText(n.label, {
          x: n.x, y: n.y + 5, "text-anchor": "middle",
          "font-size": 15, "font-weight": 700,
          "font-family": "sans-serif", fill: "#fff",
        }));
      }

      // Cover display (bottom)
      const coverStr = frame.cover.length
        ? "{" + frame.cover.map(i => frame.nodes[i].label).sort().join(", ") + "}"
        : "∅";
      svg.appendChild(svgText(`C = ${coverStr}  (|C| = ${frame.cover.length})`, {
        x: W / 2, y: H - 24, "text-anchor": "middle",
        "font-size": 13, "font-family": "monospace", fill: "#44403c", "font-weight": 600,
      }));

      // Remaining edges count (bottom-right)
      const remaining = frame.edges.filter(e => !e.removed).length;
      svg.appendChild(svgText(`|E'| = ${remaining}`, {
        x: W - 40, y: H - 24, "text-anchor": "end",
        "font-size": 12, "font-family": "monospace", fill: "#78716c",
      }));
    },
  }));
})();
