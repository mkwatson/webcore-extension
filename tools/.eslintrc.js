module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2020: true
  },
  parserOptions: {
    ecmaVersion: 2020
  },
  extends: [
    "eslint:recommended"
  ],
  rules: {
    // allow require() in JS scripts
    "@typescript-eslint/no-var-requires": "off",
    // no TS-specific unused-var checks
    "@typescript-eslint/no-unused-vars": "off"
  }
}; 