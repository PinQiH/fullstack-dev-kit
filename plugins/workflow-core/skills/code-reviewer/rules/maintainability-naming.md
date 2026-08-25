---
title: 使用有意義的變數命名 (Use Meaningful Variable Names)
impact: MEDIUM
category: maintainability
tags: naming, readability, code-quality
---

# 使用有意義的變數命名 (Use Meaningful Variable Names)

請選擇具描述性、能表達意圖的名稱。避免使用單一字母（迴圈計數器除外）、縮寫與過於通用的名稱。

## 為什麼這很重要？

程式碼被閱讀的次數是寫的次數的 10 倍。清晰的命名可以：

- 讓程式碼自我文件化 (self-documenting)
- 減少認知負擔
- 預防因誤解而產生的 bugs
- 讓後續的重構更容易

## ❌ 錯誤示範

```python
# ❌ 神秘難解、毫無意義
def calc(x, y, z):
    tmp = x * y
    res = tmp + z
    return res

# ❌ 太過通用
data = fetch_data()
result = process(data)
output = format(result)

# ❌ 令人困惑的縮寫
usr_nm = input()
acc_bal = get_bal(usr_nm)
```

## ✅ 正確示範

```python
# 清晰且具描述性
def calculate_total_price(item_price: float, quantity: int, tax_rate: float) -> float:
    """計算包含稅金的總價。"""
    subtotal = item_price * quantity
    total_with_tax = subtotal + (subtotal * tax_rate)
    return total_with_tax

# 能表達意圖
customer_orders = fetch_customer_orders(customer_id)
validated_orders = validate_orders(customer_orders)
order_confirmation_email = format_confirmation_email(validated_orders)

# 寫出完整單字
username = input("輸入使用者名稱: ")
account_balance = get_account_balance(username)
```

## 各語言的命名慣例 (Naming Conventions by Language)

### Python (PEP 8)

```python
# 變數與函式: 蛇形命名法 (snake_case)
user_count = 10
def calculate_average(): pass

# 類別 (Classes): 帕斯卡命名法 (PascalCase)
class UserAccount: pass

# 常數 (Constants): 全大寫蛇形命名法 (UPPER_SNAKE_CASE)
MAX_RETRY_ATTEMPTS = 3
```

### JavaScript/TypeScript

```javascript
// 變數與函式: 駝峰命名法 (camelCase)
const userCount = 10;
function calculateAverage() {}

// 類別 (Classes): 帕斯卡命名法 (PascalCase)
class UserAccount {}

// 常數 (Constants): 全大寫蛇形命名法 (UPPER_SNAKE_CASE) 或 駝峰命名法 (camelCase)
const MAX_RETRY_ATTEMPTS = 3;
const maxRetryAttempts = 3; // 也可以接受
```

### 布林值 (Booleans)

```python
# 使用 is_, has_, can_ 等前綴
is_active = True
has_permission = check_permission()
can_edit = user.role == "admin"

# 不要寫成: active, permission, editable
```

## 上下文很重要 (Context Matters)

### 迴圈變數 (Loop Variables)

```python
# ❌ 在複雜迴圈中使用太通用的名稱
for i in users:
    for j in i.orders:
        process(j)

# ✅ 具描述性的名稱
for user in users:
    for order in user.orders:
        process_order(order)

# ✅ 單一字母只適用於簡單的索引
for i in range(10):
    print(i)
```

### 適合作用域的名稱 (Scope-Appropriate Names)

```python
# 作用域短小: 簡潔一點沒關係
def validate(email):
    # 'email' 在這個小函數裡已經很清楚了
    return '@' in email and '.' in email

# 作用域很長: 需要更有描述性的名稱
class UserAuthenticationService:
    def __init__(self):
        # 類別層級的屬性需要長一點、更清楚的名稱
        self.failed_login_attempts = {}
        self.account_lockout_duration_seconds = 300
```

## 避免歧義 (Avoid Ambiguity)

```python
# ❌ 有歧義
def get_data(id):
    return data[id]

# 什麼資料 (What data)？什麼 ID？

# ✅ 具體的名稱
def get_user_by_id(user_id: int) -> User:
    return users_cache[user_id]
```

## 參考資料 (References)

- [PEP 8 - Python Naming Conventions](https://peps.python.org/pep-0008/#naming-conventions)
- [Clean Code by Robert Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
