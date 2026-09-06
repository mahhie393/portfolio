# Summary State

Maintained by `/summarise`. Do not edit by hand.

| Branch | Commit | Title |
|---|---|---|
| main | c608eae | "Initial commit from Astro" |
| chore/initialisation | b31f63f | chore: add Claude Code commands |

# Project Overview

## Purpose

Personal portfolio site of Mahiro Sakaue, served at https://mahhie393.com through Cloudflare Workers static assets. Primary language is English. Every page is prerendered by `astro build`; there is no Worker script and no server-side code. The content (works, profile, optional posts) is not written yet: the site currently renders the Astro scaffold page and a placeholder 404.

## Stack

| Tool | Version | Role |
|---|---|---|
| Node.js | 24.20.0 (`.node-version`, nvm) | runtime for all tooling |
| pnpm | 11.25.0 (`packageManager`) | package manager; every version below is pinned exactly |
| Astro | 7.3.1 | static site generator; `@astrojs/sitemap` 3.7.4 emits the sitemap |
| Tailwind CSS | 4.3.3 via `@tailwindcss/vite` | styling; entry stylesheet `src/styles/global.css` |
| Wrangler | 4.129.0 | local preview (`wrangler dev`) and deploy to Cloudflare Workers |
| Biome | 2.5.12 | formatter and linter for JS/TS/JSON/JSONC/CSS |
| Prettier | 3.9.6 + `prettier-plugin-astro` 0.14.1 + `prettier-plugin-tailwindcss` 0.8.1 | formatter for `.astro` only |
| lefthook | 2.1.12 | git hooks (`pre-commit`, `commit-msg`) |
| commitlint | 21.2.2 + `config-conventional` | commit message rules |
| TypeScript | 6.0.3 + `@astrojs/check` 0.9.10 + `@types/node` 24.13.3 | type checking via `astro check` |

## Layout

- `src/pages/` Astro pages (`index.astro` scaffold, `404.astro` placeholder); `src/styles/global.css` Tailwind entry.
- `public/` static assets copied as-is (favicons). Excluded from Biome.
- `astro.config.ts` (`site`, sitemap, Tailwind), `wrangler.jsonc`, `tsconfig.json`, `biome.json`, `.prettierrc`, `.prettierignore`, `commitlint.config.js`, `lefthook.yml`, `.lefthookrc`.
- `.github/workflows/ci.yml` CI; `.github/rulesets/branch-protection.json` ruleset for `main` (not applied yet).
- `.claude/` Claude Code commands, hook, settings and vaults (see Agents). `CLAUDE.md` is a symlink to this file.
- Generated and ignored: `dist/`, `.astro/`, `.wrangler/`, `node_modules/`.

# Work Principles

Quoted verbatim from https://github.com/withastro/astro/blob/main/AGENTS.md (MIT License). Do not edit.

## Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

# Environment Details

## Policies

- Use the Node.js version in `.node-version` through nvm (`nvm use`), and pnpm through corepack; `packageManager` in `package.json` fixes the pnpm version.
- Run `pnpm install` after cloning: its `prepare` script runs `lefthook install`, which registers the git hooks.
- Start the dev server with `astro dev --background`; manage it with `astro dev stop`, `astro dev status` and `astro dev logs`.
- Preview production behaviour (headers, 404, trailing slashes) with `pnpm build && pnpm preview`, which serves `dist/` through `wrangler dev` on http://localhost:8787. Stop it from its own terminal; killing only `workerd` lets the parent respawn it.
- `.lefthookrc` puts the nvm Node.js matching `.node-version` on `PATH`. lefthook sources it before every hook and the Claude Code hook sources it too, so git GUIs and editors launched without a shell profile still find `pnpm` and `node`.
- Do not add editor format-on-save settings and do not create a `docs/` directory; formatting is enforced by hooks and CI, decisions live in this file and in git history.

## Styles

