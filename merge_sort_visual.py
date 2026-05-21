"""
Merge Sort 시각화
CLRS 의사코드 기반 Python 구현
클릭하면 다음 단계로 진행 + 의사코드 실행 줄 하이라이트
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches

plt.rcParams["font.family"] = "Malgun Gothic"
plt.rcParams["axes.unicode_minus"] = False

# CLRS 의사코드 + 주석
SORT_CODE = [
    ("MERGE-SORT(A, p, r)",      ""),                   # 0
    ("  if p < r",                "// 원소가 2개 이상"),  # 1
    ("    q = floor((p+r)/2)",    "// 중간점 계산"),      # 2
    ("    MERGE-SORT(A, p, q)",   "// 왼쪽 절반 정렬"),   # 3
    ("    MERGE-SORT(A, q+1, r)", "// 오른쪽 절반 정렬"), # 4
    ("    MERGE(A, p, q, r)",     "// 합병"),             # 5
]

MERGE_CODE = [
    ("MERGE(A, p, q, r)",           ""),                  # 0
    ("  n1 = q-p+1, n2 = r-q",      "// 부분 배열 크기"), # 1
    ("  L[1..n1], R[1..n2] ← A",    "// 임시 배열 복사"), # 2
    ("  L[n1+1]=∞, R[n2+1]=∞",      "// 센티넬"),        # 3
    ("  i = 1, j = 1",              "// 인덱스 초기화"),   # 4
    ("  for k = p to r",            "// 합병 루프"),      # 5
    ("    if L[i] ≤ R[j]",          "// 비교"),           # 6
    ("      A[k]=L[i]; i=i+1",      "// 왼쪽에서 선택"),  # 7
    ("    else",                     ""),                  # 8
    ("      A[k]=R[j]; j=j+1",      "// 오른쪽에서 선택"), # 9
]


def merge_sort_visual(A):
    n = len(A)
    max_val = max(A)
    frames = []

    def make_colors(scope=None, left=None, right=None, merged=None):
        colors = []
        for idx in range(n):
            if merged and merged[0] <= idx <= merged[1]:
                colors.append("#6BCB77")   # 초록: 합병 완료
            elif left and left[0] <= idx <= left[1]:
                colors.append("#FF8A65")   # 주황: 왼쪽 절반
            elif right and right[0] <= idx <= right[1]:
                colors.append("#B39DDB")   # 보라: 오른쪽 절반
            elif scope and scope[0] <= idx <= scope[1]:
                colors.append("#4D96FF")   # 파랑: 현재 범위
            else:
                colors.append("#DDDDDD")   # 회색: 범위 밖
        return colors

    def snap(active, line, msg, **kw):
        frames.append((list(A), make_colors(**kw), msg, active, line))

    # 초기 상태
    snap(None, -1, "초기 배열  (클릭하면 다음 단계)", scope=(0, n - 1))

    def ms(p, r, depth=0):
        P, R1 = p + 1, r + 1  # 1-based 표시용

        snap('sort', 0, f"MERGE-SORT(A, {P}, {R1})  [깊이 {depth}]",
             scope=(p, r))

        if p < r:
            snap('sort', 1, f"{P} < {R1} → 분할 진행", scope=(p, r))

            q = (p + r) // 2
            Q = q + 1
            snap('sort', 2, f"q = floor(({P}+{R1})/2) = {Q}",
                 left=(p, q), right=(q + 1, r))

            snap('sort', 3, f"MERGE-SORT(A, {P}, {Q}) 호출",
                 left=(p, q), right=(q + 1, r))
            ms(p, q, depth + 1)

            snap('sort', 4, f"MERGE-SORT(A, {Q + 1}, {R1}) 호출",
                 left=(p, q), right=(q + 1, r))
            ms(q + 1, r, depth + 1)

            snap('sort', 5, f"MERGE(A, {P}, {Q}, {R1}) 호출",
                 left=(p, q), right=(q + 1, r))
            do_merge(p, q, r)
        else:
            snap('sort', 1, f"{P} = {R1} → 원소 1개, 반환", scope=(p, r))

    def do_merge(p, q, r):
        P, Q, R1 = p + 1, q + 1, r + 1
        n1 = q - p + 1
        n2 = r - q

        L = [A[p + i] for i in range(n1)] + [float('inf')]
        R_a = [A[q + 1 + j] for j in range(n2)] + [float('inf')]

        L_s = str([int(x) for x in L[:-1]])
        R_s = str([int(x) for x in R_a[:-1]])

        snap('merge', 2, f"L={L_s}, R={R_s}",
             left=(p, q), right=(q + 1, r))

        snap('merge', 4, f"i=1, j=1",
             left=(p, q), right=(q + 1, r))

        ii, jj = 0, 0
        for k in range(p, r + 1):
            K = k + 1
            li, rj = L[ii], R_a[jj]
            li_d = "∞" if li == float('inf') else str(int(li))
            rj_d = "∞" if rj == float('inf') else str(int(rj))

            if li <= rj:
                A[k] = int(li)
                snap('merge', 7,
                     f"k={K}: L[{ii+1}]={li_d} ≤ R[{jj+1}]={rj_d} → A[{K}]={li_d}",
                     merged=(p, k))
                ii += 1
            else:
                A[k] = int(rj)
                snap('merge', 9,
                     f"k={K}: L[{ii+1}]={li_d} > R[{jj+1}]={rj_d} → A[{K}]={rj_d}",
                     merged=(p, k))
                jj += 1

        snap(None, -1, f"MERGE 완료: A[{P}..{R1}] = {A[p:r+1]}",
             merged=(p, r))

    ms(0, n - 1)
    snap(None, -1, "정렬 완료!", merged=(0, n - 1))

    # ========== 시각화 ==========
    fig = plt.figure(figsize=(16, 8))
    ax_bar = fig.add_axes([0.04, 0.10, 0.42, 0.80])
    ax_code = fig.add_axes([0.50, 0.10, 0.48, 0.80])
    state = {"idx": 0}

    def draw_line(ax, idx, line, comment, y, lh, is_active):
        cy = y + lh * 0.35
        if is_active:
            ax.add_patch(patches.FancyBboxPatch(
                (0.01, y), 0.97, lh - 0.004,
                boxstyle="round,pad=0.004",
                facecolor="#FFEB3B", edgecolor="#FFC107", linewidth=1.5, alpha=0.7))
            ax.text(0.0, cy, "▶", fontsize=9, color="#E53935",
                    fontweight="bold", va="center")
        ax.text(0.03, cy, f"{idx+1}", fontsize=8,
                color="#333" if is_active else "gray", va="center")
        ax.text(0.08, cy, line, fontsize=9,
                fontweight="bold" if is_active else "normal",
                color="#000" if is_active else "#555", va="center")
        if comment:
            ax.text(0.97, cy, comment, fontsize=7, color="#2E7D32",
                    va="center", ha="right", fontstyle="italic")

    def render(fi):
        ax_bar.clear()
        ax_code.clear()
        arr, colors, msg, active, cl = frames[fi]

        # === 왼쪽: 막대 그래프 ===
        bars = ax_bar.bar(range(n), arr, color=colors, edgecolor="white", linewidth=1.5)
        for idx, (bar, val) in enumerate(zip(bars, arr)):
            ax_bar.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.3,
                        str(val), ha="center", va="bottom", fontsize=14, fontweight="bold")

        legend_items = [
            patches.Patch(color="#6BCB77", label="합병 완료"),
            patches.Patch(color="#FF8A65", label="왼쪽 절반"),
            patches.Patch(color="#B39DDB", label="오른쪽 절반"),
            patches.Patch(color="#4D96FF", label="현재 범위"),
            patches.Patch(color="#DDDDDD", label="범위 밖"),
        ]
        ax_bar.legend(handles=legend_items, loc="upper right", fontsize=8)

        ax_bar.set_title(f"Merge Sort 시각화\n[Step {fi+1}/{len(frames)}]  {msg}",
                         fontsize=12, fontweight="bold", pad=12)
        ax_bar.set_xlim(-0.5, n - 0.5)
        ax_bar.set_ylim(0, max_val + 3)
        ax_bar.set_xticks(range(n))
        ax_bar.set_xticklabels([f"[{i+1}]" for i in range(n)], fontsize=11)
        ax_bar.set_ylabel("값", fontsize=12)

        hint = "좌클릭: 다음  |  우클릭: 이전" if fi < len(frames) - 1 else "정렬이 완료되었습니다!"
        ax_bar.text(0.5, -0.06, hint, transform=ax_bar.transAxes,
                    ha="center", fontsize=10,
                    color="gray" if fi < len(frames) - 1 else "green")

        # === 오른쪽: 의사코드 ===
        ax_code.set_xlim(0, 1)
        ax_code.set_ylim(0, 1)
        ax_code.axis("off")

        lh = 0.040
        y = 0.96

        # -- MERGE-SORT 섹션 --
        ax_code.text(0.05, y, "MERGE-SORT", fontsize=11,
                     fontweight="bold", color="#1565C0")
        y -= lh * 0.7

        for i, (line, comment) in enumerate(SORT_CODE):
            y -= lh
            draw_line(ax_code, i, line, comment, y, lh,
                      active == 'sort' and i == cl)

        # -- 구분선 --
        y -= lh * 0.4
        ax_code.plot([0.03, 0.95], [y + lh * 0.3] * 2,
                     color="#BDBDBD", linewidth=0.8)
        y -= lh * 0.3

        # -- MERGE 섹션 --
        ax_code.text(0.05, y, "MERGE", fontsize=11,
                     fontweight="bold", color="#C62828")
        y -= lh * 0.7

        for i, (line, comment) in enumerate(MERGE_CODE):
            y -= lh
            draw_line(ax_code, i, line, comment, y, lh,
                      active == 'merge' and i == cl)

        fig.canvas.draw()

    def on_click(event):
        if event.button == 1 and state["idx"] < len(frames) - 1:
            state["idx"] += 1
            render(state["idx"])
        elif event.button == 3 and state["idx"] > 0:
            state["idx"] -= 1
            render(state["idx"])

    fig.canvas.mpl_connect("button_press_event", on_click)
    render(0)
    plt.show()


if __name__ == "__main__":
    data = [5, 2, 4, 6, 1, 3]
    print(f"정렬 전: {data}")
    merge_sort_visual(data)
    print(f"정렬 후: {data}")
