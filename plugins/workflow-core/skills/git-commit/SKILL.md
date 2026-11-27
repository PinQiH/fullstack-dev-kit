---
name: git-commit
description: '只根據目前 staged changes 產生符合 git-workflow 格式的繁體中文 commit message；不自動 stage、commit 或 push。使用時機：寫 commit message、想 commit 訊息。'
---

# Git Commit 訊息產生

1. 執行 `git diff --cached --stat` 與 `git diff --cached` 取得 staged changes。沒有 staged changes 時告知使用者並停止。
2. 依 [git-commit-format.md](../git-workflow/git-commit-format.md) 的格式與 icon 對照表撰寫訊息，使用繁體中文（台灣用語）。
3. 只輸出訊息，不執行 `git add`、`git commit` 或 `git push`。
