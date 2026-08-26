---
title: 預防 SQL 注入 (SQL Injection Prevention)
impact: CRITICAL
category: security
tags: sql, security, injection, database
---

# 預防 SQL 注入 (SQL Injection Prevention)

絕對不要使用字串拼接或 f-strings 來建構 SQL 查詢。請務必使用參數化查詢 (Parameterized queries) 來防止 SQL 注入攻擊。

## 為什麼這很重要？

SQL 注入是最常見且最危險的網站漏洞之一。攻擊者可以：
- 取得未經授權的資料
- 修改或刪除資料庫紀錄
- 在資料庫上執行管理員操作
- 在某些情況下，甚至能對作業系統下達指令

## ❌ 錯誤示範

**問題:** 將使用者輸入直接拼接進入 SQL 查詢字串中。

```python
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return result

# 漏洞點: 傳入 get_user("1 OR 1=1")
# 將會執行: SELECT * FROM users WHERE id = 1 OR 1=1
# 回傳所有使用者資料！
```

**危險的原因:**
- 攻擊者可以注入任意的 SQL 語句
- 可以繞過身分驗證
- 可以把整個資料庫載走
- 簡單的使用者輸入成了程式碼執行漏洞

## ✅ 正確示範

**解法:** 使用參數化查詢 (Prepared statements)。

```python
def get_user(user_id: int) -> Optional[Dict[str, Any]]:
    """安全地透過 ID 取得使用者資料。
    
    Args:
        user_id: 欲查詢的使用者 ID
        
    Returns:
        使用者紀錄字典，若找不到則回傳 None
    """
    query = "SELECT * FROM users WHERE id = ?"
    result = db.execute(query, (user_id,))
    return result.fetchone() if result else None

# 安全: user_id 被當作資料處理，而不是指令
# 即使輸入惡意指令也是無害的
```

**安全的原因:**
- 參數會被自動跳脫處理 (escaped)
- 輸入只會被視為純資料，絕不當作程式碼執行
- 資料庫驅動程式 (Database driver) 會負責消毒
- 無法注入 SQL 語法

## 針對各框架的解法 (Framework-Specific Solutions)

### SQLAlchemy (Python)
```python
from sqlalchemy import select, text

# ✅ 使用 ORM
user = session.query(User).filter(User.id == user_id).first()

# ✅ 搭配參數使用 Core
query = select(users).where(users.c.id == user_id)

# ✅ 對 text 使用綁定參數
query = text("SELECT * FROM users WHERE id = :id")
result = session.execute(query, {"id": user_id})
```

### Django (Python)
```python
# ✅ 使用 ORM
User.objects.get(id=user_id)

# ✅ 原生 SQL 搭參數
User.objects.raw("SELECT * FROM users WHERE id = %s", [user_id])
```

### Node.js (PostgreSQL)
```javascript
// ✅ 參數化查詢
const result = await client.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### Node.js (MySQL)
```javascript
// ✅ 使用佔位符
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
```

## 額外的最佳實踐 (Additional Best Practices)

1. **驗證輸入型別 (Validate input types)**
   ```python
   def get_user(user_id: int) -> Optional[User]:
       if not isinstance(user_id, int):
           raise ValueError("user_id 必須為整數")
       # ... 執行查詢
   ```

2. **盡可能使用 ORM (Use ORMs when possible)**
   - ORMs 會自動處理參數化
   - 降低手寫 SQL 出錯的風險
   - 提供抽象層以及型別安全

3. **最小權限原則 (Principle of least privilege)**
   - 應用程式連接資料庫的使用者，應該被賦予最少的權限
   - 針對 SELECT 操作建立可讀帳號
   - 限制住即使注入攻擊成功，能造成的損害程度

4. **輸入驗證作為縱深防禦 (Input validation as defense-in-depth)**
   - 參數化查詢是首要防線
   - 輸入資料驗證提供額外的安全層級
   - 白名單設定允許的字元與格式防護

## 參考資料 (References)

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [SQLAlchemy SQL Injection Prevention](https://docs.sqlalchemy.org/en/14/core/tutorial.html#using-textual-sql)
