#!/usr/bin/env python3
# build_exam_data.py
# data_sturcture repo의 data.json/answers.py/categories.py/hints.py 를
# web/js/exam-data.js 로 변환한다.
#
# 사용: python build_exam_data.py
# 결과: web/js/exam-data.js (window.__EXAM__ = {...})

import json
import os
import re
import sys
import importlib.util
from pathlib import Path

ROOT = Path(__file__).parent
WEB = ROOT / "web"
OUT = WEB / "js" / "exam-data.js"

# data_sturcture repo 경로 — 우선순위:
# 1) 환경변수 DS_REPO
# 2) 임시 clone 경로
# 3) 사용자 지정
DS_REPO = Path(os.environ.get(
    "DS_REPO",
    r"C:\Users\IPLAB\AppData\Local\Temp\ds_repo\data_sturcture"
))


def load_pymodule(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def classify_chapter(passage: str, question: str) -> str:
    """문제 본문 + 소문제 텍스트를 보고 CLRS 챕터 id 추론."""
    txt = (passage or "") + "\n" + (question or "")
    t = txt.lower()

    rules = [
        # 정확한 키워드 우선 — CLRS 외 주제는 ch_extra(_*)로 분리
        ("ch_extra_trie", ["트라이", "patricia", "패트리샤", "디지털 탐색 트리", "압축 트라이", "다원 트라이"]),
        ("ch_extra_interval_heap", ["구간힙", "구간 힙", "interval heap"]),
        ("ch_extra_aoe", ["aoe", "임계 경로", "임계경로", "임계 작업", "임계작업", "critical path", "critical activity", "earliest time", "latest time"]),
        ("ch_extra_external", ["외부 정렬", "외부정렬", "external sort", "2-원 합병", "2원 합병", "k-원 합병", "k원 합병"]),
        ("ch_extra_deque", ["덱", "deque", "이중 큐"]),
        ("ch_extra_shell", ["셸 정렬", "셀 정렬", "shell sort"]),
        ("ch_extra_interp", ["보간탐색", "보간 탐색", "interpolation search"]),
        ("ch_extra_recursion", ["재귀알고리즘", "재귀 알고리즘", "팩토리얼 재귀"]),
        ("ch_extra_linked_list", ["연결 리스트", "연결리스트", "linked list", "단순 연결", "원형 연결", "이중 연결"]),
        ("ch_extra_sparse", ["희소 행렬", "희소행렬", "sparse matrix"]),
        ("ch_extra_josephus", ["원탁", "원탁문제", "josephus", "조세푸스"]),
        ("ch25", ["all-pairs", "all pairs", "floyd", "모든 쌍 최단", "모든 정점들의 쌍"]),
        ("ch24", ["dijkstra", "dikstra", "diikstra", "bellman", "single-source", "단일 시작점", "단일 출발점", "최단 경로", "최단경로", "shortest path"]),
        ("ch23", ["minimum cost spanning", "최소 비용 신장", "최소비용신장", "kruskal", "prim", "sollin", "boruvka", "신장 트리", "mst"]),
        ("ch22", ["aov", "위상 정렬", "위상정렬", "topological", "강한 연결", "강연결", "scc", "bfs", "dfs", "너비 우선", "깊이 우선", "인접 행렬", "인접행렬", "인접 리스트", "인접리스트"]),
        ("ch21", ["disjoint", "분리 집합", "분리집합", "union-find", "union find", "동치부류", "동치 부류", "동치관계", "동치 관계", "weighted union", "collapsing", "가중규칙", "붕괴규칙", "가중 규칙", "붕괴 규칙"]),
        ("ch16", ["허프만", "huffman", "활동 선택", "분할 가능 배낭"]),
        ("ch15", ["최적 이진탐색", "optimal binary search", "최적 bst", "행렬 체인", "matrix chain", "0-1 배낭", "0/1 배낭", "longest common", "lcs", "최장 공통", "막대 자르기", "rod cutting", "동적 프로그래밍", "동적프로그래밍", "dynamic programming"]),
        ("ch13", ["red-black", "레드-블랙", "레드 블랙", "레드블랙", "avl 트리", "avl-트리", "회전 연산", "회전연산", "균형 트리"]),
        ("ch18", ["2-3 트리", "2-3트리", "2-3-4", "b-트리", "b트리", "b 트리", "b-tree"]),
        ("ch12", ["이진 탐색 트리", "이진탐색트리", "이진 탐색트리", "binary search tree", "bst"]),
        ("ch11", ["해싱", "hashing", "해시 테이블", "해시테이블", "hash table", "충돌", "체이닝", "체인법", "선형 조사", "선형조사", "이중 해싱", "이중해싱"]),
        ("ch9", ["중간값", "중앙값", "median", "선택 알고리즘", "k번째", "k 번째", "i번째", "i 번째", "select"]),
        ("ch8", ["기수 정렬", "기수정렬", "계수 정렬", "계수정렬", "버킷 정렬", "버킷정렬", "radix", "counting sort", "bucket sort", "안정성", "안정 정렬", "decision tree", "결정 트리"]),
        ("ch7", ["퀵 정렬", "퀵정렬", "quicksort", "quick sort", "분할(divide)", "median-of-three", "median of three", "피벗"]),
        ("ch6", ["힙 정렬", "힙정렬", "heapsort", "max-heap", "min-heap", "max heap", "min heap", "우선순위 큐", "우선순위큐", "priority queue", "이항 히프", "피보나치 히프", "binomial heap", "fibonacci heap"]),
        ("ch4", ["분할 정복", "분할정복", "divide-and-conquer", "마스터 정리", "master theorem", "점화식", "슈트라센", "strassen", "최대 부분 배열", "maximum subarray"]),
        ("ch3", ["big-oh", "big oh", "빅오", "빅-오", "점근적", "점근 표기", "시간 복잡도", "시간복잡도", "growth of function", "big \"", "big o\"", "big Ω", "big Θ", "표기법에 대하여", "표기법에 대해"]),
        ("ch2", ["삽입 정렬", "삽입정렬", "insertion sort", "합병 정렬", "합병정렬", "merge sort", "이진 탐색", "이진탐색", "binary search"]),
        ("ch32", ["kmp", "knuth", "실패 함수", "실패함수", "패턴 매칭", "패턴매칭", "string matching"]),
        # 스택/큐/연결리스트/트리 일반 → ch12 (BST가 가장 가까움) 또는 ch2
        ("ch2", ["후위 표기식", "후위표기식", "중위 표기식", "중위표기식", "postfix", "infix", "스택", "큐 ", "원형 큐", "원형큐", "circular queue", "이진 트리", "이진트리", "스레드", "thread", "외부 정렬", "외부정렬", "external sort"]),
    ]

    # 매칭되는 첫 룰의 챕터 반환
    for ch, kws in rules:
        for kw in kws:
            if kw in t:
                return ch

    return "ch_misc"  # 어디에도 안 걸리는 잡문제


def main():
    data_path = DS_REPO / "data.json"
    answers_path = DS_REPO / "answers.py"
    categories_path = DS_REPO / "categories.py"
    hints_path = DS_REPO / "hints.py"

    if not data_path.exists():
        print(f"[ERROR] data.json not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    with open(data_path, encoding="utf-8") as f:
        problems = json.load(f)

    answers_mod = load_pymodule(answers_path, "ds_answers")
    categories_mod = load_pymodule(categories_path, "ds_categories")
    hints_mod = load_pymodule(hints_path, "ds_hints")

    ANSWERS = dict(answers_mod.ANSWERS)  # dict[(exam, problemNo, sqNo)] -> str
    CATS = categories_mod.CATS           # dict["exam:p:s"] -> {...}
    HINTS = hints_mod.HINTS              # dict["exam:p:s"] -> [{text, reason}]

    # 로컬 추가 답안 머지 (project/data/extra_answers.py)
    extra_path = ROOT / "data" / "extra_answers.py"
    if extra_path.exists():
        extra_mod = load_pymodule(extra_path, "extra_answers")
        merged = 0
        for key, val in extra_mod.EXTRA_ANSWERS.items():
            if key not in ANSWERS or not ANSWERS[key].strip():
                ANSWERS[key] = val
                merged += 1
        print(f"[INFO] merged {merged} extra answers from {extra_path}")

    # 문제 평탄화 — 각 subq 단위 + 분류 + 답안/힌트/카테고리 머지
    # 분류는 문제 단위로 통합 (passage + 모든 subq 텍스트)
    flat = []
    for p in problems:
        exam = p["exam"]                 # "62회"
        year = p["year"]
        prob_no = p["problemNo"]
        passage = p.get("passage", "")
        points = p.get("points", 0)
        subqs = p.get("subquestions", []) or []
        # 문제 전체 텍스트 (passage + 모든 소문제) 기반 1차 분류
        full_q = "\n".join([s.get("question", "") for s in subqs])
        parent_chapter = classify_chapter(passage, full_q)
        for sq in subqs:
            sq_no = sq["no"]
            question = sq.get("question", "")
            key_t = (exam, prob_no, sq_no)
            key_s = f"{exam}:{prob_no}:{sq_no}"
            answer = ANSWERS.get(key_t, "")
            cat = CATS.get(key_s)
            hint = HINTS.get(key_s)
            # 소문제 자체 키워드가 다른 챕터로 강하게 매칭되면 그쪽 우선,
            # 아니면 부모 챕터 상속
            sub_chapter = classify_chapter("", question)
            chapter = sub_chapter if sub_chapter != "ch_misc" else parent_chapter
            flat.append({
                "exam": exam,
                "year": year,
                "problemNo": prob_no,
                "sqNo": sq_no,
                "points": sq.get("points", 0),
                "passage": passage,
                "passagePoints": points,
                "question": question,
                "answer": answer,
                "hints": hint or [],
                "category": cat or None,
                "chapter": chapter,
                "answered": bool(answer.strip()) if answer else False,
            })

    # 회차별 그룹 + 정렬용 메타
    exams = {}
    for item in flat:
        e = item["exam"]
        if e not in exams:
            exams[e] = {
                "exam": e,
                "year": item["year"],
                "examNum": int(re.match(r"(\d+)", e).group(1)),
                "problems": {},
            }
        pno = item["problemNo"]
        exams[e]["problems"].setdefault(pno, {
            "problemNo": pno,
            "passage": item["passage"],
            "points": item["passagePoints"],
            "subquestions": [],
        })
        exams[e]["problems"][pno]["subquestions"].append({
            "no": item["sqNo"],
            "points": item["points"],
            "question": item["question"],
            "answer": item["answer"],
            "hints": item["hints"],
            "category": item["category"],
            "chapter": item["chapter"],
            "answered": item["answered"],
        })

    # exams → list (회차 오름차순), problems도 list
    exam_list = []
    for k in sorted(exams.keys(), key=lambda s: int(re.match(r"(\d+)", s).group(1))):
        e = exams[k]
        e["problems"] = sorted(e["problems"].values(), key=lambda p: p["problemNo"])
        exam_list.append(e)

    # 챕터별 역인덱스
    by_chapter = {}
    for item in flat:
        ch = item["chapter"]
        by_chapter.setdefault(ch, []).append({
            "exam": item["exam"],
            "year": item["year"],
            "problemNo": item["problemNo"],
            "sqNo": item["sqNo"],
            "snippet": item["question"][:80].replace("\n", " "),
            "answered": item["answered"],
        })

    # 통계
    total = len(flat)
    answered = sum(1 for x in flat if x["answered"])
    stats = {
        "totalSubquestions": total,
        "answered": answered,
        "missing": total - answered,
        "examCount": len(exam_list),
    }

    payload = {
        "stats": stats,
        "exams": exam_list,
        "byChapter": by_chapter,
    }

    out_text = "/* AUTO-GENERATED by build_exam_data.py — DO NOT EDIT MANUALLY */\n"
    out_text += "window.__EXAM__ = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(out_text, encoding="utf-8")

    print(f"[OK] wrote {OUT}")
    print(f"   exams: {len(exam_list)}, subquestions: {total}, answered: {answered}")
    # 분류 분포
    from collections import Counter
    cc = Counter(x["chapter"] for x in flat)
    print("   chapter distribution:")
    for ch, n in sorted(cc.items(), key=lambda x: -x[1]):
        print(f"     {ch:>8}: {n}")


if __name__ == "__main__":
    main()
