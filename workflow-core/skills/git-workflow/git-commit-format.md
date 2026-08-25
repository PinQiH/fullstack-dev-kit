# Git Commit Message 格式規範

每次 commit 一律遵守以下格式。分支命名與完整協作流程請參閱 `git-workflow` skill。

---

## 格式

```
<icon> <type>(<scope>): <subject>

<body>（選填）
```

- `scope`：選填，填寫影響範圍（模組名、API 編號等）
- `subject`：簡短描述，可用中文，建議附上 API 或 Task 編號（如 `API-70`）
- `body`：選填，說明動機或補充細節

## Type 對照表

| Icon | Type | 使用時機 |
|------|------|---------|
| 🎉 | `init` | 初始化專案或檔案 |
| ✨ | `feat` | 新增功能或特性 |
| 🐞 | `fix` | 修復程式錯誤 |
| 📃 | `docs` | 僅修改文件內容 |
| 🌈 | `style` | 格式調整，不影響邏輯（空白、分號等） |
| 🦄 | `refactor` | 重構，既非修 bug 也非加功能 |
| 🎈 | `perf` | 效能優化 |
| 🧪 | `test` | 新增或修正測試 |
| 🔧 | `build` | 建置流程或輔助工具調整 |
| 🐎 | `ci` | CI 設定或腳本變更 |
| 🐳 | `chore` | 與程式邏輯無關的雜項（文件生成、工具設定） |
| ↩ | `revert` | 還原先前的變更 |

## 範例

```
✨ feat(auth): 新增 JWT refresh token 機制 API-70

過期後自動換發，避免使用者被強制登出。
```

```
🐞 fix(order): 修復訂單金額計算邊界值錯誤
```

```
🧪 test(user): 補上 getUserById 的失敗情境測試
```

## 規則

- icon 與 type 之間留一個空格
- subject 首字不大寫（除非是專有名詞）
- subject 結尾不加句點
- 一個 commit 只做一件事
