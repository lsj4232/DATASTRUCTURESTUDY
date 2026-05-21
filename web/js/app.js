/* =========================================================
   app.js — 라우팅, 사이드바, 본문 렌더링, 시각화 트리거
   + 커맨드 팔레트(⌘K), 도움말(?) 오버레이,
   + 챕터 진행률 (Zeigarnik), 이전/다음 푸터 (Linear UX),
   + 툴팁 (Recognition), 스켈레톤 로더 (Doherty)

   UX 매핑:
   · Hick / Recognition → 사이드바 검색 + ⌘K 팔레트
   · Nielsen #10        → ? 도움말 오버레이
   · Zeigarnik          → 챕터 방문 추적 + 이어서 보기
   · Peak-end           → 시각화 마지막 단계 셀러브레이션 (viz-core.js)
   · Linear UX          → 챕터 푸터에 다음 행동만 노출
   · Doherty            → 즉각 라우팅, 스켈레톤 placeholder
   · Match real world   → 한국어 라벨 + 친숙한 카피
   ========================================================= */

(function () {
  "use strict";

  const { CHAPTERS, NAV_GROUPS } = window.__CLRS__;
  const STORAGE_KEY = "clrs:visited";
  const TOTAL_CHAPTERS = CHAPTERS.filter((c) => c.tier === 1).length;

  // marked.js 옵션
  if (window.marked) {
    marked.use({ gfm: true, breaks: false });
  }

  /* ---------- KaTeX 수식 렌더링 ----------
     $...$ 혹은 \(...\)로 감싼 수식을 자동 렌더.
     콘텐츠가 DOM에 마운트된 뒤 renderMath(el)을 호출.
     실패 시 조용히 원문 유지 (throwOnError: false). */
  function renderMath(root) {
    if (!root || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
        errorColor: "var(--err)",
        // 코드/pre/드릴 입력 내부 수식은 렌더하지 않음
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        ignoredClasses: ["sortable-item", "sat-formula", "fill-input"],
      });
    } catch (err) {
      console.warn("KaTeX render failed:", err);
    }
  }
  // 외부 모듈(Drills, Interactive)에서도 쓸 수 있도록 노출
  window.renderMath = renderMath;

  /* ---------- Visited tracking (Zeigarnik) ---------- */
  function loadVisited() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  }
  function saveVisited(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...s])); } catch {}
  }
  let visited = loadVisited();

  /* ---------- Bookmarks ---------- */
  const BOOKMARK_KEY = "clrs:bookmarks:v1";
  function loadBookmarks() {
    try { return new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]")); }
    catch { return new Set(); }
  }
  function saveBookmarks(s) {
    try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...s])); } catch {}
  }
  let bookmarks = loadBookmarks();
  function toggleBookmark(id) {
    if (bookmarks.has(id)) bookmarks.delete(id);
    else bookmarks.add(id);
    saveBookmarks(bookmarks);
    refreshVisitedStates();
  }

  /* ---------- Memos ---------- */
  const MEMO_KEY = "clrs:memos:v1";
  function loadMemos() {
    try { return JSON.parse(localStorage.getItem(MEMO_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveMemos(m) {
    try { localStorage.setItem(MEMO_KEY, JSON.stringify(m)); } catch {}
  }
  let memos = loadMemos();

  /* ---------- Side Memo Panel toggle ---------- */
  function openMemoSide(open) {
    const wrap = document.getElementById("memo-side");
    const panel = document.getElementById("memo-side-panel");
    const handle = document.getElementById("memo-side-handle");
    if (!wrap || wrap.hidden) return;
    const willOpen = open == null ? !wrap.classList.contains("open") : !!open;
    wrap.classList.toggle("open", willOpen);
    if (panel) panel.setAttribute("aria-hidden", willOpen ? "false" : "true");
    if (handle) {
      handle.setAttribute("aria-label", willOpen ? "메모 닫기" : "메모 열기");
      const txt = handle.querySelector(".memo-side-handle-text");
      if (txt) txt.textContent = willOpen ? "닫기" : "메모";
    }
    if (willOpen) {
      const input = document.getElementById("memo-side-input");
      if (input) setTimeout(() => input.focus(), 220);
    }
  }
  // Wire handle + close (script already runs after DOM is parsed since it's at body end)
  (function wireMemoSide() {
    const handle = document.getElementById("memo-side-handle");
    const closeBtn = document.getElementById("memo-side-close");
    if (handle) handle.addEventListener("click", () => openMemoSide());
    if (closeBtn) closeBtn.addEventListener("click", () => openMemoSide(false));
  })();
  document.addEventListener("keydown", (e) => {
    if (e.target && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) {
      // allow Esc to close even from inside the memo
      if (e.key === "Escape" && document.getElementById("memo-side")?.classList.contains("open")) {
        openMemoSide(false);
      }
      return;
    }
    if (e.key === "m" || e.key === "M") {
      const wrap = document.getElementById("memo-side");
      if (wrap && !wrap.hidden) { e.preventDefault(); openMemoSide(); }
    } else if (e.key === "Escape") {
      const wrap = document.getElementById("memo-side");
      if (wrap && wrap.classList.contains("open")) { openMemoSide(false); }
    }
  });

  /* ---------- 시각화 플레이어 ---------- */
  const player = new VizCore.Player({
    overlay: document.getElementById("viz-overlay"),
    panel: document.querySelector(".viz-panel"),
    stage: document.getElementById("viz-stage"),
    step: document.getElementById("viz-step"),
    message: document.getElementById("viz-message"),
    pseudo: document.getElementById("viz-pseudo"),
    legend: document.getElementById("viz-legend"),
    progress: document.getElementById("viz-progress-bar"),
    prev: document.getElementById("viz-prev"),
    next: document.getElementById("viz-next"),
    play: document.getElementById("viz-play"),
    close: document.getElementById("viz-close"),
    title: document.getElementById("viz-title"),
    eyebrow: document.getElementById("viz-eyebrow"),
  });

  /* ---------- 사이드바 (Hick: Tier 그룹화) ---------- */
  function renderNav() {
    const root = document.getElementById("nav-root");
    root.innerHTML = "";
    NAV_GROUPS.forEach((group) => {
      const wrap = document.createElement("div");
      wrap.className = "nav-group";

      const title = document.createElement("h3");
      title.className = "nav-group-title" + (group.tier === 2 ? " tier2" : group.tier === 3 ? " tier3" : "");
      title.innerHTML = `<span class="dot"></span>${group.label}`;
      wrap.appendChild(title);

      group.chapters.forEach((id) => {
        const ch = CHAPTERS.find((c) => c.id === id);
        if (!ch) return;
        const link = document.createElement("a");
        link.className = "nav-link";
        link.href = `#${id}`;
        link.dataset.chapter = id;
        link.innerHTML =
          `<span class="num">${ch.num}</span>` +
          `<span class="title">${VizCore.escapeHtml(ch.title)}</span>` +
          `<span class="drill-progress" hidden></span>` +
          `<button type="button" class="bookmark-btn" data-bookmark="${id}" aria-label="즐겨찾기 토글" data-tooltip="즐겨찾기">☆</button>` +
          `<span class="check" aria-hidden="true">✓</span>`;
        wrap.appendChild(link);
      });

      root.appendChild(wrap);
    });

    // 변리사 기출 그룹 (Exam Browser) — 도구 위에 표시
    if (window.__EXAM__) {
      const exams = window.__EXAM__.exams || [];
      const examWrap = document.createElement("div");
      examWrap.className = "nav-group nav-group-exam";
      const examLinks = exams.map((e) => `
        <a class="nav-link tool-link" href="#ds-${e.examNum}" data-chapter="ds-${e.examNum}">
          <span class="num">${e.examNum}</span>
          <span class="title">${e.exam} (${e.year})</span>
          <span class="check" aria-hidden="true">✓</span>
        </a>`).join("");
      examWrap.innerHTML = `
        <h3 class="nav-group-title tier2"><span class="dot"></span>📚 변리사 기출 (데이터구조론)</h3>
        <a class="nav-link tool-link" href="#ds" data-chapter="ds">
          <span class="num">⌘</span>
          <span class="title">전체 회차 보기</span>
          <span class="check" aria-hidden="true">✓</span>
        </a>
        ${examLinks}
      `;
      root.appendChild(examWrap);
    }

    // Tools group — Weakness dashboard, Random review, Theme, Export/Import
    const toolsWrap = document.createElement("div");
    toolsWrap.className = "nav-group nav-group-tools";
    toolsWrap.innerHTML = `
      <h3 class="nav-group-title tier3"><span class="dot"></span>🛠️ 도구</h3>
      <a class="nav-link tool-link" href="#weakness" data-chapter="weakness">
        <span class="num">⚠</span>
        <span class="title">약점 대시보드</span>
        <span class="drill-progress" data-role="weak-count" hidden></span>
        <span class="check" aria-hidden="true">✓</span>
      </a>
      <a class="nav-link tool-link" href="#review" data-chapter="review">
        <span class="num">🎲</span>
        <span class="title">랜덤 복습 (10문항)</span>
        <span class="check" aria-hidden="true">✓</span>
      </a>
      <a class="nav-link tool-link" href="#fillblank" data-chapter="fillblank">
        <span class="num">✍</span>
        <span class="title">빈칸 채우기 증명</span>
        <span class="check" aria-hidden="true">✓</span>
      </a>
      <a class="nav-link tool-link" href="#graph" data-chapter="graph">
        <span class="num">◎</span>
        <span class="title">그래프 에디터</span>
        <span class="check" aria-hidden="true">✓</span>
      </a>
      <a class="nav-link tool-link" href="#timer" data-chapter="timer">
        <span class="num">⏱</span>
        <span class="title">타이머 챌린지</span>
        <span class="check" aria-hidden="true">✓</span>
      </a>
      <a class="nav-link tool-link" href="#sat" data-chapter="sat">
        <span class="num">∧</span>
        <span class="title">SAT 솔버 실습</span>
        <span class="check" aria-hidden="true">✓</span>
      </a>
      <div class="nav-tools-row">
        <button type="button" class="tool-btn" id="tool-theme" data-tooltip="라이트/다크 전환" aria-label="테마 전환">
          <span class="tool-btn-icon" aria-hidden="true">◐</span>
          <span class="tool-btn-label">테마</span>
        </button>
        <button type="button" class="tool-btn" id="tool-export" data-tooltip="진행도 JSON 다운로드" aria-label="진행도 내보내기">
          <span class="tool-btn-icon" aria-hidden="true">⤓</span>
          <span class="tool-btn-label">내보내기</span>
        </button>
        <button type="button" class="tool-btn" id="tool-import" data-tooltip="진행도 JSON 가져오기" aria-label="진행도 가져오기">
          <span class="tool-btn-icon" aria-hidden="true">⤒</span>
          <span class="tool-btn-label">가져오기</span>
        </button>
        <input type="file" id="tool-import-file" accept=".json,application/json" hidden>
      </div>
    `;
    root.appendChild(toolsWrap);

    // Bookmark button click handler (delegated, prevents nav-link href follow)
    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".bookmark-btn");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      toggleBookmark(btn.dataset.bookmark);
    });

    refreshVisitedStates();
  }

  function refreshVisitedStates() {
    document.querySelectorAll(".nav-link").forEach((el) => {
      const id = el.dataset.chapter;
      el.classList.toggle("visited", visited.has(id));
      el.classList.toggle("bookmarked", bookmarks.has(id));
      const bm = el.querySelector(".bookmark-btn");
      if (bm) bm.textContent = bookmarks.has(id) ? "★" : "☆";

      // Drill progress badge (drills + OX 합산)
      const badge = el.querySelector(".drill-progress");
      if (badge && window.Drills) {
        const ch = CHAPTERS.find((c) => c.id === id);
        if (ch) {
          let completed = 0, total = 0;
          if ((ch.algorithms || []).some((a) => a.drills)) {
            const cp = Drills.getChapterProgress(ch.id, ch.algorithms);
            completed += cp.completed; total += cp.total;
          }
          if (Array.isArray(ch.ox) && ch.ox.length > 0) {
            const op = Drills.getOxProgress(ch.id, ch.ox);
            if (op && op.done === op.total) completed += 1;
            if (op) total += 1;
          }
          if (total > 0) {
            badge.hidden = false;
            badge.textContent = `${completed}/${total}`;
            badge.classList.toggle("complete", completed === total);
            badge.classList.toggle("partial", completed > 0 && completed < total);
          } else {
            badge.hidden = true;
          }
        } else {
          badge.hidden = true;
        }
      }
    });

    const tier1Visited = [...visited].filter((id) => {
      const c = CHAPTERS.find((x) => x.id === id);
      return c && c.tier === 1;
    }).length;
    const text = document.getElementById("progress-text");
    const fill = document.getElementById("progress-fill");
    if (text) text.textContent = `${tier1Visited} / ${TOTAL_CHAPTERS}`;
    if (fill) fill.style.width = `${(tier1Visited / TOTAL_CHAPTERS) * 100}%`;

    // Aggregate drill progress across all chapters (drills + OX)
    if (window.Drills) {
      let dCompleted = 0, dTotal = 0;
      CHAPTERS.forEach((c) => {
        const p = Drills.getChapterProgress(c.id, c.algorithms);
        dCompleted += p.completed;
        dTotal += p.total;
        if (Array.isArray(c.ox) && c.ox.length > 0) {
          const op = Drills.getOxProgress(c.id, c.ox);
          if (op && op.done === op.total) dCompleted += 1;
          if (op) dTotal += 1;
        }
      });
      const dText = document.getElementById("drill-progress-text");
      const dFill = document.getElementById("drill-progress-fill");
      if (dText) dText.textContent = `${dCompleted} / ${dTotal}`;
      if (dFill) dFill.style.width = dTotal > 0 ? `${(dCompleted / dTotal) * 100}%` : "0%";

      // 약점 뱃지: 오답 수
      const weakBadge = document.querySelector('[data-role="weak-count"]');
      if (weakBadge) {
        const wrong = Drills.getWrongQuestions(CHAPTERS).length;
        if (wrong > 0) {
          weakBadge.hidden = false;
          weakBadge.textContent = String(wrong);
          weakBadge.classList.add("partial");
          weakBadge.classList.remove("complete");
        } else {
          weakBadge.hidden = true;
        }
      }
    }

    // Update home resume CTA
    // Priority: (1) 미완 드릴이 있는 첫 챕터 → (2) 마지막 방문 챕터 → (3) 처음부터 시작
    const cta = document.getElementById("cta-resume");
    const ctaLabel = document.getElementById("cta-resume-label");
    if (cta && ctaLabel) {
      let resumeTarget = null;
      let resumeLabel = null;

      // (1) 챕터 진행 순서대로 첫 미완 드릴 찾기
      if (window.Drills) {
        for (const c of CHAPTERS) {
          const { completed, total } = Drills.getChapterProgress(c.id, c.algorithms);
          if (total > 0 && completed < total) {
            resumeTarget = c.id;
            const remaining = total - completed;
            if (completed === 0) {
              resumeLabel = `드릴 시작 — ${c.num} ${c.title}`;
            } else {
              resumeLabel = `미완 드릴 이어서 — ${c.num} ${c.title}  (${completed}/${total})`;
            }
            break;
          }
        }
      }

      // (2) 드릴을 모두 마쳤거나 드릴 자체가 없으면: 마지막 방문 챕터
      if (!resumeTarget) {
        const lastId = [...visited].pop();
        const last = CHAPTERS.find((c) => c.id === lastId);
        if (last) {
          resumeTarget = lastId;
          resumeLabel = `이어서 보기 — ${last.num} ${last.title}`;
        }
      }

      // (3) 기본값
      if (!resumeTarget) {
        resumeTarget = "ch2";
        resumeLabel = "처음부터 시작";
      }

      ctaLabel.textContent = resumeLabel;
      cta.dataset.goto = resumeTarget;
    }
  }

  // Live-refresh sidebar when any drill state changes in this session
  window.addEventListener("drill:progress-change", () => {
    refreshVisitedStates();
  });
  // Also refresh when localStorage changes in another tab
  window.addEventListener("storage", (e) => {
    if (e.key === "clrs:drills:v1") refreshVisitedStates();
  });

  /* ---------- Chapter ordering (for prev/next nav) ---------- */
  const orderedIds = [];
  NAV_GROUPS.forEach((g) => g.chapters.forEach((id) => orderedIds.push(id)));

  /* ---------- Inline viz injection
     - Scan rendered chapter <pre><code> blocks
     - If first code line matches a registered viz's first pseudocode line,
       replace the <pre> with a side-by-side interactive widget.
     - Match priority: chapter's own algorithm vizes first, then global.
  */
  let _pseudoIndex = null;
  function getPseudoIndex() {
    if (!_pseudoIndex) _pseudoIndex = VizCore.buildPseudoIndex();
    return _pseudoIndex;
  }
  function injectInlineViz(rootEl, ch) {
    const globalIdx = getPseudoIndex();
    // Build chapter-local first-line → vizKey from this chapter's algorithms
    // (so a duplicated routine name resolves to the correct chapter viz)
    const localIdx = {};
    (ch.algorithms || []).forEach((a) => {
      const factory = VizCore.get(a.viz);
      if (!factory) return;
      try {
        const viz = factory();
        const lines = viz.pseudocode || [];
        if (!lines.length) return;
        const first = (Array.isArray(lines[0]) ? lines[0][0] : lines[0]).trim();
        if (first) localIdx[first] = a.viz;
      } catch {}
    });
    rootEl.querySelectorAll("pre > code").forEach((code) => {
      const text = code.textContent || "";
      const firstLine = (text.split("\n")[0] || "").trim();
      if (!firstLine) return;
      const vizKey = localIdx[firstLine] || globalIdx[firstLine];
      if (!vizKey) return;
      const pre = code.parentElement;
      if (!pre || pre.dataset.inlineVizApplied) return;
      pre.dataset.inlineVizApplied = "1";
      const wrap = document.createElement("div");
      wrap.className = "inline-viz-mount";
      pre.replaceWith(wrap);
      try {
        new VizCore.InlinePlayer(wrap, vizKey);
      } catch (err) {
        console.error("InlinePlayer failed for", vizKey, err);
        wrap.innerHTML = `<p class="muted small" style="padding:8px">시각화 로드 실패: ${err.message}</p>`;
      }
    });
  }

  /* ---------- 본문 렌더링 ---------- */
  function renderChapter(id) {
    const content = document.getElementById("content");
    const home = document.getElementById("empty-home");
    const ch = CHAPTERS.find((c) => c.id === id);

    if (!ch) {
      content.innerHTML = "";
      home.hidden = false;
      setBreadcrumb([]);
      setActiveLink(null);
      return;
    }
    home.hidden = true;

    // (Doherty: 렌더링은 즉시 — 1~5ms 안에 끝나므로 스켈레톤 깜빡임은 오히려 노이즈)
    {
      const tierClass = ch.tier === 2 ? "tier2" : ch.tier === 3 ? "tier3" : "";
      const tierLabel = ch.tier === 1 ? "Tier 1 · 최핵심" : ch.tier === 2 ? "종합 정리" : "보조";

      const md = window.marked ? marked.parse(ch.md || "") : "<pre>" + VizCore.escapeHtml(ch.md || "") + "</pre>";

      const algoCards = (ch.algorithms || []).map((a) => `
        <div class="algo-card">
          <div class="algo-meta">
            <h4>${VizCore.escapeHtml(a.name)}</h4>
            <p>${VizCore.escapeHtml(a.desc)}</p>
            <div class="algo-tags">
              ${(a.tags || []).map((t) => `<span class="tag">${VizCore.escapeHtml(t)}</span>`).join("")}
            </div>
          </div>
          <button type="button" class="btn btn-primary"
                  data-viz="${VizCore.escapeHtml(a.viz)}"
                  data-name="${VizCore.escapeHtml(a.name)}"
                  data-eyebrow="${VizCore.escapeHtml(ch.num + " · " + ch.title)}"
                  data-tooltip="단계별 시각화 열기">
            ▶ 시각화
          </button>
        </div>
      `).join("");

      // Prev/Next chapter footer (Linear UX)
      const idx = orderedIds.indexOf(id);
      const prevId = idx > 0 ? orderedIds[idx - 1] : null;
      const nextId = idx >= 0 && idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null;
      const prevCh = prevId ? CHAPTERS.find((c) => c.id === prevId) : null;
      const nextCh = nextId ? CHAPTERS.find((c) => c.id === nextId) : null;
      const footHtml = `
        <nav class="chapter-foot" aria-label="챕터 이동">
          ${prevCh ? `
            <a href="#${prevCh.id}" class="prev">
              <span class="dir">← 이전</span>
              <span class="ti">${VizCore.escapeHtml(prevCh.num)} · ${VizCore.escapeHtml(prevCh.title)}</span>
            </a>` : `<span></span>`}
          ${nextCh ? `
            <a href="#${nextCh.id}" class="next">
              <span class="dir">다음 →</span>
              <span class="ti">${VizCore.escapeHtml(nextCh.num)} · ${VizCore.escapeHtml(nextCh.title)}</span>
            </a>` : `<span></span>`}
        </nav>`;

      const objectivesHtml = (Array.isArray(ch.objectives) && ch.objectives.length)
        ? `<section class="chapter-objectives" aria-label="학습 목표">
             <div class="obj-label">학습 목표</div>
             <ol class="obj-list">${ch.objectives.map((o) => `<li>${o}</li>`).join("")}</ol>
           </section>`
        : "";
      content.innerHTML = `
        <div class="chapter-head">
          <span class="eyebrow ${tierClass}">${VizCore.escapeHtml(tierLabel)} · ${VizCore.escapeHtml(ch.num)}</span>
          <h1>${VizCore.escapeHtml(ch.title)}</h1>
          <p class="lead muted">${VizCore.escapeHtml(ch.subtitle || "")}</p>
          ${ch.summary ? `<blockquote><p>${VizCore.escapeHtml(ch.summary)}</p></blockquote>` : ""}
          ${objectivesHtml}
        </div>
        ${md}
        ${algoCards ? `<h2>이 챕터의 시각화</h2>${algoCards}` : ""}
      `;

      // Inline viz: replace pseudocode <pre> blocks with side-by-side interactive widgets
      injectInlineViz(content, ch);

      // Mount 3-Pillar drills for algorithms that have them (Tier 1 pilot)
      if (window.Drills) {
        (ch.algorithms || []).forEach((a) => {
          if (a.drills) {
            Drills.mountForAlgorithm(content, a, { id: ch.id, num: ch.num, title: ch.title });
          }
        });
        // Mount OX quiz if this chapter has one
        if (Array.isArray(ch.ox) && ch.ox.length > 0) {
          Drills.mountOxQuiz(content, ch);
        }
        // Mount CLRS exercises if present
        if (Array.isArray(ch.exercises) && ch.exercises.length > 0) {
          Drills.mountExercises(content, ch);
        }
        // Mount CLRS Problems (종합 문제) if present
        if (Array.isArray(ch.problems) && ch.problems.length > 0) {
          Drills.mountProblems(content, ch);
        }
      }

      // Mount Memo widget — both bottom (chapter-memo) and side panel share the same memos[id]
      const memoWrap = document.createElement("div");
      memoWrap.className = "chapter-memo";
      memoWrap.innerHTML = `
        <div class="memo-header">
          <h3 class="memo-title">내 메모</h3>
          <span class="memo-status" id="memo-status" aria-live="polite"></span>
          <button type="button" class="btn btn-ghost btn-sm" id="memo-open-side"
                  data-tooltip="옆쪽 패널로 열기 (M)">↗ 사이드 패널</button>
        </div>
        <div class="memo-input" contenteditable="true" data-placeholder="이 챕터에 대한 메모를 자유롭게 작성하세요..."></div>
      `;
      const memoDiv = memoWrap.querySelector(".memo-input");
      if (memos[id]) memoDiv.innerHTML = memos[id];

      // Side panel sync
      const sidePanel = document.getElementById("memo-side-panel");
      const sideInput = document.getElementById("memo-side-input");
      const sideStatus = document.getElementById("memo-side-status");
      const sideEyebrow = document.getElementById("memo-side-eyebrow");
      const sideTitle = document.getElementById("memo-side-title");
      const memoSide = document.getElementById("memo-side");
      if (memoSide) memoSide.hidden = false;
      if (sideEyebrow) sideEyebrow.textContent = `${ch.num} · ${ch.title}`;
      if (sideTitle) sideTitle.textContent = "이 챕터의 메모";
      if (sideInput) sideInput.innerHTML = memos[id] || "";

      let memoTimeout = null;
      let suppressSync = false;
      function setStatusBoth(text, withSavingClass) {
        const status = memoWrap.querySelector("#memo-status");
        if (status) {
          status.textContent = text;
          status.classList.toggle("saving", !!withSavingClass);
        }
        if (sideStatus) {
          sideStatus.textContent = text;
          sideStatus.classList.toggle("saving", !!withSavingClass);
        }
      }
      function saveMemoFrom(sourceEl) {
        const val = sourceEl.innerHTML;
        // Mirror to the other editor without retriggering input
        suppressSync = true;
        if (sourceEl !== memoDiv) memoDiv.innerHTML = val;
        if (sideInput && sourceEl !== sideInput) sideInput.innerHTML = val;
        suppressSync = false;

        setStatusBoth("저장 중...", true);
        if (memoTimeout) clearTimeout(memoTimeout);
        memoTimeout = setTimeout(() => {
          const isEmpty = sourceEl.textContent.trim() === "" && sourceEl.querySelectorAll("img").length === 0;
          if (isEmpty) delete memos[id];
          else memos[id] = val;
          saveMemos(memos);
          setStatusBoth("✓ 자동 저장됨", false);
          setTimeout(() => {
            const cur = memoWrap.querySelector("#memo-status");
            if (cur && !cur.classList.contains("saving")) cur.textContent = "";
            if (sideStatus && !sideStatus.classList.contains("saving")) sideStatus.textContent = "";
          }, 2500);
        }, 500);
      }
      memoDiv.addEventListener("input", () => { if (!suppressSync) saveMemoFrom(memoDiv); });
      if (sideInput) sideInput.addEventListener("input", () => { if (!suppressSync) saveMemoFrom(sideInput); });

      // Image-paste handler shared by both editors
      function handlePaste(targetEl) {
        return (e) => {
          const items = (e.clipboardData || e.originalEvent.clipboardData).items;
          for (let index in items) {
            const item = items[index];
            if (item.kind === "file" && item.type.startsWith("image/")) {
              e.preventDefault();
              const blob = item.getAsFile();
              const reader = new FileReader();
              reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement("canvas");
                  let width = img.width;
                  let height = img.height;
                  const MAX_WIDTH = 800;
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                  targetEl.focus();
                  document.execCommand("insertImage", false, dataUrl);
                  saveMemoFrom(targetEl);
                };
                img.src = event.target.result;
              };
              reader.readAsDataURL(blob);
            }
          }
        };
      }
      memoDiv.addEventListener("paste", handlePaste(memoDiv));
      if (sideInput) sideInput.addEventListener("paste", handlePaste(sideInput));

      // Side panel open button (in bottom widget)
      const openSideBtn = memoWrap.querySelector("#memo-open-side");
      if (openSideBtn) openSideBtn.addEventListener("click", () => openMemoSide(true));

      content.appendChild(memoWrap);

      // Related 변리사 기출 (이 챕터 매핑된 소문제 링크 카드)
      if (window.ExamView) ExamView.injectRelatedRefs(content, id);

      // Mount AI ask widget BEFORE the chapter footer (Linear UX: progression at the end)
      if (window.AskAI) AskAI.mountChapter(content, id);

      // Append chapter footer last
      const footWrap = document.createElement("div");
      footWrap.innerHTML = footHtml;
      content.appendChild(footWrap.firstElementChild);

      // 시각화 버튼
      content.querySelectorAll("button[data-viz]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.viz;
          const name = btn.dataset.name;
          const eyebrow = btn.dataset.eyebrow;
          try {
            player.open(key, name, eyebrow);
          } catch (err) {
            console.error(err);
            showToast(`시각화를 여는 중 오류가 발생했습니다: ${err.message}`);
          }
        });
      });

      // 방문 기록 + 진행률
      visited.add(id);
      saveVisited(visited);
      refreshVisitedStates();

      setBreadcrumb([
        { label: "홈", href: "#" },
        { label: tierLabel },
        { label: `${ch.num} · ${ch.title}` },
      ]);
      setActiveLink(id);
      document.getElementById("main").scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "instant" });

      // KaTeX: 본문/드릴/OX/Exercises/Problems 전부 렌더링
      renderMath(content);
    }
  }

  function setBreadcrumb(items) {
    const bc = document.getElementById("breadcrumb");
    bc.innerHTML = items.map((it, i) => {
      const html = it.href
        ? `<a href="${it.href}">${VizCore.escapeHtml(it.label)}</a>`
        : `<span>${VizCore.escapeHtml(it.label)}</span>`;
      return i === 0 ? html : `<span class="sep">›</span>${html}`;
    }).join("");
  }

  function setActiveLink(id) {
    document.querySelectorAll(".nav-link").forEach((el) => {
      el.classList.toggle("active", el.dataset.chapter === id);
    });
  }

  /* ---------- Toast (System status, Nielsen #1) ---------- */
  let toastTimer = null;
  function showToast(message, ms = 2500) {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }

  /* ---------- 인터랙티브 도구 래퍼 (빈칸/그래프/타이머/SAT) ---------- */
  function renderInteractiveTool(id, label, getRenderer) {
    const content = document.getElementById("content");
    const home = document.getElementById("empty-home");
    home.hidden = true;
    content.innerHTML = "";
    const renderer = getRenderer();
    if (typeof renderer === "function") {
      try { renderer(content); }
      catch (err) {
        console.error(err);
        content.innerHTML = `<p class="muted">도구 로드 실패: ${VizCore.escapeHtml(err.message)}</p>`;
      }
    } else {
      content.innerHTML = `<p class="muted">인터랙티브 모듈이 아직 로드되지 않았습니다.</p>`;
    }
    setBreadcrumb([
      { label: "홈", href: "#" },
      { label: "도구" },
      { label },
    ]);
    setActiveLink(id);
    document.getElementById("main").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    renderMath(content);
  }

  /* ---------- 라우팅 ---------- */
  function route() {
    const hash = location.hash.replace(/^#/, "");
    // Hide the side memo panel by default; renderChapter will re-show it for chapter views
    const memoSide = document.getElementById("memo-side");
    if (memoSide) {
      memoSide.classList.remove("open");
      memoSide.hidden = true;
    }
    if (!hash || hash === "home") {
      renderChapter(null);
    } else if (hash === "weakness") {
      renderWeaknessDashboard();
    } else if (hash === "review") {
      renderReviewMode();
    } else if (hash === "fillblank") {
      renderInteractiveTool("fillblank", "빈칸 채우기 증명", () => window.Interactive.renderFillBlank);
    } else if (hash === "graph") {
      renderInteractiveTool("graph", "그래프 에디터", () => window.Interactive.renderGraphEditor);
    } else if (hash === "timer") {
      renderInteractiveTool("timer", "타이머 챌린지", () => window.Interactive.renderTimerChallenge);
    } else if (hash === "sat") {
      renderInteractiveTool("sat", "SAT 솔버 실습", () => window.Interactive.renderSatSolver);
    } else if (hash === "ds" || /^ds-/.test(hash)) {
      renderExamRoute(hash);
    } else {
      renderChapter(hash);
    }
  }

  /* ---------- 변리사 기출 라우트 ---------- */
  function renderExamRoute(hash) {
    const content = document.getElementById("content");
    const home = document.getElementById("empty-home");
    home.hidden = true;
    if (!window.ExamView) {
      content.innerHTML = "<p>변리사 기출 뷰어 로드 실패</p>";
      return;
    }
    const html = ExamView.render(hash);
    if (html == null) {
      content.innerHTML = "<p>경로를 찾을 수 없습니다.</p>";
      return;
    }
    content.innerHTML = html;
    ExamView.bindHintTooltips(content);

    // breadcrumb
    let crumb = [
      { label: "홈", href: "#" },
      { label: "변리사 기출", href: "#ds" },
    ];
    const m1 = hash.match(/^ds-q-(\d+)-(\d+)-(\d+)$/);
    const m2 = hash.match(/^ds-(\d+)$/);
    if (m1) {
      crumb.push({ label: `${m1[1]}회`, href: `#ds-${m1[1]}` });
      crumb.push({ label: `문제 ${m1[2]}-(${m1[3]})` });
    } else if (m2) {
      crumb.push({ label: `${m2[1]}회` });
    }
    setBreadcrumb(crumb);
    setActiveLink(hash === "ds" ? "ds" : null);
    document.getElementById("main").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    renderMath(content);
  }
  window.addEventListener("hashchange", route);

  /* ---------- 약점 대시보드 (Weakness Dashboard) ---------- */
  function renderWeaknessDashboard() {
    const content = document.getElementById("content");
    const home = document.getElementById("empty-home");
    home.hidden = true;

    const wrong = window.Drills ? Drills.getWrongQuestions(CHAPTERS) : [];
    const byChapter = new Map();
    wrong.forEach((q) => {
      if (!byChapter.has(q.chapterId)) {
        byChapter.set(q.chapterId, { num: q.chapterNum, title: q.chapterTitle, items: [] });
      }
      byChapter.get(q.chapterId).items.push(q);
    });

    content.innerHTML = `
      <div class="chapter-head">
        <span class="eyebrow tier3">도구 · 약점</span>
        <h1>약점 대시보드</h1>
        <p class="lead muted">
          지금까지 틀린 증명·추적 문항을 챕터별로 모았습니다.
          각 카드에 정답과 해설이 표시되니 복습 후 해당 챕터로 이동해 다시 풀어보세요.
        </p>
      </div>
    `;

    if (wrong.length === 0) {
      const empty = document.createElement("section");
      empty.className = "weakness-empty";
      empty.innerHTML = `
        <div class="weakness-empty-card">
          <div class="weakness-empty-icon" aria-hidden="true">✓</div>
          <h2>틀린 문항이 없습니다</h2>
          <p class="muted">아직 드릴에서 오답이 없거나 모두 정답을 맞췄습니다. 새로운 챕터에 도전해 보세요.</p>
          <a class="btn btn-primary" href="#review">랜덤 복습으로 실력 점검 →</a>
        </div>
      `;
      content.appendChild(empty);
    } else {
      const summary = document.createElement("section");
      summary.className = "weakness-summary";
      summary.innerHTML = `
        <div class="weakness-stats">
          <strong>${wrong.length}개</strong> 오답 ·
          <strong>${byChapter.size}개</strong> 챕터에 분산
        </div>
      `;
      content.appendChild(summary);

      byChapter.forEach((group, chapterId) => {
        const sec = document.createElement("section");
        sec.className = "weakness-chapter";
        sec.innerHTML = `
          <h2 class="weakness-chapter-title">
            <a href="#${chapterId}">${VizCore.escapeHtml(group.num)} · ${VizCore.escapeHtml(group.title)}</a>
            <span class="weakness-count">${group.items.length}</span>
          </h2>
        `;
        group.items.forEach((item) => {
          Drills.renderQuestionCard(sec, item, { mode: "view" });
        });
        content.appendChild(sec);
      });
    }

    setBreadcrumb([
      { label: "홈", href: "#" },
      { label: "도구" },
      { label: "약점 대시보드" },
    ]);
    setActiveLink("weakness");
    document.getElementById("main").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    renderMath(content);
  }

  /* ---------- 랜덤 복습 모드 (10문항) ---------- */
  function renderReviewMode() {
    const content = document.getElementById("content");
    const home = document.getElementById("empty-home");
    home.hidden = true;

    // OX-only pool: pick at most 1 OX from each chapter that has any (round-robin),
    // then fill remaining slots from leftover OX pool. SM-2 priority breaks ties.
    const all = window.Drills && typeof Drills.getAllOxQuestions === "function"
      ? Drills.getAllOxQuestions(CHAPTERS)
      : [];
    if (all.length === 0) {
      content.innerHTML = `<div class="chapter-head"><h1>랜덤 복습</h1></div><p class="muted">출제할 OX 문항이 없습니다.</p>`;
      setBreadcrumb([{ label: "홈", href: "#" }, { label: "랜덤 복습" }]);
      setActiveLink("review");
      return;
    }

    // Group by chapter
    const byChapter = new Map();
    all.forEach((q) => {
      if (!byChapter.has(q.chapterId)) byChapter.set(q.chapterId, []);
      byChapter.get(q.chapterId).push(q);
    });
    // Within each chapter, sort by SM-2 priority (due/overdue first, then random tie-break)
    const srPick = (arr) => {
      if (typeof Drills.pickDueReview === "function") return Drills.pickDueReview(arr, arr.length);
      // fallback: wrong/unanswered first
      const a = arr.slice().sort((x, y) => {
        const xs = (x.answered && !x.correct) ? 0 : (x.answered ? 2 : 1);
        const ys = (y.answered && !y.correct) ? 0 : (y.answered ? 2 : 1);
        return xs - ys || Math.random() - 0.5;
      });
      return a;
    };
    const sortedByChapter = new Map();
    for (const [cid, arr] of byChapter) sortedByChapter.set(cid, srPick(arr));

    // Round-robin: take 1 from each chapter until we hit 10 or pool is empty
    const TARGET = 10;
    const picks = [];
    const chapterIds = Array.from(sortedByChapter.keys());
    // Shuffle chapter order so the same chapters don't always lead
    for (let i = chapterIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chapterIds[i], chapterIds[j]] = [chapterIds[j], chapterIds[i]];
    }
    let progress = true;
    while (picks.length < TARGET && progress) {
      progress = false;
      for (const cid of chapterIds) {
        if (picks.length >= TARGET) break;
        const pool = sortedByChapter.get(cid);
        if (pool && pool.length > 0) {
          picks.push(pool.shift());
          progress = true;
        }
      }
    }
    const dueTotal = typeof Drills.getDueCount === "function" ? Drills.getDueCount(all) : null;
    const chapterCount = byChapter.size;

    content.innerHTML = `
      <div class="chapter-head">
        <span class="eyebrow tier3">도구 · 복습</span>
        <h1>랜덤 복습 <span class="review-count-chip">${picks.length}문항</span></h1>
        <p class="lead muted">
          전체 ${chapterCount}개 챕터 OX에서 라운드로빈으로 1문항씩 뽑고, SM-2 간격 반복으로 우선순위를 정했습니다.
          <strong>오늘 복습 대상 ${dueTotal == null ? "—" : dueTotal}개</strong> ·
          답을 고르면 챕터 OX와 다음 복습 일정이 모두 갱신됩니다.
        </p>
      </div>
      <section class="review-session">
        <div class="review-status">
          <span id="review-progress-text">0 / ${picks.length}</span>
          <span class="muted small">정답 <span id="review-correct-count">0</span> / <span id="review-answered-count">0</span></span>
        </div>
        <div id="review-cards"></div>
        <div class="review-footer">
          <a href="#" class="btn btn-outline" id="review-restart">🎲 새로 뽑기</a>
          <a href="#weakness" class="btn btn-ghost">약점 대시보드 →</a>
        </div>
      </section>
    `;

    const cardsWrap = content.querySelector("#review-cards");
    const progressText = content.querySelector("#review-progress-text");
    const correctText = content.querySelector("#review-correct-count");
    const answeredText = content.querySelector("#review-answered-count");
    let answered = 0, correctCount = 0;

    picks.forEach((item) => {
      Drills.renderQuestionCard(cardsWrap, item, {
        mode: "interactive",
        onAnswer: ({ correct }) => {
          if (typeof Drills.srKey === "function" && typeof Drills.updateSR === "function") {
            Drills.updateSR(Drills.srKey(item), !!correct);
          }
          answered += 1;
          if (correct) correctCount += 1;
          progressText.textContent = `${answered} / ${picks.length}`;
          correctText.textContent = String(correctCount);
          answeredText.textContent = String(answered);
          if (answered === picks.length) {
            setTimeout(() => {
              cardsWrap.insertAdjacentHTML("beforeend", `
                <div class="review-finish">
                  <strong>완료!</strong> ${picks.length}문항 중 ${correctCount}문항 정답 (${Math.round((correctCount / picks.length) * 100)}%).
                </div>
              `);
            }, 120);
          }
        },
      });
    });

    content.querySelector("#review-restart").addEventListener("click", (e) => {
      e.preventDefault();
      renderReviewMode();
    });

    setBreadcrumb([
      { label: "홈", href: "#" },
      { label: "도구" },
      { label: "랜덤 복습" },
    ]);
    setActiveLink("review");
    document.getElementById("main").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    renderMath(content);
  }

  /* ---------- 테마 토글 (라이트/다크) ---------- */
  const THEME_KEY = "clrs:theme";
  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || "dark"; }
    catch { return "dark"; }
  }
  function applyTheme(theme) {
    document.body.classList.toggle("theme-light", theme === "light");
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    const btn = document.getElementById("tool-theme");
    if (btn) {
      const icon = btn.querySelector(".tool-btn-icon");
      const label = btn.querySelector(".tool-btn-label");
      if (theme === "light") {
        if (icon) icon.textContent = "☾";
        if (label) label.textContent = "다크";
      } else {
        if (icon) icon.textContent = "☀";
        if (label) label.textContent = "라이트";
      }
    }
  }
  applyTheme(getTheme());

  /* ---------- 진행도 내보내기 / 가져오기 ---------- */
  function collectProgress() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("clrs:")) {
        out[k] = localStorage.getItem(k);
      }
    }
    return out;
  }
  function exportProgress() {
    const payload = {
      kind: "clrs-progress",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: collectProgress(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    a.download = `clrs-progress-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
    showToast(`진행도 ${Object.keys(payload.data).length}개 항목을 내보냈습니다`);
  }
  function importProgress(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!payload || payload.kind !== "clrs-progress" || !payload.data) {
          throw new Error("파일 형식이 올바르지 않습니다");
        }
        const entries = Object.entries(payload.data).filter(([k]) => k.startsWith("clrs:"));
        if (!confirm(`${entries.length}개의 항목을 가져옵니다. 현재 진행도를 덮어씁니다. 계속할까요?`)) return;
        // 기존 clrs: 키 제거 후 새로 덮어쓰기
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("clrs:")) toRemove.push(k);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
        entries.forEach(([k, v]) => localStorage.setItem(k, v));
        // UI 동기화
        visited = loadVisited();
        bookmarks = loadBookmarks();
        memos = loadMemos();
        applyTheme(getTheme());
        renderNav();
        refreshVisitedStates();
        route();
        showToast(`진행도 ${entries.length}개 항목을 가져왔습니다`);
      } catch (err) {
        showToast(`가져오기 실패: ${err.message}`, 4000);
      }
    };
    reader.readAsText(file);
  }

  // Tool button bindings (delegated via body since nav is re-rendered)
  document.body.addEventListener("click", (e) => {
    const themeBtn = e.target.closest("#tool-theme");
    if (themeBtn) {
      applyTheme(getTheme() === "dark" ? "light" : "dark");
      return;
    }
    const exportBtn = e.target.closest("#tool-export");
    if (exportBtn) { exportProgress(); return; }
    const importBtn = e.target.closest("#tool-import");
    if (importBtn) {
      const input = document.getElementById("tool-import-file");
      if (input) input.click();
      return;
    }
  });
  document.body.addEventListener("change", (e) => {
    if (e.target && e.target.id === "tool-import-file") {
      importProgress(e.target.files);
      e.target.value = "";
    }
  });

  /* ---------- 홈 CTA ---------- */
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.hash = "#" + btn.dataset.goto;
    });
  });
  document.getElementById("cta-search").addEventListener("click", openCmdK);

  /* ---------- 모바일 사이드바 토글 ---------- */
  document.getElementById("btn-toc").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  /* ============================================================
     Command Palette (⌘K) — Hick + Jakob + Recognition
     ============================================================ */
  const cmdkOverlay = document.getElementById("cmdk");
  const cmdkInput = document.getElementById("cmdk-input");
  const cmdkList = document.getElementById("cmdk-list");
  let cmdkItems = [];
  let cmdkActive = 0;

  function buildCmdkIndex() {
    const items = [];
    CHAPTERS.forEach((c) => {
      items.push({
        kind: "chapter",
        title: `${c.num} · ${c.title}`,
        sub: c.subtitle || "",
        keywords: `${c.num} ${c.title} ${c.subtitle || ""} ${c.tier}`.toLowerCase(),
        action: () => { location.hash = "#" + c.id; closeCmdK(); },
      });
      (c.algorithms || []).forEach((a) => {
        items.push({
          kind: "viz",
          title: a.name,
          sub: `${c.num} ${c.title} · ${a.desc}`,
          keywords: `${a.name} ${a.desc} ${c.title} ${(a.tags || []).join(" ")}`.toLowerCase(),
          action: () => {
            location.hash = "#" + c.id;
            closeCmdK();
            // 챕터 렌더링이 끝난 다음 프레임에 시각화 열기
            requestAnimationFrame(() => requestAnimationFrame(() => {
              try { player.open(a.viz, a.name, `${c.num} · ${c.title}`); }
              catch (err) { console.error(err); showToast("시각화를 열 수 없습니다."); }
            }));
          },
        });
      });
    });
    return items;
  }

  function renderCmdkResults(query) {
    const q = query.trim().toLowerCase();
    const all = buildCmdkIndex();
    const filtered = q
      ? all.filter((it) => it.keywords.includes(q))
      : all.slice(0, 12);
    cmdkItems = filtered;
    cmdkActive = 0;
    if (!filtered.length) {
      cmdkList.innerHTML = `<li class="cmdk-empty">'${VizCore.escapeHtml(query)}'와 일치하는 항목이 없습니다.</li>`;
      return;
    }
    cmdkList.innerHTML = filtered.map((it, i) => `
      <li class="cmdk-item ${i === 0 ? "active" : ""}" role="option" data-i="${i}">
        <span class="cmdk-kind ${it.kind === "viz" ? "viz" : ""}">${it.kind === "viz" ? "시각화" : "챕터"}</span>
        <span class="cmdk-title">${VizCore.escapeHtml(it.title)}</span>
        <span class="cmdk-sub">${VizCore.escapeHtml(it.sub)}</span>
        <span class="cmdk-enter">↵</span>
      </li>
    `).join("");
    cmdkList.querySelectorAll(".cmdk-item").forEach((el) => {
      el.addEventListener("mouseenter", () => setCmdkActive(parseInt(el.dataset.i, 10)));
      el.addEventListener("click", () => filtered[parseInt(el.dataset.i, 10)].action());
    });
  }

  function setCmdkActive(i) {
    cmdkActive = Math.max(0, Math.min(cmdkItems.length - 1, i));
    const items = cmdkList.querySelectorAll(".cmdk-item");
    items.forEach((el, idx) => el.classList.toggle("active", idx === cmdkActive));
    const active = items[cmdkActive];
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function openCmdK() {
    cmdkOverlay.hidden = false;
    cmdkInput.value = "";
    renderCmdkResults("");
    setTimeout(() => cmdkInput.focus(), 30);
  }
  function closeCmdK() {
    cmdkOverlay.hidden = true;
  }

  document.getElementById("btn-cmdk").addEventListener("click", openCmdK);
  document.getElementById("sidebar-cmdk").addEventListener("click", openCmdK);
  cmdkOverlay.addEventListener("click", (e) => {
    if (e.target === cmdkOverlay) closeCmdK();
  });
  cmdkInput.addEventListener("input", (e) => renderCmdkResults(e.target.value));
  cmdkInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCmdkActive(cmdkActive + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCmdkActive(cmdkActive - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const it = cmdkItems[cmdkActive];
      if (it) it.action();
    }
    else if (e.key === "Escape") { e.preventDefault(); closeCmdK(); }
  });

  /* ============================================================
     Help Overlay (?)
     ============================================================ */
  const helpOverlay = document.getElementById("help");
  function openHelp() { helpOverlay.hidden = false; }
  function closeHelp() { helpOverlay.hidden = true; }
  document.getElementById("btn-help").addEventListener("click", openHelp);
  document.getElementById("help-close").addEventListener("click", closeHelp);
  helpOverlay.addEventListener("click", (e) => { if (e.target === helpOverlay) closeHelp(); });

  /* ============================================================
     전역 단축키
     ============================================================ */
  let gPressed = false;
  document.addEventListener("keydown", (e) => {
    // Skip when typing inside an input
    const inInput = e.target.matches("input, textarea, [contenteditable=true]");

    // ⌘K / Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cmdkOverlay.hidden) openCmdK(); else closeCmdK();
      return;
    }
    // Esc closes overlays
    if (e.key === "Escape") {
      if (!cmdkOverlay.hidden) { closeCmdK(); return; }
      if (!helpOverlay.hidden) { closeHelp(); return; }
    }
    if (inInput) return;

    // ?
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      e.preventDefault();
      if (helpOverlay.hidden) openHelp(); else closeHelp();
      return;
    }
    // j / k → next / prev chapter
    if (e.key === "j" || e.key === "k") {
      const cur = location.hash.replace(/^#/, "");
      const idx = orderedIds.indexOf(cur);
      if (idx >= 0) {
        const ni = e.key === "j" ? idx + 1 : idx - 1;
        if (ni >= 0 && ni < orderedIds.length) {
          location.hash = "#" + orderedIds[ni];
        }
      }
    }
    // g h → home
    if (e.key === "g" && !gPressed) { gPressed = true; setTimeout(() => gPressed = false, 800); return; }
    if (e.key === "h" && gPressed) {
      location.hash = "";
      gPressed = false;
    }
  });

  /* ============================================================
     Tooltip — data-tooltip 속성에 자동 부착
     ============================================================ */
  const tip = document.getElementById("tip");
  let tipTarget = null;
  function showTip(el) {
    const text = el.getAttribute("data-tooltip");
    if (!text) return;
    tip.textContent = text;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    // Position below the element
    const tipR = tip.getBoundingClientRect();
    let x = r.left + r.width / 2 - tipR.width / 2;
    let y = r.bottom + 8;
    x = Math.max(8, Math.min(window.innerWidth - tipR.width - 8, x));
    if (y + tipR.height > window.innerHeight - 8) y = r.top - tipR.height - 8;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
    requestAnimationFrame(() => tip.classList.add("show"));
  }
  function hideTip() {
    tip.classList.remove("show");
    tip.hidden = true;
    tipTarget = null;
  }
  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-tooltip]");
    if (t && t !== tipTarget) {
      tipTarget = t;
      showTip(t);
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (tipTarget && !tipTarget.contains(e.relatedTarget)) hideTip();
  });
  document.addEventListener("focusin", (e) => {
    const t = e.target.closest("[data-tooltip]");
    if (t) { tipTarget = t; showTip(t); }
  });
  document.addEventListener("focusout", () => hideTip());

  /* ---------- 초기화 ---------- */
  renderNav();
  route();
})();
