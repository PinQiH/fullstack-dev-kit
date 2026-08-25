# Python 專家規範 (Python Expert Guidelines)

**一份給 AI Agent 撰寫與審核 Python 程式碼的綜合指南**，按重要性與影響力排序。

---

## 目錄 (Table of Contents)

### 正確性 (Correctness) — **極高 (CRITICAL)**

1. [避免使用可變的預設參數 (Avoid Mutable Default Arguments)](#avoid-mutable-default-arguments)
2. [適當的錯誤處理 (Proper Error Handling)](#proper-error-handling)

### 型別安全 (Type Safety) — **高 (HIGH)**

3. [使用型別提示 (Use Type Hints)](#use-type-hints)
4. [使用資料類別 (Use Dataclasses)](#use-dataclasses)

### 效能 (Performance) — **高 (HIGH)**

5. [使用串列推導式 (Use List Comprehensions)](#use-list-comprehensions)
6. [使用上下文管理器 (Use Context Managers)](#use-context-managers)

### 風格 (Style) — **中 (MEDIUM)**

7. [遵循 PEP 8 風格指南 (Follow PEP 8 Style Guide)](#follow-pep-8-style-guide)
8. [撰寫文件字串 (Write Docstrings)](#write-docstrings)

---

## 正確性 (Correctness)

### 避免使用可變的預設參數 (Avoid Mutable Default Arguments)

**影響: 極高 (CRITICAL)** | **類別: correctness** | **標籤:** bugs, defaults, mutable, gotcha

可變的預設參數 (例如 list 或是 dict) 會在所有呼叫該函式的地方被共用。

#### 為什麼這很重要 (Why This Matters)

因為預設值只會在「函式定義時」被評估一次，後續的呼叫將會保留對該預設物件所做的修改，這會導致極度難以察覺且令人沮喪的 bug。

#### ❌ 錯誤示範 (Incorrect)

```python
def add_item(item, items=[]):  # BUG: [] 被共用了！
    items.append(item)
    return items

print(add_item("a"))  # ['a']
print(add_item("b"))  # ['a', 'b'] - 出乎意料！
```

#### ✅ 正確示範 (Correct)

```python
def add_item(item: str, items: list[str] | None = None) -> list[str]:
    """將項目新增至 list 中，若未提供則建立新的 list。
  
    Args:
        item: 要新增的項目
        items: 選擇性傳入的現有 list
      
    Returns:
        包含新增項目的 list
    """
    if items is None:
        items = []
    items.append(item)
    return items
```

[➡️ 完整詳細內容: correctness-mutable-defaults.md](rules/correctness-mutable-defaults.md)

---

### 適當的錯誤處理 (Proper Error Handling)

**影響: 極高 (CRITICAL)** | **類別: correctness** | **標籤:** errors, exceptions, reliability

永遠要明確地處理錯誤。不要使用光禿禿的 (bare) except 子句，或是安靜地忽略錯誤。

#### ❌ 錯誤示範 (Incorrect)

```python
try:
    result = risky_operation()
except:
    pass  # 安靜地失敗！
```

#### ✅ 正確示範 (Correct)

```python
try:
    config = json.loads(config_file.read())
except json.JSONDecodeError as e:
    logger.error(f"設定檔中的 JSON 格式無效: {e}")
    config = get_default_config()
except FileNotFoundError:
    logger.warning("找不到設定檔，使用預設設定")
    config = get_default_config()
```

[➡️ 完整詳細內容: correctness-error-handling.md](rules/correctness-error-handling.md)

---

## 型別安全 (Type Safety)

### 使用型別提示 (Use Type Hints)

**影響: 高 (HIGH)** | **類別: type-safety** | **標籤:** types, mypy, annotations, documentation

型別提示 (Type hints) 支援靜態分析、改善 IDE 支援度，並且本身就可以當作程式碼的說明文件。

#### 為什麼這很重要 (Why This Matters)

Python 的動態轉型本質可能會導致難以捕捉的執行時期錯誤。型別提示允許像是 `mypy` 這樣的工具在執行前驗證程式碼的正確性。

#### ❌ 錯誤示範 (Incorrect)

```python
def get_user(id):
    return users.get(id)
```

#### ✅ 正確示範 (Correct)

```python
from typing import Optional, Dict, Any

def get_user(user_id: int) -> Optional[Dict[str, Any]]:
    """透過 ID 獲取使用者。
  
    Args:
        user_id: 使用者的唯一識別碼
      
    Returns:
        如果找到則回傳使用者的字典物件 (dictionary)，否則回傳 None
    """
    return users.get(user_id)
```

[➡️ 完整詳細內容: type-hints.md](rules/type-hints.md)

---

### 使用資料類別 (Use Dataclasses)

**影響: 高 (HIGH)** | **類別: type-safety** | **標籤:** dataclasses, classes, data, boilerplate

針對主要用於儲存資料的類別，使用 `@dataclass` 裝飾器。

#### 為什麼這很重要 (Why This Matters)

Dataclasses 會自動產生 `__init__`、`__repr__` 與 `__eq__` 等方法，減少了樣板程式碼 (boilerplate) 並確保資料儲存容器擁有一致的行為。

#### ❌ 錯誤示範 (Incorrect)

```python
class User:
    def __init__(self, id, name, email):
        self.id = id
        self.name = name
        self.email = email
  
    def __repr__(self):
        return f"User(id={self.id}, name={self.name}, email={self.email})"
  
    def __eq__(self, other):
        return self.id == other.id and self.name == other.name
```

#### ✅ 正確示範 (Correct)

```python
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str

# 額外加上配置
@dataclass(frozen=True)  # 不可變 (Immutable)
class Config:
    api_key: str
    timeout: int = 30
```

[➡️ 完整詳細內容: type-dataclasses.md](rules/type-dataclasses.md)

---

## 效能 (Performance)

### 使用串列推導式 (Use List Comprehensions)

**影響: 高 (HIGH)** | **類別: performance** | **標籤:** comprehensions, pythonic, efficiency

對於簡單的轉換與過濾，請使用串列推導式 (List comprehensions)。

#### 為什麼這很重要 (Why This Matters)

對有經驗的 Python 開發者來說，串列推導式更加簡潔、易讀，因為它受到 CPython 直譯器的最佳化，通常比原本同等意義的 `for` 迴圈跑得還要快。

#### ❌ 錯誤示範 (Incorrect)

```python
squares = []
for x in range(10):
    squares.append(x ** 2)

# 使用迴圈過濾
evens = []
for x in range(20):
    if x % 2 == 0:
        evens.append(x)
```

#### ✅ 正確示範 (Correct)

```python
# 簡單的轉換
squares = [x ** 2 for x in range(10)]

# 加上過濾
evens = [x for x in range(20) if x % 2 == 0]

# 巢狀 (謹慎使用 - 太複雜的話還是拆成函式)
matrix = [[i * j for j in range(3)] for i in range(3)]
```

[➡️ 完整詳細內容: performance-comprehensions.md](rules/performance-comprehensions.md)

---

### 使用上下文管理器 (Use Context Managers)

**影響: 高 (HIGH)** | **類別: performance** | **標籤:** context-managers, with, resources, cleanup

處理資源清理時，永遠要使用上下文管理器 (使用 `with` 語句)。

#### 為什麼這很重要 (Why This Matters)

手動清理容易出錯。如果在呼叫 `close()` 前發生異常，該資源 (例如檔案控制代碼 handle、資料庫連線、lock) 可能會保持開啟狀態，導致記憶體洩漏與系統不穩定。

#### ❌ 錯誤示範 (Incorrect)

```python
f = open('file.txt')
data = f.read()
f.close()  # 如果發生例外錯誤，這一行永遠不會被呼叫！
```

#### ✅ 正確示範 (Correct)

```python
with open('file.txt') as f:
    data = f.read()
# 檔案會自動被關閉，就算發生例外狀況也一樣

# 開啟多個資源
with open('input.txt') as infile, open('output.txt', 'w') as outfile:
    outfile.write(infile.read().upper())
```

[➡️ 完整詳細內容: performance-context-managers.md](rules/performance-context-managers.md)

---

## 風格 (Style)

### 遵循 PEP 8 風格指南 (Follow PEP 8 Style Guide)

**影響: 中 (MEDIUM)** | **類別: style** | **標籤:** pep8, python, style, conventions

Python 官方的風格指南能確保產出易讀、一致的程式碼。

#### 為什麼這很重要 (Why This Matters)

可讀性是 Python 哲學的核心。一致的命名規範與排版，能讓整個專案變得可以維持，並降低開發團隊當中的溝通摩擦力。

#### ❌ 錯誤示範 (Incorrect)

```python
def CalculateTotal(itemPrice,qty):
  return itemPrice*qty

class user_account:
  pass

x=1+2
```

#### ✅ 正確示範 (Correct)

```python
def calculate_total(item_price: float, quantity: int) -> float:
    """計算項目的總價格"""
    return item_price * quantity


class UserAccount:
    """系統中的使用者帳號"""
    pass


x = 1 + 2
```


### 撰寫文件字串 (Write Docstrings)

**影響: 中 (MEDIUM)** | **類別: style** | **標籤:** documentation, docstrings, google-style

為所有公開的函式、類別與模組撰寫詳細的 docstrings (文件字串)。

#### 為什麼這很重要 (Why This Matters)

好的文件能讓程式碼做到「自我解釋」，並使 IDE 能夠給出更好的自動補全輔助與懸停提示訊息。這同時也是 API 使用者最重要的第一手參考資料。

#### ❌ 錯誤示範 (Incorrect)

```python
def process(data, config):
    # 處理資料
    return result
```

#### ✅ 正確示範 (Correct)

```python
def process_user_data(
    data: Dict[str, Any], 
    config: ProcessConfig
) -> ProcessResult:
    """根據提供的組態設定來處理使用者資料。
  
    接收原始的使用者資料，基於設定中的規範進行轉換、
    驗證與豐富化 (enrichment)。
  
    Args:
        data: 原始的使用者字典資料 (dict)，至少必須包含
            'user_id' 與 'email' 鍵值。
        config: 處理過程中的組態設定，用以指定要套用的轉換邏輯
            以及驗證規則。
          
    Returns:
        ProcessResult，包含轉換後的資料以及任何碰到的驗證警告訊息。
      
    Raises:
        ValidationError: 若 data 缺少必要的欄位。
        ConfigError: 若 config 包含無效的轉換規則。
      
    Example:
        >>> config = ProcessConfig(normalize_email=True)
        >>> result = process_user_data({'user_id': 1, 'email': 'TEST@Example.com'}, config)
        >>> result.data['email']
        'test@example.com'
    """
    ...
```


## 快速參考 (Quick Reference)

### Python 程式碼檢查清單 (Python Code Checklist)

**正確性 (CRITICAL - 優先處理)**

- [ ] 沒有使用可變的預設參數
- [ ] 使用特定的異常處理機制 (沒有光禿禿的 `except:`)
- [ ] 已處理邊界、極端情況
- [ ] 已實作輸入驗證

**型別安全 (HIGH)**

- [ ] 為所有函式加上型別提示 (Type hints)
- [ ] 已標註回傳的型別
- [ ] 資料儲存容器有套用 Dataclasses
- [ ] 適當地使用了泛型型別 (Generic types)

**效能 (HIGH)**

- [ ] 在保證可讀性的前提下，優先使用串列推導式 (List comprehensions) 而非迴圈
- [ ] 所有相關資源皆使用 Context managers 包覆
- [ ] 處理巨量資料時使用 Generators (產生器)
- [ ] 善用內建函式

**風格 (MEDIUM)**

- [ ] 符合 PEP 8
- [ ] 公開函式有撰寫 Docstrings
- [ ] 有意義且命確的變數命名
- [ ] 每行限制在 88-100 個字元

---

## 嚴重級別 (Severity Levels)

| 級別 (Level)       | 敘述 (Description)       | 範例 (Examples)         | 處置方式 (Action)          |
| ------------------ | ------------------------ | ----------------------- | -------------------------- |
| **CRITICAL** | Bugs，資料損壞，資安問題 | 可變預設值、bare except | 立刻修復                   |
| **HIGH**     | 正確性風險，可維護性問題 | 缺少型別提示、資源洩漏  | 在 Merge 前修復            |
| **MEDIUM**   | 程式碼品質，可讀性       | 違反寫作風格、缺少文件  | 修復，或標記 TODO 來接受它 |
| **LOW**      | 次要的改善事項，個人偏好 | 次要的程式碼排版        | 自由選用 (Optional)        |

---

## Code Review 輸出格式 (Code Review Output Format)

當你在審閱 Python 程式碼時，請按照下方結構輸出結果：

```markdown
## 總結 (Summary)
[簡短概述該份程式碼以及發現的主要問題]

## 嚴重的問題 (Critical Issues) 🔴

### 1. [問題標題]
**檔案:** `path/to/file.py:line`
**問題:** [描述發生了什麼問題]
**影響:** [為什麼它很重要]
**修復建議 (Fix):**
```python
# 修正後的程式碼
```

## 高優先級 (High Priority) 🟠

### 1. [問題標題]

[繼續上述的排版模式...]

## 中優先級 (Medium Priority) 🟡

[繼續上述的排版模式...]

## 改善建議 (Recommendations)

- [一般性的程式碼改善建議]
- [建議採用的最佳實踐]

## 總結統計 (Summary)

- 🔴 CRITICAL: X 個
- 🟠 HIGH: X 個
- 🟡 MEDIUM: X 個

**決策結論 (Recommendation):** [整體的評價與你的下一步指示]

```

---

## 參考文獻 (References)

- 在 `rules/` 目錄底下的各別規則文件
- [PEP 8 - Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [PEP 257 - Docstring Conventions](https://peps.python.org/pep-0257/)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)
- [Python typing 模組官方文件](https://docs.python.org/3/library/typing.html)
```
