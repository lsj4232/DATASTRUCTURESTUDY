#!/usr/bin/env python3
"""Insert CLRS Problems (장-말 종합 문제) into content.js for Tier 1 chapters.

Each chapter's `problems: [...]` is inserted right before `    algorithms: [`
(after `ox:` and `exercises:` blocks if they already exist).

Problems use `$...$` / `$$...$$` delimiters which KaTeX renders at runtime.
"""
import re, sys
from pathlib import Path

# --- 문제 데이터 (CLRS 3rd ed. 장-말 Problems에서 엄선) ---
PROBLEMS = {
    "ch2": [
        {
            "num": "2-1",
            "title": "삽입 정렬을 작은 배열에 대해 합병 정렬과 결합",
            "q": "합병 정렬은 최악 $\\Theta(n \\lg n)$, 삽입 정렬은 최악 $\\Theta(n^2)$이지만, 작은 $n$에서는 삽입 정렬의 상수가 더 작다. "
                 "따라서 '수정된 합병 정렬'은 크기가 $k$ 이하인 부분 배열에 대해서는 삽입 정렬을 쓰고, 그보다 크면 합병을 수행한다.",
            "parts": [
                {"label": "a",
                 "q": "길이 $k$의 부분 배열 $n/k$개를 각각 삽입 정렬로 정렬하면 최악 시간이 $\\Theta(nk)$임을 보여라.",
                 "hint": "삽입 정렬은 크기 $k$에서 $\\Theta(k^2)$ 걸리고, 그런 부분 배열이 $n/k$개 있다.",
                 "solution": "각 부분 배열: $\\Theta(k^2)$. 총합: $\\Theta(k^2) \\cdot (n/k) = \\Theta(nk)$."},
                {"label": "b",
                 "q": "이 부분 배열들을 합병할 때 표준 합병 정렬의 합병 트리를 그대로 쓰면 $\\Theta(n \\lg(n/k))$임을 보여라.",
                 "hint": "리프가 $n/k$개인 합병 트리는 높이 $\\lg(n/k)$, 각 레벨의 총 합병 비용은 $\\Theta(n)$.",
                 "solution": "높이 $\\lg(n/k)$, 각 레벨 $\\Theta(n)$ → $\\Theta(n \\lg(n/k))$."},
                {"label": "c",
                 "q": "전체 수행 시간이 $\\Theta(nk + n \\lg(n/k))$가 된다. 표준 합병 정렬과 같은 점근 복잡도를 유지하려면 $k$를 $n$에 대해 어떻게 잡아야 하는가?",
                 "hint": "$\\Theta(n \\lg n)$을 유지하려면 $nk = O(n \\lg n)$, 즉 $k = O(\\lg n)$.",
                 "solution": "$k = \\Theta(\\lg n)$일 때 전체가 $\\Theta(n \\lg n)$. $k$가 커지면 $nk$ 항이 지배하여 더 나빠진다."},
                {"label": "d",
                 "q": "실제로 $k$를 어떻게 고르면 좋을지 설명하라.",
                 "hint": "이론적 한계와 상수 인자의 트레이드오프를 모두 고려.",
                 "solution": "삽입 정렬이 합병 정렬보다 빨라지는 임계점을 실측(보통 $k \\approx 10\\text{–}40$). 표준 라이브러리의 Timsort, introsort 등이 이 아이디어를 사용."},
            ],
        },
        {
            "num": "2-2",
            "title": "버블 정렬의 정확성",
            "q": "BUBBLESORT는 반복적으로 인접한 원소를 swap하는 정렬이다. 정확성을 루프 불변식으로 증명한다.",
            "parts": [
                {"label": "a",
                 "q": "정확성 증명에서 '출력이 입력 원소의 순열이다'를 따로 증명해야 하는 이유는?",
                 "solution": "정렬 알고리즘은 두 조건을 만족해야 한다: (1) 출력이 비내림차순, (2) 출력이 입력의 순열. 정렬 속성만 증명하면 입력 데이터를 버리고 새 정렬 배열을 반환하는 자명한 알고리즘도 '정렬'로 간주된다."},
                {"label": "b",
                 "q": "내부 루프의 불변식: '반복이 시작될 때 $A[j]$는 $A[j..n]$의 최솟값'. 이를 증명하라.",
                 "hint": "초기·유지·종료 3단계.",
                 "solution": "**초기**: $j=n$이면 $A[j..n] = \\{A[n]\\}$, 자명. **유지**: swap 조건 $A[j-1] > A[j]$일 때 교환 후 $A[j-1] = \\min(A[j-1..n])$. **종료**: $j=i+1$일 때 $A[i+1] = \\min(A[i+1..n])$."},
                {"label": "c",
                 "q": "외부 루프 불변식: '반복이 시작될 때 $A[1..i-1]$은 입력의 최소 $i-1$개 원소가 정렬된 상태로 배치되어 있다'. 증명하라.",
                 "solution": "내부 루프 종료 시 $A[i]$가 $A[i..n]$의 최솟값 → $A[1..i]$는 최소 $i$개 원소가 정렬된 상태. 반복적으로 적용."},
                {"label": "d",
                 "q": "BUBBLESORT의 최악 수행 시간을 구하고 삽입 정렬과 비교하라.",
                 "solution": "모든 경우 $\\Theta(n^2)$. 삽입 정렬은 최선 $\\Theta(n)$으로 더 낫다 (이미 정렬된 경우). 최악에서는 동일."},
            ],
        },
        {
            "num": "2-4",
            "title": "Inversions (반전)",
            "q": "$A[1..n]$의 서로 다른 두 인덱스 쌍 $(i,j)$가 $i < j$이고 $A[i] > A[j]$이면 '반전(inversion)'이라 한다.",
            "parts": [
                {"label": "a",
                 "q": "$\\{1,2,\\ldots,n\\}$의 어떤 순열이 반전 수를 최대로 가지는가? 그 수는?",
                 "solution": "완전 역순 $\\langle n, n-1, \\ldots, 1\\rangle$일 때 최대 $\\binom{n}{2} = n(n-1)/2$."},
                {"label": "b",
                 "q": "삽입 정렬의 수행 시간과 반전 수 사이의 관계는?",
                 "hint": "삽입 정렬은 각 원소를 올바른 위치로 옮기기 위해 여러 번 비교·shift를 수행.",
                 "solution": "삽입 정렬의 내부 while 루프가 수행되는 횟수는 정확히 반전 수 $I$와 같다. 따라서 수행 시간 $= \\Theta(n + I)$. 반전이 적으면 선형에 가깝다."},
                {"label": "c",
                 "q": "$\\Theta(n \\lg n)$ 시간에 반전 수를 세는 알고리즘을 설계하라.",
                 "hint": "수정된 합병 정렬 — 오른쪽에서 왼쪽 원소보다 작은 것을 만나면 '그 좌측에 남아있는 개수'만큼이 반전이다.",
                 "solution": "MERGE-SORT 변형: MERGE 단계에서 왼쪽 서브배열 $L$의 원소 $L[i]$가 $R[j]$보다 크면, 그 $L[i], L[i+1], \\ldots$ 전부가 $R[j]$와 반전. 카운트: $n_1 - i + 1$. 전체 $\\Theta(n \\lg n)$."},
            ],
        },
    ],
    "ch3": [
        {
            "num": "3-1",
            "title": "다항식의 점근적 거동",
            "q": "$p(n) = \\sum_{i=0}^{d} a_i n^i$에서 $a_d > 0$이고 $d$는 양의 상수라고 하자.",
            "parts": [
                {"label": "a", "q": "$k \\geq d$이면 $p(n) = O(n^k)$임을 보여라.",
                 "solution": "모든 $n \\geq 1$에 대해 $p(n) \\leq (\\sum |a_i|) \\cdot n^d \\leq (\\sum |a_i|) \\cdot n^k$. 상수 $c = \\sum |a_i|$로 성립."},
                {"label": "b", "q": "$k \\leq d$이면 $p(n) = \\Omega(n^k)$임을 보여라.",
                 "solution": "큰 $n$에 대해 $p(n) \\sim a_d n^d \\geq a_d n^k$."},
                {"label": "c", "q": "$k = d$이면 $p(n) = \\Theta(n^k)$임을 보여라.",
                 "solution": "(a)와 (b)를 결합: $p(n) = O(n^d) \\cap \\Omega(n^d) = \\Theta(n^d)$."},
                {"label": "d", "q": "$k > d$이면 $p(n) = o(n^k)$임을 보여라.",
                 "solution": "$\\lim_{n\\to\\infty} p(n)/n^k = \\lim a_d n^d/n^k = 0$ (지수 차이). 따라서 $o(n^k)$."},
                {"label": "e", "q": "$k < d$이면 $p(n) = \\omega(n^k)$임을 보여라.",
                 "solution": "$\\lim p(n)/n^k = \\infty$. 따라서 $\\omega(n^k)$."},
            ],
        },
        {
            "num": "3-2",
            "title": "상대적 점근 증가율",
            "q": "다음 표의 각 $(A, B)$ 쌍에 대해 $A = O(B)$, $A = o(B)$, $A = \\Omega(B)$, $A = \\omega(B)$, $A = \\Theta(B)$ 중 성립하는 것을 모두 표시하라.",
            "parts": [
                {"label": "a", "q": "$A = \\lg^k n$, $B = n^\\epsilon$ ($k, \\epsilon > 0$ 상수)",
                 "solution": "$\\lg^k n = o(n^\\epsilon)$. 따라서 $O$, $o$, 그리고 역으로 $B = \\Omega(A), \\omega(A)$. 즉 $A$는 $O(B), o(B)$."},
                {"label": "b", "q": "$A = n^k$, $B = c^n$ ($c > 1, k > 0$ 상수)",
                 "solution": "다항식은 지수보다 작다: $n^k = o(c^n)$. 따라서 $A = O(B), o(B)$."},
                {"label": "c", "q": "$A = \\sqrt{n}$, $B = n^{\\sin n}$",
                 "solution": "$n^{\\sin n}$은 $[n^{-1}, n^1]$ 사이에서 진동. 비교 불가 — $O, \\Omega$ 모두 성립 안 함."},
                {"label": "d", "q": "$A = 2^n$, $B = 2^{n/2}$",
                 "solution": "$2^n / 2^{n/2} = 2^{n/2} \\to \\infty$. 따라서 $A = \\omega(B), \\Omega(B)$."},
                {"label": "e", "q": "$A = n^{\\lg c}$, $B = c^{\\lg n}$ ($c > 0$ 상수)",
                 "solution": "$c^{\\lg n} = n^{\\lg c}$ (로그 항등식). 따라서 $A = \\Theta(B)$."},
                {"label": "f", "q": "$A = \\lg(n!)$, $B = \\lg(n^n)$",
                 "solution": "스털링: $\\lg(n!) = \\Theta(n \\lg n) = \\Theta(\\lg(n^n))$. 따라서 $\\Theta$ 성립."},
            ],
        },
        {
            "num": "3-4",
            "title": "점근적 표기법의 성질",
            "q": "$f, g$가 양의 함수일 때, 다음 명제의 참·거짓을 판단하고 참이면 증명, 거짓이면 반례.",
            "parts": [
                {"label": "a", "q": "$f(n) = O(g(n))$이면 $g(n) = O(f(n))$.",
                 "solution": "**거짓.** $f(n) = n$, $g(n) = n^2$: $f = O(g)$지만 $g \\ne O(f)$."},
                {"label": "b", "q": "$f(n) + g(n) = \\Theta(\\min(f(n), g(n)))$.",
                 "solution": "**거짓.** $f(n) = n$, $g(n) = n^2$: $\\min = n$, 합 $= n + n^2 = \\Theta(n^2)$, 그러나 $\\min = \\Theta(n)$. 서로 다름."},
                {"label": "c", "q": "$f(n) = O(g(n))$이면 $\\lg(f(n)) = O(\\lg(g(n)))$ ($f, g \\geq 1$, $\\lg g \\geq 1$)",
                 "solution": "**참.** $f \\leq c g$ → $\\lg f \\leq \\lg c + \\lg g \\leq 2 \\lg g$ (큰 $n$). 따라서 $\\lg f = O(\\lg g)$."},
                {"label": "d", "q": "$f(n) = O(g(n))$이면 $2^{f(n)} = O(2^{g(n)})$.",
                 "solution": "**거짓.** $f(n) = 2n$, $g(n) = n$: $f = O(g)$이지만 $2^{2n} = 4^n \\ne O(2^n)$."},
                {"label": "e", "q": "$f(n) = O((f(n))^2)$.",
                 "solution": "**거짓 in general.** $f(n) = 1/n$이면 $(f(n))^2 = 1/n^2 \\to 0$. $f$가 $1$ 이하면 반례. 단, $f \\geq 1$을 가정하면 참."},
                {"label": "f", "q": "$f(n) = O(g(n))$이면 $g(n) = \\Omega(f(n))$.",
                 "solution": "**참.** 전치 대칭 정리 (Transpose symmetry). $f \\leq c g$ ↔ $g \\geq (1/c) f$."},
                {"label": "g", "q": "$f(n) = \\Theta(f(n/2))$.",
                 "solution": "**거짓.** $f(n) = 2^n$: $f(n/2) = 2^{n/2}$. 비율 $2^{n/2} \\to \\infty$, 따라서 $\\Theta$ 아님."},
                {"label": "h", "q": "$f(n) + o(f(n)) = \\Theta(f(n))$.",
                 "solution": "**참.** $o(f)$는 $f$보다 훨씬 작아 무시 가능. $f + o(f) \\leq 2f$ 및 $\\geq f$."},
            ],
        },
    ],
    "ch4": [
        {
            "num": "4-1",
            "title": "점화식 예제 모음 — 마스터 정리 연습",
            "q": "다음 각 점화식의 점근적 상한을 구하라. 모든 $T(n)$은 충분히 작은 $n$에 대해 상수이다.",
            "parts": [
                {"label": "a", "q": "$T(n) = 2T(n/2) + n^4$",
                 "solution": "마스터 정리 Case 3: $f(n) = n^4$, $n^{\\log_2 2} = n$. $f = \\Omega(n^{1+\\epsilon})$, 정규조건 $2(n/2)^4 = n^4/8 \\leq c n^4$ 성립 → $T(n) = \\Theta(n^4)$."},
                {"label": "b", "q": "$T(n) = T(7n/10) + n$",
                 "solution": "$a=1, b=10/7$. $n^{\\log_{10/7} 1} = n^0 = 1$. $f(n) = n = \\Omega(n^{0+\\epsilon})$, 정규조건 $1 \\cdot (7n/10) = 0.7n \\leq cn$ 성립 → $T(n) = \\Theta(n)$."},
                {"label": "c", "q": "$T(n) = 16T(n/4) + n^2$",
                 "solution": "$n^{\\log_4 16} = n^2$. $f(n) = n^2 = \\Theta(n^2)$ → Case 2 → $T(n) = \\Theta(n^2 \\lg n)$."},
                {"label": "d", "q": "$T(n) = 7T(n/3) + n^2$",
                 "solution": "$n^{\\log_3 7} \\approx n^{1.77}$. $f(n) = n^2 = \\Omega(n^{\\log_3 7 + \\epsilon})$. 정규조건 $7(n/3)^2 = 7n^2/9 \\leq cn^2$ → Case 3 → $T(n) = \\Theta(n^2)$."},
                {"label": "e", "q": "$T(n) = 7T(n/2) + n^2$",
                 "solution": "$n^{\\log_2 7} \\approx n^{2.81}$. $f(n) = n^2 = O(n^{\\log_2 7 - \\epsilon})$ → Case 1 → $T(n) = \\Theta(n^{\\lg 7})$."},
                {"label": "f", "q": "$T(n) = 2T(n/4) + \\sqrt{n}$",
                 "solution": "$n^{\\log_4 2} = n^{1/2} = \\sqrt{n}$. $f(n) = \\Theta(\\sqrt{n})$ → Case 2 → $T(n) = \\Theta(\\sqrt{n} \\lg n)$."},
                {"label": "g", "q": "$T(n) = T(n-2) + n^2$",
                 "solution": "마스터 정리 적용 불가. 반복 대입: $T(n) = n^2 + (n-2)^2 + (n-4)^2 + \\ldots = \\Theta(n^3)$ (합을 직접 전개)."},
            ],
        },
        {
            "num": "4-5",
            "title": "Chip Testing (칩 검사)",
            "q": "Diogenes 교수는 동일하게 보이는 VLSI 칩 $n$개를 가지고 있는데, 반 이상(> n/2)이 '정상'임을 안다. "
                 "두 칩을 서로 테스트하는 장비가 있다: 양쪽 정상이면 둘 다 '정상' 보고, "
                 "둘 중 하나라도 불량이면 어느 보고든 신뢰 불가. 정상 칩 하나를 $O(n)$ 테스트로 찾는 알고리즘을 설계하라.",
            "parts": [
                {"label": "a",
                 "q": "정상 칩이 $\\lceil n/2 \\rceil$개 이하이면, 한 번의 페어 테스트만으로 구분할 수 없는 이유는?",
                 "solution": "정상이 절반 이하라면 'A, B 모두 정상 보고'는 '둘 다 정상' 또는 '둘 다 불량'을 모두 설명 가능. 과반 가정이 있어야 다수결 논리가 작동."},
                {"label": "b",
                 "q": "$\\lfloor n/2 \\rfloor$ 쌍으로 묶어 테스트하면, 양쪽이 '정상' 보고한 쌍에서 한 칩만 남기는 재귀적 방법을 고안하라.",
                 "hint": "쌍의 결과가 '둘 다 정상' 아닌 쌍은 둘 중 적어도 하나가 불량 → 둘 다 버림.",
                 "solution": "**알고리즘**: (1) $\\lfloor n/2 \\rfloor$개 쌍 구성, (2) 양쪽이 '정상' 보고한 쌍에서 한 개만 남김, (3) 그 외 쌍은 전부 폐기, (4) 남은 칩에 대해 재귀. 홀수면 한 개 남은 칩은 제외."},
                {"label": "c",
                 "q": "이 알고리즘이 정상 칩이 항상 과반 이상을 유지함을 증명하라. 그리고 $T(n) = T(n/2) + O(n) = O(n)$임을 보여라.",
                 "solution": "**과반 유지**: 각 '양쪽 정상' 쌍에서 남긴 칩 중 정상 칩의 비율 ≥ 원래 비율. 폐기된 쌍에서는 불량 칩이 정상보다 많이 빠짐(한쪽 이상 불량). → 남은 칩의 과반 정상. **시간**: $T(n) = T(n/2) + O(n) = O(n)$ (마스터 Case 3)."},
            ],
        },
    ],
    "ch6": [
        {
            "num": "6-1",
            "title": "삽입으로 힙 구축",
            "q": "BUILD-MAX-HEAP을 MAX-HEAP-INSERT의 반복 호출로 구현하는 대안을 고려하자.",
            "parts": [
                {"label": "a",
                 "q": "두 절차가 항상 같은 힙을 만드는가? 반례가 있으면 보여라.",
                 "solution": "**아니오.** 배열 $\\langle 1, 2, 3\\rangle$에 대해: BUILD-MAX-HEAP은 $\\langle 3, 2, 1\\rangle$ 생성. 삽입 방식은 $\\langle 3, 1, 2\\rangle$ 생성 (1 삽입 → 2 삽입 → 3 삽입 시 경로가 다름). 둘 다 유효한 최대 힙이지만 구조가 다르다."},
                {"label": "b",
                 "q": "최악의 경우, 삽입 방식의 수행 시간이 $\\Theta(n \\lg n)$임을 보여라.",
                 "hint": "역순 정렬된 입력에 대해 각 삽입이 $\\Omega(\\lg n)$까지 올라감.",
                 "solution": "입력 $\\langle 1, 2, 3, \\ldots, n\\rangle$: $i$번째 삽입 시 $\\lfloor \\lg i \\rfloor$번 비교 → 총 $\\sum_{i=1}^{n} \\lg i = \\Theta(n \\lg n)$. BUILD-MAX-HEAP의 $O(n)$보다 느리다."},
            ],
        },
        {
            "num": "6-2",
            "title": "$d$-진 힙 분석",
            "q": "$d$-ary 힙: 각 노드가 최대 $d$개 자식을 가진다 ($d=2$가 기본 이진 힙).",
            "parts": [
                {"label": "a",
                 "q": "$d$-ary 힙을 배열에 어떻게 표현하는가?",
                 "solution": "인덱스 $i$ (1-based)의 자식은 $d(i-1)+2, d(i-1)+3, \\ldots, d(i-1)+d+1 = di+1$. 부모는 $\\lfloor (i-2)/d \\rfloor + 1$."},
                {"label": "b",
                 "q": "$n$개 원소를 가진 $d$-ary 힙의 높이는 $\\Theta(\\log_d n)$임을 보여라.",
                 "solution": "$d$-ary 트리에서 높이 $h$의 노드 수 $\\leq \\sum_{i=0}^{h} d^i = (d^{h+1}-1)/(d-1)$. $n$개 담으려면 $d^h \\approx n$ → $h = \\Theta(\\log_d n)$."},
                {"label": "c",
                 "q": "EXTRACT-MAX의 복잡도는?",
                 "solution": "루트 추출 후 MAX-HEAPIFY. 각 레벨에서 $d$개 자식 중 최댓값 비교 → $O(d)$. 높이 $\\log_d n$ 레벨 → $O(d \\log_d n)$."},
                {"label": "d",
                 "q": "INSERT의 복잡도는?",
                 "solution": "마지막 위치 추가 후 부모와 비교하며 상향. 각 레벨 1회 비교. $O(\\log_d n)$."},
                {"label": "e",
                 "q": "INCREASE-KEY의 복잡도는?",
                 "solution": "INSERT와 동일한 상향 버블업 → $O(\\log_d n)$."},
            ],
        },
    ],
    "ch7": [
        {
            "num": "7-1",
            "title": "Hoare 분할 — 정확성",
            "q": "Hoare의 원래 분할 알고리즘은 양끝에서 시작해 서로 마주보는 방향으로 진행한다. "
                 "Lomuto와 달리 피벗의 최종 위치를 반환하지 않고 '파티션 경계'만 반환한다.",
            "parts": [
                {"label": "a",
                 "q": "HOARE-PARTITION이 항상 종료함을 보여라.",
                 "hint": "$i$와 $j$의 이동 범위 불변식.",
                 "solution": "매 반복에서 $i$는 증가, $j$는 감소. $i > j$가 되면 종료. 입력 배열이 유한하므로 종료 보장."},
                {"label": "b",
                 "q": "Hoare 파티션 분할 후 $A[p..j] \\leq A[j+1..r]$을 만족함을 증명하라.",
                 "solution": "**불변식**: (1) $A[k] \\leq x$ for $k \\in [p..i-1]$, (2) $A[k] \\geq x$ for $k \\in [j+1..r]$. 종료 시 $i > j$ → 이 두 구간이 전체. 따라서 $A[p..j] \\leq x \\leq A[j+1..r]$."},
                {"label": "c",
                 "q": "수정된 QUICKSORT를 Hoare-PARTITION으로 작성하라.",
                 "solution": "`QUICKSORT(A, p, r): if p < r: q = HOARE-PARTITION(A, p, r); QUICKSORT(A, p, q); QUICKSORT(A, q+1, r)`. Lomuto의 `QUICKSORT(A, p, q-1); QUICKSORT(A, q+1, r)`와 다름: 피벗이 첫 번째 재귀 호출에 '포함'됨."},
            ],
        },
        {
            "num": "7-4",
            "title": "Quicksort의 스택 깊이",
            "q": "재귀 QUICKSORT는 호출 스택을 $\\Theta(n)$까지 쓸 수 있다(최악). 스택을 $\\Theta(\\lg n)$로 제한하는 수정을 고안하라.",
            "parts": [
                {"label": "a",
                 "q": "재귀 대신 명시적 스택 + 꼬리 재귀 최적화로 어떻게 $O(\\lg n)$ 깊이를 달성할 수 있는가?",
                 "hint": "두 재귀 호출 중 '더 작은 쪽'을 먼저 스택에 푸시하고, '큰 쪽'은 tail call로 반복.",
                 "solution": "**수정 알고리즘**: while p < r: q = PARTITION(A, p, r); 더 작은 파티션을 재귀/스택에 맡기고, 큰 파티션에 대해 p, r 업데이트 후 반복. 최악 스택 깊이 $O(\\lg n)$ 보장 (항상 크기 절반 이하로 재귀)."},
                {"label": "b",
                 "q": "이 수정이 수행 시간 복잡도에 영향을 주는가?",
                 "solution": "**영향 없음.** 분할 자체의 일은 바뀌지 않음. 스택 깊이만 줄어든다. $\\Theta(n \\lg n)$ 평균 보장."},
            ],
        },
    ],
    "ch8": [
        {
            "num": "8-1",
            "title": "비교 정렬의 확률적 하한",
            "q": "결정 트리 모델을 확률적으로 확장: 각 내부 노드에서 임의로 두 분기를 선택할 수 있다고 하자.",
            "parts": [
                {"label": "a",
                 "q": "정렬 알고리즘이 '평균' $\\Omega(n \\lg n)$ 비교를 요구함을 증명하라 (모든 입력 순열이 동등 확률).",
                 "hint": "평균 경로 길이 = $\\Theta$(lg 리프 수).",
                 "solution": "결정 트리의 리프 수 $\\geq n!$. 평균 깊이 $\\geq \\lg(n!)/n! \\cdot n! = \\lg(n!) = \\Omega(n \\lg n)$. 엄밀히는 Jensen 부등식으로 평균 길이 $\\geq \\log_2(\\text{리프 수}) = \\Omega(n \\lg n)$."},
                {"label": "b",
                 "q": "랜덤화 알고리즘에도 동일한 하한이 적용됨을 보여라.",
                 "solution": "랜덤화 알고리즘은 '결정 트리의 분포'. 각 결정 트리에 대해 (a)의 하한 적용 → 기댓값도 $\\Omega(n \\lg n)$."},
            ],
        },
        {
            "num": "8-4",
            "title": "Water Jugs (물통 짝 맞추기)",
            "q": "각각 다른 부피를 가진 $n$개의 빨간 물통과 $n$개의 파란 물통이 있다. 각 빨간 물통은 정확히 하나의 파란 물통과 같은 부피. "
                 "빨간-파란 간 비교만 가능 (빨간-빨간, 파란-파란 불가). 짝을 맞춰라.",
            "parts": [
                {"label": "a",
                 "q": "각 빨간 물통을 모든 파란과 비교하는 단순 알고리즘의 비교 횟수는?",
                 "solution": "$\\Theta(n^2)$ — 각 빨간에 대해 $n$개 파란과 비교."},
                {"label": "b",
                 "q": "$\\Omega(n \\lg n)$ 하한을 보여라.",
                 "hint": "결정 트리: $n!$개의 가능한 짝 → $n! \\cdot 2^n$ (각 짝에 대해 순서도 미정)... 하지만 간단히는 $n!$개 짝만 고려.",
                 "solution": "짝 맞춤 결과는 $n!$개의 가능한 순열 중 하나 → 결정 트리 리프 수 $\\geq n!$ → 높이 $\\geq \\lg(n!) = \\Omega(n \\lg n)$."},
                {"label": "c",
                 "q": "랜덤화 퀵정렬 기반 $O(n \\lg n)$ 기대 시간 알고리즘을 고안하라.",
                 "hint": "한 파란 물통을 랜덤 피벗으로 잡고, 모든 빨간과 비교해 '피벗보다 작은/같은/큰'으로 분할.",
                 "solution": "**알고리즘**: (1) 파란 물통 하나 랜덤 선택 → 모든 빨간과 비교해 3분할 (작음/같음/큼). 빨간 피벗 짝 발견. (2) 찾은 빨간 피벗과 모든 파란 비교 → 파란도 3분할. (3) 작은 빨간끼리와 작은 파란끼리, 큰 쪽도 동일하게 재귀. 기대 시간 $O(n \\lg n)$ (랜덤 퀵정렬과 동일 분석)."},
            ],
        },
    ],
    "ch15": [
        {
            "num": "15-1",
            "title": "DAG에서의 최장 단순 경로",
            "q": "방향 간선에 음/양 가중치가 있는 DAG $G = (V, E)$와 정점 $s, t$가 주어진다. $s$에서 $t$로의 최장 경로를 동적 프로그래밍으로 $O(V+E)$에 구하라.",
            "parts": [
                {"label": "a",
                 "q": "부분 문제 정의와 점화식을 세워라.",
                 "solution": "$L(v) = v$에서 $t$로의 최장 경로 길이. $L(t) = 0$. $L(v) = \\max_{(v,w) \\in E} \\{w(v,w) + L(w)\\}$. DAG는 위상 정렬 후 역순 계산."},
                {"label": "b",
                 "q": "일반 그래프(사이클 가능)에서는 왜 DP가 통하지 않는가?",
                 "solution": "사이클이 있으면 최장 '단순' 경로는 NP-hard (해밀턴 경로 → 최장 경로 환원 가능). 부분 구조가 '단순성' 제약으로 깨짐."},
                {"label": "c",
                 "q": "$O(V+E)$ 구현을 서술하라.",
                 "solution": "(1) 위상 정렬 $O(V+E)$. (2) 역순으로 각 $v$에 대해 $L(v) = \\max\\{w(v,w) + L(w)\\}$ 계산 — 각 간선은 한 번씩 방문 → $O(V+E)$. 총 $O(V+E)$."},
            ],
        },
        {
            "num": "15-4",
            "title": "Printing Neatly (예쁘게 출력)",
            "q": "단어 $n$개를 줄당 최대 $M$자의 너비로 배치. 각 줄의 '남는 공간 수'의 세제곱 합을 최소화 (마지막 줄 제외).",
            "parts": [
                {"label": "a",
                 "q": "부분 문제와 점화식을 세워라.",
                 "solution": "$c(j) = $ 첫 $j$개 단어를 최적 배치할 때 비용. $c(0) = 0$. $c(j) = \\min_{i} \\{c(i-1) + cost(i, j)\\}$, $cost(i,j) = (M - \\sum \\text{단어 길이} - (j-i))^3$ (공백 수 포함)."},
                {"label": "b",
                 "q": "시간·공간 복잡도를 분석하라.",
                 "solution": "$n$개 하위 문제, 각각 $O(n)$ 선택 → $O(n^2)$. 공간 $O(n)$."},
            ],
        },
        {
            "num": "15-6",
            "title": "회사 파티 계획",
            "q": "회사가 트리 형태(상사-부하 관계). 각 직원은 '파티 재미 점수'를 가진다. 직원과 직속 상사가 동시에 참석하면 안 된다. "
                 "재미 총합을 최대화하라.",
            "parts": [
                {"label": "a",
                 "q": "부분 문제와 점화식을 세워라.",
                 "solution": "$f(v, 0) = v$ 불참 시 $v$ 서브트리 최대 재미. $f(v, 1) = v$ 참석 시. "
                           "$f(v, 0) = \\sum_{c} \\max(f(c,0), f(c,1))$. "
                           "$f(v, 1) = \\text{fun}(v) + \\sum_{c} f(c, 0)$."},
                {"label": "b",
                 "q": "복잡도는?",
                 "solution": "각 노드 $O(\\text{자식 수})$ — 전체 $O(n)$ 시간, $O(n)$ 공간."},
            ],
        },
    ],
    "ch16": [
        {
            "num": "16-1",
            "title": "Coin Changing (동전 교환)",
            "q": "액면 $c^0, c^1, c^2, \\ldots, c^k$의 동전 무한대. 금액 $n$을 최소 개수로 거슬러 주는 탐욕 알고리즘의 최적성을 분석하라.",
            "parts": [
                {"label": "a",
                 "q": "가장 큰 액면부터 탐욕적으로 선택하는 것이 이 동전 체계에서 최적임을 보여라.",
                 "hint": "어떤 최적 해도 작은 동전 $c$개 이상을 포함하면 하나의 큰 동전으로 교환 가능.",
                 "solution": "유도: $c^i$ 동전이 $c$개 이상이면 $c^{i+1}$ 한 개로 교환 가능 (동전 수 감소). 따라서 최적 해는 각 액면에 대해 $c$개 미만. 탐욕과 동일한 분포 유일."},
                {"label": "b",
                 "q": "동전 집합 $\\{1, 10, 25\\}$에서 탐욕이 최적이 아닌 예를 찾아라.",
                 "solution": "$n = 30$: 탐욕 $= 25 + 1 + 1 + 1 + 1 + 1 = 6$개. 최적 $= 10 + 10 + 10 = 3$개."},
                {"label": "c",
                 "q": "임의의 동전 집합에 대해 $O(nk)$ DP로 해결하라.",
                 "solution": "$f(n) = 1 + \\min_i f(n - c_i)$. Bottom-up: $n$까지 $k$개 액면 고려. $O(nk)$."},
            ],
        },
        {
            "num": "16-2",
            "title": "Scheduling to Minimize Avg Completion Time",
            "q": "단일 프로세서에서 작업 $J_1, \\ldots, J_n$이 처리 시간 $p_i$를 가진다. 작업 $i$의 완료 시간을 $C_i$라 할 때 "
                 "$\\sum C_i$를 최소화하는 순서는?",
            "parts": [
                {"label": "a",
                 "q": "SPT(Shortest Processing Time) 순으로 정렬하는 것이 최적임을 교환 논증으로 증명하라.",
                 "solution": "연속한 두 작업 $i, j$에서 $p_i > p_j$인데 $i$가 먼저라고 가정. 두 작업의 완료 시간 합 = $2s + 2p_i + p_j$. 순서 바꾸면 = $2s + 2p_j + p_i$. 차이 = $p_i - p_j > 0$ → 교환이 더 나음. 따라서 최적은 SPT 순."},
                {"label": "b",
                 "q": "릴리즈 시간($r_i$, 그 시각 이후에만 시작 가능)이 있으면 SPT가 최적이 아님을 반례로 보여라.",
                 "solution": "$J_1$: $r_1=0, p_1=10$. $J_2$: $r_2=1, p_2=1$. SPT(오름)로 $J_2$ 먼저 할 수도 있지만 $r_2=1$까지 기다려야 함. 최적 스케줄이 입력 의존적이 됨. (일반적으로 NP-hard.)"},
            ],
        },
    ],
    "ch17": [
        {
            "num": "17-1",
            "title": "Bit-Reversed Counter",
            "q": "$k$비트 카운터를 '비트 역순'으로 증가시키는 연산의 상환 비용을 분석하라.",
            "parts": [
                {"label": "a",
                 "q": "최하위 비트가 '최상위'처럼 작동하는 카운터. 단순 분석에서 최악 비용은?",
                 "solution": "일반 이진 카운터처럼 $\\Theta(k)$ 최악 (모든 비트가 뒤집히는 경우)."},
                {"label": "b",
                 "q": "집계 방법으로 분할상환 비용이 $O(1)$임을 보여라.",
                 "solution": "$n$회 증가 후 뒤집힌 총 비트 수 ≤ $2n$ (일반 이진 카운터와 동일). 분할상환 $O(1)$."},
            ],
        },
        {
            "num": "17-2",
            "title": "동적으로 크기 조정되는 해시 테이블",
            "q": "load factor $\\alpha$가 임계값(예: 1)에 도달하면 크기를 2배로 늘리는 해시 테이블. INSERT의 분할상환 비용을 분석하라.",
            "parts": [
                {"label": "a",
                 "q": "확장(rehash)은 $O(n)$이지만, 분할상환 $O(1)$임을 보여라.",
                 "solution": "포텐셜 $\\Phi = 2 \\cdot \\text{num} - \\text{size}$ (num ≥ size/2일 때). 정상 INSERT 실제 1, $\\Delta\\Phi = 2$ → 상환 3. 확장 INSERT 실제 $n+1$, $\\Delta\\Phi = 2 - n$ → 상환 3. $O(1)$."},
                {"label": "b",
                 "q": "축소(shrink)를 어떻게 해야 상환 $O(1)$을 유지하는가?",
                 "solution": "$\\alpha$가 $1/4$ 이하일 때 절반으로 축소 (1/2 아님!). $1/2$에서 축소하면 INSERT/DELETE 사이에서 계속 뒤집히며 $\\Omega(n)$ 상환 발생."},
            ],
        },
    ],
    "ch22": [
        {
            "num": "22-1",
            "title": "BFS로 간선 분류하기",
            "q": "방향 그래프에 BFS를 적용했을 때 간선 $(u,v)$를 어떻게 분류할 수 있는가?",
            "parts": [
                {"label": "a",
                 "q": "tree, back, forward, cross 중 어느 것이 가능하며, $u.d$와 $v.d$의 관계로 어떻게 구별하는가?",
                 "solution": "**Tree edge**: $v.d = u.d + 1$ (발견). **Cross edge**: $|u.d - v.d| \\leq 1$. **Back edge**: 방향 그래프에서 $u.d \\geq v.d$ 가능. **Forward edge**: BFS에서는 없음 (한 번에 확장)."},
                {"label": "b",
                 "q": "무방향 그래프에서는 어떻게 달라지는가?",
                 "solution": "무방향: **tree** 또는 **cross**만 존재. Back/Forward edge 없음 (BFS 레벨 차가 최대 1)."},
            ],
        },
        {
            "num": "22-2",
            "title": "Articulation Points, Bridges, Biconnected Components",
            "q": "무방향 연결 그래프 $G$에서 정점 $v$가 articulation point(제거 시 비연결)라면, DFS 트리에서 어떻게 감지할 수 있는가?",
            "parts": [
                {"label": "a",
                 "q": "DFS 트리의 루트가 articulation point인 조건은?",
                 "solution": "루트가 DFS 트리에서 **자식을 2개 이상** 가지면 articulation point (자식 서브트리들이 서로 back edge로 연결될 수 없음)."},
                {"label": "b",
                 "q": "비-루트 정점 $v$가 articulation point일 조건을 $v.d$와 $v$의 자식 $c$의 $c.low$(자식 서브트리에서 back edge로 도달 가능한 최소 $d$)로 표현하라.",
                 "solution": "$c.low \\geq v.d$인 자식 $c$가 존재 → $v$ 제거 시 $c$ 서브트리가 끊김 → $v$ articulation point."},
                {"label": "c",
                 "q": "bridge(제거 시 비연결되는 간선) 검출 조건은?",
                 "solution": "간선 $(u, v)$가 DFS tree edge이고 $v.low > u.d$이면 bridge. (자식 서브트리가 상위로 올라갈 다른 길 없음.)"},
                {"label": "d",
                 "q": "biconnected component를 $O(V+E)$에 찾는 알고리즘의 스케치는?",
                 "solution": "DFS + 간선 스택 유지. articulation point 발견 시 스택에서 해당 서브트리에 속한 간선을 pop → 하나의 biconnected component."},
            ],
        },
    ],
    "ch23": [
        {
            "num": "23-1",
            "title": "Second-Best MST (차선 신장 트리)",
            "q": "$G$의 고유한 최소 신장 트리 $T$와 '그 다음으로 가벼운' 신장 트리 $T'$를 찾아라.",
            "parts": [
                {"label": "a",
                 "q": "$T' \\ne T$이지만 $T$와 딱 하나의 간선만 다름을 보여라.",
                 "hint": "$T$에 간선 $e \\notin T$를 추가하면 사이클. 그 사이클에서 $T$의 간선 하나를 제거해 나온 트리가 후보.",
                 "solution": "$T$에서 $T'$로 간선 교환 과정. 최소 교환 = 1회 (둘 이상 다르면 단계별로 개선 가능해 중간에 $T'$보다 가벼운 트리 등장, 모순)."},
                {"label": "b",
                 "q": "$O(V^2)$ 시간 알고리즘을 설계하라.",
                 "solution": "**아이디어**: $T$의 모든 non-tree edge $(u,v)$에 대해 $T$에서 경로 $u \\to v$ 상 최대 간선 $e^*$를 찾고, 교환: $T' = T - e^* + (u,v)$. 모든 non-tree edge 중 $w(u,v) - w(e^*)$ 최소인 것을 택함. 전처리로 각 쌍 $u, v$에 대해 경로 최대 간선을 $O(V^2)$에 계산."},
            ],
        },
        {
            "num": "23-3",
            "title": "Bottleneck Spanning Tree",
            "q": "신장 트리 중 '최대 간선 가중치'를 최소화하는 트리를 bottleneck spanning tree라 한다.",
            "parts": [
                {"label": "a",
                 "q": "MST는 항상 bottleneck spanning tree임을 증명하라.",
                 "solution": "MST의 최대 간선 $e^*$를 제거하면 두 컴포넌트 $S, V\\setminus S$로 분리. 절단 정리에 의해 $e^*$는 그 절단의 경량 간선 → 어떤 신장 트리든 $S$와 $V\\setminus S$를 잇는 간선이 $w(e^*) \\geq$ 임 → bottleneck $\\geq w(e^*)$. MST는 이 하한 달성."},
                {"label": "b",
                 "q": "역은 성립하는가? (bottleneck spanning tree가 반드시 MST?)",
                 "solution": "**거짓.** bottleneck만 작으면 나머지 간선이 매우 무거울 수 있음. 총합은 MST보다 클 수 있다."},
                {"label": "c",
                 "q": "값 $b$에 대해 '모든 간선 $\\leq b$만 썼을 때 연결 그래프인가?' 문제를 $O(V+E)$에 판단하는 방법은?",
                 "solution": "간선 $\\leq b$만 남긴 부분 그래프에서 BFS/DFS로 연결성 검사. $O(V+E)$."},
            ],
        },
    ],
    "ch24": [
        {
            "num": "24-1",
            "title": "Yen's Improvement to Bellman-Ford",
            "q": "Bellman-Ford의 $|V|-1$ 반복을 절반으로 줄이는 Yen의 개선안. 각 반복에서 정점을 선형 순서대로 두 번 훑는다 (전진 + 후진).",
            "parts": [
                {"label": "a",
                 "q": "Yen의 알고리즘이 올바름을 증명하라 (모든 최단 경로를 $\\lceil (|V|-1)/2 \\rceil$ 반복으로 찾는다).",
                 "hint": "최단 경로의 간선을 순방향·역방향으로 분해.",
                 "solution": "정점을 $v_1, v_2, \\ldots, v_n$으로 번호 매긴 뒤, 각 간선 $(v_i, v_j)$를 $i < j$면 '순방향', $i > j$면 '역방향'으로 분류. 최단 경로를 번갈아 방향 교차하는 sub-path로 분해하면 한 방향당 완화가 한 번에 모든 sub-path에 적용 → 반복 수 절반."},
                {"label": "b",
                 "q": "실제 수행 시간 개선은?",
                 "solution": "점근적으로 동일 ($O(VE)$). 상수 상으로 약 2배 빠름."},
            ],
        },
        {
            "num": "24-3",
            "title": "Arbitrage (차익 거래)",
            "q": "$n$개 통화 간 환율 표 $R[i][j]$가 주어진다 (1 단위 $i$ → $R[i][j]$ 단위 $j$). "
                 "환 거래 체인으로 1 단위 $i$에서 시작해 $> 1$ 단위 $i$로 돌아오는 경로(차익)가 있는지 판정하라.",
            "parts": [
                {"label": "a",
                 "q": "이 문제를 최단 경로 / 음수 사이클 문제로 환원하라.",
                 "hint": "로그 변환.",
                 "solution": "간선 $i \\to j$에 가중치 $-\\log R[i][j]$ 부여. 체인 $i_0 \\to i_1 \\to \\ldots \\to i_k = i_0$의 총 가중치 $= -\\sum \\log R[i_{t},i_{t+1}] = -\\log \\prod R$. 차익 있음 $\\iff \\prod > 1 \\iff \\sum \\log > 0 \\iff$ 가중치 합 $< 0 \\iff$ **음수 사이클 존재**."},
                {"label": "b",
                 "q": "Bellman-Ford로 $O(n^3)$에 해결됨을 보여라.",
                 "solution": "간선 $n^2$개, BF $O(VE) = O(n \\cdot n^2) = O(n^3)$. 가상 출발점 $s$에서 모든 정점으로 가중치 0 간선을 추가해 한 번의 BF로 전체 음수 사이클 탐지."},
            ],
        },
    ],
}


