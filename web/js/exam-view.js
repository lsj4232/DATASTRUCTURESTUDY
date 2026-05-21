/* =========================================================
   exam-view.js — 변리사 데이터구조론 기출 뷰어
   - window.__EXAM__ 데이터를 사용 (exam-data.js 에서 주입)
   - 라우트:
       #ds           → 회차 목록 + 통계
       #ds-<N>       → 해당 N회차 전체 문제
       #ds-q-<E>-<P>-<S> → 단일 소문제 + 답안/힌트/카테고리
   - 챕터별 역인덱스: ExamView.injectRelatedRefs(rootEl, chapterId)
   ========================================================= */

(function () {
  "use strict";

  const DATA = window.__EXAM__ || null;

  // 챕터 id → 라벨 (사이드바/링크 표기용)
  const CH_LABEL = {
    ch2: "Ch 2 Getting Started",
    ch3: "Ch 3 Growth of Functions",
    ch4: "Ch 4 Divide-and-Conquer",
    ch5: "Ch 5 Probabilistic Analysis",
    ch6: "Ch 6 Heapsort",
    ch7: "Ch 7 Quicksort",
    ch8: "Ch 8 Linear-Time Sorting",
    ch9: "Ch 9 Medians",
    ch11: "Ch 11 Hash Tables",
    ch12: "Ch 12 Binary Search Trees",
    ch13: "Ch 13 Red-Black Trees",
    ch14: "Ch 14 Augmenting DS",
    ch15: "Ch 15 Dynamic Programming",
    ch16: "Ch 16 Greedy",
    ch17: "Ch 17 Amortized Analysis",
    ch18: "Ch 18 B-Trees",
    ch19: "Ch 19 Fibonacci Heaps",
    ch21: "Ch 21 Disjoint Sets",
    ch22: "Ch 22 Elementary Graph",
    ch23: "Ch 23 MST",
    ch24: "Ch 24 Shortest Paths",
    ch25: "Ch 25 All-Pairs Shortest Paths",
    ch26: "Ch 26 Maximum Flow",
    ch30: "Ch 30 Polynomials/FFT",
    ch31: "Ch 31 Number-Theoretic",
    ch32: "Ch 32 String Matching",
    ch33: "Ch 33 Computational Geometry",
    ch34: "Ch 34 NP-Completeness",
    ch35: "Ch 35 Approximation",
    // CLRS 외 주제는 별도 그룹으로 분리
    ch_extra_trie: "트라이/Patricia (CLRS 외)",
    ch_extra_interval_heap: "구간 힙 (CLRS 외)",
    ch_extra_aoe: "AOE 네트워크/임계경로 (CLRS 외)",
    ch_extra_external: "외부 정렬 (CLRS 외)",
    ch_extra_deque: "덱(Deque) (CLRS 외)",
    ch_extra_shell: "셸 정렬 (CLRS 외)",
    ch_extra_interp: "보간 탐색 (CLRS 외)",
    ch_extra_recursion: "재귀 (CLRS 외)",
    ch_extra_linked_list: "연결 리스트 (CLRS 외)",
    ch_extra_sparse: "희소 행렬 (CLRS 외)",
    ch_extra_josephus: "원탁/Josephus (CLRS 외)",
  };

  function esc(s) {
    return (s == null ? "" : String(s))
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nlToBr(s) {
    return esc(s).replace(/\r?\n/g, "<br>");
  }

  // 본문에서 hints[].text를 노란 하이라이트로 감싸기 (한 번만)
  function highlightHints(text, hints) {
    if (!Array.isArray(hints) || hints.length === 0) return nlToBr(text);
    let html = nlToBr(text);
    hints.forEach((h, idx) => {
      if (!h || !h.text) return;
      const needle = esc(h.text).replace(/<br>/g, " ");
      // 토큰을 단순 텍스트로 치환 (정규식 없이 안전하게 first occurrence)
      const safeNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(safeNeedle, "g");
      html = html.replace(re, (m) =>
        `<mark class="ds-hint" data-hint-idx="${idx}" data-reason="${esc(h.reason || "")}">${m}</mark>`
      );
    });
    return html;
  }

  // ---------- 회차 목록 페이지 (#ds) ----------
  function renderOverview() {
    if (!DATA) return "<p>변리사 기출 데이터가 로드되지 않았습니다.</p>";
    const { stats, exams } = DATA;

    const cards = exams.map((e) => {
      const total = e.problems.reduce((a, p) => a + p.subquestions.length, 0);
      const ans = e.problems.reduce(
        (a, p) => a + p.subquestions.filter((s) => s.answered).length,
        0
      );
      const pct = total > 0 ? Math.round((ans / total) * 100) : 0;
      return `
        <a class="ds-exam-card" href="#ds-${e.examNum}">
          <div class="ds-exam-card-head">
            <span class="ds-exam-num">${esc(e.exam)}</span>
            <span class="ds-exam-year">${esc(e.year)}년</span>
          </div>
          <div class="ds-exam-card-body">
            <div class="ds-exam-stats">
              <strong>${e.problems.length}</strong>개 문제 ·
              <strong>${total}</strong>개 소문제
            </div>
            <div class="ds-progress" title="답안 작성률">
              <div class="ds-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="ds-progress-label muted small">${ans}/${total} 답안 (${pct}%)</div>
          </div>
        </a>`;
    }).join("");

    return `
      <div class="chapter-head">
        <span class="eyebrow tier2">변리사 시험 · 데이터구조론</span>
        <h1>기출 문제 (45~62회 · 2008~2025)</h1>
        <p class="lead muted">
          총 <strong>${stats.examCount}회차</strong> · <strong>${stats.totalSubquestions}개</strong> 소문제 ·
          답안 <strong>${stats.answered}개</strong> · 미완 <strong>${stats.missing}개</strong>.
          본문 노란 하이라이트에 마우스를 올리면 출제 포인트가 표시됩니다.
        </p>
      </div>
      <section class="ds-exam-grid">${cards}</section>
    `;
  }

  // ---------- 단일 회차 페이지 (#ds-N) ----------
  function renderExam(examNum) {
    if (!DATA) return "<p>데이터 미로드</p>";
    const exam = DATA.exams.find((e) => e.examNum === examNum);
    if (!exam) return `<p>해당 회차(${examNum}회)를 찾을 수 없습니다.</p>`;

    const problemsHtml = exam.problems.map((p) => {
      const subqs = p.subquestions.map((sq) => {
        const chLabel = CH_LABEL[sq.chapter] || sq.chapter;
        const isExtra = sq.chapter.startsWith("ch_extra_");
        const chLink = isExtra
          ? `<span class="ds-chip ds-chip-extra">${esc(chLabel)}</span>`
          : `<a class="ds-chip" href="#${sq.chapter}">${esc(chLabel)}</a>`;
        return `
          <li class="ds-subq ${sq.answered ? "answered" : "pending"}">
            <div class="ds-subq-head">
              <span class="ds-subq-no">(${sq.no})</span>
              <span class="ds-subq-pts">${sq.points}점</span>
              ${chLink}
              <a class="ds-subq-detail" href="#ds-q-${exam.examNum}-${p.problemNo}-${sq.no}">
                상세 ↗
              </a>
            </div>
            <div class="ds-subq-q">${highlightHints(sq.question, sq.hints)}</div>
          </li>`;
      }).join("");

      return `
        <article class="ds-problem">
          <header class="ds-problem-head">
            <h2>문제 ${p.problemNo} <span class="muted small">(${p.points}점)</span></h2>
          </header>
          ${p.passage ? `<div class="ds-passage">${nlToBr(p.passage)}</div>` : ""}
          <ol class="ds-subqs">${subqs}</ol>
        </article>`;
    }).join("");

    return `
      <div class="chapter-head">
        <span class="eyebrow tier2">변리사 기출 · ${esc(exam.exam)}</span>
        <h1>${esc(exam.exam)} 데이터구조론 (${esc(exam.year)})</h1>
        <p class="lead muted">
          ${exam.problems.length}개 문제 ·
          각 소문제의 칩(chip)을 누르면 관련 CLRS 챕터로 이동합니다.
        </p>
      </div>
      ${problemsHtml}
    `;
  }

  // ---------- 단일 소문제 상세 (#ds-q-E-P-S) ----------
  function renderSubq(examNum, problemNo, sqNo) {
    if (!DATA) return "<p>데이터 미로드</p>";
    const exam = DATA.exams.find((e) => e.examNum === examNum);
    if (!exam) return "<p>회차 없음</p>";
    const prob = exam.problems.find((p) => p.problemNo === problemNo);
    if (!prob) return "<p>문제 없음</p>";
    const sq = prob.subquestions.find((s) => s.no === sqNo);
    if (!sq) return "<p>소문제 없음</p>";

    const cat = sq.category;
    const catHtml = cat ? `
      <section class="ds-category-card">
        <h3>학습 카테고리</h3>
        <dl class="ds-cat-dl">
          ${cat.toc ? `<dt>답안 목차</dt><dd>${nlToBr(cat.toc)}</dd>` : ""}
          ${cat.article ? `<dt>관련 단원</dt><dd>${esc(cat.article)}</dd>` : ""}
          ${cat.purpose ? `<dt>의의·취지</dt><dd>${nlToBr(cat.purpose)}</dd>` : ""}
          ${cat.elements ? `<dt>판단 요소</dt><dd>${nlToBr(cat.elements)}</dd>` : ""}
          ${cat.theory ? `<dt>이론·복잡도</dt><dd>${nlToBr(cat.theory)}</dd>` : ""}
          ${cat.cases ? `<dt>응용 사례</dt><dd>${nlToBr(cat.cases)}</dd>` : ""}
          ${cat.resolution ? `<dt>풀이 전략</dt><dd>${nlToBr(cat.resolution)}</dd>` : ""}
        </dl>
      </section>` : "";

    const hintsHtml = (sq.hints && sq.hints.length) ? `
      <section class="ds-hints-card">
        <h3>출제 포인트 힌트</h3>
        <ol>
          ${sq.hints.map((h) => `
            <li>
              <strong>"${esc(h.text)}"</strong>
              <span class="muted">— ${esc(h.reason)}</span>
            </li>`).join("")}
        </ol>
      </section>` : "";

    const answerHtml = sq.answered ? `
      <section class="ds-answer-card">
        <h3>모범 답안 <span class="ds-claude-tag">Claude 생성</span></h3>
        <div class="ds-answer-body">${nlToBr(sq.answer)}</div>
      </section>` : `
      <section class="ds-answer-card pending">
        <h3>답안 준비 중</h3>
        <p class="muted">이 소문제의 답안은 아직 작성 중입니다.</p>
      </section>`;

    const chLabel = CH_LABEL[sq.chapter] || sq.chapter;
    const isExtra = sq.chapter.startsWith("ch_extra_");

    return `
      <div class="chapter-head">
        <span class="eyebrow tier2">${esc(exam.exam)} · 문제 ${prob.problemNo} · (${sq.no})</span>
        <h1>${esc(exam.exam)} 데이터구조론 · 문제 ${prob.problemNo}-(${sq.no})
          <span class="muted small">${sq.points}점</span></h1>
        <p class="lead muted">
          ${isExtra
            ? `<span class="ds-chip ds-chip-extra">${esc(chLabel)}</span>`
            : `관련 챕터 → <a href="#${sq.chapter}">${esc(chLabel)}</a>`}
          · <a href="#ds-${exam.examNum}">← ${esc(exam.exam)} 전체 문제 목록</a>
        </p>
      </div>
      ${prob.passage ? `
        <section class="ds-passage-card">
          <h3>지문 (문제 ${prob.problemNo})</h3>
          <div class="ds-passage">${nlToBr(prob.passage)}</div>
        </section>` : ""}
      <section class="ds-question-card">
        <h3>소문제 (${sq.no}) <span class="muted small">${sq.points}점</span></h3>
        <div class="ds-question-body">${highlightHints(sq.question, sq.hints)}</div>
      </section>
      ${hintsHtml}
      ${catHtml}
      ${answerHtml}
    `;
  }

  // ---------- 챕터 내부에 "관련 변리사 기출" 섹션 주입 ----------
  function injectRelatedRefs(rootEl, chapterId) {
    if (!DATA || !rootEl) return;
    const refs = (DATA.byChapter && DATA.byChapter[chapterId]) || [];
    if (refs.length === 0) return;
    const section = document.createElement("section");
    section.className = "ds-related";
    section.innerHTML = `
      <h2>📚 변리사 기출 (이 챕터 관련) <span class="ds-related-count">${refs.length}</span></h2>
      <ul class="ds-related-list">
        ${refs.map((r) => `
          <li>
            <a href="#ds-q-${r.exam.replace("회", "")}-${r.problemNo}-${r.sqNo}">
              <span class="ds-ref-exam">${esc(r.exam)}</span>
              <span class="ds-ref-loc">문제 ${r.problemNo}-(${r.sqNo})</span>
              <span class="ds-ref-snip">${esc(r.snippet)}…</span>
              ${r.answered ? '<span class="ds-ref-badge ok">답안</span>' : '<span class="ds-ref-badge pending">미완</span>'}
            </a>
          </li>`).join("")}
      </ul>
    `;
    rootEl.appendChild(section);
  }

  // ---------- 메인 라우터 진입 ----------
  function render(hash) {
    // hash 형태: "ds", "ds-62", "ds-q-62-1-2"
    const m1 = hash.match(/^ds-q-(\d+)-(\d+)-(\d+)$/);
    if (m1) return renderSubq(+m1[1], +m1[2], +m1[3]);
    const m2 = hash.match(/^ds-(\d+)$/);
    if (m2) return renderExam(+m2[1]);
    if (hash === "ds") return renderOverview();
    return null;
  }

  // ---------- 힌트 툴팁 (mark hover) ----------
  function bindHintTooltips(root) {
    if (!root) return;
    root.querySelectorAll("mark.ds-hint").forEach((m) => {
      m.addEventListener("mouseenter", (e) => {
        const tip = document.getElementById("tip");
        if (!tip) return;
        tip.textContent = m.dataset.reason || "";
        tip.hidden = false;
        const r = m.getBoundingClientRect();
        tip.style.left = (r.left + window.scrollX) + "px";
        tip.style.top = (r.bottom + window.scrollY + 6) + "px";
      });
      m.addEventListener("mouseleave", () => {
        const tip = document.getElementById("tip");
        if (tip) tip.hidden = true;
      });
    });
  }

  window.ExamView = {
    DATA,
    render,
    renderOverview,
    renderExam,
    renderSubq,
    injectRelatedRefs,
    bindHintTooltips,
    CH_LABEL,
  };
})();
