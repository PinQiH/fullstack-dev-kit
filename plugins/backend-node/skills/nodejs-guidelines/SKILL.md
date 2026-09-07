---
name: nodejs-guidelines
description: Node.js／TypeScript 後端開發規範，用於命名、非同步、型別與分層。Express／Sequelize 範本慣例按需載入；NestJS 的 DTO、Repository 與錯誤處理改依 nestjs-guidelines。
---

# Node.js 後端開發規範

## 先確認專案

先讀目標專案的規範與相關程式，確認框架、ORM、既有回應與錯誤契約。
本 kit 同時包含共用編碼慣例與 Express／Sequelize 範本，後者並非所有 Node.js 專案的前提。
不要為了符合範例而新增 generalRepo、變更 ORM 或改寫既有 API 契約。

## 共用核心

- 變數與函式用 camelCase，函式以動詞加完整資源名稱，常數用 UPPER_SNAKE_CASE。
- 使用 tab、early return、明確區塊與 async／await；避免超過三層的巢狀。
- UUID 使用 `crypto.randomUUID()`；避免為現成能力新增依賴。
- TypeScript 使用 strict；以 unknown 與型別收窄取代 any。
- Controller／Service 明訂回傳型別；一般業務參數採物件解構，框架簽章依其契約。
- Controller 負責接收、驗證與呼叫 Service；Service 不操作 req／res。
- 查詢使用參數化；修改前確認授權、輸入欄位與需要維持原子性的操作。

## 依任務載入

| 任務 | 參考文件與邊界 |
| --- | --- |
| 一般 JS／TS 實作、命名、型別或分層細節 | [coding.md](references/coding.md) |
| 現有 Express／Sequelize Repository、generalRepo、Model 或 middleware | [sequelize.md](references/sequelize.md)，只套用專案已採用的契約 |
| NestJS Module、DTO、TypeORM、AppError、交易或稽核 | [nestjs-guidelines](../nestjs-guidelines/SKILL.md)，按其任務表讀取相關章節 |

只載入與本次工作相關的文件；已載入且未變更的規範不必重讀。
NestJS DTO 使用 class；TypeORM 不套用自建 Repository、DatabaseConflictError 或全部回 200 的範本慣例。
純型別 interface 與執行期 DTO 不可混用；優先遵循目標專案的明文規範。

## 驗證與交付

依變更範圍執行專案既有檢查與測試，完成後自我審查並回報發現。
保留 public API 與既有回應行為；若需求包含契約調整，補齊對應的呼叫端驗證。
