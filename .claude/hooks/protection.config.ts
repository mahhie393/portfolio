/**
 * What protection.ts enforces. Edit this file, not the script, to change the policy.
 *
 * - targets:  files that only /summarise may change. Paths are relative to the project root.
 * - message:  the first line of every refusal; the script appends the specific reason.
 * - commands: the only commands allowed to name a target in a Bash call. Everything else is
 *             refused, so this is an allow-list of readers rather than a block-list of writers.
 */

export const targets: readonly string[] = [
	"AGENTS.md",
	"CLAUDE.md", // symlink to AGENTS.md; listed so either spelling is caught
	".claude/vaults/commit.md",
	".claude/vaults/summarise.md",
];

export const message =
	"AGENTS.md, CLAUDE.md and .claude/vaults/*.md are maintained by the /summarise command. Run /summarise instead of editing them directly.";

export const commands: {
	readonly posix: readonly string[];
	readonly git: readonly string[];
} = {
	// Utilities that cannot change a file unless output is redirected (redirection is refused
	// separately). Listed in the order of the POSIX.1-2024 "Utilities" chapter.
	posix: [
		"cat",
		"cmp",
		"comm",
		"diff",
		"echo",
		"file",
		"grep",
		"head",
		"ls",
		"more",
		"od",
		"printf",
		"tail",
		"wc",
	],
	// Subcommands that only read the repository. Listed in the order of git(1): "Examining the
	// history and state", then "Ancillary Commands / Interrogators".
	git: ["diff", "grep", "log", "show", "status", "blame"],
};
