#!/usr/bin/env python3
"""Wrap key math expressions in $...$ for KaTeX rendering.

STRATEGY: Only operate on "prose" fields that are guaranteed not to contain
code blocks. We use a line-based approach and only apply substitutions on
lines that match specific field patterns.

Safe fields (single-line strings, no triple-backtick code):
    summary: "..."
    desc:    "..."
    title:   "..."
    intro:   "..."
    invariant: "..."
    prompt:  "..."
    text:    "..."          (in proof/trace choices)
    q:       "..."          (ox)
    why:     "..."          (ox)
    note:    "..."

Skip:
    md: `...`               (contains code blocks)
    solution/hint in problems (already use $...$)
    reference.lines         (pseudocode)
    key field (in `key: "insertion"` metadata)
    id: field
"""
import re, sys
from pathlib import Path

# Fields we will process (prose-only)
PROSE_FIELDS = {
    "summary", "desc", "title", "intro", "invariant",
    "invariantLabel", "prompt", "text", "q", "why", "note", "explain",
    "stage", "subtitle", "hint", "solution", "label",
}

# Ordered replacements — longer/more-specific patterns first.
# Pattern is a *Python regex* applied to the field value (string content).
# Replacement is the literal JS source-level string we want to emit.
# Remember: in JS source, "\\" means runtime backslash. For the JS runtime
# to see "\Theta", we must write "\\Theta" in the source.
REPLACEMENTS = [
    # Recurrences (simple common forms)
    (r"T\(n\) = 2T\(n/2\) \+ Θ\(n\)", r"$T(n) = 2T(n/2) + \\Theta(n)$"),
    (r"T\(n\) = 2T\(n/2\) \+ Θ\(1\)", r"$T(n) = 2T(n/2) + \\Theta(1)$"),
    (r"T\(n\) = aT\(n/b\) \+ f\(n\)", r"$T(n) = aT(n/b) + f(n)$"),

    # Master Method — n^(log_b a) family (longest/most specific first)
    # Θ(n^(log_b a) · lg n)
    (r"Θ\(n\^\(log_\{([^}]+)\}\s+(\w+)\)\s*[·*]\s*lg\s+n\)",
        r"$\\Theta(n^{\\log_{\1} \2} \\lg n)$"),
    (r"Θ\(n\^\(log_(\w+)\s+(\w+)\)\s*[·*]\s*lg\s+n\)",
        r"$\\Theta(n^{\\log_\1 \2} \\lg n)$"),
    # O(n^(log_b a − ε)), Ω(n^(log_b a + ε))
    (r"O\(n\^\(log_(\w+)\s+(\w+)\s*[−\-]\s*ε\)\)",
        r"$O(n^{\\log_\1 \2 - \\varepsilon})$"),
    (r"Ω\(n\^\(log_(\w+)\s+(\w+)\s*\+\s*ε\)\)",
        r"$\\Omega(n^{\\log_\1 \2 + \\varepsilon})$"),
    # Θ(n^(log_b a)) and Θ(n^(log_{b/c} a))
    (r"Θ\(n\^\(log_\{([^}]+)\}\s+(\w+)\)\)", r"$\\Theta(n^{\\log_{\1} \2})$"),
    (r"Θ\(n\^\(log_(\w+)\s+(\w+)\)\)",       r"$\\Theta(n^{\\log_\1 \2})$"),
    # Θ(n^(lg 7)), Θ(n^2.81), Θ(n^(1/2))
    (r"Θ\(n\^\(lg\s+(\d+)\)\)",               r"$\\Theta(n^{\\lg \1})$"),
    (r"Θ\(n\^([\d.]+)\)",                      r"$\\Theta(n^{\1})$"),
    # n^(log_b a − ε), n^(log_b a + ε), n^(log_b a)
    (r"n\^\(log_\{([^}]+)\}\s+(\w+)\s*[−\-]\s*ε\)", r"$n^{\\log_{\1} \2 - \\varepsilon}$"),
    (r"n\^\(log_(\w+)\s+(\w+)\s*[−\-]\s*ε\)",       r"$n^{\\log_\1 \2 - \\varepsilon}$"),
    (r"n\^\(log_\{([^}]+)\}\s+(\w+)\s*\+\s*ε\)",    r"$n^{\\log_{\1} \2 + \\varepsilon}$"),
    (r"n\^\(log_(\w+)\s+(\w+)\s*\+\s*ε\)",          r"$n^{\\log_\1 \2 + \\varepsilon}$"),
    (r"n\^\(log_\{([^}]+)\}\s+(\w+)\)",             r"$n^{\\log_{\1} \2}$"),
    (r"n\^\(log_(\w+)\s+(\w+)\)",                    r"$n^{\\log_\1 \2}$"),
    (r"n\^\(lg\s+(\d+)\)",                           r"$n^{\\lg \1}$"),
    # Standalone log_b a (after wrapped patterns). Negative lookbehind
    # prevents re-matching \log_... inside already-wrapped math from earlier
    # passes — otherwise each subsequent pattern or re-run adds a layer.
    (r"(?<![\\$])\blog_\{([^}]+)\}\s+(\w+)", r"$\\log_{\1} \2$"),
    (r"(?<![\\$])\blog_(\w+)\s+(\w+)",        r"$\\log_\1 \2$"),
    # Simple polynomial forms n^d
    (r"\bn\^(\d+(?:\.\d+)?)\b",     r"$n^{\1}$"),

    # Asymptotic classes (greedy left-to-right, but patterns are self-contained)
    (r"Θ\(n lg n\)",   r"$\\Theta(n \\lg n)$"),
    (r"Θ\(n lg² n\)",  r"$\\Theta(n \\lg^2 n)$"),
    (r"Θ\(n lg n \+ E\)", r"$\\Theta(n \\lg n + E)$"),
    (r"Θ\(V \+ E\)",   r"$\\Theta(V + E)$"),
    (r"Θ\(V\+E\)",     r"$\\Theta(V + E)$"),
    (r"Θ\(V²\)",       r"$\\Theta(V^2)$"),
    (r"Θ\(V lg V \+ E\)", r"$\\Theta(V \\lg V + E)$"),
    (r"Θ\(n²\)",       r"$\\Theta(n^2)$"),
    (r"Θ\(n³\)",       r"$\\Theta(n^3)$"),
    (r"Θ\(lg n\)",     r"$\\Theta(\\lg n)$"),
    (r"Θ\(√n\)",       r"$\\Theta(\\sqrt{n})$"),
    (r"Θ\(n\+k\)",     r"$\\Theta(n + k)$"),
    (r"Θ\(n \+ k\)",   r"$\\Theta(n + k)$"),
    (r"Θ\(n\)",        r"$\\Theta(n)$"),
    (r"Θ\(1\)",        r"$\\Theta(1)$"),

    (r"O\(n lg n\)",   r"$O(n \\lg n)$"),
    (r"O\(V lg V \+ E\)", r"$O(V \\lg V + E)$"),
    (r"O\(E lg V\)",   r"$O(E \\lg V)$"),
    (r"O\(V \+ E\)",   r"$O(V + E)$"),
    (r"O\(V\+E\)",     r"$O(V + E)$"),
    (r"O\(VE\)",       r"$O(VE)$"),
    (r"O\(V²\)",       r"$O(V^2)$"),
    (r"O\(V³\)",       r"$O(V^3)$"),
    (r"O\(n²\)",       r"$O(n^2)$"),
    (r"O\(n³\)",       r"$O(n^3)$"),
    (r"O\(lg n\)",     r"$O(\\lg n)$"),
    (r"O\(lg² n\)",    r"$O(\\lg^2 n)$"),
    (r"O\(lg lg n\)",  r"$O(\\lg \\lg n)$"),
    (r"O\(n\)",        r"$O(n)$"),
    (r"O\(1\)",        r"$O(1)$"),

    (r"Ω\(n lg n\)",   r"$\\Omega(n \\lg n)$"),
    (r"Ω\(lg n\)",     r"$\\Omega(\\lg n)$"),
    (r"Ω\(n²\)",       r"$\\Omega(n^2)$"),
    (r"Ω\(n\)",        r"$\\Omega(n)$"),
    (r"Ω\(1\)",        r"$\\Omega(1)$"),

    # Generic forms with single-letter function arguments: Θ(f(n)), Θ(g(n)), Θ(h(n))
    (r"Θ\(([fgh])\(n\)\)", r"$\\Theta(\1(n))$"),
    (r"O\(([fgh])\(n\)\)", r"$O(\1(n))$"),
    (r"Ω\(([fgh])\(n\)\)", r"$\\Omega(\1(n))$"),
    (r"o\(([fgh])\(n\)\)", r"$o(\1(n))$"),
    (r"ω\(([fgh])\(n\)\)", r"$\\omega(\1(n))$"),

    # Generic powers: Θ(n^d), Θ(n^b), Θ(n^k), Θ(n^ε)
    (r"Θ\(n\^([a-z])\)", r"$\\Theta(n^{\1})$"),
    (r"O\(n\^([a-z])\)", r"$O(n^{\1})$"),
    (r"Ω\(n\^([a-z])\)", r"$\\Omega(n^{\1})$"),
    # Unicode superscript forms: Θ(nᵈ)
    (r"Θ\(nᵈ\)", r"$\\Theta(n^d)$"),
    (r"O\(nᵈ\)", r"$O(n^d)$"),
    (r"Ω\(nᵈ\)", r"$\\Omega(n^d)$"),

    # Common compound arguments: Θ(1/n), Θ(1/k), Θ(n+1), Θ(nW)
    (r"Θ\(1/(\w+)\)", r"$\\Theta(1/\1)$"),
    (r"O\(1/(\w+)\)", r"$O(1/\1)$"),
    (r"Θ\(n\+1\)",   r"$\\Theta(n+1)$"),
    (r"Θ\(nW\)",     r"$\\Theta(nW)$"),
    (r"O\(nW\)",     r"$O(nW)$"),

    # Sums / formulas
    (r"Θ\(f\(n\) \+ g\(n\)\)", r"$\\Theta(f(n) + g(n))$"),

    # Nested function: Θ(d(n+k)), O(d(n+k)), Ω(d(n+k)) — Radix sort shape
    (r"Θ\(([a-z])\(([a-zA-Z0-9]+)\s*\+\s*([a-zA-Z0-9]+)\)\)", r"$\\Theta(\1(\2+\3))$"),
    (r"O\(([a-z])\(([a-zA-Z0-9]+)\s*\+\s*([a-zA-Z0-9]+)\)\)", r"$O(\1(\2+\3))$"),
    (r"Ω\(([a-z])\(([a-zA-Z0-9]+)\s*\+\s*([a-zA-Z0-9]+)\)\)", r"$\\Omega(\1(\2+\3))$"),

    # Floor / ceiling — common forms
    (r"⌊lg\s+n⌋",                             r"$\\lfloor \\lg n \\rfloor$"),
    (r"⌈lg\s+n⌉",                             r"$\\lceil \\lg n \\rceil$"),
    (r"⌊([a-zA-Z0-9]+)\s*/\s*([a-zA-Z0-9]+)⌋",  r"$\\lfloor \1/\2 \\rfloor$"),
    (r"⌈([a-zA-Z0-9]+)\s*/\s*([a-zA-Z0-9]+)⌉",  r"$\\lceil \1/\2 \\rceil$"),
    (r"⌊n\s*/\s*2\^\(([^)]+)\)⌋",             r"$\\lfloor n/2^{\1} \\rfloor$"),

    # Heap array indexing patterns (CLRS 6.1)
    (r"PARENT\(i\)\s*=\s*⌊i\s*/\s*2⌋",         r"$\\text{PARENT}(i) = \\lfloor i/2 \\rfloor$"),
    (r"LEFT\(i\)\s*=\s*2i\b",                  r"$\\text{LEFT}(i) = 2i$"),
    (r"RIGHT\(i\)\s*=\s*2i\s*\+\s*1",          r"$\\text{RIGHT}(i) = 2i + 1$"),
    (r"A\[PARENT\(i\)\]\s*≥\s*A\[i\]",         r"$A[\\text{PARENT}(i)] \\geq A[i]$"),
    (r"A\[PARENT\(i\)\]\s*≤\s*A\[i\]",         r"$A[\\text{PARENT}(i)] \\leq A[i]$"),

    # Common "i = ⌈n/2⌉" definition
    (r"i\s*=\s*⌈n\s*/\s*2⌉",                  r"$i = \\lceil n/2 \\rceil$"),

    # Double superscript handling: 2ⁿ, 2ʰ etc. as ASCII
    (r"2ⁿ",  r"$2^n$"),
    (r"2ʰ",  r"$2^h$"),
    (r"nᵈ",  r"$n^d$"),

    # delta(s,v) patterns with more forms
    (r"δ\(v,u\)",       r"$\\delta(v,u)$"),

    # =============================================================
    # Aggressive sweep — inequalities and common math expressions.
    # TOKEN: a variable, literal number, single-letter Greek, or
    # array/function call like A[i], f(n), PARENT(i), A[i,j].
    # Word boundaries avoid matching inside Korean-text neighbors.
    # =============================================================
]

