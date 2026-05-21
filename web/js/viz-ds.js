/* =========================================================
   viz-ds.js — 자료구조 시각화
   등록: bst (Binary Search Tree · TREE-INSERT),
         hashing (Chaining hash · CHAINED-HASH-INSERT),
         unionfind (Disjoint Set · UNION-BY-RANK + Path Compression),
         rbtree (Red-Black Tree · RB-INSERT + RB-INSERT-FIXUP),
         rbtreeDelete (Red-Black Tree · RB-DELETE + RB-DELETE-FIXUP 4 cases),
         osTree (Order-Statistic Tree · OS-SELECT on augmented RB-tree),
         btreeSearch (B-tree · B-TREE-SEARCH)
   ========================================================= */

(function () {
  "use strict";
  const { register, PALETTE, svgEl, svgText } = window.VizCore;

  /* =========================================================
     Binary Search Tree — TREE-INSERT (반복 버전)
     각 프레임: 현재 비교 노드 (active), 왼/오른쪽 선택 (compare),
     최종 삽입 위치 (done).
     ========================================================= */
  register("bst", () => ({
    title: "Binary Search Tree — TREE-INSERT",
    legend: [
      { color: PALETTE.idle,    label: "기존 노드" },
      { color: PALETTE.active,  label: "현재 비교 노드 (x)" },
      { color: PALETTE.compare, label: "부모 y" },
      { color: PALETTE.done,    label: "새로 삽입된 노드" },
    ],
    pseudocode: [
      ["TREE-INSERT(T, z)", ""],
      ["  y = NIL; x = T.root", ""],
      ["  while x ≠ NIL", ""],
      ["    y = x", ""],
      ["    if z.key < x.key", ""],
      ["      x = x.left", ""],
      ["    else x = x.right", ""],
      ["  z.p = y", ""],
      ["  if y == NIL", "// 빈 트리"],
      ["    T.root = z", ""],
      ["  elseif z.key < y.key", ""],
      ["    y.left = z", ""],
      ["  else y.right = z", ""],
    ],
    editableInput: {
      label: "키 시퀀스 (쉼표): 차례로 삽입됩니다",
      defaultValue: "50, 30, 70, 20, 40, 60, 80, 35, 75",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map((t) => {
          const n = Number(t);
          if (!Number.isFinite(n)) throw new Error(`숫자가 아닙니다: "${t}"`);
          return n;
        });
        if (arr.length < 1) throw new Error("키 1개 이상 필요");
        if (arr.length > 20) throw new Error("최대 20개");
        const seen = new Set();
        for (const k of arr) {
          if (seen.has(k)) throw new Error(`중복 키: ${k}`);
          seen.add(k);
        }
        return arr;
      },
    },
    build(input) {
      const seq = Array.isArray(input) ? input.slice()
                                       : [50, 30, 70, 20, 40, 60, 80, 35, 75];
      /* Tree representation: nodes = [{id, key, l, r, p}] */
      let nodes = [];
      let rootId = null;
      let nextId = 0;
      const frames = [];

      function snap(line, msg, hi = {}) {
        frames.push({
          nodes: nodes.map(n => ({ ...n })),
          rootId,
          line,
          msg,
          active: hi.active ?? null,
          parent: hi.parent ?? null,
          inserted: hi.inserted ?? null,
        });
      }

      snap(0, `빈 트리에서 시작. 삽입 순서: ${seq.join(" → ")}`);

      seq.forEach((key, step) => {
        const newId = nextId++;
        snap(0, `TREE-INSERT(T, ${key}) — step ${step + 1}`);
        let y = null, x = rootId;
        snap(1, `y = NIL, x = ${x == null ? "NIL (빈 트리)" : "root(" + nodes[x].key + ")"}`, { active: x, parent: y });
        while (x != null) {
          snap(2, `while x ≠ NIL`, { active: x, parent: y });
          y = x;
          snap(3, `y = x = ${nodes[x].key}`, { active: x, parent: y });
          if (key < nodes[x].key) {
            snap(4, `${key} < ${nodes[x].key} → 왼쪽`, { active: x, parent: y });
            x = nodes[x].l;
            snap(5, `x = x.left = ${x == null ? "NIL" : nodes[x].key}`, { active: x, parent: y });
          } else {
            snap(4, `${key} ≥ ${nodes[x].key} → 오른쪽`, { active: x, parent: y });
            x = nodes[x].r;
            snap(6, `x = x.right = ${x == null ? "NIL" : nodes[x].key}`, { active: x, parent: y });
          }
        }
        // attach
        const node = { id: newId, key, l: null, r: null, p: y };
        nodes.push(node);
        snap(7, `z.p = ${y == null ? "NIL" : nodes[y].key}`, { parent: y, inserted: newId });
        if (y == null) {
          rootId = newId;
          snap(9, `T.root = ${key} (빈 트리였음)`, { inserted: newId });
        } else if (key < nodes[y].key) {
          nodes[y].l = newId;
          snap(11, `${nodes[y].key}.left = ${key}`, { parent: y, inserted: newId });
        } else {
          nodes[y].r = newId;
          snap(12, `${nodes[y].key}.right = ${key}`, { parent: y, inserted: newId });
        }
      });
      snap(0, `모든 ${seq.length}개 키 삽입 완료`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText("Binary Search Tree — TREE-INSERT", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      if (frame.rootId == null || frame.nodes.length === 0) {
        svg.appendChild(svgText("(빈 트리)", {
          x: W / 2, y: H / 2, "text-anchor": "middle",
          "font-size": 16, "font-family": "sans-serif", fill: "#a8a29e",
        }));
        return;
      }
      // Compute x-position via in-order traversal; y-position via depth.
      const nodes = frame.nodes;
      const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
      const pos = {};
      let counter = 0;
      function assign(id, depth) {
        if (id == null) return;
        const n = byId[id];
        assign(n.l, depth + 1);
        pos[id] = { col: counter++, depth };
        assign(n.r, depth + 1);
      }
      assign(frame.rootId, 0);
      const maxCol = Math.max(1, counter - 1);
      const maxDepth = Math.max(1, Math.max(...Object.values(pos).map(p => p.depth)));
      const padL = 50, padR = 50, padT = 50, padB = 50;
      const X = (col) => padL + (maxCol === 0 ? (W - padL - padR) / 2 : col * (W - padL - padR) / maxCol);
      const Y = (d) => padT + d * (H - padT - padB) / (maxDepth || 1);

      // Edges first
      for (const n of nodes) {
        const p = pos[n.id];
        if (!p) continue;
        for (const childId of [n.l, n.r]) {
          if (childId == null) continue;
          const c = pos[childId];
          if (!c) continue;
          svg.appendChild(svgEl("line", {
            x1: X(p.col), y1: Y(p.depth),
            x2: X(c.col), y2: Y(c.depth),
            stroke: PALETTE.edge, "stroke-width": 2,
          }));
        }
      }
      // Nodes
      for (const n of nodes) {
        const p = pos[n.id];
        if (!p) continue;
        let fill = PALETTE.idle;
        let strokeW = 2;
        if (frame.inserted === n.id) { fill = PALETTE.done; strokeW = 3; }
        else if (frame.active === n.id) { fill = PALETTE.active; strokeW = 3; }
        else if (frame.parent === n.id) { fill = PALETTE.compare; strokeW = 3; }
        svg.appendChild(svgEl("circle", {
          cx: X(p.col), cy: Y(p.depth), r: 20, fill,
          stroke: "#1f2937", "stroke-width": strokeW,
        }));
        svg.appendChild(svgText(String(n.key), {
          x: X(p.col), y: Y(p.depth) + 5, "text-anchor": "middle",
          "font-size": 13, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      }
    },
  }));

  /* =========================================================
     Chaining Hash Table — CHAINED-HASH-INSERT
     ========================================================= */
  register("hashing", () => ({
    title: "Chaining Hash Table — CHAINED-HASH-INSERT",
    legend: [
      { color: PALETTE.idle,    label: "빈 슬롯" },
      { color: PALETTE.done,    label: "저장된 키" },
      { color: PALETTE.active,  label: "방금 삽입" },
      { color: PALETTE.compare, label: "해시되는 슬롯" },
    ],
    pseudocode: [
      ["CHAINED-HASH-INSERT(T, k)", ""],
      ["  i = h(k)", "// h(k) = k mod m"],
      ["  prepend k to T[i]", ""],
      ["", ""],
      ["LOAD FACTOR", ""],
      ["  α = n / m", ""],
      ["  기대 검색 시간 Θ(1 + α)", ""],
    ],
    editableInput: {
      label: "키 시퀀스 (쉼표). 해시 함수는 k mod 9:",
      defaultValue: "5, 28, 19, 15, 20, 33, 12, 17, 10",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map((t) => {
          const n = Number(t);
          if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
            throw new Error(`양의 정수여야 함: "${t}"`);
          }
          return n;
        });
        if (arr.length < 1) throw new Error("키 1개 이상 필요");
        if (arr.length > 30) throw new Error("최대 30개");
        return arr;
      },
    },
    build(input) {
      const M = 9;
      const keys = Array.isArray(input) ? input : [5, 28, 19, 15, 20, 33, 12, 17, 10];
      const table = Array.from({ length: M }, () => []);
      const frames = [];
      const snap = (line, msg, extra = {}) => frames.push({
        table: table.map(slot => [...slot]),
        line, msg,
        activeSlot: extra.activeSlot ?? null,
        activeKey: extra.activeKey ?? null,
      });
      snap(0, `빈 해시 테이블 (크기 m = ${M}), h(k) = k mod ${M}`);
      keys.forEach((k) => {
        const i = ((k % M) + M) % M;
        snap(0, `CHAINED-HASH-INSERT(T, ${k})`);
        snap(1, `i = h(${k}) = ${k} mod ${M} = ${i}`, { activeSlot: i });
        table[i].unshift(k);
        snap(2, `슬롯 ${i}의 head에 ${k} prepend → 현재 체인: [${table[i].join(", ")}]`, {
          activeSlot: i, activeKey: k,
        });
      });
      const n = keys.length;
      snap(5, `n = ${n}, m = ${M}, α = ${(n / M).toFixed(2)}`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText(
        `Chaining Hash — h(k) = k mod ${frame.table.length}`,
        { x: W / 2, y: 22, "text-anchor": "middle",
          "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c" }));

      const M = frame.table.length;
      const padL = 60, padR = 40, padT = 50;
      const rowH = (H - padT - 40) / M;
      const slotW = 70;

      for (let i = 0; i < M; i++) {
        const y = padT + i * rowH + rowH / 2;
        // slot index label
        svg.appendChild(svgText(String(i), {
          x: padL - 26, y: y + 5, "text-anchor": "middle",
          "font-size": 13, "font-weight": 700, "font-family": "monospace",
          fill: frame.activeSlot === i ? PALETTE.compare : "#78716c",
        }));
        // slot box
        svg.appendChild(svgEl("rect", {
          x: padL, y: y - 16, width: slotW, height: 32, rx: 4,
          fill: frame.activeSlot === i ? "#fef3c7" : "#f5f5f4",
          stroke: frame.activeSlot === i ? PALETTE.compare : "#d4d4d4",
          "stroke-width": frame.activeSlot === i ? 2 : 1,
        }));
        // chain items
        const chain = frame.table[i];
        let cx = padL + slotW + 20;
        chain.forEach((k) => {
          const isJust = frame.activeKey === k && frame.activeSlot === i && chain[0] === k;
          svg.appendChild(svgEl("line", {
            x1: cx - 18, y1: y, x2: cx - 2, y2: y,
            stroke: "#94a3b8", "stroke-width": 1.5,
            "marker-end": "url(#arrow)",  // no marker defined; line is fine visually
          }));
          svg.appendChild(svgEl("rect", {
            x: cx, y: y - 14, width: 46, height: 28, rx: 4,
            fill: isJust ? PALETTE.active : PALETTE.done,
            stroke: "#1f2937", "stroke-width": isJust ? 2 : 1,
          }));
          svg.appendChild(svgText(String(k), {
            x: cx + 23, y: y + 5, "text-anchor": "middle",
            "font-size": 12, "font-weight": 700, "font-family": "monospace", fill: "#fff",
          }));
          cx += 66;
        });
        if (chain.length === 0) {
          svg.appendChild(svgText("∅", {
            x: padL + slotW + 30, y: y + 5, "text-anchor": "middle",
            "font-size": 14, "font-family": "sans-serif", fill: "#a8a29e",
          }));
        }
      }
    },
  }));

  /* =========================================================
     Disjoint Set Union — MAKE-SET / UNION / FIND-SET
     (rank + path compression)
     ========================================================= */
  register("unionfind", () => ({
    title: "Disjoint Set — UNION-BY-RANK + Path Compression",
    legend: [
      { color: PALETTE.idle,    label: "일반 노드" },
      { color: PALETTE.active,  label: "현재 연산 대상" },
      { color: PALETTE.done,    label: "루트 (rank 표시)" },
      { color: PALETTE.compare, label: "압축 대상 경로" },
    ],
    pseudocode: [
      ["UNION(u, v)", ""],
      ["  ru = FIND-SET(u)", ""],
      ["  rv = FIND-SET(v)", ""],
      ["  if ru == rv: return", ""],
      ["  if ru.rank < rv.rank", ""],
      ["    ru.p = rv", ""],
      ["  elseif ru.rank > rv.rank", ""],
      ["    rv.p = ru", ""],
      ["  else rv.p = ru; ru.rank += 1", ""],
    ],
    editableInput: {
      label: "연산 시퀀스 (한 줄에 하나): `U a b` = union, `F a` = find",
      defaultValue: "U 1 2\nU 3 4\nU 5 6\nU 1 3\nU 5 7\nU 1 5\nF 6",
      parse(text) {
        const lines = String(text).split(/\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 1) throw new Error("최소 1개 연산 필요");
        if (lines.length > 40) throw new Error("최대 40개 연산");
        const ops = lines.map((l) => {
          const p = l.split(/\s+/);
          if (p[0].toUpperCase() === "U" && p.length === 3) {
            return { op: "U", a: +p[1], b: +p[2] };
          }
          if (p[0].toUpperCase() === "F" && p.length === 2) {
            return { op: "F", a: +p[1] };
          }
          throw new Error(`형식 오류: "${l}" — 예: "U 1 2" 또는 "F 3"`);
        });
        return ops;
      },
    },
    build(input) {
      const ops = Array.isArray(input) ? input : [
        { op: "U", a: 1, b: 2 }, { op: "U", a: 3, b: 4 }, { op: "U", a: 5, b: 6 },
        { op: "U", a: 1, b: 3 }, { op: "U", a: 5, b: 7 }, { op: "U", a: 1, b: 5 },
        { op: "F", a: 6 },
      ];
      // Elements: union of all keys mentioned.
      const keys = new Set();
      ops.forEach((o) => { keys.add(o.a); if (o.b != null) keys.add(o.b); });
      const ids = [...keys].sort((a, b) => a - b);
      const parent = {};   // key → key
      const rank = {};
      ids.forEach((k) => { parent[k] = k; rank[k] = 0; });

      const frames = [];
      let highlight = { active: new Set(), compressed: new Set() };
      const snap = (line, msg) => frames.push({
        ids, parent: { ...parent }, rank: { ...rank }, line, msg,
        active: new Set(highlight.active),
        compressed: new Set(highlight.compressed),
      });

      function findRoot(x) {
        const path = [];
        let cur = x;
        while (parent[cur] !== cur) { path.push(cur); cur = parent[cur]; }
        const root = cur;
        // path compression
        path.forEach((p) => {
          parent[p] = root;
          highlight.compressed.add(p);
        });
        return root;
      }

      snap(0, `초기화: ${ids.length}개 원소 각자 자신을 부모로`);

      ops.forEach((o, idx) => {
        highlight = { active: new Set(), compressed: new Set() };
        if (o.op === "U") {
          highlight.active.add(o.a); highlight.active.add(o.b);
          snap(0, `${idx + 1}. UNION(${o.a}, ${o.b})`);
          snap(1, `ru = FIND-SET(${o.a})`);
          const ru = findRoot(o.a);
          snap(2, `rv = FIND-SET(${o.b})`);
          const rv = findRoot(o.b);
          if (ru === rv) {
            snap(3, `ru = rv = ${ru} → 이미 같은 집합`);
            return;
          }
          if (rank[ru] < rank[rv]) {
            parent[ru] = rv;
            snap(5, `rank[${ru}]=${rank[ru]} < rank[${rv}]=${rank[rv]} → ${ru}.p = ${rv}`);
          } else if (rank[ru] > rank[rv]) {
            parent[rv] = ru;
            snap(7, `rank[${ru}]=${rank[ru]} > rank[${rv}]=${rank[rv]} → ${rv}.p = ${ru}`);
          } else {
            parent[rv] = ru;
            rank[ru] += 1;
            snap(8, `rank 동일 → ${rv}.p = ${ru}, rank[${ru}] += 1`);
          }
        } else {
          // FIND
          highlight.active.add(o.a);
          snap(0, `${idx + 1}. FIND-SET(${o.a})`);
          const r = findRoot(o.a);
          snap(0, `루트 = ${r} (경로 압축 수행)`);
        }
      });
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText("Disjoint Set (Union-Find)", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      const ids = frame.ids;
      const parent = frame.parent;
      const rank = frame.rank;
      // Group by root to lay out forests
      const groups = {};
      ids.forEach((k) => {
        let r = k;
        while (parent[r] !== r) r = parent[r];
        (groups[r] = groups[r] || []).push(k);
      });
      const rootList = Object.keys(groups).map(Number).sort((a, b) => a - b);
      const padL = 40, padR = 40, padT = 60;
      const groupW = (W - padL - padR) / Math.max(1, rootList.length);

      rootList.forEach((root, gi) => {
        const gx0 = padL + gi * groupW;
        // BFS layout inside the group
        const members = groups[root];
        const children = {};
        members.forEach((m) => {
          if (m === root) return;
          const p = parent[m];
          (children[p] = children[p] || []).push(m);
        });
        // Depth assignment
        const depth = { [root]: 0 };
        const queue = [root]; let maxDepth = 0;
        while (queue.length) {
          const u = queue.shift();
          for (const c of (children[u] || [])) {
            depth[c] = depth[u] + 1;
            maxDepth = Math.max(maxDepth, depth[c]);
            queue.push(c);
          }
        }
        const byDepth = {};
        members.forEach((m) => {
          const d = depth[m] ?? 0;
          (byDepth[d] = byDepth[d] || []).push(m);
        });
        const rowH = (H - padT - 40) / (maxDepth + 1);
        const pos = {};
        Object.keys(byDepth).map(Number).sort((a, b) => a - b).forEach((d) => {
          const arr = byDepth[d];
          arr.forEach((m, mi) => {
            pos[m] = {
              x: gx0 + (groupW / (arr.length + 1)) * (mi + 1),
              y: padT + d * rowH,
            };
          });
        });
        // edges
        members.forEach((m) => {
          if (m === root) return;
          const p = parent[m];
          if (!pos[p] || !pos[m]) return;
          svg.appendChild(svgEl("line", {
            x1: pos[m].x, y1: pos[m].y, x2: pos[p].x, y2: pos[p].y,
            stroke: frame.compressed.has(m) ? PALETTE.compare : PALETTE.edge,
            "stroke-width": frame.compressed.has(m) ? 3 : 2,
            "stroke-dasharray": frame.compressed.has(m) ? null : null,
          }));
        });
        // nodes
        members.forEach((m) => {
          if (!pos[m]) return;
          let fill = PALETTE.idle;
          if (m === root) fill = PALETTE.done;
          if (frame.active.has(m)) fill = PALETTE.active;
          svg.appendChild(svgEl("circle", {
            cx: pos[m].x, cy: pos[m].y, r: 18, fill,
            stroke: "#1f2937", "stroke-width": 2,
          }));
          svg.appendChild(svgText(String(m), {
            x: pos[m].x, y: pos[m].y + 5, "text-anchor": "middle",
            "font-size": 12, "font-weight": 700, "font-family": "monospace", fill: "#fff",
          }));
          if (m === root) {
            svg.appendChild(svgText(`r=${rank[root] ?? 0}`, {
              x: pos[m].x, y: pos[m].y - 24, "text-anchor": "middle",
              "font-size": 10, "font-family": "monospace", fill: "#78716c",
            }));
          }
        });
      });
    },
  }));

  /* =========================================================
     Red-Black Tree — RB-INSERT + RB-INSERT-FIXUP
     - 삽입 후 색을 RED로 두고 fix-up 루프 실행
     - 3 케이스: uncle RED / uncle BLACK & 내부 / uncle BLACK & 외부
     - NIL은 null(BLACK으로 간주)
     ========================================================= */
  register("rbtree", () => ({
    title: "Red-Black Tree — RB-INSERT + FIXUP",
    legend: [
      { color: "#dc2626", label: "RED 노드" },
      { color: "#1f2937", label: "BLACK 노드" },
      { color: PALETTE.active, label: "z (방금 삽입 / fix-up 대상)" },
      { color: PALETTE.compare, label: "부모·삼촌 (참조)" },
      { color: PALETTE.pivot, label: "회전 축" },
    ],
    pseudocode: [
      ["RB-INSERT(T, z)", ""],
      ["  BST insert로 z 배치 후 z.color = RED", ""],
      ["RB-INSERT-FIXUP(T, z)", ""],
      ["  while z.p.color == RED", ""],
      ["    if z.p == z.p.p.left", ""],
      ["      y = z.p.p.right  // uncle", ""],
      ["      Case 1: y.color == RED", "recolor parent/uncle BLACK, gp RED; z = gp"],
      ["      Case 2: z == z.p.right", "z = z.p; LEFT-ROTATE(z)"],
      ["      Case 3: otherwise", "z.p BLACK, gp RED; RIGHT-ROTATE(gp)"],
      ["    else (mirror)  // z.p is right child", ""],
      ["  T.root.color = BLACK", ""],
    ],
    editableInput: {
      label: "삽입할 키 시퀀스 (쉼표):",
      defaultValue: "11, 2, 14, 1, 7, 15, 5, 8, 4",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map(Number);
        if (arr.some(Number.isNaN)) throw new Error("숫자만 허용");
        if (arr.length < 1) throw new Error("키 1개 이상");
        if (arr.length > 15) throw new Error("최대 15개");
        const seen = new Set();
        for (const k of arr) {
          if (seen.has(k)) throw new Error(`중복 키: ${k}`);
          seen.add(k);
        }
        return arr;
      },
    },
    build(input) {
      const seq = Array.isArray(input) ? input.slice() : [11, 2, 14, 1, 7, 15, 5, 8, 4];
      /* node: { id, key, color: "R"|"B", l, r, p }  (l/r/p are ids; null = NIL) */
      let nodes = [];
      let rootId = null;
      let nextId = 0;
      const frames = [];

      const N = (id) => (id == null ? null : nodes[id]);

      function snap(line, msg, extra = {}) {
        frames.push({
          nodes: nodes.map(n => ({ ...n })),
          rootId,
          line, msg,
          z: extra.z ?? null,
          parent: extra.parent ?? null,
          uncle: extra.uncle ?? null,
          rotateAxis: extra.rotateAxis ?? null,
          caseLabel: extra.caseLabel ?? null,
        });
      }

      function leftRotate(xId) {
        const x = N(xId), y = N(x.r);
        x.r = y.l;
        if (y.l != null) N(y.l).p = xId;
        y.p = x.p;
        if (x.p == null) rootId = y.id;
        else if (xId === N(x.p).l) N(x.p).l = y.id;
        else N(x.p).r = y.id;
        y.l = xId;
        x.p = y.id;
      }
      function rightRotate(xId) {
        const x = N(xId), y = N(x.l);
        x.l = y.r;
        if (y.r != null) N(y.r).p = xId;
        y.p = x.p;
        if (x.p == null) rootId = y.id;
        else if (xId === N(x.p).l) N(x.p).l = y.id;
        else N(x.p).r = y.id;
        y.r = xId;
        x.p = y.id;
      }
      function colorOf(id) { return id == null ? "B" : N(id).color; }

      snap(0, `RB-Tree 초기 상태: 빈 트리. 삽입: ${seq.join(" → ")}`);

      seq.forEach((key, stepIdx) => {
        /* BST insert */
        const newId = nextId++;
        let y = null, x = rootId;
        while (x != null) {
          y = x;
          x = key < N(x).key ? N(x).l : N(x).r;
        }
        const z = { id: newId, key, color: "R", l: null, r: null, p: y };
        nodes.push(z);
        if (y == null) rootId = newId;
        else if (key < N(y).key) N(y).l = newId;
        else N(y).r = newId;
        snap(1, `[${stepIdx + 1}] BST-INSERT ${key}, 색=RED`, { z: newId, parent: y });

        /* FIXUP */
        let zi = newId;
        while (N(zi).p != null && colorOf(N(zi).p) === "R") {
          const p = N(zi).p;
          const gp = N(p).p;
          if (gp == null) break;
          const pIsLeft = (p === N(gp).l);
          const uncle = pIsLeft ? N(gp).r : N(gp).l;
          snap(3, `fix-up: z=${N(zi).key}, parent=${N(p).key} RED → 검사`, {
            z: zi, parent: p, uncle: uncle,
          });
          if (uncle != null && N(uncle).color === "R") {
            /* Case 1 */
            N(p).color = "B";
            N(uncle).color = "B";
            N(gp).color = "R";
            snap(6, `Case 1: uncle RED → parent/uncle BLACK, grandparent RED`, {
              z: zi, parent: p, uncle: uncle, caseLabel: "Case 1",
            });
            zi = gp;
          } else {
            if (pIsLeft) {
              if (zi === N(p).r) {
                /* Case 2 → 좌회전 후 Case 3 */
                zi = p;
                snap(7, `Case 2 (좌): LEFT-ROTATE(${N(zi).key})`, {
                  z: zi, rotateAxis: zi, caseLabel: "Case 2",
                });
                leftRotate(zi);
              }
              /* Case 3 */
              const p2 = N(zi).p, gp2 = N(p2).p;
              N(p2).color = "B";
              N(gp2).color = "R";
              snap(8, `Case 3 (좌): 색교환 + RIGHT-ROTATE(${N(gp2).key})`, {
                z: zi, parent: p2, rotateAxis: gp2, caseLabel: "Case 3",
              });
              rightRotate(gp2);
            } else {
              if (zi === N(p).l) {
                zi = p;
                snap(7, `Case 2 (우): RIGHT-ROTATE(${N(zi).key})`, {
                  z: zi, rotateAxis: zi, caseLabel: "Case 2",
                });
                rightRotate(zi);
              }
              const p2 = N(zi).p, gp2 = N(p2).p;
              N(p2).color = "B";
              N(gp2).color = "R";
              snap(8, `Case 3 (우): 색교환 + LEFT-ROTATE(${N(gp2).key})`, {
                z: zi, parent: p2, rotateAxis: gp2, caseLabel: "Case 3",
              });
              leftRotate(gp2);
            }
          }
        }
        N(rootId).color = "B";
        snap(10, `루트 BLACK 강제 — 현재 트리 상태 (${stepIdx + 1}개 삽입)`);
      });
      snap(0, `완료: ${seq.length}개 키 삽입된 RB-Tree`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText("Red-Black Tree — RB-INSERT + FIXUP", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      if (frame.caseLabel) {
        svg.appendChild(svgText(`▶ ${frame.caseLabel}`, {
          x: W - 20, y: 22, "text-anchor": "end",
          "font-size": 13, "font-weight": 700, "font-family": "sans-serif",
          fill: frame.caseLabel.includes("1") ? "#dc2626"
              : frame.caseLabel.includes("2") ? "#ea580c"
              : "#7c3aed",
        }));
      }
      if (frame.rootId == null || frame.nodes.length === 0) {
        svg.appendChild(svgText("(빈 트리)", {
          x: W / 2, y: H / 2, "text-anchor": "middle",
          "font-size": 16, "font-family": "sans-serif", fill: "#a8a29e",
        }));
        return;
      }
      const byId = Object.fromEntries(frame.nodes.map(n => [n.id, n]));
      const pos = {};
      let col = 0;
      function assign(id, depth) {
        if (id == null) return;
        const n = byId[id];
        assign(n.l, depth + 1);
        pos[id] = { col: col++, depth };
        assign(n.r, depth + 1);
      }
      assign(frame.rootId, 0);
      const maxCol = Math.max(1, col - 1);
      const maxDepth = Math.max(1, Math.max(...Object.values(pos).map(p => p.depth)));
      const padL = 50, padR = 50, padT = 55, padB = 55;
      const X = (c) => padL + (maxCol === 0 ? (W - padL - padR) / 2 : c * (W - padL - padR) / maxCol);
      const Y = (d) => padT + d * (H - padT - padB) / (maxDepth || 1);

      for (const n of frame.nodes) {
        const p = pos[n.id]; if (!p) continue;
        for (const cid of [n.l, n.r]) {
          if (cid == null) continue;
          const cp = pos[cid]; if (!cp) continue;
          svg.appendChild(svgEl("line", {
            x1: X(p.col), y1: Y(p.depth),
            x2: X(cp.col), y2: Y(cp.depth),
            stroke: PALETTE.edge, "stroke-width": 2,
          }));
        }
      }
      for (const n of frame.nodes) {
        const p = pos[n.id]; if (!p) continue;
        const baseFill = n.color === "R" ? "#dc2626" : "#1f2937";
        let stroke = "#0f172a";
        let strokeW = 2;
        if (frame.z === n.id) { stroke = PALETTE.active; strokeW = 4; }
        else if (frame.parent === n.id) { stroke = PALETTE.compare; strokeW = 3; }
        else if (frame.uncle === n.id) { stroke = PALETTE.compare; strokeW = 3; }
        else if (frame.rotateAxis === n.id) { stroke = PALETTE.pivot; strokeW = 4; }
        svg.appendChild(svgEl("circle", {
          cx: X(p.col), cy: Y(p.depth), r: 20, fill: baseFill,
          stroke, "stroke-width": strokeW,
        }));
        svg.appendChild(svgText(String(n.key), {
          x: X(p.col), y: Y(p.depth) + 5, "text-anchor": "middle",
          "font-size": 13, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      }
    },
  }));

  /* =========================================================
     Red-Black Tree — RB-DELETE + RB-DELETE-FIXUP (CLRS 13.4)
     초기 트리는 INSERT-FIXUP으로 미리 구성.
     사용자 입력은 삭제할 키 시퀀스.
     FIXUP 4 cases (대칭 미러 포함) 모두 단계별 시각화:
       Case 1: w RED                           → 색교환 + ROTATE
       Case 2: w BLACK, 두 자식 BLACK          → w RED, x = x.p
       Case 3: w BLACK, 가까운자식 RED, 먼자식 BLACK → ROTATE w → Case 4
       Case 4: w BLACK, 먼자식 RED              → 색복사 + ROTATE, x = root
     ========================================================= */
  register("rbtreeDelete", () => ({
    title: "Red-Black Tree — RB-DELETE + FIXUP",
    legend: [
      { color: "#dc2626",       label: "RED 노드" },
      { color: "#1f2937",       label: "BLACK 노드" },
      { color: PALETTE.active,  label: "z (삭제) / x (doubly-black)" },
      { color: PALETTE.compare, label: "y (대체) / w (sibling)" },
      { color: PALETTE.pivot,   label: "회전 축" },
    ],
    pseudocode: [
      ["RB-DELETE(T, z) → 자식 수 분기 → x, y-orig-color 결정", ""],
      ["if y-orig-color == BLACK: RB-DELETE-FIXUP(T, x)", ""],
      ["FIXUP loop: while x ≠ root and x.color == BLACK", ""],
      ["  Case 1: w RED",  "→ w BLACK, x.p RED, ROTATE x.p, w = new sibling"],
      ["  Case 2: w BLACK, 두 자식 BLACK", "→ w RED, x = x.p (반복)"],
      ["  Case 3: 가까운자식 RED, 먼자식 BLACK", "→ ROTATE w → Case 4"],
      ["  Case 4: 먼자식 RED", "→ 색교환, ROTATE x.p, x = root (종료)"],
      ["x.color = BLACK", ""],
    ],
    editableInput: {
      label: "삭제 키 (쉼표). 초기 트리 = INSERT(11,2,14,1,7,15,5,8,4)",
      defaultValue: "8, 11, 1",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map(Number);
        if (arr.some(Number.isNaN)) throw new Error("숫자만 허용");
        if (arr.length < 1 || arr.length > 5) throw new Error("1~5개 키");
        return arr;
      },
    },
    build(input) {
      const insertSeq = [11, 2, 14, 1, 7, 15, 5, 8, 4];
      const deleteSeq = Array.isArray(input) ? input.slice() : [8, 11, 1];

      let nodes = [];
      let rootId = null;
      let nextId = 0;
      const frames = [];
      const N = (id) => (id == null ? null : nodes[id]);
      const colorOf = (id) => (id == null ? "B" : N(id).color);

      function snap(line, msg, extra = {}) {
        frames.push({
          nodes: nodes.map(n => ({ ...n })),
          rootId, line, msg,
          z: extra.z ?? null,
          y: extra.y ?? null,
          x: extra.x ?? null,
          w: extra.w ?? null,
          rotateAxis: extra.rotateAxis ?? null,
          caseLabel: extra.caseLabel ?? null,
        });
      }
      function leftRotate(xId) {
        const x = N(xId), y = N(x.r);
        x.r = y.l;
        if (y.l != null) N(y.l).p = xId;
        y.p = x.p;
        if (x.p == null) rootId = y.id;
        else if (xId === N(x.p).l) N(x.p).l = y.id;
        else N(x.p).r = y.id;
        y.l = xId;
        x.p = y.id;
      }
      function rightRotate(xId) {
        const x = N(xId), y = N(x.l);
        x.l = y.r;
        if (y.r != null) N(y.r).p = xId;
        y.p = x.p;
        if (x.p == null) rootId = y.id;
        else if (xId === N(x.p).l) N(x.p).l = y.id;
        else N(x.p).r = y.id;
        y.r = xId;
        x.p = y.id;
      }
      function transplant(uId, vId) {
        const u = N(uId);
        if (u.p == null) rootId = vId;
        else if (uId === N(u.p).l) N(u.p).l = vId;
        else N(u.p).r = vId;
        if (vId != null) N(vId).p = u.p;
      }

      /* INSERT (BST + FIXUP) — rbtree와 동일 로직 */
      function rbInsert(key) {
        const newId = nextId++;
        let y = null, x = rootId;
        while (x != null) { y = x; x = key < N(x).key ? N(x).l : N(x).r; }
        const z = { id: newId, key, color: "R", l: null, r: null, p: y };
        nodes.push(z);
        if (y == null) rootId = newId;
        else if (key < N(y).key) N(y).l = newId;
        else N(y).r = newId;
        let zi = newId;
        while (N(zi).p != null && colorOf(N(zi).p) === "R") {
          const p = N(zi).p;
          const gp = N(p).p;
          if (gp == null) break;
          const pIsLeft = (p === N(gp).l);
          const uncle = pIsLeft ? N(gp).r : N(gp).l;
          if (uncle != null && N(uncle).color === "R") {
            N(p).color = "B"; N(uncle).color = "B"; N(gp).color = "R";
            zi = gp;
          } else {
            if (pIsLeft) {
              if (zi === N(p).r) { zi = p; leftRotate(zi); }
              const p2 = N(zi).p, gp2 = N(p2).p;
              N(p2).color = "B"; N(gp2).color = "R";
              rightRotate(gp2);
            } else {
              if (zi === N(p).l) { zi = p; rightRotate(zi); }
              const p2 = N(zi).p, gp2 = N(p2).p;
              N(p2).color = "B"; N(gp2).color = "R";
              leftRotate(gp2);
            }
          }
        }
        N(rootId).color = "B";
      }
      insertSeq.forEach(rbInsert);
      snap(0, `초기 RB-Tree (INSERT: ${insertSeq.join(", ")})`);

      function findIdByKey(k) {
        let id = rootId;
        while (id != null && N(id).key !== k) {
          id = k < N(id).key ? N(id).l : N(id).r;
        }
        return id;
      }
      function treeMin(id) { while (N(id).l != null) id = N(id).l; return id; }

      function rbDeleteFixup(xId, xParentId, xIsLeft) {
        let safety = 0;
        while (xId !== rootId && colorOf(xId) === "B" && xParentId != null && safety++ < 30) {
          if (xIsLeft) {
            let wId = N(xParentId).r;
            if (wId == null) break;
            if (colorOf(wId) === "R") {
              snap(3, `Case 1: w=${N(wId).key} RED → w BLACK, x.p RED, LEFT-ROTATE(x.p=${N(xParentId).key})`, {
                x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                w: wId, rotateAxis: xParentId, caseLabel: "Case 1",
              });
              N(wId).color = "B"; N(xParentId).color = "R";
              leftRotate(xParentId);
              wId = N(xParentId).r;
              if (wId == null) break;
            }
            if (colorOf(N(wId).l) === "B" && colorOf(N(wId).r) === "B") {
              N(wId).color = "R";
              snap(4, `Case 2: w=${N(wId).key} 자식 둘 BLACK → w RED, x = x.p (한 칸 위로)`, {
                x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                w: wId, caseLabel: "Case 2",
              });
              xId = xParentId;
              xParentId = N(xId).p;
              xIsLeft = xParentId != null ? (xId === N(xParentId).l) : false;
            } else {
              if (colorOf(N(wId).r) === "B") {
                N(N(wId).l).color = "B";
                N(wId).color = "R";
                snap(5, `Case 3: w 가까운자식 RED, 먼자식 BLACK → 색교환, RIGHT-ROTATE(w=${N(wId).key})`, {
                  x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                  w: wId, rotateAxis: wId, caseLabel: "Case 3",
                });
                rightRotate(wId);
                wId = N(xParentId).r;
              }
              N(wId).color = N(xParentId).color;
              N(xParentId).color = "B";
              if (N(wId).r != null) N(N(wId).r).color = "B";
              snap(6, `Case 4: w 먼자식 RED → 색복사, LEFT-ROTATE(x.p=${N(xParentId).key}), 종료`, {
                x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                w: wId, rotateAxis: xParentId, caseLabel: "Case 4",
              });
              leftRotate(xParentId);
              xId = rootId;
              break;
            }
          } else {
            let wId = N(xParentId).l;
            if (wId == null) break;
            if (colorOf(wId) === "R") {
              snap(3, `Case 1 (mirror): w=${N(wId).key} RED → 색교환, RIGHT-ROTATE(x.p)`, {
                x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                w: wId, rotateAxis: xParentId, caseLabel: "Case 1",
              });
              N(wId).color = "B"; N(xParentId).color = "R";
              rightRotate(xParentId);
              wId = N(xParentId).l;
              if (wId == null) break;
            }
            if (colorOf(N(wId).l) === "B" && colorOf(N(wId).r) === "B") {
              N(wId).color = "R";
              snap(4, `Case 2 (mirror): w 자식 둘 BLACK → w RED, x = x.p`, {
                x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                w: wId, caseLabel: "Case 2",
              });
              xId = xParentId;
              xParentId = N(xId).p;
              xIsLeft = xParentId != null ? (xId === N(xParentId).l) : false;
            } else {
              if (colorOf(N(wId).l) === "B") {
                N(N(wId).r).color = "B";
                N(wId).color = "R";
                snap(5, `Case 3 (mirror): 가까운자식 RED → LEFT-ROTATE(w=${N(wId).key})`, {
                  x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                  w: wId, rotateAxis: wId, caseLabel: "Case 3",
                });
                leftRotate(wId);
                wId = N(xParentId).l;
              }
              N(wId).color = N(xParentId).color;
              N(xParentId).color = "B";
              if (N(wId).l != null) N(N(wId).l).color = "B";
              snap(6, `Case 4 (mirror): 먼자식 RED → 색복사, RIGHT-ROTATE(x.p), 종료`, {
                x: { id: xId, parent: xParentId, isLeft: xIsLeft },
                w: wId, rotateAxis: xParentId, caseLabel: "Case 4",
              });
              rightRotate(xParentId);
              xId = rootId;
              break;
            }
          }
        }
        if (xId != null) N(xId).color = "B";
        snap(7, `FIXUP 완료: x.color = BLACK 보장`);
      }

      function rbDelete(zKey) {
        const zId = findIdByKey(zKey);
        if (zId == null) {
          snap(0, `키 ${zKey} 트리에 없음 — 건너뜀`);
          return;
        }
        snap(0, `RB-DELETE(${zKey}) 시작`, { z: zId });

        let yId = zId;
        let yOriginalColor = N(yId).color;
        let xId = null, xParentId = null, xIsLeft = false;

        if (N(zId).l == null) {
          xId = N(zId).r;
          xParentId = N(zId).p;
          xIsLeft = xParentId != null ? (zId === N(xParentId).l) : false;
          transplant(zId, N(zId).r);
          snap(0, `z의 왼쪽이 NIL → x = z.right로 대체 (TRANSPLANT)`, {
            z: zId, x: { id: xId, parent: xParentId, isLeft: xIsLeft },
          });
        } else if (N(zId).r == null) {
          xId = N(zId).l;
          xParentId = N(zId).p;
          xIsLeft = xParentId != null ? (zId === N(xParentId).l) : false;
          transplant(zId, N(zId).l);
          snap(0, `z의 오른쪽이 NIL → x = z.left로 대체`, {
            z: zId, x: { id: xId, parent: xParentId, isLeft: xIsLeft },
          });
        } else {
          yId = treeMin(N(zId).r);
          yOriginalColor = N(yId).color;
          xId = N(yId).r;
          if (N(yId).p === zId) {
            xParentId = yId;
            xIsLeft = false;
          } else {
            xParentId = N(yId).p;
            xIsLeft = (yId === N(xParentId).l);
            transplant(yId, N(yId).r);
            N(yId).r = N(zId).r;
            N(N(yId).r).p = yId;
          }
          transplant(zId, yId);
          N(yId).l = N(zId).l;
          N(N(yId).l).p = yId;
          N(yId).color = N(zId).color;
          snap(0, `2자식: y = TREE-MIN(z.r) = ${N(yId).key} 가 z의 자리로 (색은 z의 원래 색으로 복사)`, {
            y: yId, x: { id: xId, parent: xParentId, isLeft: xIsLeft },
          });
        }

        if (yOriginalColor === "B") {
          snap(1, `y의 원래 색 = BLACK → DELETE-FIXUP 호출 (x는 doubly-black)`, {
            x: { id: xId, parent: xParentId, isLeft: xIsLeft },
          });
          rbDeleteFixup(xId, xParentId, xIsLeft);
        } else {
          snap(0, `y의 원래 색 = RED → fixup 불필요, RB 성질 유지`);
        }
      }

      deleteSeq.forEach(rbDelete);
      snap(0, `완료: ${deleteSeq.join(", ")} 삭제됨`);
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText("Red-Black Tree — RB-DELETE + FIXUP", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      if (frame.caseLabel) {
        const colorMap = { "Case 1": "#dc2626", "Case 2": "#ea580c", "Case 3": "#7c3aed", "Case 4": "#2563eb" };
        svg.appendChild(svgText(`▶ ${frame.caseLabel}`, {
          x: W - 20, y: 22, "text-anchor": "end",
          "font-size": 13, "font-weight": 700, "font-family": "sans-serif",
          fill: colorMap[frame.caseLabel] || "#1f2937",
        }));
      }
      if (frame.rootId == null) {
        svg.appendChild(svgText("(빈 트리)", {
          x: W / 2, y: H / 2, "text-anchor": "middle",
          "font-size": 16, "font-family": "sans-serif", fill: "#a8a29e",
        }));
        return;
      }

      /* 도달 가능 노드만 위치 계산 */
      const byId = Object.fromEntries(frame.nodes.map(n => [n.id, n]));
      const pos = {};
      let col = 0;
      const reachable = new Set();
      function assign(id, depth) {
        if (id == null || !byId[id] || reachable.has(id)) return;
        reachable.add(id);
        const n = byId[id];
        assign(n.l, depth + 1);
        pos[id] = { col: col++, depth };
        assign(n.r, depth + 1);
      }
      assign(frame.rootId, 0);

      const maxCol = Math.max(1, col - 1);
      const maxDepth = Math.max(1, Math.max(...Object.values(pos).map(p => p.depth)));
      const padL = 50, padR = 50, padT = 55, padB = 65;
      const X = (c) => padL + (maxCol === 0 ? (W - padL - padR) / 2 : c * (W - padL - padR) / maxCol);
      const Y = (d) => padT + d * (H - padT - padB) / (maxDepth || 1);

      /* 간선 */
      for (const id of reachable) {
        const n = byId[id];
        const p = pos[id]; if (!p) continue;
        for (const cid of [n.l, n.r]) {
          if (cid == null || !pos[cid]) continue;
          svg.appendChild(svgEl("line", {
            x1: X(p.col), y1: Y(p.depth),
            x2: X(pos[cid].col), y2: Y(pos[cid].depth),
            stroke: PALETTE.edge, "stroke-width": 2,
          }));
        }
      }

      const xObj = frame.x;
      const wId = frame.w;

      /* 노드 */
      for (const id of reachable) {
        const n = byId[id];
        const p = pos[id]; if (!p) continue;
        const baseFill = n.color === "R" ? "#dc2626" : "#1f2937";
        let stroke = "#0f172a";
        let strokeW = 2;
        if (xObj && xObj.id === n.id)            { stroke = PALETTE.active;  strokeW = 4; }
        else if (frame.z === n.id)                { stroke = PALETTE.active;  strokeW = 4; }
        else if (frame.y === n.id)                { stroke = PALETTE.compare; strokeW = 4; }
        else if (wId === n.id)                    { stroke = PALETTE.compare; strokeW = 3; }
        else if (frame.rotateAxis === n.id)       { stroke = PALETTE.pivot;   strokeW = 4; }

        svg.appendChild(svgEl("circle", {
          cx: X(p.col), cy: Y(p.depth), r: 20, fill: baseFill,
          stroke, "stroke-width": strokeW,
        }));
        svg.appendChild(svgText(String(n.key), {
          x: X(p.col), y: Y(p.depth) + 5, "text-anchor": "middle",
          "font-size": 13, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      }

      /* phantom x marker (x가 NIL일 때) */
      if (xObj && xObj.id == null && xObj.parent != null && pos[xObj.parent]) {
        const pp = pos[xObj.parent];
        const px = X(pp.col), py = Y(pp.depth);
        const dx = xObj.isLeft ? -34 : 34;
        const dy = 50;
        svg.appendChild(svgEl("line", {
          x1: px, y1: py, x2: px + dx, y2: py + dy,
          stroke: PALETTE.edge, "stroke-width": 2, "stroke-dasharray": "4,3",
        }));
        svg.appendChild(svgEl("rect", {
          x: px + dx - 12, y: py + dy - 10, width: 24, height: 20, rx: 3,
          fill: "#1f2937", stroke: PALETTE.active, "stroke-width": 3,
        }));
        svg.appendChild(svgText("x=NIL", {
          x: px + dx, y: py + dy + 4, "text-anchor": "middle",
          "font-size": 10, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      }

      /* 범례성 한 줄: x/w 표시 */
      const legendY = H - 18;
      let legendText = "";
      if (xObj) {
        const xLabel = xObj.id != null
          ? `x = ${byId[xObj.id]?.key ?? "?"}`
          : `x = NIL (parent: ${byId[xObj.parent]?.key ?? "?"})`;
        legendText += xLabel;
      }
      if (wId != null && byId[wId]) {
        legendText += (legendText ? "   " : "") + `w = ${byId[wId].key}`;
      }
      if (frame.z != null && byId[frame.z]) {
        legendText += (legendText ? "   " : "") + `z = ${byId[frame.z].key}`;
      }
      if (frame.y != null && byId[frame.y]) {
        legendText += (legendText ? "   " : "") + `y = ${byId[frame.y].key}`;
      }
      if (legendText) {
        svg.appendChild(svgText(legendText, {
          x: W / 2, y: legendY, "text-anchor": "middle",
          "font-size": 12, "font-family": "monospace", fill: "#44403c",
        }));
      }
    },
  }));

  /* =========================================================
     Order-Statistic Tree — OS-SELECT on augmented RB-tree
     각 노드 x에 x.size = |left| + |right| + 1 저장
     OS-SELECT(x, i):
       r = x.left.size + 1     // x가 x 서브트리 내 r번째
       if i == r: return x
       if i < r:  recurse x.left, i
       else:      recurse x.right, i - r
     ========================================================= */
  register("osTree", () => ({
    title: "Order-Statistic Tree — OS-SELECT",
    legend: [
      { color: PALETTE.idle,    label: "기타 노드" },
      { color: PALETTE.active,  label: "현재 방문 중 x" },
      { color: PALETTE.compare, label: "비교: r = size(x.left) + 1" },
      { color: PALETTE.done,    label: "정답 (i번째 순서통계량)" },
      { color: "#dc2626",       label: "RED" },
      { color: "#1f2937",       label: "BLACK" },
    ],
    pseudocode: [
      ["OS-SELECT(x, i)", ""],
      ["  r = x.left.size + 1", "// x가 서브트리의 r번째"],
      ["  if i == r: return x", ""],
      ["  elseif i < r", ""],
      ["    return OS-SELECT(x.left, i)", ""],
      ["  else", ""],
      ["    return OS-SELECT(x.right, i - r)", ""],
    ],
    editableInput: {
      label: "i (찾을 순서, 1..n):",
      defaultValue: "5",
      parse(text) {
        const n = Number(String(text).trim());
        if (!Number.isInteger(n) || n < 1 || n > 16) {
          throw new Error("1~16 사이의 정수");
        }
        return n;
      },
    },
    build(input) {
      const target = typeof input === "number" ? input : 5;
      /* 미리 준비된 RB-tree (CLRS Fig 14.1 스타일, 16개 원소)
         모든 노드에 size 속성 부여 */
      const raw = [
        { key: 26, color: "B" },
        { key: 17, color: "R" }, { key: 41, color: "B" },
        { key: 14, color: "B" }, { key: 21, color: "B" }, { key: 30, color: "R" }, { key: 47, color: "R" },
        { key: 10, color: "R" }, { key: 16, color: "B" }, { key: 19, color: "R" }, { key: 21, color: "R" },
        { key: 28, color: "B" }, { key: 38, color: "B" }, { key: 35, color: "R" }, { key: 39, color: "R" },
        { key: 7,  color: "R" },
      ];
      // Use a hand-crafted structure matching CLRS fig (keys in BST order).
      // Simpler: build a BST from sorted keys; approximate coloring for display.
      const keys = [7, 10, 12, 14, 15, 16, 17, 19, 20, 21, 26, 28, 35, 38, 39, 41];
      /* Build balanced-ish tree from sorted keys. id == index in nodes array
         so we assign only at push-time (post-order). */
      const nodes = [];
      function mkFromSorted(lo, hi, depth = 0) {
        if (lo > hi) return null;
        const mid = (lo + hi) >> 1;
        const lId = mkFromSorted(lo, mid - 1, depth + 1);
        const rId = mkFromSorted(mid + 1, hi, depth + 1);
        const size = 1 + (lId != null ? nodes[lId].size : 0) + (rId != null ? nodes[rId].size : 0);
        // Alternating colors by depth — not a true RB insertion, but visually useful
        const color = depth % 2 === 0 ? "B" : "R";
        const id = nodes.length;
        nodes.push({ id, key: keys[mid], color, l: lId, r: rId, size });
        return id;
      }
      const rootId = mkFromSorted(0, keys.length - 1);
      nodes[rootId].color = "B";  // enforce root BLACK
      const N = (id) => (id == null ? null : nodes[id]);

      const frames = [];
      const snap = (line, msg, extra = {}) => frames.push({
        nodes: nodes.map(n => ({ ...n })),
        rootId,
        line, msg,
        target,
        current: extra.current ?? null,
        answer: extra.answer ?? null,
        decision: extra.decision ?? null,  // "==", "<", ">"
        r: extra.r ?? null,
      });

      snap(0, `OS-SELECT(root, i=${target}) — ${keys.length}개 원소 중 ${target}번째 찾기`);
      let x = rootId;
      let i = target;
      while (x != null) {
        const leftSize = N(x).l != null ? N(N(x).l).size : 0;
        const r = leftSize + 1;
        snap(1, `x = ${N(x).key} (size=${N(x).size}), r = size(left)+1 = ${r}`, {
          current: x, r,
        });
        if (i === r) {
          snap(2, `i == r → 답: ${N(x).key}`, { current: x, answer: x, decision: "==" });
          break;
        } else if (i < r) {
          snap(3, `i(${i}) < r(${r}) → 왼쪽 서브트리로`, { current: x, r, decision: "<" });
          x = N(x).l;
          snap(4, `recurse OS-SELECT(x.left, ${i})`, { current: x });
        } else {
          const newI = i - r;
          snap(5, `i(${i}) > r(${r}) → 오른쪽 서브트리, i ← i - r = ${newI}`, { current: x, r, decision: ">" });
          i = newI;
          x = N(x).r;
          snap(6, `recurse OS-SELECT(x.right, ${i})`, { current: x });
        }
      }
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText(
        `Order-Statistic Tree — finding the ${frame.target}-th smallest`, {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));

      const byId = Object.fromEntries(frame.nodes.map(n => [n.id, n]));
      const pos = {};
      let col = 0;
      function assign(id, depth) {
        if (id == null) return;
        const n = byId[id];
        assign(n.l, depth + 1);
        pos[id] = { col: col++, depth };
        assign(n.r, depth + 1);
      }
      assign(frame.rootId, 0);
      const maxCol = Math.max(1, col - 1);
      const maxDepth = Math.max(1, Math.max(...Object.values(pos).map(p => p.depth)));
      const padL = 40, padR = 40, padT = 55, padB = 40;
      const X = (c) => padL + c * (W - padL - padR) / maxCol;
      const Y = (d) => padT + d * (H - padT - padB) / maxDepth;

      for (const n of frame.nodes) {
        const p = pos[n.id]; if (!p) continue;
        for (const cid of [n.l, n.r]) {
          if (cid == null) continue;
          const cp = pos[cid]; if (!cp) continue;
          svg.appendChild(svgEl("line", {
            x1: X(p.col), y1: Y(p.depth),
            x2: X(cp.col), y2: Y(cp.depth),
            stroke: PALETTE.edge, "stroke-width": 2,
          }));
        }
      }
      for (const n of frame.nodes) {
        const p = pos[n.id]; if (!p) continue;
        const baseFill = n.color === "R" ? "#dc2626" : "#1f2937";
        let stroke = "#0f172a";
        let strokeW = 2;
        if (frame.answer === n.id) { stroke = PALETTE.done; strokeW = 5; }
        else if (frame.current === n.id) { stroke = PALETTE.active; strokeW = 4; }
        svg.appendChild(svgEl("circle", {
          cx: X(p.col), cy: Y(p.depth), r: 18, fill: baseFill,
          stroke, "stroke-width": strokeW,
        }));
        svg.appendChild(svgText(String(n.key), {
          x: X(p.col), y: Y(p.depth) + 4, "text-anchor": "middle",
          "font-size": 12, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
        // size annotation above each node
        svg.appendChild(svgText(`s=${n.size}`, {
          x: X(p.col), y: Y(p.depth) - 22, "text-anchor": "middle",
          "font-size": 9, "font-family": "monospace",
          fill: frame.current === n.id ? PALETTE.active : "#78716c",
        }));
      }
      // Decision tag beside current node
      if (frame.r != null && frame.current != null) {
        const cp = pos[frame.current];
        if (cp) {
          svg.appendChild(svgEl("rect", {
            x: X(cp.col) + 24, y: Y(cp.depth) - 10, width: 62, height: 20, rx: 4,
            fill: "#fef3c7", stroke: "#f59e0b", "stroke-width": 1.5,
          }));
          svg.appendChild(svgText(`r=${frame.r}`, {
            x: X(cp.col) + 55, y: Y(cp.depth) + 4, "text-anchor": "middle",
            "font-size": 11, "font-family": "monospace", "font-weight": 700, fill: "#78350f",
          }));
        }
      }
    },
  }));

  /* =========================================================
     B-TREE-SEARCH (CLRS 18.1)
     각 내부 노드는 key 여러 개 + 자식 n+1개.
     선형 탐색으로 i를 찾고, 일치하면 반환, 아니면 c_i로 재귀.
     ========================================================= */
  register("btreeSearch", () => ({
    title: "B-TREE-SEARCH",
    legend: [
      { color: PALETTE.idle,    label: "일반 노드" },
      { color: PALETTE.active,  label: "현재 방문 노드 x" },
      { color: PALETTE.compare, label: "비교 중 key_i" },
      { color: PALETTE.done,    label: "발견!" },
      { color: PALETTE.pivot,   label: "내려갈 자식 c_i" },
    ],
    pseudocode: [
      ["B-TREE-SEARCH(x, k)", ""],
      ["  i = 1", ""],
      ["  while i ≤ x.n and k > x.key_i:  i = i + 1", ""],
      ["  if i ≤ x.n and k == x.key_i:", ""],
      ["    return (x, i)     // 발견", ""],
      ["  if x.leaf:", ""],
      ["    return NIL        // 없음", ""],
      ["  else:", ""],
      ["    DISK-READ(x.c_i)", ""],
      ["    return B-TREE-SEARCH(x.c_i, k)", ""],
    ],
    editableInput: {
      label: "찾을 key (미리 만든 트리에서):",
      defaultValue: "45",
      parse(text) {
        const n = Number(String(text).trim());
        if (!Number.isInteger(n)) throw new Error("정수 입력");
        return n;
      },
    },
    build(input) {
      const target = typeof input === "number" ? input : 45;
      /* Hand-built B-Tree (minimum degree t=3)
         - 루트:              [30]
         - level 1:            [10, 20] | [40, 50, 60]
         - leaves:             [1,5,8] | [12,15,17] | [22,25,28] |
                              [33,35,37] | [42,45,48] | [52,55,58] | [63,65,68]  */
      const nodes = [];
      // Helper to build and return id (== index)
      function mk(keys, children, leaf) {
        const id = nodes.length;
        nodes.push({ id, keys, children, leaf });
        return id;
      }
      const L1 = mk([1, 5, 8],     [], true);
      const L2 = mk([12, 15, 17],  [], true);
      const L3 = mk([22, 25, 28],  [], true);
      const L4 = mk([33, 35, 37],  [], true);
      const L5 = mk([42, 45, 48],  [], true);
      const L6 = mk([52, 55, 58],  [], true);
      const L7 = mk([63, 65, 68],  [], true);
      const M1 = mk([10, 20],      [L1, L2, L3], false);
      const M2 = mk([40, 50, 60],  [L4, L5, L6, L7], false);
      const root = mk([30],        [M1, M2], false);

      const frames = [];
      const snap = (line, msg, extra = {}) => frames.push({
        nodes, rootId: root, target,
        line, msg,
        current: extra.current ?? null,
        compareIdx: extra.compareIdx ?? null,
        foundAt: extra.foundAt ?? null,
        descend: extra.descend ?? null,  // child index
      });

      snap(0, `B-TREE-SEARCH(root, ${target})`);
      let x = root;
      while (x != null) {
        const node = nodes[x];
        snap(1, `x = 노드 [${node.keys.join(", ")}], i = 1`, { current: x });
        let i = 0;
        while (i < node.keys.length && target > node.keys[i]) {
          snap(2, `i = ${i + 1}: k=${target} > key_${i + 1}=${node.keys[i]} → i++`, {
            current: x, compareIdx: i,
          });
          i++;
        }
        snap(2, i < node.keys.length
          ? `i = ${i + 1}: k=${target} ≤ key_${i + 1}=${node.keys[i]} → 루프 종료`
          : `i = ${i + 1}: 범위 초과 → 루프 종료`, {
          current: x, compareIdx: i < node.keys.length ? i : null,
        });
        if (i < node.keys.length && target === node.keys[i]) {
          snap(4, `key_${i + 1} = ${target} → 발견!`, {
            current: x, foundAt: i,
          });
          return frames;
        }
        if (node.leaf) {
          snap(6, `leaf에서 못 찾음 → return NIL`, { current: x });
          return frames;
        }
        snap(9, `내부 노드 → c_${i + 1}로 재귀`, {
          current: x, descend: i,
        });
        x = node.children[i];
      }
      return frames;
    },
    render(frame, svg) {
      const W = 780, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.appendChild(svgText(`B-TREE-SEARCH — target = ${frame.target}`, {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
      // Layout: compute depth + position via BFS
      const nodes = frame.nodes;
      const depth = {};
      function setDepth(id, d) {
        if (id == null) return;
        depth[id] = d;
        for (const c of nodes[id].children || []) setDepth(c, d + 1);
      }
      setDepth(frame.rootId, 0);
      const maxDepth = Math.max(...Object.values(depth));
      // Group nodes by depth, equally space
      const byDepth = {};
      nodes.forEach((n) => {
        const d = depth[n.id];
        if (d == null) return;
        (byDepth[d] = byDepth[d] || []).push(n);
      });
      const padL = 40, padR = 40, padT = 60, padB = 40;
      const rowH = (H - padT - padB) / (maxDepth + 1);
      const keyW = 28;

      const pos = {};
      for (let d = 0; d <= maxDepth; d++) {
        const row = byDepth[d];
        if (!row) continue;
        const totalWidth = row.reduce((s, n) => s + n.keys.length * keyW + 30, 0);
        let x = padL + Math.max(0, (W - padL - padR - totalWidth) / 2);
        for (const n of row) {
          const w = n.keys.length * keyW + 10;
          pos[n.id] = { x, y: padT + d * rowH, w };
          x += w + 30;
        }
      }
      // Edges
      nodes.forEach((n) => {
        if (!n.children || pos[n.id] == null) return;
        const p = pos[n.id];
        n.children.forEach((cId, ci) => {
          if (pos[cId] == null) return;
          const cp = pos[cId];
          // start position at bottom of the parent at position between keys
          const sx = p.x + (ci * keyW) + 5;
          const sy = p.y + 26;
          const ex = cp.x + cp.w / 2;
          const ey = cp.y;
          svg.appendChild(svgEl("line", {
            x1: sx, y1: sy, x2: ex, y2: ey,
            stroke: frame.descend === ci && frame.current === n.id
              ? PALETTE.pivot : PALETTE.edge,
            "stroke-width": frame.descend === ci && frame.current === n.id ? 3 : 1.5,
          }));
        });
      });
      // Nodes
      nodes.forEach((n) => {
        const p = pos[n.id];
        if (!p) return;
        const active = frame.current === n.id;
        const stroke = active ? PALETTE.active : "#1f2937";
        const strokeW = active ? 3 : 1.5;
        svg.appendChild(svgEl("rect", {
          x: p.x - 4, y: p.y - 2, width: p.w + 4, height: 28, rx: 5,
          fill: n.leaf ? "#f5f5f4" : "#ffffff", stroke, "stroke-width": strokeW,
        }));
        n.keys.forEach((k, i) => {
          const kx = p.x + i * keyW + keyW / 2;
          let fill = "#1c1917";
          let bg = null;
          if (active && frame.foundAt === i) { bg = PALETTE.done; fill = "#fff"; }
          else if (active && frame.compareIdx === i) { bg = PALETTE.compare; fill = "#1c1917"; }
          if (bg) {
            svg.appendChild(svgEl("rect", {
              x: p.x + i * keyW, y: p.y, width: keyW, height: 24, rx: 3, fill: bg,
            }));
          }
          svg.appendChild(svgText(String(k), {
            x: kx, y: p.y + 16, "text-anchor": "middle",
            "font-size": 12, "font-weight": 700, "font-family": "monospace", fill,
          }));
          if (i < n.keys.length - 1) {
            svg.appendChild(svgEl("line", {
              x1: p.x + (i + 1) * keyW - 2, y1: p.y + 3,
              x2: p.x + (i + 1) * keyW - 2, y2: p.y + 21,
              stroke: "#d4d4d4", "stroke-width": 1,
            }));
          }
        });
      });
    },
  }));
})();
