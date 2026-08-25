---
title: 命名規範
category: Naming Conventions
tags: [Naming, Code Style, Vue3, TypeScript, BEM, Testing]
version: 2026-01
maintainer: Zoe Chan
last_updated: 2026-01-28
description: 前端開發命名規範,涵蓋變數、函數、組件、API、TypeScript、CSS 等全方位命名準則
---

# 命名規範

**Maintainer**: Zoe Chan  
**Version**: 2026-01  
**Last Updated**: 2026-01-28

---

## 目錄

- [總則](#總則)
- [1. 基礎開發命名 (Core Development)](#1-基礎開發命名-core-development)
- [2. Vue 3 與狀態管理 (Vue & State Management)](#2-vue-3-與狀態管理-vue--state-management)
- [3. API 與資料分層 (API & Data Layer)](#3-api-與資料分層-api--data-layer)
- [4. TypeScript 強型別規範 (Modern TypeScript)](#4-typescript-強型別規範-modern-typescript)
- [5. 樣式與 UX 狀態 (CSS & UX States)](#5-樣式與-ux-狀態-css--ux-states)
- [6. 品質控管測試 (Testing - Vitest)](#6-品質控管測試-testing---vitest)

---

## Version: 2026-01

### **總則**

在命名時應始終遵循以下最高準則，確保程式碼的認知負載降至最低。
- **清晰明確語意優先**：命名應體現「為什麼」這樣做（業務邏輯），而非「如何」做到（實作細節），避免使用無意義的名稱（如 `temp` 或 `test`）。
- **遵循業務邏輯**：命名需與業務概念一致，便於業務相關方理解。
- **唯一性**：命名需保證在作用域或全局範圍內唯一，避免命名衝突。
- **區分大小寫**：根據命名類型選擇適當的大小寫規範（如駝峰式、全大寫等）。
- **消除魔法數字**：所有在程式碼中具備特殊意義的數值都必須命名為具備語意的常量 。
- **一致性高於一切**：在現有專案中，遵循既有的慣例比追求「理論上的正確」更重要。除非進行大規模重構，否則應與團隊現有風格保持對齊。

#### 1. 基礎開發命名 (Core Development)

| 類型 | 命名規範 | 核心規則 | 示例 |
| --- | --- | --- | --- |
| **變數名** | `camelCase` | 名詞開頭，反映業務意圖而非實作細節  | `userName`, `maxRetryCount` |
| **函數名** | `camelCase` | 動詞開頭，遵循單一職責原則 (SRP) | `fetchUserData``validateEmail` |
| **全域常量** | `UPPER_SNAKE_CASE` | 全大寫，底線分隔，用於編譯時不可變量 | `API_BASE_URL``DEFAULT_TIMEOUT` |
| **布林值** | `is-` / `has-` 前綴 | 清晰描述狀態屬性 | `isUserLoggedIn`, `hasPermission` |
| **內部私有屬性** | `_` 前綴 | 用於類別或組件內部的封裝意圖 | `_internalState`, `_cacheData` |

#### 2. Vue 3 與狀態管理 (Vue & State Management)

| 類型 | 命名規範 | 核心規則 | 示例 |
| --- | --- | --- | --- |
| **組件文件** | `PascalCase` | 強烈建議多單字命名，避免與 HTML 標籤衝突 | `UserProfile.vue`, `BaseButton.vue` |
| **組件標籤** | `PascalCase` | 在 SFC 範本中與 HTML 區分；DOM 範本則用 `kebab-case` | `<UserCard />` |
| **Pinia Store** | `camelCase` | 以 `use` 開頭並以 `Store` 結尾 | `useAuthStore`, `usePlayerStore` |
| **Composables** | `camelCase` | 以 `use` 開頭，封裝具備生命週期的響應式邏輯 | `useMousePosition`, `useFetch` |
| **Prop 宣告** | `camelCase` | 在 JS 中宣告為小駝峰，但在 HTML 範本中使用連字號 | `props: { userEmail: String }` |
| **事件發送** | `kebab-case` | 與 HTML 原生事件監聽習慣保持一致 | `emit('close-dialog')` |

#### 3. API 與 資料分層 (API & Data Layer)

| 類型 | 命名規範 | 核心規則 | 示例 |
| --- | --- | --- | --- |
| **API 服務文件** | `camelCase` | 檔案後綴使用 `.service.ts` 以明確架構職責 | `user.service.ts` |
| **API 函數** | `VerbNoun` | 以 HTTP 方法或行為動詞作為前綴 | `getUserProfile`, `postNewOrder` |
| **資料模型** | `PascalCase` | 檔案後綴使用 `.model.ts` 或 `.type.ts` | `UserSession.model.ts` |
| **工具函數** | `camelCase` | 置於 `utils/` 並按業務劃分，非響應式邏輯不加 `use` | `dateFormatter.ts`, `authHelper.ts` |

#### 4. TypeScript 強型別規範 (Modern TypeScript)

| 類型 | 命名規範 | 核心規則 | 示例 |
| --- | --- | --- | --- |
| **介面 (Interface)** | `PascalCase` | **禁止** 使用 `I` 前綴，介面即為契約本身 | `UserAccount` (非 IUser) |
| **型別 (Type)** | `PascalCase` | 用於聯集型別或複雜組合 | `StatusUnion`, `OrderParams` |
| **泛型參數** | `T` / `TData` | 單一參數用 `T`，多參數用 `T` 開頭的描述性名稱 | `<TData>`, `<TResponse>` |
| **枚舉替代品** | `as const` | 2025 趨勢：以字面量聯集取代 Enum 以優化 Bundle Size | `const USER_ROLES = {...} as const` |

#### 5. 樣式與 UX 狀態 (CSS & UX States)

| 類型 | 命名規範 | 核心規則 (BEM 變體) | 示例 |
| --- | --- | --- | --- |
| **基礎樣式** | `kebab-case` | `{功能}-{元件}-{結構}` | `.card-header-title` |
| **互動狀態** | `is-` 前綴 | 描述組件目前的暫時性狀態 | `.is-active`, `.is-loading` |
| **變體/修飾** | `--` 連接 | 描述組件的不同版本或外觀變體 | `.btn--primary`, `.btn--large` |
| **UI 狀態框架** | `vm-` 前綴 | 框架/主題級別的狀態控制 | `.vm-dark`, `.vm-mobile` |

#### 6. 品質控管測試 (Testing - Vitest)

| 類型 | 命名規範 | 核心規則 | 示例 |
| --- | --- | --- | --- |
| **測試文件** | `[name].test.ts` | 與原始碼鄰近放置，或置於 `__tests__` 目錄 | `LoginButton.test.ts` |
| **測試案例名** | `should...when` | 描述業務預期行為與觸發條件 | `it('should show error when email is invalid')` |

