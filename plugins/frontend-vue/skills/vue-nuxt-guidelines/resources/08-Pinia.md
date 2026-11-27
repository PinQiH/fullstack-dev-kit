---
title: Pinia 狀態管理規範
category: State Management
tags: [Vue3, Pinia, Store]
description: Pinia store 的使用時機、setup store 寫法、與 Service／Composable 的分工、重設與測試
---

# Pinia 狀態管理規範

適用 Vue 3 與 Nuxt 3。分層定義見 [06-Architecture.md](06-Architecture.md)，Service 寫法見 [07-API-Service.md](07-API-Service.md)。
專案已有不同寫法時，沿用專案慣例。

## 一、什麼時候用 store

| 狀態 | 放哪裡 | 例子 |
| --- | --- | --- |
| 跨頁面、跨元件共用 | Pinia store | 登入者、權限、目前選取的部門 |
| 單一頁面的流程 | Composable | 列表的篩選、分頁、送出流程 |
| 單一元件內 | `ref`／`reactive` | 彈窗開關、輸入中的表單 |

不要為了「之後可能會共用」先放進 store。表單草稿、彈窗開關這類 UI 狀態預設不放 store。

## 二、分層與職責

```
元件 ── 顯示 store 狀態，呼叫 action 或 composable
Composable ── 頁面流程；依 Result 發 toast、導頁
Store ── 共用狀態 + action；呼叫 Service，回傳 Result
Service ── 呼叫 API、轉換 DTO，不碰 UI
```

- Store 不直接呼叫 axios，一律透過 Service。
- Store 不呼叫 toast、不導頁。action 回傳 `Result`，由呼叫端（composable 或元件的事件處理）決定要顯示什麼。
  這樣 store 可以在不同頁面重用，測試也不必 mock UI。
- 會改資料的 action，呼叫端成功與失敗都要發 toast（見 `ux-heuristics` 自我檢查清單）。

## 三、寫法：setup store

```ts
// stores/department.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getDepartments, updateDepartment } from '@/services/departmentService';
import type { Department } from '@/types/department';
import type { Result } from '@/types/result';

export const useDepartmentStore = defineStore('department', () => {
	// > state
	const departments = ref<Department[]>([]);
	const selectedDepartmentId = ref<string | null>(null);

	// > getters
	const selectedDepartment = computed(() =>
		departments.value.find((department) => department.departmentId === selectedDepartmentId.value) ?? null,
	);

	// > actions
	async function loadDepartments(): Promise<Result<Department[]>> {
		const result = await getDepartments();
		if (result.success) departments.value = result.data;
		return result;
	}

	async function renameDepartment({ departmentId, name }: { departmentId: string; name: string }): Promise<Result<Department>> {
		const result = await updateDepartment({ departmentId, name });
		if (result.success) {
			departments.value = departments.value.map((department) =>
				department.departmentId === departmentId ? result.data : department,
			);
		}
		return result;
	}

	// - setup store 沒有內建 $reset，自己提供
	function reset(): void {
		departments.value = [];
		selectedDepartmentId.value = null;
	}

	return { departments, selectedDepartmentId, selectedDepartment, loadDepartments, renameDepartment, reset };
});
```

- 命名：檔名用資源名，函式為 `useXxxStore`，`defineStore` 的 id 與資源名相同。
- 預設用 setup store（與 `<script setup>` 寫法一致）；專案已用 options store 就沿用。
- getter 一律用 `computed`，不在 getter 內做非同步或改狀態。
- 改狀態只透過 action；元件不直接改 store 的 state。

## 四、在元件或 Composable 中使用

```ts
const departmentStore = useDepartmentStore();
// - 狀態與 getter 用 storeToRefs 取出，才能保持響應性
const { departments, selectedDepartment } = storeToRefs(departmentStore);
// - action 直接解構即可
const { renameDepartment } = departmentStore;

async function onRename(name: string): Promise<void> {
	const result = await renameDepartment({ departmentId: selectedDepartment.value!.departmentId, name });
	if (result.success) toast.success('部門名稱已更新');
	else toast.error(result.error.message);
}
```

- 不要寫 `const { departments } = useDepartmentStore()`：直接解構 state 會失去響應性。
- toast 用專案既有的機制（例如 `useToastStore`），不另外新增。

## 五、Store 之間的依賴

- 在 action 內呼叫另一個 store（`const userStore = useUserStore()`），不要在 store 檔案頂層呼叫。
- 兩個 store 互相依賴時，把共用部分抽成第三個 store 或 composable，避免循環引用。

## 六、登出與重設

- 與使用者有關的 store 都要提供 `reset()`。
- 登出流程集中呼叫各 store 的 `reset()`，避免換帳號登入後看到上一個人的資料。

## 七、Nuxt SSR 注意事項

- 只在 `setup`、plugin 或 middleware 內呼叫 `useXxxStore()`，不要在模組頂層建立，否則不同請求會共用同一份狀態。
- state 必須可序列化：不要放 class 實例、函式、`Map`、`Set`，SSR 傳到前端時會遺失。

## 八、測試

```ts
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as departmentService from '@/services/departmentService';
import { useDepartmentStore } from './department';

describe('useDepartmentStore', () => {
	beforeEach(() => setActivePinia(createPinia()));

	it('01. 改名成功 - 應更新列表中的部門', async () => {
		vi.spyOn(departmentService, 'updateDepartment').mockResolvedValue({ success: true, data: { departmentId: 'd1', name: '新名稱' } });
		const store = useDepartmentStore();
		store.departments = [{ departmentId: 'd1', name: '舊名稱' }];
		await store.renameDepartment({ departmentId: 'd1', name: '新名稱' });
		expect(store.departments[0].name).toBe('新名稱');
	});
});
```

- 每個測試用新的 Pinia（`setActivePinia(createPinia())`），避免狀態互相影響。
- mock Service，不 mock axios。
- 元件測試需要 store 時用 `@pinia/testing` 的 `createTestingPinia`。
- 命名與 Mock 策略見 `test-frontend`。
