#!/usr/bin/env python3
"""Reverse the corruption caused by katex_prose.py running twice on content
that contained existing $...$ math wraps.

Symptom: `\log_b a` inside already-wrapped math got re-wrapped with extra
$-escapes on each pass, producing sequences like:
    $n^{\$\$\log_b a$$}$   (double-run)
    $n^{\$\log_b a$}$      (single-run)
Desired:
    $n^{\log_b a}$

Strip the extra $-wrappings around backslash-commands like \log, \lg inside
math expressions.
"""
import re
import sys
from pathlib import Path


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("web/js/content.js")
    text = path.read_text(encoding="utf-8")
    orig_size = len(text)

    # Apply longest (most nested) corruption patterns first.
    patterns = [
        # Double-pass: \$\$\log_X Y$$  →  \log_X Y
        (r'\\\$\\\$(\\log_\w+\s+\w+)\$\$', r'\1'),
        (r'\\\$\\\$(\\lg\s+\w+)\$\$',       r'\1'),
        # Single-pass: \$\log_X Y$  →  \log_X Y
        (r'\\\$(\\log_\w+\s+\w+)\$', r'\1'),
        (r'\\\$(\\lg\s+\w+)\$',       r'\1'),
    ]

    total = 0
    for pat, repl in patterns:
        new_text, n = re.subn(pat, repl, text)
        if n:
            print(f"  {pat!r}  →  {n} subs")
        text = new_text
        total += n

    path.write_text(text, encoding="utf-8")
    print(f"Done: {total} cleanups. Size: {orig_size} → {len(text)} bytes.")


if __name__ == "__main__":
    main()
