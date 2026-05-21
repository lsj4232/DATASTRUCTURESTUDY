#!/usr/bin/env python3
"""
CLRS · 로컬 프록시 서버

목적
----
- web/ 디렉토리를 정적으로 서빙
- POST /api/ask  →  Anthropic Messages API로 전달
- API 키는 ANTHROPIC_API_KEY 환경변수에서만 읽음 (브라우저에 노출되지 않음)

실행 방법 (Windows / cmd.exe)
-----------------------------
    set ANTHROPIC_API_KEY=sk-ant-...
    python proxy.py

실행 방법 (PowerShell)
----------------------
    $env:ANTHROPIC_API_KEY = "sk-ant-..."
    python proxy.py

실행 방법 (bash / git-bash / WSL)
---------------------------------
    export ANTHROPIC_API_KEY=sk-ant-...
    python proxy.py

http://127.0.0.1:8765/ 에서 접속.

주의
----
- API 키는 절대 코드/파일에 하드코딩하지 마세요.
- 이 서버는 로컬 개발용이며, 외부에 노출하지 마세요.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Windows 콘솔이 cp949일 때도 한글/유니코드를 안전하게 출력
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
MODEL = os.environ.get("CLRS_MODEL", "claude-sonnet-4-6")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
MAX_TOKENS = 1500

WEB_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")

SYSTEM_BASE = (
    "당신은 CLRS(Introduction to Algorithms, Cormen 외) 교재의 한국어 알고리즘 튜터입니다. "
    "학생의 질문에 정확하고 간결하게 한국어로 답하세요. "
    "수식은 텍스트로 표현하고(Θ, O, Ω, ⌊⌋, lg 등), "
    "필요하면 짧은 의사코드를 코드 블록(```)에 넣어 보여주세요. "
    "현재 학생이 보고 있는 챕터의 맥락을 우선 고려하되, 다른 챕터와 자연스럽게 연결되면 짧게 언급해도 됩니다. "
    "학생이 헷갈릴 만한 부분은 작은 예시로 보여주세요. "
    "답변 길이는 보통 4~10문장 정도가 적절합니다."
)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_ROOT, **kwargs)

    def do_POST(self):  # noqa: N802 (BaseHTTPRequestHandler API)
        if self.path != "/api/ask":
            self.send_error(404, "Not found")
            return

        if not API_KEY:
            self._send_json(
                {"error": "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. 서버를 다시 시작하세요."},
                status=500,
            )
            return

        # Parse request body
        try:
            length = int(self.headers.get("content-length", "0"))
            raw = self.rfile.read(length) if length > 0 else b""
            body = json.loads(raw.decode("utf-8")) if raw else {}
        except Exception as e:
            self._send_json({"error": f"잘못된 요청 본문입니다: {e}"}, status=400)
            return

        question = (body.get("question") or "").strip()
        if not question:
            self._send_json({"error": "질문이 비어 있습니다."}, status=400)
            return
        if len(question) > 4000:
            self._send_json({"error": "질문이 너무 깁니다 (4000자 이하)."}, status=400)
            return

        ch = body.get("chapter") or {}
        ch_num = str(ch.get("num", "")).strip()
        ch_title = str(ch.get("title", "")).strip()
        ch_subtitle = str(ch.get("subtitle", "")).strip()
        ch_summary = str(ch.get("summary", "")).strip()

        chapter_block = ""
        if ch_title:
            chapter_block = (
                "\n\n--- 학생이 현재 보고 있는 챕터 ---\n"
                f"{ch_num} {ch_title}\n"
                f"{ch_subtitle}\n"
                f"{ch_summary}"
            )

        system = SYSTEM_BASE + chapter_block

        api_payload = {
            "model": MODEL,
            "max_tokens": MAX_TOKENS,
            "system": system,
            "messages": [{"role": "user", "content": question}],
        }

        try:
            req = urllib.request.Request(
                ANTHROPIC_URL,
                data=json.dumps(api_payload).encode("utf-8"),
                method="POST",
                headers={
                    "x-api-key": API_KEY,
                    "anthropic-version": ANTHROPIC_VERSION,
                    "content-type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8", errors="replace")
                err_json = json.loads(err_body)
                msg = err_json.get("error", {}).get("message") or err_body
            except Exception:
                msg = str(e)
            self._send_json({"error": f"Anthropic API 오류 ({e.code}): {msg}"}, status=502)
            return
        except urllib.error.URLError as e:
            self._send_json({"error": f"네트워크 오류: {e.reason}"}, status=502)
            return
        except Exception as e:
            self._send_json({"error": f"예상치 못한 오류: {e}"}, status=500)
            return

        # Extract text content
        answer = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                answer += block.get("text", "")

        usage = data.get("usage") or {}
        self._send_json({
            "answer": answer,
            "model": data.get("model", MODEL),
            "usage": {
                "input_tokens": usage.get("input_tokens"),
                "output_tokens": usage.get("output_tokens"),
            },
        })

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):  # noqa: A002
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")


def main():
    port = int(os.environ.get("PORT", "8765"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"CLRS server  →  http://127.0.0.1:{port}/")
    print(f"Static root  :  {WEB_ROOT}")
    print(f"Chat model   :  {MODEL}")
    if not API_KEY:
        print("[!] ANTHROPIC_API_KEY 환경변수가 설정되지 않아 /api/ask 호출이 실패합니다.")
    else:
        print("[OK] ANTHROPIC_API_KEY loaded.")
    print("Ctrl+C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
