# fullstack-dev-kit

全端團隊的開發規範與工作流 kit，做成 Claude Code plugin marketplace。**模組化**，依技術棧各取所需。

> ⚙️ 發佈前請先填好 `marketplace.json` 與各 `plugin.json` 的 `<你的名字>` / `<你的-github>`。

## 安裝

```
/plugin marketplace add <你的-github>/fullstack-dev-kit
```

然後依角色安裝：

| 你是 | 安裝 |
|---|---|
| 全部人 | `workflow-core` |
| 後端工程師 | `workflow-core` + `backend-node` |
| 前端工程師 | `workflow-core` + `frontend-vue` |
| 需要 Python | 再加 `python-toolkit` |

```
/plugin install workflow-core
/plugin install backend-node      # 視需要
/plugin install frontend-vue      # 視需要
/plugin install python-toolkit    # 視需要
```

## 內容

| plugin | skills | commands | 其他 |
|---|---|---|---|
| **workflow-core** | comment-conventions, git-workflow, code-reviewer, debugger, decision-helper, project-planner, senior-architect | /code-review, /debug, /git-commit, /security-review | 3 agents + 團隊標準注入 hook + 安全防護 hooks |
| **backend-node** | nodejs-guidelines, database-design, backend-testing-guidelines | /api-doc, /cronjob-doc, /test | |
| **frontend-vue** | vue-nuxt-guidelines, ux-heuristics, frontend-testing-guidelines | /test-fe, /component-doc | |
| **python-toolkit** | python-expert, python-environment | /run-python | 1 agent |

## workflow-core 的 hook

- **SessionStart**：注入團隊技術標準（安全、tab 縮排、完成前自我 review）—— 取代個人 rules/ 常駐。
- **安全防護**：env-guard（擋讀機密）、bash-safety（擋 force push / rm -rf / DROP TABLE）、secrets-guard（寫入後掃機密）、pre-commit-review（commit 前強制自我審查）、lint-on-save（存檔後 lint）。

## 相依與注意事項

- **hook 依賴**：`env-guard` / `bash-safety` / `secrets-guard` / `pre-commit-review` 需要 `python3` 解析工具輸入；找不到時會 fail-open（不阻斷）。`lint-on-save` 需專案有 eslint / ruff / flake8。`team-standards` 只用 cat，無依賴。
- **跨平台**：hook 為 bash 腳本；Windows 需 Git Bash。
- **senior-architect agent** 的架構腳本以 `${CLAUDE_PLUGIN_ROOT}` 定位，僅在 plugin 執行環境有效。
- **第三方 skill 不隨本 kit 散布**，請見 [third-party-skills.md](third-party-skills.md) 各自從原始來源安裝。
- **frontend-vue** 部分 skill fork 自 MIT 授權專案，出處見各 skill 的 `ATTRIBUTION.md`（散布時請保留）。

## 授權

本 kit 自身內容採 MIT（見 LICENSE）。`frontend-vue` 內 fork 的 skill 另附其 MIT 出處聲明。
