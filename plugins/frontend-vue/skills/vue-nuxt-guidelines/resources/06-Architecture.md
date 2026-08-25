---
title: 全域錯誤處理與分層架構
category: Architecture
tags: [Architecture, Error Handling, Result Pattern, Clean Architecture, Layered Design]
version: 2025-12
maintainer: Zoe Chan
last_updated: 2026-01-28
description: 前端架構設計規範,涵蓋錯誤處理設計原則、Result Pattern、分層架構、Service 層與 Composable 實作
---

# 全域錯誤處理與分層架構

**Maintainer**: Zoe Chan  
**Version**: 2025-12  
**Last Updated**: 2026-01-28

---

## 目錄

- [核心設計原則：奧卡姆剃刀](#核心設計原則：奧卡姆剃刀-occams-razor)
- [錯誤處理設計原則](#錯誤處理設計原則)
- [Result Pattern - 將錯誤視為數值](#result-pattern---將錯誤視為數值)
  - [為什麼要拋棄 try-catch?](#為什麼要拋棄-try-catch)
  - [Result 型別定義](#result-型別定義)
  - [自定義錯誤型別](#自定義錯誤型別)
- [Infrastructure Layer - Axios 攔截器](#infrastructure-layer---axios-攔截器)
  - [智慧攔截器實作重點](#智慧攔截器實作重點)
- [Domain Layer - Service 使用 Result Pattern](#domain-layer---service-使用-result-pattern)
  - [Service 層標準實作](#service-層標準實作)
- [Application Layer - Composable 錯誤處理](#application-layer---composable-錯誤處理)
  - [通用型 Async State Composable](#通用型-async-state-composable)
- [Store 層職責](#store-層職責)

---

## Version: 2025-12

### 核心設計原則：奧卡姆剃刀 (Occam's Razor)

> **「如無必要，勿增實體」 (Entities should not be multiplied unnecessarily)**

在軟體架構與實作中，**最簡單的解法往往是最好的解法**。我們應始終懷疑複雜度，並優先考慮原生與直觀的解決方案。

#### 實踐指南
1. **優先使用原生機制**：若瀏覽器原生支援（例如 `<img src>` 載入跨域圖片、`<form>` 提交、CSS 處理動畫），就不要寫複雜的 JavaScript 邏輯或引入中介層。
2. **拒絕過度設計 (No Over-engineering)**：不要為了解決簡單問題而引入 Proxy、BFF 或複雜的設計模式，除非確有必要。
3. **最小依賴**：每增加一個依賴或一個架構層級，都意味著維護成本的增加。

#### 經典反思案例：CORS 圖片載入
- **問題**：需要顯示外部第三方的驗證碼圖片，但 AJAX 請求被 CORS 阻擋。
- **❌ 複雜解法 (Over-engineered)**：
  - 在開發環境配置 Vite Proxy。
  - 要求 DevOps 修改 Nginx 反向代理配置。
  - 甚至建立一個 BFF API 來轉發請求。
- **✅ 奧卡姆解法 (Simple & Effective)**：
  - 直接將 URL 放入 `<img src="...">`。
  - **原因**：瀏覽器的 `<img>` 標籤天生不受同源政策 (SOP) 限制，是最簡單且穩定的解法。

---

### 錯誤處理設計原則

現代前端應用的錯誤處理應遵循 **分層責任制 (Layered Responsibility)**，避免重複提示與職責模糊。

#### 核心問題：為何會出現重複錯誤提示？

在未經精心設計的架構中，錯誤處理往往呈現「恐慌式」傳遞鏈：
1. **Axios 攔截器**：捕獲錯誤並顯示 Toast
2. **Service 層**：再次 try-catch 並可能再次顯示錯誤
3. **Composable/Component 層**：又一次 try-catch 並顯示錯誤

**結果**：使用者在 0.1 秒內看到三個堆疊的錯誤提示，造成「通知疲勞」。

#### 分層職責定義

| 層級 | 職責 | 錯誤處置 | UI 副作用 |
|------|------|----------|-----------|
| **Infrastructure (Axios)** | 處理 HTTP 協議異常（401, 500, Network Error） | **攔截並處理**系統級錯誤或 **Pass Through**業務錯誤 | 僅針對系統級崩潰顯示全域警示或重導向 |
| **Domain (Service)** | 定義業務規則與資料型別 | **轉換**為 Result 物件，不進行 UI 處理 | 無，純邏輯運算 |
| **Application (Composable)** | 管理應用狀態與使用者互動流程 | **接收並決策**，根據業務場景決定顯示何種錯誤訊息 | 觸發具體的、有上下文的 Toast 通知 |

---

### Result Pattern - 將錯誤視為數值

#### 為什麼要拋棄 try-catch？

在 TypeScript 中，`try-catch` 有致命缺點：
- `catch(e)` 中的 `e` 永遠是 `unknown` 或 `any`，失去型別保護
- 拋出例外應該保留給「真正的異常」（如程式 Bug），而非「預期的業務失敗」

**解決方案**：將錯誤視為 **數值 (Error as Value)**，使用 **Result Pattern**。

#### Result 型別定義

```typescript
// src/types/result.ts

/**
 * 代表操作成功的結果
 */
export type Success<T> = {
  readonly success: true;
  readonly data: T;
};

/**
 * 代表操作失敗的結果
 * E 可以是 Error 物件，也可以是自定義的錯誤碼 enum
 */
export type Failure<E = Error> = {
  readonly success: false;
  readonly error: E;
};

/**
 * Result 類型：強迫使用者必須檢查 success 狀態才能存取 data
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

// Helper Functions (Factory Methods)
export const ok = <T>(data: T): Success<T> => ({ success: true, data });
export const fail = <E>(error: E): Failure<E> => ({ success: false, error });

// 進階：Unwrap 輔助函式（謹慎使用）
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.success) return result.data;
  throw result.error;
};
```

#### 自定義錯誤型別

```typescript
// src/types/errors.ts

export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export class AppError extends Error {
  constructor(
    public message: string,
    public code: ErrorCode = ErrorCode.UNKNOWN,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

---

### Infrastructure Layer - 智慧攔截器

#### 擴充 Axios 型別定義

```typescript
// src/plugins/axios/types.d.ts
import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * @description 控制是否略過全域錯誤處理（例如 Toast 通知）
     * 當設為 true 時，攔截器將不會彈出錯誤提示，將錯誤原樣拋出給呼叫者處理
     * @default false
     */
    skipGlobalErrorHandler?: boolean;

    /**
     * @description 控制是否略過全域 Loading 動畫
     * @default false
     */
    skipGlobalLoading?: boolean;
  }
}
```

#### 智慧攔截器實作重點

在現有的 Axios 攔截器中加入錯誤分流邏輯：

```javascript
// 在 handleErrorResponse 函式中加入分流邏輯
async function handleErrorResponse(error) {
  const { response, code, message, config } = error;

  // 1. 網路錯誤（系統級，全域處理）
  if (!response) {
    if (code === 'ECONNABORTED' || message?.includes('timeout')) {
      setTimeout(() => showAlert('連線逾時，請檢查網路或稍後再試！', 'error', message), 0);
      return Promise.reject(error);
    }
    setTimeout(() => showAlert('無法連線伺服器，請檢查網路或稍後再試！'), 0);
    return Promise.reject(error);
  }

  const status = response.status;

  // 2. 系統級錯誤（401, 500+）- 全域處理
  switch (status) {
    case 401:
      showAlert('登入逾期，請重新登入');
      roleHelper.deleteRole();
      authAdapter.logout();
      router.push('/userlogin');
      break;

    case 403:
      showAlert('無權限使用此功能');
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      showAlert(response.data?.rtnMsg || '伺服器異常，請聯絡管理人員！', 'error');
      break;

    // 3. 業務級錯誤（4xx）- 檢查 skipGlobalErrorHandler
    default:
      // 關鍵：檢查是否要跳過全域錯誤處理
      if (!config?.skipGlobalErrorHandler) {
        const apiMessage = response.data?.rtnMsg || response.data?.message || '發生未知錯誤';
        showAlert(apiMessage);
      }
      break;
  }

  // 無論是否顯示了 Toast，都必須將錯誤拋出
  // 這樣 Service 層才能知道請求失敗，並進行 Result 封裝
  return Promise.reject(error);
}
```

---

### Domain Layer - Service 使用 Result Pattern

#### Service 層標準實作

```javascript
// src/services/userService.js
import { makeApiCall } from '@/plugins/axios';
import { ok, fail } from '@/types/result';
import { AppError, ErrorCode } from '@/types/errors';

/**
 * 獲取使用者資料
 * @param {string} userId - 使用者 ID
 * @returns {Promise<Result<UserProfile, AppError>>}
 */
export async function getUserProfile(userId) {
  try {
    const res = await makeApiCall(
      'GET',
      `/users/${userId}`,
      null,
      {
        showSuccess: false,
        showWarn: false,
        disableLoading: false,
        skipGlobalErrorHandler: true // 關鍵：由 Composable 層決定如何處理錯誤
      }
    );

    if (!res || typeof res !== 'object') {
      return fail(new AppError('伺服器無回應資料', ErrorCode.NETWORK_ERROR));
    }

    const { rtnCode, rtnMsg, data } = res;

    if (rtnCode === '0000') {
      return ok(data);
    }

    // 業務錯誤：轉換為 AppError
    const errorCode = rtnCode === '0001' ? ErrorCode.NOT_FOUND : ErrorCode.UNKNOWN;
    return fail(new AppError(rtnMsg || '資料取得失敗', errorCode));

  } catch (error) {
    // 例外錯誤捕捉（網路錯誤、Axios 錯誤等）
    console.error(`❌ [Service:getUserProfile]`, error);
    
    const errorCode = error.response?.status === 404 
      ? ErrorCode.NOT_FOUND 
      : ErrorCode.UNKNOWN;
    
    return fail(
      new AppError(
        error.response?.data?.rtnMsg || error.message || '服務層錯誤',
        errorCode
      )
    );
  }
}
```

---

### Application Layer - Composable 錯誤處理

#### 通用型 Async State Composable

```javascript
// src/composables/utils/useAsyncState.js
import { ref } from 'vue';

/**
 * 通用的非同步狀態管理 Composable
 * @template T, E
 * @param {(...args: any) => Promise<Result<T, E>>} asyncFn - 回傳 Result 的非同步函式
 * @param {T | null} initialData - 初始資料
 * @param {Object} options - 選項
 * @returns {Object} { data, error, isLoading, execute }
 */
export function useAsyncState(asyncFn, initialData = null, options = {}) {
  const data = ref(initialData);
  const error = ref(null);
  const isLoading = ref(options.initialLoading ?? false);

  const execute = async (...args) => {
    if (options.resetErrorOnExecute ?? true) {
      error.value = null;
    }
    isLoading.value = true;

    // 執行 Service 方法，獲得 Result
    const result = await asyncFn(...args);

    if (result.success) {
      data.value = result.data;
      isLoading.value = false;
      return true; // 明確回傳成功訊號
    } else {
      error.value = result.error;
      isLoading.value = false;
      return false; // 明確回傳失敗訊號
    }
  };

  return { data, error, isLoading, execute };
}
```
---

# ==狀態管理==

## Version: 2025-10

**統一狀態管理策略** - 使用 `Pinia` - 將狀態模組化，避免將所有邏輯放在一個 store 中。

- **Loading 狀態**-loadingStore 在 Axios 攔截器統一管理，所以在 vue 組件不用管理 loading 狀態，在 API function 可以用 disableLoading 去控制是否用加載指示器
- **loginStore 登入狀態管理**
- **userStore 使用者狀態管理**

