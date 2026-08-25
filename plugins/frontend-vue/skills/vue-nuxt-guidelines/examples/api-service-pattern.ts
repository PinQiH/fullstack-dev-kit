/**
 * examples/api-service-pattern.ts
 *
 * 展現 Service 層的標準結構：
 * 1. 雙重型別設計 (DTO vs Domain Model)
 * 2. Mapper 防腐層
 * 3. 使用 Result 物件處理 API 錯誤 (取代 throw 拋錯)
 */

import { client } from '@/plugins/axios'; // 假設是設定過 Interceptor 的 Axios
import { type Result, ok, fail } from '@/types/result';
import { AppError, ErrorCode } from '@/types/errors';

// ============================================
// 1. 型別定義 (DTO 與 Domain 分離)
// ============================================
export interface UserDTO {
  user_id: string;
  f_name: string;
  role_bitmask: number; // 0: Guest, 1: Admin
}

export enum UserRole {
  Guest = 'Guest',
  Admin = 'Admin',
}

export interface User {
  id: string;
  fullName: string;
  role: UserRole;
}

// ============================================
// 2. Mapper 防腐層
// ============================================
export class UserMapper {
  static toDomain(dto: UserDTO): User {
    // 防呆處理、欄位清洗
    return {
      id: String(dto.user_id),
      fullName: (dto.f_name || '').trim(),
      role: dto.role_bitmask === 1 ? UserRole.Admin : UserRole.Guest,
    };
  }
}

// ============================================
// 3. Service 業務邏輯封裝
// ============================================
export class UserService {
  /**
   * 根據 ID 獲取使用者資料
   * 
   * @param {string} id - 使用者身份 ID
   * @returns {Promise<Result<User, AppError>>} 必定返回 Result 以約束後續處理
   */
  static async getProfile(id: string): Promise<Result<User, AppError>> {
    try {
      // 呼叫 Axios
      // skipGlobalErrorHandler 設定為 true：代表這個 API 的失敗不會由 Axios 自動秀 Toast
      const response = await client.get<UserDTO>(`/users/${id}`, {
        skipGlobalErrorHandler: true, 
      });
      
      // 轉換防腐
      const user = UserMapper.toDomain(response.data);
      
      // 回報成功路徑
      return ok(user);
    } catch (error: any) {
      // 發生錯誤：將 axios 的例外攔截，轉換為整潔的 AppError
      return fail(new AppError(
        error.response?.data?.message || '資料獲取失敗',
        error.response?.status || ErrorCode.NETWORK_ERROR
      ));
    }
  }
}
