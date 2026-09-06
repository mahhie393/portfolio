---
description: Regenerate AGENTS.md and .claude/vaults/commit.md from git history and this session, then commit them.
allowed-tools: AskUserQuestion, Read, Write, Edit, Bash(git fetch *), Bash(git for-each-ref *), Bash(git branch *), Bash(git rev-parse *), Bash(git cat-file *), Bash(git merge-base *), Bash(git log *), Bash(git diff *), Bash(git show *), Bash(git status *), Bash(git commit *), Bash(touch .claude/.marker-summarise), Bash(rm -f .claude/.marker-summarise), Bash(test *), Bash(wc *), Bash(diff *), Bash(sed *)
disable-model-invocation: true
---

# /summarise

Rewrite `AGENTS.md` so that any future session understands this repository the same way, and keep `.claude/vaults/commit.md` (commit conventions) current. `AGENTS.md`, `CLAUDE.md` and `.claude/vaults/*.md` may only change through this command: a PreToolUse hook and a lefthook job reject other edits unless the marker file `.claude/.marker-summarise` exists.

Write in English. Use imperative sentences for procedures and plain statements for facts. Keep `AGENTS.md` at or under 250 lines. `CLAUDE.md` is a symlink to `AGENTS.md`: write `AGENTS.md` only, never `CLAUDE.md`. Ignore arguments passed to the command.

## Step 0: Marker check

If `.claude/.marker-summarise` exists, a previous run did not finish. `AskUserQuestion`, header `Marker`, question: `A marker from an unfinished /summarise run exists. Continue?` Options: `Remove the marker and continue` / `Abort`. `Abort` or free text: stop.

## Step 1: Branches

```
git fetch --prune origin
git for-each-ref --format='%(refname:short) %(objectname:short) %(subject)' refs/heads
git branch --no-merged origin/main --format='%(refname:short)'
```

BASE = `origin/main`. If it does not exist, BASE = `main` and say so in the report.

Rows for `Summary State`: `main` first (its own tip), then every other local branch printed by `git branch --no-merged BASE`, in that order, excluding `main`. Local branches already merged into BASE are not recorded.

## Step 2: Previous state

Read `AGENTS.md`. Parse the table under `# Summary State` (`| branch | commit | title |`). For each branch to record, RECORDED = its `Commit` cell when the branch has a row.

Verify each RECORDED with `git cat-file -e <RECORDED>^{commit}` and `git merge-base --is-ancestor <RECORDED> <branch>`. If either fails: `AskUserQuestion`, header `History`, question: `Recorded commit <RECORDED> for "<branch>" is no longer in its history. How should the range be rebuilt?` Options: `Re-read from the merge base with origin/main` / `Abort`. `Abort` or free text: stop.

Range per branch:

| Situation | Range |
|---|---|
| RECORDED valid | `<RECORDED>..<branch>` |
| no row (new branch), or rebuilt after the question | `$(git merge-base BASE <branch>)..<branch>` |
| `main` without a row, or no table at all (first run) | the whole history of the branch |

## Step 3: Inputs

For each range run `git log --format='%h %s' <range>` and `git diff --stat <range>`, then Read the files that the sections below describe when they changed (configuration files, workflows, commands, hooks). Read the current `# Progress Memory` section of `AGENTS.md`.

Use this session's conversation when there is one: decisions, rejected alternatives and open questions that commits do not show. In a fresh session rely on git and the previous text only. State in the report which sources were used.

For `commit.md`: `git log --all --format='%s'` (every title in the repository).

## Step 4: Write AGENTS.md

Run `touch .claude/.marker-summarise` first. Then Write `AGENTS.md` following this skeleton exactly: same headings, same order, the fixed lines verbatim, `<...>` replaced. Do not add sections.

