# v1 → v2 evidence

Promotion of candidate `2026-04-29-auto-memory-signal.md` to SKILL.md.
This is a **bootstrap override** — see §6.

## 1. Decision summary

- **Action**: improve_skill
- **Target**: `Inputs you should gather first` §1 only
- **Why now**: First operational run on 2026-04-29 surfaced that the
  default signal source (`.claude/session-logs/`) does not exist in
  this repo, while the harness's auto-memory at
  `~/.claude/projects/<proj-slug>/memory/MEMORY.md` is already
  populated with project facts and feedback. The skill should point
  to the signal source that actually exists.

## 2. Session evidence

- **2026-04-29 dry run** (single session):
  - User invoked "evolve my skills based on the last 3 days of work".
  - skill-evolver reached Step 1, found `.claude/session-logs/`
    absent, and per the original SKILL.md fell back to "ask the user
    to describe 2-3 recent failures or wins".
  - User then asked whether session-logs were auto-generated (no),
    and chose Option A: use auto-memory as the signal source.
  - Outcome: workflow correctly skipped all candidates due to
    insufficient recurrence. No bad action, but a friction point in
    Step 1.
- **Recurrence count**: 1 session. Below the policy threshold of 2.
  See §6 for why this is acceptable here.

## 3. Historical comparison

- No prior versions exist (this is the skill's first amendment).
- v1 (the snapshot in `history/v1.md`) was the initial seed
  authored on 2026-04-29 in the same session.

## 4. Edit plan

**Changed** (Principle 1: targeted edit, no rewrite):
- `Inputs you should gather first` §1 expanded from a single fallback
  ("session-logs OR ask user") to an ordered three-tier source:
  (a) auto-memory MEMORY.md, (b) session-logs if present,
  (c) ask the user.

**Preserved verbatim**:
- YAML frontmatter (name, description, category)
- All other §1 sub-items (skill inventory, CLAUDE.md re-read)
- All of Steps 1-7 of Workflow
- "What this skill must NOT do" list
- "File layout" diagram
- ≥2 recurrence threshold and "prefer skip" disposition

**Not changed** (Principle 3 — not a skill problem):
- Validation gates' strictness. The Bootstrap problem is a *policy*
  question, not a skill-content question. Handled in §6 here, not
  by softening the skill itself.

## 5. Open questions

- Will auto-memory entries reliably classify as success/failure
  evidence? MEMORY.md tends to record *facts* and *preferences*
  more than runtime *outcomes*. May need a downstream amendment if
  signal quality is too thin.
- Where does `<proj-slug>` resolution come from? Currently inferred
  from the harness context. If the user works across multiple
  projects, the skill might need explicit slug discovery.
- Does "MEMORY.md ≥ 2 entries on the same topic" count as
  recurrence, or only ≥ 2 distinct sessions? Defer until observed.

## 6. Bootstrap override (gate ②/③ waiver)

The candidate failed validation gates as documented in the
2026-04-29 staging report:

- Gate ② ("≥2 sessions where OLD version worked, preserved by new
  version"): **failed** — OLD version had 0 usage (created same day).
- Gate ③ ("≥1 specific failure the new version fixes"): **partial**
  — fixes a design gap (no auto-memory awareness) rather than an
  observed runtime failure.

User explicitly invoked a one-time bootstrap override on 2026-04-29
because the gates as written are unreachable for a brand-new skill's
first amendment. This override:

- Applies to this single promotion (v1 → v2) only.
- Is recorded here for audit, not amended into CLAUDE.md policy.
- Should NOT be used for any subsequent amendment of this skill.
  Future amendments must satisfy the gates normally.

If a similar bootstrap arises for another newborn skill, the user
should either invoke an explicit override (preferred — keeps the
ledger honest) or amend CLAUDE.md to formalize a "first-amendment
exemption" rule.
