/* =========================================================
   drills.js — "3-Pillar Drill" 인터랙티브 학습 드릴
     ① Pseudocode Builder   — 줄 순서 맞추기
     ② Proof Stepper        — 루프 불변식 MCQ
     ③ Predict-Then-Step    — 실행 추적 MCQ

   데이터: CHAPTER.algorithms[i].drills = { pseudo, proof, trace, source }
   CLRS 원문을 정답의 정본으로 씁니다.
   ========================================================= */
(function () {
  "use strict";

  const esc = window.VizCore ? window.VizCore.escapeHtml : (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- localStorage 지속성 ---------- */
  const STORE_KEY = "clrs:drills:v1";

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveStore(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
  }
  function getDrillState(key) {
    return loadStore()[key] || null;
  }
  function setDrillState(key, state) {
    const s = loadStore();
    if (state == null) delete s[key];
    else s[key] = state;
    saveStore(s);
    try {
      window.dispatchEvent(new CustomEvent("drill:progress-change", { detail: { key } }));
    } catch {}
  }

  /* ---------- Progress API ----------
     드릴 데이터를 해석해 {pseudo, proof, trace} 별 완료 상태 반환.
       pseudo: { solved: bool, total: 1 }
       proof:  { done: N, correct: N, total: N }
       trace:  { done: N, correct: N, total: N }
  */
  function getAlgorithmProgress(chapterId, algo) {
    if (!algo || !algo.drills) return null;
    const d = algo.drills;
    const keyPrefix = `${chapterId}:${algo.id || "a"}`;
    const out = {};
    if (d.pseudo) {
      const st = getDrillState(`${keyPrefix}:pseudo`);
      out.pseudo = { solved: !!(st && st.solved), total: 1 };
    }
    if (d.proof) {
      const st = getDrillState(`${keyPrefix}:proof`);
      const ans = (st && Array.isArray(st.answers)) ? st.answers : [];
      out.proof = {
        done: ans.filter((a) => a != null).length,
        correct: ans.filter((a) => a && a.correct).length,
        total: d.proof.steps.length,
      };
    }
    if (d.trace) {
      const st = getDrillState(`${keyPrefix}:trace`);
      const ans = (st && Array.isArray(st.answers)) ? st.answers : [];
      out.trace = {
        done: ans.filter((a) => a != null).length,
        correct: ans.filter((a) => a && a.correct).length,
        total: d.trace.steps.length,
      };
    }
    return out;
  }

  // Aggregate across a chapter: counts fully-completed drills vs total drills.
  function getChapterProgress(chapterId, algorithms) {
    let completed = 0, total = 0;
    (algorithms || []).forEach((algo) => {
      const p = getAlgorithmProgress(chapterId, algo);
      if (!p) return;
      if (p.pseudo) { total += 1; if (p.pseudo.solved) completed += 1; }
      if (p.proof)  { total += 1; if (p.proof.done === p.proof.total) completed += 1; }
      if (p.trace)  { total += 1; if (p.trace.done === p.trace.total) completed += 1; }
    });
    return { completed, total };
  }

  /* ---------- 공통 유틸 ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // 무작위 배열이 우연히 정답 순서와 같으면 한 번 더 섞기
    if (a.every((v, i) => v.__orig === i)) {
      return shuffle(arr);
    }
    return a;
  }

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue; // skip null/undefined/false attrs
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
     ① Pseudocode Builder (드래그로 줄 순서 맞추기)
     ========================================================= */
  function mountPseudo(host, data, algoName, storageKey) {
    const wrap = el("section", { class: "drill drill-pseudo", "aria-label": data.title });
    host.appendChild(wrap);

    const saved = storageKey ? getDrillState(storageKey) : null;
    const startSolved = !!(saved && saved.solved);

    wrap.appendChild(el("header", { class: "drill-head" }, [
      el("h4", {}, [data.title]),
      el("p", { class: "drill-intro" }, [data.intro]),
    ]));

    // Optional reference code block (e.g., a companion procedure shown read-only)
    if (data.reference) {
      const ref = el("details", { class: "drill-reference", open: "" }, [
        el("summary", {}, [data.reference.title || "참고 의사코드"]),
        el("div", { class: "reference-code-wrap" },
          (data.reference.lines || []).map((ln) => {
            const pad = "  ".repeat(ln.indent || 0);
            return el("div", { class: "reference-line" }, [pad + ln.text]);
          })
        ),
      ]);
      wrap.appendChild(ref);
    }

    // Shuffle lines with stable original-index for grading
    const indexed = data.lines.map((l, i) => ({ ...l, __orig: i }));
    let order = shuffle(indexed);

    const list = el("ol", { class: "drill-sortable", "aria-label": "드래그 또는 터치로 순서를 맞추세요" });

    // Pointer-based sortable — works for both mouse and touch (HTML5 drag API
    // is not supported on iOS/Android without a polyfill).
    let dragItem = null;
    let dragStartY = 0;
    let dragOffsetY = 0;

    function onPointerDown(e, li) {
      // Only start drag from primary button or touch, and not while interacting with other buttons
      if (e.button != null && e.button !== 0) return;
      dragItem = li;
      dragStartY = e.clientY;
      dragOffsetY = e.clientY - li.getBoundingClientRect().top;
      li.classList.add("dragging");
      li.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (!dragItem) return;
      // Find which sibling the pointer is currently over
      const items = [...list.querySelectorAll(".sortable-item")];
      for (const other of items) {
        if (other === dragItem) continue;
        const rect = other.getBoundingClientRect();
        if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const before = (e.clientY - rect.top) < rect.height / 2;
          list.insertBefore(dragItem, before ? other : other.nextSibling);
          break;
        }
      }
    }
    function onPointerUp(e) {
      if (!dragItem) return;
      dragItem.classList.remove("dragging");
      dragItem.releasePointerCapture?.(e.pointerId);
      dragItem = null;
    }

    function renderList() {
      list.innerHTML = "";
      order.forEach((ln, idx) => {
        const li = el("li", {
          class: "sortable-item",
          "data-orig": String(ln.__orig),
        }, [
          el("span", { class: "handle", "aria-hidden": "true" }, ["⋮⋮"]),
          el("code", { class: "line" }, [ln.text]),
        ]);
        li.addEventListener("pointerdown", (e) => onPointerDown(e, li));
        li.addEventListener("pointermove", onPointerMove);
        li.addEventListener("pointerup", onPointerUp);
        li.addEventListener("pointercancel", onPointerUp);
        list.appendChild(li);
      });
    }
    renderList();

    // Controls
    const status = el("p", { class: "drill-status", "aria-live": "polite" });
    const btnCheck = el("button", { type: "button", class: "btn btn-primary" }, ["정답 확인"]);
    const btnReveal = el("button", { type: "button", class: "btn btn-outline" }, ["정답 보기"]);
    const btnReset = el("button", { type: "button", class: "btn btn-ghost" }, ["섞기"]);

    btnCheck.addEventListener("click", () => {
      const items = [...list.querySelectorAll(".sortable-item")];
      let firstWrong = -1;
      items.forEach((li, idx) => {
        const ok = Number(li.dataset.orig) === idx;
        li.classList.toggle("ok", ok);
        li.classList.toggle("bad", !ok);
        if (!ok && firstWrong < 0) firstWrong = idx;
      });
      if (firstWrong < 0) {
        status.textContent = `✓ 완벽합니다! ${indexed.length}줄 모두 CLRS 원문과 일치합니다.`;
        status.className = "drill-status good";
        wrap.classList.add("solved");
        if (storageKey) setDrillState(storageKey, { solved: true });
      } else {
        status.textContent = `${firstWrong + 1}번째 줄부터 순서가 다릅니다. 빨간색 줄을 다시 옮겨 보세요.`;
        status.className = "drill-status bad";
      }
    });
    btnReveal.addEventListener("click", () => {
      order = indexed.slice();
      renderList();
      // Show indent + note as annotations
      [...list.querySelectorAll(".sortable-item")].forEach((li, idx) => {
        li.classList.add("revealed", "ok");
        li.classList.remove("bad");
        const ln = indexed[idx];
        li.querySelector(".line").style.paddingLeft = (ln.indent * 16) + "px";
        if (ln.note) {
          li.appendChild(el("span", { class: "note" }, [ln.note]));
        }
      });
      status.textContent = "CLRS 원문 의사코드입니다.";
      status.className = "drill-status info";
      wrap.classList.add("solved");
      if (storageKey) setDrillState(storageKey, { solved: true });
    });
    btnReset.addEventListener("click", () => {
      order = shuffle(indexed);
      renderList();
      status.textContent = "";
      status.className = "drill-status";
      wrap.classList.remove("solved");
      if (storageKey) setDrillState(storageKey, null);
    });

    // Restore "solved" badge on reload
    if (startSolved) {
      wrap.classList.add("solved");
      status.textContent = "이전에 완료한 드릴입니다. '정답 보기'로 원문을 다시 보거나 '섞기'로 재도전하세요.";
      status.className = "drill-status info";
    }

    wrap.appendChild(list);
    wrap.appendChild(el("div", { class: "drill-actions" }, [btnCheck, btnReveal, btnReset]));
    wrap.appendChild(status);
  }

  /* =========================================================
     ② Proof Stepper — 한 스텝씩 객관식으로 증명 따라가기
     ========================================================= */
  function mountProof(host, data, algoName, storageKey) {
    const wrap = el("section", { class: "drill drill-proof", "aria-label": data.title });
    host.appendChild(wrap);

    wrap.appendChild(el("header", { class: "drill-head" }, [
      el("h4", {}, [data.title]),
      el("p", { class: "drill-intro" }, [data.intro]),
      el("blockquote", { class: "invariant" }, [
        el("strong", {}, [data.invariantLabel || "불변식: "]),
        data.invariant,
      ]),
    ]));

    const total = data.steps.length;
    // answers[i] = { chosen: number, correct: boolean } | null
    let answers = new Array(total).fill(null);

    // Restore from localStorage if present
    const saved = storageKey ? getDrillState(storageKey) : null;
    if (saved && Array.isArray(saved.answers) && saved.answers.length === total) {
      answers = saved.answers.map((a) => (a && typeof a === "object") ? a : null);
    }
    // Start at the first unanswered step (or the last if all done)
    let idx = 0;
    const firstUnanswered = answers.findIndex((a) => a == null);
    idx = firstUnanswered === -1 ? total - 1 : firstUnanswered;

    function persist() {
      if (storageKey) setDrillState(storageKey, { answers });
    }

    const progress = el("div", { class: "proof-progress" });
    const stageTag = el("span", { class: "proof-stage" });
    const stepCounter = el("span", { class: "proof-count" }, [`${idx + 1}/${total}`]);
    const prompt = el("p", { class: "proof-prompt" });
    const choiceList = el("div", { class: "proof-choices", role: "radiogroup" });
    const feedback = el("div", { class: "proof-feedback", hidden: "" });
    const btnPrev = el("button", { type: "button", class: "btn btn-outline" }, ["◀ 이전"]);
    const btnNext = el("button", { type: "button", class: "btn btn-primary" }, ["다음 ▶"]);
    const btnRetryWrong = el("button", { type: "button", class: "btn btn-ghost drill-retry-wrong", hidden: "" }, ["✗ 오답만"]);
    const btnRetry = el("button", { type: "button", class: "btn btn-ghost drill-retry", hidden: "" }, ["↻ 다시 풀기"]);
    btnRetry.addEventListener("click", () => {
      answers = new Array(total).fill(null);
      idx = 0;
      persist();
      renderStep();
    });
    btnRetryWrong.addEventListener("click", () => {
      // Clear only wrong answers; keep correct ones intact. Jump to first cleared step.
      const firstWrong = answers.findIndex((a) => a && !a.correct);
      if (firstWrong < 0) return;
      for (let i = 0; i < answers.length; i++) {
        if (answers[i] && !answers[i].correct) answers[i] = null;
      }
      idx = firstWrong;
      persist();
      renderStep();
    });

    function renderProgress() {
      progress.innerHTML = "";
      for (let i = 0; i < total; i++) {
        const a = answers[i];
        const cls = "proof-dot" +
          (i === idx ? " active" : "") +
          (a == null ? "" : a.correct ? " good" : " bad");
        progress.appendChild(el("span", { class: cls }));
      }
    }

    function showFeedback(s, chosenIdx, isCorrect) {
      const correctIdx = s.choices.findIndex((c) => c.correct);
      const explain = isCorrect ? s.choices[chosenIdx].explain : s.choices[correctIdx].explain;
      feedback.hidden = false;
      feedback.innerHTML = `
        <p class="${isCorrect ? "good" : "bad"}">
          <strong>${isCorrect
            ? "✓ 정답"
            : `✗ 오답 — 정답은 ${String.fromCharCode(65 + correctIdx)}번`}</strong>
          — ${esc(explain)}
        </p>`;
    }

    function paintChoices(s, chosenIdx) {
      [...choiceList.querySelectorAll(".proof-choice")].forEach((b, bi) => {
        b.disabled = true;
        if (s.choices[bi].correct) b.classList.add("correct");
        else if (bi === chosenIdx) b.classList.add("wrong");
        else b.classList.add("wrong-sibling");
      });
    }

    function renderStep() {
      const s = data.steps[idx];
      stageTag.textContent = s.stage;
      stepCounter.textContent = `${idx + 1}/${total}`;
      prompt.textContent = s.prompt;
      feedback.hidden = true;
      feedback.innerHTML = "";
      choiceList.innerHTML = "";

      const ans = answers[idx];
      s.choices.forEach((ch, ci) => {
        const btn = el("button", {
          type: "button",
          class: "proof-choice",
          role: "radio",
          "aria-checked": "false",
          disabled: ans ? "" : null,
        }, [
          el("span", { class: "proof-choice-mark", "aria-hidden": "true" }, [String.fromCharCode(65 + ci)]),
          el("span", { class: "proof-choice-text" }, [ch.text]),
        ]);
        btn.addEventListener("click", () => {
          if (answers[idx] != null) return;
          answers[idx] = { chosen: ci, correct: ch.correct };
          persist();
          recordDrillSR(storageKey, idx, ch.correct);
          paintChoices(s, ci);
          showFeedback(s, ci, ch.correct);
          renderProgress();
          updateNavButtons();
        });
        choiceList.appendChild(btn);
      });

      if (ans) {
        paintChoices(s, ans.chosen);
        showFeedback(s, ans.chosen, ans.correct);
      }

      renderProgress();
      updateNavButtons();
    }

    function updateNavButtons() {
      btnPrev.disabled = idx === 0;
      const done = answers[idx] != null;
      const allDone = answers.every((a) => a != null);
      const anyWrong = answers.some((a) => a && !a.correct);
      if (idx === total - 1) {
        const score = answers.filter((a) => a && a.correct).length;
        btnNext.textContent = done ? `완료! ${score}/${total} 정답` : "답을 고르세요";
        btnNext.disabled = true;
      } else {
        btnNext.textContent = "다음 ▶";
        btnNext.disabled = !done;
      }
      btnRetry.hidden = !allDone;
      btnRetryWrong.hidden = !(allDone && anyWrong);
    }

    btnPrev.addEventListener("click", () => { if (idx > 0) { idx--; renderStep(); } });
    btnNext.addEventListener("click", () => { if (idx < total - 1 && answers[idx] != null) { idx++; renderStep(); } });

    wrap.appendChild(el("div", { class: "proof-header" }, [stageTag, stepCounter]));
    wrap.appendChild(progress);
    wrap.appendChild(prompt);
    wrap.appendChild(choiceList);
    wrap.appendChild(feedback);
    wrap.appendChild(el("div", { class: "drill-actions" }, [btnPrev, btnNext, btnRetryWrong, btnRetry]));

    renderStep();
  }

  /* =========================================================
     ③ Predict-Then-Step Trace (배열 상태 표시 + MCQ)
     ========================================================= */
  function mountTrace(host, data, algoName, storageKey) {
    const wrap = el("section", { class: "drill drill-trace", "aria-label": data.title });
    host.appendChild(wrap);

    wrap.appendChild(el("header", { class: "drill-head" }, [
      el("h4", {}, [data.title]),
      el("p", { class: "drill-intro" }, [data.intro]),
    ]));

    const total = data.steps.length;
    let answers = new Array(total).fill(null); // { chosen, correct } | null

    // Restore from localStorage
    const saved = storageKey ? getDrillState(storageKey) : null;
    if (saved && Array.isArray(saved.answers) && saved.answers.length === total) {
      answers = saved.answers.map((a) => (a && typeof a === "object") ? a : null);
    }
    let idx = 0;
    const firstUnanswered = answers.findIndex((a) => a == null);
    idx = firstUnanswered === -1 ? total - 1 : firstUnanswered;

    function persist() {
      if (storageKey) setDrillState(storageKey, { answers });
    }

    const progress = el("div", { class: "proof-progress" });
    const stateView = el("div", { class: "trace-state" });
    const prompt = el("p", { class: "proof-prompt" });
    const choiceList = el("div", { class: "proof-choices", role: "radiogroup" });
    const feedback = el("div", { class: "proof-feedback", hidden: "" });
    const btnPrev = el("button", { type: "button", class: "btn btn-outline" }, ["◀ 이전"]);
    const btnNext = el("button", { type: "button", class: "btn btn-primary" }, ["다음 ▶"]);
    const btnRetryWrong = el("button", { type: "button", class: "btn btn-ghost drill-retry-wrong", hidden: "" }, ["✗ 오답만"]);
    const btnRetry = el("button", { type: "button", class: "btn btn-ghost drill-retry", hidden: "" }, ["↻ 다시 풀기"]);
    btnRetry.addEventListener("click", () => {
      answers = new Array(total).fill(null);
      idx = 0;
      persist();
      renderStep();
    });
    btnRetryWrong.addEventListener("click", () => {
      const firstWrong = answers.findIndex((a) => a && !a.correct);
      if (firstWrong < 0) return;
      for (let i = 0; i < answers.length; i++) {
        if (answers[i] && !answers[i].correct) answers[i] = null;
      }
      idx = firstWrong;
      persist();
      renderStep();
    });
    const stepCounter = el("span", { class: "proof-count" }, [`${idx + 1}/${total}`]);

    function renderProgress() {
      progress.innerHTML = "";
      for (let i = 0; i < total; i++) {
        const a = answers[i];
        const cls = "proof-dot" +
          (i === idx ? " active" : "") +
          (a == null ? "" : a.correct ? " good" : " bad");
        progress.appendChild(el("span", { class: cls }));
      }
    }

    function paintChoices(s, chosenIdx) {
      [...choiceList.querySelectorAll(".proof-choice")].forEach((b, bi) => {
        b.disabled = true;
        if (s.choices[bi].correct) b.classList.add("correct");
        else if (bi === chosenIdx) b.classList.add("wrong");
        else b.classList.add("wrong-sibling");
      });
    }

    function showFeedback(s, chosenIdx, isCorrect) {
      const correctIdx = s.choices.findIndex((c) => c.correct);
      const explain = isCorrect ? s.choices[chosenIdx].explain : s.choices[correctIdx].explain;
      feedback.hidden = false;
      feedback.innerHTML = `
        <p class="${isCorrect ? "good" : "bad"}">
          <strong>${isCorrect
            ? "✓ 정답"
            : `✗ 오답 — 정답은 ${String.fromCharCode(65 + correctIdx)}번`}</strong>
          — ${esc(explain)}
        </p>`;
    }

    function renderState(before) {
      stateView.innerHTML = "";
      const table = el("div", { class: "trace-array" });
      const A = before.A;
      A.forEach((v, i) => {
        const cell = el("div", { class: "trace-cell" }, [
          el("span", { class: "trace-val" }, [String(v)]),
          el("span", { class: "trace-idx" }, [`[${i + 1}]`]),
        ]);
        table.appendChild(cell);
      });
      stateView.appendChild(table);
      const vars = [];
      if (before.j != null) vars.push(`j = ${before.j}`);
      if (before.key != null) vars.push(`key = ${before.key}`);
      if (before.i != null) vars.push(`i = ${before.i}`);
      if (vars.length) {
        stateView.appendChild(el("p", { class: "trace-vars" }, [vars.join("   ·   ")]));
      }
    }

    function renderStep() {
      const s = data.steps[idx];
      renderState(s.before);
      prompt.textContent = s.prompt;
      feedback.hidden = true;
      feedback.innerHTML = "";
      choiceList.innerHTML = "";
      stepCounter.textContent = `${idx + 1}/${total}`;

      const ans = answers[idx];
      s.choices.forEach((ch, ci) => {
        const btn = el("button", {
          type: "button",
          class: "proof-choice",
          role: "radio",
          disabled: ans ? "" : null,
        }, [
          el("span", { class: "proof-choice-mark", "aria-hidden": "true" }, [String.fromCharCode(65 + ci)]),
          el("span", { class: "proof-choice-text" }, [ch.text]),
        ]);
        btn.addEventListener("click", () => {
          if (answers[idx] != null) return;
          answers[idx] = { chosen: ci, correct: ch.correct };
          persist();
          recordDrillSR(storageKey, idx, ch.correct);
          paintChoices(s, ci);
          showFeedback(s, ci, ch.correct);
          renderProgress();
          updateNav();
        });
        choiceList.appendChild(btn);
      });

      if (ans) {
        paintChoices(s, ans.chosen);
        showFeedback(s, ans.chosen, ans.correct);
      }
      renderProgress();
      updateNav();
    }

    function updateNav() {
      btnPrev.disabled = idx === 0;
      const done = answers[idx] != null;
      const allDone = answers.every((a) => a != null);
      const anyWrong = answers.some((a) => a && !a.correct);
      if (idx === total - 1) {
        const score = answers.filter((a) => a && a.correct).length;
        btnNext.textContent = done ? `완료! ${score}/${total} 정답` : "답을 고르세요";
        btnNext.disabled = true;
      } else {
        btnNext.textContent = "다음 ▶";
        btnNext.disabled = !done;
      }
      btnRetry.hidden = !allDone;
      btnRetryWrong.hidden = !(allDone && anyWrong);
    }

    btnPrev.addEventListener("click", () => { if (idx > 0) { idx--; renderStep(); } });
    btnNext.addEventListener("click", () => { if (idx < total - 1 && answers[idx] != null) { idx++; renderStep(); } });

    wrap.appendChild(el("div", { class: "proof-header" }, [
      el("span", { class: "proof-stage" }, [`Checkpoint`]),
      stepCounter,
    ]));
    wrap.appendChild(progress);
    wrap.appendChild(stateView);
    wrap.appendChild(prompt);
    wrap.appendChild(choiceList);
    wrap.appendChild(feedback);
    wrap.appendChild(el("div", { class: "drill-actions" }, [btnPrev, btnNext, btnRetryWrong, btnRetry]));

    renderStep();
  }

  /* =========================================================
     Public API — mountForAlgorithm(parent, algo, chapterMeta)
       chapterMeta: { id, num, title }
     ========================================================= */
  function mountForAlgorithm(parent, algo, chapterMeta) {
    if (!algo || !algo.drills) return;
    const d = algo.drills;
    const chapterId = chapterMeta && chapterMeta.id ? chapterMeta.id : "x";
    const keyPrefix = `${chapterId}:${algo.id || "a"}`;

    const block = el("section", { class: "drills-block" });
    const hdr = el("header", { class: "drills-head" }, [
      el("p", { class: "drills-eyebrow" }, [
        chapterMeta ? `${chapterMeta.num} · ${chapterMeta.title}` : "",
      ]),
      el("h3", {}, [`${algo.name} — 3-Pillar 드릴`]),
      el("p", { class: "drills-sub" }, [
        `학습 팁: (1) 의사코드를 직접 쓰고 · (2) 복잡도/정확성을 증명하며 · (3) 작은 예제에 실행해 본다.`,
      ]),
      d.source ? el("p", { class: "drills-source" }, [`출처: ${d.source}`]) : null,
    ]);
    block.appendChild(hdr);

    // Tab nav
    const tabs = el("div", { class: "drills-tabs", role: "tablist" });
    const panels = el("div", { class: "drills-panels" });
    const defs = [
      { key: "pseudo", label: "① 의사코드", data: d.pseudo, mount: mountPseudo },
      { key: "proof",  label: "② 증명",     data: d.proof,  mount: mountProof  },
      { key: "trace",  label: "③ 실행 추적", data: d.trace, mount: mountTrace  },
    ].filter((x) => x.data);

    defs.forEach((def, i) => {
      const tab = el("button", {
        type: "button",
        class: "drills-tab" + (i === 0 ? " active" : ""),
        role: "tab",
        "aria-selected": i === 0 ? "true" : "false",
      }, [def.label]);
      const panel = el("div", {
        class: "drills-panel" + (i === 0 ? " active" : ""),
        role: "tabpanel",
        hidden: i === 0 ? null : "",
      });
      const storageKey = `${keyPrefix}:${def.key}`;
      def.mount(panel, def.data, algo.name, storageKey);
      tab.addEventListener("click", () => {
        [...tabs.children].forEach((t, ti) => {
          t.classList.toggle("active", ti === i);
          t.setAttribute("aria-selected", ti === i ? "true" : "false");
        });
        [...panels.children].forEach((p, pi) => {
          p.classList.toggle("active", pi === i);
          p.hidden = pi !== i;
        });
      });
      tabs.appendChild(tab);
      panels.appendChild(panel);
    });

    block.appendChild(tabs);
    block.appendChild(panels);
    parent.appendChild(block);
  }

  /* ---------- Aggregated question view (for Weakness / Random Review) ---------- */
  // Flatten all proof + trace steps across all chapters into a uniform list of items.
  //   item = {
  //     chapterId, chapterNum, chapterTitle,
  //     algoId, algoName, kind: "proof"|"trace",
  //     stepIdx, step, answered, chosen, correct
  //   }
  function getAllQuestions(chapters) {
    const out = [];
    (chapters || []).forEach((ch) => {
      (ch.algorithms || []).forEach((algo) => {
        if (!algo || !algo.drills) return;
        const kp = `${ch.id}:${algo.id || "a"}`;
        ["proof", "trace"].forEach((kind) => {
          const d = algo.drills[kind];
          if (!d || !Array.isArray(d.steps)) return;
          const st = getDrillState(`${kp}:${kind}`);
          const ans = (st && Array.isArray(st.answers)) ? st.answers : [];
          d.steps.forEach((step, i) => {
            const a = ans[i];
            out.push({
              chapterId: ch.id,
              chapterNum: ch.num,
              chapterTitle: ch.title,
              algoId: algo.id,
              algoName: algo.name,
              kind,
              stepIdx: i,
              step,
              answered: a != null,
              chosen: a ? a.chosen : null,
              correct: a ? !!a.correct : null,
            });
          });
        });
      });
    });
    return out;
  }

  function getWrongQuestions(chapters) {
    return getAllQuestions(chapters).filter((q) => q.answered && q.correct === false);
  }

  // Collect all chapter OX items as a flat pool for the random-review feature.
  function getAllOxQuestions(chapters) {
    const out = [];
    (chapters || []).forEach((ch) => {
      if (!ch || !Array.isArray(ch.ox) || ch.ox.length === 0) return;
      const st = getOxState(ch.id);
      const ans = (st && Array.isArray(st.answers)) ? st.answers : [];
      ch.ox.forEach((q, idx) => {
        const a = ans[idx];
        out.push({
          chapterId: ch.id,
          chapterNum: ch.num,
          chapterTitle: ch.title,
          kind: "ox",
          idx,
          q: q.q,
          a: q.a,
          why: q.why,
          answered: a != null,
          chosen: a ? a.chosen : null,
          correct: a ? !!a.correct : null,
        });
      });
    });
    return out;
  }

  // Persist an OX answer back to chapter OX state (so chapter view reflects it).
  function setOxAnswer(chapterId, idx, chosen, correct) {
    const st = getOxState(chapterId) || { answers: [] };
    const answers = Array.isArray(st.answers) ? st.answers.slice() : [];
    answers[idx] = { chosen, correct };
    setOxState(chapterId, { answers });
  }

  // OX-specific renderer used by renderQuestionCard when item.kind === "ox".
  function renderOxCard(parent, item, opts = {}) {
    const { mode = "interactive" } = opts;
    const card = document.createElement("section");
    card.className = "review-card review-card-ox";
    card.dataset.chapter = item.chapterId;
    card.dataset.kind = "ox";
    card.dataset.idx = String(item.idx);

    const head = document.createElement("header");
    head.className = "review-head";
    head.innerHTML = `
      <div class="review-eyebrow">
        <span class="review-chapter">${esc(item.chapterNum)} · ${esc(item.chapterTitle)}</span>
        <span class="review-kind">④ OX</span>
      </div>
      <h3 class="review-stage">Q${item.idx + 1}</h3>
    `;
    card.appendChild(head);

    const prompt = document.createElement("p");
    prompt.className = "review-prompt";
    prompt.textContent = item.q || "";
    card.appendChild(prompt);

    const btns = document.createElement("div");
    btns.className = "ox-buttons review-ox-buttons";
    const btnO = document.createElement("button");
    btnO.type = "button";
    btnO.className = "ox-btn ox-btn-o";
    btnO.innerHTML = "<span>O</span><small>참</small>";
    const btnX = document.createElement("button");
    btnX.type = "button";
    btnX.className = "ox-btn ox-btn-x";
    btnX.innerHTML = "<span>X</span><small>거짓</small>";
    btns.appendChild(btnO);
    btns.appendChild(btnX);
    card.appendChild(btns);

    const feedback = document.createElement("div");
    feedback.className = "ox-feedback review-ox-feedback";
    feedback.hidden = true;
    card.appendChild(feedback);

    const foot = document.createElement("footer");
    foot.className = "review-foot";
    foot.innerHTML = `
      <a href="#${item.chapterId}" class="review-gotolink small">
        → ${esc(item.chapterNum)}로 이동
      </a>
    `;
    card.appendChild(foot);

    let decided = false;
    function reveal(chosen) {
      if (decided && mode === "interactive") return;
      decided = true;
      const correct = chosen === item.a;
      btnO.classList.toggle("chosen", chosen === true);
      btnX.classList.toggle("chosen", chosen === false);
      const correctBtn = item.a === true ? btnO : btnX;
      const wrongBtn   = item.a === true ? btnX : btnO;
      correctBtn.classList.add("correct");
      if (chosen != null && chosen !== item.a) wrongBtn.classList.add("wrong");
      btnO.disabled = true; btnX.disabled = true;
      card.classList.add(correct ? "ox-correct" : "ox-wrong");
      feedback.hidden = false;
      feedback.innerHTML = `
        <p class="ox-verdict ${correct ? "ok" : "ng"}">
          ${correct ? "✓ 정답" : `✗ 오답 — 정답은 ${item.a ? "O (참)" : "X (거짓)"}`}
        </p>
        ${item.why ? `<p class="ox-why">${esc(item.why)}</p>` : ""}
      `;
      if (mode === "interactive") {
        // Persist back to chapter OX state so chapter view reflects the answer
        try { setOxAnswer(item.chapterId, item.idx, chosen, correct); } catch {}
        if (typeof opts.onAnswer === "function") {
          opts.onAnswer({ chosen, correct });
        }
      }
    }

    if (mode === "interactive") {
      btnO.addEventListener("click", () => reveal(true));
      btnX.addEventListener("click", () => reveal(false));
    } else {
      // view-only: show the user's prior answer if any, plus the correct one
      reveal(item.chosen);
    }

    parent.appendChild(card);
    return card;
  }

  // Render a single question card in "review" mode:
  //   - view: shows the prompt, the user's wrong answer (if any), the correct choice, and all explanations.
  //   - interactive: shows choices as clickable buttons; on click, reveals correctness + all explanations.
  function renderQuestionCard(parent, item, opts = {}) {
    const { mode = "view" } = opts;
    if (item.kind === "ox") return renderOxCard(parent, item, opts);
    const card = document.createElement("section");
    card.className = `review-card review-card-${item.kind}`;
    card.dataset.chapter = item.chapterId;
    card.dataset.algo = item.algoId;
    card.dataset.kind = item.kind;
    card.dataset.stepIdx = String(item.stepIdx);

    const kindLabel = item.kind === "proof" ? "② 증명" : "③ 실행 추적";
    const stageLabel = item.step.stage ? esc(item.step.stage) : `Step ${item.stepIdx + 1}`;

    const head = document.createElement("header");
    head.className = "review-head";
    head.innerHTML = `
      <div class="review-eyebrow">
        <span class="review-chapter">${esc(item.chapterNum)} · ${esc(item.chapterTitle)}</span>
        <span class="review-kind">${kindLabel}</span>
      </div>
      <h3 class="review-stage">${stageLabel}</h3>
      <p class="review-algo muted small">${esc(item.algoName)}</p>
    `;
    card.appendChild(head);

    const prompt = document.createElement("p");
    prompt.className = "review-prompt";
    prompt.textContent = item.step.prompt || "";
    card.appendChild(prompt);

    const choices = item.step.choices || [];

    if (mode === "view") {
      // Show all choices with correctness markers + explanations
      const list = document.createElement("ol");
      list.className = "review-choices";
      choices.forEach((ch, ci) => {
        const li = document.createElement("li");
        const isCorrect = !!ch.correct;
        const wasChosen = item.chosen === ci;
        li.className = [
          "review-choice",
          isCorrect ? "review-correct" : "",
          wasChosen ? "review-chosen" : "",
          wasChosen && !isCorrect ? "review-wrong" : "",
        ].filter(Boolean).join(" ");
        const mark = isCorrect ? "✓" : wasChosen ? "✗" : "·";
        li.innerHTML = `
          <div class="review-choice-row">
            <span class="review-mark">${mark}</span>
            <span class="review-choice-text">${esc(ch.text || "")}</span>
            ${wasChosen ? `<span class="review-chosen-tag">선택</span>` : ""}
          </div>
          ${ch.explain ? `<p class="review-explain">${esc(ch.explain)}</p>` : ""}
        `;
        list.appendChild(li);
      });
      card.appendChild(list);
    } else {
      // Interactive mode
      const list = document.createElement("ol");
      list.className = "review-choices interactive";
      let decided = false;
      choices.forEach((ch, ci) => {
        const li = document.createElement("li");
        li.className = "review-choice";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "review-choice-btn";
        btn.innerHTML = `<span class="review-mark">·</span><span class="review-choice-text">${esc(ch.text || "")}</span>`;
        btn.addEventListener("click", () => {
          if (decided) return;
          decided = true;
          list.querySelectorAll("li").forEach((el, i) => {
            const myCh = choices[i];
            const m = el.querySelector(".review-mark");
            if (myCh.correct) {
              el.classList.add("review-correct");
              if (m) m.textContent = "✓";
            }
            if (i === ci && !myCh.correct) {
              el.classList.add("review-wrong", "review-chosen");
              if (m) m.textContent = "✗";
            }
            if (i === ci && myCh.correct) {
              el.classList.add("review-chosen");
            }
            const exp = document.createElement("p");
            exp.className = "review-explain";
            exp.textContent = myCh.explain || "";
            el.appendChild(exp);
            const b = el.querySelector(".review-choice-btn");
            if (b) b.disabled = true;
          });
          if (typeof opts.onAnswer === "function") {
            opts.onAnswer({ chosen: ci, correct: !!ch.correct });
          }
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
      card.appendChild(list);
    }

    const foot = document.createElement("footer");
    foot.className = "review-foot";
    foot.innerHTML = `
      <a href="#${item.chapterId}" class="review-gotolink small">
        → ${esc(item.chapterNum)}로 이동
      </a>
    `;
    card.appendChild(foot);

    parent.appendChild(card);
    return card;
  }

  /* ---------- OX Quiz System ----------
     각 챕터에 ox: [{q, a: true|false, why}, ...] 배열을 넣으면
     챕터 본문 하단에 O/X 퀴즈 섹션이 렌더됨.
     저장 키: clrs:ox:${chapterId}, 값: {answers: [{chosen: bool, correct: bool}, ...]}
  */
  const OX_STORE_KEY = "clrs:ox:v1";
  function loadOxStore() {
    try { return JSON.parse(localStorage.getItem(OX_STORE_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveOxStore(s) {
    try { localStorage.setItem(OX_STORE_KEY, JSON.stringify(s)); } catch {}
  }
  function getOxState(chapterId) {
    return loadOxStore()[chapterId] || null;
  }
  function setOxState(chapterId, state) {
    const all = loadOxStore();
    if (state == null) delete all[chapterId];
    else all[chapterId] = state;
    saveOxStore(all);
    try {
      window.dispatchEvent(new CustomEvent("drill:progress-change", { detail: { key: `ox:${chapterId}` } }));
    } catch {}
  }

  function getOxProgress(chapterId, oxArr) {
    if (!Array.isArray(oxArr) || oxArr.length === 0) return null;
    const st = getOxState(chapterId);
    const answers = (st && Array.isArray(st.answers)) ? st.answers : [];
    return {
      done: answers.filter((a) => a != null).length,
      correct: answers.filter((a) => a && a.correct).length,
      total: oxArr.length,
    };
  }

  function mountOxQuiz(parent, chapter) {
    if (!chapter || !Array.isArray(chapter.ox) || chapter.ox.length === 0) return;
    const ox = chapter.ox;
    const cid = chapter.id;

    const section = document.createElement("section");
    section.className = "ox-section";
    const st = getOxState(cid);
    let answers = (st && Array.isArray(st.answers)) ? st.answers.slice() : new Array(ox.length).fill(null);

    const head = document.createElement("header");
    head.className = "ox-head";
    head.innerHTML = `
      <div>
        <p class="ox-eyebrow">④ OX 퀴즈</p>
        <h2 class="ox-title">이 챕터 빠르게 점검하기</h2>
        <p class="ox-sub muted small">각 명제가 참(O)인지 거짓(X)인지 고르세요. 답을 고르면 즉시 해설이 나옵니다.</p>
      </div>
      <div class="ox-scoreboard">
        <span class="ox-score-done" id="ox-done-${cid}">0</span>
        <span class="ox-score-divider">/</span>
        <span class="ox-score-total">${ox.length}</span>
        <span class="ox-score-label">진행</span>
        <span class="ox-score-correct" id="ox-correct-${cid}">0</span>
        <span class="ox-score-label">정답</span>
        <button type="button" class="btn btn-outline btn-sm ox-reset" data-cid="${cid}">재설정</button>
      </div>
    `;
    section.appendChild(head);

    const list = document.createElement("div");
    list.className = "ox-list";
    section.appendChild(list);

    function updateScore() {
      const done = answers.filter((a) => a != null).length;
      const correct = answers.filter((a) => a && a.correct).length;
      const doneEl = section.querySelector(`#ox-done-${cid}`);
      const corEl = section.querySelector(`#ox-correct-${cid}`);
      if (doneEl) doneEl.textContent = String(done);
      if (corEl) corEl.textContent = String(correct);
    }

    function renderItem(item, idx) {
      const card = document.createElement("article");
      card.className = "ox-card";
      const ans = answers[idx];
      if (ans) card.classList.add(ans.correct ? "ox-correct" : "ox-wrong");

      const num = document.createElement("span");
      num.className = "ox-num";
      num.textContent = `Q${idx + 1}`;
      card.appendChild(num);

      const body = document.createElement("div");
      body.className = "ox-body";

      const q = document.createElement("p");
      q.className = "ox-question";
      q.textContent = item.q;
      body.appendChild(q);

      const btns = document.createElement("div");
      btns.className = "ox-buttons";

      const btnO = document.createElement("button");
      btnO.type = "button";
      btnO.className = "ox-btn ox-btn-o";
      btnO.innerHTML = "<span>O</span><small>참</small>";

      const btnX = document.createElement("button");
      btnX.type = "button";
      btnX.className = "ox-btn ox-btn-x";
      btnX.innerHTML = "<span>X</span><small>거짓</small>";

      function choose(chosen) {
        const correct = chosen === item.a;
        answers[idx] = { chosen, correct };
        setOxState(cid, { answers });
        updateSR(`ox:${cid}:${idx}`, correct);
        paintAnswered();
      }
      btnO.addEventListener("click", () => choose(true));
      btnX.addEventListener("click", () => choose(false));

      btns.appendChild(btnO);
      btns.appendChild(btnX);
      body.appendChild(btns);

      const feedback = document.createElement("div");
      feedback.className = "ox-feedback";
      feedback.hidden = true;
      body.appendChild(feedback);

      function paintAnswered() {
        const a = answers[idx];
        if (!a) {
          btnO.classList.remove("chosen", "correct", "wrong", "disabled");
          btnX.classList.remove("chosen", "correct", "wrong", "disabled");
          btnO.disabled = false; btnX.disabled = false;
          feedback.hidden = true;
          card.classList.remove("ox-correct", "ox-wrong");
          return;
        }
        btnO.disabled = true; btnX.disabled = true;
        const correctBtn = item.a ? btnO : btnX;
        const wrongBtn = item.a ? btnX : btnO;
        correctBtn.classList.add("correct");
        wrongBtn.classList.add("wrong-option");
        if (a.chosen === true) btnO.classList.add("chosen");
        else btnX.classList.add("chosen");
        feedback.hidden = false;
        feedback.innerHTML = `
          <strong>${a.correct ? "✓ 정답" : "✗ 오답"}</strong>
          <span class="ox-answer">정답: ${item.a ? "O (참)" : "X (거짓)"}</span>
          ${item.why ? `<p class="ox-why">${esc(item.why)}</p>` : ""}
        `;
        card.classList.toggle("ox-correct", a.correct);
        card.classList.toggle("ox-wrong", !a.correct);
        updateScore();
      }

      paintAnswered();
      card.appendChild(body);
      list.appendChild(card);
    }

    ox.forEach((item, idx) => renderItem(item, idx));
    updateScore();

    // Reset button
    head.querySelector(".ox-reset").addEventListener("click", () => {
      if (!confirm(`이 챕터(${chapter.num})의 OX 응답 ${ox.length}개를 모두 초기화할까요?`)) return;
      answers = new Array(ox.length).fill(null);
      setOxState(cid, null);
      list.innerHTML = "";
      ox.forEach((item, idx) => renderItem(item, idx));
      updateScore();
    });

    parent.appendChild(section);
  }

  /* ---------- CLRS Exercises (연습 문제) ----------
     각 챕터에 exercises: [{num, q, hint, solution}, ...] 배열 추가 가능.
     본문 하단에 섹션으로 렌더, 토글로 힌트/해설 공개.
  */
  function mountExercises(parent, chapter) {
    if (!chapter || !Array.isArray(chapter.exercises) || chapter.exercises.length === 0) return;
    const sec = document.createElement("section");
    sec.className = "ex-section";
    sec.innerHTML = `
      <header class="ex-head">
        <p class="ex-eyebrow">⑤ CLRS 연습 문제</p>
        <h2 class="ex-title">교과서 원전 연습 문제</h2>
        <p class="ex-sub muted small">
          각 문제는 CLRS 3판의 연습문제 번호를 기준으로 합니다.
          힌트와 해설은 필요할 때 클릭해서 펼치세요.
        </p>
      </header>
      <ol class="ex-list"></ol>
    `;
    const list = sec.querySelector(".ex-list");
    chapter.exercises.forEach((ex) => {
      const li = document.createElement("li");
      li.className = "ex-item";
      li.innerHTML = `
        <div class="ex-row">
          <span class="ex-num">${esc(ex.num || "")}</span>
          <p class="ex-q">${esc(ex.q || "")}</p>
        </div>
        <div class="ex-actions">
          ${ex.hint ? `<button type="button" class="ex-btn" data-target="hint">💡 힌트</button>` : ""}
          ${ex.solution ? `<button type="button" class="ex-btn" data-target="sol">📖 해설</button>` : ""}
        </div>
        ${ex.hint ? `<div class="ex-reveal ex-hint" hidden>${esc(ex.hint)}</div>` : ""}
        ${ex.solution ? `<div class="ex-reveal ex-sol" hidden>${esc(ex.solution)}</div>` : ""}
      `;
      li.querySelectorAll(".ex-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.target;
          const el = li.querySelector(target === "hint" ? ".ex-hint" : ".ex-sol");
          if (!el) return;
          el.hidden = !el.hidden;
          btn.classList.toggle("active", !el.hidden);
        });
      });
      list.appendChild(li);
    });
    parent.appendChild(sec);
  }

  /* ---------- CLRS Problems (종합 문제) ----------
     각 챕터에 problems: [{num, title, q?, parts?, hint?, solution?}, ...] 배열.
     parts가 있으면 (a), (b), (c) 하위 문제 단위로 렌더.
     Exercises와 달리 맨 위에 제목, 그 아래 공통 지문 q, 그리고 하위 part들.
  */
  function mountProblems(parent, chapter) {
    if (!chapter || !Array.isArray(chapter.problems) || chapter.problems.length === 0) return;
    const sec = document.createElement("section");
    sec.className = "prob-section";
    sec.innerHTML = `
      <header class="prob-head">
        <p class="prob-eyebrow">⑥ CLRS Problems (종합 문제)</p>
        <h2 class="prob-title">교과서 장-말 종합 문제</h2>
        <p class="prob-sub muted small">
          각 Problem은 여러 하위 문항(a, b, c…)으로 구성됩니다.
          지문을 읽고 직접 고민한 뒤 힌트·해설을 펼쳐 확인하세요.
        </p>
      </header>
      <div class="prob-list"></div>
    `;
    const list = sec.querySelector(".prob-list");

    chapter.problems.forEach((p) => {
      const card = document.createElement("article");
      card.className = "prob-card";

      const num = `Problem ${p.num || ""}`;
      const heading = `
        <header class="prob-card-head">
          <span class="prob-num">${esc(num)}</span>
          ${p.title ? `<h3 class="prob-card-title">${esc(p.title)}</h3>` : ""}
        </header>
      `;
      card.innerHTML = heading;

      if (p.q) {
        const body = document.createElement("p");
        body.className = "prob-q";
        body.textContent = p.q;
        card.appendChild(body);
      }

      // Parts (a, b, c…)
      if (Array.isArray(p.parts) && p.parts.length > 0) {
        const partsList = document.createElement("ol");
        partsList.className = "prob-parts";
        p.parts.forEach((pt) => {
          const li = document.createElement("li");
          li.className = "prob-part";
          const label = esc(pt.label || "");
          li.innerHTML = `
            <div class="prob-part-row">
              <span class="prob-part-label">${label}.</span>
              <p class="prob-part-q">${esc(pt.q || "")}</p>
            </div>
            <div class="prob-part-actions">
              ${pt.hint ? `<button type="button" class="ex-btn" data-target="hint">💡 힌트</button>` : ""}
              ${pt.solution ? `<button type="button" class="ex-btn" data-target="sol">📖 해설</button>` : ""}
            </div>
            ${pt.hint ? `<div class="ex-reveal ex-hint" hidden>${esc(pt.hint)}</div>` : ""}
            ${pt.solution ? `<div class="ex-reveal ex-sol" hidden>${esc(pt.solution)}</div>` : ""}
          `;
          li.querySelectorAll(".ex-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
              const target = btn.dataset.target;
              const rev = li.querySelector(target === "hint" ? ".ex-hint" : ".ex-sol");
              if (!rev) return;
              rev.hidden = !rev.hidden;
              btn.classList.toggle("active", !rev.hidden);
              // 해설에 수식이 있으면 KaTeX 재렌더
              if (!rev.hidden && window.renderMath) window.renderMath(rev);
            });
          });
          partsList.appendChild(li);
        });
        card.appendChild(partsList);
      } else if (p.hint || p.solution) {
        // 단일 문제 — 전체 힌트/해설
        const actions = document.createElement("div");
        actions.className = "prob-actions";
        actions.innerHTML = `
          ${p.hint ? `<button type="button" class="ex-btn" data-target="hint">💡 힌트</button>` : ""}
          ${p.solution ? `<button type="button" class="ex-btn" data-target="sol">📖 해설</button>` : ""}
          ${p.hint ? `<div class="ex-reveal ex-hint" hidden>${esc(p.hint)}</div>` : ""}
          ${p.solution ? `<div class="ex-reveal ex-sol" hidden>${esc(p.solution)}</div>` : ""}
        `;
        actions.querySelectorAll(".ex-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const target = btn.dataset.target;
            const rev = actions.querySelector(target === "hint" ? ".ex-hint" : ".ex-sol");
            if (!rev) return;
            rev.hidden = !rev.hidden;
            btn.classList.toggle("active", !rev.hidden);
            if (!rev.hidden && window.renderMath) window.renderMath(rev);
          });
        });
        card.appendChild(actions);
      }

      list.appendChild(card);
    });

    parent.appendChild(sec);
  }

  // Record a drill answer into the SR store. storageKey looks like
  // "ch2:ins:proof" — split into [chapterId, algoId, kind] and combine
  // with step idx to form the canonical SR key.
  function recordDrillSR(storageKey, idx, correct) {
    if (!storageKey) return;
    const parts = storageKey.split(":");
    if (parts.length < 3) return;
    const [chapterId, algoId, kind] = parts;
    if (kind !== "proof" && kind !== "trace") return;
    updateSR(`${kind}:${chapterId}:${algoId}:${idx}`, correct);
  }

  /* ========================================================
     Spaced Repetition (SM-2 lite)
     Schedules drill questions by due date using a simplified
     SuperMemo-2 algorithm. Binary (correct/wrong) input maps to
     grades 4 / 1 respectively.
     Store key: clrs:sr:v1
     Entry: { lr: "YYYY-MM-DD", ivl: days, ef: 2.5, reps: N, lapses: N }
     ======================================================== */
  const SR_STORE_KEY = "clrs:sr:v1";
  const MS_PER_DAY = 24 * 3600 * 1000;

  function loadSRStore() {
    try { return JSON.parse(localStorage.getItem(SR_STORE_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveSRStore(s) {
    try { localStorage.setItem(SR_STORE_KEY, JSON.stringify(s)); } catch {}
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function daysBetween(isoA, isoB) {
    const a = new Date(isoA + "T00:00:00Z").getTime();
    const b = new Date(isoB + "T00:00:00Z").getTime();
    return Math.round((b - a) / MS_PER_DAY);
  }

  // Standardize question id across proof/trace/ox/exercise.
  function srKey(item) {
    if (item.kind === "ox") return `ox:${item.chapterId}:${item.idx}`;
    return `${item.kind}:${item.chapterId}:${item.algoId || "a"}:${item.stepIdx}`;
  }

  function getSRState(qid) {
    return loadSRStore()[qid] || null;
  }

  // Update on answer. `correct` = boolean; we treat the SM-2 grade as 4 (good)
  // for correct and 1 (fail) for wrong.
  function updateSR(qid, correct) {
    const store = loadSRStore();
    const cur = store[qid] || { lr: null, ivl: 0, ef: 2.5, reps: 0, lapses: 0 };
    const grade = correct ? 4 : 1;
    let { ivl, ef, reps, lapses } = cur;
    if (grade >= 3) {
      if (reps === 0) ivl = 1;
      else if (reps === 1) ivl = 3;
      else ivl = Math.max(1, Math.round(ivl * ef));
      reps += 1;
    } else {
      reps = 0; lapses += 1; ivl = 0;  // due immediately next session
    }
    ef = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (ef < 1.3) ef = 1.3;
    store[qid] = { lr: todayISO(), ivl, ef, reps, lapses };
    saveSRStore(store);
  }

  // Priority key: lower = more urgent.
  //   - never seen      → PR 0 (highest)
  //   - due today/overdue → PR 1 (sorted by overdue days descending)
  //   - last wrong       → PR 2
  //   - not due yet      → PR 3 (sorted by days-until-due ascending)
  function srPriority(state) {
    if (!state) return { p: 0, score: 0 };
    const today = todayISO();
    const daysSince = state.lr ? daysBetween(state.lr, today) : 0;
    const overdue = daysSince - (state.ivl || 0);
    if (overdue >= 0) return { p: 1, score: -overdue };  // more overdue first
    if (state.lapses > 0 && state.reps === 0) return { p: 2, score: 0 };
    return { p: 3, score: -overdue };                      // nearer due first
  }

  // Pick N questions using SR ordering, with tie-break random.
  function pickDueReview(all, limit = 10) {
    const scored = all.map((q) => {
      const st = getSRState(srKey(q));
      const pr = srPriority(st);
      return { q, pr, rand: Math.random() };
    });
    scored.sort((a, b) => a.pr.p - b.pr.p || a.pr.score - b.pr.score || a.rand - b.rand);
    return scored.slice(0, limit).map((x) => x.q);
  }

  function getDueCount(all) {
    return all.filter((q) => {
      const pr = srPriority(getSRState(srKey(q)));
      return pr.p <= 1;  // never seen or due/overdue
    }).length;
  }

  window.Drills = {
    mountForAlgorithm,
    mountOxQuiz,
    mountExercises,
    mountProblems,
    getAlgorithmProgress,
    getChapterProgress,
    getOxProgress,
    getAllQuestions,
    getAllOxQuestions,
    getWrongQuestions,
    renderQuestionCard,
    // spaced repetition
    srKey,
    updateSR,
    getSRState,
    pickDueReview,
    getDueCount,
  };
})();
