---
title: API 與 Service 規範
category: API & Service
tags: [API, Service Layer, Axios, Result Pattern, Error Handling, JSDoc]
version: 2026-01
maintainer: Zoe Chan
last_updated: 2026-01-30
description: API 與 Service 層開發規範,涵蓋 Axios 配置、makeApiCall 標準、Service 層架構、Result Pattern 實作
---

# API 與 Service 規範

**Maintainer**: Zoe Chan  
**Version**: 2026-01  
**Last Updated**: 2026-01-28

---

## 目錄

- [Axios](#axios)
  - [makeApiCall 標準簽名](#makeapicall-標準簽名)
  - [Axios Instance](#axios-instance)
- [Swal 統一訊息處理](#swal-統一訊息處理)
  - [handleApiAlert 用法](#handleapialert-用法)
- [Service 層完整實作指南](#service-層完整實作指南)
  - [核心架構視圖](#核心架構視圖)
  - [1. 定義雙重型別系統 (DTO vs Domain)](#1-定義雙重型別系統-dto-vs-domain)
  - [2. 實作 Mapper (防腐層 ACL)](#2-實作-mapper-防腐層-acl)
  - [3. 採用 Result 模式處理錯誤](#3-採用-result-模式處理錯誤)
  - [4. Service 類別實作 (核心邏輯)](#4-service-類別實作-核心邏輯)
  - [5. 在 Composable / UI 中消費](#5-在-composable--ui-中消費)
- [開發規範與架構細節](#開發規範與架構細節)
  - [函式命名與匯出規則](#函式命名與匯出規則)
  - [框架實作細節](#框架實作細節)
  - [目錄結構建議](#目錄結構建議)
- [API 調用標準化](#4-api-調用標準化)
  - [API 功能模組範例](#api-功能模組範例)

---

## Version: 2026-01

## Axios 層職責定義

> **設計原則**：Axios 只負責「傳輸」與「系統級錯誤」，業務邏輯錯誤由 Composable 層處理。

### 職責分層

| 層級 | 職責 | 範例 |
|------|------|------|
| **Axios Interceptor** | 系統級錯誤處理 | 401 登出、5xx 伺服器異常、網路錯誤 |
| **Service Layer** | 資料轉換 + Result 包裝 | DTO → Domain、回傳 `Result<T, AppError>` |
| **Composable Layer** | 業務邏輯 UI 回饋 | 顯示成功/警告 Toast、錯誤頁面跳轉 |

### API 標準回傳結構

> 後端 API 統一使用以下信封格式 (Envelope Pattern)：

```javascript
{
  rtnCode: string,        // 回傳代碼（0000: 成功）
  rtnMsg: string,         // 回傳訊息（後端預設提供）
  data: object | null,    // 實際資料內容
  pagination: object | null, // 分頁資訊（若 API 支援分頁才提供）
}
```

### makeApiCall 標準簽名

> 位於 `src/plugins/axios.js`，核心請求封裝。

```typescript
export interface ApiOptions {
  disableLoading?: boolean;         // 預設 false: 關閉全域 Loading 動畫
  skipGlobalErrorHandler?: boolean; // 預設 false: 交由 Service Result 處理錯誤
  authRequired?: boolean;           // 預設 false: 強制使用 Header Authorization (某些 API 不接受 Cookie)
}

export async function makeApiCall<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  options?: ApiOptions,
  axiosConfig?: AxiosRequestConfig
): Promise<T> { ... }
```

### Axios Interceptor 處理範圍

```typescript
// ✅ 系統級錯誤 - 由 Axios 攔截器統一處理
case 401: logout(); break;
case 500/502/503/504: showAlert('伺服器異常'); break;
case NetworkError: showAlert('網路連線失敗'); break;

// ❌ 業務邏輯錯誤 - 不在 Axios 處理，交由 Composable
// rtnCode !== '0000' → 由 Service 包裝為 Result.error，Composable 決定 UI 行為
```

---

## 業務錯誤處理：Composable 層

> **設計原則**：業務邏輯的成功/失敗提示由 Composable 決定，而非 Axios 攔截器。

### handleApiAlert 用法

```javascript
import { handleApiAlert, showAlert } from '@/plugins/swal'

// Composable 內根據 Result 決定是否顯示
const result = await UserService.updateProfile(data);

if (result.success) {
  showAlert('儲存成功', 'success');  // ✅ 成功提示由 Composable 控制
  router.push('/profile');
} else {
  handleApiAlert(result.error);       // ✅ 錯誤提示由 Composable 控制
}
```

---

## Service 層完整實作指南

現代前端架構中的 **Service 層（服務層）** 實作已從單純的「API 呼叫代理」演進為具備 **防腐層（ACL）** 與 **錯誤控制** 功能的核心邏輯層。

以下是基於 **TypeScript**、**Vue 3 / Nuxt 3** 生態系的 Service 層實作方法完整指南：

### 核心架構視圖
Service 層位於 **基礎設施（Axios）** 與 **應用層（Composables/UI）** 之間。
其核心職責為：**「隔離後端變更」** 與 **「標準化數據流」**。
┌─────────────────────────────────────────────────────────────┐
│  Axios Interceptor                                          │
│  - 401 → 強制登出                                            │
│  - 5xx → showAlert('伺服器異常')                             │
│  - Network Error → showAlert('網路連線失敗')                 │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  - 呼叫 makeApiCall({ skipGlobalErrorHandler: true })       │
│  - DTO → Domain 轉換                                        │
│  - 回傳 Result<T, AppError>                                 │
├─────────────────────────────────────────────────────────────┤
│  Composable Layer                                           │
│  - if (result.success) showAlert('成功')                    │
│  - else handleApiAlert(result.error)                        │
└─────────────────────────────────────────────────────────────┘
---

### 1. 定義雙重型別系統 (DTO vs Domain)
為了實現後端與前端的解耦，必須嚴格區分「後端傳輸的格式」與「前端使用的格式」。

*   **DTO (Data Transfer Object)**：完全對應後端 API 的 JSON 結構，通常使用 snake_case，包含原始型別。
*   **Domain Model (領域模型)**：前端 UI 真正需要的結構，使用 camelCase，包含豐富型別（如 Date、Enum）。

```typescript
// types/dto/UserDTO.ts (後端定義)
export interface UserDTO {
  user_id: number;
  f_name: string;
  role_bitmask: number; // 0: Guest, 1: Admin
  created_ts: string;   // ISO String
}

// types/domain/User.ts (前端定義)
export enum UserRole {
  Guest = 'Guest',
  Admin = 'Admin',
}

export interface User {
  id: string;            // 轉為字串避免大數問題
  fullName: string;      // 組合欄位
  role: UserRole;        // 語意化 Enum
  joinedAt: Date;        // 轉為 Date 物件
}
```

### 2. 實作 Mapper (防腐層 ACL)
Mapper 負責將「髒」的 DTO 轉換為「乾淨」的 Domain Model。這是隔離後端變更的關鍵，若後端欄位更名，只需修改此處，不用動 UI。

```typescript
// mappers/UserMapper.ts
import { UserDTO } from '@/types/dto/UserDTO';
import { User, UserRole } from '@/types/domain/User';

export class UserMapper {
  static toDomain(dto: UserDTO): User {
    // 處理資料清洗、預設值與型別轉換
    return {
      id: String(dto.user_id),
      fullName: `${dto.f_name}`.trim(),
      role: dto.role_bitmask === 1 ? UserRole.Admin : UserRole.Guest,
      joinedAt: new Date(dto.created_ts), // 轉換時間字串
    };
  }
}
```

### 3. 採用 Result 模式處理錯誤
摒棄在 Service 層拋出異常（`throw error`），改為回傳 **Result 物件**（`Success | Failure`）。這強迫調用者必須處理錯誤，並消除 UI 層的 `try/catch`。

**定義 Result 工具：**
```typescript
// utils/Result.ts
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

export const ok = <T>(value: T) => ({ success: true, value });
export const err = <E>(error: E) => ({ success: false, error });
```

### 4. Service 類別實作 (核心邏輯)
Service 層整合 HTTP 請求、Mapper 轉換與錯誤處理。

```typescript
// services/UserService.ts
import { client } from '@/plugins/axios'; // 設定過攔截器的 axios 實例
import { UserMapper } from '@/mappers/UserMapper';
import { type User } from '@/types/domain/User';
import { type UserDTO } from '@/types/dto/UserDTO';
import { type Result, ok, err } from '@/utils/Result';
import { AppError } from '@/types/errors';

export class UserService {
  // 回傳型別明確宣告為 Result<User, AppError>
  static async getProfile(id: string): Promise<Result<User, AppError>> {
    try {
      // 1. 呼叫 API (DTO)
      // skipGlobalErrorHandler: true 允許 Service 自行處理錯誤，不跳全域 Toast
      const response = await client.get<UserDTO>(`/users/${id}`, {
        skipGlobalErrorHandler: true 
      });
      
      // 2. 透過 Mapper 轉換 (DTO -> Domain)
      const user = UserMapper.toDomain(response.data);
      
      // 3. 回傳成功結果
      return ok(user);
      
    } catch (error: any) {
      // 4. 捕捉異常並轉換為 AppError，不讓 Axios 錯誤洩漏出去
      return err(new AppError(
        error.response?.data?.message || 'Unknown Error',
        error.response?.status
      ));
    }
  }
}
```

### 5. 在 Composable / UI 中消費
由於 Service 回傳的是 `Result`，UI 層邏輯會變得非常線性，無需 `try/catch` 包裹。

```typescript
// composables/useUserProfile.ts
import { UserService } from '@/services/UserService';
import { ref } from 'vue';

export function useUserProfile() {
  const user = ref(null);
  const error = ref(null);

  const fetchUser = async (id: string) => {
    // 直接獲取 result，不用 try/catch
    const result = await UserService.getProfile(id);
    
    if (result.success) {
      // 成功路徑：使用的是乾淨的 Domain Model
      user.value = result.value; 
    } else {
      // 失敗路徑：處理特定錯誤 (例如 404 跳轉)
      error.value = result.error;
      if (result.error.code === 404) {
        // router.push('/404');
      }
    }
  };

  return { user, error, fetchUser };
}
```

### 總結：最佳實踐檢查清單
1.  **Repository Pattern**：API 呼叫不應散落在組件中，必須封裝在 Service/Repository 內。
2.  **單一職責**：Service 只負責「數據獲取與轉換」，不處理「UI 反饋（如 Toast）」(由 Composable 決定)。
3.  **防禦性編程**：在 Mapper 層處理 `null` 或 `undefined`，確保 UI 拿到的資料絕對安全。
4.  **型別安全**：全面使用 TypeScript 介面定義 DTO 與 Domain Model，避免 `any`。

---

## 開發規範與架構細節

### 函式命名與匯出規則
- **所有 API Function 必須獨立於 Service 檔案**
- **匯出規則：採用「具名匯出 (Named Export)」**
   - 推薦：具名匯出函數 `export async function getXxx()` — JSDoc 完整支援
   - 可用：具名匯出物件 `export const XxxService = {}` — Nuxt/物件導向需求時使用
   - 禁止：預設匯出 `export default {}` — 無法正確解析 JSDoc
- **命名規則：依據 HTTP 方法統一命名**
  - `GET` → `getXxx`
  - `POST` → `postXxx`
  - `PUT` → `putXxx`
  - `DELETE` → `deleteXxx`
- **文件規範**：API Function 須包含 JSDoc。

### 框架實作細節
- **Axios 調用**：
  - 非 SSR：統一使用 Axios，需配合專案 `axios.js`。
  - Nuxt 框架：使用 `useNuxtApp().$axios`。
- **Loading 控制**：使用 `disableLoading` 參數控制全局 loading 狀態。
- **權限處理**：需要登入（會員）的權限已統一用 Cookie 處理。

### 目錄結構建議
```
src/
└── service/
    ├── authService.js         # 登入 / 登出 / 驗證相關
    ├── userService.js         # 使用者資料與角色
    ├── index.js               # 統一出口（統一 import 結構）
```

---

## **4. API 調用標準化**

- **在 Axios 已用 loadingStore 統一 `loading` 狀態管理**
- **用 loadingStore 來防止重複呼叫 API**
- **在 nuxt 框架下初始載入使用 useAsyncData 、 會員功能或互動功能用 useAsyncState**
- **判斷在可能頻繁觸發 API 的場景使用 防抖（debounce） 或 節流（throttle）**

### API 功能模組範例

#### **修改**
在調用 API 前需驗證不為空值，並比對新值與舊值，若有不同才調用修改 API。

#### **下載**
1.  下載檔案名稱需包含「名稱」+「時間戳」。
2.  檔案名稱需符合正規表達式，以避免特殊符號導致檔案名稱錯誤。
3.  使用 `blob` 處理二進位資料。