# TOKEN = something that looks like a math atom. Keep the body simple to
# avoid unpaired brackets; allow one layer of [] or () with inner digits/ops.
_TOKEN = (
    r"(?:"
    r"[A-Za-z_][A-Za-z_0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]*"  # identifier (with unicode sub/sup)
    r"(?:\.[A-Za-z_][A-Za-z_0-9]*)?"       # optional .field (e.g. v.d)
    r"(?:\[[A-Za-z0-9+\-_,\.\s]{1,20}\])?" # optional [i] / [i,j]
    r"(?:\([A-Za-z0-9+\-_,\.\s]{1,20}\))?" # optional (n) / (n, m)
    r"|\d+(?:\.\d+)?[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]*"                 # number with optional superscript
    r"|[αβγδεζηθικλμνξοπρστυφχψωΓΔΘΛΞΠΣΦΨΩ]"  # a Greek letter …
    r"(?:\([A-Za-z0-9+\-_,\.\s]{1,20}\))?"  # … optionally with (n) / (u,v)
    r")"
)

# Capturing version of TOKEN for use in patterns below
_T = f"({_TOKEN})"

# Unicode → LaTeX translations inside wrapped math tokens
_GREEK = {
    "α": r"\alpha", "β": r"\beta", "γ": r"\gamma", "δ": r"\delta",
    "ε": r"\varepsilon", "ζ": r"\zeta", "η": r"\eta", "θ": r"\theta",
    "κ": r"\kappa", "λ": r"\lambda", "μ": r"\mu", "ν": r"\nu",
    "ξ": r"\xi", "π": r"\pi", "ρ": r"\rho", "σ": r"\sigma",
    "τ": r"\tau", "υ": r"\upsilon", "φ": r"\phi", "χ": r"\chi",
    "ψ": r"\psi", "ω": r"\omega",
    "Γ": r"\Gamma", "Δ": r"\Delta", "Θ": r"\Theta", "Λ": r"\Lambda",
    "Ξ": r"\Xi", "Π": r"\Pi", "Σ": r"\Sigma", "Φ": r"\Phi",
    "Ψ": r"\Psi", "Ω": r"\Omega",
}
_SUB = {"₀":"0","₁":"1","₂":"2","₃":"3","₄":"4","₅":"5","₆":"6","₇":"7","₈":"8","₉":"9"}
_SUP = {"⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9","ⁿ":"n"}


