# 程式碼審查指南 (Code Review Guidelines)

**這是一份提供給執行 Code Review 的 AI Agent 的全面指南**，內容依據優先權及影響程度進行分類。

---

## 目錄 (Table of Contents)

### 安全性 (Security) — **極高 (CRITICAL)**
1. [預防 SQL 注入 (SQL Injection Prevention)](#sql-injection-prevention)
2. [預防跨站腳本攻擊 (XSS Prevention)](#xss-prevention)

### 效能 (Performance) — **高 (HIGH)**
3. [避免 N+1 查詢問題 (Avoid N+1 Query Problem)](#avoid-n-1-query-problem)

### 正確性 (Correctness) — **高 (HIGH)**
4. [適當的錯誤處理 (Proper Error Handling)](#proper-error-handling)

### 可維護性 (Maintainability) — **中 (MEDIUM)**
5. [使用有意義的變數命名 (Use Meaningful Variable Names)](#use-meaningful-variable-names)
6. [加入型別提示 (Add Type Hints)](#add-type-hints)

---

## 安全性 (Security)

### 預防 SQL 注入 (SQL Injection Prevention)

**影響程度: 極高 (CRITICAL)** | **類別: security** | **標籤:** sql, security, injection, database

絕對不要使用字串拼接或 f-strings 來建構 SQL 查詢。請務必使用**參數化查詢 (Parameterized queries)** 來防止 SQL 注入攻擊。

#### 為什麼這很重要？

SQL 注入是最常見且最危險的網站漏洞之一。攻擊者可以：
- 取得未經授權的資料
- 修改或刪除資料庫紀錄
- 在資料庫上執行管理員操作
- 在某些情況下，甚至能對作業系統下達指令

#### ❌ 錯誤示範

```python
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return result

# 漏洞點: 傳入 get_user("1 OR 1=1")
# 將會回傳所有使用者！
```

#### ✅ 正確示範

```python
def get_user(user_id: int) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM users WHERE id = ?"
    result = db.execute(query, (user_id,))
    return result.fetchone() if result else None
```

[➡️ 完整細節: security-sql-injection.md](rules/security-sql-injection.md)

---

### 預防跨站腳本攻擊 (XSS Prevention)

**影響程度: 極高 (CRITICAL)** | **類別: security** | **標籤:** xss, security, html, javascript

絕對不要將未經消毒 (Unsanitized) 的使用者輸入直接插入 HTML 中。請務必對輸出進行跳脫處理 (Escape)，或是使用預設就會自動跳脫的框架。

#### ❌ 錯誤示範

```javascript
// 危險！
document.getElementById('username').innerHTML = userInput;
```

#### ✅ 正確示範

```javascript
// 安全：使用 textContent
element.textContent = userInput;

// 或是如果需要允許 HTML，請進行消毒
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userHtml);
```

[➡️ 完整細節: security-xss-prevention.md](rules/security-xss-prevention.md)

---

## 效能 (Performance)

### 避免 N+1 查詢問題 (Avoid N+1 Query Problem)

**影響程度: 高 (HIGH)** | **類別: performance** | **標籤:** database, performance, orm, queries

當程式碼執行了 1 次查詢來取得列表，接著又執行了 N 次額外查詢來取得每個項目的關聯資料時，就會發生 N+1 查詢問題。

#### ❌ 錯誤示範

```python
# 為了取得 100 篇文章，竟然發出了 101 次查詢！
posts = Post.objects.all()  # 1 query
for post in posts:
    print(f"{post.title} 作者為 {post.author.name}")  # N queries
```

#### ✅ 正確示範

```python
# 透過 JOIN 只要 1 次查詢
posts = Post.objects.select_related('author').all()
for post in posts:
    print(f"{post.title} 作者為 {post.author.name}")  # 沒有額外的查詢了！
```

[➡️ 完整細節: performance-n-plus-one.md](rules/performance-n-plus-one.md)

---

## 正確性 (Correctness)

### 適當的錯誤處理 (Proper Error Handling)

**影響程度: 高 (HIGH)** | **類別: correctness** | **標籤:** errors, exceptions, reliability

一定要明確地處理錯誤。不要使用空的 `except` 區塊，也不要默默地吞掉錯誤。

#### ❌ 錯誤示範

```python
try:
    result = risky_operation()
except:
    pass  # 默默失敗！(Silent failure)
```

#### ✅ 正確示範

```python
try:
    config = json.loads(config_file.read())
except json.JSONDecodeError as e:
    logger.error(f"設定檔中包含無效的 JSON 格式: {e}")
    config = get_default_config()
except FileNotFoundError:
    logger.warning("找不到設定檔，採用預設值")
    config = get_default_config()
```

[➡️ 完整細節: correctness-error-handling.md](rules/correctness-error-handling.md)

---

## 可維護性 (Maintainability)

### 使用有意義的變數命名 (Use Meaningful Variable Names)

**影響程度: 中 (MEDIUM)** | **類別: maintainability** | **標籤:** naming, readability, code-quality

請選擇具描述性、能表達意圖的名稱。避免使用單一字母（迴圈計數器除外）、縮寫與過於通用的名稱。

#### ❌ 錯誤示範

```python
def calc(x, y, z):
    tmp = x * y
    res = tmp + z
    return res
```

#### ✅ 正確示範

```python
def calculate_total_price(item_price: float, quantity: int, tax_rate: float) -> float:
    subtotal = item_price * quantity
    total_with_tax = subtotal + (subtotal * tax_rate)
    return total_with_tax
```

[➡️ 完整細節: maintainability-naming.md](rules/maintainability-naming.md)

---

### 加入型別提示 (Add Type Hints)

**影響程度: 中 (MEDIUM)** | **類別: maintainability** | **標籤:** types, python, typescript, type-safety

使用型別標註，讓程式碼達到自我文件化 (self-documenting) 的效果，並能在早期就捕捉到錯誤。

#### ❌ 錯誤示範

```python
def get_user(id):
    return users.get(id)
```

#### ✅ 正確示範

```python
def get_user(id: int) -> Optional[Dict[str, Any]]:
    """透過 ID 取得使用者資料。"""
    return users.get(id)
```

[➡️ 完整細節: maintainability-type-hints.md](rules/maintainability-type-hints.md)

---

## 快速參考 (Quick Reference)

### 審查檢查表 (Review Checklist)

**安全性 (CRITICAL - 優先審查)**
- [ ] 無 SQL 注入漏洞
- [ ] 無 XSS 漏洞
- [ ] 機密資訊未被 hardcode 寫死在程式碼中
- [ ] 有進行驗證與授權 (Authentication/Authorization) 檢查

**效能 (HIGH)**
- [ ] 無 N+1 查詢問題
- [ ] 有適當的快取機制 (Caching)
- [ ] 無不必要的資料庫呼叫
- [ ] 演算法效率良好

**正確性 (HIGH)**
- [ ] 有適當的錯誤處理
- [ ] 有處理極端情況 (Edge cases)
- [ ] 有進行輸入驗證 (Input validation)
- [ ] 無競爭危害 (Race conditions)

**可維護性 (MEDIUM)**
- [ ] 變數與函式命名清晰
- [ ] 有提供型別提示 (Type hints)
- [ ] 程式碼符合 DRY (Don't Repeat Yourself) 原則
- [ ] 函式符合單一職責原則 (Single-purpose)

**測試 (Testing)**
- [ ] 測試有覆蓋到新增的程式碼
- [ ] 有針對極端情況進行測試
- [ ] 有測試錯誤處理的路徑

---

## 嚴重程度等級 (Severity Levels)

| 等級 (Level) | 描述 (Description) | 範例 (Examples) | 應對行動 (Action) |
|-------|-------------|----------|--------|
| **CRITICAL** | 安全性漏洞、資料遺失風險 | SQL 注入、XSS、授權繞過 | 阻擋合併 (Block merge)，需立即修復 |
| **HIGH** | 效能問題、正確性 Bugs | N+1 查詢、競爭危害 | 需在合併前修復 |
| **MEDIUM** | 可維護性、程式碼品質 | 命名、型別提示、註解 | 修復，或接受並留下 TODO |
| **LOW** | 風格偏好、微小改善 | 排版、輕微重構 | 選擇性修復 (Optional) |

---

## 審查結果輸出格式 (Review Output Format)

在進行審查時，請採用以下結構輸出結果：

```markdown
## 安全性問題 (找到 X 個)

### 極高 (CRITICAL): `get_user()` 中存在 SQL 注入風險
**檔案:** `api/users.py:45`
**問題:** 使用者輸入被直接拼接到 SQL 查詢字串中
**修復方式:** 使用參數化查詢

## 效能問題 (找到 X 個)

### 高 (HIGH): `list_posts()` 發生 N+1 查詢
**檔案:** `views/posts.py:23`
**問題:** 在迴圈中逐次查詢作者資料
**修復方式:** 加上 `.select_related('author')` 進行預載

## 總結 (Summary)
- 🔴 極高 (CRITICAL): 1
- 🟠 高 (HIGH): 1
- 🟡 中 (MEDIUM): 3
- ⚪ 低 (LOW): 2

**建議:** 合併前請務必解決 CRITICAL 與 HIGH 層級的問題。
```

---

## 參考資料 (References)

- `rules/` 目錄下的各別規則檔案
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Clean Code by Robert Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
