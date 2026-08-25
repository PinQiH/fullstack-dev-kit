---
description: 依團隊規範產生 Git commit 訊息
---

# /git-commit — Git Commit 訊息產生

當你準備要寫 commit 前，請遵循以下步驟：

## 1. 準備 Commit 內容

請使用終端機執行 `git diff --cached` 取得目前的更改。

- 如果沒有 staged changes，請告知使用者。

## 2. 撰寫 Commit 訊息

請根據先前的 `git-workflow` 規範來撰寫 Commit 訊息。

- Commit message 請使用繁體中文（台灣用語）。
- 格式： `<icon> <type>(<scope>): <subject>`