def _tex_token(s):
    """Translate a plain-Unicode math token into LaTeX-compatible form."""
    # Greek letters
    for g, tex in _GREEK.items():
        if g in s:
            s = s.replace(g, tex + " ") if tex[-1].isalpha() else s.replace(g, tex)
    # Subscript digits: replace runs like c₁₂ → c_{12}
    s = re.sub(r"([₀-₉]+)", lambda m: "_{" + "".join(_SUB[c] for c in m.group(1)) + "}", s)
    # Superscript digits/n: replace runs
    s = re.sub(r"([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]+)", lambda m: "^{" + "".join(_SUP[c] for c in m.group(1)) + "}", s)
    # Clean up trailing spaces from the Greek replacement ("\alpha ") when
    # followed by a non-letter so we don't emit "\alpha + \beta" where the
    # extra space is only cosmetic — actually KaTeX tolerates both. Leave.
    return s

# Trailing boundary: negative lookahead for word chars (safer than \b after
# ] or ), which are non-word and don't form a boundary with following
# non-word chars like space or end-of-string).
_END = r"(?![A-Za-z0-9_\[\(])"

# Ordered: longest (3-chain) first, then 2-chain. Each inequality op separately.
def _ineq(op_tex):
    def go(m):
        ts = [_tex_token(m.group(i + 1)) for i in range(m.lastindex or 0)]
        return "$" + f" {op_tex} ".join(ts) + "$"
    return go


