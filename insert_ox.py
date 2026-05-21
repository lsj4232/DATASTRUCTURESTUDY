#!/usr/bin/env python3
"""
Insert OX quiz arrays into each chapter of content.js.
Finds each chapter by `id: "chN"` marker and inserts `ox: [...]` before `algorithms: [`.
"""
import re
import sys
from pathlib import Path

OX_DATA = {
    "ch2": [
        ("Insertion Sort의 최악 시간 복잡도는 Θ(n²)이다.", True,  "역순 정렬 입력(n, n-1, ..., 1)에서 매 key를 앞으로 밀며 Θ(n²) 비교."),
        ("Merge Sort는 in-place 정렬이다.", False,                "Θ(n) 추가 배열이 필요하므로 in-place 아님."),
        ("Insertion Sort는 안정 정렬(stable sort)이다.", True,   "같은 key일 때 오른쪽 원소를 왼쪽으로 밀지 않으므로 상대 순서 유지."),
        ("루프 불변식 증명의 세 요소는 '초기화·유지·종료'이다.", True, "CLRS 2.1의 표준 구조. 각 단계가 필요."),
        ("Merge Sort의 최선·평균·최악 시간은 모두 Θ(n lg n)이다.", True, "입력과 무관하게 T(n)=2T(n/2)+Θ(n)이 Θ(n lg n)."),
        ("MERGE 연산에는 반드시 ∞ 센티넬(sentinel)이 필요하다.", False, "편의용이며, 경계 검사로 대체 가능."),
        ("Insertion Sort는 거의 정렬된 배열에서 Θ(n)으로 빠르다.", True, "내부 while이 평균 O(1)회 실행 → 전체 Θ(n)."),
        ("분할 정복 패러다임은 'Divide → Conquer → Combine' 세 단계이다.", True, "CLRS 2.3.1 정의. Merge Sort의 뼈대."),
        ("Insertion Sort의 공간 복잡도는 O(1)이다.", True, "제자리 정렬, 상수 추가 공간만 사용."),
        ("n=10 정렬에서 Insertion Sort가 Merge Sort보다 빠를 수 있다.", True, "작은 n에서 상수 인자가 작아 종종 빠름. 하이브리드 정렬(Timsort)이 활용."),
    ],
    "ch3": [
        ("f(n) = Θ(g(n)) ⟺ f(n) = O(g(n)) AND f(n) = Ω(g(n)).", True, "정의 자체. 상한과 하한이 동시에 성립."),
        ("lg(n!) = Θ(n lg n).", True, "스털링 근사로 유도되는 표준 결과."),
        ("2ⁿ은 n!보다 빠르게 증가한다.", False, "반대. n! > 2ⁿ for n ≥ 4."),
        ("o(g(n))과 ω(g(n))은 각각 엄격한 상한·하한이다.", True, "lim f/g = 0 (o), = ∞ (ω)."),
        ("충분히 큰 n에서 다항식 nᵏ가 지수 2ⁿ을 이긴다.", False, "지수가 어떤 다항식도 이긴다."),
        ("f = O(g) ⟺ g = Ω(f) (전치 대칭성).", True, "Theorem 3.1."),
        ("lg n과 log₁₀ n은 Θ 관계이다.", True, "상수배 차이 (log_a n = log_b n / log_b a)."),
        ("Θ 표기법은 반사성·대칭성·전이성을 모두 만족한다.", True, "동치 관계의 세 가지 속성 모두 성립."),
        ("다항식 p(n) = a_d·n^d + ... (a_d>0)에 대해 p(n) = Θ(n^d).", True, "최고차항이 지배."),
        ("f(n) = O(g(n))이면 f(n) = o(g(n))이다.", False, "O는 상한 허용(등호 가능), o는 엄격. 예: n = O(n)이지만 n ≠ o(n)."),
    ],
    "ch4": [
        ("T(n) = 2T(n/2) + n의 해는 Θ(n lg n) (Case 2).", True, "n^(log₂ 2) = n이고 f(n)=n=Θ(n) → Case 2."),
        ("Master Theorem은 모든 형태의 점화식에 적용된다.", False, "Case 2·3 사이의 '갭' 구간에선 적용 불가."),
        ("Strassen 알고리즘은 n×n 행렬 곱셈을 Θ(n^(lg 7))에 수행한다.", True, "7번 곱셈으로 2×2 블록 처리 → lg 7 ≈ 2.807."),
        ("T(n) = T(n−1) + n은 Master Theorem으로 풀 수 있다.", False, "형태가 aT(n/b)+f(n)이 아님. 합으로 풀어 Θ(n²)."),
        ("재귀 트리 방법은 해의 '추측'을 만드는 데 유용하다.", True, "CLRS 4.4. 이후 치환법으로 검증."),
        ("T(n) = 4T(n/2) + n²의 해는 Θ(n² lg n) (Case 2).", True, "n^(log₂ 4)=n²=f(n) → Case 2."),
        ("분할 정복 알고리즘은 반드시 Combine 단계가 비용이 있다.", False, "Quicksort는 분할이 곧 해결. Combine이 공짜."),
        ("치환법(Substitution Method)은 수학적 귀납법을 사용한다.", True, "추측한 해가 성립함을 귀납으로 증명."),
        ("Maximum Subarray 분할 정복 해법은 Θ(n lg n).", True, "좌/우/중간 세 경우 재귀."),
        ("T(n) = 3T(n/2) + n²은 마스터 정리 Case 3.", True, "n^(log₂ 3) ≈ n^1.58 < n² → f가 지배, 정규조건 성립 → Θ(n²)."),
    ],
    "ch6": [
        ("BUILD-MAX-HEAP의 최악 시간은 O(n)이다.", True, "높이 h 노드 수 ≤ n/2^(h+1)의 기하급수 합이 O(n)."),
        ("Heapsort는 안정 정렬(stable sort)이다.", False, "교환 시 같은 key의 상대 순서 보장 없음."),
        ("MAX-HEAPIFY는 O(lg n)이다.", True, "높이만큼 내려가며 상수 작업. h = ⌊lg n⌋."),
        ("n개 원소 힙의 높이는 ⌊lg n⌋이다.", True, "완전 이진 트리 높이."),
        ("이진 힙은 반드시 완전 이진 트리여야 한다.", False, "'거의 완전(nearly complete)' — 마지막 레벨은 왼쪽부터 채워짐."),
        ("1-indexed 배열에서 노드 i의 부모는 ⌊i/2⌋이다.", True, "CLRS 6.1 정의. 0-indexed면 (i-1)/2."),
        ("Heapsort는 in-place 정렬이다.", True, "배열 내부에서 교환만 하므로 O(1) 추가 공간."),
        ("최소 힙에서 최솟값은 항상 리프에 있다.", False, "루트가 최솟값 (min-heap property)."),
        ("우선순위 큐의 HEAP-EXTRACT-MAX는 O(lg n)이다.", True, "루트 제거 + MAX-HEAPIFY."),
        ("Heapsort의 최악 시간 복잡도는 O(n lg n)이다.", True, "BUILD O(n) + n번 EXTRACT O(lg n)."),
    ],
    "ch7": [
        ("Lomuto Partition은 O(n) 시간에 실행된다.", True, "p..r을 한 번 훑음."),
        ("Randomized Quicksort의 기대 시간은 O(n lg n).", True, "Theorem 7.3. 지시 변수 분석."),
        ("이미 정렬된 배열에 기본 Quicksort는 최선 O(n lg n)이다.", False, "최악 O(n²). 매번 0:(n-1) 분할."),
        ("PARTITION은 피벗을 최종 위치에 놓는다.", True, "이후 재귀에서 피벗은 이동하지 않음."),
        ("Quicksort는 안정 정렬이다.", False, "분할 과정에서 같은 key의 상대 순서가 깨질 수 있음."),
        ("Randomized Quicksort의 기대 비교 횟수는 2n·H_n = O(n lg n).", True, "지시 변수 X_{ij}로 유도."),
        ("9:1 불균형 분할에서도 Quicksort는 O(n lg n)을 유지한다.", True, "재귀 트리 깊이 log_{10/9} n = Θ(lg n)."),
        ("Quicksort의 재귀 스택 공간은 최악 O(lg n)이다.", False, "최악 O(n) (불균형 분할의 연속)."),
        ("두 원소 z_i와 z_j는 Quicksort 전체에서 최대 한 번 비교된다.", True, "피벗과 나머지만 비교하므로 한 쌍은 0~1회."),
        ("RANDOMIZED-PARTITION은 RANDOM(p,r)로 피벗을 선택한다.", True, "균등 무작위 피벗 이동 후 PARTITION 호출."),
    ],
    "ch8": [
        ("비교 기반 정렬의 최악 하한은 Ω(n lg n)이다.", True, "결정 트리의 리프 ≥ n! → 높이 ≥ lg(n!) = Ω(n lg n)."),
        ("Counting Sort는 안정 정렬이다.", True, "역순으로 배치하여 상대 순서 유지."),
        ("Radix Sort는 각 자릿수 정렬에 안정 정렬을 필요로 한다.", True, "상위 자리 처리 시 하위 순서 유지 필수."),
        ("Bucket Sort의 최악 시간은 Θ(n²)이다.", True, "모든 원소가 한 버킷에 몰릴 때."),
        ("Counting Sort는 비교 기반 정렬이다.", False, "원소 값으로 직접 인덱싱. 비교 없음."),
        ("Radix Sort는 MSD(최상위 자리부터)만 정확하다.", False, "LSD 방식이 표준. MSD는 구현 복잡."),
        ("Counting Sort의 공간 복잡도는 Θ(n+k).", True, "입력 n + 카운트 배열 k."),
        ("결정 트리 모델에선 리프 개수가 적어도 n!이다.", True, "각 순열이 하나 이상의 리프에 대응."),
        ("Radix Sort의 시간 복잡도는 Θ(d(n+k))이다.", True, "d = 자릿수, 각 pass Counting Sort."),
        ("Bucket Sort는 [0,1) 균등 분포 가정 하에서 기대 Θ(n).", True, "Theorem 8.7. E[Σn_i²] = Θ(n)."),
    ],
    "ch15": [
        ("DP 적용 조건은 '최적 부분 구조'와 '중복 부분 문제'이다.", True, "CLRS 15.3. 둘 다 필수."),
        ("Rod Cutting 나이브 재귀는 Θ(2ⁿ)이다.", True, "각 길이에서 분할/비분할 2지선다."),
        ("Matrix Chain Order의 시간은 O(n²)이다.", False, "O(n³). 3중 루프."),
        ("Top-down DP는 모든 부분 문제를 반드시 계산한다.", False, "메모이제이션은 필요한 것만 계산."),
        ("LCS의 시간 복잡도는 Θ(mn)이다.", True, "m×n 테이블 각 셀 O(1)."),
        ("분할 정복과 DP의 차이는 '부분 문제의 중복 여부'이다.", True, "분할 정복은 독립, DP는 중복."),
        ("DP는 반드시 Bottom-up으로만 구현된다.", False, "Top-down + 메모도 유효."),
        ("Matrix Chain의 점화식은 m[i,j] = min over k (m[i,k]+m[k+1,j]+pᵢ₋₁·pₖ·pⱼ)이다.", True, "CLRS 15.2 핵심 식."),
        ("Bottom-up DP는 모든 부분 문제를 크기 순으로 채운다.", True, "작은 → 큰 순서로 테이블 구성."),
        ("LCS 테이블에서 c[i,j]는 X[1..i]와 Y[1..j]의 LCS 길이다.", True, "CLRS 15.4 점화식."),
    ],
    "ch16": [
        ("Greedy 성공의 두 조건은 '탐욕 선택 성질'과 '최적 부분 구조'이다.", True, "CLRS 16.2."),
        ("Fractional Knapsack은 Greedy로 최적 해결.", True, "단위 가치 순 탐욕."),
        ("0-1 Knapsack도 Greedy로 최적 해결 가능하다.", False, "DP 필요. Greedy는 반례 존재."),
        ("Huffman 코드는 접두사 코드(prefix code)이다.", True, "어떤 코드도 다른 코드의 접두사가 아님."),
        ("Activity Selection의 최적 전략은 '종료 시간이 가장 빠른 활동 선택'이다.", True, "GREEDY-ACTIVITY-SELECTOR."),
        ("Greedy 알고리즘은 교환 논법(exchange argument)으로 증명 가능.", True, "최적 해의 선택을 Greedy 선택으로 교환."),
        ("Greedy는 모든 최적화 문제에 적용된다.", False, "탐욕 선택 성질을 만족해야 함."),
        ("Huffman은 최소 우선순위 큐로 O(n lg n)에 트리 구성.", True, "n-1번 EXTRACT-MIN + INSERT, 각 O(lg n)."),
        ("Huffman에서 빈도가 가장 낮은 두 문자는 트리의 가장 깊은 형제 리프가 된다.", True, "탐욕 선택 성질."),
        ("DP와 달리 Greedy는 하향식(top-down)으로 부분 문제를 줄인다.", True, "선택 후 더 작은 문제로 환원."),
    ],
    "ch17": [
        ("분할상환 분석은 '최악 연산'이 아닌 '연산 수열 평균'을 분석.", True, "CLRS 17. amortized vs worst-case per operation."),
        ("포텐셜 함수는 Φ(D_0)=0, Φ(D_i)≥0을 만족해야 한다.", True, "분할상환 ≥ 실제 비용 보장."),
        ("동적 테이블의 TABLE-INSERT는 분할상환 O(1)이다.", True, "Φ = 2·num-size로 ĉ≤3."),
        ("집계 분석(Aggregate)은 모든 연산 비용이 같음을 요구한다.", False, "총합 T(n)만 보면 됨. 개별 비용 달라도 무관."),
        ("회계 방법(Accounting)에서 누적 신용은 음수가 될 수 있다.", False, "항상 ≥ 0 유지."),
        ("포텐셜 방법의 분할상환 비용은 ĉᵢ = cᵢ + Φᵢ − Φᵢ₋₁.", True, "CLRS 17.3."),
        ("분할상환 O(1)은 최악 연산이 O(1)임을 의미한다.", False, "평균만 보장. 한 연산 최악은 O(n) 가능."),
        ("확장 배율 k>1이면 TABLE-INSERT 분할상환은 모두 O(1)이다.", True, "상수만 달라짐."),
        ("MULTIPOP 스택 연산은 분할상환 O(1)이다.", True, "CLRS 17.1. 한 원소는 push/pop 각 1번."),
        ("분할상환 분석과 확률적(randomized) 분석은 동일한 개념이다.", False, "서로 다름. 분할상환은 결정적 입력에도 적용."),
    ],
    "ch22": [
        ("BFS는 가중치 없는 그래프의 최단 경로를 찾는다.", True, "간선 수 기준 최단."),
        ("DFS의 시간 복잡도는 Θ(V+E)이다.", True, "인접 리스트 기준."),
        ("방향 그래프에 사이클 존재 ⟺ DFS에 back edge 존재.", True, "CLRS 22.3 Lemma."),
        ("DAG에서만 위상 정렬(Topological Sort)이 가능하다.", True, "사이클 있으면 순서 정의 불가."),
        ("BFS는 스택(stack)을 사용한다.", False, "큐(queue). DFS가 스택."),
        ("Kosaraju의 SCC 알고리즘은 DFS를 두 번 사용한다.", True, "원본 + 전치 그래프."),
        ("DFS의 괄호 정리에 따르면 [u.d, u.f]와 [v.d, v.f]는 항상 겹친다.", False, "겹치거나 완전 분리 중 하나."),
        ("SCC 요소 그래프 G^SCC는 항상 DAG이다.", True, "SCC의 최대성 때문에 사이클 불가."),
        ("BFS 트리는 최단 경로 트리이다.", True, "각 정점에서 s까지의 거리가 BFS 트리의 경로 길이."),
        ("DFS는 방향 그래프와 무방향 그래프 모두에서 정의된다.", True, "간선 분류가 약간 다를 뿐 알고리즘 동일."),
    ],
    "ch23": [
        ("Kruskal의 시간은 O(E lg V)이다.", True, "정렬 지배."),
        ("Prim은 BFS와 유사한 트리 확장 구조이다.", True, "현재 트리에서 인접 확장."),
        ("간선 가중치가 모두 다르면 MST는 유일하다.", True, "절단 정리의 유일성 결과."),
        ("n개 정점의 MST는 n-1개 간선을 가진다.", True, "트리의 기본 성질."),
        ("절단 정리(Cut Property)는 경량 간선이 안전함을 보장.", True, "Theorem 23.1."),
        ("Kruskal은 간선을 내림차순으로 선택한다.", False, "오름차순."),
        ("MST는 음수 간선에서도 정의된다.", True, "가중치 합이 최소인 트리 — 음수 OK."),
        ("피보나치 힙 기반 Prim은 O(E + V lg V).", True, "DECREASE-KEY O(1) amortized."),
        ("Kruskal은 사이클 검사를 위해 Union-Find를 사용한다.", True, "FIND-SET으로 두 끝점이 같은 컴포넌트인지 확인."),
        ("MST 문제는 무방향 연결 그래프에서 정의된다.", True, "비연결 그래프에서는 최소 신장 숲(spanning forest)."),
    ],
    "ch24": [
        ("Bellman-Ford는 음수 간선을 허용한다.", True, "음수 사이클도 감지."),
        ("Dijkstra는 음수 간선에서 항상 정확한 결과를 준다.", False, "탐욕 전제 깨짐."),
        ("DAG 최단 경로는 한 번의 완화 패스로 충분.", True, "위상 순서가 경로 완화 성질 제공."),
        ("Bellman-Ford의 시간은 O(VE)이다.", True, "|V|-1번 × 모든 간선."),
        ("RELAX(u,v,w)는 v.d > u.d + w이면 v.d를 갱신한다.", True, "CLRS 24.1 핵심 연산."),
        ("Dijkstra는 우선순위 큐를 사용한다.", True, "EXTRACT-MIN + DECREASE-KEY."),
        ("Bellman-Ford는 반드시 |V|번 반복해야 정확하다.", False, "|V|-1번으로 충분."),
        ("음수 사이클이 있으면 최단 경로 거리가 -∞로 정의된다.", True, "임의로 짧아질 수 있음."),
        ("경로 완화 성질(Path Relaxation)이 Bellman-Ford의 정확성의 핵심이다.", True, "|V|-1번 반복이 모든 최단 경로를 수렴시킴."),
        ("Dijkstra의 우선순위 큐 구현에 따라 시간 복잡도가 달라진다.", True, "배열 O(V²), 이진 힙 O((V+E) lg V), 피보나치 O(V lg V + E)."),
    ],
    "ch5": [
        ("지시 확률 변수 X_A에 대해 E[X_A] = Pr{A}이다.", True, "X_A가 0/1이므로 기댓값 = 사건 확률."),
        ("기댓값의 선형성(Linearity)은 독립성을 요구한다.", False, "종속이어도 E[X+Y]=E[X]+E[Y] 성립."),
        ("채용 문제에서 기대 채용 수는 H_n이다.", True, "Σ 1/i = H_n."),
        ("무작위 알고리즘은 입력 분포 가정이 필요 없다.", True, "난수가 알고리즘 내부에 있음."),
        ("H_n = ln n + O(1)은 Θ(lg n)이다.", True, "자연 로그와 이진 로그는 상수배 차이."),
        ("n명 후보 중 첫 번째는 항상 채용된다.", True, "가상 best=0보다 무조건 나음."),
        ("RANDOMIZED-HIRE-ASSISTANT는 먼저 입력을 무작위 섞는다.", True, "이후 결정적 버전 호출."),
        ("조화 급수 H_n은 n→∞에서 수렴한다.", False, "발산. ln n처럼 증가."),
        ("지시 확률 변수를 합치면 복잡한 분포의 기댓값을 '단순 확률의 합'으로 계산할 수 있다.", True, "핵심 기법. 분해하여 각 사건 확률만 계산."),
        ("생일 역설에서 23명이면 2명이 같은 생일일 확률 > 1/2이다.", True, "CLRS 5.4.1 예시."),
    ],
    "ch9": [
        ("RANDOMIZED-SELECT의 기대 시간은 O(n)이다.", True, "Theorem 9.1. 한쪽 재귀."),
        ("RANDOMIZED-SELECT의 최악 시간은 O(n)이다.", False, "O(n²). 극단 분할 반복."),
        ("결정적 SELECT(Blum et al.)는 최악 O(n)을 보장.", True, "중앙값의 중앙값 기법."),
        ("SELECT는 정렬 후 i번째 접근보다 점근적으로 빠르다.", True, "O(n) vs O(n lg n)."),
        ("SELECT는 분할 후 양쪽 모두 재귀한다.", False, "한쪽만."),
        ("SELECT에서 '중앙값의 중앙값' 피벗 선택은 분할 비율 3/10~7/10을 보장.", True, "Blum 알고리즘의 핵심."),
        ("i번째 순서 통계량은 반드시 전체 정렬을 거쳐야 구할 수 있다.", False, "SELECT가 정렬 없이 찾음."),
        ("RANDOMIZED-SELECT는 RANDOMIZED-PARTITION을 사용한다.", True, "Ch 7 Quicksort와 공유."),
        ("중앙값(median) 찾기는 순서 통계량 i = ⌈n/2⌉ 찾기와 동치이다.", True, "표준 정의."),
        ("SELECT는 분할 후 재귀 호출을 '더 큰 쪽'에서 한다.", False, "원하는 i가 속한 쪽(작거나 큰 쪽)에서. 크기와 무관."),
    ],
    "ch25": [
        ("Floyd-Warshall은 음수 간선을 처리한다.", True, "음수 사이클이 없는 한."),
        ("Floyd-Warshall의 시간은 Θ(V²)이다.", False, "Θ(V³). 3중 루프."),
        ("Floyd-Warshall은 대각선 d_ii < 0으로 음수 사이클을 감지.", True, "자기로의 경로가 음수이면 사이클 존재."),
        ("밀집 그래프에서는 V번 Dijkstra가 Floyd-Warshall보다 항상 빠르다.", False, "밀집에서 Floyd-Warshall Θ(V³)이 더 단순·경쟁력."),
        ("d_ij^(k)는 중간 정점 집합이 {1..k}의 부분집합인 i→j 경로 최단값.", True, "CLRS 25.2 정의."),
        ("Floyd-Warshall의 3중 루프에서 k는 반드시 외부 루프여야 한다.", True, "의존성 순서 보장."),
        ("Floyd-Warshall은 Θ(V²) 공간만 사용 가능.", True, "In-place로 가능."),
        ("Floyd-Warshall로 Transitive Closure도 계산 가능.", True, "가중치 대신 불린 AND/OR."),
        ("Floyd-Warshall 점화식 d_ij^(k) = min(d_ij^(k-1), d_ik^(k-1) + d_kj^(k-1))이다.", True, "CLRS 25.2 식 (25.5)."),
        ("Johnson's 알고리즘은 reweighting으로 음수 간선을 제거한 후 V번 Dijkstra를 실행한다.", True, "희소 그래프에서 O(V² lg V + VE)로 효율적."),
    ],
    "ch26": [
        ("Ford-Fulkerson은 어떤 증대 경로 선택에서도 다항 시간을 보장한다.", False, "일반 Ford-Fulkerson은 큰 용량에서 지수 시간 가능."),
        ("Edmonds-Karp는 BFS로 증대 경로를 찾는다.", True, "최단 증대 경로 선택."),
        ("Max-Flow Min-Cut Theorem: 최대 유량 = 최소 절단 용량.", True, "Theorem 26.6."),
        ("잔여 네트워크 G_f는 원본과 동일하다.", False, "유량에 따라 잔여 용량과 역간선이 추가/변경됨."),
        ("Edmonds-Karp의 시간은 O(VE²)이다.", True, "증대 경로 O(VE) × BFS O(E)."),
        ("이분 매칭(Bipartite Matching)은 Max-Flow로 해결 가능.", True, "소스·싱크 추가 + 용량 1로 환원."),
        ("역간선(residual edge)은 유량의 '취소'를 나타낸다.", True, "f(u,v) 만큼 v→u 잔여."),
        ("유량 네트워크는 반드시 방향 그래프이다.", True, "각 간선이 방향성을 가짐."),
        ("유량 보존 제약은 s와 t를 제외한 모든 정점에서 유입 = 유출이다.", True, "flow conservation."),
        ("최대 유량은 유일한 값이지만 유량 분배는 여러 개 가능하다.", True, "같은 |f|를 만드는 다른 간선 분배가 존재 가능."),
    ],
    "ch32": [
        ("KMP의 매칭 시간은 Θ(n+m)이다.", True, "amortized 분석."),
        ("실패 함수 π 계산은 Θ(m)이다.", True, "COMPUTE-PREFIX-FUNCTION."),
        ("KMP는 텍스트 인덱스 i를 뒤로 되돌리지 않는다.", True, "단조 증가 — Θ(n) 보장 핵심."),
        ("나이브 문자열 매칭의 최악 시간은 O(nm)이다.", True, "각 shift에서 m 비교 가능."),
        ("KMP는 패턴 내부의 반복 구조를 활용한다.", True, "π 함수 = 접두=접미 일치."),
        ("Rabin-Karp는 해시 기반이다.", True, "롤링 해시로 빠른 비교."),
        ("π[q]는 P[1..q]의 접두사이자 접미사인 '적절한(proper)' 부분 문자열 중 최대 길이.", True, "CLRS 32.4 정의."),
        ("Boyer-Moore는 평균적으로 KMP보다 빠르다 (특히 긴 패턴).", True, "Suffix heuristic, bad character."),
        ("KMP의 매칭 과정에서 비교 횟수는 최대 2n이다.", True, "amortized 분석으로 증가 n회, 감소 ≤ 증가."),
        ("π[1] = 0 이다 (길이 1인 접두사의 적절한 접두=접미는 빈 문자열).", True, "proper는 자기 제외. 빈 문자열이 유일한 후보."),
    ],
    "ch11": [
        ("Chaining 해시의 기대 검색 시간은 Θ(1+α).", True, "α = n/m."),
        ("Simple Uniform Hashing은 모든 키가 같은 슬롯에 해시된다는 가정이다.", False, "모든 슬롯에 균등 확률 1/m."),
        ("Load factor α = n/m (저장 원소 수 / 슬롯 수).", True, "CLRS 11.2."),
        ("Universal hashing은 최악의 경우에도 O(1) 기대 시간을 보장한다.", True, "해시 함수 클래스에서 무작위 선택."),
        ("Chaining 해시의 INSERT는 최악 O(n)이다.", False, "리스트 head에 삽입 → O(1)."),
        ("해시 함수 h(k) = k mod m에서 m은 2의 제곱을 쓰는 것이 좋다.", False, "소수 사용이 권장됨 (분산 개선)."),
        ("Open addressing은 모든 원소를 테이블 배열에 직접 저장한다.", True, "Linked list 사용 안 함."),
        ("Chaining 해시의 최악 검색은 Θ(n)이다.", True, "모든 키가 한 슬롯에 몰릴 때."),
        ("α = O(1)이면 모든 해시 연산이 기대 상수 시간.", True, "n = O(m)으로 테이블 크기를 조정(rehashing)하여 유지."),
        ("해시 테이블의 DELETE는 doubly linked list에서 O(1).", True, "앞뒤 포인터 연결 해제."),
    ],
    "ch12": [
        ("BST의 in-order 순회는 키를 오름차순으로 출력한다.", True, "Theorem 12.1."),
        ("BST의 높이는 항상 O(lg n)이다.", False, "최악 O(n) (사슬 트리)."),
        ("BST 검색 시간은 O(h)이다.", True, "높이에 비례."),
        ("무작위 순서로 삽입된 BST의 기대 높이는 O(lg n).", True, "Theorem 12.4."),
        ("BST 삭제는 자식 수에 따라 세 가지 경우로 나뉜다.", True, "0, 1, 2 자식."),
        ("BST 삽입은 항상 리프 노드 위치에서 일어난다.", True, "표준 TREE-INSERT."),
        ("Pre-order 순회도 BST 키를 오름차순으로 출력한다.", False, "In-order만 오름차순."),
        ("BST는 그 자체로 '균형(balanced)' 자료구조이다.", False, "RB-Tree/AVL이 균형."),
        ("TREE-MINIMUM은 항상 왼쪽 경로를 끝까지 따라간다.", True, "BST 성질: 왼쪽이 더 작음."),
        ("BST의 In-order 순회 시간은 Θ(n)이다.", True, "각 노드를 정확히 한 번 방문."),
    ],
    "ch13": [
        ("RB-Tree의 높이는 2 lg(n+1) 이하이다.", True, "Lemma 13.1."),
        ("루트는 항상 검정(BLACK)이다.", True, "성질 2."),
        ("빨강 노드의 자식도 빨강일 수 있다.", False, "성질 4 위배. 연속 빨강 금지."),
        ("LEFT-ROTATE는 O(1) 시간이다.", True, "고정 포인터 갱신."),
        ("RB-INSERT-FIXUP은 색상 전환과 회전만 사용한다.", True, "CLRS 13.3."),
        ("같은 노드에서 다른 경로의 black-height가 다를 수 있다.", False, "성질 5: 모든 경로 black-height 동일."),
        ("AVL이 RB-Tree보다 검색 시에 평균적으로 더 빠르다.", True, "더 엄격한 균형."),
        ("모든 NIL(leaf)은 검정으로 간주한다.", True, "성질 3."),
        ("RB-INSERT는 새 노드를 항상 빨강으로 삽입한다.", True, "black-height 불변 유지를 위함."),
        ("RB-Tree의 INSERT/DELETE 시간은 O(lg n)이다.", True, "트리 높이가 O(lg n) + 상수 회전."),
    ],
    "ch18": [
        ("B-Tree의 모든 리프는 같은 깊이에 있다.", True, "균형 성질."),
        ("최소 차수 t인 B-Tree의 내부 노드는 t-1 ~ 2t-1 키를 갖는다.", True, "CLRS 18.1."),
        ("B-Tree의 높이는 O(log_t n)이다.", True, "Theorem 18.1."),
        ("B-Tree 검색의 I/O 횟수는 O(lg n)이다.", False, "O(log_t n). t가 크면 훨씬 적음."),
        ("B-Tree는 디스크 I/O 최소화를 목적으로 설계되었다.", True, "블록 단위 노드 크기."),
        ("B-Tree 루트는 최소 1개 키가 필요하다.", True, "예외적으로 최소 요건이 1."),
        ("B-Tree와 B+Tree는 동일하다.", False, "B+Tree는 데이터가 리프에만."),
        ("B-Tree 삽입은 가득 찬 노드를 만나면 미리 분할(split)한다.", True, "single-pass 삽입."),
        ("B-Tree에서 t=100인 경우 1M 키를 3~4 레벨로 저장할 수 있다.", True, "log_100(10^6) ≈ 3."),
        ("B-Tree의 각 내부 노드는 키 수 + 1개의 자식을 갖는다.", True, "CLRS 18.1."),
    ],
    "ch21": [
        ("FIND-SET의 경로 압축(Path compression)은 트리 깊이를 줄인다.", True, "모든 경로 노드를 루트에 직접 연결."),
        ("Union by rank만 사용해도 FIND-SET은 O(lg n)이다.", True, "랭크 상한 = lg n."),
        ("경로 압축만으로도 α(n) 분할상환을 달성한다.", False, "rank와 결합해야 α(n)."),
        ("Union-Find는 Kruskal의 MST 알고리즘에 쓰인다.", True, "사이클 검사용."),
        ("랭크(rank)는 단조 증가한다.", True, "LINK에서 동률이면 +1, 아니면 불변."),
        ("경로 압축 + Union by rank의 m 연산 시간은 O(m·α(n)).", True, "Theorem 21.14."),
        ("역 Ackermann α(n)은 실용적으로 4 이하이다.", True, "매우 느린 증가."),
        ("서로소 집합에서 각 원소의 대표자는 유일하다.", True, "트리의 루트가 대표."),
        ("MAKE-SET(x)는 x의 rank를 0으로 설정한다.", True, "초기 단일 노드 트리."),
        ("UNION의 시간은 LINK(두 FIND-SET 결과)로 결정된다.", True, "두 대표자를 연결."),
    ],
    "ch34": [
        ("P ⊆ NP임은 증명되어 있다.", True, "결정적으로 풀리면 비결정적으로도 검증 가능."),
        ("P = NP는 이미 해결된 문제이다.", False, "미해결 (밀레니엄 문제)."),
        ("3-SAT은 NP-완전이다.", True, "Cook-Levin 이후 환원으로 증명."),
        ("NP-완전 문제들은 서로 다항 시간에 환원 가능하다.", True, "이것이 'NP-완전' 정의의 본질."),
        ("정지 문제(Halting Problem)는 NP-완전이다.", False, "결정 불가능 — NP에도 속하지 않음."),
        ("SAT는 Cook-Levin 정리로 최초의 NP-완전 문제로 증명됐다.", True, "Theorem 34.10."),
        ("NP-hard 문제는 반드시 NP에 속한다.", False, "NP 소속 안 해도 NP-hard 가능 (예: Halting)."),
        ("Vertex-Cover는 NP-완전이다.", True, "3-SAT ≤_P VC."),
        ("A ≤_P B 이고 B가 P면 A도 P이다.", True, "다항 환원의 transitivity."),
        ("NP 문제의 증명(certificate)은 다항 크기여야 한다.", True, "NP의 정의."),
    ],
    "ch35": [
        ("2-근사는 해의 크기가 최적의 최대 2배임을 보장.", True, "최소화 문제의 근사비 정의."),
        ("APPROX-VERTEX-COVER의 시간은 O(V+E).", True, "선형."),
        ("PTAS는 모든 ε > 0에 대해 (1+ε)-근사를 다항시간에 낸다.", True, "ε가 고정될 때 다항."),
        ("일반 TSP는 다항시간에 어떤 상수 근사도 불가능하다 (P≠NP).", True, "Theorem 35.3."),
        ("Set-Cover는 (ln n + 1)-근사가 최선이다 (P≠NP).", True, "Feige 1998."),
        ("근사 알고리즘은 지수 시간도 허용된다.", False, "반드시 다항 시간."),
        ("Fractional Knapsack은 Greedy로 최적 해를 얻는다.", True, "근사비 1 (정확)."),
        ("Christofides 알고리즘은 Metric TSP에 3/2-근사.", True, "CLRS 35.2."),
        ("FPTAS는 PTAS보다 강한 보장 (시간이 1/ε의 다항).", True, "FP = Fully Polynomial-Time."),
        ("Vertex-Cover 2-근사는 '임의 간선' 양 끝점을 모두 선택하는 방식이다.", True, "APPROX-VERTEX-COVER의 핵심."),
    ],
}