def _js_str(s):
    """Escape for JS string literal (double-quoted)."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def _fmt_part(pt):
    lines = ['        {']
    lines.append(f'          label: {_js_str(pt["label"])},')
    lines.append(f'          q: {_js_str(pt["q"])},')
    if pt.get("hint"):
        lines.append(f'          hint: {_js_str(pt["hint"])},')
    if pt.get("solution"):
        lines.append(f'          solution: {_js_str(pt["solution"])},')
    lines.append('        }')
    return "\n".join(lines)


def _fmt_problem(p):
    lines = ['      {']
    lines.append(f'        num: {_js_str(p["num"])},')
    if p.get("title"):
        lines.append(f'        title: {_js_str(p["title"])},')
    if p.get("q"):
        lines.append(f'        q: {_js_str(p["q"])},')
    if p.get("parts"):
        lines.append('        parts: [')
        for pt in p["parts"]:
            lines.append(_fmt_part(pt) + ",")
        lines.append('        ],')
    if p.get("hint"):
        lines.append(f'        hint: {_js_str(p["hint"])},')
    if p.get("solution"):
        lines.append(f'        solution: {_js_str(p["solution"])},')
    lines.append('      }')
    return "\n".join(lines)


def make_block(cid):
    items = PROBLEMS.get(cid)
    if not items:
        return None
    lines = ["    problems: ["]
    for p in items:
        lines.append(_fmt_problem(p) + ",")
    lines.append("    ],")
    lines.append("")
    return "\n".join(lines)


def main():
    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    changes = 0
    out = []
    pos = 0
    pattern = re.compile(r'id: "([a-z0-9]+)"', re.M)
    while True:
        m = pattern.search(text, pos)
        if not m:
            out.append(text[pos:])
            break
        cid = m.group(1)
        if cid not in PROBLEMS:
            out.append(text[pos:m.end()])
            pos = m.end()
            continue
        # Insert problems block *before* algorithms: [
        alg_m = re.search(r"^    algorithms: \[", text[m.end():], re.M)
        if not alg_m:
            out.append(text[pos:m.end()])
            pos = m.end()
            continue
        alg_start = m.end() + alg_m.start()
        mid = text[m.end():alg_start]
        if "    problems: [" in mid:
            # already has problems
            out.append(text[pos:alg_start])
            pos = alg_start
            continue
        block = make_block(cid)
        out.append(text[pos:alg_start])
        out.append(block + "\n")
        pos = alg_start
        changes += 1

    path.write_text("".join(out), encoding="utf-8")
    print(f"Inserted problems into {changes} chapters.")


if __name__ == "__main__":
    main()
