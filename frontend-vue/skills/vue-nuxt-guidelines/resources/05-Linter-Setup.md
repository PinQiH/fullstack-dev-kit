---
title: ESLint & Prettier 設定規範
category: Code Quality
tags: [ESLint, Prettier, Linting, Code Formatting, Vuetify, TypeScript, Vue3]
version: 2025-11
maintainer: Leo Chang
last_updated: 2026-01-28
description: ESLint 與 Prettier 設定規範,涵蓋插件安裝、配置檔案設定、Flat Config 新語法、Vuetify 整合等完整指南
---

# ESLint & Prettier 設定規範

**Maintainer**: Leo Chang  
**Version**: 2025-11  
**Last Updated**: 2026-01-28

---

## 目錄

### 基礎設定
- [1. 下載必要插件](#1-下載必要插件)
  - [核心插件](#核心插件)
  - [Vue 3 專用](#vue-3-專用)
  - [TypeScript 專用](#typescript-專用)
  - [Prettier 整合](#prettier-整合)
  - [Vuetify 專用 (可選)](#vuetify-專用-可選)

### ESLint 配置 (傳統語法)
- [2. 創建 ESLint 設定檔案 (傳統語法)](#2-創建-eslint-設定檔案-傳統語法)
  - [.eslintrc.js](#eslintrcjs)
  - [env 環境設定](#env-環境設定)
  - [parser 與 parserOptions](#parser-與-parseroptions)
  - [extends 繼承規則](#extends-繼承規則)
  - [rules 自訂規則](#rules-自訂規則)

### ESLint 配置 (Flat Config 新版)
- [Flat Config 新版語法](#flat-config-新版語法)
  - [eslint.config.js](#eslintconfigjs)

### Prettier 配置
- [3. 創建 Prettier 設定檔案](#3-創建prettier設定檔案)
  - [.prettierrc](#prettierrc)
  - [配置選項說明](#配置選項說明)

### VS Code 整合
- [4. 創建 .vscode/setting.json](#4-創建vscodesettingjson)
  - [setting.json](#settingjson)

### Vuetify 整合
- [5. Vuetify Linting 設定](#5-vuetify-linting-設定)
  - [.eslintrc.js (傳統語法)](#eslintrcjs-傳統語法)
  - [eslint.config.js (Flat Config)](#eslintconfigjs-flat-config)
  - [為什麼要用 FlatCompat](#為什麼要用-flatcompat)

### 進階配置
- [6. 完整 Flat Config 範例](#6-完整-flat-config-範例)
  - [eslint.config.js (完整版)](#eslintconfigjs-完整版)
  - [常用規則說明](#常用規則說明)

---

## Version: 2025-11

# 1. 下載必要插件

npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-vue vue-eslint-parser prettier eslint-plugin-prettier eslint-config-prettier globals jiti

---

# 2. eslint設定檔

## (Legacy Config 舊版語法)

## `.eslintrc.cjs`

```jsx
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn'],
    'vue/multi-word-component-names': 'off',
  },
}

```

## .eslintrc.cjs設定檔案說明

### root 與 env

```jsx
root: true,
env: {
browser: true,
es2021: true,
node: true,
},
```

- `root: true`：表示這是專案的最上層 ESLint 設定，防止 ESLint 向上尋找其他設定檔。
- `env`：定義執行環境的全域變數。
    - `browser: true` → 支援瀏覽器 API（如 `window`、`document`）。
    - `es2021: true` → 支援 ES2021 語法（如 `Promise.any`、`String.prototype.replaceAll`）。
    - `node: true` → 支援 Node.js  API（如 `require`、`process`）。

### parser 與 parserOptions

```jsx
parser: 'vue-eslint-parser',
parserOptions: {
parser: '@typescript-eslint/parser',
ecmaVersion: 'latest',
sourceType: 'module',
extraFileExtensions: ['.vue'],
},
```

- `parser: 'vue-eslint-parser'`：專門解析 `.vue` 檔案，支援 `<script setup>`。
- `parserOptions`：
    - `parser: '@typescript-eslint/parser'` → 處理 `<script>` 中的 TypeScript。
    - `ecmaVersion: 'latest'` → 使用最新 ECMAScript 語法。
    - `sourceType: 'module'` → 支援 ES 模組（`import/export`）。
    - `extraFileExtensions: ['.vue']` → 讓 ESLint 處理 `.vue` 檔案。

### extends

```jsx
extends: [
  'eslint:recommended',
  'plugin:vue/vue3-recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:prettier/recommended',
],

```

- `eslint:recommended` → 啟用 ESLint 官方推薦規則。
- `plugin:vue/vue3-recommended` → Vue 3 的最佳實踐規則。
- `plugin:@typescript-eslint/recommended` → TypeScript 的基本規則。
- `plugin:prettier/recommended` → 整合 Prettier，禁用與 Prettier 衝突的 ESLint 規則。

### rules

```jsx
rules: {
'@typescript-eslint/no-unused-vars': ['warn'],
'vue/multi-word-component-names': 'off',
},
```

- `@typescript-eslint/no-unused-vars: ['warn']` → 未使用的變數只警告，不報錯。
- `vue/multi-word-component-names: 'off'` → 關閉 Vue 組件名稱需多字規則，允許單字組件名（如 `Home.vue`）。

---

## (Flat Config 新版語法)

## `eslint.config.js`

```tsx
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'
import vueEslintParser from 'vue-eslint-parser'

export default typescriptEslint.config(
  {
    ignores: ['*.d.ts', '**/coverage', '**/dist'],
  },
  {
    files: ['**/*.{ts,vue}'],
    extends: [
      js.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: vueEslintParser,
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'vue/multi-word-component-names': 'off',
    },
  }
)

```

---

# 3. 創建prettier設定檔案

## `.prettierrc`

```jsx
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true,
  "endOfLine": "auto"
}
```

- `"trailingComma": "es5"` ：在 ES5 支援的地方加上尾逗號（如物件、陣列），但不加在函式參數後。這有助於 Git diff 更乾淨。
- `"tabWidth": 2` ：每個縮排層級使用 2 個空格。這是 Vue 社群常見的習慣，也讓 `.vue` 檔案更易讀。
- `"semi": false` ：不自動加分號。這是許多 JS/TS 專案的偏好，搭配 ESLint 可防止語法錯誤。
- `singleQuote": true` ：使用單引號 `'` 而非雙引號 `"`, 可與 ESLint 規則一致。
- `"endOfLine": "auto”` ：根據作業系統自動選擇換行符號（Windows 用 CRLF，Unix 用 LF），避免跨平台衝突。

### 以下為可選項：(通常是不會加，但有人加的話至少能看懂)

```jsx
{
"printWidth": 100,
"arrowParens": "always",
"bracketSpacing": true,
"vueIndentScriptAndStyle": true,
"embeddedLanguageFormatting": "auto"
}
```

- `"printWidth": 100`：每行最大字元數，超過會換行。預設是 80，可調高讓程式碼更緊湊。
- `"vueIndentScriptAndStyle": true`：讓 `<script>` 和 `<style>` 區塊也遵守縮排規則。預設不會縮排，設定為 `true` 是 Vue 專案常見優化。
- `"arrowParens": "always”`：箭頭函式參數總是加括號，如 `(x) => x`。有助於一致性與可讀性。與預設一致，所以可省略。
- `"bracketSpacing": true`：物件大括號內加空格，如 `{ foo: bar }`。與預設一致，所以可省略。
- `"embeddedLanguageFormatting"`: "auto”：自動格式化嵌入語言（如 HTML、CSS、Markdown）。與預設一致，所以可省略。

---

# 4. 創建.vscode/setting.json

## `setting.json`

```json
{
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
}

```

- `"editor.tabSize": 2` ：表示每個縮排層級使用 **2 個空格**。
- `"editor.formatOnSave": true` ：存檔時就自動排版。
- `"editor.codeActionsOnSave": { "source.fixAll.eslint": true }` ：存檔的時候自動 autofix eslint的錯誤。
- `"editor.defaultFormatter": "esbenp.prettier-vscode"` ：使用 Prettier作為預設排版。

---

# 5. Vuetify專案

Vuetify 官方也提供 ESLint 設定包（eslint-config-vuetify），目的是幫處理 Vuetify 元件使用上的一些最佳實踐（像 template 規範、屬性排序、import 規則等）。

## 5-1 下載套件

npm install -D eslint-config-vuetify

## 5-2 eslint設定檔

## `eslintrc.cjs`

```jsx
module.exports = {
root: true,
env: {
browser: true,
es2021: true,
node: true,
},
parser: 'vue-eslint-parser',
parserOptions: {
parser: '@typescript-eslint/parser',
ecmaVersion: 'latest',
sourceType: 'module',
extraFileExtensions: ['.vue'],
},
extends: [
'eslint:recommended',
'plugin:vue/vue3-recommended',
'plugin:@typescript-eslint/recommended',
'plugin:prettier/recommended',
'vuetify', // ✅ 加這一行就好
],
rules: {
'@typescript-eslint/no-unused-vars': ['warn'],
'vue/multi-word-component-names': 'off',
},
}
```

## `eslint.config.js`

```jsx
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'
import vueEslintParser from 'vue-eslint-parser'

export default typescriptEslint.config(
  {
    ignores: ['*.d.ts', '**/coverage', '**/dist'],
  },
  {
    files: ['**/*.{ts,vue}'],
    extends: [
      js.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
      ...compat.extends('vuetify'), // ✅ 加入 Vuetify 規則
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: vueEslintParser,
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'vue/multi-word-component-names': 'off',
    },
  }
)

```

## 為什麼要用 `FlatCompat`

因為 `eslint-config-vuetify` 是以 **傳統 extends 格式** 發布的：

```json
{
  "extends": ["plugin:vue/recommended", "vuetify"]
}
```

新版 Flat Config 不再直接支援這種字串 `"vuetify"` 語法，

所以要用 `FlatCompat` 轉換成新版語法能理解的配置陣列。

`compat.extends('vuetify')` 的意思是：

> 把舊版的 "extends": ["vuetify"] 轉成新版 Flat Config 結構。
> 

⚠️ `eslint-config-vuetify` 可能與新版語法還不相容，如果有問題就先用：

## `eslint.config.ts`

```jsx
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'
import vueEslintParser from 'vue-eslint-parser'

export default typescriptEslint.config(
  { ignores: ['*.d.ts', '**/coverage', '**/dist'] },
  {
    extends: [
      js.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
      eslintConfigPrettier
    ],
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'vue/multi-word-component-names': 'off',
      // ✅ 手動整合以下3行規則
      "vue/html-indent": ["error", 2],
	    "vue/max-attributes-per-line": ["error", { "singleline": 3 }],
	    "vue/html-self-closing": ["error", "always"]
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
  },
)

```

- `"vue/html-indent": ["error", 2]` ：
控制 template 中 HTML 標籤的縮排。每層縮排使用 **2 個空格**。
- `"vue/max-attributes-per-line": ["error", { "singleline": 3 }]` ：
控制單行 `<tag>` 上可以放幾個屬性。單行標籤最多 3 個屬性。
- `"vue/html-self-closing": ["error", "always"]` ：
控制 **空標籤是否要自閉合**。空標籤`<tag></tag>`必須寫成自閉合 `<tag />`。
