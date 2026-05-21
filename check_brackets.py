#!/usr/bin/env python3
"""Walk through content.js tracking bracket depth, find where things go wrong."""
from pathlib import Path

text = Path("web/js/content.js").read_text(encoding="utf-8")

depth_sq = 0
depth_cr = 0
depth_pa = 0
in_string = None
in_backtick = False
in_comment = False
line = 1
last_ok_line = 1

max_cr = 0

i = 0
N = len(text)
while i < N:
    c = text[i]
    if c == "\n":
        line += 1

    if in_comment:
        if c == "\n":
            in_comment = False
        i += 1
        continue

    if in_backtick:
        if c == "\\":
            i += 2
            continue
        if c == "`":
            in_backtick = False
        i += 1
        continue

    if in_string:
        if c == "\\":
            i += 2
            continue
        if c == in_string:
            in_string = None
        i += 1
        continue

    # Not in string
    if c == "/" and i + 1 < N and text[i + 1] == "/":
        in_comment = True
        i += 2
        continue
    if c == "`":
        in_backtick = True
        i += 1
        continue
    if c in ('"', "'"):
        in_string = c
        i += 1
        continue

    # Debug: print at chapter transitions
    if c == "{" and i + 10 < N and text[i:i+10] == "{\n    id: ":
        # chapter start — capture id
        j = i + 10
        end = text.find(",", j)
        print(f"  line {line}: depth {{={depth_cr} [={depth_sq} (before) id={text[j:end]}")
    if c == "{":
        depth_cr += 1
        max_cr = max(max_cr, depth_cr)
    elif c == "}":
        depth_cr -= 1
        if depth_cr < 0:
            print(f"Unbalanced }} at line {line}")
            break
    elif c == "[":
        depth_sq += 1
    elif c == "]":
        depth_sq -= 1
        if depth_sq < 0:
            print(f"Unbalanced ] at line {line}")
            break
    elif c == "(":
        depth_pa += 1
    elif c == ")":
        depth_pa -= 1

    i += 1

print(f"Final depths: {{={depth_cr}, []={depth_sq}, ()={depth_pa}")
print(f"Max {{ depth: {max_cr}")
print(f"Ended at line {line}")