def main():
    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    def fmt_item(item):
        q, a, why = item
        return "      { q: %s, a: %s, why: %s }" % (
            _js_str(q), "true" if a else "false", _js_str(why)
        )

    def _js_str(s):
        return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

    def make_ox_block(cid):
        items = OX_DATA.get(cid)
        if not items:
            return None
        lines = ["    ox: ["] + [fmt_item(it) + "," for it in items] + ["    ],", ""]
        return "\n".join(lines)

    # For each chapter found via `id: "chX",`, insert ox before `    algorithms: [`
    # Strategy: find chapter-start, then find next `    algorithms: [` after it, insert.

    out_parts = []
    i = 0
    pattern = re.compile(r'id: "([a-z0-9]+)"', re.M)
    # Iterate through text, finding each chapter, inserting
    pos = 0
    changes = 0
    while True:
        m = pattern.search(text, pos)
        if not m:
            out_parts.append(text[pos:])
            break
        cid = m.group(1)
        if cid not in OX_DATA:
            # Just advance past this match
            out_parts.append(text[pos:m.end()])
            pos = m.end()
            continue
        # Find the first `    algorithms: [` after this match
        alg_m = re.search(r"^    algorithms: \[", text[m.end():], re.M)
        if not alg_m:
            out_parts.append(text[pos:m.end()])
            pos = m.end()
            continue
        alg_start = m.end() + alg_m.start()
        # Insert ox before this algorithms line
        ox_block = make_ox_block(cid)
        if ox_block is None:
            out_parts.append(text[pos:m.end()])
            pos = m.end()
            continue
        # Check if already has ox: to avoid duplication
        mid_chunk = text[m.end():alg_start]
        if "    ox: [" in mid_chunk:
            # Skip: already inserted
            out_parts.append(text[pos:alg_start])
            pos = alg_start
            continue
        out_parts.append(text[pos:alg_start])
        out_parts.append(ox_block + "\n")
        pos = alg_start
        changes += 1

    new_text = "".join(out_parts)
    path.write_text(new_text, encoding="utf-8")
    print(f"Inserted OX data into {changes} chapters.")


if __name__ == "__main__":
    main()
