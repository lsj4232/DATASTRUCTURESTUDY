#!/usr/bin/env python3
"""Add OX questions for NEW chapters (ch14, ch19, ch30, ch31, ch33)."""
import re, sys
from pathlib import Path

OX_DATA = {
    "ch14": [
        ("Order-Statistic Tree의 OS-SELECT는 O(lg n)이다.", True, "각 노드 size 정보 + 한쪽만 재귀."),
        ("size 필드는 RB-Tree의 INSERT/DELETE 시 O(1)에 갱신된다.", True, "국지적 갱신 (자식 size로 결정)."),
        ("OS-RANK는 루트부터 하향 탐색한다.", False, "정점에서 루트로 상향 탐색."),
        ("Interval Tree는 x.max = 서브트리 내 최대 high 값을 유지한다.", True, "O(lg n) 구간 검색 가능."),
        ("증강(Augmenting) 4단계의 2번째는 '새 연산 개발'이다.", False, "2번째는 '추가 정보 정의'. 새 연산은 4번째."),
        ("Interval Tree로 시간표 충돌 검사를 O(lg n)에 할 수 있다.", True, "구간 겹침 질의의 대표 응용."),
        ("증강 정리(14.1)는 RB-Tree가 아닌 자료구조에도 적용 가능하다.", True, "일반적 원리. 다른 균형 트리에 확장 가능."),
        ("OS-SELECT(x, 1)은 항상 x 서브트리의 최소 key를 반환한다.", True, "가장 왼쪽 = inorder 1번째."),
        ("x.size는 항상 양수이다.", True, "최소 1 (자기 자신)."),
        ("회전 후 size 갱신은 전체 서브트리를 재귀 스캔해야 한다.", False, "두 영향받는 노드만 O(1) 갱신."),
    ],
    "ch19": [
        ("Fibonacci Heap의 DECREASE-KEY는 분할상환 O(1).", True, "포텐셜 방법으로 증명."),
        ("Fibonacci Heap의 INSERT는 최악 O(lg n).", False, "INSERT는 lazy — 루트 리스트에 추가만. O(1)."),
        ("포텐셜 Φ = t + 2m에서 m은 marked 노드 수.", True, "mark가 cascading cut의 신용 역할."),
        ("Cascading cut은 부모가 unmarked일 때 시작된다.", False, "부모가 marked이면 cut (연쇄)."),
        ("Fibonacci Heap의 차수 상한 D(n) = O(lg n).", True, "피보나치 수 성장으로 유도."),
        ("이진 힙에서 DECREASE-KEY는 O(lg n) 최악.", True, "위로 swim 연산."),
        ("Fibonacci Heap 기반 Dijkstra는 O(V lg V + E).", True, "EXTRACT V × lg V + DECREASE E × O(1)."),
        ("실무에서 Fibonacci Heap은 Binary Heap보다 항상 빠르다.", False, "상수·메모리 오버헤드. Binary가 보통 실용적."),
        ("UNION 연산이 Θ(1)이다.", True, "루트 리스트 연결만."),
        ("EXTRACT-MIN의 분할상환은 O(lg n).", True, "Consolidate 때문."),
    ],
    "ch30": [
        ("FFT는 다항식 곱셈을 Θ(n lg n)에 해결.", True, "계수↔점값 변환으로."),
        ("복소 단위근 ω_n의 n제곱은 1이다.", True, "정의 그 자체."),
        ("ω_n^(n/2) = 1.", False, "-1이다 (halving lemma)."),
        ("(ω_n^k)² = ω_(n/2)^k (Halving lemma).", True, "FFT 재귀의 핵심."),
        ("FFT의 점화식은 T(n) = T(n/2) + Θ(n).", False, "T(n) = 2T(n/2) + Θ(n)."),
        ("butterfly 연산은 y[k]와 y[k+n/2]를 한 번에 계산.", True, "ω^(k+n/2) = -ω^k 이용."),
        ("FFT는 n이 2의 거듭제곱이 아니면 적용 불가.", False, "0으로 패딩 가능. 또는 Bluestein 알고리즘."),
        ("큰 정수 곱셈 Schönhage-Strassen은 FFT 기반.", True, "정수를 다항식으로 간주."),
        ("역 FFT (IFFT)는 별도의 알고리즘이 필요.", False, "FFT와 거의 동일 (ω_n^(-1) + 1/n 스케일)."),
        ("DFT는 O(n²) 알고리즘이지만 FFT로 O(n lg n)에 계산.", True, "정의는 n² 곱셈. FFT로 가속."),
    ],
    "ch31": [
        ("gcd(a, b) = gcd(b, a mod b) (Euclid).", True, "Euclid 알고리즘의 핵심 항등식."),
        ("Euclid의 시간 복잡도는 O(lg min(a,b)).", True, "Lamé 정리."),
        ("확장 Euclid는 ax + by = gcd(a,b) 정수 해를 반환한다.", True, "베주 항등식."),
        ("RSA 암호화는 공개키 (e, n)으로 c = m^e mod n.", True, "모듈러 지수."),
        ("RSA 복호화는 m = c^d mod n, d는 비밀키.", True, "d = e^(-1) mod φ(n)."),
        ("a^b mod n을 단순 반복으로 계산하면 O(lg b).", False, "단순 반복은 O(b). 반복 제곱법(repeated squaring)이 O(lg b)."),
        ("Miller-Rabin은 소수 판정을 확률적으로 수행.", True, "k회 반복으로 오답 확률 2^(-k)."),
        ("중국인의 나머지 정리는 서로소 모듈러스에만 적용.", True, "CRT 전제 조건."),
        ("Fermat 소수 판정은 Carmichael 수에 취약.", True, "결정적 반례 존재."),
        ("Euclid 알고리즘의 최악 입력은 연속된 피보나치 수이다.", True, "Lamé 1844 정리."),
    ],
    "ch33": [
        ("Graham's Scan은 볼록 껍질을 Θ(n lg n)에 계산.", True, "정렬 + 선형 스캔."),
        ("Cross product의 부호로 회전 방향을 판별할 수 있다.", True, "양수=CCW, 음수=CW."),
        ("Jarvis's March는 output-sensitive 알고리즘이다.", True, "O(nh), h=껍질 크기."),
        ("Closest Pair는 분할 정복으로 Θ(n lg n).", True, "중간선 분할 + 경계 영역 검사."),
        ("선분 교차 검출은 sweep line으로 O(n lg n).", True, "이벤트 큐 + 균형 BST."),
        ("Graham's Scan의 스택에서 각 점은 여러 번 pop될 수 있다.", False, "한 번만. amortized 선형."),
        ("Chan's 알고리즘은 Θ(n lg h)로 output-sensitive + 점근 최적.", True, "Graham과 Jarvis의 이점 결합."),
        ("볼록 껍질의 점은 항상 n개 미만이다.", False, "n개도 가능 (모든 점이 볼록 위치)."),
        ("Cross product가 0이면 세 점이 일직선에 있다.", True, "기하학적 해석."),
        ("Closest Pair에서 경계 영역 점은 최대 7개만 비교하면 충분.", True, "유명한 기하학적 관찰 (13, 15, 7 버전 있음)."),
    ],
}


def main():
    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    def _js_str(s):
        return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

    def fmt_item(item):
        q, a, why = item
        return "      { q: %s, a: %s, why: %s }" % (
            _js_str(q), "true" if a else "false", _js_str(why)
        )

    def make_block(cid):
        items = OX_DATA.get(cid)
        if not items:
            return None
        lines = ["    ox: ["] + [fmt_item(it) + "," for it in items] + ["    ],", ""]
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
        if cid not in OX_DATA:
            out.append(text[pos:m.end()])
            pos = m.end()
            continue
        alg_m = re.search(r"^    algorithms: \[", text[m.end():], re.M)
        if not alg_m:
            out.append(text[pos:m.end()])
            pos = m.end()
            continue
        alg_start = m.end() + alg_m.start()
        mid = text[m.end():alg_start]
        if "    ox: [" in mid:
            out.append(text[pos:alg_start])
            pos = alg_start
            continue
        block = make_block(cid)
        out.append(text[pos:alg_start])
        out.append(block + "\n")
        pos = alg_start
        changes += 1

    path.write_text("".join(out), encoding="utf-8")
    print(f"Inserted OX into {changes} new chapters.")


if __name__ == "__main__":
    main()
