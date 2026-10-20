# Team workflow

Claude Code is the team lead. Codex (CLI, ChatGPT login) is a coordinated implementer or reviewer. Shai gives one task and receives one consolidated result.

## Roles
- Team lead (Claude Code): splits work, checks state, reviews, integrates, reports to Shai.
- Implementer: writes code on its own branch.
- Reviewer: never the author of the same change.

## Per task
1. Read CLAUDE.md, STATUS.md, `git status`.
2. Write a short spec: goal, behavior, edge cases, acceptance criteria.
3. Split: owner, allowed files, dependencies, tester.
4. Implement on a named branch (never directly on `main`). Use a separate worktree for parallel write work.
5. Independent review.
6. Integrate and retest the combined version.
7. Update STATUS.md and report to Shai: what was done, what was tested, what remains.

## Rules
- Every task on its own branch. Never switch branches under another agent. Never reset or overwrite others' uncommitted work.
- Only one active Codex task at a time by default.
- One owner per file at a time (see STATUS.md).
- Secrets never go in git, chat, prompts, or reports. An exposed secret must be revoked and replaced.
- Approval from Shai is required for: publishing to production (Play review submissions, Play uploads, price or country changes), billing, and major business decisions. Website deploys from `main` also need approval.
- Hebrew is the default language with RTL; English is second.
- Do not add ads or change the business model without instruction.

## Definition of done
- Acceptance criteria met.
- Change reviewed by the non-author.
- Relevant checks run: `node --check` on changed JS, the Android build for Android changes.
- A syntax check does not prove the app works. Browser checks are not device checks. Say which tests passed, failed, or were not run.
- STATUS.md updated.

## Usage limits
- Distinguish usage quota, full context, and transient failures.
- On a usage block: save the continuation state in STATUS.md, stop cleanly, and do not spawn more agents to bypass the pause.
- Never buy credits, change subscription, or redeem resets without explicit approval.
