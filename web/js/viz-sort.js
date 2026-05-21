/* =========================================================
   viz-sort.js — 정렬 알고리즘 시각화
   등록: insertionSort, mergeSort, maxHeapify, buildMaxHeap, heapSort,
         partition, quickSort, countingSort, radixSort, bucketSort,
         growthCompare, kadane, masterTree, masterCase
   ========================================================= */

(function () {
  "use strict";
  const { register, PALETTE, svgEl, svgText } = window.VizCore;

  /* ---------- 공통 막대 그래프 렌더러 ---------- */
  function renderBars(svg, arr, colorFn, opts = {}) {
    const n = arr.length;
    const W = 740, H = 360;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const padX = 40, padY = 40;
    const innerW = W - padX * 2;
    const innerH = H - padY * 2;
    const maxVal = Math.max(...arr, opts.maxVal || 0) || 1;
    const barW = (innerW / n) * 0.75;
    const gap  = (innerW / n) * 0.25;

    arr.forEach((v, i) => {
      const x = padX + i * (barW + gap);
      const h = (v / maxVal) * (innerH - 30);
      const y = padY + (innerH - h);
      const color = colorFn(i, v);

      svg.appendChild(svgEl("rect", {
        x, y, width: barW, height: h,
        rx: 4, fill: color, stroke: "#fff", "stroke-width": 2,
      }));

      svg.appendChild(svgText(String(v), {
        x: x + barW / 2, y: y - 6,
        "text-anchor": "middle",
        "font-size": 14, "font-weight": 700,
        "font-family": "sans-serif", fill: "#1c1917",
      }));

      svg.appendChild(svgText(`[${i + 1}]`, {
        x: x + barW / 2, y: H - padY + 18,
        "text-anchor": "middle", "font-size": 11,
        "font-family": "monospace", fill: "#78716c",
      }));
    });

    // Title
    if (opts.title) {
      svg.appendChild(svgText(opts.title, {
        x: W / 2, y: 20,
        "text-anchor": "middle",
        "font-size": 14, "font-weight": 600,
        "font-family": "sans-serif", fill: "#44403c",
      }));
    }
  }

  /* =========================================================
     1) Insertion Sort
     ========================================================= */
  register("insertionSort", () => ({
    title: "Insertion Sort",
    legend: [
      { color: PALETTE.done,    label: "정렬 완료" },
      { color: PALETTE.active,  label: "key (삽입할 원소)" },
      { color: PALETTE.compare, label: "비교 중" },
      { color: PALETTE.idle,    label: "미정렬" },
    ],
    pseudocode: [
      ["INSERTION-SORT(A)", ""],
      ["  for j = 2 to A.length", "// 두 번째 원소부터"],
      ["    key = A[j]", "// 삽입할 원소"],
      ["    i = j - 1", "// 비교 시작 위치"],
      ["    while i > 0 and A[i] > key", "// key보다 큰 원소 찾기"],
      ["      A[i+1] = A[i]", "// 오른쪽으로 밀기"],
      ["      i = i - 1", "// 왼쪽으로 이동"],
      ["    A[i+1] = key", "// 빈자리에 삽입"],
    ],
    build() {
      const A = [5, 2, 4, 6, 1, 3];
      const frames = [];
      const snap = (line, msg, hi = {}) => {
        frames.push({ arr: [...A], line, msg, hi });
      };
      snap(0, "초기 배열 — 클릭하거나 →키로 진행");
      for (let j = 1; j < A.length; j++) {
        snap(1, `j = ${j + 1}: for 루프 진입`, { sorted: j });
        const key = A[j];
        snap(2, `key = A[${j + 1}] = ${key}`, { sorted: j, key: j });
        let i = j - 1;
        snap(3, `i = ${j} = ${i + 1}`, { sorted: j, key: j });
        while (i >= 0 && A[i] > key) {
          snap(4, `A[${i + 1}]=${A[i]} > key=${key} → 참`, { sorted: j, key: j, compare: i });
          A[i + 1] = A[i];
          snap(5, `A[${i + 2}] = A[${i + 1}] = ${A[i]}`, { sorted: j, key: j, compare: i });
          i--;
          snap(6, `i = ${i + 1}`, { sorted: j, key: j });
        }
        if (i >= 0)
          snap(4, `A[${i + 1}]=${A[i]} ≤ key=${key} → 거짓, 루프 종료`, { sorted: j, key: j });
        else
          snap(4, `i=0 → 루프 종료`, { sorted: j, key: j });
        A[i + 1] = key;
        snap(7, `A[${i + 2}] = key = ${key} 삽입 완료`, { sorted: j + 1, inserted: i + 1 });
      }
      snap(0, "정렬 완료!", { sorted: A.length });
      return frames;
    },
    render(frame, svg) {
      renderBars(svg, frame.arr, (i) => {
        const hi = frame.hi || {};
        if (i === hi.key) return PALETTE.active;
        if (i === hi.compare) return PALETTE.compare;
        if (i === hi.inserted) return PALETTE.done;
        if (hi.sorted != null && i < hi.sorted) return PALETTE.done;
        return PALETTE.idle;
      }, { title: "Insertion Sort" });
    },
  }));

  /* =========================================================
     2) Merge Sort (간소화: 분할과 머지 단계 시각화)
     ========================================================= */
  register("mergeSort", () => ({
    title: "Merge Sort",
    legend: [
      { color: PALETTE.idle,    label: "현재 범위" },
      { color: "#ff8a65",       label: "왼쪽 절반" },
      { color: "#b39ddb",       label: "오른쪽 절반" },
      { color: PALETTE.done,    label: "합병 완료" },
      { color: PALETTE.ghost,   label: "범위 밖" },
    ],
    pseudocode: [
      ["MERGE-SORT(A, p, r)", ""],
      ["  if p < r", "// 원소가 2개 이상이면"],
      ["    q = ⌊(p+r)/2⌋", "// 중간점"],
      ["    MERGE-SORT(A, p, q)", "// 왼쪽"],
      ["    MERGE-SORT(A, q+1, r)", "// 오른쪽"],
      ["    MERGE(A, p, q, r)", "// 합병"],
    ],
    build() {
      const A = [5, 2, 4, 7, 1, 3, 2, 6];
      const frames = [];
      const snap = (line, msg, hi) => frames.push({ arr: [...A], line, msg, hi });
      snap(0, "초기 배열");

      function ms(p, r, depth) {
        snap(0, `MERGE-SORT(A, ${p + 1}, ${r + 1})  [깊이 ${depth}]`, { scope: [p, r] });
        if (p < r) {
          snap(1, `${p + 1} < ${r + 1} → 분할`, { scope: [p, r] });
          const q = Math.floor((p + r) / 2);
          snap(2, `q = ⌊(${p + 1}+${r + 1})/2⌋ = ${q + 1}`, { left: [p, q], right: [q + 1, r] });
          snap(3, `왼쪽 호출`, { left: [p, q], right: [q + 1, r] });
          ms(p, q, depth + 1);
          snap(4, `오른쪽 호출`, { left: [p, q], right: [q + 1, r] });
          ms(q + 1, r, depth + 1);
          snap(5, `MERGE(A, ${p + 1}, ${q + 1}, ${r + 1})`, { left: [p, q], right: [q + 1, r] });
          merge(p, q, r);
          snap(5, `합병 완료`, { done: [p, r] });
        }
      }
      function merge(p, q, r) {
        const L = A.slice(p, q + 1);
        const R = A.slice(q + 1, r + 1);
        let i = 0, j = 0, k = p;
        while (i < L.length && j < R.length) {
          A[k++] = L[i] <= R[j] ? L[i++] : R[j++];
        }
        while (i < L.length) A[k++] = L[i++];
        while (j < R.length) A[k++] = R[j++];
      }
      ms(0, A.length - 1, 0);
      snap(0, "정렬 완료!", { done: [0, A.length - 1] });
      return frames;
    },
    render(frame, svg) {
      const hi = frame.hi || {};
      renderBars(svg, frame.arr, (i) => {
        if (hi.done && i >= hi.done[0] && i <= hi.done[1]) return PALETTE.done;
        if (hi.left && i >= hi.left[0] && i <= hi.left[1]) return "#ff8a65";
        if (hi.right && i >= hi.right[0] && i <= hi.right[1]) return "#b39ddb";
        if (hi.scope && i >= hi.scope[0] && i <= hi.scope[1]) return PALETTE.idle;
        return PALETTE.ghost;
      }, { title: "Merge Sort" });
    },
  }));

  /* =========================================================
     힙 렌더러 (완전 이진 트리 배치)
     ========================================================= */
  function renderHeap(svg, arr, colorFn, opts = {}) {
    const n = arr.length;
    const W = 760, H = 380;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const heapSize = opts.heapSize != null ? opts.heapSize : n;
    const levels = Math.floor(Math.log2(n)) + 1;
    const xSpacing = W / (Math.pow(2, levels - 1) + 1);
    const ySpacing = Math.min(80, (H - 60) / Math.max(levels, 1));

    // Position each node
    function pos(i) {
      const level = Math.floor(Math.log2(i + 1));
      const levelSize = Math.pow(2, level);
      const indexInLevel = i + 1 - levelSize;
      const span = W / (levelSize + 1);
      const x = span * (indexInLevel + 1);
      const y = 40 + level * ySpacing;
      return { x, y };
    }

    // Edges first
    for (let i = 0; i < n; i++) {
      const left = 2 * i + 1, right = 2 * i + 2;
      const p = pos(i);
      if (left < n) {
        const c = pos(left);
        const color = left < heapSize ? "#94a3b8" : "#e7e5e4";
        svg.appendChild(svgEl("line", { x1: p.x, y1: p.y, x2: c.x, y2: c.y, stroke: color, "stroke-width": 2 }));
      }
      if (right < n) {
        const c = pos(right);
        const color = right < heapSize ? "#94a3b8" : "#e7e5e4";
        svg.appendChild(svgEl("line", { x1: p.x, y1: p.y, x2: c.x, y2: c.y, stroke: color, "stroke-width": 2 }));
      }
    }

    // Nodes
    for (let i = 0; i < n; i++) {
      const p = pos(i);
      const color = colorFn(i, arr[i]);
      const isOutside = i >= heapSize;
      svg.appendChild(svgEl("circle", {
        cx: p.x, cy: p.y, r: 22,
        fill: isOutside ? "#f5f5f4" : color,
        stroke: isOutside ? "#d6d3d1" : "#1f2937",
        "stroke-width": 2,
      }));
      svg.appendChild(svgText(String(arr[i]), {
        x: p.x, y: p.y + 5,
        "text-anchor": "middle", "font-size": 15, "font-weight": 700,
        "font-family": "sans-serif",
        fill: isOutside ? "#a8a29e" : "#1c1917",
      }));
      svg.appendChild(svgText(`[${i + 1}]`, {
        x: p.x, y: p.y + 38,
        "text-anchor": "middle", "font-size": 10,
        "font-family": "monospace", fill: "#78716c",
      }));
    }

    if (opts.title) {
      svg.appendChild(svgText(opts.title, {
        x: W / 2, y: 22,
        "text-anchor": "middle",
        "font-size": 14, "font-weight": 600,
        "font-family": "sans-serif", fill: "#44403c",
      }));
    }
  }

  /* =========================================================
     3) MAX-HEAPIFY
     ========================================================= */
  register("maxHeapify", () => ({
    title: "MAX-HEAPIFY",
    legend: [
      { color: PALETTE.active,  label: "현재 노드 (i)" },
      { color: PALETTE.compare, label: "자식 비교" },
      { color: PALETTE.pivot,   label: "largest" },
      { color: PALETTE.idle,    label: "그 외 힙 노드" },
    ],
    pseudocode: [
      ["MAX-HEAPIFY(A, i)", ""],
      ["  l = LEFT(i), r = RIGHT(i)", ""],
      ["  if l ≤ heap-size and A[l] > A[i]", ""],
      ["    largest = l", ""],
      ["  else largest = i", ""],
      ["  if r ≤ heap-size and A[r] > A[largest]", ""],
      ["    largest = r", ""],
      ["  if largest ≠ i", ""],
      ["    exchange A[i] ↔ A[largest]", ""],
      ["    MAX-HEAPIFY(A, largest)", ""],
    ],
    editableInput: {
      label: "배열 (쉼표로 구분, heapify는 인덱스 2 [0-based=1]부터 실행):",
      defaultValue: "16,4,10,14,7,9,3,2,8,1",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map((t) => {
          const n = Number(t);
          if (!Number.isFinite(n)) throw new Error(`숫자가 아닙니다: "${t}"`);
          return n;
        });
        if (arr.length < 2) throw new Error("원소 2개 이상 필요");
        if (arr.length > 31) throw new Error("너무 깁니다 (최대 31개)");
        return arr;
      },
    },
    build(input) {
      const A = Array.isArray(input) ? input.slice() : [16, 4, 10, 14, 7, 9, 3, 2, 8, 1];
      const n = A.length;
      const frames = [];
      const snap = (line, msg, hi) => frames.push({ arr: [...A], line, msg, hi });
      snap(0, "초기 힙 (A[2]=4가 힙 성질 위반). 루트부터 heapify 시작.");

      function heapify(i) {
        snap(0, `MAX-HEAPIFY(A, ${i + 1}) 호출`, { i });
        const l = 2 * i + 1, r = 2 * i + 2;
        snap(1, `l = ${l + 1}, r = ${r + 1}`, { i });
        let largest = i;
        if (l < n && A[l] > A[i]) {
          snap(2, `A[${l + 1}]=${A[l]} > A[${i + 1}]=${A[i]} → largest = l`, { i, l, compare: l });
          largest = l;
          snap(3, `largest = ${largest + 1}`, { i, largest, l });
        } else if (l < n) {
          snap(2, `A[${l + 1}]=${A[l]} ≤ A[${i + 1}]=${A[i]}`, { i, l, compare: l });
          snap(4, `largest = i = ${i + 1}`, { i, largest });
        }
        if (r < n && A[r] > A[largest]) {
          snap(5, `A[${r + 1}]=${A[r]} > A[${largest + 1}]=${A[largest]} → largest = r`, { i, r, compare: r, largest });
          largest = r;
          snap(6, `largest = ${largest + 1}`, { i, largest });
        } else if (r < n) {
          snap(5, `A[${r + 1}]=${A[r]} ≤ A[${largest + 1}]=${A[largest]}`, { i, r, compare: r, largest });
        }
        if (largest !== i) {
          snap(7, `largest(${largest + 1}) ≠ i(${i + 1})`, { i, largest });
          [A[i], A[largest]] = [A[largest], A[i]];
          snap(8, `A[${i + 1}] ↔ A[${largest + 1}]`, { i, largest });
          heapify(largest);
        } else {
          snap(7, `largest == i → 종료`, { i });
        }
      }
      heapify(1);
      snap(0, "MAX-HEAPIFY 완료");
      return frames;
    },
    render(frame, svg) {
      const { i, largest, compare, l, r } = frame.hi || {};
      renderHeap(svg, frame.arr, (idx) => {
        if (idx === i) return PALETTE.active;
        if (idx === largest) return PALETTE.pivot;
        if (idx === compare || idx === l || idx === r) return PALETTE.compare;
        return PALETTE.idle;
      }, { title: "MAX-HEAPIFY" });
    },
  }));

  /* =========================================================
     4) BUILD-MAX-HEAP
     ========================================================= */
  register("buildMaxHeap", () => ({
    title: "BUILD-MAX-HEAP",
    legend: [
      { color: PALETTE.active, label: "현재 i (heapify 호출 중)" },
      { color: PALETTE.done,   label: "힙 성질 만족 완료" },
      { color: PALETTE.idle,   label: "미처리" },
    ],
    pseudocode: [
      ["BUILD-MAX-HEAP(A)", ""],
      ["  A.heap-size = A.length", ""],
      ["  for i = ⌊length/2⌋ downto 1", ""],
      ["    MAX-HEAPIFY(A, i)", ""],
    ],
    build() {
      const A = [4, 1, 3, 2, 16, 9, 10, 14, 8, 7];
      const n = A.length;
      const frames = [];
      const done = new Set();
      const snap = (line, msg, hi = {}) => frames.push({ arr: [...A], line, msg, hi: { ...hi, done: new Set(done) } });
      snap(0, "초기 배열 — 비정렬");
      snap(1, `heap-size = ${n}`);
      function heapify(i) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let largest = i;
        if (l < n && A[l] > A[largest]) largest = l;
        if (r < n && A[r] > A[largest]) largest = r;
        if (largest !== i) {
          [A[i], A[largest]] = [A[largest], A[i]];
          heapify(largest);
        }
      }
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        snap(2, `i = ${i + 1}`, { i });
        snap(3, `MAX-HEAPIFY(A, ${i + 1})`, { i });
        heapify(i);
        done.add(i);
        // mark children as done too
        for (let j = i; j < n; j++) done.add(j);
        snap(3, `i=${i + 1} 완료`, { i });
      }
      snap(0, "최대 힙 구성 완료!");
      return frames;
    },
    render(frame, svg) {
      const { i, done } = frame.hi;
      renderHeap(svg, frame.arr, (idx) => {
        if (idx === i) return PALETTE.active;
        if (done && done.has(idx)) return PALETTE.done;
        return PALETTE.idle;
      }, { title: "BUILD-MAX-HEAP" });
    },
  }));

  /* =========================================================
     5) HEAPSORT
     ========================================================= */
  register("heapSort", () => ({
    title: "Heapsort",
    legend: [
      { color: PALETTE.idle,  label: "힙 영역" },
      { color: PALETTE.done,  label: "정렬 완료" },
      { color: PALETTE.active,label: "루트 (추출 대상)" },
    ],
    pseudocode: [
      ["HEAPSORT(A)", ""],
      ["  BUILD-MAX-HEAP(A)", ""],
      ["  for i = A.length downto 2", ""],
      ["    exchange A[1] ↔ A[i]", ""],
      ["    heap-size = heap-size - 1", ""],
      ["    MAX-HEAPIFY(A, 1)", ""],
    ],
    build() {
      const A = [4, 1, 3, 16, 9, 10, 14, 8, 7, 2];
      const n = A.length;
      let heapSize = n;
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({ arr: [...A], line, msg, hi: { ...hi, heapSize } });

      // BUILD-MAX-HEAP
      function heapify(i, size) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let largest = i;
        if (l < size && A[l] > A[largest]) largest = l;
        if (r < size && A[r] > A[largest]) largest = r;
        if (largest !== i) {
          [A[i], A[largest]] = [A[largest], A[i]];
          heapify(largest, size);
        }
      }
      snap(0, "초기 배열");
      snap(1, "BUILD-MAX-HEAP 실행");
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(i, heapSize);
      snap(1, "최대 힙 구성 완료");
      for (let i = n - 1; i > 0; i--) {
        snap(2, `i = ${i + 1}`, { i });
        [A[0], A[i]] = [A[i], A[0]];
        snap(3, `A[1] ↔ A[${i + 1}] (${A[i]} 확정)`, { swapA: 0, swapB: i });
        heapSize = i;
        snap(4, `heap-size = ${heapSize}`);
        heapify(0, heapSize);
        snap(5, `MAX-HEAPIFY 후`);
      }
      snap(0, "정렬 완료!");
      return frames;
    },
    render(frame, svg) {
      const n = frame.arr.length;
      const hs = frame.hi.heapSize;
      renderBars(svg, frame.arr, (i) => {
        if (i >= hs) return PALETTE.done;
        if (i === 0 && hs > 0) return PALETTE.active;
        return PALETTE.idle;
      }, { title: `Heapsort (heap-size = ${hs})` });
    },
  }));

  /* =========================================================
     6) PARTITION (Lomuto)
     ========================================================= */
  register("partition", () => ({
    title: "Lomuto Partition",
    legend: [
      { color: PALETTE.pivot,   label: "pivot = A[r]" },
      { color: PALETTE.compare, label: "j (현재 비교)" },
      { color: PALETTE.done,    label: "≤ pivot 영역" },
      { color: PALETTE.idle,    label: "> pivot / 미검사" },
    ],
    pseudocode: [
      ["PARTITION(A, p, r)", ""],
      ["  x = A[r]", "// pivot"],
      ["  i = p - 1", ""],
      ["  for j = p to r - 1", ""],
      ["    if A[j] ≤ x", ""],
      ["      i = i + 1", ""],
      ["      exchange A[i] ↔ A[j]", ""],
      ["  exchange A[i+1] ↔ A[r]", ""],
      ["  return i + 1", ""],
    ],
    build() {
      const A = [2, 8, 7, 1, 3, 5, 6, 4];
      const frames = [];
      const p = 0, r = A.length - 1;
      const snap = (line, msg, hi = {}) => frames.push({ arr: [...A], line, msg, hi });
      snap(0, "초기 배열. p=1, r=8");
      const x = A[r];
      snap(1, `x = A[${r + 1}] = ${x} (pivot)`, { pivot: r });
      let i = p - 1;
      snap(2, `i = ${i + 1}`, { pivot: r, i });
      for (let j = p; j < r; j++) {
        snap(3, `j = ${j + 1}`, { pivot: r, i, j });
        if (A[j] <= x) {
          snap(4, `A[${j + 1}]=${A[j]} ≤ ${x} → 참`, { pivot: r, i, j });
          i++;
          snap(5, `i = ${i + 1}`, { pivot: r, i, j });
          [A[i], A[j]] = [A[j], A[i]];
          snap(6, `swap A[${i + 1}] ↔ A[${j + 1}]`, { pivot: r, i, j });
        } else {
          snap(4, `A[${j + 1}]=${A[j]} > ${x} → 건너뜀`, { pivot: r, i, j });
        }
      }
      [A[i + 1], A[r]] = [A[r], A[i + 1]];
      snap(7, `swap A[${i + 2}] ↔ A[${r + 1}]  → 분할 완료`, { pivot: i + 1, i });
      snap(8, `return ${i + 2}`, { pivot: i + 1, final: true });
      return frames;
    },
    render(frame, svg) {
      const hi = frame.hi;
      renderBars(svg, frame.arr, (idx) => {
        if (idx === hi.pivot) return PALETTE.pivot;
        if (idx === hi.j) return PALETTE.compare;
        if (hi.i != null && idx <= hi.i) return PALETTE.done;
        return PALETTE.idle;
      }, { title: "Lomuto Partition" });
    },
    editableInput: {
      label: "배열 (쉼표). 피벗은 마지막 원소:",
      defaultValue: "2, 8, 7, 1, 3, 5, 6, 4",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map(Number);
        if (arr.some(Number.isNaN)) throw new Error("숫자만 허용");
        if (arr.length < 2) throw new Error("원소 2개 이상");
        if (arr.length > 20) throw new Error("최대 20개");
        return arr;
      },
    },
  }));

  /* =========================================================
     6b) HOARE-PARTITION
     두 포인터 i, j가 양끝에서 서로를 향해 이동.
     A[p..] 안쪽에서 pivot x=A[p] 기준으로 재배치.
     Lomuto보다 비교 횟수가 평균 3배 적음.
     ========================================================= */
  register("hoarePartition", () => ({
    title: "Hoare Partition",
    legend: [
      { color: PALETTE.pivot,   label: "pivot x = A[p]" },
      { color: PALETTE.active,  label: "i (왼→오른)" },
      { color: PALETTE.compare, label: "j (오른→왼)" },
      { color: PALETTE.done,    label: "확정 영역" },
      { color: PALETTE.idle,    label: "미처리" },
    ],
    pseudocode: [
      ["HOARE-PARTITION(A, p, r)", ""],
      ["  x = A[p]", "// 피벗 = 맨 앞"],
      ["  i = p - 1; j = r + 1", ""],
      ["  while true", ""],
      ["    repeat j = j - 1 until A[j] ≤ x", ""],
      ["    repeat i = i + 1 until A[i] ≥ x", ""],
      ["    if i < j: exchange A[i] ↔ A[j]", ""],
      ["    else return j", ""],
    ],
    editableInput: {
      label: "배열 (쉼표). 피벗은 첫 원소:",
      defaultValue: "13, 19, 9, 5, 12, 8, 7, 4, 21, 2, 6, 11",
      parse(text) {
        const arr = String(text).split(/[,\s]+/).filter(Boolean).map(Number);
        if (arr.some(Number.isNaN)) throw new Error("숫자만 허용");
        if (arr.length < 2) throw new Error("원소 2개 이상");
        if (arr.length > 20) throw new Error("최대 20개");
        return arr;
      },
    },
    build(input) {
      const A = Array.isArray(input) ? input.slice() : [13, 19, 9, 5, 12, 8, 7, 4, 21, 2, 6, 11];
      const p = 0, r = A.length - 1;
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({ arr: [...A], line, msg, hi });
      snap(0, `초기 배열 (길이 ${A.length})`);
      const x = A[p];
      snap(1, `x = A[1] = ${x} (pivot)`, { pivot: p });
      let i = p - 1, j = r + 1;
      snap(2, `i = ${i + 1}, j = ${j + 1}`, { pivot: p, i, j });
      let safety = 0;
      while (safety++ < 1000) {
        snap(3, `외부 while 반복`, { pivot: p, i, j });
        do {
          j--;
          snap(4, `j → ${j + 1}, A[${j + 1}] = ${A[j]}`, { pivot: p, i, j });
        } while (A[j] > x);
        snap(4, `A[${j + 1}] = ${A[j]} ≤ ${x} → 정지`, { pivot: p, i, j });
        do {
          i++;
          snap(5, `i → ${i + 1}, A[${i + 1}] = ${A[i]}`, { pivot: p, i, j });
        } while (A[i] < x);
        snap(5, `A[${i + 1}] = ${A[i]} ≥ ${x} → 정지`, { pivot: p, i, j });
        if (i < j) {
          [A[i], A[j]] = [A[j], A[i]];
          snap(6, `i < j → swap A[${i + 1}] ↔ A[${j + 1}]`, { pivot: p, i, j });
        } else {
          snap(7, `i ≥ j → return j = ${j + 1}`, { pivot: p, boundary: j, final: true });
          break;
        }
      }
      return frames;
    },
    render(frame, svg) {
      const hi = frame.hi;
      renderBars(svg, frame.arr, (idx) => {
        if (idx === hi.pivot) return PALETTE.pivot;
        if (idx === hi.i) return PALETTE.active;
        if (idx === hi.j) return PALETTE.compare;
        if (hi.boundary != null && idx <= hi.boundary) return PALETTE.done;
        return PALETTE.idle;
      }, { title: "Hoare Partition" });
    },
  }));

  /* =========================================================
     7) QUICKSORT
     ========================================================= */
  register("quickSort", () => ({
    title: "Quicksort",
    legend: [
      { color: PALETTE.pivot,   label: "pivot" },
      { color: PALETTE.compare, label: "현재 j" },
      { color: PALETTE.done,    label: "정렬 완료 / ≤ pivot" },
      { color: PALETTE.idle,    label: "미정렬" },
    ],
    pseudocode: [
      ["QUICKSORT(A, p, r)", ""],
      ["  if p < r", ""],
      ["    q = PARTITION(A, p, r)", ""],
      ["    QUICKSORT(A, p, q-1)", ""],
      ["    QUICKSORT(A, q+1, r)", ""],
    ],
    build() {
      const A = [3, 7, 8, 5, 2, 1, 9, 4, 6];
      const frames = [];
      const finalized = new Set();
      const snap = (line, msg, hi = {}) => frames.push({
        arr: [...A], line, msg,
        hi: { ...hi, finalized: new Set(finalized) },
      });
      snap(0, "초기 배열");
      function qs(p, r) {
        if (p >= r) {
          if (p === r) finalized.add(p);
          snap(1, `p=${p + 1}, r=${r + 1} → 재귀 종료`);
          return;
        }
        snap(1, `QUICKSORT(A, ${p + 1}, ${r + 1})`, { scope: [p, r] });
        const pivot = A[r];
        let i = p - 1;
        snap(2, `PARTITION 호출 (pivot=${pivot})`, { scope: [p, r], pivot: r });
        for (let j = p; j < r; j++) {
          snap(2, `j=${j + 1}: A[${j + 1}]=${A[j]} vs pivot=${pivot}`, { scope: [p, r], pivot: r, j, i });
          if (A[j] <= pivot) {
            i++;
            [A[i], A[j]] = [A[j], A[i]];
            snap(2, `swap A[${i + 1}] ↔ A[${j + 1}]`, { scope: [p, r], pivot: r, j, i });
          }
        }
        [A[i + 1], A[r]] = [A[r], A[i + 1]];
        const q = i + 1;
        finalized.add(q);
        snap(2, `pivot을 올바른 위치 ${q + 1}로 배치`, { scope: [p, r], pivot: q });
        snap(3, `왼쪽 QUICKSORT(${p + 1}, ${q})`);
        qs(p, q - 1);
        snap(4, `오른쪽 QUICKSORT(${q + 2}, ${r + 1})`);
        qs(q + 1, r);
      }
      qs(0, A.length - 1);
      for (let k = 0; k < A.length; k++) finalized.add(k);
      snap(0, "정렬 완료!");
      return frames;
    },
    render(frame, svg) {
      const hi = frame.hi;
      renderBars(svg, frame.arr, (idx) => {
        if (hi.finalized && hi.finalized.has(idx)) return PALETTE.done;
        if (idx === hi.pivot) return PALETTE.pivot;
        if (idx === hi.j) return PALETTE.compare;
        if (hi.scope && idx >= hi.scope[0] && idx <= hi.scope[1]) return PALETTE.idle;
        return PALETTE.ghost;
      }, { title: "Quicksort" });
    },
  }));

  /* =========================================================
     8) Counting Sort
     ========================================================= */
  register("countingSort", () => ({
    title: "Counting Sort",
    legend: [
      { color: PALETTE.idle,    label: "입력 A" },
      { color: PALETTE.compare, label: "C (카운트/누적)" },
      { color: PALETTE.done,    label: "출력 B (확정)" },
      { color: PALETTE.active,  label: "현재 처리" },
    ],
    pseudocode: [
      ["COUNTING-SORT(A, B, k)", ""],
      ["  C[0..k] = 0", ""],
      ["  for j = 1 to A.length", "// 빈도 계산"],
      ["    C[A[j]] = C[A[j]] + 1", ""],
      ["  for i = 1 to k", "// 누적합"],
      ["    C[i] = C[i] + C[i-1]", ""],
      ["  for j = A.length downto 1", "// 역순 배치"],
      ["    B[C[A[j]]] = A[j]", ""],
      ["    C[A[j]] = C[A[j]] - 1", ""],
    ],
    build() {
      const A = [2, 5, 3, 0, 2, 3, 0, 3];
      const k = 5;
      const C = new Array(k + 1).fill(0);
      const B = new Array(A.length).fill(null);
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        A: [...A], C: [...C], B: [...B], line, msg, hi,
      });
      snap(0, "입력 A, 범위 [0..5]");
      snap(1, "C 초기화 (모두 0)");
      for (let j = 0; j < A.length; j++) {
        C[A[j]]++;
        snap(3, `C[${A[j]}]++  →  C[${A[j]}]=${C[A[j]]}`, { aIdx: j, cIdx: A[j] });
      }
      snap(4, "누적합 계산");
      for (let i = 1; i <= k; i++) {
        C[i] = C[i] + C[i - 1];
        snap(5, `C[${i}] = C[${i}] + C[${i - 1}] = ${C[i]}`, { cIdx: i });
      }
      snap(6, "역순으로 B에 배치 (안정성 보장)");
      for (let j = A.length - 1; j >= 0; j--) {
        const v = A[j];
        const pos = C[v] - 1;
        B[pos] = v;
        snap(7, `B[${pos + 1}] = A[${j + 1}] = ${v}`, { aIdx: j, bIdx: pos, cIdx: v });
        C[v]--;
        snap(8, `C[${v}]--  →  C[${v}]=${C[v]}`, { aIdx: j, cIdx: v });
      }
      snap(0, "정렬 완료!");
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 400;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const drawRow = (arr, label, y, colorFn, isIndex = true) => {
        svg.appendChild(svgText(label, { x: 20, y: y + 20, "font-size": 13, "font-weight": 700, "font-family": "sans-serif", fill: "#1c1917" }));
        const boxW = 42, gap = 6, startX = 100;
        arr.forEach((v, i) => {
          const x = startX + i * (boxW + gap);
          svg.appendChild(svgEl("rect", {
            x, y, width: boxW, height: 38, rx: 4,
            fill: colorFn(i, v), stroke: "#1f2937", "stroke-width": 1.5,
          }));
          svg.appendChild(svgText(v == null ? "·" : String(v), {
            x: x + boxW / 2, y: y + 25, "text-anchor": "middle",
            "font-size": 14, "font-weight": 700, "font-family": "sans-serif", fill: "#1c1917",
          }));
          if (isIndex) {
            svg.appendChild(svgText(String(i), {
              x: x + boxW / 2, y: y + 52, "text-anchor": "middle",
              "font-size": 10, "font-family": "monospace", fill: "#78716c",
            }));
          }
        });
      };
      const hi = frame.hi || {};
      drawRow(frame.A, "A", 40, (i) => i === hi.aIdx ? PALETTE.active : PALETTE.idle);
      drawRow(frame.C, "C", 140, (i) => i === hi.cIdx ? PALETTE.active : PALETTE.compare);
      drawRow(frame.B, "B", 240, (i) => i === hi.bIdx ? PALETTE.active : (frame.B[i] != null ? PALETTE.done : "#f5f5f4"));
      svg.appendChild(svgText("Counting Sort", { x: W / 2, y: 22, "text-anchor": "middle", "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c" }));
    },
  }));

  /* =========================================================
     9) Radix Sort
     ========================================================= */
  register("radixSort", () => ({
    title: "Radix Sort",
    legend: [
      { color: PALETTE.idle,   label: "정렬 전" },
      { color: PALETTE.active, label: "현재 자릿수" },
      { color: PALETTE.done,   label: "정렬 후" },
    ],
    pseudocode: [
      ["RADIX-SORT(A, d)", ""],
      ["  for i = 1 to d", ""],
      ["    use a stable sort to sort A on digit i", ""],
    ],
    build() {
      const A = [329, 457, 657, 839, 436, 720, 355];
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({ arr: [...A], line, msg, hi });
      snap(0, "초기 배열");
      const digit = (x, i) => Math.floor(x / Math.pow(10, i)) % 10;
      for (let i = 0; i < 3; i++) {
        snap(1, `i = ${i + 1}: ${["1의", "10의", "100의"][i]} 자리 기준`, { di: i });
        const buckets = Array.from({ length: 10 }, () => []);
        A.forEach((v) => buckets[digit(v, i)].push(v));
        snap(2, `안정 정렬로 재배치`, { di: i });
        let k = 0;
        for (const b of buckets) for (const v of b) A[k++] = v;
        snap(2, `${i + 1}번째 자리 정렬 완료`, { di: i });
      }
      snap(0, "정렬 완료!");
      return frames;
    },
    render(frame, svg) {
      const di = (frame.hi && frame.hi.di) || 0;
      const W = 760, H = 360;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const n = frame.arr.length;
      const barW = 70, gap = 20, startX = 60;
      frame.arr.forEach((v, i) => {
        const x = startX + i * (barW + gap);
        const y = 120;
        svg.appendChild(svgEl("rect", {
          x, y, width: barW, height: 90, rx: 6,
          fill: PALETTE.idle, stroke: "#1f2937", "stroke-width": 2,
        }));
        const str = String(v).padStart(3, "0");
        str.split("").forEach((ch, idx) => {
          const cx = x + 16 + idx * 20;
          const isActive = 2 - idx === di;
          svg.appendChild(svgEl("rect", {
            x: cx - 8, y: y + 30, width: 18, height: 32, rx: 3,
            fill: isActive ? PALETTE.active : "transparent",
          }));
          svg.appendChild(svgText(ch, {
            x: cx, y: y + 54, "text-anchor": "middle",
            "font-size": 22, "font-weight": 700, "font-family": "monospace",
            fill: isActive ? "#fff" : "#1c1917",
          }));
        });
      });
      svg.appendChild(svgText(`Radix Sort — 자릿수 ${di + 1} 기준 (0=LSD)`, {
        x: W / 2, y: 40, "text-anchor": "middle",
        "font-size": 15, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     10) Bucket Sort
     ========================================================= */
  register("bucketSort", () => ({
    title: "Bucket Sort",
    legend: [
      { color: PALETTE.idle,   label: "입력" },
      { color: PALETTE.active, label: "현재 버킷" },
      { color: PALETTE.done,   label: "정렬 완료" },
    ],
    pseudocode: [
      ["BUCKET-SORT(A)", ""],
      ["  n = A.length", ""],
      ["  for i = 0 to n-1", ""],
      ["    insert A[i] into bucket[⌊n·A[i]⌋]", ""],
      ["  sort each bucket (insertion sort)", ""],
      ["  concatenate buckets", ""],
    ],
    build() {
      const A = [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68];
      const n = A.length;
      const buckets = Array.from({ length: n }, () => []);
      const frames = [];
      const snap = (line, msg, hi = {}) => frames.push({
        arr: [...A],
        buckets: buckets.map((b) => [...b]),
        line, msg, hi,
      });
      snap(0, "입력 (모두 [0,1) 범위)");
      for (let i = 0; i < n; i++) {
        const bi = Math.floor(n * A[i]);
        buckets[bi].push(A[i]);
        snap(3, `A[${i + 1}]=${A[i]} → bucket[${bi}]`, { bi, active: i });
      }
      snap(4, "각 버킷을 삽입 정렬");
      for (let i = 0; i < n; i++) {
        buckets[i].sort((a, b) => a - b);
        snap(4, `bucket[${i}] 정렬`, { bi: i });
      }
      snap(5, "버킷 연결");
      const out = [];
      for (const b of buckets) out.push(...b);
      for (let i = 0; i < n; i++) A[i] = out[i];
      snap(0, "정렬 완료!");
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 400;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const n = frame.buckets.length;
      const colW = (W - 40) / n;
      const hi = frame.hi || {};
      for (let i = 0; i < n; i++) {
        const x = 20 + i * colW;
        svg.appendChild(svgEl("rect", {
          x, y: 60, width: colW - 6, height: 280, rx: 6,
          fill: i === hi.bi ? "#fef3c7" : "#f5f5f4",
          stroke: i === hi.bi ? PALETTE.active : "#d6d3d1",
          "stroke-width": 2,
        }));
        svg.appendChild(svgText(`[${i})`, {
          x: x + (colW - 6) / 2, y: 352, "text-anchor": "middle",
          "font-size": 11, "font-family": "monospace", fill: "#78716c",
        }));
        frame.buckets[i].forEach((v, j) => {
          svg.appendChild(svgEl("rect", {
            x: x + 6, y: 320 - j * 26, width: colW - 18, height: 22, rx: 3,
            fill: i === hi.bi ? PALETTE.active : PALETTE.idle,
          }));
          svg.appendChild(svgText(v.toFixed(2), {
            x: x + (colW - 6) / 2, y: 336 - j * 26, "text-anchor": "middle",
            "font-size": 11, "font-weight": 700, "font-family": "monospace", fill: "#fff",
          }));
        });
      }
      svg.appendChild(svgText("Bucket Sort", {
        x: W / 2, y: 30, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     11) Growth Compare
     ========================================================= */
  register("growthCompare", () => ({
    title: "함수 증가율 비교",
    legend: [
      { color: "#60a5fa", label: "lg n" },
      { color: "#22c55e", label: "√n" },
      { color: "#f59e0b", label: "n" },
      { color: "#a855f7", label: "n lg n" },
      { color: "#ef4444", label: "n²" },
      { color: "#1f2937", label: "2ⁿ" },
    ],
    pseudocode: [
      ["함수 증가 순서 (느린 → 빠른)", ""],
      ["1 < lg lg n < lg n < √n < n < n lg n < n² < n³ < 2ⁿ < n! < nⁿ", ""],
    ],
    build() {
      const frames = [];
      const maxN = [5, 10, 20, 40, 60, 80, 100];
      maxN.forEach((n) => {
        frames.push({ n, line: 0, msg: `n ≤ ${n}까지의 성장 비교` });
      });
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const padL = 50, padB = 40, padT = 40, padR = 20;
      const n = frame.n;
      const innerW = W - padL - padR;
      const innerH = H - padT - padB;

      const funcs = [
        { fn: (x) => Math.log2(Math.max(x, 1)), color: "#60a5fa", label: "lg n" },
        { fn: (x) => Math.sqrt(x), color: "#22c55e", label: "√n" },
        { fn: (x) => x, color: "#f59e0b", label: "n" },
        { fn: (x) => x * Math.log2(Math.max(x, 2)), color: "#a855f7", label: "n lg n" },
        { fn: (x) => x * x, color: "#ef4444", label: "n²" },
        { fn: (x) => Math.pow(2, Math.min(x, 30)), color: "#1f2937", label: "2ⁿ" },
      ];
      const maxY = Math.max(...funcs.map((f) => f.fn(n)), 10);

      // Axes
      svg.appendChild(svgEl("line", { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, stroke: "#78716c", "stroke-width": 1.5 }));
      svg.appendChild(svgEl("line", { x1: padL, y1: padT, x2: padL, y2: H - padB, stroke: "#78716c", "stroke-width": 1.5 }));
      svg.appendChild(svgText("n", { x: W - padR, y: H - padB + 25, "font-size": 12, "font-family": "sans-serif", fill: "#44403c" }));
      svg.appendChild(svgText("f(n)", { x: padL - 10, y: padT - 10, "font-size": 12, "font-family": "sans-serif", fill: "#44403c" }));

      funcs.forEach((f) => {
        const pts = [];
        const step = Math.max(1, n / 80);
        for (let x = 0; x <= n; x += step) {
          const y = Math.min(f.fn(x), maxY);
          const px = padL + (x / n) * innerW;
          const py = H - padB - (y / maxY) * innerH;
          pts.push(`${px},${py}`);
        }
        svg.appendChild(svgEl("polyline", {
          points: pts.join(" "),
          fill: "none", stroke: f.color, "stroke-width": 2.5,
        }));
      });

      svg.appendChild(svgText(`n = ${n}까지`, {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     12) Kadane (Maximum Subarray)
     ========================================================= */
  register("kadane", () => ({
    title: "Kadane — Maximum Subarray",
    legend: [
      { color: PALETTE.active,  label: "현재 i" },
      { color: PALETTE.done,    label: "현재 best 구간" },
      { color: PALETTE.idle,    label: "그 외" },
    ],
    pseudocode: [
      ["KADANE(A)", ""],
      ["  bestSum = current = A[1]", ""],
      ["  bestL = bestR = curL = 1", ""],
      ["  for i = 2 to A.length", ""],
      ["    if current + A[i] < A[i]", ""],
      ["      current = A[i]; curL = i", ""],
      ["    else current = current + A[i]", ""],
      ["    if current > bestSum", ""],
      ["      bestSum = current; bestL = curL; bestR = i", ""],
    ],
    build() {
      const A = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
      const frames = [];
      let best = A[0], cur = A[0], bestL = 0, bestR = 0, curL = 0;
      const snap = (line, msg, hi) => frames.push({ arr: [...A], line, msg, hi });
      snap(0, `초기: best = cur = A[1] = ${A[0]}`, { i: 0, bestL, bestR, curL });
      for (let i = 1; i < A.length; i++) {
        snap(3, `i = ${i + 1}: A[${i + 1}] = ${A[i]}`, { i, bestL, bestR, curL });
        if (cur + A[i] < A[i]) {
          cur = A[i]; curL = i;
          snap(5, `다시 시작: cur = ${cur}, curL = ${curL + 1}`, { i, bestL, bestR, curL });
        } else {
          cur += A[i];
          snap(6, `cur = ${cur}`, { i, bestL, bestR, curL });
        }
        if (cur > best) {
          best = cur; bestL = curL; bestR = i;
          snap(8, `best 갱신: ${best} (${bestL + 1}..${bestR + 1})`, { i, bestL, bestR, curL });
        }
      }
      snap(0, `결과: best = ${best}, 구간 [${bestL + 1}..${bestR + 1}]`, { i: A.length - 1, bestL, bestR, curL, final: true });
      return frames;
    },
    render(frame, svg) {
      const hi = frame.hi;
      const W = 740, H = 360;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const n = frame.arr.length;
      const barW = 60, gap = 12, startX = 40;
      const zeroY = 200;
      frame.arr.forEach((v, i) => {
        const x = startX + i * (barW + gap);
        const h = Math.abs(v) * 22;
        const y = v >= 0 ? zeroY - h : zeroY;
        let color = PALETTE.idle;
        if (i >= hi.bestL && i <= hi.bestR) color = PALETTE.done;
        if (i === hi.i) color = PALETTE.active;
        svg.appendChild(svgEl("rect", {
          x, y, width: barW, height: h, rx: 4,
          fill: color, stroke: "#1f2937", "stroke-width": 2,
        }));
        svg.appendChild(svgText(String(v), {
          x: x + barW / 2, y: v >= 0 ? y - 6 : y + h + 18,
          "text-anchor": "middle", "font-size": 14, "font-weight": 700,
          "font-family": "sans-serif", fill: "#1c1917",
        }));
        svg.appendChild(svgText(`[${i + 1}]`, {
          x: x + barW / 2, y: 300,
          "text-anchor": "middle", "font-size": 11, "font-family": "monospace", fill: "#78716c",
        }));
      });
      svg.appendChild(svgEl("line", {
        x1: 20, y1: zeroY, x2: W - 20, y2: zeroY, stroke: "#78716c", "stroke-dasharray": "4 4",
      }));
      svg.appendChild(svgText("Kadane — Maximum Subarray", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     13) Master Theorem Recursion Tree
     ========================================================= */
  register("masterTree", () => ({
    title: "재귀 트리 · T(n) = 2T(n/2) + n",
    legend: [
      { color: PALETTE.idle, label: "현재 레벨" },
      { color: PALETTE.done, label: "완료 레벨" },
    ],
    pseudocode: [
      ["T(n) = 2T(n/2) + n", ""],
      ["각 레벨 총 비용 = n", ""],
      ["레벨 수 = lg n + 1", ""],
      ["합계 = n·(lg n + 1) = Θ(n lg n)", ""],
    ],
    build() {
      const frames = [];
      const levels = 5;
      for (let d = 0; d <= levels; d++) {
        frames.push({ depth: d, levels, line: d < 4 ? d : 3, msg: `레벨 ${d} 펼침 — 이 레벨의 총 비용 = n` });
      }
      frames.push({ depth: levels, levels, line: 3, msg: `합계 = n·(lg n + 1) = Θ(n lg n)` });
      return frames;
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const levels = frame.levels;
      for (let d = 0; d <= frame.depth; d++) {
        const count = Math.pow(2, d);
        const size = Math.max(28 - d * 3, 14);
        const span = W / (count + 1);
        for (let k = 0; k < count; k++) {
          const x = span * (k + 1);
          const y = 50 + d * 65;
          // edge to parent
          if (d > 0) {
            const parentSpan = W / (Math.pow(2, d - 1) + 1);
            const px = parentSpan * (Math.floor(k / 2) + 1);
            const py = 50 + (d - 1) * 65;
            svg.appendChild(svgEl("line", { x1: px, y1: py, x2: x, y2: y, stroke: "#94a3b8", "stroke-width": 1.5 }));
          }
          svg.appendChild(svgEl("circle", {
            cx: x, cy: y, r: size,
            fill: d === frame.depth ? PALETTE.idle : PALETTE.done,
            stroke: "#1f2937", "stroke-width": 2,
          }));
          svg.appendChild(svgText(`n/${Math.pow(2, d)}`, {
            x, y: y + 4, "text-anchor": "middle", "font-size": 11,
            "font-weight": 700, "font-family": "monospace", fill: "#fff",
          }));
        }
        // level total
        svg.appendChild(svgText(`합 = n`, {
          x: W - 30, y: 50 + d * 65 + 4, "text-anchor": "end",
          "font-size": 12, "font-weight": 600, "font-family": "monospace", fill: "#ef4444",
        }));
      }
      svg.appendChild(svgText("재귀 트리 · T(n) = 2T(n/2) + n", {
        x: W / 2, y: 24, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));
    },
  }));

  /* =========================================================
     Master Theorem — Case 판정 인터랙티브 (CLRS 4.5)
     입력: a, b, f(n) where f(n) = n^p · (lg n)^q
     1) c = log_b(a) 계산
     2) p vs c 비교 → Case 1/2/3 판정
     3) Case 3: 정규조건 a·f(n/b) ≤ c'·f(n), c'<1 검사
     4) 결론 T(n) = ?
     ========================================================= */
  function _formatNum(x) {
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    if (Math.abs(x - 0.5) < 1e-9) return "1/2";
    return x.toFixed(3);
  }
  function _parseF(s) {
    const t = String(s).trim().toLowerCase().replace(/\s+/g, " ");
    if (t === "1") return { p: 0, q: 0, label: "1" };
    if (t === "n") return { p: 1, q: 0, label: "n" };
    if (t === "lg n" || t === "log n") return { p: 0, q: 1, label: "lg n" };
    if (t === "n lg n" || t === "n log n") return { p: 1, q: 1, label: "n lg n" };
    if (t === "sqrt(n)" || t === "√n") return { p: 0.5, q: 0, label: "√n" };
    let m;
    if ((m = t.match(/^n\s*\^\s*([0-9.]+)\s+lg\s+n$/))) {
      return { p: parseFloat(m[1]), q: 1, label: `n^${m[1]} lg n` };
    }
    if ((m = t.match(/^n\s*\^\s*([0-9.]+)$/))) {
      return { p: parseFloat(m[1]), q: 0, label: `n^${m[1]}` };
    }
    throw new Error(`f(n) 파싱 실패: '${s}'. 예: 1, n, n^2, lg n, n lg n, sqrt(n), n^2 lg n`);
  }

  register("masterCase", () => ({
    title: "Master Theorem — Case 판정",
    legend: [
      { color: "#fef3c7", label: "점화식" },
      { color: "#dbeafe", label: "c = log_b(a)" },
      { color: "#dcfce7", label: "Case 1 (f가 작음)" },
      { color: "#fef3c7", label: "Case 2 (f ≈ n^c)" },
      { color: "#dbeafe", label: "Case 3 (f가 큼)" },
      { color: "#fce7f3", label: "갭 영역" },
    ],
    pseudocode: [
      ["T(n) = a·T(n/b) + f(n)   (a ≥ 1, b > 1)", ""],
      ["c = log_b(a)", ""],
      ["Case 1:  f(n) = O(n^{c-ε})", "→ T(n) = Θ(n^c)"],
      ["Case 2:  f(n) = Θ(n^c)", "→ T(n) = Θ(n^c · lg n)"],
      ["Case 3:  f(n) = Ω(n^{c+ε})", "그리고"],
      ["         정규조건: a·f(n/b) ≤ c'·f(n), c' < 1", "→ T(n) = Θ(f(n))"],
      ["갭 영역 — 마스터 정리 적용 불가", ""],
    ],
    editableInput: {
      label: "a, b, f(n) (예: 2, 2, n  /  9, 3, n  /  3, 4, n lg n  /  4, 2, n^2)",
      defaultValue: "2, 2, n",
      parse(text) {
        const parts = String(text).split(",");
        if (parts.length < 3) throw new Error("형식: 'a, b, f(n)'");
        const a = parseFloat(parts[0].trim());
        const b = parseFloat(parts[1].trim());
        const fStr = parts.slice(2).join(",").trim();
        if (!(a >= 1)) throw new Error("a ≥ 1 필요");
        if (!(b > 1)) throw new Error("b > 1 필요");
        const f = _parseF(fStr);
        return { a, b, f };
      },
    },
    build(input) {
      const { a, b, f } = input || { a: 2, b: 2, f: { p: 1, q: 0, label: "n" } };
      const frames = [];
      const c = Math.log(a) / Math.log(b);
      const cStr = _formatNum(c);

      let caseLabel = null, answer = null, regularity = null, lineCase = 0;

      const EPS = 1e-9;
      if (f.q === 0 && f.p < c - EPS) {
        caseLabel = "Case 1";
        lineCase = 2;
        answer = `Θ(n^${cStr})`;
      } else if (Math.abs(f.p - c) < EPS && f.q === 0) {
        caseLabel = "Case 2";
        lineCase = 3;
        answer = `Θ(n^${cStr} · lg n)`;
      } else if (f.p > c + EPS) {
        const ratio = a / Math.pow(b, f.p);
        regularity = { ratio, holds: ratio < 1 - EPS };
        if (regularity.holds) {
          caseLabel = "Case 3";
          lineCase = 4;
          answer = `Θ(${f.label})`;
        } else {
          caseLabel = "Case 3 — 정규조건 실패";
          lineCase = 5;
          answer = "마스터 정리 적용 불가 (재귀 트리/치환법 필요)";
        }
      } else if (Math.abs(f.p - c) < EPS && f.q > 0) {
        caseLabel = "갭 영역 (Case 2 ↔ Case 3)";
        lineCase = 6;
        answer = `재귀 트리: T(n) = Θ(n^${cStr} · lg^${f.q + 1} n)`;
      } else {
        caseLabel = "갭 영역";
        lineCase = 6;
        answer = "마스터 정리 적용 불가";
      }

      const baseFrame = { a, b, f, c: null, caseLabel: null, answer: null, regularity: null };

      frames.push({
        ...baseFrame,
        line: 0,
        msg: `점화식: T(n) = ${a}·T(n/${b}) + ${f.label}`,
      });
      frames.push({
        ...baseFrame, c,
        line: 1,
        msg: `c = log_${b}(${a}) = ${cStr}.   비교 대상: n^${cStr} vs f(n) = ${f.label}`,
      });
      frames.push({
        ...baseFrame, c, caseLabel,
        line: lineCase,
        msg: caseMsg(caseLabel, f, c),
      });
      if (regularity) {
        frames.push({
          ...baseFrame, c, caseLabel, regularity,
          line: 5,
          msg: `정규조건: a/b^p = ${a}/${b}^${f.p} = ${regularity.ratio.toFixed(3)} ${regularity.holds ? "< 1 ✓" : "≥ 1 ✗"}`,
        });
      }
      frames.push({
        ...baseFrame, c, caseLabel, regularity, answer,
        line: lineCase,
        msg: `결론: T(n) = ${answer}`,
      });
      return frames;

      function caseMsg(label, f, c) {
        const cs = _formatNum(c);
        if (label.startsWith("Case 1")) return `Case 1: f의 차수 p=${f.p} < c=${cs}, 즉 f(n) = O(n^{c-ε}) — 재귀 비용이 지배적`;
        if (label.startsWith("Case 2")) return `Case 2: f의 차수 p=${f.p} = c=${cs}, lg 인자 없음 — 모든 레벨이 동일 비용`;
        if (label.startsWith("Case 3")) return `Case 3 후보: p=${f.p} > c=${cs}, 즉 f(n) = Ω(n^{c+ε}) — 정규조건 검사 필요`;
        if (label.includes("갭")) return `갭: p=${f.p} = c=${cs}이지만 lg^${f.q} n 인자 존재 — 다항식적 우열이 성립 안 함`;
        return "";
      }
    },
    render(frame, svg) {
      const W = 760, H = 420;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const { a, b, f, c, caseLabel, answer, regularity } = frame;

      svg.appendChild(svgText("Master Theorem — Case 판정", {
        x: W / 2, y: 22, "text-anchor": "middle",
        "font-size": 14, "font-weight": 600, "font-family": "sans-serif", fill: "#44403c",
      }));

      const drawBox = (x, y, w, h, fill, stroke, strokeW = 2) => {
        svg.appendChild(svgEl("rect", {
          x, y, width: w, height: h, rx: 8, fill, stroke, "stroke-width": strokeW,
        }));
      };

      /* Row 1: 점화식 */
      drawBox(40, 40, W - 80, 50, "#fef3c7", "#92400e");
      svg.appendChild(svgText(`T(n) = ${a}·T(n/${b}) + ${f.label}`, {
        x: W / 2, y: 72, "text-anchor": "middle",
        "font-size": 17, "font-weight": 700, "font-family": "monospace", fill: "#1f2937",
      }));

      /* Row 2: c = log_b(a) */
      if (c != null) {
        drawBox(40, 105, W - 80, 40, "#dbeafe", "#1e40af");
        svg.appendChild(svgText(`c = log_${b}(${a}) = ${_formatNum(c)}`, {
          x: W / 2, y: 131, "text-anchor": "middle",
          "font-size": 14, "font-weight": 600, "font-family": "monospace", fill: "#1f2937",
        }));
      }

      /* Row 3: case 결정 */
      if (caseLabel) {
        const isCase1 = caseLabel.startsWith("Case 1");
        const isCase2 = caseLabel.startsWith("Case 2");
        const isCase3 = caseLabel.startsWith("Case 3") && !caseLabel.includes("실패");
        const isFail  = caseLabel.includes("실패");
        const isGap   = caseLabel.includes("갭");
        const fill =
          isCase1 ? "#dcfce7" :
          isCase2 ? "#fef3c7" :
          isCase3 ? "#dbeafe" :
          isFail  ? "#fee2e2" :
                    "#fce7f3";
        const stroke =
          isCase1 ? "#16a34a" :
          isCase2 ? "#ca8a04" :
          isCase3 ? "#2563eb" :
          isFail  ? "#dc2626" :
                    "#db2777";
        drawBox(40, 160, W - 80, 60, fill, stroke);
        svg.appendChild(svgText(caseLabel, {
          x: W / 2, y: 182, "text-anchor": "middle",
          "font-size": 14, "font-weight": 700, "font-family": "sans-serif", fill: stroke,
        }));
        const cs = c != null ? _formatNum(c) : "?";
        let detail = "";
        if (isCase1) detail = `f차수 p=${f.p} < c=${cs}  →  T = Θ(n^${cs})`;
        else if (isCase2) detail = `f차수 p=${f.p} = c=${cs}, lg 인자 없음  →  T = Θ(n^${cs} lg n)`;
        else if (isCase3) detail = `f차수 p=${f.p} > c=${cs}  →  정규조건 검사 필요`;
        else if (isFail) detail = `정규조건 a·f(n/b) ≤ c'·f(n) 불성립`;
        else detail = `p=${f.p} = c=${cs}, lg^${f.q} n 인자 — 다항식적 우열 없음`;
        svg.appendChild(svgText(detail, {
          x: W / 2, y: 205, "text-anchor": "middle",
          "font-size": 12, "font-family": "monospace", fill: "#1f2937",
        }));
      }

      /* Row 4: regularity */
      if (regularity) {
        const fill = regularity.holds ? "#dcfce7" : "#fee2e2";
        const stroke = regularity.holds ? "#16a34a" : "#dc2626";
        drawBox(40, 235, W - 80, 50, fill, stroke);
        svg.appendChild(svgText("정규조건 (Regularity)", {
          x: W / 2, y: 254, "text-anchor": "middle",
          "font-size": 12, "font-weight": 700, "font-family": "sans-serif", fill: stroke,
        }));
        const sym = regularity.holds ? "<" : "≥";
        const ok = regularity.holds ? "✓" : "✗";
        svg.appendChild(svgText(
          `a / b^p  =  ${a} / ${b}^${f.p}  =  ${regularity.ratio.toFixed(3)}  ${sym}  1  ${ok}`,
          {
            x: W / 2, y: 274, "text-anchor": "middle",
            "font-size": 13, "font-family": "monospace", fill: "#1f2937",
          }
        ));
      }

      /* Row 5: 결론 */
      if (answer) {
        const yAns = regularity ? 305 : 245;
        drawBox(40, yAns, W - 80, H - yAns - 20, "#1f2937", "#1f2937");
        svg.appendChild(svgText("결론", {
          x: W / 2, y: yAns + 22, "text-anchor": "middle",
          "font-size": 12, "font-weight": 600, "font-family": "sans-serif", fill: "#fbbf24",
        }));
        svg.appendChild(svgText(`T(n) = ${answer}`, {
          x: W / 2, y: yAns + 56, "text-anchor": "middle",
          "font-size": 17, "font-weight": 700, "font-family": "monospace", fill: "#fff",
        }));
      }
    },
  }));
})();
