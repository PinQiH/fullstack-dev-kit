---
name: nestjs-guidelines
description: 'NestJS 後端開發規範，涵蓋 Module、依賴注入、DTO 驗證、例外處理、授權、資料存取、測試與維運。適用於實作或審查 NestJS API；框架無關的 Node.js 工作沿用 nodejs-guidelines。'
---

# NestJS 後端開發規範

本規範補充 nodejs-guidelines 的共通原則。若兩者對 HTTP、例外處理或框架結構有衝突，以本規範為準。

## 模組與依賴注入

- 依業務領域建立 Feature Module；Controller、Service、Persistence Adapter、DTO 與測試放在同一功能目錄。
- Provider 預設只在所屬 Module 使用；只有其他 Module 確實需要時才 export。全域 Module 僅限設定、日誌等跨領域基礎設施。
- Controller 只負責 HTTP 輸入與輸出；業務流程放在 Service，資料存取封裝於 Repository 或 Persistence Adapter。
- Service 不直接使用 Request、Response 或 ORM 的 HTTP 型別。

## DTO、驗證、HTTP 與例外

- 所有 path、query、body 都使用明確 DTO；不直接把 any、原始 body 或 ORM Entity 當成輸入型別。
- 在應用程式入口設置全域 ValidationPipe，至少啟用 whitelist、forbidNonWhitelisted 與必要的 transform。
- 回傳 DTO 或明確 response model，不直接暴露 Entity 的敏感欄位；序列化由 serializer 或 interceptor 統一處理。
- 採用語意正確的 HTTP status：建立 201、無內容刪除 204、驗證失敗 400 或 422、未登入 401、無權限 403、不存在 404、衝突 409。
- 不以所有業務錯誤都回傳 200 作為預設。若既有契約必須保留 response envelope，應由全域 interceptor 統一包裝，HTTP status 仍反映結果。
- 預期失敗使用 Nest HTTP exceptions 或 domain exception，並由 Exception Filter 集中轉換錯誤格式與紀錄；不在每個 Controller 重複 try/catch 或直接使用 console.log。

## 認證、資料與維運

- 認證交由 Guard；使用者身分以自訂 parameter decorator 傳入 Controller。角色與權限以 metadata decorator 宣告並由 Guard 強制執行。
- 公開端點必須明確標記；前端顯示控制不能取代後端授權。Token、密碼與憑證不得寫入程式碼、log 或例外回應。
- ORM 可使用 TypeORM、Prisma 或其他已選定方案；透過注入的 Repository／Adapter 隔離細節，不強制沿用 Sequelize generalRepo。
- Service 決定交易邊界；跨多個寫入操作要使用選定 ORM 的 transaction API 並測試 rollback。避免迴圈查詢與 N+1。
- 使用 ConfigModule 驗證並注入設定，使用 Nest Logger 或結構化 logger，加入必要 Health Check 與 shutdown lifecycle。
- 排程使用 @nestjs/schedule，佇列使用選定的 Nest 整合套件；背景工作需具冪等性、重試策略與失敗可觀測性。

## 測試與 API 文件

- Service 單元測試使用 Test.createTestingModule()，以 overrideProvider Mock 邊界依賴。
- E2E 測試建立 INestApplication，透過 Supertest 驗證 route、Pipe、Guard、Filter 與 HTTP status；資料庫整合測試使用隔離的測試資料庫。
- 對外 HTTP API 除交接文件外，使用 Swagger/OpenAPI decorators 維護可執行契約，涵蓋授權、錯誤 status 與資料影響。

## 完成前檢查

- Module 邊界、Provider export、DTO 驗證、Guard、HTTP status 與 response DTO 一致。
- 新增業務邏輯至少有 Service 單測；新增端點有 E2E 或等效整合測試。
- 設定、日誌與錯誤回應未包含機密資訊。
