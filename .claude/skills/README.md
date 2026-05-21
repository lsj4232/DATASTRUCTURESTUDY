# Skills directory

This directory holds project-wide skills following the SkillClaw-
inspired evolution policy defined in `/CLAUDE.md`.

## Layout per skill

Each skill is a directory:

    skills/<skill-name>/
    ├── SKILL.md            ← current deployed version
    ├── candidates/         ← proposed but not yet validated
    └── history/            ← version ledger (v1.md, v1_evidence.md, ...)

## How to evolve

Don't edit SKILL.md directly. Instead:
- Trigger the `skill-evolver` skill (e.g. "evolve my skills based on
  this week's sessions")
- It will stage candidates, run validation gates, and promote only
  what passes

## Manual edits

If you must edit a SKILL.md by hand, still write the corresponding
history/v<N>.md and v<N>_evidence.md. The system relies on this
ledger.
