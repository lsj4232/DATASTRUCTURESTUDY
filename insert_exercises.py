#!/usr/bin/env python3
"""Insert CLRS exercises into each chapter of content.js.
Each entry: {num, q, hint, solution} — placed before `algorithms: [`.
"""
import re
import sys
from pathlib import Path

EX_DATA = {
    "ch2": [
        ("2.1-1", "A = 〈31, 41, 59, 26, 41, 58〉에 INSERTION-SORT 연산을 적용할 때, 각 key의 삽입 과정을 Figure 2.2 형식으로 그리시오.", "key를 차례로 뽑아 왼쪽(이미 정렬된 부분)에서 뒤로 밀어넣는 과정을 시각화. 각 j에서 A 배열의 상태를 기록.", "j=2 key=41: 31,41 유지. j=3 key=59: 변화없음. j=4 key=26: 31,41,59 모두 뒤로 밀림 → 26,31,41,59. j=5 key=41: 59만 뒤로 → 26,31,41,41,59. j=6 key=58: 59 뒤로 → 26,31,41,41,58,59."),
        ("2.1-2", "INSERTION-SORT를 내림차순으로 정렬하도록 다시 쓰시오.", "비교 연산자 A[i] > key를 A[i] < key로 바꾸면 됨.", "while 조건을 `while i > 0 and A[i] < key`로 변경. 나머지는 동일."),
        ("2.1-3", "선형 탐색 문제: 값 v를 찾는 알고리즘을 루프 불변식을 이용해 증명하시오.", "루프 불변식: '지금까지 검사한 A[1..i-1]에는 v가 없다.'", "초기화: i=1, 범위 빈 → 공허 참. 유지: A[i]≠v면 i+1에서도 성립. 종료: i=n+1이면 A 전체에 v 없음 → NIL 반환. A[i]==v이면 i 반환."),
        ("2.3-2", "MERGE 프로시저를 센티넬을 쓰지 않도록 다시 쓰시오.", "두 배열 중 하나가 소진되면 나머지를 바로 복사.", "while i ≤ n1 AND j ≤ n2: 비교 후 작은 것 추가. 한쪽 끝나면 나머지 배열을 for 루프로 복사."),
        ("2.3-7", "정렬된 n개 원소 집합 S와 정수 x가 주어졌을 때, S 내 두 원소 합이 정확히 x인지 O(n lg n)에 판정하시오.", "이미 정렬된 S에 대해 각 원소 s에 대해 (x-s)를 이진 탐색으로 찾기.", "각 s ∈ S에 대해 (x-s)를 이진 탐색 O(lg n). 총 O(n lg n). 또는 두 포인터(양 끝에서)로 O(n)도 가능."),
        ("Problem 2-2", "Bubble Sort의 정확성을 루프 불변식으로 증명하시오. 비교 횟수는?", "내부 for의 불변식: A[j..A.length]에서 A[j]가 최소.", "내부 불변: 매 iteration 후 A[j]는 A[j..A.length]의 최소. 외부 불변: A[1..i-1]이 정렬된 가장 작은 i-1개 원소. 총 비교 Θ(n²)."),
    ],
    "ch3": [
        ("3.1-1", "f(n)과 g(n)이 음이 아닌 함수이면 max(f(n), g(n)) = Θ(f(n) + g(n))임을 증명하시오.", "max ≤ f+g ≤ 2·max.", "(f+g)/2 ≤ max(f,g) ≤ f+g. c1=1/2, c2=1로 Θ 정의 충족."),
        ("3.1-2", "a, b가 실수 상수(b > 0)일 때 (n+a)^b = Θ(n^b)임을 증명하시오.", "이항 전개 또는 lim 이용.", "(n+a)^b / n^b = (1 + a/n)^b → 1. 따라서 양쪽이 유계 상수를 가짐."),
        ("3.1-4", "2^(n+1) = O(2^n)인가? 2^(2n) = O(2^n)인가?", "2^(n+1) = 2·2^n, 2^(2n) = (2^n)².", "2^(n+1) = O(2^n) 참 (상수 2배). 2^(2n) = O(2^n) 거짓 (지수적으로 큰 차이)."),
        ("3.1-7", "o(g(n)) ∩ ω(g(n)) = ∅임을 증명하시오.", "lim f/g = 0과 = ∞는 동시에 성립 불가.", "o는 lim = 0, ω는 lim = ∞. 한 함수 동시 만족 불가능. 교집합 공집합."),
        ("Problem 3-1", "다항식 p(n) = Σ a_i n^i (a_d > 0)에 대해: (a) k ≥ d ⟺ p(n) = O(n^k), (b) k ≤ d ⟺ p(n) = Ω(n^k), (c) k = d ⟺ p(n) = Θ(n^k).", "최고차항이 지배.", "증명: (c)만 보이면 나머지 따라옴. p(n)/n^d → a_d (유한 양수). Θ 정의 충족."),
        ("Problem 3-4", "함수 비교: lg(lg* n) vs lg* (lg n)은? (c) n과 2^(√(2 lg n))은?", "lg* 는 반복 로그 (iterated log).", "(c)는 n = 2^(lg n), 2^(√(2 lg n))이므로 n이 더 큼 (lg n vs √(2 lg n))."),
    ],
    "ch4": [
        ("4.1-1", "최대 부분 배열 문제에서 모든 원소가 음수이면 어떻게 되나?", "단일 원소 부분 배열도 허용되므로 최댓값(가장 덜 음수인) 원소.", "최대 부분 배열 = 가장 큰 단일 원소. 분할 정복/Kadane 모두 동일한 결과."),
        ("4.1-5", "Kadane 알고리즘(연습문제): 최대 부분 배열을 비재귀 Θ(n) 알고리즘으로 찾으시오.", "'현재 위치에서 끝나는 최대' 누적 유지.", "max_here = max(A[i], max_here+A[i]), max_so_far = max(max_so_far, max_here). Θ(n) 선형 스캔."),
        ("4.3-1", "T(n) = T(n-1) + n에 대해 T(n) = O(n²) 증명 (substitution).", "cn² 추측 후 귀납.", "T(n) = T(n-1)+n ≤ c(n-1)² + n = cn² - 2cn + c + n ≤ cn² (c ≥ 1 + 1/n)."),
        ("4.3-7", "T(n) = 2T(n/2) + n lg n. 마스터 정리 적용 가능? 해는?", "n^(log_2 2) = n과 비교. n lg n이 다항식적으로 크지 않음.", "Case 2와 3 사이 갭. 재귀 트리: 각 레벨 비용 n lg n, 레벨 수 lg n → T(n) = Θ(n lg²n)."),
        ("4.5-1", "다음 점화식을 마스터 정리로 풀이: (a) T(n) = 2T(n/4) + 1, (b) T(n) = 2T(n/4) + √n, (c) T(n) = 2T(n/4) + n, (d) T(n) = 2T(n/4) + n².", "n^(log_4 2) = n^(1/2) = √n과 비교.", "(a) Case 1 → Θ(√n). (b) Case 2 → Θ(√n lg n). (c) Case 3 → Θ(n). (d) Case 3 → Θ(n²)."),
        ("Problem 4-1", "Strassen 알고리즘으로 2×2 블록 분할. 점화식 T(n) = 7T(n/2) + Θ(n²). 해를 마스터 정리로 구하고, 일반 Θ(n³) 방법과 비교하시오.", "log_2 7 ≈ 2.807.", "Case 1: n^(log_2 7) > n² → Θ(n^(log_2 7)) ≈ Θ(n^2.807). n³보다 점근적으로 빠름."),
    ],
    "ch6": [
        ("6.1-1", "높이 h인 힙에서 원소의 최소·최대 수는?", "완전 이진 트리 구조.", "최대: 완전 채워진 2^(h+1)-1. 최소: 마지막 레벨에 1개만 → 2^h."),
        ("6.1-2", "n개 원소 힙의 높이는 ⌊lg n⌋임을 증명하시오.", "n이 2^h와 2^(h+1)-1 사이에 위치.", "높이 h 힙의 노드 수 ∈ [2^h, 2^(h+1)-1]. 로그 취하면 h ≤ lg n < h+1 → h = ⌊lg n⌋."),
        ("6.2-5", "MAX-HEAPIFY를 재귀 대신 반복으로 다시 쓰시오.", "while largest != i 루프.", "i=root. while 자식 있고 큰 자식이 A[i]보다 크면: 교환 + i=largest. 조건 만족 안 될 때까지."),
        ("6.3-3", "높이 h인 노드의 개수가 n 원소 힙에서 ⌈n/2^(h+1)⌉ 이하임을 증명하시오.", "높이 h인 노드는 서브트리 크기 ≥ 2^h.", "h 노드의 서브트리 크기 ≥ 2^h → 이런 노드가 k개면 총 서브트리 크기 ≥ k·2^h. 전체 n 노드 이하 → k ≤ ⌈n/2^h⌉ (섬세하게 2^(h+1))."),
        ("6.4-3", "이미 오름차순/내림차순인 배열에 HEAPSORT의 시간은?", "둘 다 Θ(n lg n).", "HEAPSORT는 최선/최악/평균 모두 Θ(n lg n). 이미 정렬된 입력이 이점 없음 (Insertion Sort와 대조)."),
        ("6.5-3", "YOUNG 테이블이나 비슷한 구조로 MIN-HEAP 다시 구현하시오.", "성질 뒤집기.", "PARENT/LEFT/RIGHT 구조 동일, MIN-HEAPIFY는 ≤ 비교로. 비슷한 O(lg n)."),
    ],
    "ch7": [
        ("7.1-1", "A = 〈13, 19, 9, 5, 12, 8, 7, 4, 11, 2, 6, 21〉에 PARTITION 연산을 적용하시오 (Lomuto, 피벗 = A[last] = 21?). 잘못된 예. 실제 예시 다시: A = 〈13, 19, 9, 5, 12, 8, 7, 4, 21, 2, 6, 11〉, r = 12, 피벗 = 11.", "Lomuto 경과 추적: i 증가, A[j] ≤ 피벗 시 교환.", "최종 q = 8 (피벗 11이 8번 위치). 배열: [9, 5, 8, 7, 4, 2, 6, 11, 21, 13, 19, 12]."),
        ("7.2-1", "T(n) = T(n-1) + Θ(n) = Θ(n²) 증명.", "치환법.", "T(n) ≤ T(n-1) + cn. 전개: T(1) + c(2+3+...+n) = Θ(n²)."),
        ("7.2-5", "α ≤ 1/2인 분할 비율로 매번 분할 시 Quicksort의 최소·최대 깊이는?", "최소: 모든 단계가 균등, 최대: α 비율로 작은 쪽.", "최소 -log_2 n = lg n. 최대 -log_(1-α) n."),
        ("7.4-2", "Quicksort의 최선 시간 복잡도가 Θ(n lg n)임을 증명.", "점화식 T(n) = 2T(n/2) + Θ(n).", "균등 분할이 최선. Master Case 2 → Θ(n lg n)."),
        ("Problem 7-1", "Hoare Partition의 정확성 증명 및 QUICKSORT에 통합 방법.", "Lomuto와 재귀 호출 형태가 다름.", "QUICKSORT(A, p, q) + QUICKSORT(A, q+1, r). Hoare의 j가 경계이지 피벗 고정 위치 아님."),
    ],
    "ch8": [
        ("8.1-1", "비교 기반 정렬의 결정 트리의 최소 높이는?", "리프 ≥ n!, 이진 트리 높이 ≥ lg(n!).", "h ≥ lg(n!) = Ω(n lg n)."),
        ("8.2-3", "COUNTING-SORT의 안정성을 증명하시오.", "역순 순회로 같은 key의 상대 순서 유지.", "A를 끝에서부터 훑으며 B[C[A[j]]] = A[j]. 같은 값은 원래 순서대로 왼쪽에 배치됨."),
        ("8.2-4", "COUNTING-SORT의 메모리 효율화: k가 매우 클 때?", "입력의 실제 출현 값만 카운트 유지.", "해시 또는 정렬 후 고유값 추출. k 대신 서로 다른 값 수 u에 비례."),
        ("8.3-4", "n개 정수가 0과 n³-1 사이일 때 O(n)에 정렬하시오.", "Radix Sort + 기수 n.", "n진수로 표현하면 자릿수 3개. d=3 pass × Counting Sort Θ(n + n) = Θ(n)."),
        ("8.4-3", "Bucket Sort에서 입력이 균등 분포가 아닐 때 시간은?", "한 버킷에 몰리면 Insertion Sort가 비용 증가.", "최악 Θ(n²). 모든 원소가 한 버킷에 있을 때."),
    ],
    "ch15": [
        ("15.1-1", "Rod Cutting의 점화식 r_n = max_i(p_i + r_(n-i))을 bottom-up으로 구현하시오.", "r[0..n] 배열을 작은 값부터 채움.", "for j = 1 to n: r[j] = max over i=1..j of (p[i] + r[j-i]). 시간 Θ(n²)."),
        ("15.2-1", "Matrix Chain Order로 다음 차원 수열의 최적 괄호를 구하시오: 〈5, 10, 3, 12, 5, 50, 6〉.", "m[i,j] 테이블을 l=2..6으로 채움.", "최적 괄호: ((A₁(A₂A₃))((A₄A₅)A₆)) 또는 유사. 최적 비용 약 2010."),
        ("15.4-2", "LCS 알고리즘을 이용해 길이가 아닌 실제 LCS를 출력하시오.", "c 테이블 + b 테이블(방향 기록).", "b[i,j] ∈ {↖, ↑, ←}. PRINT-LCS 재귀: ↖면 X[i] 출력 후 (i-1,j-1). ↑면 (i-1,j). ←면 (i,j-1)."),
        ("15.4-5", "LIS (Longest Increasing Subsequence)를 O(n²)과 O(n lg n)으로 푸시오.", "O(n²) DP 또는 O(n lg n) patience sorting.", "O(n²): L[i] = max L[j] + 1 over j < i with A[j] < A[i]. O(n lg n): 이진 탐색으로 tails 배열 유지."),
        ("15.5-4", "최적 이진 탐색 트리의 DP 알고리즘을 구현하시오.", "e[i,j] = min over r (e[i,r-1] + e[r+1,j] + w(i,j)).", "O(n³) 시간. Knuth 최적화로 O(n²)."),
        ("Problem 15-1", "DAG에서 최장 경로 문제를 DP로 푸시오.", "위상 정렬 후 DP.", "topologically sort. d[v] = max over u→v of (d[u] + w(u,v)). Θ(V+E)."),
    ],
    "ch16": [
        ("16.1-1", "Activity Selection을 bottom-up DP로 풀이 O(n²) 알고리즘을 설계하시오.", "c[i,j] = 부분 문제 최대 집합 크기.", "c[i,j] = max over k (c[i,k] + 1 + c[k,j])."),
        ("16.1-4", "강의실 스케줄링: 겹치지 않는 강의실 수 최소화.", "Activity Selection 변형 / Greedy.", "시작 시간 정렬 후 각 강의를 가능한 가장 오래된 교실에 배정. Θ(n lg n)."),
        ("16.2-2", "0-1 Knapsack DP 구현. 시간 O(nW).", "K[i, w] 테이블.", "점화식으로 2D 배열 채움. 반환 K[n, W]."),
        ("16.2-4", "교수님이 여행 중 연료 충전 문제: Greedy로 최소 충전 횟수.", "각 위치에서 최대 거리까지 갈 수 있으면 계속, 아니면 충전.", "현재 위치에서 갈 수 있는 마지막 주유소까지 이동 후 충전. Θ(n)."),
        ("16.3-3", "Huffman 트리의 가장 긴 코드워드 길이 상한은?", "최소 빈도 두 개의 비율이 영향.", "n 문자에 대해 최대 길이 ≤ n-1 (최악). 평균은 H(X) = Σ p_i log(1/p_i) 정보량 근접."),
    ],
    "ch17": [
        ("17.1-2", "MULTIPOP 없이 스택이 2진 카운터를 증가시킬 때, n번의 INCREMENT에 대해 총 비트 플립 수는?", "비트 i는 n/2^i 번 flip.", "총 = Σ_{i=0}^{lg n} n/2^i < 2n → amortized O(1) per INCREMENT."),
        ("17.2-1", "스택 연산에서 n개 연산의 총 비용을 회계 방법으로 O(n) 증명.", "PUSH에 $2 할당 ($1 저장, $1 미래 POP 대비).", "각 원소가 스택에 들어가면 $2 지불. 나중 POP은 $1 사용. 총 $2n = O(n)."),
        ("17.3-2", "2진 카운터의 INCREMENT에 대해 포텐셜 Φ(i) = i의 1 비트 수로 증명.", "단일 플립 0→1: ΔΦ=+1. 1→0: ΔΦ=-1.", "한 번의 INCREMENT가 t번 1→0 플립 + 1번 0→1 플립. 실제 비용 t+1. ΔΦ = -t+1. ĉ = (t+1) + (-t+1) = 2 → O(1) amortized."),
        ("17.4-1", "동적 테이블의 축소 조건을 α < 1/4로 쓰면 왜 잘못되나?", "삽입/삭제 교대 시 반복 확장/축소.", "α < 1/4에서 축소하면 α = 1/2가 됨. 이후 두 배 추가로 α = 1이 되면 확장. 교대 입력이 매번 확장/축소 → Θ(n). 1/4 ↔ 1/2 갭 필요."),
        ("Problem 17-1", "비트 역순 카운터: 각 INCREMENT가 O(lg n) 비트 플립 필요. 총 시간 O(n lg n).", "lg n 깊이의 이진 트리 순회.", "각 INCREMENT가 이진 캐리를 따라 lg n 레벨. 총 O(n lg n). amortized O(lg n)."),
    ],
    "ch22": [
        ("22.1-6", "인접 행렬에서 'universal sink' (모든 정점에서 들어오는 간선, 나가는 간선 없음) 존재 여부를 O(V)에 판정하시오.", "sink는 해당 행이 전부 0, 열이 전부 1.", "대각선 외 i=j, i++ if M[i][j]==1, 아니면 j++. O(V)에 후보 찾고 검증."),
        ("22.2-3", "BFS에 NIL 대신 정점 배열을 사용하도록 수정하시오.", "color, d, π 배열로.", "코드 동일 의미이지만 배열 인덱싱."),
        ("22.2-6", "BFS가 minimum-weight spanning tree를 만드는지 확인: 가중치 그래프에서 BFS는 MST 아님.", "BFS는 간선 수 최단만 고려.", "반례: 정점 3개 사각형 그래프, BFS 트리가 최대 가중치 간선 선택 가능."),
        ("22.3-6", "유향 그래프에서 DFS의 edge 분류 4가지를 DFS-VISIT 도중 판별 코드 추가.", "v.color 상태로 분류.", "WHITE → tree, GRAY → back, BLACK + u.d<v.d → forward, BLACK + u.d>v.d → cross."),
        ("22.4-5", "위상 정렬을 BFS 기반(Kahn 알고리즘)으로 구현.", "in-degree 0 정점을 큐에 넣고 처리.", "in-degree 배열 계산. 0인 정점 큐. 하나씩 pop하여 출력 + 이웃 in-degree -1. 0 되면 큐에 추가. Θ(V+E)."),
        ("22.5-5", "TARJAN 알고리즘의 pseudocode와 Kosaraju 비교.", "Tarjan: 1 DFS + 스택. Kosaraju: 2 DFS + 전치.", "Tarjan이 보통 실제 구현에서 빠름 (전치 그래프 불필요). 증명 복잡도는 비슷."),
    ],
    "ch23": [
        ("23.1-1", "Kruskal로 MST를 찾는 동안 가장 가벼운 간선이 항상 선택됨을 증명.", "절단 정리 적용.", "가장 가벼운 간선 e = (u,v)는 {u}와 V\\{u} 절단의 경량 간선 → safe."),
        ("23.1-4", "그래프에 사이클이 있을 때 MST가 유일하지 않을 수 있는 조건은?", "동일 가중치 간선이 핵심.", "모든 간선 가중치가 서로 다르면 MST 유일. 같은 가중치 있으면 여러 MST 가능."),
        ("23.2-2", "Prim을 인접 행렬로 구현 시 O(V²) 시간.", "배열로 key 유지.", "EXTRACT-MIN을 선형 스캔으로 O(V). V번 호출 → O(V²). 밀집 그래프에서 효율적."),
        ("23.2-4", "간선 가중치가 1..|V|인 정수일 때 Kruskal을 O(E α(V))에 개선.", "Counting Sort로 간선 정렬 O(E).", "정렬이 Θ(E)가 되므로 Union-Find 연산 α(V)만 지배 → O(E α(V))."),
        ("Problem 23-2", "MST에 속하지 않는 간선 (u,v)가 있을 때, MST의 u-v 경로에서 어떤 간선이 (u,v)보다 무겁지 않음을 증명.", "cycle property.", "MST에 (u,v) 추가 시 사이클 형성. 그 사이클의 최대 가중치 간선을 제거해도 여전히 신장 트리 + MST 성질."),
    ],
    "ch24": [
        ("24.1-3", "Bellman-Ford를 각 반복에서 변화 없음 감지하면 조기 종료하도록 수정하시오.", "changed flag.", "각 반복 시 flag = false. RELAX에서 d 갱신 시 flag = true. flag가 false면 조기 반환."),
        ("24.2-3", "DAG-SHORTEST-PATHS를 최장 경로(longest path)로 변환하시오.", "RELAX를 max 연산으로.", "가중치 부호 반전 또는 max. PERT 차트 임계 경로 계산 표준."),
        ("24.3-1", "Dijkstra 실행 시 S에 추가된 정점은 왜 d 값이 확정되는가?", "탐욕 선택 성질.", "EXTRACT-MIN으로 가장 가까운 미방문 선택 → 이후 다른 경로로 더 가까워질 수 없음 (음수 없다는 가정)."),
        ("24.3-5", "Dijkstra를 binary heap 대신 Fibonacci Heap으로 바꾸면?", "DECREASE-KEY가 O(1) amortized.", "O(V lg V + E). 밀집에서 유리. 구현 복잡."),
        ("24.5-1", "모든 정점 쌍 최단 경로를 Dijkstra V번 vs Bellman-Ford V번 vs Floyd-Warshall 비교.", "시간 복잡도.", "V·Dijkstra(heap): O(V(V+E) lg V). V·BF: O(V²E). Floyd: O(V³). 밀집에선 Floyd 단순/경쟁력."),
    ],
    "ch34": [
        ("34.2-1", "SUBSET-SUM ∈ NP임을 증명.", "certificate = 부분집합.", "부분집합 크기 ≤ n이므로 다항 크기. 검증: 합산 O(n)."),
        ("34.3-1", "SAT ≤_P 3-SAT 환원을 구성.", "긴 절을 3-절로 분할.", "|C| > 3인 절을 새 변수로 분할 (chain). |C| = k → k-2개 새 3-절."),
        ("34.4-2", "HAM-CYCLE ≤_P HAM-PATH 환원.", "정점 쪼개기.", "한 정점 v를 v1, v2로 쪼개고 원본 간선 분배. HAM-PATH(v1, v2) = HAM-CYCLE."),
        ("34.5-3", "CLIQUE ≤_P VERTEX-COVER 환원 (보 그래프 사용).", "G의 k-CLIQUE ⟺ 보 G'의 (n-k)-VC.", "CLIQUE는 '연결된 집합', VC는 '간선 덮는 집합'. 보 그래프에서 상보 관계."),
        ("Problem 34-3", "MAX-SAT: 최대한 많은 절을 만족시키는 할당. NP-hard.", "SAT이 NP-완전이고 MAX-SAT은 일반화.", "결정 버전 'k개 이상 절 만족?' NP-완전. 근사: 무작위 할당으로 7/8 근사 (Håstad)."),
    ],
}