- Biome formats and lints JS, TS, JSON, JSONC and CSS: tabs, double quotes, 80 columns, imports sorted. `biome.json` excludes `**/*.astro`, `package.json` (pnpm rewrites it with two spaces) and `public/`; `css.parser.tailwindDirectives` enables Tailwind v4 syntax.
- Prettier formats `.astro` files only (`.prettierignore` ignores everything else): tabs, Astro parser, Tailwind class sorting with `tailwindStylesheet` pointing at `src/styles/global.css`.
- `pre-commit` runs on staged files only: Biome `check --write --linter-enabled=false` (format and import order, no lint) and Prettier `--write`, both re-staging their output. Lint runs only in CI. Both hooks skip during merge and rebase.
- The allow-lists in `.claude/hooks/protection.config.ts` follow the order of their source documents (POSIX.1-2024, git(1)); keep that order when editing them.

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | `astro dev` |
| `pnpm check` | `biome ci .` (format, lint, imports) then `prettier --check .` then `astro check` (types, including `.claude/hooks/*.ts`) |
| `pnpm build` | `astro build` into `dist/` |
| `pnpm preview` | `wrangler dev` serving `dist/` |
| `pnpm deploy` | `wrangler deploy` (manual deploy; needs `wrangler login`) |

CI is `.github/workflows/ci.yml` (workflow `CI.`, job id `pnpm`, displayed as `pnpm (Biome, Prettier, Astro)`), triggered by pull requests and pushes to `main`. It installs with `--frozen-lockfile`, then runs `pnpm check` and `pnpm build`. TypeScript is pinned to 6.0.3 because `astro check` relies on the programmatic API that the TypeScript 7 native compiler does not expose yet; upgrade only when Astro announces support.

## Management

- Create commits with `/commit`. Conventions and representative titles are in `.claude/vaults/commit.md`; the enforced rules are in `commitlint.config.js`: conventional types, no scope, printable-ASCII header, lowercase subject, body limited to `Co-Authored-By: <name> <email>` trailers with a blank line before them.
- Trailer format: `Co-Authored-By: Claude <Family> <Version> <noreply@anthropic.com>` with the model in use at commit time.
- Never commit on `main`. Work on a branch, push, open a pull request, wait for the `pnpm (Biome, Prettier, Astro)` check, then merge (ordinary merge). Rebase and rewrite freely on unmerged branches; the remote branch may need `--force-with-lease`.
- `.github/rulesets/branch-protection.json` defines the `main` ruleset (no deletion, no force push, pull request required with zero approvals, `pnpm (Biome, Prettier, Astro)` required and up to date). Apply it after the first CI run has reported that check name: `gh api repos/mahhie393/portfolio/rulesets --method POST --input .github/rulesets/branch-protection.json`.
- Hooks: `pre-commit` runs the Claude Code guard, Biome and Prettier; `commit-msg` runs commitlint.

## Deployment

- Target: Cloudflare Workers static assets, configured in `wrangler.jsonc` (`name: portfolio`, `compatibility_date: 2026-09-03`, `assets.directory: ./dist`, `not_found_handling: 404-page`, `html_handling: auto-trailing-slash`, observability on). There is no Worker entry point; add `@astrojs/cloudflare` only when a route needs server rendering.
- Production deploys are planned through Cloudflare Workers Builds on `main` (build `pnpm build`, deploy `pnpm exec wrangler deploy`); the repository is not connected yet and `pnpm deploy` is the manual path.
- Domain: `mahhie393.com` is not routed yet. After the custom domain exists, add `"routes": [{ "pattern": "mahhie393.com", "custom_domain": true }]` to `wrangler.jsonc` and redirect `www` to the apex with a Cloudflare redirect rule.
- Local files ignored by git: `.wrangler/` (cache and local state) and `.dev.vars` (local secrets, none needed yet).

## Agents

