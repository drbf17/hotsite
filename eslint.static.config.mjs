export default [
  {
    files: ["js/**/*.js", "presentations/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "script" },
    rules: {
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "max-params": ["error", 4],
      "max-nested-callbacks": ["error", 4],
      "no-dupe-else-if": "error",
      "no-duplicate-imports": "error",
    },
  },
];
