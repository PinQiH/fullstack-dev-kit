---
name: nestjs-guidelines
description: NestJS 開發與審查規範；用於 Module、Controller、DTO、TypeORM 與測試。先確認專案是否採用本 kit 的 AppError、ResponseInterceptor、TransactionService 與 AuditModule，再套用範本慣例。
---

# NestJS 開發規範

## 適用範圍

先從專案程式與設定確認框架、ORM、錯誤處理、回應格式與交易機制。
本 skill 的範本慣例適用於已具備 `AppError`、`ResponseInterceptor`、
`TransactionService` 與 `AuditModule` 的專案。
其他 NestJS 專案沿用既有架構；不可為了套用本 skill 自動新增這些基礎設施。

## 共用規範與優先順序

- 通用命名、非同步與型別規範見 [nodejs-guidelines](../nodejs-guidelines/SKILL.md)。已載入且內容未變時不重讀。
- 目標專案的明文規範優先；下表是本 kit 範本對 Node.js／Sequelize 慣例的覆寫。

| 項目 | 本 kit NestJS 範本 |
| --- | --- |
| DTO | 使用 class 與驗證裝飾器，保留執行期 import |
| 資料存取 | 直接注入 TypeORM Repository，不新增只轉發的 Repository 層 |
| 業務錯誤 | Service 拋 AppError 子類，由 Filter 翻譯資料庫與 HTTP 錯誤 |
| HTTP 狀態 | 依 HTTP 語意與既有統一回應契約，不套用「全部回 200」 |
| 命名 | 資源主鍵與方法帶完整資源名；保留 NestJS 專案既有檔名慣例 |

## 依任務載入

開始實作前只讀相關列；跨多個領域時合併必要文件，不預先載入全部參考資料。
所有相對路徑以本 skill 所在目錄為準。

| 任務 | 參考文件 |
| --- | --- |
| 分層、Controller／Service 邊界、主鍵與方法命名 | [architecture.md](references/architecture.md) |
| DTO、ValidationPipe、路由、Swagger、錯誤與回應格式 | [http-validation.md](references/http-validation.md) |
| Entity、查詢、交易、稽核事件、Migration | [persistence.md](references/persistence.md) |
| 設定注入、Module、Guard、middleware、啟動與 E2E 共用設定 | [runtime.md](references/runtime.md) |
| 測試、TypeScript metadata、註解與反模式檢查 | [quality.md](references/quality.md) |

## 實作時保留的邊界

- Controller 處理 HTTP；Service 不依賴 Express，不自行包裝統一回應。
- DTO 的 `@IsOptional()` 會略過 `null` 與 `undefined`；依 API 契約決定是否允許。
- 純型別使用 `import type`；驗證與 DI 需要的 class 必須保留執行期值。
- 在範本交易內，讀寫都使用 `resolveRepository()`，不得混用連線池 Repository。
- 稽核事件要等待完成並傳播錯誤；不得記錄密碼、token 或 session id 原值。
- 未預期錯誤不回傳原始內部訊息；遵循專案的敏感資料遮罩規則。

## 完成前驗證

依實際變更執行型別檢查、單元測試及需要的整合／E2E 測試。
交易、Guard 順序、DTO 執行期驗證與 middleware 接線不能只靠 mock 證明。
回報已執行的指令、結果與尚未驗證的行為，並自我審查異動。
