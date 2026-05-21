"""
Insertion Sort 시각화
CLRS 의사코드 기반 Python 구현
클릭하면 다음 단계로 진행 + 의사코드 실행 줄 하이라이트
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Windows 한글 폰트 설정
plt.rcParams["font.family"] = "Malgun Gothic"
plt.rcParams["axes.unicode_minus"] = False

# CLRS 의사코드 + 주석
PSEUDOCODE = [
    ("INSERTION-SORT(A)",              ""),                          # 0
    ("  for j = 2 to A.length",        "// 두 번째 원소부터 순회"),   # 1
    ("    key = A[j]",                  "// 삽입할 원소 저장"),       # 2
    ("    i = j - 1",                   "// 비교 시작 위치"),         # 3
    ("    while i > 0 and A[i] > key",  "// key보다 큰 원소 찾기"),   # 4
    ("      A[i+1] = A[i]",            "// 오른쪽으로 한 칸 밀기"),   # 5
    ("      i = i - 1",                "// 왼쪽으로 이동"),          # 6
    ("    A[i+1] = key",               "// 빈자리에 key 삽입"),      # 7
]


def insertion_sort_visual(A):
    n = len(A)
    max_val = max(A)

    # 모든 프레임(단계)을 미리 생성: (배열, 색상, 메시지, 실행중인 줄 번호)
    frames = []

    def snapshot(arr, highlight_j=-1, highlight_i=-1, sorted_boundary=-1, msg="", code_line=-1):
        colors = []
        for idx in range(n):
            if idx == highlight_j:
                colors.append("#FF6B6B")
            elif idx == highlight_i:
                colors.append("#FFD93D")
            elif idx < sorted_boundary:
                colors.append("#6BCB77")
            else:
                colors.append("#4D96FF")
        frames.append((list(arr), colors, msg, code_line))

    # 초기 상태
    snapshot(A, msg="초기 배열  (클릭하면 다음 단계)", code_line=0)

    for j in range(1, n):
        # for j = 2 to A.length
        snapshot(A, highlight_j=j, sorted_boundary=j,
                 msg=f"j={j+1}: for 루프 진입", code_line=1)

        key = A[j]
        # key = A[j]
        snapshot(A, highlight_j=j, sorted_boundary=j,
                 msg=f"key = A[{j+1}] = {key}", code_line=2)

        i = j - 1
        # i = j - 1
        snapshot(A, highlight_j=j, sorted_boundary=j,
                 msg=f"i = {j+1} - 1 = {i+1}", code_line=3)

        while i >= 0 and A[i] > key:
            # while i > 0 and A[i] > key
            snapshot(A, highlight_j=j, highlight_i=i, sorted_boundary=j,
                     msg=f"i={i+1}: A[{i+1}]={A[i]} > key={key} → 조건 참", code_line=4)

            # A[i+1] = A[i]
            A[i + 1] = A[i]
            snapshot(A, highlight_j=j, highlight_i=i, sorted_boundary=j,
                     msg=f"A[{i+2}] = A[{i+1}] = {A[i]}", code_line=5)

            # i = i - 1
            i -= 1
            snapshot(A, highlight_j=j, sorted_boundary=j,
                     msg=f"i = i - 1 = {i+1}", code_line=6)

        # while 조건 거짓 (루프 탈출 시)
        if j > 0:
            if i < 0:
                reason = f"i={i+1} < 1 → 조건 거짓, 루프 종료"
            else:
                reason = f"A[{i+1}]={A[i]} ≤ key={key} → 조건 거짓, 루프 종료"
            snapshot(A, highlight_j=j, sorted_boundary=j,
                     msg=reason, code_line=4)

        # A[i+1] = key
        A[i + 1] = key
        snapshot(A, highlight_j=i + 1, sorted_boundary=j + 1,
                 msg=f"A[{i+2}] = key = {key}  삽입 완료", code_line=7)

    # 최종 결과
    snapshot(A, sorted_boundary=n, msg="정렬 완료!", code_line=-1)

    # --- 시각화 ---
    fig = plt.figure(figsize=(16, 7))

    # 왼쪽: 막대 그래프, 오른쪽: 의사코드
    ax_bar = fig.add_axes([0.04, 0.12, 0.45, 0.78])
    ax_code = fig.add_axes([0.52, 0.12, 0.46, 0.78])

    state = {"idx": 0}

    def render(frame_idx):
        ax_bar.clear()
        ax_code.clear()

        arr, colors, msg, code_line = frames[frame_idx]

        # === 왼쪽: 막대 그래프 ===
        bars = ax_bar.bar(range(n), arr, color=colors, edgecolor="white", linewidth=1.5)

        for idx, (bar, val) in enumerate(zip(bars, arr)):
            ax_bar.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.3,
                        str(val), ha="center", va="bottom", fontsize=14, fontweight="bold")

        legend_items = [
            patches.Patch(color="#6BCB77", label="정렬 완료"),
            patches.Patch(color="#FF6B6B", label="key (삽입할 원소)"),
            patches.Patch(color="#FFD93D", label="비교 중"),
            patches.Patch(color="#4D96FF", label="미정렬"),
        ]
        ax_bar.legend(handles=legend_items, loc="upper right", fontsize=9)

        step_text = f"[Step {frame_idx + 1}/{len(frames)}]"
        ax_bar.set_title(f"Insertion Sort 시각화\n{step_text}  {msg}",
                         fontsize=13, fontweight="bold", pad=12)
        ax_bar.set_xlim(-0.5, n - 0.5)
        ax_bar.set_ylim(0, max_val + 3)
        ax_bar.set_xticks(range(n))
        ax_bar.set_xticklabels([f"[{i+1}]" for i in range(n)], fontsize=11)
        ax_bar.set_ylabel("값", fontsize=12)

        if frame_idx < len(frames) - 1:
            ax_bar.text(0.5, -0.08, "좌클릭: 다음 단계  |  우클릭: 이전 단계",
                        transform=ax_bar.transAxes, ha="center", fontsize=10, color="gray")
        else:
            ax_bar.text(0.5, -0.08, "정렬이 완료되었습니다!",
                        transform=ax_bar.transAxes, ha="center", fontsize=10, color="green")

        # === 오른쪽: 의사코드 ===
        ax_code.set_xlim(0, 1)
        ax_code.set_ylim(0, 1)
        ax_code.axis("off")
        ax_code.set_title("의사코드", fontsize=13, fontweight="bold", pad=12)

        line_count = len(PSEUDOCODE)
        line_height = 0.08
        start_y = 0.92

        for i, (line, comment) in enumerate(PSEUDOCODE):
            y = start_y - i * line_height

            # 현재 실행 줄 하이라이트 배경
            if i == code_line:
                ax_code.add_patch(patches.FancyBboxPatch(
                    (0.01, y - 0.02), 0.97, line_height - 0.01,
                    boxstyle="round,pad=0.01",
                    facecolor="#FFEB3B", edgecolor="#FFC107", linewidth=1.5, alpha=0.7
                ))

            # 줄 번호
            ax_code.text(0.03, y + 0.015, f"{i+1}", fontsize=9, color="gray",
                         fontfamily="Consolas", va="center")

            # 코드 텍스트
            weight = "bold" if i == code_line else "normal"
            code_color = "#000000" if i == code_line else "#555555"
            ax_code.text(0.10, y + 0.015, line, fontsize=11, fontfamily="Consolas",
                         fontweight=weight, color=code_color, va="center")

            # 주석
            if comment:
                ax_code.text(0.95, y + 0.015, comment, fontsize=8,
                             color="#2E7D32", va="center", ha="right",
                             fontstyle="italic")

        # 화살표 표시
        if 0 <= code_line < line_count:
            arrow_y = start_y - code_line * line_height + 0.015
            ax_code.annotate("▶", xy=(0.0, arrow_y), fontsize=11, color="#E53935",
                             fontweight="bold", va="center")

        fig.canvas.draw()

    def on_click(event):
        if event.button == 1:
            if state["idx"] < len(frames) - 1:
                state["idx"] += 1
                render(state["idx"])
        elif event.button == 3:
            if state["idx"] > 0:
                state["idx"] -= 1
                render(state["idx"])

    fig.canvas.mpl_connect("button_press_event", on_click)

    render(0)
    plt.show()


if __name__ == "__main__":
    data = [5, 2, 4, 6, 1, 3]
    print(f"정렬 전: {data}")
    insertion_sort_visual(data)
    print(f"정렬 후: {data}")
