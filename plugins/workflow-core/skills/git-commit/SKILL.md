---
name: git-commit
description: '只根據目前 staged changes 產生符合團隊格式的繁體中文 Git commit message；不自動 stage、commit 或 push。'
---

# Git Commit 訊息產生

當你準備要寫 commit 前，請遵循以下步驟：

## 1. 準備 Commit 內容

使用終端機執行 `git diff --cached` 與 `git diff --cached --stat` 取得目前的更改。

- 如果沒有 staged changes，請告知使用者。
- 不得自行執行 `git add`、`git commit` 或 `git push`。

## 2. 撰寫 Commit 訊息

請根據先前的 `git-workflow` 規範來撰寫 Commit 訊息。

- Commit message 請使用繁體中文（台灣用語）。
- 格式： `<icon> <type>(<scope>): <subject>`
