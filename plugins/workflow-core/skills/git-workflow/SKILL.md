---
name: git-workflow
description: 'Git 協作規範：分支命名、commit message 格式與 icon 對照、版本號規則。使用時機：開分支、確認 commit 格式、決定版本號。產生 commit 訊息改用 git-commit。'
---

# Git 協作規範

## 1 基本原則

- Push 前務必先 **Pull**，解決衝突。

## 2 分支命名

使用全英文，格式：`<type>/<description>`

- **功能開發**：`feature/login-module`, `feature/bo_projects`
- **錯誤修復**：`bugfix/TASK-961`, `bugfix/API-87`
- **效能優化**：`perf/query-optimization`
- **重構**：`refactor/user-service`

## 3 Commit Message 格式

格式、icon 與 type 對照表、範例見 [git-commit-format.md](git-commit-format.md)，這是本 kit 唯一的格式來源。

## 4 版本號

- **Major (1.0.0)**: 大幅修改，不相容更新。
- **Minor (1.1.0)**: 新增功能，向下相容。
- **Patch (1.1.1)**: Bug 修復。