def main():
    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    def _js_str(s):
        return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'

    def fmt_item(item):
        num, q, hint, sol = item
        parts = []
        parts.append("      {")
        parts.append(f"        num: {_js_str(num)},")
        parts.append(f"        q: {_js_str(q)},")
        if hint:
            parts.append(f"        hint: {_js_str(hint)},")
        if sol:
            parts.append(f"        solution: {_js_str(sol)},")
        parts.append("      },")
        return "\n".join(parts)

    def make_block(cid):
        items = EX_DATA.get(cid)
        if not items:
            return None
        lines = ["    exercises: ["] + [fmt_item(it) for it in items] + ["    ],", ""]
        return "\n".join(lines)

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
        if cid not in EX_DATA:
            out.append(text[pos:m.end()])
            pos = m.end()
            continue
        # find next `    algorithms: [` after this match
        alg_m = re.search(r"^    algorithms: \[", text[m.end():], re.M)
        if not alg_m:
            out.append(text[pos:m.end()])
            pos = m.end()
            continue
        alg_start = m.end() + alg_m.start()
        mid = text[m.end():alg_start]
        if "    exercises: [" in mid:
            out.append(text[pos:alg_start])
            pos = alg_start
            continue
        block = make_block(cid)
        out.append(text[pos:alg_start])
        out.append(block + "\n")
        pos = alg_start
        changes += 1

    path.write_text("".join(out), encoding="utf-8")
    print(f"Inserted exercises into {changes} chapters.")


if __name__ == "__main__":
    main()
