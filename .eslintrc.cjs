module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
  extends: ["eslint:recommended"],
  overrides: [
    {
      files: ["backend/**/*.{ts,tsx}", "frontend/**/*.{ts,tsx,js,jsx}"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./backend/tsconfig.json", "./frontend/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
      plugins: ["@typescript-eslint"],
      extends: ["plugin:@typescript-eslint/recommended"],
    },
  ],
};
