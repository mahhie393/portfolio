# Commit Conventions

## Format

`<type>: <subject>` on one line, optionally followed by a blank line and `Co-Authored-By: <name> <email>` trailers. Enforced by `commitlint.config.js`:

- type is one of build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test
- no scope: `feat(works): ...` is rejected
- header is printable ASCII only, at most 100 characters, subject starts in lowercase, trailing period allowed
- body and footer may contain only `Co-Authored-By: <name> <email>` lines, each block preceded by a blank line
- one verb and one object per title; the subject names the thing changed, not the reason
- merge commits are created by GitHub when a pull request is merged (`Merge pull request #1 from mahhie393/chore/initialisation`); they are not written by hand and are exempt

## Types in Use

- `chore`: tooling, configuration and dependencies (the whole initialisation)
- `ci`: files under `.github/workflows/`
- `docs`: agent instructions written by `/summarise` (`docs: update agent instructions`) and the README (`docs: update README file`)
- `feat`: user-visible site pages and components (`feat: add under construction page`)
- `fix`: corrections to existing behaviour; none yet
- Not used so far: build, perf, refactor, revert, style, test

## Title Patterns

- `pin <Tool> version` for version files: `chore: pin Node.js version`, `chore: pin pnpm version`
- `add <Tool> package` for a dependency installed without configuration: `chore: add Biome package`
- `configure <tool> <thing>` for settings of an installed tool: `chore: configure commitlint rules`
- `add <Tool> configuration` for a new configuration file: `chore: add Wrangler configuration`
- `add <thing>` for new files or features named by what they are: `chore: add GitHub ruleset`, `ci: add GitHub Actions workflow`, `feat: add under construction page`
- `reuse <thing> for <target>` when an existing component is applied to another route: `feat: reuse under construction page for 404`
- `update <thing>` for edits to an existing document: `docs: update README file`
- Tool names keep their official capitalisation (`Biome`, `Tailwind CSS`, `GitHub Actions`, `Node.js`, `pnpm`, `commitlint`, `lefthook` as `Lefthook` in package commits)

## Examples

- `chore: pin Node.js version`
- `chore: add Tailwind CSS package`
- `chore: configure lefthook hooks`
- `chore: configure Biome and Prettier formatting`
- `chore: add check and deploy scripts`
- `ci: add GitHub Actions workflow`
- `chore: add Claude Code commands`
- `docs: update README file`
- `feat: add under construction page`
- `feat: reuse under construction page for 404`

## Anti-patterns

- Commas in the subject: write `check and deploy scripts`, not `check, preview and deploy`
- "and" joining unrelated changes: split `set site URL. and switch config to TypeScript` into two commits
- Scopes, non-ASCII characters, Title Case subjects, a period after an abbreviation (`URL.`)
- Bundling a vault or `AGENTS.md` change into an unrelated commit; those go through `/summarise`
