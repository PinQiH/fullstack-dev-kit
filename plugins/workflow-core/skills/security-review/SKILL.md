---
name: security-review
description: '審查目前分支、本機差異或指定 Pull Request 新增的可利用安全漏洞，聚焦高信心且具體可修復的 findings。'
---

# 安全性審查

針對這次變更新增的安全風險進行唯讀審查。只回報具有具體攻擊路徑，且信心至少 80% 的 High 或 Medium findings；不要把一般程式碼品質、理論性 hardening 或既有問題混入報告。

## 審查範圍

1. 確認目標是目前 staged、working tree、指定比較基準或遠端 Pull Request。
2. 使用可用的 Git 與檔案搜尋工具讀取 status、commit、完整 diff 與相關程式碼脈絡。
3. 遠端 Pull Request 優先使用唯讀方式取得內容，不切換分支、不修改檔案，也不對遠端留下留言。
4. 若比較基準不明確，先從 repository 的預設分支與 upstream 設定推導；仍無法確認時才詢問使用者。

## 優先檢查項目

- SQL、NoSQL、command、template、XML、路徑與動態程式碼注入。
- 認證繞過、權限提升、缺少伺服器端授權檢查、session 與 JWT 驗證錯誤。
- 不安全反序列化、弱密碼學、可預測亂數、憑證驗證繞過。
- 可利用的 reflected、stored 或 DOM XSS，以及不安全 HTML API。
- 機密、密碼或個人資料洩漏。
- 新增的外部輸入到敏感操作之間，是否缺少必要驗證或編碼。

## 分析方式

1. 了解 repository 使用的安全框架、驗證方式、權限模型與既有安全模式。
2. 逐一追蹤變更中的外部輸入、信任邊界、資料流與敏感操作。
3. 比較新程式碼是否偏離同專案既有的安全寫法。
4. 對每個候選 finding 驗證必要前提、攻擊者可控內容、實際影響與可行修正。
5. 排除信心低於 80%、只能造成理論風險或無法指出具體程式位置的項目。

## 不回報的項目

- DoS、rate limiting、資源耗盡、記憶體或 CPU 消耗。
- 只有最佳實務缺口，卻沒有具體利用路徑的 hardening 建議。
- 單純過時的第三方套件、文件檔、純測試檔或 log spoofing。
- 只控制 URL path、無法控制 host 或 protocol 的 SSRF 猜測。
- Regex injection、Regex DoS、純理論 race condition。
- 前端缺少授權檢查；授權應由後端執行。若後端也缺少檢查則應回報。
- React、Angular 或 Vue 的一般文字插值；只有使用不安全 HTML API 時才視為 XSS 候選。
- GitHub Actions 或 shell script 中沒有可信外部輸入路徑的 command injection 猜測。

## Finding 格式

依嚴重程度排序，每個 finding 必須包含：

```markdown
## [High|Medium] 類別：`path/to/file.ts:42`

- 信心：8/10 以上
- 問題：描述不安全的資料流或權限邏輯
- 攻擊情境：說明攻擊者能控制什麼，以及如何造成影響
- 建議：提供可落地的修正方向
```

若沒有符合門檻的問題，明確回覆「未發現具體且高信心的安全性漏洞」，並簡述已審查的範圍。最終回覆只包含安全性審查報告。
