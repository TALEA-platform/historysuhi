export default [
  {
    ignores: ["dist/**", "node_modules/**", ".tmp/**", "vite-dev*.log"],
  },
  {
    files: ["src/**/*.{js,jsx}", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        document: "readonly",
        localStorage: "readonly",
        window: "readonly",
      },
    },
    rules: {},
  },
];
