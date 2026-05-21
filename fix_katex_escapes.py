#!/usr/bin/env python3
"""Fix single-backslash KaTeX commands in content.js source to double-backslash.

JS string literal `"\Omega"` becomes runtime `Omega` (backslash dropped).
We need source `"\\Omega"` so runtime is `\Omega` (what KaTeX wants).

This script finds single-backslash `\<cmd>` in prose fields and doubles it.
Already-doubled `\\<cmd>` is left alone (via pre-scan marker).
"""
import re
from pathlib import Path
import sys

COMMANDS = [
    "Theta", "Omega", "delta", "Delta",
    "lg", "log", "ln", "sqrt", "sum", "prod",
    "infty", "alpha", "beta", "gamma", "epsilon",
    "Phi", "phi", "mu", "sigma", "cdot", "lfloor",
    "rfloor", "lceil", "rceil", "leq", "geq", "neq",
    "Rightarrow", "Leftarrow", "Leftrightarrow", "lim",
    "rightarrow", "leftarrow", "iff", "forall", "exists",
    "frac", "binom",
    # commands not followed by backslash in text
    "in", "max", "min", "pi",
]

PROSE_FIELDS = {
    "summary", "desc", "title", "intro", "invariant",
    "invariantLabel", "prompt", "text", "q", "why", "note", "explain",
    "stage", "subtitle",
}


def fix_field_content(content):
    """Double each single-backslash command. Use a sentinel to avoid re-processing."""
    # Step 1: protect already-doubled backslashes with a sentinel.
    SENTINEL = "\x00DOUBLE_BS\x00"
    new = content.replace("\\\\", SENTINEL)
    # Now only single \cmd remain — double them
    for cmd in sorted(COMMANDS, key=len, reverse=True):
        # Word boundary: the char after cmd must not be [a-zA-Z]
        # Use regex with word boundary
        pattern = r"\\" + cmd + r"(?![a-zA-Z])"
        new = re.sub(pattern, r"\\\\" + cmd, new)
    # Step 3: restore doubled backslashes
    new = new.replace(SENTINEL, "\\\\")
    return new


def fix_line(line):
    m = re.match(r'(\s*)([a-zA-Z_]+)(:\s*)("|\')(.*?)(\4)(,?\s*)$', line)
    if not m:
        return line
    indent, field, colon, quote, content, qclose, trail = m.groups()
    if field not in PROSE_FIELDS:
        return line
    new_content = fix_field_content(content)
    if new_content == content:
        return line
    return f"{indent}{field}{colon}{quote}{new_content}{qclose}{trail}"


def main():
    path = Path(sys.argv[1])
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    in_template = False
    out = []
    changes = 0
    for raw in lines:
        if not in_template:
            new_line = fix_line(raw)
            if new_line != raw:
                changes += 1
            out.append(new_line)
        else:
            out.append(raw)
        if raw.count("`") % 2 == 1:
            in_template = not in_template
    path.write_text("".join(out), encoding="utf-8")
    print(f"Fixed {changes} lines (doubled single \\-escapes).")


if __name__ == "__main__":
    main()
