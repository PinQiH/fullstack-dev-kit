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
// @ toErrorCode 把後端的 error.code 映射成前端 ErrorCode，實作見 06-Architecture.md
import { AppError, ErrorCode, toErrorCode } from '@/types/errors';

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
      // @ response.data 是後端信封 { success, data, meta, error }，
      //   要的 DTO 在信封的 data 裡，別把整個信封餵給 Mapper
      const user = UserMapper.toDomain(response.data.data);
      
      // 回報成功路徑
      return ok(user);
    } catch (error: any) {
      // 發生錯誤：將 axios 的例外攔截，轉換為整潔的 AppError
      // @ 業務錯誤由後端以真實 4xx 回報，因此一律在此處理，不需檢查成功旗標
      const apiError = error.response?.data?.error;

      return fail(new AppError(
        apiError?.message || '資料獲取失敗',
        // !! 這裡要放 ErrorCode，不是 HTTP 狀態碼。
        //    有信封就依 error.code 映射；完全收不到信封代表連線層出問題
        apiError ? toErrorCode(apiError.code) : ErrorCode.NETWORK_ERROR
      ));
    }
  }
}
