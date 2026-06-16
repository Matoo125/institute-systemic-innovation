import path from "node:path";
import * as sass from "sass";

export default function (eleventyConfig) {
	eleventyConfig.ignores.add("DESIGN.md");
	eleventyConfig.addPassthroughCopy("assets");
	eleventyConfig.setInputDirectory(".");
	eleventyConfig.setIncludesDirectory("_includes");
	eleventyConfig.setOutputDirectory("_site");
	eleventyConfig.setTemplateFormats([
		"md",
		"njk",
		"html",
		"scss",
	]);

	eleventyConfig.addExtension("scss", {
		outputFileExtension: "css",

		// opt-out of Eleventy Layouts
		useLayouts: false,

		compile: async function (inputContent, inputPath) {
			let parsed = path.parse(inputPath);
			// Don’t compile file names that start with an underscore
			if(parsed.name.startsWith("_")) {
				return;
			}

			let result = sass.compileString(inputContent, {
				loadPaths: [
					parsed.dir || ".",
					this.config.dir.includes,
				]
			});

			// Map dependencies for incremental builds
			this.addDependencies(inputPath, result.loadedUrls);

			return async (data) => {
				return result.css;
			};
		},
	});
};
