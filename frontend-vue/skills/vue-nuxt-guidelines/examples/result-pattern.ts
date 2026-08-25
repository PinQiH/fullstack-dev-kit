/**
 * examples/result-pattern.ts
 *
 * 實作 Result Pattern 的標準範本。
 * 將錯誤視為值 (Values)，強制開發者處理成功與失敗的流程。
 */

export type Success<T> = {
  readonly success: true;
  readonly data: T;
};

export type Failure<E = Error> = {
  readonly success: false;
  readonly error: E;
};

/**
 * Result 型別：操作結果可能會是 Success 或 Failure。
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

// Helper 函式
export const ok = <T>(data: T): Success<T> => ({ success: true, data });
export const fail = <E>(error: E): Failure<E> => ({ success: false, error });

/**
 * 業務標準錯誤代碼
 */
export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * 專案自定義的標準錯誤類別
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public code: ErrorCode | number | string = ErrorCode.UNKNOWN,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
