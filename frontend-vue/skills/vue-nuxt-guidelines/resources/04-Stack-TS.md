---
title: TypeScript 規範
category: TypeScript
tags: [TypeScript, Type Safety, Interface, JSDoc, Async/Await]
version: 2025-11
maintainer: Zoe Chan
last_updated: 2026-01-28
description: TypeScript 開發規範,涵蓋型別安全、Interface 使用、JSDoc 註解、非同步處理等最佳實踐
---

# TypeScript 規範

**Maintainer**: Zoe Chan  
**Version**: 2025-11  
**Last Updated**: 2026-01-28

---

## 目錄

- [禁止使用 any](#禁止使用-any)
- [優先使用 interface](#優先使用-interface)
- [所有公開函數都要有 JSDoc 註解](#所有公開函數都要有-jsdoc-註解)
- [使用 async/await,避免 .then() 鏈](#使用-asyncawait避免-then-鏈)
- [常見型別模式](#常見型別模式)

---

## Version: 2025-11

### 禁止使用 any

```javascript
// ❌ 錯誤做法
function processData(data: any) {
  return data.value
}

// ✅ 正確做法
interface DataModel {
  value: string
  count: number
}

function processData(data: DataModel) {
  return data.value
}
```

**理由**：`any` 會破壞 TypeScript 的型別安全，導致運行時錯誤難以追蹤。

### 優先使用 interface

**優先使用 `interface` 而非 `type`**

```javascript
// ✅ 推薦
interface User {
  id: string
  name: string
  email: string
}

// ⚠️ 避免用於對象定義
type UserType = {
  id: string
  name: string
  email: string
}
```

**理由**：

- interface 更符合 Vue 3 和 Composition API 的型別推導
- interface 支援合併和擴展
- 與 OOP 概念更一致

### 所有公開函數都要有 JSDoc 註解

**完整的 JSDoc 示例**

```javascript
/**
 * 取得用戶問卷列表
 * @param {Object} params - 查詢參數
 * @param {number} params.page - 頁碼（默認：1）
 * @param {number} params.size - 每頁筆數（默認：10）
 * @param {string} [params.status] - 問卷狀態（可選）
 * @returns {Promise<{rtnCode: string, rtnMsg: string, data: any[]}>} 問卷列表
 * @throws {Error} API 請求失敗時拋出
 * @example
 * const result = await getUserSurveys({ page: 1, size: 20 })
 */
export async function getUserSurveys(
  params: QueryParams,
): Promise<ApiResponse> {
  // 實現
}
```

### 使用 async/await，避免 .then() 鏈

**使用 async/await**

```javascript
//  推薦
async function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    const user = response.data;
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// ❌ 避免
function fetchUserData(userId: string) {
  return api
    .get(`/users/${userId}`)
    .then((response) => response.data)
    .then((user) => {
      // 處理user
      return user;
    })
    .catch((error) => {
      console.error('Failed:', error);
      throw error;
    });
}
```

**優點**：

- 代碼更易讀，流程更清晰
- 錯誤處理統一（try/catch）
- 便於使用 TypeScript 型別推導

### 常見型別模式

```typescript
// 1. API 回應統一型別
interface ApiResponse<T = any> {
  rtnCode: string;
  rtnMsg: string;
  data: T | null;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// 2. Vue 組件 Props
interface ComponentProps {
  modelValue: string;
  disabled?: boolean;
  options: Array<{ label: string; value: string }>;
}

// 3. Store 狀態
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// 4. 工具函數
function formatDate(date: Date, format: 'YYYY-MM-DD' | 'DD/MM/YYYY'): string {
  // 實現
}

// 5. 異步操作
async function saveData<T>(data: T): Promise<ApiResponse<T>> {
  const response = await makeApiCall('POST', '/save', data);
  return response;
}
```
