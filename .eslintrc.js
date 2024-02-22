module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ["@typescript-eslint", "chai-friendly"],
  extends: ["standard", "plugin:prettier/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    warnOnUnsupportedTypeScriptVersion: false,
  },
  rules: {
    "no-unused-expressions": 0,
    "chai-friendly/no-unused-expressions": 2,
    camelcase: ["error", { allow: [".*__factory"] }],
    "no-console": "warn",
  },
};
