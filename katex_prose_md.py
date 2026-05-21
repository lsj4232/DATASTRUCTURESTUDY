#!/usr/bin/env python3
"""KaTeX normalizer for `md:` template-literal (backtick) fields in content.js.

The base katex_prose.py skips content inside backtick template literals,
because naive regex replacement can break code blocks. This script focuses
specifically on `md:` template literals and:
  - Skips fenced ```code blocks``` and inline `code` spans
  - Skips content already inside $...$
  - Applies the same REPLACEMENTS as katex_prose.py
"""
import re
import sys
from pathlib import Path

# Reuse the REPLACEMENTS from katex_prose (same source of truth).
sys.path.insert(0, str(Path(__file__).parent))
from katex_prose import REPLACEMENTS  # noqa: E402


def _apply(text):
    """Apply REPLACEMENTS to text, skipping OUTSIDE $...$ and outside
    backtick-inline-code `...`. For a markdown line, these are the only
    two protections needed (code fences are handled at the line level)."""
    # Split on $ first (math protection)
    parts = text.split("$")
    if len(parts) % 2 == 0:  # unbalanced — skip
        return text, False
    changed = False
    for i in range(0, len(parts), 2):  # outside $...$
        segment = parts[i]
        # Sub-split by inline code ticks
        sub = segment.split("`")
        if len(sub) % 2 == 0:  # unbalanced ticks — skip this segment
            continue
        for j in range(0, len(sub), 2):
            new = sub[j]
            for pat, repl in REPLACEMENTS:
                new = re.sub(pat, repl, new)
            if new != sub[j]:
                sub[j] = new
                changed = True
        parts[i] = "`".join(sub)
    if not changed:
        return text, False
    return "$".join(parts), True


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("web/js/content.js")
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)

    out = []
    in_md = False            # inside an `md: ` template literal
    in_fenced = False        # inside ```...``` within the md block
    changes = 0

    md_start = re.compile(r'\bmd:\s*`')

    def unescaped_backtick_count(s):
        """Count backticks NOT preceded by a backslash (in JS source)."""
        n = 0
        i = 0
        while i < len(s):
            if s[i] == "\\" and i + 1 < len(s) and s[i + 1] == "`":
                i += 2
                continue
            if s[i] == "`":
                n += 1
            i += 1
        return n

    def is_fence_line(s):
        """In JS source, a markdown ``` fence is written as \\`\\`\\` — so the
        line starts (after whitespace) with backslash-backtick sequences."""
        t = s.lstrip()
        return t.startswith("\\`\\`\\`") or t.startswith("```")

    for raw in lines:
        if not in_md:
            out.append(raw)
            if md_start.search(raw) and unescaped_backtick_count(raw) % 2 == 1:
                in_md = True
            continue

        # Inside md template. Only UNESCAPED backticks can close the template.
        # Fenced code blocks inside md use escaped backticks (\`\`\`), which
        # don't affect the unescaped count.
        if unescaped_backtick_count(raw) % 2 == 1 and not is_fence_line(raw):
            out.append(raw)
            in_md = False
            in_fenced = False
            continue

        # Fenced code block start/end (3 escaped backticks in JS source)
        if is_fence_line(raw):
            in_fenced = not in_fenced
            out.append(raw)
            continue

        if in_fenced:
            out.append(raw)
            continue

        # Process this markdown line
        new_line, changed = _apply(raw)
        if changed:
            changes += 1
        out.append(new_line)

    path.write_text("".join(out), encoding="utf-8")
    print(f"Updated {changes} markdown lines with KaTeX math.")


if __name__ == "__main__":
    main()