_INEQ_REPS = [
    (r"\b" + _T + r"\s*≤\s*" + _T + r"\s*≤\s*" + _T + _END, _ineq(r"\leq")),
    (r"\b" + _T + r"\s*<\s*" + _T + r"\s*≤\s*" + _T + _END,
     lambda m: f"${_tex_token(m.group(1))} < {_tex_token(m.group(2))} \\leq {_tex_token(m.group(3))}$"),
    (r"\b" + _T + r"\s*≤\s*" + _T + _END, _ineq(r"\leq")),
    (r"\b" + _T + r"\s*≥\s*" + _T + _END, _ineq(r"\geq")),
    (r"\b" + _T + r"\s*≠\s*" + _T + _END, _ineq(r"\neq")),
    (r"\b" + _T + r"\s*≈\s*" + _T + _END, _ineq(r"\approx")),
    (r"\b" + _T + r"\s*>\s*" + _T + _END, _ineq(">")),
    (r"\b" + _T + r"\s*<\s*" + _T + _END, _ineq("<")),
    # Equality — `f = g`, `f(n) = O(g(n))`, `A[i] = x`. Skip `==` to avoid
    # matching pseudocode comparisons.
    (r"\b" + _T + r"\s*=(?!=)\s*" + _T + _END, _ineq("=")),
    # Orphan right-side inequality — `Korean text ≥ 0`, `≤ 1`, etc. Wrap
    # just the `op number` tail so KaTeX renders the symbol properly.
    (r"(?<=\s)(≤)\s*(\d+(?:\.\d+)?)\b", lambda m: f"$\\leq {m.group(2)}$"),
    (r"(?<=\s)(≥)\s*(\d+(?:\.\d+)?)\b", lambda m: f"$\\geq {m.group(2)}$"),
    (r"(?<=\s)(≠)\s*(\d+(?:\.\d+)?)\b", lambda m: f"$\\neq {m.group(2)}$"),
    # raw power: n^d, n^2.807, V^3 etc. (only simple bare powers)
    (r"\b([A-Za-z])\^([A-Za-z0-9](?:\.\d+)?)\b",
     lambda m: f"${m.group(1)}^{{{m.group(2)}}}$"),
]