- `CLAUDE.md` is a symlink to `AGENTS.md`. Write `AGENTS.md`; never write `CLAUDE.md`.
- `.claude/commands/commit.md` defines `/commit` (three fixed questions, commitlint validation, Co-Authored-By trailer). `.claude/commands/summarise.md` defines `/summarise`, which rewrites this file and `.claude/vaults/commit.md` from git history and the current session, then commits them as `docs: update agent instructions`.
- `.claude/vaults/commit.md` holds commit conventions; `.claude/vaults/summarise.md` holds the Work Principles text that `/summarise` copies verbatim.
- `.claude/hooks/protection.ts` (configured by `protection.config.ts`, registered in `.claude/settings.json`) blocks Edit, Write and MultiEdit on `AGENTS.md`, `CLAUDE.md` and `.claude/vaults/*.md`, and blocks Bash commands that name them unless every command is a read-only POSIX utility or git subcommand without output redirection. The same script runs as the `Claude Code` pre-commit job (`--pre-commit`) and rejects commits that stage those files.
- `.claude/.marker-summarise` (git-ignored) disables both guards while it exists; `/summarise` creates it for the duration of a run. To commit those files by hand, create the marker, commit, then delete it.

# Progress Memory

## Done

- Tooling on `chore/initialisation`: Node and pnpm pinned; Astro with sitemap and Tailwind; Biome, Prettier, lefthook, commitlint configured; `check`, `preview` and `deploy` scripts; `astro.config.ts` with `site`; `wrangler.jsonc` with a placeholder `404.astro`; CI workflow; ruleset file; Claude Code commands, guard hook and vaults.
- Verified locally: `pnpm check` and `pnpm build` pass; `wrangler dev` serves `/`, redirects `/index.html` to `/`, returns 404 with `404.html`; the guard hook passes 28 tested allow and block cases.

## Pending

- `chore/initialisation` is 18 commits ahead of `main` at `b31f63f` (19 with this summary). `origin/chore/initialisation` stops at `1ba612b`; `b31f63f` and this summary are not pushed.
- The ruleset is defined but not applied; CI has never run on GitHub.

## To-do

1. Push `chore/initialisation` (`--force-with-lease`), open a pull request to `main`, confirm the CI check name matches the ruleset, apply the ruleset, merge.
2. Connect the repository to Cloudflare Workers Builds, verify on `*.workers.dev`, add the custom domain and `www` redirect, commit the `routes` entry.
3. Site skeleton: design tokens in `global.css` (`@theme`, dark mode), content collections (`works`, `profile`) in `src/content.config.ts`, `BaseLayout` and `SEO` components, pages `/`, `/about`, `/works`, `/works/[slug]` and a real 404, `robots.txt`, `_headers` (security headers, immutable `/_astro/*`), OG image endpoint, accessibility and Lighthouse pass.
4. Content: at least three works and the profile.
5. Later, on demand: posts collection with RSS and Shiki, contact form (Cloudflare adapter, Turnstile), Cloudflare Web Analytics, Renovate for dependencies and `.node-version`.

## Questions

- Blog posts, or works and profile only?
- Contact: mail link, or a form that needs server rendering?

## Notes

- Workers static assets, not Pages: Cloudflare recommends Workers for new projects and the Astro adapter v13+ targets Workers only. No adapter is installed because every page is prerendered.
- TypeScript 6.0.3, not 7: the native compiler lacks the API `astro check` needs.
- Biome is format-only in the hook and Prettier owns `.astro`: Biome's Astro support reads only the frontmatter and reports variables used in templates as unused.
- Hook and lefthook jobs accept a marker file rather than skill-scoped hooks, because skill hooks persist for the whole session.
- The guard hook is TypeScript executed by Node 24 (not Python with Ruff) so that Biome and `astro check` cover it without another toolchain; it fails closed when `node` is missing from `PATH`.
- `--no-errors-on-unmatched` is required on the Biome hook: when only `package.json` is staged, Biome sees zero files and would otherwise fail.
- The ruleset's required check context must equal the job display name, not the job id.
- Commit titles use a single verb and a single object; "and" joins only aspects of one change. Rejected: bundling unrelated changes such as `set site URL. and switch config to TypeScript`.
- Default `git commit -m ... -m ...` produces the blank line that `body-leading-blank` requires; single `-m` with embedded newlines does not.
