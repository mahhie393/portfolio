// Commit message rules for the commit-msg hook (see lefthook.yml)
// Extends @commitlint/config-conventional: no scope, printable-ASCII header, body limited to allowed trailers.

const PRINTABLE_ASCII = /^[\x20-\x7E]*$/;

export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		// built-in (overrides of @commitlint/config-conventional)
		"body-leading-blank": [2, "always"],
		"footer-leading-blank": [2, "always"],
		"scope-empty": [2, "always"],
		"subject-full-stop": [0],
		// custom (defined in plugins below)
		"body-trailers-only": [2, "always", ["Co-Authored-By"]],
		"header-ascii": [2, "always"],
	},
	plugins: [
		{
			rules: {
				"body-trailers-only": ({ body, footer }, _when, allowedTrailers) => {
					const trailer = new RegExp(
						`^(${allowedTrailers.join("|")}): .+ <[^\\s@]+@[^\\s@]+>$`,
					);
					const lines = [body, footer]
						.filter(Boolean)
						.join("\n")
						.split("\n")
						.map((line) => line.trim())
						.filter((line) => line.length > 0);
					const offending = lines.filter((line) => !trailer.test(line));
					return [
						offending.length === 0,
						`body may only contain trailers (${allowedTrailers.join(", ")}) in the form "Name: <name> <email>"; found: ${offending.join(" | ")}`,
					];
				},
				"header-ascii": ({ header }) => {
					return [
						PRINTABLE_ASCII.test(header ?? ""),
						"header must contain only printable ASCII characters (English only)",
					];
				},
			},
		},
	],
};
