/* =========================================================
   viz-graph.js — 그래프 알고리즘 시각화
   등록: bfs, dfs, topoSort, kruskal, prim, bellmanFord, dagShortest, dijkstra
   ========================================================= */

(function () {
  "use strict";
  const { register, PALETTE, svgEl, svgText } = window.VizCore;

  /* ---------- 공통 그래프 렌더러 ----------
     그래프 객체: { nodes: [{id,x,y,label}], edges: [{u,v,w,directed}] }
     옵션: 각 노드의 메타(상태, d값 등)를 color/label로 매핑
  ---------- */
  function renderGraph(svg, graph, opts = {}) {
    const W = 760, H = 420;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // Arrow marker for directed
    const defs = svgEl("defs");
    const marker = svgEl("marker", {
      id: "arrow", viewBox: "0 0 10 10", refX: 28, refY: 5,
      markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse",
    });
    marker.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#94a3b8" }));
    defs.appendChild(marker);

    const markerRed = svgEl("marker", {
      id: "arrow-red", viewBox: "0 0 10 10", refX: 28, refY: 5,
      markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse",
    });
    markerRed.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#ef4444" }));
    defs.appendChild(markerRed);

    const markerGreen = svgEl("marker", {
      id: "arrow-green", viewBox: "0 0 10 10", refX: 28, refY: 5,
      markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse",
    });
    markerGreen.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#22c55e" }));
    defs.appendChild(markerGreen);
    svg.appendChild(defs);

    // Edges first
    const edgeColor = opts.edgeColor || (() => "#94a3b8");
    const edgeWidth = opts.edgeWidth || (() => 2);
    const edgeMarker = opts.edgeMarker || (() => "url(#arrow)");
    graph.edges.forEach((e, idx) => {
      const u = graph.nodes.find((n) => n.id === e.u);
      const v = graph.nodes.find((n) => n.id === e.v);
      if (!u || !v) return;
      const color = edgeColor(e, idx);
      const width = edgeWidth(e, idx);
      const mrk = e.directed ? (
        color === "#ef4444" ? "url(#arrow-red)" :
        color === "#22c55e" ? "url(#arrow-green)" : "url(#arrow)"
      ) : null;
      svg.appendChild(svgEl("line", {
        x1: u.x, y1: u.y, x2: v.x, y2: v.y,
        stroke: color, "stroke-width": width,
        "marker-end": mrk,
      }));
      if (e.w != null) {
        const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
        svg.appendChild(svgEl("rect", {
          x: mx - 12, y: my - 10, width: 24, height: 16, rx: 3,
          fill: "#ffffff", stroke: color, "stroke-width": 1,
        }));
        svg.appendChild(svgText(String(e.w), {
          x: mx, y: my + 3, "text-anchor": "middle",
          "font-size": 11, "font-weight": 700, "font-family": "monospace", fill: "#1c1917",
        }));
      }
    });

    // Nodes
    const nodeFill = opts.nodeFill || (() => "#4d96ff");
    const nodeStroke = opts.nodeStroke || (() => "#1f2937");
    const nodeLabel = opts.nodeLabel || ((n) => n.label || n.id);
    const nodeSub = opts.nodeSub || (() => null);
    graph.nodes.forEach((n) => {
      svg.appendChild(svgEl("circle", {
        cx: n.x, cy: n.y, r: 22,
        fill: nodeFill(n), stroke: nodeStroke(n), "stroke-width": 2.5,
      }));
      svg.appendChild(svgText(String(nodeLabel(n)), {
        x: n.x, y: n.y + 5, "text-anchor": "middle",
        "font-size": 14, "font-weight": 700, "font-family": "sans-serif", fill: "#1c1917",
      }));
      const sub = nodeSub(n);
      if (sub != null) {
        svg.appendChild(svgEl("rect", {
          x: n.x + 14, y: n.y - 36, width: 34, height: 18, rx: 3,
          fill: "#1f2937",
        }));
        svg.appendChild(svgText(String(sub), {
          x: n.x + 31, y: n.y - 23, "text-anchor": "middle",
          "font-size": 11, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      }
    });

    if (opts.title) {
      svg.appendChild(svgText(opts.title, {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    }
  }

  /* ---------- 샘플 그래프들 ---------- */
  function bfsGraph() {
    return {
      nodes: [
        { id: "s", x: 120, y: 210, label: "s" },
        { id: "r", x: 120, y: 80,  label: "r" },
        { id: "v", x: 120, y: 340, label: "v" },
        { id: "w", x: 280, y: 210, label: "w" },
        { id: "t", x: 440, y: 140, label: "t" },
        { id: "u", x: 440, y: 280, label: "u" },
        { id: "x", x: 600, y: 210, label: "x" },
        { id: "y", x: 600, y: 340, label: "y" },
      ],
      edges: [
        { u: "s", v: "r" }, { u: "s", v: "w" },
        { u: "r", v: "v" }, { u: "w", v: "t" },
        { u: "w", v: "x" }, { u: "t", v: "u" },
        { u: "t", v: "x" }, { u: "u", v: "y" },
        { u: "x", v: "y" }, { u: "x", v: "u" },
      ].map((e) => ({ ...e, directed: false })),
    };
  }

  function dfsGraph() {
    return {
      nodes: [
        { id: "u", x: 150, y: 100, label: "u" },
        { id: "v", x: 320, y: 100, label: "v" },
        { id: "w", x: 490, y: 100, label: "w" },
        { id: "x", x: 150, y: 260, label: "x" },
        { id: "y", x: 320, y: 260, label: "y" },
        { id: "z", x: 490, y: 260, label: "z" },
      ],
      edges: [
        { u: "u", v: "v" }, { u: "u", v: "x" },
        { u: "v", v: "y" }, { u: "y", v: "x" },
        { u: "x", v: "v" }, { u: "w", v: "y" },
        { u: "w", v: "z" }, { u: "z", v: "z" },
      ].map((e) => ({ ...e, directed: true })),
    };
  }

  function mstGraph() {
    return {
      nodes: [
        { id: "a", x: 140, y: 110, label: "a" },
        { id: "b", x: 340, y: 110, label: "b" },
        { id: "c", x: 540, y: 110, label: "c" },
        { id: "d", x: 640, y: 270, label: "d" },
        { id: "e", x: 440, y: 330, label: "e" },
        { id: "f", x: 240, y: 330, label: "f" },
        { id: "g", x: 80,  y: 270, label: "g" },
        { id: "h", x: 340, y: 220, label: "h" },
      ],
      edges: [
        { u: "a", v: "b", w: 4 },
        { u: "b", v: "c", w: 8 },
        { u: "c", v: "d", w: 7 },
        { u: "d", v: "e", w: 9 },
        { u: "e", v: "f", w: 10 },
        { u: "f", v: "g", w: 2 },
        { u: "g", v: "h", w: 1 },
        { u: "h", v: "a", w: 8 },
        { u: "b", v: "h", w: 11 },
        { u: "c", v: "f", w: 4 },
        { u: "c", v: "i" /* unused */, w: 2 },
        { u: "d", v: "f", w: 14 },
      ].filter((e) => e.v !== "i").map((e) => ({ ...e, directed: false })),
    };
  }

  function shortestPathGraph() {
    return {
      nodes: [
        { id: "s", x: 100, y: 220, label: "s" },
        { id: "t", x: 300, y: 100, label: "t" },
        { id: "y", x: 300, y: 340, label: "y" },
        { id: "x", x: 500, y: 100, label: "x" },
        { id: "z", x: 500, y: 340, label: "z" },
      ],
      edges: [
        { u: "s", v: "t", w: 10 },
        { u: "s", v: "y", w: 5 },
        { u: "t", v: "x", w: 1 },
        { u: "t", v: "y", w: 2 },
        { u: "y", v: "t", w: 3 },
        { u: "y", v: "x", w: 9 },
        { u: "y", v: "z", w: 2 },
        { u: "x", v: "z", w: 4 },
        { u: "z", v: "s", w: 7 },
        { u: "z", v: "x", w: 6 },
      ].map((e) => ({ ...e, directed: true })),
    };
  }

  function bellmanFordGraph() {
    return {
      nodes: [
        { id: "s", x: 100, y: 220, label: "s" },
        { id: "t", x: 280, y: 120, label: "t" },
        { id: "y", x: 280, y: 320, label: "y" },
        { id: "x", x: 480, y: 120, label: "x" },
        { id: "z", x: 480, y: 320, label: "z" },
      ],
      edges: [
        { u: "s", v: "t", w: 6 },
        { u: "s", v: "y", w: 7 },
        { u: "t", v: "x", w: 5 },
        { u: "t", v: "y", w: 8 },
        { u: "t", v: "z", w: -4 },
        { u: "y", v: "x", w: -3 },
        { u: "y", v: "z", w: 9 },
        { u: "x", v: "t", w: -2 },
        { u: "z", v: "s", w: 2 },
        { u: "z", v: "x", w: 7 },
      ].map((e) => ({ ...e, directed: true })),
    };
  }

  function dagGraph() {
    return {
      nodes: [
        { id: "r", x: 80,  y: 220, label: "r" },
        { id: "s", x: 220, y: 220, label: "s" },
        { id: "t", x: 360, y: 120, label: "t" },
        { id: "x", x: 500, y: 120, label: "x" },
        { id: "y", x: 500, y: 320, label: "y" },
        { id: "z", x: 640, y: 220, label: "z" },
      ],
      edges: [
        { u: "r", v: "s", w: 5 },
        { u: "r", v: "t", w: 3 },
        { u: "s", v: "t", w: 2 },
        { u: "s", v: "x", w: 6 },
        { u: "t", v: "x", w: 7 },
        { u: "t", v: "y", w: 4 },
        { u: "t", v: "z", w: 2 },
        { u: "x", v: "y", w: -1 },
        { u: "x", v: "z", w: 1 },
        { u: "y", v: "z", w: -2 },
      ].map((e) => ({ ...e, directed: true })),
    };
  }

  /* =========================================================
     BFS
     ========================================================= */
  register("bfs", () => ({
    title: "BFS",
    legend: [
      { color: "#ffffff", label: "WHITE (미발견)" },
      { color: "#94a3b8", label: "GRAY (큐에 있음)" },
      { color: "#1f2937", label: "BLACK (완료)" },
      { color: PALETTE.active, label: "현재 u" },
    ],
    pseudocode: [
      ["BFS(G, s)", ""],
      ["  모든 u: WHITE, d=∞, π=NIL", ""],
      ["  s.color=GRAY, s.d=0", ""],
      ["  Q = {s}", ""],
      ["  while Q ≠ ∅", ""],
      ["    u = DEQUEUE(Q)", ""],
      ["    for each v ∈ Adj[u]", ""],
      ["      if v.color == WHITE", ""],
      ["        v.color=GRAY; v.d=u.d+1; ENQUEUE(Q,v)", ""],
      ["    u.color = BLACK", ""],
    ],
    build() {
      const graph = bfsGraph();
      const adj = {};
      graph.nodes.forEach((n) => adj[n.id] = []);
      graph.edges.forEach((e) => {
        adj[e.u].push(e.v);
        adj[e.v].push(e.u);
      });
      for (const id in adj) adj[id].sort();
      const color = {}, d = {}, pi = {};
      graph.nodes.forEach((n) => { color[n.id] = "W"; d[n.id] = Infinity; pi[n.id] = null; });
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, color: { ...color }, d: { ...d }, line, msg, hi,
      });
      snap(0, "초기: 모든 정점 WHITE");
      color["s"] = "G"; d["s"] = 0;
      snap(2, `s.color=GRAY, s.d=0`, { current: "s" });
      const Q = ["s"];
      snap(3, `Q = {s}`, { queue: [...Q], current: "s" });
      while (Q.length) {
        const u = Q.shift();
        snap(5, `u = DEQUEUE(Q) = ${u}`, { queue: [...Q], current: u });
        for (const v of adj[u]) {
          snap(6, `v = ${v}`, { queue: [...Q], current: u, neighbor: v });
          if (color[v] === "W") {
            color[v] = "G"; d[v] = d[u] + 1; pi[v] = u;
            Q.push(v);
            snap(8, `${v}: WHITE→GRAY, d=${d[v]}, π=${u}`, { queue: [...Q], current: u, neighbor: v });
          } else {
            snap(7, `${v}는 이미 발견됨`, { queue: [...Q], current: u, neighbor: v });
          }
        }
        color[u] = "B";
        snap(9, `${u}.color = BLACK`, { queue: [...Q], current: u });
      }
      snap(0, "BFS 완료");
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, frame.graph, {
        title: `BFS  Q = [${(frame.hi && frame.hi.queue || []).join(", ")}]`,
        nodeFill: (n) => {
          if (frame.hi && n.id === frame.hi.current) return PALETTE.active;
          if (frame.hi && n.id === frame.hi.neighbor) return "#fbbf24";
          if (frame.color[n.id] === "B") return "#1f2937";
          if (frame.color[n.id] === "G") return "#94a3b8";
          return "#ffffff";
        },
        nodeLabel: (n) => n.label,
        nodeSub: (n) => frame.d[n.id] === Infinity ? "∞" : frame.d[n.id],
      });
    },
  }));

  /* =========================================================
     DFS (재귀적)
     ========================================================= */
  register("dfs", () => ({
    title: "DFS",
    legend: [
      { color: "#ffffff", label: "WHITE" },
      { color: "#94a3b8", label: "GRAY" },
      { color: "#1f2937", label: "BLACK" },
      { color: PALETTE.active, label: "현재 u" },
    ],
    pseudocode: [
      ["DFS(G)", ""],
      ["  모든 u: WHITE", ""],
      ["  time = 0", ""],
      ["  for each u ∈ V", ""],
      ["    if u.color == WHITE", ""],
      ["      DFS-VISIT(G, u)", ""],
      ["DFS-VISIT(G, u)", ""],
      ["  time++; u.d=time; u.color=GRAY", ""],
      ["  for v in Adj[u]", ""],
      ["    if v.color == WHITE: DFS-VISIT(v)", ""],
      ["  u.color=BLACK; time++; u.f=time", ""],
    ],
    build() {
      const graph = dfsGraph();
      const adj = {};
      graph.nodes.forEach((n) => adj[n.id] = []);
      graph.edges.forEach((e) => adj[e.u].push(e.v));
      for (const id in adj) adj[id].sort();
      const color = {}, d = {}, f = {};
      graph.nodes.forEach((n) => { color[n.id] = "W"; d[n.id] = null; f[n.id] = null; });
      let time = 0;
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, color: { ...color }, d: { ...d }, f: { ...f }, line, msg, hi,
      });
      snap(0, "DFS 시작");
      function visit(u) {
        time++; d[u] = time; color[u] = "G";
        snap(7, `${u}.d = ${time}, ${u} → GRAY`, { current: u });
        for (const v of adj[u]) {
          snap(8, `v = ${v}`, { current: u, neighbor: v });
          if (color[v] === "W") {
            snap(9, `${v}는 WHITE → DFS-VISIT(${v})`, { current: u, neighbor: v });
            visit(v);
          }
        }
        color[u] = "B"; time++; f[u] = time;
        snap(10, `${u} → BLACK, f = ${time}`, { current: u });
      }
      for (const n of graph.nodes) {
        if (color[n.id] === "W") {
          snap(4, `DFS-VISIT(${n.id})`, { current: n.id });
          visit(n.id);
        }
      }
      snap(0, "DFS 완료");
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, frame.graph, {
        title: "DFS",
        nodeFill: (n) => {
          if (frame.hi && n.id === frame.hi.current) return PALETTE.active;
          if (frame.hi && n.id === frame.hi.neighbor) return "#fbbf24";
          if (frame.color[n.id] === "B") return "#1f2937";
          if (frame.color[n.id] === "G") return "#94a3b8";
          return "#ffffff";
        },
        nodeLabel: (n) => n.label,
        nodeSub: (n) => {
          const di = frame.d[n.id], fi = frame.f[n.id];
          if (di == null) return null;
          return `${di}/${fi == null ? "·" : fi}`;
        },
      });
    },
  }));

  /* =========================================================
     Topological Sort
     ========================================================= */
  register("topoSort", () => ({
    title: "Topological Sort",
    legend: [
      { color: "#ffffff", label: "미처리" },
      { color: "#94a3b8", label: "진행 중" },
      { color: PALETTE.done, label: "완료 (LIFO 순)" },
    ],
    pseudocode: [
      ["TOPO-SORT(G)", ""],
      ["  DFS(G) 수행", ""],
      ["  각 u의 종료 시점에 u를 linked list 앞에 삽입", ""],
      ["  return linked list", ""],
    ],
    build() {
      // DAG: underwear → pants → belt → jacket; shirt → belt; shirt → tie → jacket; socks → shoes; pants → shoes
      const graph = {
        nodes: [
          { id: "shirt",     x: 120, y: 80,  label: "shirt" },
          { id: "tie",       x: 300, y: 80,  label: "tie" },
          { id: "jacket",    x: 480, y: 80,  label: "jkt" },
          { id: "belt",      x: 300, y: 200, label: "belt" },
          { id: "watch",     x: 600, y: 200, label: "wtch" },
          { id: "underwear", x: 120, y: 320, label: "uw" },
          { id: "pants",     x: 300, y: 320, label: "pnts" },
          { id: "shoes",     x: 480, y: 320, label: "sh" },
          { id: "socks",     x: 120, y: 200, label: "sox" },
        ],
        edges: [
          { u: "underwear", v: "pants" },
          { u: "underwear", v: "shoes" },
          { u: "pants", v: "belt" },
          { u: "pants", v: "shoes" },
          { u: "shirt", v: "belt" },
          { u: "shirt", v: "tie" },
          { u: "tie", v: "jacket" },
          { u: "belt", v: "jacket" },
          { u: "socks", v: "shoes" },
        ].map((e) => ({ ...e, directed: true })),
      };
      const adj = {};
      graph.nodes.forEach((n) => adj[n.id] = []);
      graph.edges.forEach((e) => adj[e.u].push(e.v));
      const color = {};
      graph.nodes.forEach((n) => color[n.id] = "W");
      const order = [];
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, color: { ...color }, order: [...order], line, msg, hi,
      });
      snap(0, "DAG에 DFS 수행 → 종료 시 앞에 추가");
      function visit(u) {
        color[u] = "G";
        snap(1, `${u} → GRAY`, { current: u });
        for (const v of adj[u]) {
          if (color[v] === "W") visit(v);
        }
        color[u] = "B";
        order.unshift(u);
        snap(2, `${u} 종료 → 순서 앞에 삽입`, { current: u });
      }
      for (const n of graph.nodes) {
        if (color[n.id] === "W") visit(n.id);
      }
      snap(3, `결과: ${order.join(" → ")}`);
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, frame.graph, {
        title: `Topological Sort — [${frame.order.join(", ")}]`,
        nodeFill: (n) => {
          if (frame.hi && n.id === frame.hi.current) return PALETTE.active;
          if (frame.color[n.id] === "B") return PALETTE.done;
          if (frame.color[n.id] === "G") return "#94a3b8";
          return "#ffffff";
        },
        nodeLabel: (n) => n.label,
      });
    },
  }));

  /* =========================================================
     Kruskal
     ========================================================= */
  register("kruskal", () => ({
    title: "Kruskal's MST",
    legend: [
      { color: "#94a3b8", label: "미선택 간선" },
      { color: PALETTE.active, label: "현재 검사 간선" },
      { color: PALETTE.done, label: "MST 포함" },
      { color: PALETTE.pivot, label: "사이클 → 스킵" },
    ],
    pseudocode: [
      ["MST-KRUSKAL(G, w)", ""],
      ["  A = ∅", ""],
      ["  for each v: MAKE-SET(v)", ""],
      ["  간선을 w 오름차순 정렬", ""],
      ["  for each (u,v) ∈ 정렬:", ""],
      ["    if FIND(u) ≠ FIND(v)", ""],
      ["      A = A ∪ {(u,v)}", ""],
      ["      UNION(u,v)", ""],
    ],
    build() {
      const graph = mstGraph();
      const edges = [...graph.edges].sort((a, b) => a.w - b.w);
      const parent = {};
      graph.nodes.forEach((n) => parent[n.id] = n.id);
      function find(x) { while (parent[x] !== x) x = parent[x]; return x; }
      function union(a, b) { parent[find(a)] = find(b); }
      const selected = new Set();
      const skipped = new Set();
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, edges: edges.map((e) => ({ ...e })),
        selected: new Set(selected), skipped: new Set(skipped),
        line, msg, hi,
      });
      snap(0, "초기: A = ∅, 간선 오름차순 정렬");
      for (let idx = 0; idx < edges.length; idx++) {
        const e = edges[idx];
        snap(4, `(${e.u},${e.v},${e.w}) 검사`, { idx });
        if (find(e.u) !== find(e.v)) {
          union(e.u, e.v);
          selected.add(idx);
          snap(6, `서로 다른 집합 → A에 추가`, { idx });
        } else {
          skipped.add(idx);
          snap(5, `같은 집합 → 사이클, 스킵`, { idx });
        }
      }
      const total = [...selected].reduce((s, i) => s + edges[i].w, 0);
      snap(0, `MST 완성, 총 가중치 = ${total}`);
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, { nodes: frame.graph.nodes, edges: frame.edges }, {
        title: "Kruskal's MST",
        edgeColor: (_e, idx) => {
          if (frame.hi && idx === frame.hi.idx) return PALETTE.active;
          if (frame.selected.has(idx)) return PALETTE.done;
          if (frame.skipped.has(idx)) return PALETTE.pivot;
          return "#94a3b8";
        },
        edgeWidth: (_e, idx) => {
          if (frame.selected.has(idx)) return 4;
          if (frame.hi && idx === frame.hi.idx) return 3.5;
          return 2;
        },
        nodeFill: () => "#ffffff",
      });
    },
  }));

  /* =========================================================
     Prim
     ========================================================= */
  register("prim", () => ({
    title: "Prim's MST",
    legend: [
      { color: PALETTE.done, label: "트리 포함 정점" },
      { color: PALETTE.active, label: "EXTRACT-MIN" },
      { color: "#94a3b8", label: "큐에 있음" },
    ],
    pseudocode: [
      ["MST-PRIM(G, w, r)", ""],
      ["  모든 u: u.key=∞, u.π=NIL", ""],
      ["  r.key = 0", ""],
      ["  Q = V", ""],
      ["  while Q ≠ ∅", ""],
      ["    u = EXTRACT-MIN(Q)", ""],
      ["    for each v ∈ Adj[u]", ""],
      ["      if v ∈ Q and w(u,v) < v.key", ""],
      ["        v.π = u; v.key = w(u,v)", ""],
    ],
    build() {
      const graph = mstGraph();
      const adj = {};
      graph.nodes.forEach((n) => adj[n.id] = []);
      graph.edges.forEach((e) => {
        adj[e.u].push({ to: e.v, w: e.w });
        adj[e.v].push({ to: e.u, w: e.w });
      });
      const key = {}, pi = {};
      graph.nodes.forEach((n) => { key[n.id] = Infinity; pi[n.id] = null; });
      key["a"] = 0;
      const inTree = new Set();
      const mstEdges = new Set();
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, key: { ...key }, pi: { ...pi },
        inTree: new Set(inTree), mstEdges: new Set(mstEdges),
        line, msg, hi,
      });
      snap(0, "초기: r=a, a.key=0");
      const Q = graph.nodes.map((n) => n.id);
      while (Q.length) {
        Q.sort((a, b) => key[a] - key[b]);
        const u = Q.shift();
        inTree.add(u);
        if (pi[u]) {
          const eKey = graph.edges.findIndex((e) =>
            (e.u === u && e.v === pi[u]) || (e.v === u && e.u === pi[u]));
          if (eKey >= 0) mstEdges.add(eKey);
        }
        snap(5, `EXTRACT-MIN = ${u} (key=${key[u]})`, { current: u });
        for (const { to, w } of adj[u]) {
          snap(6, `검사: (${u},${to},${w})`, { current: u, neighbor: to });
          if (Q.includes(to) && w < key[to]) {
            key[to] = w; pi[to] = u;
            snap(8, `${to}.key = ${w}, π = ${u}`, { current: u, neighbor: to });
          }
        }
      }
      const total = [...mstEdges].reduce((s, i) => s + graph.edges[i].w, 0);
      snap(0, `MST 완성, 총 가중치 = ${total}`);
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, frame.graph, {
        title: "Prim's MST",
        edgeColor: (_e, idx) => {
          if (frame.mstEdges.has(idx)) return PALETTE.done;
          return "#cbd5e1";
        },
        edgeWidth: (_e, idx) => frame.mstEdges.has(idx) ? 4 : 2,
        nodeFill: (n) => {
          if (frame.hi && n.id === frame.hi.current) return PALETTE.active;
          if (frame.hi && n.id === frame.hi.neighbor) return "#fbbf24";
          if (frame.inTree.has(n.id)) return PALETTE.done;
          return "#94a3b8";
        },
        nodeLabel: (n) => n.label,
        nodeSub: (n) => frame.key[n.id] === Infinity ? "∞" : frame.key[n.id],
      });
    },
  }));

  /* =========================================================
     Bellman-Ford
     ========================================================= */
  register("bellmanFord", () => ({
    title: "Bellman-Ford",
    legend: [
      { color: PALETTE.done, label: "d 업데이트됨" },
      { color: PALETTE.active, label: "현재 완화 대상" },
      { color: "#94a3b8", label: "그 외" },
    ],
    pseudocode: [
      ["BELLMAN-FORD(G, w, s)", ""],
      ["  INITIALIZE-SINGLE-SOURCE(G, s)", ""],
      ["  for i = 1 to |V|-1", ""],
      ["    for each (u,v) ∈ E", ""],
      ["      RELAX(u, v, w)", ""],
      ["  for each (u,v) ∈ E", ""],
      ["    if v.d > u.d + w: return FALSE", ""],
      ["  return TRUE", ""],
    ],
    build() {
      const graph = bellmanFordGraph();
      const d = {}, pi = {};
      graph.nodes.forEach((n) => { d[n.id] = Infinity; pi[n.id] = null; });
      d["s"] = 0;
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, d: { ...d }, line, msg, hi,
      });
      snap(0, "INITIALIZE: d[s]=0, 나머지 ∞");
      const V = graph.nodes.length;
      for (let i = 1; i < V; i++) {
        snap(2, `반복 ${i} / ${V - 1}`);
        for (const e of graph.edges) {
          const cand = d[e.u] + e.w;
          if (d[e.u] !== Infinity && cand < d[e.v]) {
            d[e.v] = cand; pi[e.v] = e.u;
            snap(4, `RELAX(${e.u}→${e.v}, ${e.w}): d[${e.v}] = ${cand}`, { eu: e.u, ev: e.v });
          } else {
            snap(4, `RELAX(${e.u}→${e.v}, ${e.w}): 변화 없음`, { eu: e.u, ev: e.v });
          }
        }
      }
      snap(5, "음수 사이클 검사");
      snap(7, `완료. 최종 d: ${graph.nodes.map((n) => n.id + "=" + (d[n.id] === Infinity ? "∞" : d[n.id])).join(", ")}`);
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, frame.graph, {
        title: "Bellman-Ford",
        edgeColor: (e) => {
          if (frame.hi && frame.hi.eu === e.u && frame.hi.ev === e.v) return PALETTE.active;
          return "#94a3b8";
        },
        edgeWidth: (e) => (frame.hi && frame.hi.eu === e.u && frame.hi.ev === e.v) ? 3.5 : 2,
        nodeFill: (n) => {
          if (frame.hi && n.id === frame.hi.ev) return PALETTE.active;
          if (frame.d[n.id] !== Infinity) return PALETTE.done;
          return "#94a3b8";
        },
        nodeLabel: (n) => n.label,
        nodeSub: (n) => frame.d[n.id] === Infinity ? "∞" : frame.d[n.id],
      });
    },
  }));

  /* =========================================================
     DAG Shortest Paths
     ========================================================= */
  register("dagShortest", () => ({
    title: "DAG Shortest Paths",
    legend: [
      { color: PALETTE.done, label: "완화됨" },
      { color: PALETTE.active, label: "처리 중 u" },
      { color: "#94a3b8", label: "미처리" },
    ],
    pseudocode: [
      ["DAG-SHORTEST-PATHS(G, w, s)", ""],
      ["  위상 정렬(G)", ""],
      ["  INITIALIZE-SINGLE-SOURCE(G, s)", ""],
      ["  for each u in 위상 순서", ""],
      ["    for each v in Adj[u]", ""],
      ["      RELAX(u, v, w)", ""],
    ],
    build() {
      const graph = dagGraph();
      const adj = {};
      graph.nodes.forEach((n) => adj[n.id] = []);
      graph.edges.forEach((e) => adj[e.u].push(e));
      const d = {};
      graph.nodes.forEach((n) => d[n.id] = Infinity);
      d["s"] = 0;
      const topo = ["r", "s", "t", "x", "y", "z"];
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, d: { ...d }, line, msg, hi,
      });
      snap(0, `위상 순서: ${topo.join(" → ")}`);
      snap(2, "d[s]=0, 나머지 ∞");
      for (const u of topo) {
        snap(3, `u = ${u}`, { current: u });
        for (const e of adj[u]) {
          if (d[u] !== Infinity && d[u] + e.w < d[e.v]) {
            d[e.v] = d[u] + e.w;
            snap(5, `RELAX(${u}→${e.v}, ${e.w}): d[${e.v}] = ${d[e.v]}`, { current: u, neighbor: e.v });
          }
        }
      }
      snap(0, "완료");
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, frame.graph, {
        title: "DAG Shortest Paths",
        nodeFill: (n) => {
          if (frame.hi && n.id === frame.hi.current) return PALETTE.active;
          if (frame.hi && n.id === frame.hi.neighbor) return "#fbbf24";
          if (frame.d[n.id] !== Infinity) return PALETTE.done;
          return "#94a3b8";
        },
        nodeLabel: (n) => n.label,
        nodeSub: (n) => frame.d[n.id] === Infinity ? "∞" : frame.d[n.id],
      });
    },
  }));

  /* =========================================================
     Dijkstra
     ========================================================= */
  register("dijkstra", () => ({
    title: "Dijkstra",
    legend: [
      { color: PALETTE.done, label: "S (확정)" },
      { color: PALETTE.active, label: "EXTRACT-MIN" },
      { color: "#94a3b8", label: "Q (대기)" },
    ],
    pseudocode: [
      ["DIJKSTRA(G, w, s)", ""],
      ["  INITIALIZE-SINGLE-SOURCE(G, s)", ""],
      ["  S = ∅", ""],
      ["  Q = V", ""],
      ["  while Q ≠ ∅", ""],
      ["    u = EXTRACT-MIN(Q)", ""],
      ["    S = S ∪ {u}", ""],
      ["    for each v ∈ Adj[u]", ""],
      ["      RELAX(u, v, w)", ""],
    ],
    build() {
      const graph = shortestPathGraph();
      const adj = {};
      graph.nodes.forEach((n) => adj[n.id] = []);
      graph.edges.forEach((e) => adj[e.u].push(e));
      const d = {};
      graph.nodes.forEach((n) => d[n.id] = Infinity);
      d["s"] = 0;
      const S = new Set();
      const Q = graph.nodes.map((n) => n.id);
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        graph, d: { ...d }, S: new Set(S),
        line, msg, hi,
      });
      snap(0, "INITIALIZE: d[s]=0, 나머지 ∞");
      while (Q.length) {
        Q.sort((a, b) => d[a] - d[b]);
        const u = Q.shift();
        S.add(u);
        snap(5, `EXTRACT-MIN = ${u} (d=${d[u] === Infinity ? "∞" : d[u]})`, { current: u });
        for (const e of adj[u]) {
          const cand = d[u] + e.w;
          snap(7, `(${u}→${e.v}, ${e.w})`, { current: u, neighbor: e.v });
          if (d[u] !== Infinity && cand < d[e.v]) {
            d[e.v] = cand;
            snap(8, `RELAX: d[${e.v}] = ${cand}`, { current: u, neighbor: e.v });
          }
        }
      }
      snap(0, "Dijkstra 완료");
      return frames;
    },
    render(frame, svg) {
      renderGraph(svg, frame.graph, {
        title: "Dijkstra",
        nodeFill: (n) => {
          if (frame.hi && n.id === frame.hi.current) return PALETTE.active;
          if (frame.hi && n.id === frame.hi.neighbor) return "#fbbf24";
          if (frame.S.has(n.id)) return PALETTE.done;
          return "#94a3b8";
        },
        nodeLabel: (n) => n.label,
        nodeSub: (n) => frame.d[n.id] === Infinity ? "∞" : frame.d[n.id],
      });
    },
  }));

  /* =========================================================
     SCC (Kosaraju) — 두 번의 DFS
     1) G에 DFS, 종료 시간 역순으로 스택에 push
     2) 전치 그래프 G^T에서 스택 순서대로 DFS
        각 DFS 트리가 하나의 SCC
     ========================================================= */
  register("scc", () => ({
    title: "Strongly Connected Components (Kosaraju)",
    legend: [
      { color: PALETTE.idle,    label: "미방문" },
      { color: PALETTE.gray,    label: "DFS 진행 중 (GRAY)" },
      { color: PALETTE.active,  label: "현재 정점" },
      { color: PALETTE.done,    label: "1차 DFS 완료" },
      { color: PALETTE.pivot,   label: "SCC 확정" },
    ],
    pseudocode: [
      ["STRONGLY-CONNECTED-COMPONENTS(G)", ""],
      ["  1. DFS(G), 종료 시간 f 계산", ""],
      ["     u.f 감소순 스택 S에 저장", ""],
      ["  2. G^T (간선 방향 뒤집기)", ""],
      ["  3. while S ≠ ∅", ""],
      ["       u = POP(S)", ""],
      ["       if u ∈ 미방문:", ""],
      ["         DFS-VISIT(G^T, u) → 하나의 SCC", ""],
    ],
    build() {
      // CLRS Fig 22.9 스타일 예제 그래프 (8개 정점, SCC 4개)
      const nodes = [
        { id: "a", label: "a", x: 140, y:  90 },
        { id: "b", label: "b", x: 300, y:  90 },
        { id: "c", label: "c", x: 460, y:  90 },
        { id: "d", label: "d", x: 620, y:  90 },
        { id: "e", label: "e", x: 140, y: 330 },
        { id: "f", label: "f", x: 300, y: 330 },
        { id: "g", label: "g", x: 460, y: 330 },
        { id: "h", label: "h", x: 620, y: 330 },
      ];
      const edges = [
        { u: "a", v: "b" }, { u: "b", v: "c" }, { u: "c", v: "d" },
        { u: "d", v: "h" }, { u: "b", v: "e" }, { u: "b", v: "f" },
        { u: "e", v: "a" }, { u: "e", v: "f" }, { u: "f", v: "g" },
        { u: "g", v: "f" }, { u: "g", v: "h" }, { u: "h", v: "h" },
        { u: "c", v: "g" },
      ].map(e => ({ ...e, directed: true }));

      const adj = {};
      nodes.forEach(n => { adj[n.id] = []; });
      edges.forEach(e => { adj[e.u].push(e.v); });
      const adjT = {};
      nodes.forEach(n => { adjT[n.id] = []; });
      edges.forEach(e => { adjT[e.v].push(e.u); });

      const color = Object.fromEntries(nodes.map(n => [n.id, "WHITE"]));
      const frames = [];
      const stack = [];        // DFS finish order
      const sccOf = {};        // node id → scc index
      let phase = 1;

      const snap = (line, msg, extra = {}) => frames.push({
        nodes, edges,
        color: { ...color },
        stack: [...stack],
        sccOf: { ...sccOf },
        phase,
        cur: extra.cur ?? null,
        reversedEdges: phase === 2,
        line, msg,
      });

      snap(0, "START: 8-정점 방향 그래프");

      // Phase 1: DFS on G, collect finish order
      function dfs1(u) {
        color[u] = "GRAY";
        snap(1, `DFS-VISIT(${u}) — GRAY`, { cur: u });
        for (const v of adj[u]) {
          if (color[v] === "WHITE") dfs1(v);
        }
        color[u] = "BLACK";
        stack.push(u);
        snap(2, `${u}.f 완료 → stack push. 현재 스택: [${stack.join(", ")}]`, { cur: u });
      }
      for (const n of nodes) {
        if (color[n.id] === "WHITE") dfs1(n.id);
      }
      snap(2, `Phase 1 완료. 스택 top: ${stack[stack.length - 1]}`);

      // Phase 2: DFS on G^T in stack order
      phase = 2;
      nodes.forEach(n => { color[n.id] = "WHITE"; });
      snap(3, `Phase 2: G^T (전치 그래프)에서 스택 순으로 DFS`);

      let sccIdx = 0;
      function dfs2(u, idx) {
        color[u] = "GRAY";
        sccOf[u] = idx;
        snap(7, `DFS-VISIT(G^T, ${u}) — SCC #${idx + 1}에 포함`, { cur: u });
        for (const v of adjT[u]) {
          if (color[v] === "WHITE") dfs2(v, idx);
        }
        color[u] = "BLACK";
      }
      while (stack.length > 0) {
        const u = stack.pop();
        snap(5, `POP ${u} (스택에서)`, { cur: u });
        if (color[u] === "WHITE") {
          snap(6, `${u} 미방문 → 새 SCC 시작`, { cur: u });
          dfs2(u, sccIdx);
          const members = Object.keys(sccOf).filter(k => sccOf[k] === sccIdx);
          snap(7, `SCC #${sccIdx + 1} = {${members.join(", ")}}`);
          sccIdx++;
        }
      }
      snap(0, `총 ${sccIdx}개의 SCC 발견`);
      return frames;
    },
    render(frame, svg) {
      // SCC 색상 팔레트
      const sccColors = [
        PALETTE.pivot, "#ec4899", "#14b8a6", "#f97316",
        "#8b5cf6", "#06b6d4", "#84cc16", "#f43f5e",
      ];
      const graph = {
        nodes: frame.nodes,
        edges: frame.reversedEdges
          ? frame.edges.map(e => ({ ...e, u: e.v, v: e.u }))
          : frame.edges,
      };
      renderGraph(svg, graph, {
        nodeFill: (n) => {
          if (frame.sccOf[n.id] != null) return sccColors[frame.sccOf[n.id] % sccColors.length];
          if (frame.cur === n.id) return PALETTE.active;
          const c = frame.color[n.id];
          if (c === "GRAY") return PALETTE.gray;
          if (c === "BLACK") return PALETTE.done;
          return PALETTE.idle;
        },
        nodeSub: (n) => frame.sccOf[n.id] != null ? `#${frame.sccOf[n.id] + 1}` : null,
      });
      // Phase label
      svg.appendChild(svgText(
        frame.phase === 1 ? "Phase 1: DFS(G) — 종료 시간 수집"
                           : "Phase 2: DFS(G^T) — SCC 발견",
        { x: 380, y: 22, "text-anchor": "middle",
          "font-size": 13, "font-weight": 600, "font-family": "sans-serif",
          fill: frame.phase === 1 ? "#2563eb" : "#dc2626" }
      ));
      // Stack display (Phase 1 result)
      if (frame.stack.length > 0) {
        svg.appendChild(svgText(
          "Finish stack (top→bottom): " + [...frame.stack].reverse().join(" → "),
          { x: 380, y: 405, "text-anchor": "middle",
            "font-size": 11, "font-family": "monospace", fill: "#44403c" }
        ));
      }
    },
  }));

  /* =========================================================
     TARJAN'S SCC — 한 번의 DFS + low-link
     각 노드 v에 index[v], lowlink[v], onStack[v] 유지.
     후진/교차 간선으로 stack에 있는 정점을 만나면 lowlink 갱신.
     lowlink[v] == index[v]이면 v는 SCC의 루트 → stack pop.
     ========================================================= */
  register("tarjanScc", () => ({
    title: "Tarjan's SCC — single-pass DFS",
    legend: [
      { color: PALETTE.idle,    label: "미방문" },
      { color: PALETTE.active,  label: "현재 DFS 중 (스택 포함)" },
      { color: PALETTE.compare, label: "인접 정점 검사" },
      { color: PALETTE.pivot,   label: "SCC 루트 (lowlink=index)" },
      { color: PALETTE.done,    label: "SCC 확정" },
    ],
    pseudocode: [
      ["TARJAN(G)", ""],
      ["  index = 0; S = []", ""],
      ["  for v ∈ V: if v.index undefined → STRONGCONNECT(v)", ""],
      ["", ""],
      ["STRONGCONNECT(v)", ""],
      ["  v.index = v.lowlink = index++", ""],
      ["  S.push(v); v.onStack = true", ""],
      ["  for (v, w) ∈ E", ""],
      ["    if w.index undefined:", ""],
      ["      STRONGCONNECT(w)", ""],
      ["      v.lowlink = min(v.lowlink, w.lowlink)", ""],
      ["    elseif w.onStack:", ""],
      ["      v.lowlink = min(v.lowlink, w.index)", ""],
      ["  if v.lowlink == v.index:", "// v는 SCC 루트"],
      ["    repeat w = S.pop(); w.onStack = false", ""],
      ["    until w == v", ""],
    ],
    build() {
      const nodes = [
        { id: "a", label: "a", x: 140, y:  90 },
        { id: "b", label: "b", x: 300, y:  90 },
        { id: "c", label: "c", x: 460, y:  90 },
        { id: "d", label: "d", x: 620, y:  90 },
        { id: "e", label: "e", x: 140, y: 310 },
        { id: "f", label: "f", x: 300, y: 310 },
        { id: "g", label: "g", x: 460, y: 310 },
        { id: "h", label: "h", x: 620, y: 310 },
      ];
      const edges = [
        { u: "a", v: "b" }, { u: "b", v: "c" }, { u: "c", v: "d" },
        { u: "d", v: "h" }, { u: "b", v: "e" }, { u: "b", v: "f" },
        { u: "e", v: "a" }, { u: "e", v: "f" }, { u: "f", v: "g" },
        { u: "g", v: "f" }, { u: "g", v: "h" }, { u: "c", v: "g" },
      ].map(e => ({ ...e, directed: true }));
      const adj = Object.fromEntries(nodes.map(n => [n.id, []]));
      edges.forEach(e => adj[e.u].push(e.v));

      const index = {}, lowlink = {}, onStack = {};
      const sccOf = {};
      const stack = [];
      let idx = 0;
      let sccCount = 0;

      const frames = [];
      const snap = (line, msg, extra = {}) => frames.push({
        nodes, edges,
        index: { ...index },
        lowlink: { ...lowlink },
        onStack: { ...onStack },
        sccOf: { ...sccOf },
        stack: [...stack],
        line, msg,
        current: extra.current ?? null,
        probe: extra.probe ?? null,
      });

      snap(0, "Tarjan's SCC — index 카운터와 스택 유지");

      function strong(v) {
        index[v] = lowlink[v] = idx++;
        stack.push(v);
        onStack[v] = true;
        snap(5, `STRONGCONNECT(${v}): index=${index[v]}, lowlink=${lowlink[v]}`, { current: v });
        for (const w of adj[v]) {
          if (index[w] === undefined) {
            snap(7, `간선 ${v}→${w}: w 미방문 → 재귀`, { current: v, probe: w });
            strong(w);
            lowlink[v] = Math.min(lowlink[v], lowlink[w]);
            snap(10, `${v}.lowlink = min(${lowlink[v]}, lowlink[${w}]=${lowlink[w]}) = ${lowlink[v]}`, {
              current: v, probe: w,
            });
          } else if (onStack[w]) {
            lowlink[v] = Math.min(lowlink[v], index[w]);
            snap(12, `간선 ${v}→${w}: w는 스택 내 → lowlink[${v}] = min → ${lowlink[v]}`, {
              current: v, probe: w,
            });
          } else {
            snap(7, `간선 ${v}→${w}: w는 이미 다른 SCC — 무시`, { current: v, probe: w });
          }
        }
        if (lowlink[v] === index[v]) {
          const comp = [];
          let w;
          do {
            w = stack.pop();
            onStack[w] = false;
            sccOf[w] = sccCount;
            comp.push(w);
          } while (w !== v);
          snap(13, `${v}는 SCC 루트 (lowlink == index). SCC #${sccCount + 1} = {${comp.join(", ")}}`, {
            current: v,
          });
          sccCount++;
        }
      }

      for (const n of nodes) {
        if (index[n.id] === undefined) strong(n.id);
      }
      snap(0, `완료: 총 ${sccCount}개의 SCC`);
      return frames;
    },
    render(frame, svg) {
      const sccColors = [
        PALETTE.pivot, "#ec4899", "#14b8a6", "#f97316",
        "#8b5cf6", "#06b6d4", "#84cc16", "#f43f5e",
      ];
      const graph = { nodes: frame.nodes, edges: frame.edges };
      renderGraph(svg, graph, {
        nodeFill: (n) => {
          if (frame.sccOf[n.id] != null) return sccColors[frame.sccOf[n.id] % sccColors.length];
          if (frame.probe === n.id) return PALETTE.compare;
          if (frame.current === n.id) return PALETTE.active;
          if (frame.onStack[n.id]) return "#bae6fd";  // light blue: on stack, not SCC yet
          if (frame.index[n.id] !== undefined) return PALETTE.gray;  // visited but popped
          return PALETTE.idle;
        },
        nodeSub: (n) => {
          if (frame.index[n.id] === undefined) return null;
          return `${frame.index[n.id]}/${frame.lowlink[n.id]}`;
        },
      });
      // stack contents
      svg.appendChild(svgText(
        frame.stack.length > 0
          ? `Stack (bottom→top): ${frame.stack.join(" · ")}`
          : "Stack: ∅",
        { x: 380, y: 24, "text-anchor": "middle",
          "font-size": 12, "font-weight": 600, "font-family": "monospace", fill: "#44403c" }
      ));
      svg.appendChild(svgText(
        "노드 annotation: index/lowlink",
        { x: 380, y: 400, "text-anchor": "middle",
          "font-size": 10, "font-family": "monospace", fill: "#78716c" }
      ));
    },
  }));
})();