# Original tail patterns (were split off during the aggressive-sweep edit).
# Put these BEFORE _INEQ_REPS so specific forms match first.
_TAIL = [
    # Distance symbols
    (r"δ\(s,v\)",      r"$\\delta(s,v)$"),
    (r"δ\(s, v\)",     r"$\\delta(s,v)$"),
    (r"δ\(u,v\)",      r"$\\delta(u,v)$"),
    (r"δ\(u, v\)",     r"$\\delta(u,v)$"),
    (r"δ\(s,u\)",      r"$\\delta(s,u)$"),
    (r"δ\(s, u\)",     r"$\\delta(s,u)$"),

    # Common parameters
    (r"\bn lg n\b",    r"$n \\lg n$"),
    (r"\blg\(n!\)",    r"$\\lg(n!)$"),

    # Power tower
    (r"2\^h",          r"$2^h$"),
    (r"2\^\(h\+1\)",   r"$2^{h+1}$"),
]

# INEQ goes at the FRONT of REPLACEMENTS so that broad "A op B" matches
# wrap the full expression before any single-term specific pattern (like
# `2ⁿ` → `$2^n$`) fires and splits the expression with math delimiters.
REPLACEMENTS = _INEQ_REPS + REPLACEMENTS + _TAIL


def _apply_replacements_outside_math(content):
    """Apply REPLACEMENTS to content, touching only OUTSIDE existing $...$ math
    spans. Return (new_content, changed). If $ count is unbalanced, skip."""
    parts = content.split("$")
    if len(parts) % 2 == 0:  # unbalanced delimiters
        return content, False
    changed = False
    for i in range(0, len(parts), 2):  # even indices are outside $...$
        new = parts[i]
        for pat, repl in REPLACEMENTS:
            new = re.sub(pat, repl, new)
        if new != parts[i]:
            parts[i] = new
            changed = True
    if not changed:
        return content, False
    return "$".join(parts), True


