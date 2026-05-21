# Introduction to Algorithms (CLRS) 시험 준비 종합 학습 가이드

> 중요도 순으로 정리된 챕터별 요약 + 퀴즈

---

# 🔴 TIER 1: 최핵심 (시험 출제 빈도 최상위)

---

## Chapter 2: Getting Started (알고리즘 시작하기)

### 핵심 개념 요약

**삽입 정렬 (Insertion Sort)**
- 카드 정렬과 동일한 원리: 왼쪽에서 오른쪽으로 하나씩 꺼내 올바른 위치에 삽입
- **시간 복잡도**: 최선 Θ(n) (이미 정렬), 최악 Θ(n²) (역순 정렬), 평균 Θ(n²)
- **공간**: In-place (추가 공간 O(1))
- **안정 정렬 (Stable)**

```
INSERTION-SORT(A)
  for j = 2 to A.length
    key = A[j]
    i = j - 1
    while i > 0 and A[i] > key
      A[i+1] = A[i]
      i = i - 1
    A[i+1] = key
```

**루프 불변식 (Loop Invariant)** — 알고리즘 정확성 증명의 핵심 도구
- **초기 조건 (Initialization)**: 루프 시작 전에 불변식이 성립
- **유지 조건 (Maintenance)**: 반복 시작 시 성립하면, 다음 반복 시작 시에도 성립
- **종료 조건 (Termination)**: 루프 종료 시 불변식이 알고리즘의 정확성을 보장

**합병 정렬 (Merge Sort)**
- **분할 정복 (Divide-and-Conquer)** 패러다임의 대표 예시
  - Divide: 배열을 반으로 분할
  - Conquer: 재귀적으로 정렬
  - Combine: 정렬된 두 부분 배열을 합병
- **시간 복잡도**: 모든 경우 Θ(n lg n)
- **공간**: Θ(n) 추가 공간 필요 (Not in-place)
- **점화식**: T(n) = 2T(n/2) + Θ(n)

```
MERGE(A, p, q, r)
  n1 = q - p + 1, n2 = r - q
  L[1..n1+1], R[1..n2+1] 생성
  L[n1+1] = R[n2+1] = ∞  (센티넬)
  i = j = 1
  for k = p to r
    if L[i] ≤ R[j]
      A[k] = L[i]; i++
    else
      A[k] = R[j]; j++
```

### 핵심 비교

| 알고리즘 | 최선 | 평균 | 최악 | 공간 | 안정성 |
|---------|------|------|------|------|--------|
| Insertion Sort | Θ(n) | Θ(n²) | Θ(n²) | O(1) | ✅ |
| Merge Sort | Θ(n lg n) | Θ(n lg n) | Θ(n lg n) | Θ(n) | ✅ |

---

## Chapter 3: Growth of Functions (함수의 증가)

### 핵심 개념 요약

**점근적 표기법 (Asymptotic Notation)** — 알고리즘 분석의 기본 언어

| 표기법 | 의미 | 수학적 정의 |
|--------|------|-------------|
| **Θ(g(n))** | 점근적 tight bound | ∃ c₁, c₂, n₀ > 0 : 0 ≤ c₁g(n) ≤ f(n) ≤ c₂g(n), ∀n ≥ n₀ |
| **O(g(n))** | 점근적 상한 (upper bound) | ∃ c, n₀ > 0 : 0 ≤ f(n) ≤ cg(n), ∀n ≥ n₀ |
| **Ω(g(n))** | 점근적 하한 (lower bound) | ∃ c, n₀ > 0 : 0 ≤ cg(n) ≤ f(n), ∀n ≥ n₀ |
| **o(g(n))** | 엄격한 상한 (strict upper) | lim(n→∞) f(n)/g(n) = 0 |
| **ω(g(n))** | 엄격한 하한 (strict lower) | lim(n→∞) f(n)/g(n) = ∞ |

**핵심 정리**: f(n) = Θ(g(n)) ⟺ f(n) = O(g(n)) AND f(n) = Ω(g(n))

**함수 증가 순서 (느린 → 빠른)**:
1 < lg lg n < lg n < √n < n < n lg n < n² < n³ < 2ⁿ < n! < nⁿ

**점근적 표기법의 성질**:
- **전이성 (Transitivity)**: f = O(g) ∧ g = O(h) → f = O(h) (Θ, Ω, o, ω 모두 성립)
- **반사성 (Reflexivity)**: f = Θ(f) (O, Ω도 성립)
- **대칭성 (Symmetry)**: f = Θ(g) ⟺ g = Θ(f)
- **전치 대칭 (Transpose Symmetry)**: f = O(g) ⟺ g = Ω(f)

**주요 공식**:
- lg(n!) = Θ(n lg n) — 스털링 근사
- 다항식: p(n) = Θ(nᵈ) (최고차항 계수 > 0일 때)

---

## Chapter 4: Divide-and-Conquer (분할 정복)

### 핵심 개념 요약

**점화식 풀이 3가지 방법**:

**1. 치환법 (Substitution Method)**
- 답을 추측(guess)한 후 수학적 귀납법으로 증명
- 주의: 정확한 상수까지 증명해야 함

**2. 재귀 트리 방법 (Recursion-Tree Method)**
- 점화식을 트리로 시각화
- 각 레벨의 비용을 합산하여 전체 비용 계산
- 주로 추측을 만들기 위해 사용, 치환법으로 검증

**3. 마스터 방법 (Master Method)** ⭐ 시험 필수
- T(n) = aT(n/b) + f(n) 형태의 점화식 (a ≥ 1, b > 1)

| Case | 조건 | 결과 |
|------|------|------|
| **Case 1** | f(n) = O(n^(log_b(a) - ε)) | T(n) = Θ(n^(log_b(a))) |
| **Case 2** | f(n) = Θ(n^(log_b(a))) | T(n) = Θ(n^(log_b(a)) · lg n) |
| **Case 3** | f(n) = Ω(n^(log_b(a) + ε)) + 정규조건 | T(n) = Θ(f(n)) |

정규 조건 (Case 3): af(n/b) ≤ cf(n), c < 1

**적용 예시**:
- T(n) = 9T(n/3) + n → a=9, b=3, n^(log₃9) = n² → Case 1 → Θ(n²)
- T(n) = 2T(n/2) + n → a=2, b=2, n^(log₂2) = n → Case 2 → Θ(n lg n)
- T(n) = 3T(n/4) + n lg n → a=3, b=4, n^(log₄3) ≈ n⁰·⁷⁹³ → Case 3 → Θ(n lg n)

**최대 부분 배열 문제 (Maximum Subarray)**
- 분할 정복: Θ(n lg n) — 좌/우/중간 걸침 세 경우 분할
- Kadane 알고리즘 (연습문제): Θ(n)

