/* =========================================================
   viz-core.js
   - 모든 시각화의 공통 프레임워크
   - Python insertion_sort_visual.py의 패턴을 JS+SVG로 포팅:
       1) 미리 모든 frame을 생성 (array state, colors, message, line, extras)
       2) Next/Prev로 frame 인덱스 이동
       3) pseudocode 라인 하이라이트 동기화
   - 각 알고리즘 visualizer는 { pseudocode, legend, build(input), render(frame, svg, ctx) }
     형태의 모듈을 반환
   ========================================================= */

(function () {
  "use strict";

  const PALETTE = {
    idle:    "#4d96ff",
    active:  "#ff6b6b",
    compare: "#fbbf24",
    done:    "#22c55e",
    pivot:   "#a855f7",
    ghost:   "#d4d4d4",
    edge:    "#94a3b8",
    edgeAct: "#ef4444",
    edgeTree: "#22c55e",
    gray:    "#94a3b8",
    black:   "#1f2937",
    white:   "#ffffff",
  };

  const VIZ_REGISTRY = {};

  function register(key, factory) {
    VIZ_REGISTRY[key] = factory;
  }

  function get(key) {
    return VIZ_REGISTRY[key];
  }

  // SVG helpers
  const SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) {
      if (attrs[k] == null) continue;
      el.setAttribute(k, attrs[k]);
    }
    return el;
  }
  function svgText(text, attrs = {}) {
    const el = svgEl("text", attrs);
    el.textContent = text;
    return el;
  }
  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }
  function makeSvg(width, height) {
    const svg = svgEl("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width: "100%",
      preserveAspectRatio: "xMidYMid meet",
    });
    return svg;
  }

  /**
   * Player
   * @param {Object} opts
   *   opts.panel   - root element (.viz-panel)
   *   opts.stage   - .viz-stage element (svg target)
   *   opts.step    - step counter element
   *   opts.message - message paragraph element
   *   opts.pseudo  - pseudocode container element
   *   opts.legend  - legend container element
   *   opts.progress- progress bar fill element
   *   opts.prev, opts.next, opts.play - buttons
   *   opts.close   - close button
   *   opts.title   - title element
   *   opts.eyebrow - eyebrow element
   *   opts.overlay - overlay element
   */
  class Player {
    constructor(opts) {
      this.opts = opts;
      this.viz = null;
      this.frames = [];
      this.idx = 0;
      this.playing = false;
      this.timer = null;
      this.bindEvents();
    }

    bindEvents() {
      const o = this.opts;
      o.next.addEventListener("click", () => this.next());
      o.prev.addEventListener("click", () => this.prev());
      o.play.addEventListener("click", () => this.togglePlay());
      o.close.addEventListener("click", () => this.close());
      o.overlay.addEventListener("click", (e) => {
        if (e.target === o.overlay) this.close();
      });
      o.stage.addEventListener("mousedown", (e) => {
        if (e.button === 0) this.next();
        else if (e.button === 2) this.prev();
      });
      o.stage.addEventListener("contextmenu", (e) => e.preventDefault());

      document.addEventListener("keydown", (e) => {
        if (o.overlay.hidden) return;
        if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); this.next(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); this.prev(); }
        else if (e.key === "Escape") { this.close(); }
      });
    }

    open(vizKey, title, eyebrow) {
      const factory = get(vizKey);
      if (!factory) {
        this.openEmpty(vizKey, title, eyebrow);
        return;
      }
      this.viz = factory();
      this.frames = this.viz.build();
      this.idx = 0;
      this.opts.title.textContent = title || this.viz.title || "시각화";
      this.opts.eyebrow.textContent = eyebrow || "시각화";
      this.renderPseudo();
      this.renderLegend();
      this.renderEditInput();
      this.opts.overlay.hidden = false;
      document.body.style.overflow = "hidden";
      this.render();
    }

    /* Input edit: if the viz module exposes `editableInput`, mount a button
       on the control bar that prompts for a new input, re-runs viz.build(),
       and resets to frame 0. Schema:
         editableInput: {
           label:        "배열 (쉼표로 구분)",        // prompt label
           defaultValue: "16,4,10,14,7,9,3,2,8,1",   // initial text
           parse:        (text) => parsedInput,       // may throw on invalid
         }
       The viz's build() must accept the parsed input as its first argument
       (and produce sensible output when called with no arg). */
    renderEditInput() {
      // Locate the edit button mount slot (injected once per modal).
      const footer = this.opts.panel && this.opts.panel.querySelector(".viz-controls");
      if (!footer) return;
      let btn = footer.querySelector("#viz-edit-input");
      if (!this.viz || !this.viz.editableInput) {
        if (btn) btn.remove();
        return;
      }
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.id = "viz-edit-input";
        btn.className = "btn btn-ghost";
        btn.title = "입력 편집 (E)";
        btn.textContent = "✎ 입력 편집";
        footer.insertBefore(btn, footer.firstChild);
        btn.addEventListener("click", () => this.promptEditInput());
      }
    }

    promptEditInput() {
      if (!this.viz || !this.viz.editableInput) return;
      const ed = this.viz.editableInput;
      const current = this._userInputText || ed.defaultValue || "";
      const raw = window.prompt(ed.label || "새 입력:", current);
      if (raw == null) return;
      let parsed;
      try { parsed = ed.parse(raw); }
      catch (err) {
        window.alert("입력 오류: " + (err.message || err));
        return;
      }
      try {
        this.frames = this.viz.build(parsed);
        this._userInputText = raw;
        this.idx = 0;
        this.stopPlay();
        this.render();
      } catch (err) {
        window.alert("시각화 오류: " + (err.message || err));
      }
    }

    openEmpty(key, title, eyebrow) {
      this.viz = null;
      this.frames = [];
      this.idx = 0;
      this.opts.title.textContent = title || "준비 중";
      this.opts.eyebrow.textContent = eyebrow || "시각화";
      this.opts.step.textContent = "Step 0 / 0";
      this.opts.message.textContent = "이 알고리즘 시각화는 곧 추가됩니다.";
      this.opts.progress.style.width = "0%";
      this.opts.pseudo.innerHTML =
        '<p class="muted small" style="font-family:var(--font-sans);padding:8px">' +
        `'${key}' 시각화를 구현 중입니다. 이 알고리즘에 대한 설명은 챕터 본문을 참고하세요.` +
        "</p>";
      this.opts.legend.innerHTML = "";
      clearSvg(this.ensureStageSvg());
      const svg = this.opts.stage.querySelector("svg");
      const w = 600, h = 360;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      const g = svgEl("g");
      const rect = svgEl("rect", { x: 40, y: 40, width: w - 80, height: h - 80, rx: 12, fill: "#f5f5f4", stroke: "#e7e5e4" });
      const title2 = svgText("🚧 시각화 준비 중", { x: w / 2, y: h / 2 - 10, "text-anchor": "middle", "font-size": 20, fill: "#78716c", "font-family": "sans-serif" });
      const sub = svgText("본문의 의사코드를 따라 손으로 실행해 보세요.", { x: w / 2, y: h / 2 + 20, "text-anchor": "middle", "font-size": 14, fill: "#a8a29e", "font-family": "sans-serif" });
      g.appendChild(rect); g.appendChild(title2); g.appendChild(sub);
      svg.appendChild(g);
      this.opts.overlay.hidden = false;
      document.body.style.overflow = "hidden";
    }

    close() {
      this.stopPlay();
      this.toggleCelebration(false);
      this.opts.overlay.hidden = true;
      document.body.style.overflow = "";
    }

    next() {
      if (!this.frames.length) return;
      if (this.idx < this.frames.length - 1) {
        this.idx++;
        this.render();
      } else {
        this.stopPlay();
      }
    }
    prev() {
      if (!this.frames.length) return;
      if (this.idx > 0) {
        this.idx--;
        this.render();
      }
    }
    togglePlay() {
      if (this.playing) this.stopPlay();
      else this.startPlay();
    }
    startPlay() {
      if (!this.frames.length) return;
      this.playing = true;
      this.opts.play.textContent = "⏸ 일시정지";
      this.timer = setInterval(() => {
        if (this.idx >= this.frames.length - 1) {
          this.stopPlay();
          return;
        }
        this.idx++;
        this.render();
      }, 600);
    }
    stopPlay() {
      this.playing = false;
      this.opts.play.textContent = "▶ 자동 재생";
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }

    ensureStageSvg() {
      let svg = this.opts.stage.querySelector("svg");
      if (!svg) {
        svg = makeSvg(800, 420);
        this.opts.stage.appendChild(svg);
      }
      return svg;
    }

    toggleCelebration(show) {
      const el = document.getElementById("viz-celebrate");
      if (!el) return;
      if (show && el.hidden) {
        el.hidden = false;
        // Auto-hide after a moment so the underlying state is still inspectable
        if (this._celebrateTimer) clearTimeout(this._celebrateTimer);
        this._celebrateTimer = setTimeout(() => {
          el.style.transition = "opacity 400ms ease";
          el.style.opacity = "0";
          setTimeout(() => {
            el.hidden = true;
            el.style.opacity = "";
            el.style.transition = "";
          }, 420);
        }, 1300);
      } else if (!show) {
        if (this._celebrateTimer) { clearTimeout(this._celebrateTimer); this._celebrateTimer = null; }
        el.hidden = true;
        el.style.opacity = "";
        el.style.transition = "";
      }
    }

    render() {
      if (!this.viz || !this.frames.length) return;
      const frame = this.frames[this.idx];
      const n = this.frames.length;

      // Stage
      const svg = this.ensureStageSvg();
      clearSvg(svg);
      this.viz.render(frame, svg, { PALETTE, svgEl, svgText });

      // Step + message
      this.opts.step.textContent = `Step ${this.idx + 1} / ${n}`;
      this.opts.message.textContent = frame.msg || "";
      this.opts.progress.style.width = `${((this.idx + 1) / n) * 100}%`;

      // Peak-end celebration when reaching the final step
      const isFinal = this.idx === n - 1;
      this.toggleCelebration(isFinal);
      const progressEl = this.opts.progress.parentElement;
      if (progressEl) progressEl.classList.toggle("complete", isFinal);

      // Pseudo highlight
      const lines = this.opts.pseudo.querySelectorAll(".pseudo-line");
      lines.forEach((el, i) => el.classList.toggle("active", i === frame.line));

      // Active line scroll into view if needed
      const active = this.opts.pseudo.querySelector(".pseudo-line.active");
      if (active) {
        const pr = this.opts.pseudo.getBoundingClientRect();
        const ar = active.getBoundingClientRect();
        if (ar.top < pr.top || ar.bottom > pr.bottom) {
          active.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }

      // Boundary button states
      this.opts.prev.disabled = this.idx === 0;
      this.opts.next.disabled = this.idx === this.frames.length - 1;
    }

    renderPseudo() {
      const p = this.opts.pseudo;
      p.innerHTML = "";
      const lines = this.viz.pseudocode || [];
      lines.forEach((pair, i) => {
        const [code, comment] = Array.isArray(pair) ? pair : [pair, ""];
        const line = document.createElement("div");
        line.className = "pseudo-line clickable";
        line.dataset.line = i;
        line.title = "이 줄로 점프";
        line.innerHTML =
          `<span class="lineno">${i + 1}</span>` +
          `<span class="code">${escapeHtml(code)}</span>` +
          (comment ? `<span class="comment">${escapeHtml(comment)}</span>` : "");
        line.addEventListener("click", () => this.jumpToLine(i));
        p.appendChild(line);
      });
    }

    /** Jump to first frame whose line == lineIdx; if none, no-op. */
    jumpToLine(lineIdx) {
      if (!this.frames.length) return;
      const target = this.frames.findIndex((f) => f.line === lineIdx);
      if (target < 0) return;
      this.stopPlay();
      this.idx = target;
      this.render();
    }

    renderLegend() {
      const l = this.opts.legend;
      l.innerHTML = "";
      const items = this.viz.legend || [];
      items.forEach(({ color, label }) => {
        const sw = document.createElement("span");
        sw.className = "swatch";
        sw.innerHTML = `<i style="background:${color}"></i>${escapeHtml(label)}`;
        l.appendChild(sw);
      });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  /* =========================================================
     InlinePlayer — embedded next to chapter pseudocode
     - Self-contained DOM, multiple instances per page
     - Reuses registered viz factories (build/render/pseudocode)
     - Pseudo lines clickable → jump to first frame at that line
     ========================================================= */
  class InlinePlayer {
    constructor(container, vizKey, opts = {}) {
      const factory = get(vizKey);
      if (!factory) {
        container.innerHTML = `<p class="muted small" style="padding:8px">'${escapeHtml(vizKey)}' 시각화 미등록</p>`;
        return;
      }
      this.container = container;
      this.vizKey = vizKey;
      this.viz = factory();
      try { this.frames = this.viz.build(); }
      catch (err) {
        container.innerHTML = `<p class="muted small" style="padding:8px">시각화 빌드 실패: ${escapeHtml(err.message)}</p>`;
        return;
      }
      this.idx = 0;
      this.playing = false;
      this.timer = null;
      this.title = opts.title || this.viz.title || vizKey;
      this.mount();
      this.render();
    }

    mount() {
      this.container.classList.add("inline-viz");
      this.container.innerHTML = `
        <div class="inline-viz-header">
          <span class="inline-viz-title">▷ ${escapeHtml(this.title)}</span>
          <span class="inline-viz-hint muted small">의사코드 줄을 클릭하면 해당 단계로 이동</span>
        </div>
        <div class="inline-viz-body">
          <div class="inline-viz-pseudo viz-pseudo" aria-label="의사코드"></div>
          <div class="inline-viz-stage-wrap">
            <div class="inline-viz-stage"></div>
            <div class="inline-viz-status">
              <p class="inline-viz-step muted small">Step 0 / 0</p>
              <p class="inline-viz-msg small"></p>
            </div>
            <div class="inline-viz-controls">
              <button type="button" class="btn btn-outline btn-sm" data-act="prev" title="이전 단계">◀</button>
              <button type="button" class="btn btn-outline btn-sm" data-act="play" title="자동 재생">▶ 재생</button>
              <button type="button" class="btn btn-primary btn-sm" data-act="next" title="다음 단계">다음 ▶</button>
              <button type="button" class="btn btn-ghost btn-sm" data-act="reset" title="처음으로">↺</button>
            </div>
            <div class="inline-viz-legend"></div>
          </div>
        </div>
      `;
      this.pseudoEl = this.container.querySelector(".inline-viz-pseudo");
      this.stageEl = this.container.querySelector(".inline-viz-stage");
      this.stepEl = this.container.querySelector(".inline-viz-step");
      this.msgEl = this.container.querySelector(".inline-viz-msg");
      this.legendEl = this.container.querySelector(".inline-viz-legend");
      this.playBtn = this.container.querySelector('[data-act="play"]');

      // Make stage SVG
      this.svg = makeSvg(800, 380);
      this.stageEl.appendChild(this.svg);

      // Pseudocode (clickable)
      const lines = this.viz.pseudocode || [];
      lines.forEach((pair, i) => {
        const [code, comment] = Array.isArray(pair) ? pair : [pair, ""];
        const line = document.createElement("div");
        line.className = "pseudo-line clickable";
        line.dataset.line = i;
        line.title = "이 줄로 점프";
        line.innerHTML =
          `<span class="lineno">${i + 1}</span>` +
          `<span class="code">${escapeHtml(code)}</span>` +
          (comment ? `<span class="comment">${escapeHtml(comment)}</span>` : "");
        line.addEventListener("click", () => this.jumpToLine(i));
        this.pseudoEl.appendChild(line);
      });

      // Legend
      const items = this.viz.legend || [];
      items.forEach(({ color, label }) => {
        const sw = document.createElement("span");
        sw.className = "swatch";
        sw.innerHTML = `<i style="background:${color}"></i>${escapeHtml(label)}`;
        this.legendEl.appendChild(sw);
      });

      // Controls
      this.container.querySelectorAll("[data-act]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const act = btn.dataset.act;
          if (act === "prev") this.prev();
          else if (act === "next") this.next();
          else if (act === "play") this.togglePlay();
          else if (act === "reset") this.reset();
        });
      });

      // Click-to-advance on stage (left/right click)
      this.stageEl.addEventListener("mousedown", (e) => {
        if (e.button === 0) this.next();
        else if (e.button === 2) this.prev();
      });
      this.stageEl.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    jumpToLine(lineIdx) {
      const target = this.frames.findIndex((f) => f.line === lineIdx);
      if (target < 0) return;
      this.stopPlay();
      this.idx = target;
      this.render();
    }
    next() {
      if (this.idx < this.frames.length - 1) { this.idx++; this.render(); }
      else this.stopPlay();
    }
    prev() {
      if (this.idx > 0) { this.idx--; this.render(); }
    }
    reset() {
      this.stopPlay();
      this.idx = 0;
      this.render();
    }
    togglePlay() { this.playing ? this.stopPlay() : this.startPlay(); }
    startPlay() {
      if (!this.frames.length) return;
      this.playing = true;
      this.playBtn.textContent = "⏸ 멈춤";
      this.timer = setInterval(() => {
        if (this.idx >= this.frames.length - 1) { this.stopPlay(); return; }
        this.idx++;
        this.render();
      }, 700);
    }
    stopPlay() {
      this.playing = false;
      if (this.playBtn) this.playBtn.textContent = "▶ 재생";
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }

    render() {
      const frame = this.frames[this.idx];
      const n = this.frames.length;

      clearSvg(this.svg);
      this.viz.render(frame, this.svg, { PALETTE, svgEl, svgText });

      this.stepEl.textContent = `Step ${this.idx + 1} / ${n}`;
      this.msgEl.textContent = frame.msg || "";

      const lines = this.pseudoEl.querySelectorAll(".pseudo-line");
      lines.forEach((el, i) => el.classList.toggle("active", i === frame.line));
      const active = this.pseudoEl.querySelector(".pseudo-line.active");
      if (active) {
        const pr = this.pseudoEl.getBoundingClientRect();
        const ar = active.getBoundingClientRect();
        if (ar.top < pr.top || ar.bottom > pr.bottom) {
          active.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }

    destroy() {
      this.stopPlay();
      this.container.innerHTML = "";
      this.container.classList.remove("inline-viz");
    }
  }

  // Expose
  window.VizCore = {
    Player,
    InlinePlayer,
    register,
    get,
    PALETTE,
    svgEl,
    svgText,
    makeSvg,
    clearSvg,
    escapeHtml,
    /** First-line signature → vizKey, built lazily from VIZ_REGISTRY */
    buildPseudoIndex() {
      const idx = {};
      for (const key of Object.keys(VIZ_REGISTRY)) {
        try {
          const viz = VIZ_REGISTRY[key]();
          const lines = viz.pseudocode || [];
          if (!lines.length) continue;
          const first = (Array.isArray(lines[0]) ? lines[0][0] : lines[0]).trim();
          if (first) idx[first] = key;
        } catch {}
      }
      return idx;
    },
  };
})();
