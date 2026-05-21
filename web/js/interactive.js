/* =========================================================
   interactive.js — 4개의 인터랙티브 심화 모듈
     ① 빈칸 채우기 증명  (fill-in-the-blank proof)
     ② 그래프 에디터     (SVG 기반, BFS/Dijkstra/Kruskal 시뮬)
     ③ 타이머 챌린지     (OX + 증명·추적 문제 스프린트)
     ④ SAT 솔버 미니 실습 (3-SAT + DPLL 시각화)

   각 기능은 독립 네임스페이스로 window.Interactive에 부착.
   저장 키:
     clrs:fill:v1        — 빈칸 퀴즈 응답
     clrs:timer:best:v1  — 최고 점수
   ========================================================= */
(function () {
  "use strict";

  const esc = window.VizCore ? window.VizCore.escapeHtml : (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    });
    return n;
  }

  /* =========================================================
     ① 빈칸 채우기 증명 (Fill-in-the-blank proof)

     각 문제는 CLRS 핵심 증명에서 중요한 부분을 {{n}}로 비워둠.
     정답은 복수 표기 허용 (accept 배열).
     대소문자, 공백, 전각/반각, 그리스/라틴 혼용 등 관대하게 비교.
     ========================================================= */
  const FILL_STORE_KEY = "clrs:fill:v1";
  function loadFillStore() {
    try { return JSON.parse(localStorage.getItem(FILL_STORE_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveFillStore(s) {
    try { localStorage.setItem(FILL_STORE_KEY, JSON.stringify(s)); } catch {}
  }

  // 정답 비교 — 공백·대소문자 무시 + 일반적 수학 표기 동치
  function normalizeAnswer(s) {
    if (s == null) return "";
    return String(s)
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[（）]/g, (c) => c === "（" ? "(" : ")")
      .replace(/[Θθ]/g, "theta")
      .replace(/[Ωω]/g, "omega")
      .replace(/[οOο]/g, "o")
      .replace(/lg/g, "log")
      .replace(/ln/g, "log")
      .replace(/·|×/g, "*")
      .replace(/–|—/g, "-");
  }

  function answerMatches(userInput, acceptList) {
    const u = normalizeAnswer(userInput);
    return acceptList.some((a) => normalizeAnswer(a) === u);
  }

  const FILL_PROOFS = [
    {
      id: "insertion-invariant",
      chapter: "ch2",
      title: "삽입 정렬 루프 불변식",
      summary: "INSERTION-SORT의 외부 for 루프에 대한 루프 불변식을 완성하세요.",
      text:
        "각 반복이 시작되는 시점에, 부분 배열 A[1..j-1]은 처음 {{1}} 원소들을 " +
        "{{2}} 순서로 담고 있다. 단, 이 원소들의 {{3}} 자리는 원래 A[1..j-1]에 있던 원소들이다.",
      blanks: [
        { accept: ["j-1개", "j-1", "j - 1", "j-1 개"], hint: "외부 for 루프 시작 직전, 우리는 j-1개의 원소를 이미 살펴봤다.", explain: "부분 배열 A[1..j-1]의 길이 = j-1." },
        { accept: ["정렬된", "오름차순으로 정렬된", "sorted"], hint: "이미 처리한 원소들의 상태.", explain: "루프가 유지하는 핵심 성질: 좌측은 항상 정렬되어 있다." },
        { accept: ["원래", "원래 A[1..j-1]에 있던", "초기"], hint: "원소의 출처 — 새로 생긴 것이 아닌...", explain: "입력의 원래 원소들만 포함(permutation)." },
      ],
    },
    {
      id: "merge-recurrence",
      chapter: "ch2",
      title: "합병 정렬 점화식",
      summary: "합병 정렬의 수행 시간 점화식과 그 해를 채우세요.",
      text:
        "T(n) = {{1}} · T(n/2) + {{2}}\n" +
        "마스터 정리로 풀면 T(n) = Θ({{3}}).",
      blanks: [
        { accept: ["2"], hint: "n/2 크기 부분 배열이 몇 개?", explain: "Divide가 배열을 반으로 나누므로 2개의 부분 문제." },
        { accept: ["Θ(n)", "theta(n)", "cn", "n"], hint: "MERGE 단계의 비용.", explain: "MERGE는 n개 원소를 한 번 훑음 → Θ(n)." },
        { accept: ["n log n", "n lg n", "nlogn", "nlgn"], hint: "case 2 결과.", explain: "a=2, b=2, n^log_b(a) = n, f(n)=Θ(n) → Case 2 → Θ(n lg n)." },
      ],
    },
    {
      id: "master-theorem",
      chapter: "ch4",
      title: "마스터 정리 Case 1 조건",
      summary: "T(n) = aT(n/b) + f(n) 에서 Case 1이 성립할 조건을 채우세요.",
      text:
        "어떤 상수 ε > 0 에 대해 f(n) = O(n^(log_b(a) {{1}} ε)) 이면,\n" +
        "T(n) = Θ({{2}}).",
      blanks: [
        { accept: ["-", "-ε", "- ε"], hint: "'다항적으로 작다'를 위해 지수에 무엇이 붙나?", explain: "f(n)이 n^(log_b a)보다 다항식적으로 '작을 때' Case 1." },
        { accept: ["n^(log_b a)", "n^log_b(a)", "n^logb(a)", "n^(logba)"], hint: "분할의 지배적 비용.", explain: "Case 1에서는 서브문제(재귀 트리의 리프)가 지배한다." },
      ],
    },
    {
      id: "build-heap-cost",
      chapter: "ch6",
      title: "BUILD-MAX-HEAP이 O(n)인 이유",
      summary: "힙 구축이 O(n)임을 보이는 합산을 채우세요.",
      text:
        "높이 h인 노드는 최대 ⌈n/{{1}}⌉ 개.\n" +
        "각 노드에서 MAX-HEAPIFY는 O({{2}}) 시간.\n" +
        "총합: Σ(h=0..⌊lg n⌋) ⌈n/2^(h+1)⌉ · O(h) = O(n · Σ h/{{3}}) = O(n).",
      blanks: [
        { accept: ["2^(h+1)", "2^{h+1}", "2^h+1"], hint: "높이가 커질수록 노드는 지수적으로 줄어든다.", explain: "완전 이진 트리에서 높이 h인 노드 수 상한." },
        { accept: ["h"], hint: "MAX-HEAPIFY는 트리의 높이를 따라 내려간다.", explain: "한 번 호출당 최악 시간 = 해당 노드의 높이." },
        { accept: ["2^h"], hint: "Σ h · x^h 꼴의 수렴 급수.", explain: "Σ h/2^h < ∞ (고정 상수) → 전체는 O(n)." },
      ],
    },
    {
      id: "quicksort-worst",
      chapter: "ch7",
      title: "Quicksort 최악 점화식",
      summary: "최악의 경우 퀵 정렬의 점화식을 완성하세요.",
      text:
        "매 분할이 0 : n-1로 불균형일 때,\n" +
        "T(n) = T({{1}}) + T({{2}}) + Θ(n) = Θ({{3}}).",
      blanks: [
        { accept: ["n-1", "n - 1"], hint: "한쪽 파티션이 n-1개를 가져간다.", explain: "피벗을 제외한 나머지 모두가 한쪽으로." },
        { accept: ["0"], hint: "반대쪽은 텅 빈다.", explain: "극단적 불균형 시 한쪽은 빈 파티션." },
        { accept: ["n^2", "n²", "n*n"], hint: "아르키메데스 합 공식으로 유도.", explain: "T(n) = T(n-1) + Θ(n) → Θ(n²)." },
      ],
    },
    {
      id: "compare-sort-lb",
      chapter: "ch8",
      title: "비교 정렬 하한",
      summary: "결정 트리 모델로 비교 정렬의 하한을 증명합니다.",
      text:
        "n개 원소의 가능한 순열은 {{1}} 개이다.\n" +
        "결정 트리의 리프 수 L ≥ {{1}} 이고, 이진 트리 높이 h는 L ≤ 2^h을 만족하므로\n" +
        "h ≥ lg(L) ≥ lg({{1}}) = Ω({{2}}) (스털링 근사).",
      blanks: [
        { accept: ["n!", "n !"], hint: "원소 하나의 순서를 매기는 경우의 수.", explain: "n개의 순열 수." },
        { accept: ["n log n", "n lg n", "nlogn", "nlgn"], hint: "lg(n!) ≈ n lg n (스털링).", explain: "lg(n!) = Θ(n lg n), 즉 Ω(n lg n)." },
      ],
    },
    {
      id: "dp-conditions",
      chapter: "ch15",
      title: "동적 프로그래밍 적용 조건",
      summary: "DP가 유용하기 위한 두 가지 조건을 채우세요.",
      text:
        "(1) {{1}} 부분 구조: 최적 해가 부분 문제의 최적 해를 포함한다.\n" +
        "(2) {{2}} 부분 문제: 동일한 부분 문제가 반복해서 나타나 계산이 중복된다.",
      blanks: [
        { accept: ["최적", "optimal"], hint: "DP는 '작은 최적' → '큰 최적'.", explain: "Optimal Substructure." },
        { accept: ["중복되는", "중복", "겹치는", "overlapping"], hint: "같은 서브문제가 여러 번 나타난다.", explain: "Overlapping Subproblems — 메모이제이션의 근거." },
      ],
    },
    {
      id: "greedy-exchange",
      chapter: "ch16",
      title: "활동 선택 — 교환 논증",
      summary: "탐욕 선택 정리(정리 16.1)의 교환 논증 틀.",
      text:
        "최적 해 A에 '가장 빨리 끝나는' 활동 a_m 이 포함되어 있지 않다고 가정하자.\n" +
        "A의 첫 번째 활동을 a_k라 하면 f_m {{1}} f_k 이다.\n" +
        "A에서 a_k를 a_m으로 바꾼 A' 또한 {{2}} 해이며 크기는 {{3}}.",
      blanks: [
        { accept: ["≤", "<=", "작거나 같다", "같거나 작다"], hint: "'가장 빨리 끝나는' 정의.", explain: "탐욕 선택은 종료 시간 최소 → f_m ≤ f_k." },
        { accept: ["최적", "optimal"], hint: "원래 A가 최적이었으므로...", explain: "교환해도 크기가 줄지 않으므로 A'도 최적." },
        { accept: ["같다", "|A|", "|a|", "동일", "|A| 과 같다"], hint: "한 원소를 다른 원소로 바꿨을 뿐.", explain: "|A'| = |A| — 교환이므로 크기 변화 없음." },
      ],
    },
    {
      id: "mst-cut-property",
      chapter: "ch23",
      title: "MST 절단 정리",
      summary: "Theorem 23.1 — MST의 '안전한 간선'을 보장하는 정리.",
      text:
        "A가 어떤 MST의 {{1}} 이고 (S, V-S)가 A를 존중하는 절단이면,\n" +
        "이 절단을 가로지르는 {{2}} 간선은 A에 대해 {{3}} 하다.",
      blanks: [
        { accept: ["부분집합", "subset", "하위집합"], hint: "현재까지 쌓은 간선 집합의 성질.", explain: "A ⊆ some MST." },
        { accept: ["경량", "최소", "light", "최소가중치"], hint: "절단을 가로지르는 '가장 가벼운'...", explain: "Light edge — 최소 가중치 cross edge." },
        { accept: ["안전", "safe"], hint: "A에 추가해도 여전히 MST의 부분집합.", explain: "Safe edge — MST 구성에 문제없음을 보장." },
      ],
    },
    {
      id: "bellman-ford-rounds",
      chapter: "ch24",
      title: "Bellman-Ford가 |V|-1번 반복하는 이유",
      summary: "음수 사이클이 없다면 최단 경로는 어떤 상한의 간선 수를 가지는가?",
      text:
        "음수 사이클이 없으면 어떤 최단 경로 p도 단순(simple) 경로이므로 최대 {{1}} 개의 간선을 가진다.\n" +
        "따라서 {{1}} 번 모든 간선을 완화하면 경로 완화 성질에 의해 {{2}} 가 보장된다.",
      blanks: [
        { accept: ["|V|-1", "|V| - 1", "V-1", "V - 1", "n-1"], hint: "정점 수가 V일 때 단순 경로의 간선 수 한계.", explain: "단순 경로에는 최대 V-1개의 간선." },
        { accept: ["수렴", "최적성", "정답", "정확성", "δ(s,v)", "최단 거리"], hint: "경로 완화 후 v.d = ?", explain: "v.d = δ(s,v)가 되어 정확한 최단 거리로 수렴." },
      ],
    },
  ];

  function renderFillBlank(parent) {
    const store = loadFillStore();

    const wrap = el("section", { class: "fill-panel" });
    wrap.appendChild(el("div", { class: "chapter-head" }, [
      el("span", { class: "eyebrow tier3" }, ["도구 · 증명"]),
      el("h1", {}, ["빈칸 채우기 증명"]),
      el("p", { class: "lead muted" }, [
        "CLRS 핵심 증명의 중요 용어를 직접 채워 보세요. 답안은 대소문자·공백·그리스/라틴 표기를 관대하게 비교합니다.",
      ]),
    ]));

    const stat = el("div", { class: "fill-summary" });
    function refreshSummary() {
      const s = loadFillStore();
      let solved = 0, partial = 0;
      FILL_PROOFS.forEach((p) => {
        const row = s[p.id];
        if (!row) return;
        const filled = p.blanks.filter((_, i) => row[i] && row[i].correct).length;
        if (filled === p.blanks.length) solved += 1;
        else if (filled > 0) partial += 1;
      });
      stat.innerHTML = `
        <strong>${FILL_PROOFS.length}개</strong> 증명 ·
        <strong class="good">${solved}</strong> 완료 ·
        <strong class="warn">${partial}</strong> 진행 중
      `;
    }
    wrap.appendChild(stat);

    FILL_PROOFS.forEach((p) => {
      const card = el("article", { class: "fill-card", "data-id": p.id });
      card.appendChild(el("header", { class: "fill-card-head" }, [
        el("p", { class: "fill-chip" }, [p.chapter.toUpperCase()]),
        el("h3", {}, [p.title]),
        el("p", { class: "fill-summary-line muted small" }, [p.summary]),
      ]));

      // Split the text on placeholders and build input fields
      const body = el("div", { class: "fill-body" });
      const rowStore = store[p.id] || {};
      const inputs = [];

      const parts = p.text.split(/(\{\{\d+\}\})/g);
      const container = el("p", { class: "fill-text" });
      parts.forEach((part) => {
        const m = part.match(/^\{\{(\d+)\}\}$/);
        if (m) {
          const n = parseInt(m[1], 10) - 1;
          const blank = p.blanks[n];
          const saved = rowStore[n];
          const input = el("input", {
            type: "text",
            class: "fill-input",
            "data-blank-idx": String(n),
            placeholder: `?${n + 1}`,
            autocomplete: "off",
            spellcheck: "false",
            value: saved ? saved.value : "",
          });
          if (saved && saved.correct) input.classList.add("correct");
          else if (saved && !saved.correct) input.classList.add("wrong");

          // Hint button inline
          const hintBtn = el("button", {
            type: "button",
            class: "fill-hintbtn",
            "data-tooltip": "힌트 보기",
          }, ["💡"]);
          const span = el("span", { class: "fill-blank-wrap" }, [input, hintBtn]);
          inputs.push({ idx: n, input, hintBtn, blank });
          container.appendChild(span);
        } else {
          // Preserve newlines
          part.split("\n").forEach((ln, i, arr) => {
            container.appendChild(document.createTextNode(ln));
            if (i < arr.length - 1) container.appendChild(el("br"));
          });
        }
      });
      body.appendChild(container);

      // Feedback area
      const feedback = el("div", { class: "fill-feedback", hidden: "" });

      const actions = el("div", { class: "fill-actions" }, [
        el("button", { type: "button", class: "btn btn-primary btn-sm", "data-role": "check" }, ["채점"]),
        el("button", { type: "button", class: "btn btn-outline btn-sm", "data-role": "reveal" }, ["정답 보기"]),
        el("button", { type: "button", class: "btn btn-ghost btn-sm", "data-role": "reset" }, ["초기화"]),
      ]);

      body.appendChild(actions);
      body.appendChild(feedback);
      card.appendChild(body);

      inputs.forEach(({ idx, input, hintBtn, blank }) => {
        input.addEventListener("input", () => {
          input.classList.remove("correct", "wrong");
        });
        hintBtn.addEventListener("click", () => {
          const showing = hintBtn.classList.toggle("active");
          if (showing) {
            input.setAttribute("title", blank.hint);
            feedback.hidden = false;
            feedback.innerHTML = `<p class="info">💡 <strong>힌트 ${idx + 1}:</strong> ${esc(blank.hint)}</p>`;
          } else {
            feedback.hidden = true;
          }
        });
      });

      card.querySelector('[data-role="check"]').addEventListener("click", () => {
        const row = {};
        let allGood = true;
        inputs.forEach(({ idx, input, blank }) => {
          const v = input.value.trim();
          const correct = v.length > 0 && answerMatches(v, blank.accept);
          input.classList.toggle("correct", correct);
          input.classList.toggle("wrong", !correct && v.length > 0);
          row[idx] = { value: v, correct };
          if (!correct) allGood = false;
        });
        const s = loadFillStore();
        s[p.id] = row;
        saveFillStore(s);

        feedback.hidden = false;
        if (allGood) {
          feedback.innerHTML = `<p class="good"><strong>✓ 완벽!</strong> 모든 빈칸을 맞췄습니다.</p>`;
          card.classList.add("fill-solved");
        } else {
          card.classList.remove("fill-solved");
          const wrongCount = inputs.filter((i) => row[i.idx] && !row[i.idx].correct).length;
          feedback.innerHTML =
            `<p class="bad"><strong>✗ ${wrongCount}개</strong>가 아직 맞지 않습니다. 힌트를 참고하거나 정답을 확인해 보세요.</p>`;
        }
        refreshSummary();
      });

      card.querySelector('[data-role="reveal"]').addEventListener("click", () => {
        inputs.forEach(({ input, blank }) => {
          input.value = blank.accept[0];
          input.classList.add("correct");
        });
        feedback.hidden = false;
        feedback.innerHTML =
          `<div class="fill-explains"><strong>정답 및 해설</strong><ul>` +
          inputs.map(({ idx, blank }) =>
            `<li><strong>${idx + 1}. ${esc(blank.accept[0])}</strong> — ${esc(blank.explain)}</li>`
          ).join("") +
          `</ul></div>`;
        card.classList.add("fill-solved");
      });

      card.querySelector('[data-role="reset"]').addEventListener("click", () => {
        inputs.forEach(({ input }) => {
          input.value = "";
          input.classList.remove("correct", "wrong");
        });
        const s = loadFillStore();
        delete s[p.id];
        saveFillStore(s);
        feedback.hidden = true;
        feedback.innerHTML = "";
        card.classList.remove("fill-solved");
        refreshSummary();
      });

      wrap.appendChild(card);
    });

    refreshSummary();
    parent.appendChild(wrap);
  }

  /* =========================================================
     ② 그래프 에디터 — SVG 기반 노드/간선 편집 + 알고리즘 시뮬
       · 좌클릭: 빈 공간에 노드 추가, 노드 위에서 드래그
       · 우클릭: 노드/간선 삭제
       · 노드 → 노드 클릭 순으로 간선 추가 (가중치 입력)
       · BFS / Dijkstra / Kruskal / DFS 실행
     ========================================================= */
  function renderGraphEditor(parent) {
    const panel = el("section", { class: "ge-panel" });
    panel.appendChild(el("div", { class: "chapter-head" }, [
      el("span", { class: "eyebrow tier3" }, ["도구 · 그래프"]),
      el("h1", {}, ["그래프 에디터"]),
      el("p", { class: "lead muted" }, [
        "직접 그래프를 그리고 BFS · Dijkstra · Kruskal · DFS를 실행해 단계별 색칠을 관찰하세요.",
      ]),
    ]));

    // Controls toolbar
    const toolbar = el("div", { class: "ge-toolbar" });
    toolbar.innerHTML = `
      <div class="ge-toolbar-group">
        <label class="ge-label">모드:</label>
        <div class="ge-tabs" role="tablist">
          <button type="button" class="ge-tab active" data-mode="add" aria-selected="true">＋ 노드/간선</button>
          <button type="button" class="ge-tab" data-mode="move" aria-selected="false">⇔ 이동</button>
          <button type="button" class="ge-tab" data-mode="delete" aria-selected="false">✕ 삭제</button>
          <button type="button" class="ge-tab" data-mode="source" aria-selected="false">◉ 출발점 선택</button>
        </div>
      </div>
      <div class="ge-toolbar-group">
        <label class="ge-label">알고리즘:</label>
        <select class="ge-select" id="ge-algo">
          <option value="bfs">BFS</option>
          <option value="dfs">DFS</option>
          <option value="dijkstra">Dijkstra</option>
          <option value="kruskal">Kruskal (MST)</option>
        </select>
        <button type="button" class="btn btn-primary btn-sm" id="ge-run">▶ 실행</button>
        <button type="button" class="btn btn-outline btn-sm" id="ge-step-prev" disabled>◀</button>
        <span id="ge-step-label" class="muted small">—</span>
        <button type="button" class="btn btn-outline btn-sm" id="ge-step-next" disabled>▶</button>
      </div>
      <div class="ge-toolbar-group">
        <button type="button" class="btn btn-ghost btn-sm" id="ge-preset">예시 불러오기</button>
        <button type="button" class="btn btn-ghost btn-sm" id="ge-clear">전체 지우기</button>
      </div>
    `;
    panel.appendChild(toolbar);

    const helpLine = el("p", { class: "ge-help muted small" });
    panel.appendChild(helpLine);

    const canvas = el("div", { class: "ge-canvas" });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 900 480");
    svg.setAttribute("class", "ge-svg");
    canvas.appendChild(svg);
    panel.appendChild(canvas);

    const log = el("div", { class: "ge-log" });
    panel.appendChild(log);

    parent.appendChild(panel);

    // --- State ---
    let nodes = []; // { id, x, y }
    let edges = []; // { from, to, w }
    let nextId = 0;
    let source = null;
    let mode = "add";
    let pendingEdgeFrom = null;
    let trace = null;  // { steps: [], idx: 0 }

    function setHelp(text) { helpLine.textContent = text; }
    function updateHelp() {
      const lines = {
        add: "빈 공간을 클릭 → 노드 추가. 노드를 차례로 클릭하면 두 노드를 잇는 간선(가중치 입력)을 만듭니다.",
        move: "노드를 드래그해 위치를 옮기세요.",
        delete: "노드를 클릭하면 그 노드와 연결된 간선까지, 간선을 클릭하면 해당 간선만 삭제됩니다.",
        source: "노드를 클릭해 BFS/Dijkstra의 출발점으로 지정하세요.",
      };
      setHelp(lines[mode] || "");
    }
    updateHelp();

    // --- Rendering ---
    function redraw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      // Defs: arrowhead
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = `
        <marker id="ge-arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>`;
      svg.appendChild(defs);

      // Edges
      edges.forEach((e, ei) => {
        const a = nodes.find((n) => n.id === e.from);
        const b = nodes.find((n) => n.id === e.to);
        if (!a || !b) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        line.setAttribute("class", "ge-edge" + (e.state ? ` ${e.state}` : ""));
        line.dataset.edgeIdx = String(ei);
        line.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (mode === "delete") {
            edges.splice(ei, 1);
            redraw();
          }
        });
        svg.appendChild(line);

        // Edge weight label
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        labelBg.setAttribute("x", mx - 14);
        labelBg.setAttribute("y", my - 11);
        labelBg.setAttribute("width", 28);
        labelBg.setAttribute("height", 22);
        labelBg.setAttribute("rx", 4);
        labelBg.setAttribute("class", "ge-edge-label-bg");
        svg.appendChild(labelBg);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", mx);
        label.setAttribute("y", my);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("class", "ge-edge-label");
        label.textContent = String(e.w);
        svg.appendChild(label);
      });

      // Nodes
      nodes.forEach((n) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "ge-node-group");
        g.dataset.nodeId = String(n.id);

        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", n.x);
        c.setAttribute("cy", n.y);
        c.setAttribute("r", 22);
        let cls = "ge-node";
        if (source === n.id) cls += " source";
        if (pendingEdgeFrom === n.id) cls += " pending";
        if (n.state) cls += ` ${n.state}`;
        c.setAttribute("class", cls);
        g.appendChild(c);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", n.x);
        label.setAttribute("y", n.y);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "central");
        label.setAttribute("class", "ge-node-label");
        label.textContent = n.label || String.fromCharCode(65 + (n.id % 26));
        g.appendChild(label);

        // d-value annotation for BFS/Dijkstra
        if (n.d != null) {
          const dText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          dText.setAttribute("x", n.x);
          dText.setAttribute("y", n.y - 32);
          dText.setAttribute("text-anchor", "middle");
          dText.setAttribute("class", "ge-node-d");
          dText.textContent = n.d === Infinity ? "∞" : String(n.d);
          g.appendChild(dText);
        }

        g.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onNodeClick(n, ev);
        });
        if (mode === "move") {
          g.addEventListener("pointerdown", (ev) => startDrag(n, ev, g));
        }

        svg.appendChild(g);
      });
    }

    function onNodeClick(n, ev) {
      if (mode === "delete") {
        edges = edges.filter((e) => e.from !== n.id && e.to !== n.id);
        nodes = nodes.filter((x) => x.id !== n.id);
        if (source === n.id) source = null;
        redraw();
      } else if (mode === "source") {
        source = n.id;
        redraw();
      } else if (mode === "add") {
        if (pendingEdgeFrom == null) {
          pendingEdgeFrom = n.id;
          redraw();
        } else if (pendingEdgeFrom === n.id) {
          pendingEdgeFrom = null;
          redraw();
        } else {
          const wStr = prompt("간선 가중치:", "1");
          const w = parseInt(wStr, 10);
          if (!isNaN(w)) {
            // Prevent duplicate (undirected)
            const exists = edges.some((e) =>
              (e.from === pendingEdgeFrom && e.to === n.id) ||
              (e.from === n.id && e.to === pendingEdgeFrom)
            );
            if (!exists) edges.push({ from: pendingEdgeFrom, to: n.id, w });
          }
          pendingEdgeFrom = null;
          redraw();
        }
      }
    }

    let dragging = null;
    function startDrag(n, ev, g) {
      dragging = { n, g };
      ev.preventDefault();
      g.setPointerCapture?.(ev.pointerId);
    }
    svg.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const x = ((ev.clientX - rect.left) / rect.width) * vb.width;
      const y = ((ev.clientY - rect.top) / rect.height) * vb.height;
      dragging.n.x = Math.max(30, Math.min(vb.width - 30, x));
      dragging.n.y = Math.max(30, Math.min(vb.height - 30, y));
      redraw();
    });
    svg.addEventListener("pointerup", () => { dragging = null; });
    svg.addEventListener("pointerleave", () => { dragging = null; });

    svg.addEventListener("click", (ev) => {
      if (ev.target.closest(".ge-node-group, .ge-edge")) return;
      if (mode !== "add") return;
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const x = ((ev.clientX - rect.left) / rect.width) * vb.width;
      const y = ((ev.clientY - rect.top) / rect.height) * vb.height;
      nodes.push({ id: nextId++, x, y });
      pendingEdgeFrom = null;
      redraw();
    });

    // Toolbar handlers
    toolbar.querySelectorAll(".ge-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        toolbar.querySelectorAll(".ge-tab").forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        mode = tab.dataset.mode;
        pendingEdgeFrom = null;
        updateHelp();
        redraw();
      });
    });

    toolbar.querySelector("#ge-clear").addEventListener("click", () => {
      if (!confirm("모든 노드와 간선을 지웁니다.")) return;
      nodes = []; edges = []; source = null; pendingEdgeFrom = null; trace = null;
      nextId = 0;
      log.innerHTML = "";
      redraw();
      updateStepControls();
    });

    toolbar.querySelector("#ge-preset").addEventListener("click", () => {
      loadPreset();
    });

    function loadPreset() {
      nodes = [
        { id: 0, x: 140, y: 100, label: "A" },
        { id: 1, x: 320, y: 60,  label: "B" },
        { id: 2, x: 540, y: 90,  label: "C" },
        { id: 3, x: 720, y: 160, label: "D" },
        { id: 4, x: 200, y: 260, label: "E" },
        { id: 5, x: 430, y: 290, label: "F" },
        { id: 6, x: 640, y: 320, label: "G" },
        { id: 7, x: 760, y: 380, label: "H" },
      ];
      edges = [
        { from: 0, to: 1, w: 4 },
        { from: 0, to: 4, w: 7 },
        { from: 1, to: 2, w: 3 },
        { from: 1, to: 5, w: 2 },
        { from: 2, to: 3, w: 2 },
        { from: 2, to: 5, w: 5 },
        { from: 3, to: 6, w: 4 },
        { from: 3, to: 7, w: 3 },
        { from: 4, to: 5, w: 1 },
        { from: 5, to: 6, w: 6 },
        { from: 6, to: 7, w: 2 },
      ];
      nextId = 8;
      source = 0;
      pendingEdgeFrom = null;
      trace = null;
      log.innerHTML = "";
      redraw();
      updateStepControls();
    }

    // Run algorithm — builds `trace.steps` each describing a frozen snapshot
    toolbar.querySelector("#ge-run").addEventListener("click", runAlgorithm);
    toolbar.querySelector("#ge-step-prev").addEventListener("click", () => stepTo(trace.idx - 1));
    toolbar.querySelector("#ge-step-next").addEventListener("click", () => stepTo(trace.idx + 1));

    function runAlgorithm() {
      if (nodes.length === 0) { alert("노드를 먼저 추가하세요."); return; }
      const algo = document.getElementById("ge-algo").value;
      if ((algo === "bfs" || algo === "dijkstra" || algo === "dfs") && source == null) {
        alert("출발점을 지정하세요 (모드: 출발점 선택).");
        return;
      }
      const adj = new Map();
      nodes.forEach((n) => adj.set(n.id, []));
      edges.forEach((e) => {
        adj.get(e.from).push({ to: e.to, w: e.w });
        adj.get(e.to).push({ to: e.from, w: e.w });
      });

      let steps = [];
      if (algo === "bfs") steps = simulateBFS(adj, source);
      else if (algo === "dfs") steps = simulateDFS(adj, source);
      else if (algo === "dijkstra") steps = simulateDijkstra(adj, source);
      else if (algo === "kruskal") steps = simulateKruskal();

      trace = { steps, idx: 0, algo };
      applyStep();
      updateStepControls();
    }

    function stepTo(i) {
      if (!trace) return;
      trace.idx = Math.max(0, Math.min(trace.steps.length - 1, i));
      applyStep();
      updateStepControls();
    }

    function applyStep() {
      if (!trace) return;
      const step = trace.steps[trace.idx];
      // Apply node/edge state from step
      nodes.forEach((n) => {
        const ns = step.nodeStates[n.id];
        n.state = ns ? ns.color : null;
        n.d = ns ? ns.d : null;
      });
      edges.forEach((e, ei) => {
        e.state = step.edgeStates[ei] || null;
      });
      redraw();
      // Log
      log.innerHTML = `
        <div class="ge-log-head">
          <span class="ge-log-step">Step ${trace.idx + 1}/${trace.steps.length}</span>
          <span class="ge-log-algo">${trace.algo.toUpperCase()}</span>
        </div>
        <p class="ge-log-msg">${esc(step.msg)}</p>
      `;
    }

    function updateStepControls() {
      const prev = toolbar.querySelector("#ge-step-prev");
      const next = toolbar.querySelector("#ge-step-next");
      const label = toolbar.querySelector("#ge-step-label");
      if (!trace) {
        prev.disabled = true; next.disabled = true; label.textContent = "—";
        return;
      }
      prev.disabled = trace.idx === 0;
      next.disabled = trace.idx >= trace.steps.length - 1;
      label.textContent = `${trace.idx + 1} / ${trace.steps.length}`;
    }

    // --- Algorithm simulators ---
    // Each step has { msg, nodeStates: {id: {color,d}}, edgeStates: {idx: cls} }
    function snap(nodeStates, edgeStates, msg) {
      // Deep-copy of small objects
      const n = {}, e = {};
      for (const k in nodeStates) n[k] = { ...nodeStates[k] };
      for (const k in edgeStates) e[k] = edgeStates[k];
      return { msg, nodeStates: n, edgeStates: e };
    }

    function initStates(srcId) {
      const ns = {};
      nodes.forEach((n) => {
        ns[n.id] = { color: "white", d: srcId === n.id ? 0 : Infinity };
      });
      return ns;
    }

    function simulateBFS(adj, src) {
      const steps = [];
      const ns = initStates(src);
      ns[src].color = "gray";
      steps.push(snap(ns, {}, `시작: ${labelOf(src)}을(를) 큐에 넣고 d=0, GRAY 처리.`));
      const q = [src];
      while (q.length) {
        const u = q.shift();
        steps.push(snap(ns, {}, `큐에서 ${labelOf(u)} 꺼냄. 이웃 검사 시작.`));
        for (const { to: v } of adj.get(u)) {
          if (ns[v].color === "white") {
            ns[v].color = "gray";
            ns[v].d = ns[u].d + 1;
            const ei = findEdgeIdx(u, v);
            const es = {};
            if (ei >= 0) es[ei] = "tree";
            steps.push(snap(ns, es, `${labelOf(v)} 발견 → d=${ns[v].d}, 큐에 추가.`));
            q.push(v);
          }
        }
        ns[u].color = "black";
        steps.push(snap(ns, {}, `${labelOf(u)} 처리 완료 (BLACK).`));
      }
      steps.push(snap(ns, {}, "BFS 종료."));
      return steps;
    }

    function simulateDFS(adj, src) {
      const steps = [];
      const ns = initStates(src);
      const edgeStates = {};
      function visit(u) {
        ns[u].color = "gray";
        steps.push(snap(ns, edgeStates, `DFS-VISIT(${labelOf(u)}) 시작 → GRAY.`));
        for (const { to: v } of adj.get(u)) {
          if (ns[v].color === "white") {
            const ei = findEdgeIdx(u, v);
            if (ei >= 0) edgeStates[ei] = "tree";
            steps.push(snap(ns, edgeStates, `${labelOf(u)} → ${labelOf(v)} Tree edge.`));
            visit(v);
          } else if (ns[v].color === "gray") {
            const ei = findEdgeIdx(u, v);
            if (ei >= 0) edgeStates[ei] = "back";
            steps.push(snap(ns, edgeStates, `${labelOf(u)} → ${labelOf(v)} Back edge (사이클 존재).`));
          }
        }
        ns[u].color = "black";
        steps.push(snap(ns, edgeStates, `${labelOf(u)} 종료 → BLACK.`));
      }
      visit(src);
      nodes.forEach((n) => { if (ns[n.id].color === "white") visit(n.id); });
      steps.push(snap(ns, edgeStates, "DFS 종료."));
      return steps;
    }

    function simulateDijkstra(adj, src) {
      const steps = [];
      const ns = initStates(src);
      const S = new Set();
      steps.push(snap(ns, {}, `Dijkstra 시작: ${labelOf(src)}.d = 0, 나머지는 ∞.`));
      const es = {};
      while (true) {
        // Extract-Min among unvisited
        let u = -1, best = Infinity;
        for (const n of nodes) {
          if (!S.has(n.id) && ns[n.id].d < best) { best = ns[n.id].d; u = n.id; }
        }
        if (u === -1) break;
        S.add(u);
        ns[u].color = "black";
        steps.push(snap(ns, es, `EXTRACT-MIN: ${labelOf(u)} (d=${ns[u].d}), S에 추가.`));
        for (const { to: v, w } of adj.get(u)) {
          if (S.has(v)) continue;
          const newD = ns[u].d + w;
          if (newD < ns[v].d) {
            ns[v].d = newD;
            if (ns[v].color === "white") ns[v].color = "gray";
            const ei = findEdgeIdx(u, v);
            if (ei >= 0) es[ei] = "tree";
            steps.push(snap(ns, es, `RELAX(${labelOf(u)}→${labelOf(v)}): ${labelOf(v)}.d = ${newD}.`));
          }
        }
      }
      steps.push(snap(ns, es, "Dijkstra 종료."));
      return steps;
    }

    function simulateKruskal() {
      const steps = [];
      const ns = {};
      nodes.forEach((n) => { ns[n.id] = { color: null, d: null }; });
      // Union-find
      const parent = new Map();
      nodes.forEach((n) => parent.set(n.id, n.id));
      function find(x) {
        if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
        return parent.get(x);
      }
      function union(a, b) { parent.set(find(a), find(b)); }

      const sorted = edges.map((e, i) => ({ ...e, idx: i })).slice()
        .sort((a, b) => a.w - b.w);
      const es = {};
      steps.push(snap(ns, es, `간선을 가중치 오름차순으로 정렬: [${sorted.map((e) => e.w).join(", ")}].`));
      let mstW = 0;
      for (const e of sorted) {
        const ra = find(e.from), rb = find(e.to);
        if (ra !== rb) {
          union(ra, rb);
          es[e.idx] = "tree";
          mstW += e.w;
          steps.push(snap(ns, es, `간선 ${labelOf(e.from)}-${labelOf(e.to)} (w=${e.w}) 선택. MST 총합 = ${mstW}.`));
        } else {
          es[e.idx] = "rejected";
          steps.push(snap(ns, es, `간선 ${labelOf(e.from)}-${labelOf(e.to)} (w=${e.w}): 사이클 → 기각.`));
        }
      }
      steps.push(snap(ns, es, `Kruskal 종료. MST 총 가중치 = ${mstW}.`));
      return steps;
    }

    function findEdgeIdx(u, v) {
      return edges.findIndex((e) =>
        (e.from === u && e.to === v) || (e.from === v && e.to === u));
    }
    function labelOf(id) {
      const n = nodes.find((x) => x.id === id);
      if (!n) return `?`;
      return n.label || String.fromCharCode(65 + (id % 26));
    }

    // Initial
    loadPreset();
  }

  /* =========================================================
     ③ 타이머 챌린지 — 랜덤 OX/증명 문제를 제한 시간 안에!
        기본 60초에 가능한 만큼 많이, 정답 시 +3초 보너스.
        최고 점수는 localStorage에 저장.
     ========================================================= */
  const TIMER_BEST_KEY = "clrs:timer:best:v1";
  function loadTimerBest() {
    try { return JSON.parse(localStorage.getItem(TIMER_BEST_KEY) || "null") || { score: 0, at: null }; }
    catch { return { score: 0, at: null }; }
  }
  function saveTimerBest(best) {
    try { localStorage.setItem(TIMER_BEST_KEY, JSON.stringify(best)); } catch {}
  }

  function gatherTimerQuestions() {
    const chapters = (window.__CLRS__ || {}).CHAPTERS || [];
    const pool = [];
    chapters.forEach((ch) => {
      // OX
      if (Array.isArray(ch.ox)) {
        ch.ox.forEach((q, i) => {
          pool.push({
            kind: "ox",
            chapter: `${ch.num} · ${ch.title}`,
            chapterId: ch.id,
            prompt: q.q,
            choices: [
              { text: "O (참)", correct: q.a === true, explain: q.why || "" },
              { text: "X (거짓)", correct: q.a === false, explain: q.why || "" },
            ],
            srcIdx: i,
          });
        });
      }
      // Proof steps (take first step of each for speed)
      (ch.algorithms || []).forEach((algo) => {
        if (!algo.drills) return;
        ["proof", "trace"].forEach((kind) => {
          const d = algo.drills[kind];
          if (!d || !Array.isArray(d.steps)) return;
          d.steps.forEach((s) => {
            pool.push({
              kind,
              chapter: `${ch.num} · ${ch.title}`,
              chapterId: ch.id,
              prompt: s.prompt,
              choices: s.choices,
            });
          });
        });
      });
    });
    return pool;
  }

  function renderTimerChallenge(parent) {
    const panel = el("section", { class: "tc-panel" });
    panel.appendChild(el("div", { class: "chapter-head" }, [
      el("span", { class: "eyebrow tier3" }, ["도구 · 타이머"]),
      el("h1", {}, ["타이머 챌린지"]),
      el("p", { class: "lead muted" }, [
        "60초 안에 얼마나 많은 문제를 맞힐 수 있을까요? 정답 +3초 보너스, 오답 -2초. 무작위로 출제됩니다.",
      ]),
    ]));

    const best = loadTimerBest();
    const bestLine = el("p", { class: "tc-best muted" }, [
      "최고 점수: ",
      el("strong", { class: "good" }, [String(best.score || 0) + "문제"]),
      best.at ? el("span", { class: "tc-best-date" }, [` (${new Date(best.at).toLocaleDateString()})`]) : "",
    ]);
    panel.appendChild(bestLine);

    const setupCard = el("div", { class: "tc-setup" });
    setupCard.innerHTML = `
      <div class="tc-setup-row">
        <label class="ge-label">시간 제한:</label>
        <select class="ge-select" id="tc-duration">
          <option value="30">30초 (하드)</option>
          <option value="60" selected>60초 (보통)</option>
          <option value="120">120초 (여유)</option>
          <option value="300">5분 (장거리)</option>
        </select>
      </div>
      <div class="tc-setup-row">
        <label class="ge-label">문제 유형:</label>
        <label class="tc-check"><input type="checkbox" id="tc-ox" checked> OX 퀴즈</label>
        <label class="tc-check"><input type="checkbox" id="tc-proof" checked> 증명 MCQ</label>
        <label class="tc-check"><input type="checkbox" id="tc-trace" checked> 실행 추적</label>
      </div>
      <button type="button" class="btn btn-primary btn-lg" id="tc-start">▶ 시작</button>
    `;
    panel.appendChild(setupCard);

    const play = el("div", { class: "tc-play", hidden: "" });
    panel.appendChild(play);

    parent.appendChild(panel);

    setupCard.querySelector("#tc-start").addEventListener("click", () => {
      const kinds = new Set();
      if (setupCard.querySelector("#tc-ox").checked) kinds.add("ox");
      if (setupCard.querySelector("#tc-proof").checked) kinds.add("proof");
      if (setupCard.querySelector("#tc-trace").checked) kinds.add("trace");
      if (kinds.size === 0) { alert("최소 한 가지 유형을 선택하세요."); return; }
      const duration = parseInt(setupCard.querySelector("#tc-duration").value, 10);
      startSession(kinds, duration);
    });

    function startSession(kinds, duration) {
      const pool = gatherTimerQuestions().filter((q) => kinds.has(q.kind));
      if (pool.length === 0) { alert("출제할 문제가 없습니다."); return; }

      setupCard.hidden = true;
      play.hidden = false;

      // Shuffle pool
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      let qIdx = 0;
      let score = 0;
      let wrong = 0;
      let answered = 0;
      let timeLeft = duration;
      let finished = false;

      const hud = el("div", { class: "tc-hud" });
      const bar = el("div", { class: "tc-bar" });
      const barFill = el("div", { class: "tc-bar-fill" });
      bar.appendChild(barFill);

      function renderHud() {
        hud.innerHTML = `
          <div class="tc-hud-time ${timeLeft <= 10 ? "critical" : ""}">⏱ ${timeLeft}s</div>
          <div class="tc-hud-score">정답 ${score}</div>
          <div class="tc-hud-wrong">오답 ${wrong}</div>
          <div class="tc-hud-done">답한 문제 ${answered}</div>
        `;
        barFill.style.width = `${(timeLeft / duration) * 100}%`;
        if (timeLeft <= 10) barFill.classList.add("critical");
      }

      const qBody = el("div", { class: "tc-qbody" });

      play.innerHTML = "";
      play.appendChild(hud);
      play.appendChild(bar);
      play.appendChild(qBody);

      const finishBtn = el("button", {
        type: "button", class: "btn btn-ghost btn-sm", id: "tc-abort",
      }, ["포기하기"]);
      finishBtn.addEventListener("click", () => finish());
      play.appendChild(finishBtn);

      function renderQuestion() {
        if (qIdx >= pool.length) { finish(); return; }
        const q = pool[qIdx];
        qBody.innerHTML = "";

        const meta = el("p", { class: "tc-meta muted small" }, [
          `Q${answered + 1} · ${q.kind.toUpperCase()} · ${q.chapter}`,
        ]);
        qBody.appendChild(meta);

        const prompt = el("p", { class: "tc-prompt" }, [q.prompt]);
        qBody.appendChild(prompt);

        const choices = el("div", { class: "tc-choices" });
        q.choices.forEach((ch, ci) => {
          const btn = el("button", { type: "button", class: "tc-choice-btn" }, [
            el("span", { class: "tc-choice-mark" }, [String.fromCharCode(65 + ci)]),
            el("span", { class: "tc-choice-text" }, [ch.text]),
          ]);
          btn.addEventListener("click", () => answer(ci));
          choices.appendChild(btn);
        });
        qBody.appendChild(choices);
      }

      function answer(chosen) {
        if (finished) return;
        const q = pool[qIdx];
        const correct = !!q.choices[chosen].correct;
        answered += 1;
        if (correct) {
          score += 1;
          timeLeft = Math.min(duration, timeLeft + 3);
        } else {
          wrong += 1;
          timeLeft = Math.max(0, timeLeft - 2);
        }
        // Feedback flash
        const btns = qBody.querySelectorAll(".tc-choice-btn");
        btns.forEach((b, i) => {
          b.disabled = true;
          if (q.choices[i].correct) b.classList.add("correct");
          else if (i === chosen) b.classList.add("wrong");
        });
        qBody.appendChild(el("p", {
          class: correct ? "tc-feedback good" : "tc-feedback bad",
        }, [correct ? "✓ 정답!" : `✗ 오답 · 정답은 ${String.fromCharCode(65 + q.choices.findIndex((c) => c.correct))}번`]));

        renderHud();
        qIdx += 1;
        setTimeout(() => { if (!finished) renderQuestion(); }, 500);
      }

      function finish() {
        if (finished) return;
        finished = true;
        clearInterval(tick);
        play.innerHTML = "";
        play.appendChild(el("div", { class: "tc-result" }, [
          el("h2", {}, ["⏱ 종료!"]),
          el("p", { class: "tc-result-score" }, [
            el("strong", { class: "good" }, [String(score)]),
            " 정답 ",
            el("strong", { class: "bad" }, [String(wrong)]),
            " 오답",
          ]),
          el("p", { class: "muted" }, [`총 ${answered}문제 풀이 · 정답률 ${answered ? Math.round((score / answered) * 100) : 0}%`]),
        ]));
        // Update best
        const currentBest = loadTimerBest();
        if (score > (currentBest.score || 0)) {
          saveTimerBest({ score, at: new Date().toISOString() });
          play.appendChild(el("p", { class: "tc-newbest good" }, ["🏆 신기록!"]));
        }
        const again = el("button", { type: "button", class: "btn btn-primary" }, ["다시 도전"]);
        again.addEventListener("click", () => {
          play.hidden = true;
          setupCard.hidden = false;
          // refresh best line
          const b = loadTimerBest();
          bestLine.innerHTML = `최고 점수: <strong class="good">${b.score || 0}문제</strong>${
            b.at ? ` <span class="tc-best-date">(${new Date(b.at).toLocaleDateString()})</span>` : ""
          }`;
        });
        play.appendChild(again);
      }

      renderHud();
      renderQuestion();
      const tick = setInterval(() => {
        if (finished) return;
        timeLeft -= 1;
        if (timeLeft <= 0) { timeLeft = 0; renderHud(); finish(); return; }
        renderHud();
      }, 1000);
    }
  }

  /* =========================================================
     ④ SAT 솔버 미니 실습 — 3-SAT 탐색 + DPLL 한 단계씩 진행
        · 변수를 T/F로 토글 → 각 절이 만족되는지 즉시 표시
        · DPLL 단계별 실행: Unit Propagation + Branching
     ========================================================= */

  // Each problem: { id, title, vars, clauses, hint }
  // clause is [literal, ...], literal = +1..+n for x_i, -1..-n for ¬x_i
  const SAT_PROBLEMS = [
    {
      id: "sat1",
      title: "Warm-up: 3변수 3절",
      hint: "x1=T, x2=F, x3=? 를 고민해 보세요.",
      vars: 3,
      clauses: [
        [+1, +2, -3],
        [-1, -2, +3],
        [+1, -2, +3],
      ],
    },
    {
      id: "sat2",
      title: "중간: 4변수, 5절 (만족가능)",
      hint: "x4=T로 고정하면 많은 절이 자동 만족됩니다.",
      vars: 4,
      clauses: [
        [+1, -2, +3],
        [-1, +2, +4],
        [-3, +4],
        [+2, +3, -4],
        [-1, -3, +4],
      ],
    },
    {
      id: "sat3",
      title: "Unit Propagation 연습",
      hint: "단일 리터럴 절(x1), (-x2)가 있습니다. 먼저 할당해 보세요.",
      vars: 3,
      clauses: [
        [+1],
        [-2],
        [-1, +2, +3],
        [+1, -3],
      ],
    },
    {
      id: "sat4",
      title: "불만족(Unsatisfiable) 예시",
      hint: "x가 T든 F든 모순이 발생합니다.",
      vars: 1,
      clauses: [
        [+1],
        [-1],
      ],
    },
    {
      id: "sat5",
      title: "DPLL 완주: 5변수 8절",
      hint: "체계적으로 Unit Prop + Branching.",
      vars: 5,
      clauses: [
        [+1, +2, +3],
        [-1, +2, -4],
        [+1, -3, +5],
        [-2, +4, -5],
        [+3, -4, +5],
        [-1, -2, +4],
        [+2, +3, -5],
        [-1, +4, +5],
      ],
    },
  ];

  function clauseValue(clause, assign) {
    // assign[i] ∈ { "T", "F", "?" }
    let hasUnknown = false;
    for (const lit of clause) {
      const i = Math.abs(lit) - 1;
      const v = assign[i];
      if (v === "?") { hasUnknown = true; continue; }
      const val = (lit > 0) ? v === "T" : v === "F";
      if (val) return "SAT";
    }
    return hasUnknown ? "UNK" : "UNSAT";
  }

  function formulaStatus(clauses, assign) {
    const perClause = clauses.map((c) => clauseValue(c, assign));
    if (perClause.every((v) => v === "SAT")) return { overall: "SAT", perClause };
    if (perClause.some((v) => v === "UNSAT")) return { overall: "UNSAT", perClause };
    return { overall: "UNK", perClause };
  }

  function renderFormulaHtml(clauses, assign) {
    const status = formulaStatus(clauses, assign);
    const parts = clauses.map((c, ci) => {
      const body = c.map((lit) => {
        const i = Math.abs(lit) - 1;
        const name = `x<sub>${i + 1}</sub>`;
        const sign = lit < 0 ? "¬" : "";
        const v = assign[i];
        let cls = "sat-lit";
        if (v !== "?") {
          const val = (lit > 0) ? v === "T" : v === "F";
          cls += val ? " sat-true" : " sat-false";
        }
        return `<span class="${cls}">${sign}${name}</span>`;
      }).join(" <span class='sat-or'>∨</span> ");
      const state = status.perClause[ci];
      return `<span class="sat-clause sat-clause-${state.toLowerCase()}">(<span>${body}</span>)</span>`;
    }).join(" <span class='sat-and'>∧</span> ");
    return { html: parts, status };
  }

  function renderSatSolver(parent) {
    const panel = el("section", { class: "sat-panel" });
    panel.appendChild(el("div", { class: "chapter-head" }, [
      el("span", { class: "eyebrow tier3" }, ["도구 · NP-Completeness"]),
      el("h1", {}, ["SAT 솔버 미니 실습"]),
      el("p", { class: "lead muted" }, [
        "3-SAT 문제에서 변수 할당을 바꾸거나, DPLL의 Unit Propagation / Branching을 한 단계씩 실행해 보세요.",
      ]),
    ]));

    const selector = el("div", { class: "sat-selector" });
    selector.appendChild(el("label", { class: "ge-label" }, ["문제:"]));
    const select = el("select", { class: "ge-select", id: "sat-problem" });
    SAT_PROBLEMS.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.title;
      select.appendChild(opt);
    });
    selector.appendChild(select);
    panel.appendChild(selector);

    const container = el("div", { class: "sat-container" });
    panel.appendChild(container);
    parent.appendChild(panel);

    let current = SAT_PROBLEMS[0];
    let assign = []; // ["T"|"F"|"?"]
    let dpllTrace = null; // { steps, idx }

    function mount() {
      current = SAT_PROBLEMS.find((p) => p.id === select.value) || SAT_PROBLEMS[0];
      assign = new Array(current.vars).fill("?");
      dpllTrace = null;
      render();
    }

    select.addEventListener("change", mount);

    function render() {
      container.innerHTML = "";

      // Hint + title
      const head = el("div", { class: "sat-head" });
      head.appendChild(el("h3", {}, [current.title]));
      if (current.hint) head.appendChild(el("p", { class: "muted small" }, [`💡 ${current.hint}`]));
      container.appendChild(head);

      // Formula view
      const { html, status } = renderFormulaHtml(current.clauses, assign);
      const formula = el("div", { class: "sat-formula" });
      formula.innerHTML = html;
      container.appendChild(formula);

      const statusLine = el("p", { class: "sat-status" });
      if (status.overall === "SAT") statusLine.innerHTML = `<span class="good"><strong>✓ 만족!</strong></span> 모든 절이 참입니다.`;
      else if (status.overall === "UNSAT") statusLine.innerHTML = `<span class="bad"><strong>✗ 충돌!</strong></span> 어떤 절도 만족될 수 없습니다 (UNSAT with current assignment).`;
      else statusLine.innerHTML = `<span class="muted">아직 일부 변수가 ?입니다. 계속 할당하세요.</span>`;
      container.appendChild(statusLine);

      // Variable toggles
      const varsWrap = el("div", { class: "sat-vars" });
      assign.forEach((v, i) => {
        const row = el("div", { class: "sat-var" });
        row.appendChild(el("span", { class: "sat-var-label", html: `x<sub>${i + 1}</sub>` }));
        ["T", "F", "?"].forEach((val) => {
          const btn = el("button", {
            type: "button",
            class: `sat-var-btn sat-val-${val.toLowerCase()}` + (assign[i] === val ? " active" : ""),
          }, [val === "?" ? "—" : val]);
          btn.addEventListener("click", () => {
            assign[i] = val;
            render();
          });
          row.appendChild(btn);
        });
        varsWrap.appendChild(row);
      });
      container.appendChild(varsWrap);

      // Per-clause status
      const clausesWrap = el("div", { class: "sat-clauses-list" });
      current.clauses.forEach((c, ci) => {
        const state = status.perClause[ci];
        const cls = `sat-clause-status sat-clause-${state.toLowerCase()}`;
        const literals = c.map((lit) => {
          const name = `x${Math.abs(lit)}`;
          return lit < 0 ? `¬${name}` : name;
        }).join(" ∨ ");
        const marker = state === "SAT" ? "✓" : state === "UNSAT" ? "✗" : "?";
        clausesWrap.appendChild(el("div", { class: cls }, [
          el("span", { class: "sat-clause-mark" }, [marker]),
          el("span", { class: "sat-clause-body" }, [`C${ci + 1}: (${literals})`]),
          el("span", { class: "sat-clause-label" }, [state]),
        ]));
      });
      container.appendChild(clausesWrap);

      // Action buttons
      const actions = el("div", { class: "sat-actions" });
      const resetBtn = el("button", { type: "button", class: "btn btn-ghost btn-sm" }, ["변수 리셋"]);
      resetBtn.addEventListener("click", () => {
        assign = new Array(current.vars).fill("?");
        dpllTrace = null;
        render();
      });
      const dpllBtn = el("button", { type: "button", class: "btn btn-primary btn-sm" }, ["🧠 DPLL 자동 실행 (단계별)"]);
      dpllBtn.addEventListener("click", () => {
        dpllTrace = runDPLL(current);
        renderDpll();
      });
      actions.appendChild(resetBtn);
      actions.appendChild(dpllBtn);
      container.appendChild(actions);

      if (dpllTrace) renderDpll();
    }

    function renderDpll() {
      const existing = container.querySelector(".sat-dpll");
      if (existing) existing.remove();
      if (!dpllTrace) return;
      const wrap = el("div", { class: "sat-dpll" });
      const title = el("h4", {}, [`DPLL 실행 — ${dpllTrace.result}`]);
      wrap.appendChild(title);

      const stepLine = el("p", { class: "muted small" });
      const list = el("ol", { class: "sat-dpll-steps" });
      dpllTrace.steps.forEach((s, i) => {
        const li = el("li", { class: "sat-dpll-step" }, [
          el("span", { class: "sat-dpll-num" }, [`#${i + 1}`]),
          el("span", { class: "sat-dpll-kind sat-dpll-" + s.kind }, [s.kind.toUpperCase()]),
          el("span", { class: "sat-dpll-msg" }, [s.msg]),
        ]);
        list.appendChild(li);
      });
      wrap.appendChild(stepLine);
      wrap.appendChild(list);
      if (dpllTrace.assignment) {
        wrap.appendChild(el("p", { class: "sat-dpll-final" }, [
          `최종 만족 할당: `,
          ...dpllTrace.assignment.map((v, i) =>
            el("code", { class: "sat-lit " + (v === "T" ? "sat-true" : "sat-false") },
              [`x${i + 1}=${v}`])
          ),
        ]));
        const applyBtn = el("button", { type: "button", class: "btn btn-outline btn-sm" }, ["이 할당 적용"]);
        applyBtn.addEventListener("click", () => {
          assign = dpllTrace.assignment.slice();
          dpllTrace = null;
          render();
        });
        wrap.appendChild(applyBtn);
      } else {
        wrap.appendChild(el("p", { class: "bad" }, ["이 문제는 UNSAT — 만족할 수 없는 공식입니다."]));
      }
      container.appendChild(wrap);
    }

    function runDPLL(problem) {
      const n = problem.vars;
      const steps = [];
      const trace = { steps, result: null, assignment: null };

      function dpll(assignment, depth) {
        // Unit Propagation
        let changed = true;
        while (changed) {
          changed = false;
          for (let ci = 0; ci < problem.clauses.length; ci++) {
            const c = problem.clauses[ci];
            // Evaluate clause under current assignment
            let unknownLit = null;
            let alreadyTrue = false;
            for (const lit of c) {
              const i = Math.abs(lit) - 1;
              const v = assignment[i];
              if (v === "?") {
                if (unknownLit != null) { unknownLit = "MULTIPLE"; continue; }
                unknownLit = lit;
              } else if ((lit > 0 && v === "T") || (lit < 0 && v === "F")) {
                alreadyTrue = true; break;
              }
            }
            if (alreadyTrue) continue;
            if (unknownLit == null) {
              steps.push({ kind: "conflict", msg: `C${ci + 1}이 모두 거짓 — 충돌. 되돌리기.` });
              return false;
            }
            if (unknownLit !== "MULTIPLE") {
              const i = Math.abs(unknownLit) - 1;
              const val = unknownLit > 0 ? "T" : "F";
              if (assignment[i] === "?") {
                assignment[i] = val;
                steps.push({
                  kind: "unit",
                  msg: `Unit Propagation: C${ci + 1} → x${i + 1} = ${val}`,
                });
                changed = true;
              }
            }
          }
        }
        // All clauses SAT?
        const status = formulaStatus(problem.clauses, assignment);
        if (status.overall === "SAT") {
          steps.push({ kind: "satisfied", msg: `✓ 모든 절 만족! SAT 발견.` });
          trace.result = "SAT";
          trace.assignment = assignment.slice();
          return true;
        }
        if (status.overall === "UNSAT") {
          steps.push({ kind: "conflict", msg: `현재 할당으로 UNSAT. 되돌림.` });
          return false;
        }
        // Branch on first unknown
        const idx = assignment.findIndex((v) => v === "?");
        if (idx < 0) return false;
        for (const val of ["T", "F"]) {
          steps.push({ kind: "branch", msg: `분기: x${idx + 1} = ${val} 시도` });
          const snapshot = assignment.slice();
          assignment[idx] = val;
          if (dpll(assignment, depth + 1)) return true;
          // Restore
          for (let k = 0; k < n; k++) assignment[k] = snapshot[k];
        }
        return false;
      }

      const initial = new Array(n).fill("?");
      const ok = dpll(initial, 0);
      if (!ok) trace.result = "UNSAT";
      return trace;
    }

    mount();
  }

  /* =========================================================
     Public API
     ========================================================= */
  window.Interactive = {
    renderFillBlank,
    renderGraphEditor,
    renderTimerChallenge,
    renderSatSolver,
  };
})();