**슈트라센 알고리즘 (Strassen's Algorithm)**
- 행렬 곱셈: 일반 Θ(n³) → 슈트라센 Θ(n^(lg 7)) ≈ Θ(n^2.81)
- 8번의 곱셈 → 7번의 곱셈으로 감소

---

## Chapter 6: Heapsort (힙 정렬)

### 핵심 개념 요약

**(이진) 힙 자료구조**
- 거의 완전 이진 트리 (Complete Binary Tree)
- 배열로 표현: PARENT(i) = ⌊i/2⌋, LEFT(i) = 2i, RIGHT(i) = 2i+1
- **최대 힙 성질**: A[PARENT(i)] ≥ A[i]
- **최소 힙 성질**: A[PARENT(i)] ≤ A[i]
- 높이 h = ⌊lg n⌋

**핵심 연산과 시간 복잡도**:

| 연산 | 시간 복잡도 | 설명 |
|------|-----------|------|
| MAX-HEAPIFY | O(lg n) | 힙 성질 위반 노드를 아래로 내림 |
| BUILD-MAX-HEAP | O(n) | 비정렬 배열을 최대 힙으로 변환 |
| HEAPSORT | O(n lg n) | 힙 이용 정렬 |
| HEAP-EXTRACT-MAX | O(lg n) | 최대값 추출 |
| HEAP-INCREASE-KEY | O(lg n) | 키 값 증가 |
| MAX-HEAP-INSERT | O(lg n) | 새 원소 삽입 |

```
MAX-HEAPIFY(A, i)
  l = LEFT(i), r = RIGHT(i)
  if l ≤ A.heap-size and A[l] > A[i]
    largest = l
  else largest = i
  if r ≤ A.heap-size and A[r] > A[largest]
    largest = r
  if largest ≠ i
    exchange A[i] ↔ A[largest]
    MAX-HEAPIFY(A, largest)
```

```
BUILD-MAX-HEAP(A)
  A.heap-size = A.length
  for i = ⌊A.length/2⌋ downto 1
    MAX-HEAPIFY(A, i)
```

**BUILD-MAX-HEAP이 O(n)인 이유** ⭐:
- 높이 h인 노드 수: ≤ ⌈n/2^(h+1)⌉
- 총 비용: Σ(h=0 to ⌊lg n⌋) ⌈n/2^(h+1)⌉ · O(h) = O(n · Σ h/2ʰ) = O(n)

```
HEAPSORT(A)
  BUILD-MAX-HEAP(A)
  for i = A.length downto 2
    exchange A[1] ↔ A[i]
    A.heap-size = A.heap-size - 1
    MAX-HEAPIFY(A, 1)
```

**힙 정렬 특징**: In-place, O(n lg n) 최악, **불안정 정렬**

**우선순위 큐 (Priority Queue)**: 힙 기반 구현, 스케줄링/이벤트 시뮬레이션에 활용

---

## Chapter 7: Quicksort (퀵 정렬)

### 핵심 개념 요약

**퀵 정렬** — 실무에서 가장 많이 사용되는 정렬 알고리즘
- **분할 정복** 패러다임, In-place
- **시간 복잡도**: 최악 Θ(n²), 기대값 O(n lg n), 평균 O(n lg n)
- 최악의 경우: 이미 정렬된 배열 (매번 불균형 분할)

```
QUICKSORT(A, p, r)
  if p < r
    q = PARTITION(A, p, r)
    QUICKSORT(A, p, q-1)
    QUICKSORT(A, q+1, r)

PARTITION(A, p, r)          // Lomuto 분할
  x = A[r]                  // 피벗 = 마지막 원소
  i = p - 1
  for j = p to r-1
    if A[j] ≤ x
      i = i + 1
      exchange A[i] ↔ A[j]
  exchange A[i+1] ↔ A[r]
  return i + 1
```

**분할 분석**:
- **최악 분할**: T(n) = T(n-1) + T(0) + Θ(n) = Θ(n²) — 매번 0:(n-1)
- **최선 분할**: T(n) = 2T(n/2) + Θ(n) = Θ(n lg n) — 매번 균등
- **9:1 불균형**: T(n) = T(9n/10) + T(n/10) + Θ(n) = O(n lg n) — 여전히 효율적!

**랜덤화 퀵 정렬 (Randomized Quicksort)**:
- 피벗을 무작위 선택 → 최악의 경우를 확률적으로 회피
- **기대 비교 횟수**: 2n ln n = O(n lg n)

```
RANDOMIZED-PARTITION(A, p, r)
  i = RANDOM(p, r)
  exchange A[r] ↔ A[i]
  return PARTITION(A, p, r)
```

**퀵 정렬 vs 합병 정렬**:
- 퀵 정렬: In-place, 캐시 효율적, 상수 인자 작음
- 합병 정렬: 최악 O(n lg n) 보장, 안정 정렬, 추가 공간 필요

---

## Chapter 8: Sorting in Linear Time (선형 시간 정렬)

### 핵심 개념 요약

**비교 정렬의 하한 (Lower Bound)** ⭐ 매우 중요한 정리

**정리 8.1**: 최악의 경우, 비교 기반 정렬 알고리즘은 Ω(n lg n)번 비교 필요
- **증명**: 결정 트리(Decision Tree) 모델 사용
  - n개 원소의 순열: n!가지
  - 이진 트리의 리프 수 ≥ n!, 높이 h ≥ lg(n!) = Ω(n lg n)
- **의미**: Merge Sort, Heapsort는 **점근적 최적(Asymptotically Optimal)**

**비비교 정렬 (Non-comparison Sorts)**:

**계수 정렬 (Counting Sort)** — 값의 범위가 제한적일 때
- 입력: A[1..n], 각 원소 ∈ {0, 1, ..., k}
- **시간**: Θ(n + k), k = O(n)이면 Θ(n)
- **공간**: Θ(n + k)
- **안정 정렬 (Stable)** ← Radix Sort의 전제조건

```
COUNTING-SORT(A, B, k)
  C[0..k] = 0
  for j = 1 to A.length        // 각 값의 빈도 계산
    C[A[j]] = C[A[j]] + 1
  for i = 1 to k                // 누적합 계산
    C[i] = C[i] + C[i-1]
  for j = A.length downto 1     // 역순으로 배치 (안정성)
    B[C[A[j]]] = A[j]
    C[A[j]] = C[A[j]] - 1
```

**기수 정렬 (Radix Sort)** — 다중 자릿수 정렬
- LSD (Least Significant Digit) 방식: 가장 낮은 자리부터 정렬
- **시간**: Θ(d(n + k)), d = 자릿수, k = 기수
- **핵심**: 각 자릿수 정렬에 **안정 정렬** 사용 필수

```
RADIX-SORT(A, d)
  for i = 1 to d
    use a stable sort to sort A on digit i
```

**버킷 정렬 (Bucket Sort)** — 균등 분포 가정
- 입력이 [0, 1) 구간에 균등 분포
- n개 버킷에 분배 후 각 버킷 정렬
- **시간**: 평균 Θ(n), 최악 Θ(n²)

### 정렬 알고리즘 종합 비교표

| 알고리즘 | 최선 | 평균 | 최악 | 공간 | 안정 | 비교기반 |
|---------|------|------|------|------|------|---------|
| Insertion | Θ(n) | Θ(n²) | Θ(n²) | O(1) | ✅ | ✅ |
| Merge | Θ(n lg n) | Θ(n lg n) | Θ(n lg n) | Θ(n) | ✅ | ✅ |
| Heapsort | O(n lg n) | O(n lg n) | O(n lg n) | O(1) | ❌ | ✅ |
| Quicksort | Θ(n lg n) | Θ(n lg n) | Θ(n²) | O(lg n) | ❌ | ✅ |
| Counting | Θ(n+k) | Θ(n+k) | Θ(n+k) | Θ(n+k) | ✅ | ❌ |
| Radix | Θ(d(n+k)) | Θ(d(n+k)) | Θ(d(n+k)) | Θ(n+k) | ✅ | ❌ |
| Bucket | Θ(n) | Θ(n) | Θ(n²) | Θ(n) | ✅ | ❌ |

---

## Chapter 15: Dynamic Programming (동적 프로그래밍)

### 핵심 개념 요약

**DP 적용 조건** (두 가지 모두 만족해야 함):
1. **최적 부분 구조 (Optimal Substructure)**: 최적 해가 부분 문제의 최적 해를 포함
2. **중복 부분 문제 (Overlapping Subproblems)**: 동일 부분 문제가 반복 계산됨

**DP 설계 4단계**:
1. 최적 해의 구조를 특성화
2. 최적 해의 값을 재귀적으로 정의
3. 최적 해의 값을 (보통 bottom-up으로) 계산
4. 계산된 정보로부터 최적 해를 구성

**구현 방식**:
- **Top-down + Memoization**: 재귀 + 메모 테이블, 필요한 부분 문제만 계산
- **Bottom-up**: 작은 문제부터 차례로 계산, 반복문 사용

**막대 자르기 (Rod Cutting)**
- rₙ = max(pᵢ + rₙ₋ᵢ) for 1 ≤ i ≤ n
- **시간**: 나이브 O(2ⁿ) → DP Θ(n²)

```
BOTTOM-UP-CUT-ROD(p, n)
  r[0] = 0
  for j = 1 to n
    q = -∞
    for i = 1 to j
      q = max(q, p[i] + r[j-i])
    r[j] = q
  return r[n]
```

**행렬 체인 곱셈 (Matrix-Chain Multiplication)** ⭐
- m[i,j] = min{m[i,k] + m[k+1,j] + pᵢ₋₁·pₖ·pⱼ} for i ≤ k < j
- m[i,i] = 0
- **시간**: O(n³), **공간**: O(n²)

```
MATRIX-CHAIN-ORDER(p)
  n = p.length - 1
  m[1..n, 1..n] = 0
  for l = 2 to n           // l = 체인 길이
    for i = 1 to n-l+1
      j = i + l - 1
      m[i,j] = ∞
      for k = i to j-1
        q = m[i,k] + m[k+1,j] + p[i-1]·p[k]·p[j]
        if q < m[i,j]
          m[i,j] = q
          s[i,j] = k
```

**DP vs 분할 정복**:
- 분할 정복: 부분 문제가 독립적 (예: Merge Sort)
- DP: 부분 문제가 중복됨 (예: 피보나치)

---

## Chapter 16: Greedy Algorithms (탐욕 알고리즘)

### 핵심 개념 요약

**탐욕 알고리즘의 핵심 성질**:
1. **탐욕 선택 성질 (Greedy-Choice Property)**: 지역적 최적 선택이 전역 최적 해로 이어짐
2. **최적 부분 구조 (Optimal Substructure)**: DP와 공유하는 성질

**탐욕 vs DP**:
- **탐욕**: 선택 후 부분 문제 풀기 (top-down), 한 번의 선택
- **DP**: 부분 문제 먼저 풀기 (bottom-up), 모든 선택지 비교

**활동 선택 문제 (Activity Selection)** ⭐
- 호환 가능한 최대 활동 집합 선택
- **탐욕 전략**: 종료 시간이 가장 빠른 활동을 먼저 선택
- **시간**: Θ(n) (정렬 후), 정렬 포함 시 O(n lg n)

```
GREEDY-ACTIVITY-SELECTOR(s, f)
  n = s.length
  A = {a₁}           // 가장 빨리 끝나는 활동
  k = 1
  for m = 2 to n
    if s[m] ≥ f[k]   // 호환 가능하면
      A = A ∪ {aₘ}
      k = m
  return A
```

**허프만 코드 (Huffman Codes)** ⭐
- 최적 접두사 코드 (Optimal Prefix Code) 생성
- 빈도 높은 문자 = 짧은 코드, 빈도 낮은 문자 = 긴 코드
- **시간**: O(n lg n) (최소 힙 사용)

```
HUFFMAN(C)
  n = |C|
  Q = C                    // 최소 우선순위 큐
  for i = 1 to n-1
    z = new node
    z.left = x = EXTRACT-MIN(Q)
    z.right = y = EXTRACT-MIN(Q)
    z.freq = x.freq + y.freq
    INSERT(Q, z)
  return EXTRACT-MIN(Q)    // 루트
```

**배낭 문제 비교**:
- **분할 가능 배낭 (Fractional Knapsack)**: 탐욕으로 최적 해 가능 — 단위 가치순 선택
- **0-1 배낭 (0-1 Knapsack)**: 탐욕 불가, DP 필요

---

## Chapter 22: Elementary Graph Algorithms (기초 그래프 알고리즘)

### 핵심 개념 요약

**그래프 표현**:
- **인접 리스트 (Adjacency List)**: 공간 Θ(V+E), 희소 그래프에 적합
- **인접 행렬 (Adjacency Matrix)**: 공간 Θ(V²), 밀집 그래프 또는 간선 존재 여부 O(1) 확인

**너비 우선 탐색 (BFS)** ⭐
- 시작 정점 s로부터 **최단 경로** (간선 수 기준) 계산
- **시간**: O(V + E)
- 정점 색상: WHITE (미발견) → GRAY (발견, 큐에 존재) → BLACK (처리 완료)
- **BFS 트리**: 최단 경로 트리

```
BFS(G, s)
  모든 정점 u: u.color=WHITE, u.d=∞, u.π=NIL
  s.color=GRAY, s.d=0, s.π=NIL
  Q = {s}
  while Q ≠ ∅
    u = DEQUEUE(Q)
    for each v ∈ G.Adj[u]
      if v.color == WHITE
        v.color = GRAY
        v.d = u.d + 1
        v.π = u
        ENQUEUE(Q, v)
    u.color = BLACK
```

**깊이 우선 탐색 (DFS)** ⭐
- **시간**: Θ(V + E)
- 타임스탬프: u.d (발견 시간), u.f (종료 시간)
- **괄호 정리 (Parenthesis Theorem)**: 구간 [u.d, u.f]와 [v.d, v.f]는 포함되거나 분리됨
- **백색 경로 정리 (White-Path Theorem)**: v가 u의 후손 ⟺ 시간 u.d에 u→v 백색 경로 존재

```
DFS(G)
  모든 정점 u: u.color=WHITE, u.π=NIL
  time = 0
  for each u ∈ G.V
    if u.color == WHITE
      DFS-VISIT(G, u)

DFS-VISIT(G, u)
  time++; u.d = time; u.color = GRAY
  for each v ∈ G.Adj[u]
    if v.color == WHITE
      v.π = u
      DFS-VISIT(G, v)
  u.color = BLACK
  time++; u.f = time
```

**간선 분류 (Edge Classification)**:

| 간선 유형 | 조건 | 의미 |
|----------|------|------|
| **Tree edge** | v가 WHITE | DFS 트리의 간선 |
| **Back edge** | v가 GRAY | 조상으로의 간선 (사이클 존재!) |
| **Forward edge** | v가 BLACK, u.d < v.d | 후손으로의 간선 |
| **Cross edge** | v가 BLACK, u.d > v.d | 나머지 |

**핵심 정리**: 방향 그래프에 사이클 존재 ⟺ DFS에서 **back edge** 존재

**위상 정렬 (Topological Sort)** ⭐
- DAG (Directed Acyclic Graph)에서만 가능
- DFS 수행 후 **종료 시간 f의 역순**으로 정렬
- **시간**: Θ(V + E)
- **보조정리 22.11**: DAG ⟺ DFS에서 back edge 없음

**강연결 요소 (Strongly Connected Components, SCC)** ⭐
- u↔v (양방향 도달 가능)인 최대 정점 집합
- **코사라주 알고리즘**: 두 번의 DFS

```
STRONGLY-CONNECTED-COMPONENTS(G)
  1. G에 DFS → 종료 시간 f 계산
  2. G^T (전치 그래프) 계산
  3. G^T에 DFS (f의 감소순으로 정점 처리)
  4. 각 DFS 트리가 하나의 SCC
```
- **시간**: Θ(V + E)
- 요소 그래프 G^SCC는 항상 **DAG**

---

## Chapter 23: Minimum Spanning Trees (최소 신장 트리)

### 핵심 개념 요약

**MST 문제**: 무방향 가중 연결 그래프에서 모든 정점을 연결하는 최소 가중치 트리

**핵심 정리 (Theorem 23.1)** ⭐:
- 절단(cut) (S, V-S)를 존중하는 간선 집합 A에 대해
- 절단을 가로지르는 **경량 간선 (light edge)**은 A에 대해 **안전 (safe)**
- 즉, MST에 포함 가능

**핵심 용어**:
- **절단 (Cut)**: 정점 집합을 (S, V-S)로 분할
- **절단을 가로지르는 간선**: 한 끝점이 S, 다른 끝점이 V-S
- **경량 간선 (Light edge)**: 절단을 가로지르는 최소 가중치 간선
- **안전한 간선 (Safe edge)**: A에 추가해도 MST의 부분집합 유지

**크루스칼 알고리즘 (Kruskal's Algorithm)** ⭐
- **전략**: 가중치 오름차순으로 간선 정렬, 사이클 없으면 추가
- **자료구조**: Union-Find (서로소 집합)
- **시간**: O(E lg V) (간선 정렬이 지배적)

```
MST-KRUSKAL(G, w)
  A = ∅
  for each v ∈ G.V
    MAKE-SET(v)
  간선을 w 오름차순 정렬
  for each (u,v) ∈ 정렬된 간선
    if FIND-SET(u) ≠ FIND-SET(v)
      A = A ∪ {(u,v)}
      UNION(u, v)
  return A
```

**프림 알고리즘 (Prim's Algorithm)** ⭐
- **전략**: 트리에서 가장 가까운 정점을 반복 추가 (BFS와 유사)
- **자료구조**: 최소 우선순위 큐
- **시간**: 이진 힙 O(E lg V), 피보나치 힙 O(E + V lg V)

```
MST-PRIM(G, w, r)
  for each u ∈ G.V
    u.key = ∞; u.π = NIL
  r.key = 0
  Q = G.V (최소 우선순위 큐)
  while Q ≠ ∅
    u = EXTRACT-MIN(Q)
    for each v ∈ G.Adj[u]
      if v ∈ Q and w(u,v) < v.key
        v.π = u
        v.key = w(u,v)   // DECREASE-KEY
```

**Kruskal vs Prim**:
- Kruskal: 간선 중심, 희소 그래프에 유리
- Prim: 정점 중심, 밀집 그래프에 유리 (피보나치 힙 사용 시)

---

## Chapter 24: Single-Source Shortest Paths (단일 출발점 최단 경로)

### 핵심 개념 요약

**최단 경로 가중치**: δ(u,v) = min{w(p) : u ↝ v} (경로 존재 시), ∞ (경로 없을 시)

**완화 (Relaxation)** — 모든 최단 경로 알고리즘의 핵심 기법

```
INITIALIZE-SINGLE-SOURCE(G, s)
  for each v ∈ G.V
    v.d = ∞; v.π = NIL
  s.d = 0

RELAX(u, v, w)
  if v.d > u.d + w(u,v)
    v.d = u.d + w(u,v)
    v.π = u
```

**최단 경로의 핵심 성질**:
- **삼각 부등식**: δ(s,v) ≤ δ(s,u) + w(u,v)
- **상한 성질**: v.d ≥ δ(s,v) 항상 성립, 한번 δ(s,v)가 되면 변하지 않음
- **경로 완화 성질**: p = ⟨v₀,v₁,...,vₖ⟩ 순서로 완화하면 vₖ.d = δ(s,vₖ)

**벨만-포드 알고리즘 (Bellman-Ford)** ⭐
- **음수 가중치** 허용, **음수 사이클 감지** 가능
- **시간**: O(VE)

```
BELLMAN-FORD(G, w, s)
  INITIALIZE-SINGLE-SOURCE(G, s)
  for i = 1 to |G.V| - 1
    for each (u,v) ∈ G.E
      RELAX(u, v, w)
  for each (u,v) ∈ G.E      // 음수 사이클 검사
    if v.d > u.d + w(u,v)
      return FALSE
  return TRUE
```

**왜 |V|-1번 반복?**: 최단 경로는 최대 |V|-1개의 간선 → |V|-1번 완화로 충분

**DAG 최단 경로** ⭐
- 위상 정렬 후 순서대로 완화
- **시간**: Θ(V + E)
- 응용: PERT 차트, 임계 경로 (critical path)

```
DAG-SHORTEST-PATHS(G, w, s)
  위상 정렬(G)
  INITIALIZE-SINGLE-SOURCE(G, s)
  for each u (위상 정렬 순서)
    for each v ∈ G.Adj[u]
      RELAX(u, v, w)
```

**다익스트라 알고리즘 (Dijkstra's Algorithm)** ⭐
- **조건**: 모든 간선 가중치 ≥ 0
- **전략**: 가장 가까운 미처리 정점부터 완화 (탐욕적)
- **시간**: 배열 O(V²), 이진 힙 O(E lg V), 피보나치 힙 O(V lg V + E)

```
DIJKSTRA(G, w, s)
  INITIALIZE-SINGLE-SOURCE(G, s)
  S = ∅
  Q = G.V (최소 우선순위 큐, 키 = v.d)
  while Q ≠ ∅
    u = EXTRACT-MIN(Q)
    S = S ∪ {u}
    for each v ∈ G.Adj[u]
      RELAX(u, v, w)      // + DECREASE-KEY
```

### 최단 경로 알고리즘 비교

| 알고리즘 | 시간 복잡도 | 음수 가중치 | 음수 사이클 감지 | 그래프 조건 |
|---------|-----------|-----------|----------------|-----------|
| Bellman-Ford | O(VE) | ✅ | ✅ | 일반 |
| DAG-SP | Θ(V+E) | ✅ | N/A (DAG) | DAG만 |
| Dijkstra | O(V lg V + E) | ❌ | ❌ | 비음수 가중치 |

---

# 📝 TIER 1 종합 퀴즈

## Part A: 개념 확인 (단답형)

**Q1.** 비교 기반 정렬의 최악의 경우 하한은? 이를 증명하는 데 사용되는 모델은?

**Q2.** f(n) = Θ(g(n))이 성립하기 위한 필요충분조건을 O와 Ω로 표현하시오.

**Q3.** 마스터 정리에서 T(n) = 4T(n/2) + n의 해는?

**Q4.** BUILD-MAX-HEAP의 시간 복잡도가 O(n lg n)이 아닌 O(n)인 이유를 간단히 설명하시오.

**Q5.** 퀵 정렬이 최악 Θ(n²)이 되는 입력과 이를 방지하는 방법은?

**Q6.** Counting Sort가 안정 정렬이어야 하는 이유는? (힌트: Radix Sort와의 관계)

**Q7.** 동적 프로그래밍 적용을 위한 두 가지 필수 조건은?

**Q8.** 탐욕 알고리즘과 DP의 핵심 차이점은?

**Q9.** 방향 그래프에 사이클이 존재하는지 DFS로 어떻게 판별하는가?

**Q10.** Dijkstra 알고리즘이 음수 가중치에서 실패하는 이유를 간단히 설명하시오.

## Part B: 알고리즘 적용 (서술형)

**Q11.** 다음 점화식의 해를 마스터 정리로 구하시오:
- (a) T(n) = 2T(n/4) + √n
- (b) T(n) = 7T(n/2) + n²
- (c) T(n) = 2T(n/2) + n lg n

**Q12.** 배열 A = [5, 3, 8, 1, 2, 7, 4, 6]에 대해:
- (a) PARTITION(A, 1, 8)의 결과를 단계별로 보이시오 (피벗 = 6)
- (b) BUILD-MAX-HEAP의 과정을 보이시오

**Q13.** 다음 활동 집합에서 최대 호환 활동을 탐욕적으로 선택하시오:

| 활동 | s (시작) | f (종료) |
|------|---------|---------|
| a₁ | 1 | 4 |
| a₂ | 3 | 5 |
| a₃ | 0 | 6 |
| a₄ | 5 | 7 |
| a₅ | 3 | 9 |
| a₆ | 5 | 9 |
| a₇ | 6 | 10 |
| a₈ | 8 | 11 |
| a₉ | 8 | 12 |
| a₁₀ | 2 | 14 |

**Q14.** 다음 그래프에서 BFS(s)와 DFS를 수행하시오 (인접 리스트는 알파벳 순):
```
정점: {s, a, b, c, d}
간선: s→a, s→b, a→c, b→c, b→d, c→d
```
- BFS: 각 정점의 d값과 π값을 구하시오
- DFS: 각 정점의 d/f 타임스탬프와 간선 분류를 하시오

**Q15.** 다음 그래프에서 Kruskal과 Prim(시작점 a) 알고리즘의 실행 과정을 보이시오:
```
a --4-- b
|       |
8   2   7
|  / \  |
c --1-- d
```
간선: (a,b,4), (a,c,8), (b,d,7), (c,d,1), (b,c,2)

**Q16.** 다음 그래프에서 Bellman-Ford(s)와 Dijkstra(s)를 각각 실행하시오:
```
s →(6)→ a →(5)→ b
s →(7)→ c →(-2)→ a
c →(4)→ b
```
간선: (s,a,6), (s,c,7), (a,b,5), (c,a,-2), (c,b,4)

## Part C: 증명/분석 (고급)

**Q17.** 정리 8.1(비교 정렬 하한)의 증명을 결정 트리 모델을 이용하여 서술하시오.

**Q18.** MST 정리(Theorem 23.1)를 서술하고, 이것이 Kruskal과 Prim 알고리즘의 정확성을 어떻게 보장하는지 설명하시오.

**Q19.** Bellman-Ford 알고리즘이 |V|-1번 반복 후 정확한 최단 경로를 계산함을 경로 완화 성질을 이용하여 설명하시오.

**Q20.** 0-1 배낭 문제에 탐욕 알고리즘이 최적이 아님을 반례로 보이시오. 분할 가능 배낭 문제에는 왜 최적인지 설명하시오.

---

## 📋 퀴즈 정답

### Part A 정답

**A1.** Ω(n lg n). 결정 트리(Decision Tree) 모델을 사용하여 증명. n개 원소의 순열 n!개가 리프가 되어야 하므로 트리 높이 h ≥ lg(n!) = Ω(n lg n).

**A2.** f(n) = Θ(g(n)) ⟺ f(n) = O(g(n)) AND f(n) = Ω(g(n))

**A3.** a=4, b=2, n^(log₂4) = n². f(n) = n = O(n^(2-1)), Case 1 → **T(n) = Θ(n²)**

**A4.** 높이 h인 노드에 대해 MAX-HEAPIFY는 O(h)이고, 높이 h인 노드 수는 ≤ ⌈n/2^(h+1)⌉. 대부분의 노드가 낮은 높이에 있으므로 총합 Σ⌈n/2^(h+1)⌉·O(h) = O(n·Σh/2ʰ) = O(n) (수렴하는 급수).

**A5.** 이미 정렬된(또는 역순) 배열에서 매번 0:(n-1) 불균형 분할 발생. **랜덤화(Randomized Quicksort)** — 피벗을 무작위 선택하여 방지.

**A6.** Radix Sort는 각 자릿수를 정렬할 때 이전 자릿수의 순서가 유지되어야 한다. 만약 Counting Sort가 불안정하면, 상위 자릿수 정렬 시 하위 자릿수에서 정렬된 순서가 깨진다.

**A7.** (1) 최적 부분 구조 (Optimal Substructure) (2) 중복 부분 문제 (Overlapping Subproblems)

**A8.** 탐욕: 선택을 먼저 하고 나머지 부분 문제를 풀음 (한 번의 선택). DP: 모든 부분 문제를 풀고 그 결과를 조합하여 최적 선택 (모든 선택지 비교).

**A9.** DFS 수행 시 **back edge**가 발견되면 사이클이 존재한다. 즉, 어떤 정점 v의 인접 정점이 GRAY 상태이면 back edge이고 사이클이 존재.

**A10.** Dijkstra는 한 번 S 집합에 추가된 정점의 d값이 최종 최단 거리라고 가정(탐욕적 선택). 음수 가중치가 있으면 이후에 발견되는 경로가 더 짧을 수 있어 이 가정이 깨진다.

### Part B 정답

**A11.**
- (a) a=2, b=4, n^(log₄2) = n^(1/2) = √n. f(n) = √n = Θ(n^(1/2)). **Case 2** → **T(n) = Θ(√n · lg n)**
- (b) a=7, b=2, n^(log₂7) ≈ n^2.807. f(n) = n² = O(n^(2.807-ε)). **Case 1** → **T(n) = Θ(n^(lg 7))** ≈ Θ(n^2.807)
- (c) a=2, b=2, n^(log₂2) = n. f(n) = n lg n. n lg n vs n: f(n)/n^(log_b a) = lg n이므로 다항식적으로 크지 않음. **마스터 정리 적용 불가** (Case 2와 3 사이의 갭). 재귀 트리로 풀면 **T(n) = Θ(n lg² n)**.

**A12.**
(a) A = [5,3,8,1,2,7,4,6], 피벗 x=6, i=0:
- j=1: A[1]=5≤6 → i=1, swap(A[1],A[1]) → [5,3,8,1,2,7,4,6]
- j=2: A[2]=3≤6 → i=2, swap(A[2],A[2]) → [5,3,8,1,2,7,4,6]
- j=3: A[3]=8>6 → 건너뜀
- j=4: A[4]=1≤6 → i=3, swap(A[3],A[4]) → [5,3,1,8,2,7,4,6]
- j=5: A[5]=2≤6 → i=4, swap(A[4],A[5]) → [5,3,1,2,8,7,4,6]
- j=6: A[6]=7>6 → 건너뜀
- j=7: A[7]=4≤6 → i=5, swap(A[5],A[7]) → [5,3,1,2,4,7,8,6]
- 최종: swap(A[6],A[8]) → **[5,3,1,2,4,6,8,7]**, 반환 q=6

(b) BUILD-MAX-HEAP: 초기 [5,3,8,1,2,7,4,6]
- i=4: MAX-HEAPIFY(4) → A[4]=1, children: A[8]=6 → swap → [5,3,8,6,2,7,4,1]
- i=3: MAX-HEAPIFY(3) → A[3]=8, children: A[6]=7,A[7]=4 → 변화없음
- i=2: MAX-HEAPIFY(2) → A[2]=3, children: A[4]=6,A[5]=2 → swap(2,4) → [5,6,8,3,2,7,4,1]
  - MAX-HEAPIFY(4) → A[4]=3, A[8]=1 → 변화없음
- i=1: MAX-HEAPIFY(1) → A[1]=5, children: A[2]=6,A[3]=8 → swap(1,3) → [8,6,5,3,2,7,4,1]
  - MAX-HEAPIFY(3) → A[3]=5, children: A[6]=7,A[7]=4 → swap(3,6) → **[8,6,7,3,2,5,4,1]**

**A13.** 종료 시간 순으로 정렬: a₁(4), a₂(5), a₃(6), a₄(7), a₅(9), a₆(9), a₇(10), a₈(11), a₉(12), a₁₀(14)
- 선택 a₁ (f=4)
- a₂: s=3 < 4 ❌, a₃: s=0 < 4 ❌
- 선택 a₄ (s=5 ≥ 4, f=7) ✅
- a₅: s=3 < 7 ❌, a₆: s=5 < 7 ❌, a₇: s=6 < 7 ❌
- 선택 a₈ (s=8 ≥ 7, f=11) ✅
- a₉: s=8 < 11 ❌, a₁₀: s=2 < 11 ❌
- **결과: {a₁, a₄, a₈}** — 최대 3개

**A14.**
BFS(s): 큐 순서 s→a,b→c,d
- s: d=0, π=NIL
- a: d=1, π=s
- b: d=1, π=s
- c: d=2, π=a (a에서 먼저 발견)
- d: d=2, π=b

DFS (알파벳순): 시작 s
- s: d=1, 방문 a
  - a: d=2, 방문 c
    - c: d=3, 방문 d
      - d: d=4, 인접 없음(이미 방문), f=5
    - c: f=6
  - a: f=7
- s: 방문 b (이미 발견됨)
- s: f=8
- b: d=9, f=10 (별도 트리)

간선 분류: s→a: Tree, s→b: Forward/Cross, a→c: Tree, b→c: Cross, b→d: Cross, c→d: Tree

**A15.**
Kruskal (가중치 순): (c,d,1) → (b,c,2) → (a,b,4) → (a,c,8) (스킵, 사이클) → (b,d,7) (스킵, 사이클)
MST = {(c,d,1), (b,c,2), (a,b,4)}, 총 가중치 = 7

Prim (시작 a):
- Q에서 a 추출: a.key=0. 이웃 b(4), c(8) 갱신
- Q에서 b 추출: b.key=4. 이웃 c: min(8,2)=2 갱신, d: 7 갱신
- Q에서 c 추출: c.key=2. 이웃 d: min(7,1)=1 갱신
- Q에서 d 추출: d.key=1
MST = {(a,b,4), (b,c,2), (c,d,1)}, 총 가중치 = 7

**A16.**
Bellman-Ford(s): 초기 s.d=0, 나머지 ∞
- 1차 반복: (s,a,6)→a.d=6, (s,c,7)→c.d=7, (a,b,5)→b.d=11, (c,a,-2)→a.d=5, (c,b,4)→b.d=11
- 2차 반복: (a,b,5)→b.d=10, 나머지 변화없음
- 3차 반복: 변화없음 → 수렴
- 최종: s.d=0, a.d=5, b.d=10, c.d=7

Dijkstra(s): 음수 간선 (c,a,-2) 존재 → **Dijkstra 적용 불가** (부정확한 결과 가능)
만약 적용하면: s(0) 추출 → a.d=6, c.d=7 → a(6) 추출 → b.d=11 → c(7) 추출 → a.d=5 (이미 S에 포함!) → 오류
실제 δ(s,a)=5이지만 Dijkstra는 a.d=6으로 확정 후 수정 불가

### Part C 정답 개요

**A17.** (결정 트리 증명)
비교 정렬은 원소 간 비교(aᵢ ≤ aⱼ?)로만 순서 결정. 이를 이진 결정 트리로 모델링하면: 각 내부 노드 = 비교, 각 리프 = 하나의 순열. n개 원소의 가능한 순열 = n!이므로 리프 수 l ≥ n!. 높이 h인 이진 트리는 최대 2ʰ개의 리프를 가지므로 2ʰ ≥ n! → h ≥ lg(n!) = Ω(n lg n) (스털링 근사에 의해).

**A18.** Theorem 23.1: A가 MST의 부분집합이고, (S, V-S)가 A를 존중하는 절단이면, 이 절단을 가로지르는 경량 간선 (u,v)는 A에 대해 안전하다.
- Kruskal: 각 단계에서 선택하는 간선은 두 컴포넌트를 분리하는 절단의 경량 간선
- Prim: 트리 T와 V-T의 절단에서 경량 간선을 선택

**A19.** 최단 경로 p = ⟨v₀=s, v₁, ..., vₖ⟩에서 간선 수 ≤ |V|-1. i번째 반복에서 간선 (vᵢ₋₁, vᵢ)가 완화됨 (모든 간선을 완화하므로). 경로 완화 성질에 의해, |V|-1번 반복 후 vₖ.d = δ(s, vₖ).

**A20.** 반례: 용량 W=50, 물건 {(무게 10, 가치 60), (무게 20, 가치 100), (무게 30, 가치 120)}.
단위 가치: 6, 5, 4. 탐욕(단위 가치순): 물건1(10)+물건2(20)=30, 가치 160. 최적(DP): 물건2+물건3=50, 가치 220.
분할 가능 배낭이 탐욕으로 최적인 이유: 물건을 쪼갤 수 있으므로, 남은 용량을 가장 높은 단위 가치로 정확히 채울 수 있어 탐욕 선택이 항상 최적.

---

> 💡 **학습 팁**: Tier 1의 모든 알고리즘에 대해 (1) 의사코드를 직접 작성하고, (2) 시간/공간 복잡도를 증명할 수 있으며, (3) 작은 예제에 직접 실행해 볼 수 있어야 합니다.

---

# 🟡 TIER 2: 핵심 보충 챕터

---

## Chapter 9: Medians and Order Statistics (중앙값과 순서 통계량)

### 핵심 개념 요약

**선택 문제 (Selection Problem)**: n개 원소 중 i번째로 작은 원소를 찾기
- 정렬 후 선택: O(n lg n) — 비효율적
- **목표**: O(n) 선형 시간에 해결

**최솟값/최댓값 동시 찾기**:
- 단순: 2(n-1)번 비교
- **쌍으로 처리**: 3⌊n/2⌋번 비교 (한 쌍을 먼저 비교 후 작은 것은 min, 큰 것은 max와 비교)

**RANDOMIZED-SELECT** ⭐ (기댓값 O(n))
- 퀵 정렬의 PARTITION 활용, 한 쪽만 재귀
- **점화식**: T(n) = T(n/2) + Θ(n) (기댓값) → **Θ(n)**
- **최악**: Θ(n²) (피벗이 매번 극단)

```
RANDOMIZED-SELECT(A, p, r, i)
  if p == r
    return A[p]
  q = RANDOMIZED-PARTITION(A, p, r)
  k = q - p + 1                    // 왼쪽 부분 크기 + 피벗
  if i == k
    return A[q]                    // 피벗이 답
  elif i < k
    return RANDOMIZED-SELECT(A, p, q-1, i)
  else
    return RANDOMIZED-SELECT(A, q+1, r, i-k)
```

**SELECT (Median-of-Medians)** ⭐ (최악 O(n))
- **5개씩 그룹으로 분할** → 각 그룹의 중앙값 → 중앙값들의 중앙값을 피벗으로

```
SELECT(A, i)
  1. n개 원소를 ⌈n/5⌉개의 5원소 그룹으로 분할
  2. 각 그룹을 정렬하여 중앙값 추출
  3. 중앙값들의 중앙값 x = SELECT(중앙값들, ⌈⌈n/5⌉/2⌉)
  4. x를 피벗으로 PARTITION
  5. 적절한 쪽으로 재귀
```

**최악 O(n) 증명 핵심**:
- 중앙값들의 중앙값 x보다 큰 원소: 최소 3⌈⌈n/5⌉/2⌉ - 6 ≈ **3n/10 - 6**
- 따라서 한 쪽 재귀 크기 ≤ **7n/10 + 6**
- **점화식**: T(n) ≤ T(n/5) + T(7n/10 + 6) + O(n)
- 1/5 + 7/10 = 9/10 < 1 → 치환법으로 T(n) = O(n)

**왜 5개 그룹인가?**: 3개면 1/3 + 2/3 = 1로 점화식이 선형이 안 됨. 7개도 가능하지만 상수가 커짐.

---

## Chapter 11: Hash Tables (해시 테이블)

### 핵심 개념 요약

**직접 주소화 테이블 (Direct-Address Table)**: 키 ∈ U = {0,...,m-1}, T[k] = x
- 모든 연산 O(1), 단점: |U|가 크면 공간 낭비

**해시 테이블**: T[h(k)]에 저장, 해시 함수 h: U → {0,...,m-1}
- 적재율 (load factor): **α = n/m** (n=원소 수, m=슬롯 수)

### 충돌 해결 (Collision Resolution)

**1. 체이닝 (Chaining)**
- 각 슬롯이 연결 리스트
- **검색 시간**: 평균 Θ(1+α), α=O(1)이면 O(1)
- 단순 균등 해싱 가정 (Simple Uniform Hashing) 필요

**2. 개방 주소법 (Open Addressing)**
- 모든 원소를 테이블에 저장, h(k,i) 탐사 순서
- 적재율 α < 1 필수

| 탐사 방식 | 함수 | 문제점 |
|----------|------|-------|
| **선형 탐사 (Linear)** | h(k,i) = (h'(k) + i) mod m | **1차 군집** (primary clustering) |
| **이차 탐사 (Quadratic)** | h(k,i) = (h'(k) + c₁i + c₂i²) mod m | 2차 군집 |
| **이중 해싱 (Double)** | h(k,i) = (h₁(k) + i·h₂(k)) mod m | 가장 균등에 가까움 |

**개방 주소법 평균 탐사 횟수** (균등 해싱 가정):
- 검색 실패: ≤ **1/(1-α)**
- 검색 성공: ≤ **(1/α)·ln(1/(1-α))**
- α=0.5 → 약 2회, α=0.9 → 약 10회

### 해시 함수 설계

**1. 나눗셈 방법 (Division)**: h(k) = k mod m
- m은 2의 거듭제곱이 아닌 **소수**가 좋음 (예: m = 701)

**2. 곱셈 방법 (Multiplication)**: h(k) = ⌊m·(kA mod 1)⌋
- 0 < A < 1, **A = (√5-1)/2 ≈ 0.618** (Knuth 추천 황금비)
- m이 2의 거듭제곱이어도 OK

**3. 보편 해싱 (Universal Hashing)** ⭐
- 해시 함수족 H에서 무작위 선택
- **보편적 (universal)**: 임의 키 k≠l, Pr[h(k)=h(l)] ≤ 1/m
- **장점**: 적대적 입력에도 평균 O(1) 보장

**완전 해싱 (Perfect Hashing)**: 정적 키 집합에 대해 최악 O(1) 검색, 2단계 해싱 사용

---

## Chapter 12-13: BST + Red-Black Trees

### Chapter 12: Binary Search Tree

**BST 성질**: 노드 x에 대해
- 왼쪽 서브트리의 모든 키 ≤ x.key
- 오른쪽 서브트리의 모든 키 ≥ x.key

**기본 연산** — 모두 **O(h)**, h = 트리 높이
- SEARCH, MINIMUM, MAXIMUM, SUCCESSOR, PREDECESSOR
- INSERT, DELETE, INORDER-TREE-WALK (Θ(n))

**중위 순회 (Inorder Walk)**: BST를 정렬된 순서로 출력 → Θ(n)

**BST DELETE의 3가지 경우**:
1. z가 자식 없음 → 그냥 제거
2. z가 자식 1개 → 자식으로 대체 (TRANSPLANT)
3. z가 자식 2개 → **후속자 y = TREE-MINIMUM(z.right)**로 대체

**BST 높이**:
- **무작위 구성 BST**: 평균 높이 O(lg n)
- **최악**: O(n) (정렬된 입력 → 사슬 형태)

### Chapter 13: Red-Black Tree ⭐

**5가지 RB 성질**:
1. 모든 노드는 RED 또는 BLACK
2. **루트는 BLACK**
3. 모든 리프 (NIL)는 BLACK
4. **RED 노드의 자식은 모두 BLACK** (연속된 RED 금지)
5. 각 노드에서 모든 후손 리프까지의 **검은 노드 수가 동일** (black-height bh(x))

**핵심 정리 (높이 한계)** ⭐:
**n개 내부 노드를 갖는 RB-Tree의 높이 h ≤ 2 lg(n+1)**

**증명**:
- 보조정리: 노드 x를 루트로 하는 서브트리는 ≥ 2^bh(x) - 1개의 내부 노드 (귀납법)
- 성질 4에 의해 루트→리프 경로의 절반 이상이 BLACK → bh ≥ h/2
- n ≥ 2^bh - 1 ≥ 2^(h/2) - 1 → h ≤ 2 lg(n+1) ∎

**결과**: SEARCH, INSERT, DELETE 모두 **O(lg n)** 보장

### 회전 (Rotation)

```
LEFT-ROTATE(T, x)              RIGHT-ROTATE(T, y)
   x                  y           y                  x
  / \                / \         / \                / \
 α   y      →      x   γ        x   γ      →       α   y
    / \           / \          / \                    / \
   β   γ         α   β        α   β                  β   γ
```
- O(1), 중위 순회 순서 보존

### INSERT (삽입 후 위반 수정)

새 노드 z는 **RED**로 삽입 → 성질 4 위반 가능 (z.parent도 RED일 때)

**RB-INSERT-FIXUP 3 cases** (z.parent가 z.parent.parent의 왼쪽 자식인 경우):

| Case | 조건 | 처리 |
|------|------|------|
| **Case 1** | 삼촌 y가 RED | 부모/삼촌 → BLACK, 조부모 → RED, z = 조부모 (반복) |
| **Case 2** | 삼촌 y가 BLACK, z가 오른쪽 자식 | z = z.parent, LEFT-ROTATE(z) → Case 3 |
| **Case 3** | 삼촌 y가 BLACK, z가 왼쪽 자식 | 부모 → BLACK, 조부모 → RED, RIGHT-ROTATE(조부모) |

- **시간**: O(lg n), 회전 횟수 ≤ 2

### DELETE (삭제 후 위반 수정)

삭제된 노드/자리 차지한 노드의 색이 BLACK이면 성질 5 위반 → "**doubly black**" 노드 x를 따라 위로

**RB-DELETE-FIXUP 4 cases** (x가 왼쪽 자식인 경우):

| Case | 조건 | 처리 |
|------|------|------|
| **Case 1** | 형제 w가 RED | w → BLACK, 부모 → RED, LEFT-ROTATE(부모) → Case 2/3/4 |
| **Case 2** | w BLACK, w의 두 자식 BLACK | w → RED, x = x.parent (반복) |
| **Case 3** | w BLACK, w.left RED, w.right BLACK | w.left → BLACK, w → RED, RIGHT-ROTATE(w) → Case 4 |
| **Case 4** | w BLACK, w.right RED | w 색 = 부모 색, 부모 → BLACK, w.right → BLACK, LEFT-ROTATE(부모), x = root (종료) |

- **시간**: O(lg n), 회전 횟수 ≤ 3

---

## Chapter 21: Disjoint Sets (서로소 집합 / Union-Find)

### 핵심 개념 요약

**서로소 집합 자료구조**: 서로 겹치지 않는 동적 집합 컬렉션 관리
- **MAKE-SET(x)**: {x} 새 집합 생성
- **UNION(x, y)**: x와 y가 속한 두 집합 합치기
- **FIND-SET(x)**: x가 속한 집합의 대표 반환

**응용**:
- Kruskal MST 알고리즘
- 무방향 그래프 연결 요소
- 동치 관계 관리

### 구현

**1. 연결 리스트 표현**
- 각 원소 → 대표를 가리키는 포인터
- UNION: 짧은 리스트를 긴 쪽에 연결 (weighted-union heuristic) → m번 연산에 O(m + n lg n)

**2. 트리 표현 + 휴리스틱** ⭐ (사실상 표준)
- 각 집합 = 루트 = 대표
- **Union by rank**: 낮은 랭크 트리를 높은 랭크 트리에 붙임
- **Path compression**: FIND-SET 중 경로상 모든 노드가 루트를 직접 가리키도록

```
MAKE-SET(x)
  x.p = x; x.rank = 0

FIND-SET(x)                       // 경로 압축
  if x.p ≠ x
    x.p = FIND-SET(x.p)
  return x.p

UNION(x, y)
  LINK(FIND-SET(x), FIND-SET(y))

LINK(x, y)                        // 랭크에 의한 합집합
  if x.rank > y.rank
    y.p = x
  else
    x.p = y
    if x.rank == y.rank
      y.rank = y.rank + 1
```

### 시간 복잡도

| 휴리스틱 | m번 연산 시간 |
|---------|------|
| 없음 | O(mn) |
| Union by rank만 | O(m lg n) |
| Path compression만 | O((m + n) lg n) (실은 더 좋음) |
| **둘 다 사용** ⭐ | **O(m·α(n))** ≈ O(m) |

**α(n)**: 매우 느리게 증가하는 역 Ackermann 함수, 실제 모든 n ≤ 2^65536에 대해 α(n) ≤ 4
- 사실상 **상수 시간** (amortized)

**핵심 정리 (Tarjan)**: 두 휴리스틱 모두 사용 시 m번의 MAKE-SET, UNION, FIND-SET 연산이 O(m·α(n)) 시간

---

## Chapter 25: All-Pairs Shortest Paths (모든 쌍 최단 경로)

### 핵심 개념 요약

**문제**: 모든 정점 쌍 (u,v)에 대해 δ(u,v) 계산
- 단순 방법: 각 정점에서 SSSP 실행
  - Dijkstra × V회: O(V³ + VE) (음수 가중치 불가)
  - Bellman-Ford × V회: O(V²E) (느림)

### 행렬 곱셈 기반 (DP)

**점화식**: lᵢⱼ^(m) = 최대 m개 간선 사용한 i→j 최단 경로 길이
- lᵢⱼ^(m) = min{lᵢⱼ^(m-1), min_k(lᵢₖ^(m-1) + wₖⱼ)}
- 최단 경로 ≤ n-1 간선 → L^(n-1) = 답
- **시간**: Θ(V⁴), 반복 제곱법으로 Θ(V³ lg V)

### Floyd-Warshall 알고리즘 ⭐ (DP의 정수)

**점화식**: dᵢⱼ^(k) = 중간 정점이 {1,...,k}만 사용 가능한 최단 경로
- dᵢⱼ^(0) = wᵢⱼ
- **dᵢⱼ^(k) = min(dᵢⱼ^(k-1), dᵢₖ^(k-1) + dₖⱼ^(k-1))**
- 답: dᵢⱼ^(n)

```
FLOYD-WARSHALL(W)
  n = W.rows
  D^(0) = W
  for k = 1 to n
    let D^(k) = (dᵢⱼ^(k))
    for i = 1 to n
      for j = 1 to n
        dᵢⱼ^(k) = min(dᵢⱼ^(k-1), dᵢₖ^(k-1) + dₖⱼ^(k-1))
  return D^(n)
```

- **시간**: **Θ(V³)**, **공간**: Θ(V²) (in-place 가능)
- **음수 가중치 OK**, 음수 사이클 검출: dᵢᵢ < 0 인지 확인
- 경로 복원: 전임자 행렬 Π 동시 계산

### 추이 폐쇄 (Transitive Closure)
Floyd-Warshall과 동일 구조, min/+ 대신 OR/AND 사용
- tᵢⱼ^(k) = tᵢⱼ^(k-1) ∨ (tᵢₖ^(k-1) ∧ tₖⱼ^(k-1))

### Johnson 알고리즘 ⭐ (희소 그래프 + 음수 가중치)

**아이디어**: 재가중치(reweighting)로 음수 간선을 양수로 변환 → Dijkstra V회

**알고리즘**:
1. 새 정점 s 추가, s→모든 정점에 가중치 0 간선
2. Bellman-Ford(s) → h(v) = δ(s,v) 계산 (음수 사이클 검출)
3. 재가중치: **ŵ(u,v) = w(u,v) + h(u) - h(v)** ≥ 0
4. 각 정점 u에서 Dijkstra(ŵ) 실행
5. 원래 거리 복원: δ(u,v) = δ̂(u,v) - h(u) + h(v)

**왜 ŵ ≥ 0?**: h(v) ≤ h(u) + w(u,v) (삼각 부등식) → w(u,v) + h(u) - h(v) ≥ 0

**왜 최단 경로 보존?**: 경로 p의 ŵ 길이 = w 길이 + h(시작) - h(끝). 시작/끝 같은 모든 경로가 같은 양만큼 변함 → 순서 유지

- **시간**: O(V² lg V + VE) — 희소 그래프(E ≪ V²)에서 Floyd-Warshall보다 우수

### 비교

| 알고리즘 | 시간 | 음수 가중치 | 적합 그래프 |
|---------|------|----------|-----------|
| Dijkstra × V | O(V³ + VE) | ❌ | 비음수, 밀집 |
| Bellman-Ford × V | O(V²E) | ✅ | 항상 |
| **Floyd-Warshall** | **Θ(V³)** | ✅ | 밀집 |
| **Johnson** | **O(V² lg V + VE)** | ✅ | 희소 |

---

# 🔵 TIER 1 보강 (기존 챕터 심화)

---

## Ch 4 보강: 슈트라센 알고리즘 의사코드

**일반 행렬 곱셈** (n×n × n×n):
- T(n) = 8T(n/2) + Θ(n²) → **Θ(n³)** (마스터 정리 Case 1)

**슈트라센의 통찰**: 8번의 곱셈을 7번으로 줄임
- T(n) = 7T(n/2) + Θ(n²) → **Θ(n^lg7) ≈ Θ(n^2.807)**

**A·B = C 분할** (각각 (n/2)×(n/2) 부분행렬):
```
A = [A₁₁ A₁₂]    B = [B₁₁ B₁₂]    C = [C₁₁ C₁₂]
    [A₂₁ A₂₂]        [B₂₁ B₂₂]        [C₂₁ C₂₂]
```

**7개의 곱 (M₁~M₇)**:
- M₁ = (A₁₁ + A₂₂)(B₁₁ + B₂₂)
- M₂ = (A₂₁ + A₂₂)·B₁₁
- M₃ = A₁₁·(B₁₂ - B₂₂)
- M₄ = A₂₂·(B₂₁ - B₁₁)
- M₅ = (A₁₁ + A₁₂)·B₂₂
- M₆ = (A₂₁ - A₁₁)·(B₁₁ + B₁₂)
- M₇ = (A₁₂ - A₂₂)·(B₂₁ + B₂₂)

**결합**:
- C₁₁ = M₁ + M₄ - M₅ + M₇
- C₁₂ = M₃ + M₅
- C₂₁ = M₂ + M₄
- C₂₂ = M₁ - M₂ + M₃ + M₆

**의의**: 분할 정복으로 점근적 개선 가능함을 보인 최초 사례. 실용적으로는 n이 매우 클 때 유리 (상수 인자가 큼).

---

## Ch 7 보강: Hoare vs Lomuto Partition

| 특성 | **Lomuto** | **Hoare** (원조) |
|------|-----------|----------------|
| 피벗 | 마지막 원소 | 첫 원소 |
| 포인터 | i (한 방향 진행) | i, j (양쪽에서 좁힘) |
| 반환값 | 피벗 최종 위치 q | 분할 경계 j |
| 평균 swap 수 | 더 많음 | **3배 적음** (실측) |
| 균등 키 처리 | 비효율 (∀ ≤ 검사) | 효율적 |
| 구현 난이도 | 쉬움 | 까다로움 (경계 조건) |
| 안정성 | ❌ | ❌ |

**Hoare-Partition**:
```
HOARE-PARTITION(A, p, r)
  x = A[p]
  i = p - 1
  j = r + 1
  while TRUE
    repeat j = j - 1 until A[j] ≤ x
    repeat i = i + 1 until A[i] ≥ x
    if i < j
      exchange A[i] ↔ A[j]
    else
      return j
```

**주의**: Hoare는 피벗을 반환 위치에 두지 **않음** → QUICKSORT 호출은 `QUICKSORT(A, p, j)` + `QUICKSORT(A, j+1, r)` (q-1, q+1 아님!)

**불변식**: 종료 시 A[p..j]의 모든 원소 ≤ A[j+1..r]의 모든 원소

---

## Ch 22 보강: BFS/DFS 정확성 증명

### BFS 정확성 (정리 22.5)

**주장**: BFS(G,s) 종료 시 모든 v에 대해 v.d = δ(s,v) (간선 수 기준 최단 거리)

**핵심 보조정리**:
- **Lemma 22.1**: 임의 (u,v) ∈ E에 대해 δ(s,v) ≤ δ(s,u) + 1
- **Lemma 22.2**: BFS 중 v.d ≥ δ(s,v) 항상 성립 (귀납법)
- **Lemma 22.3**: 큐 Q = ⟨v₁,...,vᵣ⟩이면 vᵣ.d ≤ v₁.d + 1, 그리고 vᵢ.d ≤ vᵢ₊₁.d (단조 증가)
- **Theorem 22.5**: v.d = δ(s,v) 증명 — 모순법으로 v.d > δ(s,v)인 가장 가까운 v를 가정 후 큐 단조성으로 모순 도출

**BFS 트리는 최단 경로 트리**: 각 v ≠ s에 대해 s ↝ v.π → v 경로가 최단 경로 중 하나

### DFS 핵심 정리

**Theorem 22.7 (괄호 정리)**: 임의 정점 u, v에 대해 다음 중 하나만 성립:
1. [u.d, u.f]와 [v.d, v.f]가 완전히 분리
2. [u.d, u.f] ⊂ [v.d, v.f]이고 u는 v의 후손
3. [v.d, v.f] ⊂ [u.d, u.f]이고 v는 u의 후손

**Theorem 22.9 (백색 경로 정리)**: DFS 트리에서 v가 u의 **후손** ⟺ 시간 u.d에 u에서 v로 가는 **백색 경로**(WHITE 노드만 거치는 경로)가 존재

**Lemma 22.11 (DAG ⟺ no back edge)**: G가 DAG ⟺ DFS(G)에서 back edge 없음
- (←) back edge (u,v) 존재 → v가 u의 조상 → v↝u + (u,v) 사이클 모순
- (→) 사이클 C에 첫 발견된 v → C의 다른 모든 정점 v로부터 도달 → C에서 v 직전 정점 u의 (u,v)는 v(GRAY)로 향하는 back edge

**위상 정렬 정확성**: u→v 간선 → u.f > v.f
- 발견 시 v가 WHITE: v는 u의 후손 → v.f < u.f ✓
- 발견 시 v가 GRAY: back edge → DAG가 아님 (모순)
- 발견 시 v가 BLACK: v.f < 현재 < u.f ✓

---

## Ch 24 보강: Dijkstra 정확성 증명

**Theorem 24.6**: 비음수 가중치 그래프에서 Dijkstra(G,w,s) 종료 시 모든 u에 대해 u.d = δ(s,u)

**증명 (탐욕 선택의 정당성)** — 루프 불변식 사용:

**불변식**: 각 반복 시작 시, ∀v ∈ S: v.d = δ(s,v)

**모순법**: u가 S에 추가될 때 u.d ≠ δ(s,u)인 첫 번째 정점이라 가정.
- u ≠ s (s.d = 0 = δ(s,s))
- u가 추가되는 시점에 S ≠ ∅, 또한 s ↝ u 경로 존재 (없으면 δ(s,u)=∞=u.d, 모순)

**최단 경로 p: s ↝ u** 위에 **S에서 V-S로 가는 첫 간선 (x,y)**가 존재 (s는 S, u는 V-S):
```
s ─ ··· ─ x ─→ y ─ ··· ─ u
        (∈S)    (∈V-S)
```

**핵심 부등식들**:
1. x.d = δ(s,x) (가정에 의해, x ∈ S이고 u가 첫 위반)
2. (x,y) 처리 시 RELAX 수행 → **y.d = δ(s,y)** (경로 완화 성질)
3. y가 p 위에 있고 비음수 가중치 → **δ(s,y) ≤ δ(s,u)**
4. y ∈ V-S이고 u가 EXTRACT-MIN으로 선택 → **u.d ≤ y.d**
5. u.d ≥ δ(s,u) (상한 성질)

**연쇄**: δ(s,u) ≤ u.d ≤ y.d = δ(s,y) ≤ δ(s,u)
→ 모든 부등식이 등식 → **u.d = δ(s,u)** — 가정과 모순! ∎

**비음수 가중치가 핵심인 곳**: 단계 3 (δ(s,y) ≤ δ(s,u)). 음수 간선이 있으면 y에서 u로 가는 경로가 음수가 되어 δ(s,u) < δ(s,y) 가능.

---

# 📊 메타 학습 자료

---

## 시간 복잡도 한 장 요약표

### 정렬 알고리즘

| 알고리즘 | 최선 | 평균 | 최악 | 공간 | 안정 | 비교기반 | 비고 |
|---------|------|------|------|------|------|---------|------|
| Insertion Sort | Θ(n) | Θ(n²) | Θ(n²) | O(1) | ✅ | ✅ | 작은 n에 빠름 |
| Selection Sort | Θ(n²) | Θ(n²) | Θ(n²) | O(1) | ❌ | ✅ | swap 최소 |
| Bubble Sort | Θ(n) | Θ(n²) | Θ(n²) | O(1) | ✅ | ✅ | 교육용 |
| Merge Sort | Θ(n lg n) | Θ(n lg n) | Θ(n lg n) | Θ(n) | ✅ | ✅ | 보장된 lg |
| Heapsort | O(n lg n) | O(n lg n) | O(n lg n) | O(1) | ❌ | ✅ | in-place |
| Quicksort | Θ(n lg n) | Θ(n lg n) | Θ(n²) | O(lg n) | ❌ | ✅ | 실전 최강 |
| Counting Sort | Θ(n+k) | Θ(n+k) | Θ(n+k) | Θ(n+k) | ✅ | ❌ | 정수 키 |
| Radix Sort | Θ(d(n+k)) | Θ(d(n+k)) | Θ(d(n+k)) | Θ(n+k) | ✅ | ❌ | 다중 자릿수 |
| Bucket Sort | Θ(n) | Θ(n) | Θ(n²) | Θ(n) | ✅ | ❌ | 균등 분포 |

### 자료구조 연산

| 자료구조 | Search | Insert | Delete | Min/Max | 비고 |
|---------|--------|--------|--------|---------|------|
| 정렬 안된 배열 | O(n) | O(1) | O(n) | O(n) | |
| 정렬된 배열 | O(lg n) | O(n) | O(n) | O(1) | 이진 탐색 |
| 연결 리스트 | O(n) | O(1) | O(1)* | O(n) | *위치 알 때 |
| 스택/큐 | — | O(1) | O(1) | — | LIFO/FIFO |
| 이진 힙 | — | O(lg n) | O(lg n) | O(1) | 우선순위 큐 |
| BST (균형) | O(lg n) | O(lg n) | O(lg n) | O(lg n) | 평균 |
| BST (불균형) | O(n) | O(n) | O(n) | O(n) | 최악 |
| **Red-Black Tree** | **O(lg n)** | **O(lg n)** | **O(lg n)** | **O(lg n)** | 보장 |
| 해시 테이블 (체이닝) | O(1+α) | O(1) | O(1+α) | O(n+m) | 평균 |
| 해시 테이블 (개방주소) | O(1/(1-α)) | O(1/(1-α)) | O(1/(1-α)) | — | 평균, α<1 |
| **Union-Find** | — | O(1) | — | — | α(n) amortized |

### 그래프 알고리즘

| 알고리즘 | 시간 복잡도 | 음수 가중치 | 비고 |
|---------|-----------|----------|------|
| BFS | O(V+E) | — | 간선 수 최단 경로 |
| DFS | Θ(V+E) | — | 위상 정렬, SCC |
| 위상 정렬 | Θ(V+E) | — | DAG만 |
| **Kruskal MST** | O(E lg V) | — | Union-Find |
| **Prim MST (이진 힙)** | O(E lg V) | — | 밀집에는 피보나치 힙 O(E + V lg V) |
| **Bellman-Ford** | O(VE) | ✅ | 음수 사이클 검출 |
| **DAG-SP** | Θ(V+E) | ✅ | DAG만 |
| **Dijkstra (이진 힙)** | O((V+E) lg V) | ❌ | 피보나치 힙: O(V lg V + E) |
| **Floyd-Warshall** | Θ(V³) | ✅ | 모든 쌍, 밀집 |
| **Johnson** | O(V² lg V + VE) | ✅ | 모든 쌍, 희소 |

### 선택 / 검색

| 문제 | 알고리즘 | 시간 |
|------|---------|------|
| min/max | 선형 스캔 | Θ(n) |
| min과 max 동시 | 쌍 비교 | 3⌊n/2⌋ |
| k번째 원소 (기댓값) | RANDOMIZED-SELECT | O(n) |
| k번째 원소 (최악) | SELECT (median-of-medians) | O(n) |
| 정렬된 배열 검색 | 이진 탐색 | O(lg n) |

### DP / Greedy 핵심

| 문제 | 시간 | 공간 |
|------|------|------|
| 막대 자르기 | Θ(n²) | Θ(n) |
| 행렬 체인 곱셈 | O(n³) | O(n²) |
| LCS | Θ(mn) | Θ(mn) |
| 0-1 배낭 | O(nW) | O(nW) |
| 활동 선택 (정렬됨) | Θ(n) | O(1) |
| 허프만 코드 | O(n lg n) | O(n) |

### 점화식 ↔ 시간 복잡도 빠른 참조

| 점화식 | 해 | 예시 |
|--------|-----|------|
| T(n) = T(n-1) + Θ(1) | Θ(n) | 선형 재귀 |
| T(n) = T(n-1) + Θ(n) | Θ(n²) | Insertion Sort |
| T(n) = T(n/2) + Θ(1) | Θ(lg n) | 이진 탐색 |
| T(n) = T(n/2) + Θ(n) | Θ(n) | RANDOMIZED-SELECT |
| T(n) = 2T(n/2) + Θ(n) | Θ(n lg n) | Merge Sort |
| T(n) = 2T(n/2) + Θ(1) | Θ(n) | 트리 순회 |
| T(n) = 2T(n/2) + Θ(n lg n) | Θ(n lg² n) | 마스터 정리 적용불가 |
| T(n) = 4T(n/2) + Θ(n) | Θ(n²) | |
| T(n) = 7T(n/2) + Θ(n²) | Θ(n^lg7) | 슈트라센 |
| T(n) = T(n/5) + T(7n/10) + Θ(n) | Θ(n) | SELECT |

---

## 자주 헷갈리는 비교 카드

### 🔄 BFS vs DFS

| 특성 | **BFS** | **DFS** |
|------|---------|---------|
| 자료구조 | **큐 (FIFO)** | **스택 (재귀/명시적)** |
| 탐색 순서 | 가까운 노드 먼저 | 깊이 우선 |
| 시간 | O(V+E) | Θ(V+E) |
| 공간 | O(V) (큐 크기) | O(h) (재귀 깊이) |
| 최단 경로 | ✅ (간선 수 기준) | ❌ |
| 응용 | 최단 경로, 레벨 탐색 | 위상 정렬, SCC, 사이클 검출 |
| 트리 종류 | 최단 경로 트리 | DFS 포레스트 (트리/back/forward/cross) |
| 색상 | WHITE→GRAY(큐)→BLACK | WHITE→GRAY(스택)→BLACK |

**기억법**: BFS=**B**roadcast(퍼져나감), DFS=**D**ive(파고듦)

### 🌳 Prim vs Dijkstra (의사코드 거의 동일!)

```
GENERIC(G, w, s)
  for each u: u.key = ∞; u.π = NIL
  s.key = 0
  Q = G.V (min-PQ on key)
  while Q ≠ ∅
    u = EXTRACT-MIN(Q)
    for each v ∈ Adj[u]
      if v ∈ Q and ❓ < v.key            ← 여기만 다름!
        v.key = ❓
        v.π = u
```

| 특성 | **Prim (MST)** | **Dijkstra (SSSP)** |
|------|--------------|--------------------|
| 키 갱신 | **v.key = w(u,v)** | **v.key = u.d + w(u,v)** |
| 의미 | 트리까지의 거리 | 출발점에서의 거리 |
| 누적? | ❌ (간선 가중치만) | ✅ (경로 합) |
| 그래프 | 무방향 가중 | 방향 가중, **비음수** |
| 결과 | 신장 트리 | 최단 경로 트리 |
| 시작점 의미 | 임의 (트리 결과 같음) | 출발점 (결과 다름) |
| 음수 가중치 | OK | ❌ |

**기억 트릭**: Prim은 "**트리에서 가장 가까운**", Dijkstra는 "**출발점에서 가장 가까운**"

### 🌲 Kruskal vs Prim

| 특성 | **Kruskal** | **Prim** |
|------|-----------|---------|
| 접근 | **간선 중심** | **정점 중심** |
| 자료구조 | **Union-Find** | **최소 우선순위 큐** |
| 진행 | 가벼운 간선부터 (사이클 회피) | 트리 확장 (BFS-like) |
| 중간 상태 | 여러 컴포넌트의 포레스트 | 하나의 연결된 트리 |
| 시간 (이진 힙) | O(E lg V) | O(E lg V) |
| 시간 (피보나치) | — | O(E + V lg V) |
| 적합 | 희소 그래프 | 밀집 그래프 |
| 시작점 | 불필요 | 필요 (결과는 같음) |

**기억 트릭**: **K**ruskal=**K**ompare edges, **P**rim=**P**roximity from tree

### 💡 DP vs Greedy

| 특성 | **DP** | **Greedy** |
|------|--------|-----------|
| 부분 문제 풀이 | 모두 풀고 조합 | 선택 후 한 부분만 |
| 방향 | bottom-up (보통) | top-down |
| 시간 | 일반적으로 더 큼 | 보통 더 빠름 |
| 정확성 | 항상 최적 (조건 만족 시) | 그리디 선택 성질 증명 필요 |
| 필요 조건 | 최적 부분 구조 + 중복 부분 문제 | 최적 부분 구조 + **그리디 선택 성질** |

### ⚖️ DP가 필요한 vs Greedy로 충분한 (반례)

**0-1 배낭 vs 분할 가능 배낭**
- W=50, items: (10,60), (20,100), (30,120)
- 단위가치: 6, 5, 4
- **분할 가능**(Greedy): 10+20+20/30 = 50, 가치 60+100+80 = **240** ✓
- **0-1 Greedy**: 10+20 = 30 (남은 20 버려짐), 가치 **160** ✗
- **0-1 DP 최적**: 20+30 = 50, 가치 **220** ✓

**활동 선택은 Greedy로 충분**
- 종료 시간 최소 활동 선택 = 최적 부분 구조 + 그리디 선택 성질 증명 가능

**최단 경로는 DP/Greedy 모두**
- Bellman-Ford = DP (모든 부분 문제 풀이)
- Dijkstra = Greedy (가장 가까운 정점 확정)

**최장 공통 부분 수열 (LCS)**: DP만 가능 (Greedy 반례 쉽게 구성)

**허프만 코드는 Greedy** — 빈도 작은 두 노드 합치기 = 최적 (증명 가능)

### 🔍 추가: 기타 헷갈리는 페어

**Counting Sort vs Bucket Sort**
- Counting: 정수 키, 정확한 카운트 → 안정 정렬
- Bucket: 실수, 균등 분포 가정, 각 버킷 내부 정렬 (보통 Insertion)

**Insertion Sort vs Selection Sort**
- Insertion: 작은 거 발견하면 자리 밀어 넣기, 안정, 부분 정렬에 빠름
- Selection: 매번 최솟값 찾아 swap, 불안정, 항상 Θ(n²)

**Bellman-Ford vs Floyd-Warshall**
- BF: 단일 출발점, O(VE)
- FW: 모든 쌍, Θ(V³), 더 간결한 DP

**Tree edge vs Forward edge** (DFS)
- 둘 다 후손 방향이지만, Tree edge = DFS 트리에 포함, Forward = 트리 외 (조상→후손 지름길)

---

> 💡 **활용법**: 이 비교 카드들은 시험 직전 1시간에 다시 보기 좋습니다. 알고리즘 이름만 보고 (1) 의사코드 핵심 한 줄, (2) 시간 복잡도, (3) 헷갈리는 짝과의 차이점 한 가지를 떠올릴 수 있으면 충분.

---

## SKILL EVOLUTION POLICY (SkillClaw-inspired)

This repo runs a lightweight skill evolution loop on `.claude/skills/`.
Whenever you read, write, or modify any SKILL.md, the following
policies are MANDATORY.

### Principle 1: Conservative editing (from SkillClaw EVOLVE_AGENTS.md)

When editing an existing SKILL.md:
- Treat the current version as the source of truth, not a draft.
- Default to TARGETED edits, not rewrites.
- Preserve original structure, heading order, terminology.
- If a section is supported by past successful usage, leave it
  alone unless explicit failure evidence contradicts it.
- DO NOT change concrete environment facts (API endpoints, ports,
  paths, command syntax, file names) without clear evidence they
  have changed.
- DO NOT add generic best-practice fluff (retry logic, error
  handling theory, caching) unless the environment has a real
  quirk that warrants it.
- When in doubt, prefer SKIP over speculative edits.

### Principle 2: Joint reasoning over success and failure

Before editing, you must look at BOTH:
- What worked in past sessions (defines INVARIANTS — preserve)
- What failed in past sessions (defines TARGETS — fix only these)

Never fix a failure in a way that breaks something a past success
relied on. If you cannot tell which is which, prefer SKIP.

### Principle 3: Distinguish skill problems from agent problems

Not every failure is a skill deficiency:
- SKILL problem (wrong/missing/misleading guidance) → edit the skill
- AGENT problem (misuse of correct info, context overflow,
  unnecessary restarts) → DO NOT bloat the skill with runtime advice
- ENVIRONMENT problem (flaky API, network) → add a brief note only
  if recurrent

CRITICAL anti-pattern: if a skill ALREADY contains correct info and
the agent failed because it didn't read carefully, that is an AGENT
problem. Do not delete the correct info to make room for "go check
the source code" instructions.

### Principle 4: History is mandatory

Every change to a SKILL.md must leave a trail in `history/`:
- BEFORE editing skills/<name>/SKILL.md, copy the current content
  to skills/<name>/history/v<N>.md
- Write skills/<name>/history/v<N>_evidence.md describing:
  1. Decision summary (action, target, why now)
  2. Session evidence (what failed/succeeded, how often)
  3. Historical comparison (what previous versions tried)
  4. Edit plan (what changes, what is preserved)
  5. Open questions (uncertainty to monitor)
- Use VERSION-based filenames only (v1.md, v2.md...). Never
  date-based filenames.
- BEFORE deciding any action on an existing skill, READ ALL files
  in its history/ first. This is mandatory, not optional.

### Principle 5: Monotonic deployment via candidate staging

Skill changes are NEVER written directly to SKILL.md as the final
step. The flow is:

  1. Propose a change → write to skills/<name>/candidates/<timestamp>.md
  2. Validate it (see "Validation gates" below)
  3. Only after validation passes, promote candidate → SKILL.md
     (and snapshot the old version into history/)

If validation fails or is inconclusive, the candidate stays in
candidates/ as a record. The deployed SKILL.md never degrades.

### Validation gates (before promoting any candidate)

A candidate may only be promoted if ALL of these hold:
- [ ] You have read the entire history/ for this skill
- [ ] You can name at least 2 sessions/cases where the OLD version
      worked, and the new version preserves those behaviors
- [ ] You can name at least 1 specific failure the new version fixes
- [ ] No environment fact (port, path, endpoint) was changed without
      explicit evidence
- [ ] The evidence file v<N>_evidence.md is complete

If any gate fails, the candidate stays unmerged.

### When the user asks "evolve my skills" or similar

Trigger the `skill-evolver` skill (see .claude/skills/skill-evolver/).
Do not improvise an evolution flow.
