# 推薦搭配的第三方 Skill（安裝清單）

> 這些是**別人寫的** skill，各自有獨立授權與散布管道。
> **不打包進本團隊 kit** —— 請每位同事依下表**從原始來源自行安裝**，
> 這樣就不會有未授權散布的問題，上游更新也能各自同步。
> 安裝前請自行到來源確認授權與最新指令（下方標「待確認」者尤其重要）。

## 清單

| Skill | 授權 | 來源 | 安裝指令 | 團隊建議 |
|---|---|---|---|---|
| **impeccable** | Apache-2.0 | github.com/pbakaus/impeccable | `npx impeccable`（更新：`npx impeccable update`） | 🟢 推薦（前端審查/打磨，實際有在用） |
| **speak-human-tw** | MIT | github.com/Raymondhou0917/speak-human-tw | `git clone` 到 `~/.claude/skills/`（更新：`git pull`） | 🟡 選配（繁中對外文字去 AI 味） |
| **notebooklm** | ⚠️ 待確認 | github.com/teng-lin/notebooklm-py | 由 PyPI 或指定 release tag 安裝（勿裝 main 分支） | 🟡 選配（NotebookLM API，尚未實際使用） |
| **ui-ux-pro-max 套件** | ⚠️ 待確認 | github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai claude --global` | 🟡 選配（僅做平面/UI 設計時） |
| └ 隨套件附帶：banner-design / brand / design / design-system / slides | 子項多為 MIT，**套件整體待確認** | 同上 | 同上（隨套件一併安裝） | ⚪ 多數團隊用不到 |
| └ ui-styling | MIT（claudekit） | claudekit（來源待確認） | 隨套件安裝 | ⚪ React/shadcn 導向，與 Vue 棧不合 |

## ⚠️ 授權注意事項

1. **「待確認」= 預設保留所有權利。** `ui-ux-pro-max`、`notebooklm` 未見明確授權宣告；在確認授權允許前，**不得**複製、再散布或打包給他人。要團隊採用請先向作者/來源確認。
2. **MIT / Apache 授權可再用，但有條件**：保留原始版權聲明與 LICENSE；Apache-2.0 另需保留 NOTICE 並標註修改。
3. **本團隊 kit 只散布團隊自寫內容**（含已保留 ATTRIBUTION 的 MIT fork）。第三方一律走本清單「指路自裝」，不 rebundle。

## 更新紀錄

- 2026-08-25：初版。版本快照 —— impeccable v3.9.1、speak-human-tw v1.4.0、ui-styling v1.0.0。
