/* =========================================================
   ask.js — 챕터 하단 AI 질문 위젯
   - POST /api/ask 로 호출 (proxy.py가 ANTHROPIC_API_KEY로 forwarding)
   - 챕터 컨텍스트(num/title/subtitle/summary)를 함께 보냄
   UX:
   · Doherty       → 즉시 로딩 점 애니메이션
   · Recognition   → ⌘⏎ 단축키, 명확한 placeholder, 키 표시
   · 오류 복구     → 친절한 한국어 에러 메시지 + 재시도
   · 빈 상태       → 위젯 자체에 안내 문구
   ========================================================= */

(function () {
  "use strict";

  const { CHAPTERS } = window.__CLRS__ || {};
  if (!CHAPTERS) return;

  // localStorage 키: 챕터별 최근 Q&A 기록 (선택)
  const HISTORY_KEY = "clrs:ask:history";
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveHistory(h) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {}
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }
  function renderMd(text) {
    if (window.marked) {
      try { return marked.parse(text || ""); } catch {}
    }
    return `<p>${escapeHtml(text || "").replace(/\n/g, "<br>")}</p>`;
  }

  function el(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in props) {
      if (k === "class") e.className = props[k];
      else if (k === "html") e.innerHTML = props[k];
      else e.setAttribute(k, props[k]);
    }
    children.forEach((c) => e.appendChild(c));
    return e;
  }

  function createBubble(kind, html) {
    const wrap = document.createElement("div");
    wrap.className = `ask-msg ask-${kind}`;
    const bubble = document.createElement("div");
    bubble.className = "ask-bubble";
    bubble.innerHTML = html;
    wrap.appendChild(bubble);
    return { wrap, bubble };
  }

  function loadingBubble() {
    const wrap = document.createElement("div");
    wrap.className = "ask-msg ask-a";
    const bubble = document.createElement("div");
    bubble.className = "ask-bubble loading";
    bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    wrap.appendChild(bubble);
    return { wrap, bubble };
  }

  async function callAPI(question, chapter) {
    const resp = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, chapter }),
    });
    let data;
    try { data = await resp.json(); }
    catch { throw new Error(`서버 응답을 해석할 수 없습니다 (HTTP ${resp.status}).`); }
    if (data.error) throw new Error(data.error);
    return data;
  }

  /* ---------- 공개 API ---------- */
  window.AskAI = {
    mountChapter(container, chapterId) {
      const ch = CHAPTERS.find((c) => c.id === chapterId);
      if (!ch || !container) return;

      const widget = document.createElement("section");
      widget.className = "ask-widget";
      widget.setAttribute("aria-label", "AI 튜터에게 질문하기");

      widget.innerHTML = `
        <header class="ask-head">
          <div>
            <p class="ask-eyebrow">AI 튜터 · Claude</p>
            <h2>이 챕터에 대해 궁금한 것이 있나요?</h2>
            <p class="muted small ask-sub">
              현재 보고 있는 <strong>${escapeHtml(ch.num)} ${escapeHtml(ch.title)}</strong> 맥락이
              자동으로 함께 전달됩니다.
            </p>
          </div>
          <span class="ask-model muted small" data-tooltip="모델: claude-sonnet-4-6">claude-sonnet-4-6</span>
        </header>

        <div class="ask-body" role="log" aria-live="polite"></div>

        <form class="ask-form">
          <textarea class="ask-input" rows="2"
                    placeholder="예: BUILD-MAX-HEAP이 왜 O(n)인지 다시 설명해줘"
                    aria-label="질문 입력"></textarea>
          <div class="ask-actions">
            <span class="muted small">
              <kbd>⌘</kbd><kbd>↵</kbd> 보내기
            </span>
            <button type="button" class="btn btn-outline ask-clear" data-tooltip="대화 비우기">지우기</button>
            <button type="submit" class="btn btn-primary ask-send">질문 보내기</button>
          </div>
        </form>

        <p class="ask-foot muted small">
          ⓘ 답변은 <code>proxy.py</code>를 통해 Anthropic API로 전달됩니다.
          서버에 <code>ANTHROPIC_API_KEY</code>가 설정되어야 작동합니다.
        </p>
      `;

      container.appendChild(widget);

      const form = widget.querySelector(".ask-form");
      const input = widget.querySelector(".ask-input");
      const sendBtn = widget.querySelector(".ask-send");
      const clearBtn = widget.querySelector(".ask-clear");
      const body = widget.querySelector(".ask-body");

      // Restore previous history for this chapter
      const history = loadHistory();
      const past = history[ch.id] || [];
      past.forEach((m) => {
        const { wrap } = createBubble(m.role === "user" ? "q" : "a", m.role === "user" ? `<p>${escapeHtml(m.text)}</p>` : renderMd(m.text));
        body.appendChild(wrap);
      });

      // Cmd/Ctrl + Enter shortcut
      input.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          form.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });

      clearBtn.addEventListener("click", () => {
        body.innerHTML = "";
        const h = loadHistory();
        delete h[ch.id];
        saveHistory(h);
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q || sendBtn.disabled) return;

        // Add Q bubble
        const { wrap: qWrap } = createBubble("q", `<p>${escapeHtml(q)}</p>`);
        body.appendChild(qWrap);

        // Loading A
        const loading = loadingBubble();
        body.appendChild(loading.wrap);
        body.scrollTop = body.scrollHeight;

        input.value = "";
        sendBtn.disabled = true;
        sendBtn.textContent = "응답 기다리는 중…";

        try {
          const data = await callAPI(q, {
            num: ch.num,
            title: ch.title,
            subtitle: ch.subtitle,
            summary: ch.summary,
          });
          loading.bubble.classList.remove("loading");
          loading.bubble.innerHTML = renderMd(data.answer);

          // Save to history
          const h = loadHistory();
          h[ch.id] = (h[ch.id] || []).concat([
            { role: "user", text: q },
            { role: "assistant", text: data.answer },
          ]).slice(-12); // keep last 12 messages per chapter
          saveHistory(h);
        } catch (err) {
          loading.bubble.classList.remove("loading");
          loading.bubble.classList.add("error");
          loading.bubble.innerHTML = `⚠ ${escapeHtml(err.message || String(err))}`;
        } finally {
          sendBtn.disabled = false;
          sendBtn.textContent = "질문 보내기";
          body.scrollTop = body.scrollHeight;
          input.focus();
        }
      });
    },
  };
})();
