#!/usr/bin/env python3
"""Fix single-backslash LaTeX commands in content.js to double-backslash.

Problem: In a JS string/template literal like `"$\Theta(n)$"` or
`` `$\Theta(n)$` ``, the source `\T` is interpreted as an unknown escape
and at runtime becomes just `T`. KaTeX then sees `$Theta(n)$` and renders
the symbols in text italic instead of interpreting `\Theta` as the Greek
letter command.

Fix: For every `\cmd` in the source that is NOT already preceded by a
backslash, double the backslash to `\\cmd` so runtime keeps the backslash
and KaTeX can render the command.

We only double the backslash before RECOGNIZED LaTeX command names to
avoid damaging other backslash uses (e.g., escaped newlines inside code).
"""
import re
import sys
from pathlib import Path

# Common LaTeX commands we might emit through katex_prose.py replacements.
# Keep this list exhaustive — unknown commands are safer left alone.
COMMANDS = [
    "Theta", "Omega", "Delta", "Gamma", "Lambda", "Phi", "Psi", "Pi",
    "Sigma", "Xi", "Upsilon",
    "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon", "zeta",
    "eta", "theta", "iota", "kappa", "lambda", "mu", "nu", "xi",
    "omicron", "pi", "rho", "sigma", "tau", "upsilon", "phi", "chi",
    "psi", "omega",
    "lg", "log", "ln", "exp", "sqrt", "sum", "prod", "int",
    "lfloor", "rfloor", "lceil", "rceil", "langle", "rangle",
    "leq", "geq", "neq", "approx", "equiv", "ne", "cdot", "times",
    "cap", "cup", "in", "notin", "subset", "supset", "emptyset",
    "infty", "Pr",
    "Rightarrow", "Leftarrow", "Leftrightarrow", "rightarrow", "leftarrow",
    "iff", "forall", "exists", "to",
    "frac", "binom", "dfrac",
    "lim", "max", "min", "sup", "inf",
    "ldots", "cdots", "dots", "vdots", "ddots",
    "text", "mathbf", "mathbb", "mathrm", "mathsf", "operatorname",
    "hat", "bar", "tilde", "vec", "dot",
]


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("web/js/content.js")
    text = path.read_text(encoding="utf-8")
    orig_size = len(text)

    total = 0
    for cmd in COMMANDS:
        # Match single `\cmd` where:
        #  - NOT preceded by a backslash (to skip already-correct `\\cmd`)
        #  - FOLLOWED by a non-letter (word boundary at the END of cmd)
        pattern = r"(?<!\\)\\" + cmd + r"(?![A-Za-z])"
        new_text, n = re.subn(pattern, "\\\\\\\\" + cmd, text)
        if n:
            print(f"  \\{cmd}: {n} fixes")
        total += n
        text = new_text

    path.write_text(text, encoding="utf-8")
    print(f"Done: {total} single-backslash → double-backslash fixes."
          f" Size: {orig_size} → {len(text)} bytes.")


if __name__ == "__main__":
    main()