# Match a single-quoted or double-quoted prose field assignment anywhere on a
# line. Captures: (prefix, field, colon, quote, content, close-quote).
# Prefix guards against matching mid-identifier (like "sortedList: ...").
_FIELD_RE = re.compile(
    r'(^|[\s\{,;])'                    # prefix: line start or whitespace/delim
    r'([a-zA-Z_][a-zA-Z_0-9]*)'         # field name
    r'(:\s*)'
    r'("|\')'
    r'((?:\\.|(?!\4).)*)'               # string content, allowing \" escapes
    r'(\4)'
)


def process_line(line):
    """Rewrite prose fields on the line. Handles both whole-line (`field:
    "..."`) and inline object literals (`{ text: "...", correct: true }`)."""
    def _sub(m):
        prefix, field, colon, quote, content, qclose = m.groups()
        if field not in PROSE_FIELDS:
            return m.group(0)
        new_content, changed = _apply_replacements_outside_math(content)
        if not changed:
            return m.group(0)
        return f"{prefix}{field}{colon}{quote}{new_content}{qclose}"

    return _FIELD_RE.sub(_sub, line)


def main():
    path = Path(sys.argv[1])
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)

    # Track whether we're inside a template literal (backtick)
    # Simple heuristic: count unpaired `` marks. When inside a md: `...` block
    # that spans multiple lines, skip replacements.
    in_template = False
    out = []
    changes = 0

    for raw in lines:
        line = raw
        # Track backticks on this line
        tick_count = line.count("`")
        # If we're not currently in a template, process line
        if not in_template:
            new_line = process_line(line)
            if new_line != line:
                changes += 1
            out.append(new_line)
        else:
            # Inside template literal - skip
            out.append(line)
        # Toggle state based on backticks
        if tick_count % 2 == 1:
            in_template = not in_template

    path.write_text("".join(out), encoding="utf-8")
    print(f"Updated {changes} prose lines with KaTeX math.")


if __name__ == "__main__":
    main()
