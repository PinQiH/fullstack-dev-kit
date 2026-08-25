/**
 * examples/composable-pattern.ts
 *
 * 介紹如何設計一個以 Result Pattern 為基礎的異步 State 管理器
 * 並展示一般 Composable 的消費與擴展方式
 */

import { ref } from 'vue';
import { UserService } from '@/services/UserService';
import type { User } from '@/types/domain/User';
import type { AppError } from '@/types/errors';
import type { Result } from '@/types/result';

// ============================================
// 1. 通用型 useAsyncState 封裝
// ============================================
export function useAsyncState<T, E = AppError>(
  asyncFn: (...args: any[]) => Promise<Result<T, E>>, 
  initialData: T | null = null, 
  options: any = {}
) {
  const data = ref<T | null>(initialData);
  const error = ref<E | null>(null);
  const isLoading = ref(options.initialLoading ?? false);

  const execute = async (...args: any[]) => {
    if (options.resetErrorOnExecute ?? true) {
      error.value = null;
    }
    isLoading.value = true;

    // 取得結果不會觸發 Promise Rejection
    const result = await asyncFn(...args);

    if (result.success) {
      data.value = result.data;
      isLoading.value = false;
      return true;
    } else {
      error.value = result.error;
      isLoading.value = false;
      return false;
    }
  };

  return { data, error, isLoading, execute };
}

// ============================================
// 2. 業務端 Composable 消費範例
// ============================================
export function useUserProfile() {
  const user = ref<User | null>(null);
  const error = ref<AppError | null>(null);
  const isLoading = ref(false);

  const fetchUser = async (id: string) => {
    isLoading.value = true;

    // 由於 Service 回傳 Result，這裡絕對不需要寫 try-catch
    const result = await UserService.getProfile(id);
    
    if (result.success) {
      // 成功路徑
      user.value = result.data; 
    } else {
      // 特定錯誤處理
      error.value = result.error;
      if (result.error.code === 'NOT_FOUND' || result.error.code === 404) {
        // router.push('/404');
        console.warn('使用者不存在');
      }
    }
    
    isLoading.value = false;
  };

  return { user, error, isLoading, fetchUser };
}
