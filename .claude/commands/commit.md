---
description: Commit the working tree through three fixed questions (branch, staging, title) with a Co-Authored-By trailer.
allowed-tools: AskUserQuestion, Read, Bash(git rev-parse *), Bash(git status *), Bash(git branch *), Bash(git log *), Bash(git diff *), Bash(git add *), Bash(git stash *), Bash(git commit *), Bash(printf *), Bash(pnpm exec commitlint *)
disable-model-invocation: true
---

# /commit

Create exactly one commit through a fixed sequence of questions. Behave identically in every session: run the steps below in order, ask each question with its own `AskUserQuestion` call, use the wording given here, and follow the decision tables literally. All user-facing text is English.

Never run `git push`, `git fetch`, `pnpm check`, `git commit --amend`, or any command with `--no-verify`. Ignore arguments passed to the command.

## Step 0: Preconditions

Run:

```
git rev-parse --git-dir
git rev-parse --abbrev-ref HEAD
git status --porcelain=v1
```

Stop without asking anything, printing the message, when:

| Condition | Message |
|---|---|
| `<git-dir>/rebase-merge`, `<git-dir>/rebase-apply`, `<git-dir>/MERGE_HEAD`, or `<git-dir>/CHERRY_PICK_HEAD` exists | `A rebase, merge or cherry-pick is in progress. Finish or abort it first.` |
| `git rev-parse --abbrev-ref HEAD` prints `HEAD` | `HEAD is detached. Check out a branch first.` |
| `git status --porcelain=v1` prints nothing | `Nothing to commit.` |

Classify each status line (`XY path`):

- STAGED: `X` is not a space and the line does not start with `??`.
- UNSTAGED: `Y` is not a space, or the line starts with `??`.
- PARTIAL: paths that are in both STAGED and UNSTAGED (for example `MM`, `AM`).

## Step 1: Branch

`AskUserQuestion`, header `Branch`, question: `Commit on branch "<branch>"?`

| Option | Description |
|---|---|
| `Commit on <branch>` | `Create one commit on the current branch.` On `main` use instead: `main is protected by the repository ruleset; direct commits cannot be pushed. Continue only if you know why.` |
| `Abort` | `Stop without changing anything.` |

`Abort` or any free-text answer: stop with `Aborted. Nothing was changed.`

## Step 2: Staging

Skip this step when UNSTAGED is empty; MODE = `staged`.

`AskUserQuestion`, header `Staging`, question: `Which changes should go into the commit?`

Options in this order (omit the first when STAGED is empty):

| Option | Description |
|---|---|
| `Commit staged files only` | `Staged: <STAGED paths>.` When PARTIAL is not empty, append: ` Partially staged: <PARTIAL paths>. Their unstaged hunks are stashed during the commit and restored afterwards.` |
| `Stage all and commit` | `Runs git add -A, then commits. Unstaged and untracked: <UNSTAGED paths>.` |
| `Abort` | `Stop without changing anything.` |

List at most 10 paths per description, then `+N more`.

| Answer | Action |
|---|---|
| `Commit staged files only` | MODE = `staged` |
| `Stage all and commit` | run `git add -A`; MODE = `all`; PARTIAL = empty |
| `Abort` or free text | stop with `Aborted. Nothing was changed.` |

## Step 3: Title

Read, in this order:

1. `.claude/vaults/commit.md` (conventions and representative titles, maintained by `/summarise`). If it is empty or has no conventions yet, derive the titles from the diff and `commitlint.config.js` only, and say so in the final report.
2. `git diff --cached --stat` and `git diff --cached`. Read whole files only when the diff alone does not explain the change.

Write three candidate titles:

| Candidate | Angle |
|---|---|
| A | the narrowest object of the change: `<type>: <verb> <specific thing>` |
| B | the purpose or outcome of the change |
| C | an alternative type or verb for the same change |

Every candidate must satisfy `commitlint.config.js`: type in build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test; no scope; subject starts in lowercase; header at most 100 characters; printable ASCII only; imperative mood; one verb and one object, at the granularity of the titles recorded in `commit.md`. Validate each candidate:

```
printf '%s\n' "<title>" | pnpm exec commitlint
```

Replace a failing candidate (at most two rounds) and present only candidates that pass.

`AskUserQuestion`, header `Title`, question: `Choose the commit title.` Options: the candidates, label = the title. Each description states which part of the diff the title names, which convention or prior title from `commit.md` it follows, and why this granularity. Do not add an `Abort` option.

| Answer | Action |
|---|---|
| a candidate | TITLE = that candidate |
| free text `abort` (any case) | stop with `Aborted. Nothing was changed.` |
| other free text | validate it with commitlint. Pass: TITLE = the text. Fail: show the commitlint output verbatim and ask Step 3 again with the same candidates |

## Step 4: Commit

MODEL = your current display name in the form `Claude <Family> <Version>` (for example `Claude Fable 5.1`). Take it from your own system context at this moment; the model may have been switched during the session.

1. If MODE = `staged` and PARTIAL is not empty: `git stash push --keep-index -m "commit: unstaged hunks" -- <PARTIAL paths>`; STASHED = true.
2. `git commit -m "<TITLE>" -m "Co-Authored-By: <MODEL> <noreply@anthropic.com>"`
3. If STASHED: `git stash pop`. On conflicts do not resolve anything; report the conflicted paths and that the stash entry is kept (`git stash list`), then stop.
4. If the commit failed (hook rejection or any other error): after step 3, show the failure output verbatim and stop. Do not retry.
5. On success, report `git log -1 --format='%h %s'`, the number of files changed, whether unstaged hunks were stashed and restored, and whether `commit.md` was empty.
