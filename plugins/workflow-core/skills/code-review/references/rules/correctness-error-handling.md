---
title: 適當的錯誤處理 (Proper Error Handling)
impact: HIGH
category: correctness
tags: errors, exceptions, reliability
---

# 適當的錯誤處理 (Proper Error Handling)

一定要明確地處理錯誤。不要使用空的 `except` 區塊，也不要默默地吞掉錯誤。請提供有幫助的錯誤訊息。

## 為什麼這很重要？

適當的錯誤處理可以：
- 防止潛在的默默失敗 (silent failures)
- 透過清晰的訊息幫助除錯
- 允許系統優雅地降級 (graceful degradation)
- 提升使用者體驗
- 讓錯誤監控與警報系統能正常運作

## ❌ 錯誤示範

### 空的 Except 區塊 (Bare Except Clause)
```python
# ❌ 會捕捉到所有東西，包含 KeyboardInterrupt 或是 SystemExit
try:
    result = risky_operation()
except:
    pass  # 默默失敗，根本不知道發生了什麼事
```

### 缺乏上下文的通用 Exception
```python
# ❌ 太過通用，遺失了錯誤細節
try:
    data = fetch_user(user_id)
    process(data)
    save_result()
except Exception:
    print("發生錯誤")  # 是哪個操作失敗了？為什麼失敗？
```

### 忽略特定錯誤
```python
# ❌ 完全忽略錯誤
try:
    config = json.loads(config_file.read())
except json.JSONDecodeError:
    pass  # 系統帶著未定義的 'config' 繼續執行
```

## ✅ 正確示範

### 捕捉特定的 Exceptions
```python
# ✅ 適當地處理特定的錯誤
try:
    config = json.loads(config_file.read())
except json.JSONDecodeError as e:
    logger.error(f"設定檔中包含無效的 JSON 格式: {e}")
    # 提供合理的預設值
    config = get_default_config()
except FileNotFoundError:
    logger.warning("找不到設定檔，採用預設值")
    config = get_default_config()
```

### 在錯誤訊息中提供上下文
```python
# ✅ 清晰、可採取行動的錯誤訊息
def  get_user(user_id: int) -> User:
    try:
        response = requests.get(f"{API_URL}/users/{user_id}", timeout=5)
        response.raise_for_status()
        return User(**response.json())
    except requests.Timeout:
        raise ValueError(
            f"從 {API_URL} 取得使用者 {user_id} 時發生 Timeout。"
            "請檢查網路連線或增加 timeout 時間。"
        )
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            raise UserNotFoundError(f"使用者 {user_id} 不存在")
        raise ValueError(f"取得使用者 {user_id} 時發生 HTTP 錯誤: {e}")
    except json.JSONDecodeError:
        raise ValueError(f"取得使用者 {user_id} 的 JSON 回應無效")
```

### 保留上下文重新拋出錯誤 (Re-raise with Context)
```python
# ✅ 增加上下文的同時保留原始的 stack trace
try:
    process_batch(items)
except ValidationError as e:
    # 增加上下文並拋出
    raise ValidationError(
        f"批次處理 {len(items)} 個項目時失敗: {e}"
    ) from e
```

## JavaScript/TypeScript

### ❌ 毫無針對性的捕捉
```javascript
// ❌ 完全沒有錯誤處理
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();  // 如果 fetch 失敗怎麼辦？如果不是 JSON 怎麼辦？
}

// ❌ 通用的 catch
try {
  const user = await fetchUser(id);
} catch (error) {
  console.log('Error');  // 是哪個錯誤？從哪裡拋出來的？
}
```

### ✅ 明確的錯誤處理
```typescript
// ✅ 搭配型別的適當錯誤處理
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`找不到使用者 ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

async function fetchUser(id: string): Promise<User> {
  let response: Response;
  
  try {
    response = await fetch(`/api/users/${id}`, {
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error(`取得使用者 ${id} 時發生 Timeout`);
    }
    throw new Error(`取得使用者 ${id} 時發生網路錯誤: ${error}`);
  }
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new UserNotFoundError(id);
    }
    throw new Error(`取得使用者 ${id} 時發生 HTTP ${response.status} 錯誤`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`取得使用者 ${id} 的 JSON 回應無效`);
  }
}

// 使用方式
try {
  const user = await fetchUser(userId);
  displayUser(user);
} catch (error) {
  if (error instanceof UserNotFoundError) {
    showNotFoundMessage();
  } else {
    logger.error('無法載入使用者:', error);
    showErrorMessage('無法載入使用者，請再試一次。');
  }
}
```

## 錯誤處理模式 (Error Handling Patterns)

### Result 型別 (受 Rust 啟發)
```typescript
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseConfig(json: string): Result<Config> {
  try {
    const config = JSON.parse(json);
    return { ok: true, value: config };
  } catch (error) {
    return { ok: false, error: new Error(`無效的設定檔: ${error}`) };
  }
}

// 使用方式
const result = parseConfig(configString);
if (result.ok) {
  useConfig(result.value);
} else {
  logger.error(result.error);
  useDefaultConfig();
}
```

### 自訂錯誤類別 (Custom Error Classes)
```python
class DatabaseError(Exception):
    """資料庫錯誤的基礎類別。"""
    pass

class ConnectionError(DatabaseError):
    """資料庫連線失敗。"""
    pass

class QueryError(DatabaseError):
    """查詢執行失敗。"""
    def __init__(self, query: str, original_error: Exception):
        self.query = query
        self.original_error = original_error
        super().__init__(f"查詢失敗: {query[:100]}... 錯誤: {original_error}")

# 使用方式
try:
    db.execute(query)
except psycopg2.OperationalError as e:
    raise ConnectionError(f"無法連線至資料庫: {e}") from e
except psycopg2.Error as e:
    raise QueryError(query, e) from e
```

## 記錄錯誤 (Logging Errors)

```python
import logging

logger = logging.getLogger(__name__)

try:
    result = complex_operation()
except ValueError as e:
    logger.error(
        "操作失敗",
        exc_info=True,  # 包含 stack trace
        extra={
            'user_id': user_id,
            'operation': 'complex_operation',
            'input_data': sanitized_data
        }
    )
    raise
```

## 最佳實踐 (Best Practices)

- [ ] **捕捉特定的 exceptions** (不要使用空的 `except` 或通用的 `Exception`)
- [ ] 在錯誤訊息中**提供上下文** (什麼東西失敗了、為什麼、如何修復)
- [ ] **記錄錯誤 (Log errors)** 以及相關細節
- [ ] **不要默默地忽略錯誤**
- [ ] 針對領域錯誤 (Domain errors) **使用自訂的 Exception 類別**
- [ ] 在日誌中**包含 stack traces** (但不要顯示在給使用者的訊息中)
- [ ] **在適當的層級處理錯誤** (不要太早捕捉)
- [ ] **清理資源** (使用 context managers 或 try-finally)

## 監控與警示 (Monitoring & Alerting)

```python
# 與錯誤追蹤系統整合
import sentry_sdk

try:
    process_payment(order)
except PaymentError as e:
    sentry_sdk.capture_exception(e)
    sentry_sdk.set_context("order", {
        "order_id": order.id,
        "amount": order.total,
        "user_id": order.user_id
    })
    raise
```

## 參考資料 (References)

- [Python Exception Handling Best Practices](https://docs.python.org/3/tutorial/errors.html)
- [Error Handling in JavaScript](https://javascript.info/try-catch)
- [Sentry Error Monitoring](https://sentry.io/)