```markdown
# Summary State

Maintained by `/summarise`. Do not edit by hand.

| Branch | Commit | Title |
|---|---|---|
| main | <short hash> | <title> |
| <branch> | <short hash> | <title> |

# Project Overview

## Purpose
<what the site is, its URL, audience, primary language, and that every page is prerendered>

## Stack
<each tool with its pinned version and role: Node.js, pnpm, Astro, Tailwind CSS, Wrangler, Biome, Prettier, lefthook, commitlint, TypeScript>

## Layout
<top-level directories and files and what lives in each>

<contents of .claude/vaults/summarise.md, verbatim>

# Environment Details

## Policies
<Node.js via nvm and .node-version; pnpm via packageManager; pnpm install registers the git hooks; dev server with astro dev --background and its stop/status/logs; production-like preview with pnpm build && pnpm preview; what .lefthookrc is for>

## Styles
<what Biome formats and its settings; what Prettier formats; Biome exclusions; what pre-commit does and does not do; Tailwind directive support>

## Commands
<pnpm check and its three parts; pnpm build; the CI workflow with job names and triggers; why TypeScript is pinned>

## Management
<use /commit; commitlint essentials; pointer to .claude/vaults/commit.md; never commit on main; PR then CI then merge; the ruleset file and how it is applied; Co-Authored-By format>

## Deployment
<Workers static assets; wrangler.jsonc essentials; Workers Builds or pnpm deploy; domain status; ignored local files>

## Agents
<CLAUDE.md is a symlink; .claude/commands with /commit and /summarise; .claude/vaults; the hook and lefthook guard; the marker file>

# Progress Memory

## Done
<completed phases and their outcomes>

## Pending
<work in progress on the recorded branches and how far it got>

## To-do
<ordered next steps>

## Questions
<undecided items>

## Notes
<judgements from the last session that commits do not show, one line each, with the rejected alternative and the reason>
```

Rules:

- Escape `|` inside titles as `\|`.
- `# Work Principles` is the content of `.claude/vaults/summarise.md`, copied verbatim. Never rewrite it.
- Fill `Summary State` from Step 1. Rewrite `Progress Memory` from Step 3: move finished items to `Done`, delete what is no longer true, keep what still holds.
- Keep facts that are unchanged; rewrite only sections whose subject changed in the ranges or in the conversation.

## Step 5: Update .claude/vaults/commit.md

Read the file. Compare its rules and examples with every title from Step 3. Rewrite it only when a rule is missing, wrong, or contradicted by accepted titles; otherwise leave it untouched. When writing, use this structure:

```markdown
# Commit Conventions

## Format
<type: subject, and the commitlint constraints as one list>

## Types in Use
<each type and what it is used for in this repository>

## Title Patterns
<recurring templates, for example "add <Tool> package", "configure <tool> <thing>", "add <X> configuration">

## Examples
<5 to 10 representative titles>

## Anti-patterns
<what to avoid: commas, "and" joining unrelated changes, scopes, non-ASCII, Title Case, stray periods>
```

## Step 6: Verify, commit, clean up

1. `wc -l AGENTS.md` must be at most 250; otherwise shorten `Progress Memory`, then `Project Overview`.
2. The Work Principles block must match the vault. This prints nothing on success:
   `diff <(sed -n '/^# Work Principles$/,/^# Environment Details$/p' AGENTS.md | sed '$d' | sed '${/^$/d}') .claude/vaults/summarise.md`
3. `git status --porcelain AGENTS.md .claude/vaults/commit.md`. If neither file changed, skip step 4 and say so.
4. MODEL = your current display name (`Claude <Family> <Version>`). Run:
   `git commit AGENTS.md .claude/vaults/commit.md -m "docs: update agent instructions" -m "Co-Authored-By: <MODEL> <noreply@anthropic.com>"`
   Only these two paths are committed, whatever else is staged.
5. `rm -f .claude/.marker-summarise`. Do this also after any failure.
6. Report: recorded branches with hashes, the ranges summarised, the sections changed and why, whether `commit.md` changed, the sources used (conversation or git only), and the commit hash or the failure output.
