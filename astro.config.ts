import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://mahhie393.com",
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
});
