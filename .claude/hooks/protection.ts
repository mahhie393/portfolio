/**
 * Keeps AGENTS.md, CLAUDE.md and .claude/vaults/*.md under the control of /summarise.
 *
 * Two entry points share one policy:
 *
 *   node protection.ts               Claude Code PreToolUse hook. Reads the tool call as JSON
 *                                    on stdin. Exit 2 blocks the call, exit 0 lets it through.
 *   node protection.ts --pre-commit  lefthook job. Exit 1 when a protected path is staged.
 *
 * Both are switched off while .claude/.marker-summarise exists, which /summarise creates for
 * the duration of its run. Runs on Node.js 24 without a build step (type stripping) and needs
 * nothing beyond the node: modules. The lists it enforces live in ./protection.config.ts.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import process from "node:process";
import { commands, message, targets } from "./protection.config.ts";

const MARKER = ".claude/.marker-summarise";

/** Tools that write the file named in tool_input.file_path. Bash is judged by its command. */
const WRITING_TOOLS = new Set(["Edit", "Write", "MultiEdit"]);

/** git options that consume the following word, so it must not be mistaken for the subcommand. */
const GIT_OPTIONS_WITH_VALUE = new Set([
	"-C",
	"-c",
	"--git-dir",
	"--work-tree",
	"--namespace",
]);

/** Just enough POSIX shell syntax to split a command line (Shell Command Language sections in brackets). */
const SHELL = {
	/** Ends one command and starts the next: lists [2.9.3], pipelines [2.9.2], bash's "|&", newlines. */
	separator: /\|\||&&|\|&|;|&|\||\n/,
	/** Output redirections [2.7], including bash's "&>". */
	outputRedirection: />\||>>|<>|&>|>/,
	/** Redirections that change no file: descriptor duplication and writes to /dev/null. */
	harmlessRedirection: /\d?>&\d|&?\d?>\s*\/dev\/null/g,
	/** Openers that may precede a command: "(" [2.9.4], "$(" [2.6.3], bash's "<(". */
	subshellOpener: /^[($<]+/,
	/** "NAME=value" words that precede a command name [2.9.1]. */
	variableAssignment: /^[A-Za-z_][A-Za-z0-9_]*=/,
};

type Verdict = { ok: true } | { ok: false; reason: string };
type ToolCall = {
	cwd?: string;
	tool_name?: string;
	tool_input?: { file_path?: string; command?: string };
};

const pass: Verdict = { ok: true };
const fail = (reason: string): Verdict => ({ ok: false, reason });

// Policy: pure functions from inputs to a verdict.

function judgeFilePath(file: string, root: string, cwd: string): Verdict {
	const absolute = resolve(cwd, file);
	const seen = [absolute, realpathOr(absolute)].map((path) =>
		relative(root, path),
	);
	return targets.some((target) => seen.includes(target))
		? fail(`edit of ${file}`)
		: pass;
}

function judgeBash(command: string): Verdict {
	if (!targets.some((target) => command.includes(target))) {
		return pass;
	}
	if (
		SHELL.outputRedirection.test(
			command.replace(SHELL.harmlessRedirection, " "),
		)
	) {
		return fail("output redirection");
	}
	for (const segment of command.split(SHELL.separator)) {
		const words = commandWords(segment);
		if (words.length > 0 && !isReadOnly(words)) {
			return fail(`${words[0]} is not a read-only command`);
		}
	}
	return pass;
}

function judgeStaged(paths: readonly string[]): Verdict {
	const guarded = targets.filter((target) => paths.includes(target));
	return guarded.length > 0 ? fail(`staged: ${guarded.join(", ")}`) : pass;
}

/** The words of one simple command, without leading subshell openers and variable assignments. */
function commandWords(segment: string): string[] {
	const words = segment
		.trim()
		.replace(SHELL.subshellOpener, "")
		.split(/\s+/)
		.filter(Boolean);
	while (words.length > 0 && SHELL.variableAssignment.test(words[0])) {
		words.shift();
	}
	return words;
}

/** True when the command is on the allow-list: a POSIX reader, or git with a read-only subcommand. */
function isReadOnly(words: readonly string[]): boolean {
	const name = basename(words[0]);
	if (name !== "git") {
		return commands.posix.includes(name);
	}
	for (let index = 1; index < words.length; index += 1) {
		const word = words[index];
		if (GIT_OPTIONS_WITH_VALUE.has(word)) {
			index += 1;
		} else if (!word.startsWith("-")) {
			return commands.git.includes(word);
		}
	}
	return false;
}

// I/O: the only functions that touch the file system, git or stdin.

function realpathOr(path: string): string {
	try {
		return realpathSync(path);
	} catch {
		return path;
	}
}

function markerExists(root: string): boolean {
	return existsSync(join(root, MARKER));
}

function readToolCall(): ToolCall | undefined {
	try {
		return JSON.parse(readFileSync(0, "utf8")) as ToolCall;
	} catch {
		return undefined; // not a tool call we understand: never break unrelated tools
	}
}

function stagedPaths(): string[] {
	const output = execFileSync(
		"git",
		["diff", "--cached", "--name-only", "-z"],
		{ encoding: "utf8" },
	);
	return output.split("\0").filter(Boolean);
}

// Modes.

function runHook(): Verdict {
	const call = readToolCall();
	if (!call) {
		return pass;
	}
	const cwd = call.cwd || process.cwd();
	const root = realpathOr(process.env.CLAUDE_PROJECT_DIR || cwd);
	if (markerExists(root)) {
		return pass;
	}
	const tool = call.tool_name ?? "";
	const input = call.tool_input ?? {};
	if (WRITING_TOOLS.has(tool) && input.file_path) {
		return judgeFilePath(input.file_path, root, cwd);
	}
	if (tool === "Bash") {
		return judgeBash(input.command ?? "");
	}
	return pass;
}

function runPreCommit(): Verdict {
	return markerExists(process.cwd()) ? pass : judgeStaged(stagedPaths());
}

// Entry: the only place that exits.

const preCommit = process.argv.includes("--pre-commit");
const verdict = preCommit ? runPreCommit() : runHook();
if (!verdict.ok) {
	process.stderr.write(`${message} (${verdict.reason})\n`);
	process.exit(preCommit ? 1 : 2);
}
