---
name: python-expert
description: 'Python 撰寫與審查規範：PEP 8、型別提示、錯誤處理、效能與資料結構。使用時機：撰寫、最佳化或審查 Python 程式碼。需要獨立脈絡審查整個專案時改用 python-expert agent。'
license: MIT
metadata:
  author: awesome-llm-apps
  version: "1.0.0"
---

# Python 專家

撰寫、審查或最佳化 Python 程式碼時，遵循下列慣例。專案已有不同慣例時，以專案為準。

## 開發慣例

- 所有函式簽章都加型別標註（含回傳型別），使用內建泛型（`list[str]`、`X | None`），需要時才從 `typing` 引入。
- 捕捉具體的例外型別，不使用 bare `except`，也不靜默吞掉錯誤；避免可變預設參數。
- 最佳化前先 profile；處理大量資料流時使用 generator。
- 遵循 PEP 8；公開函式與類別撰寫 Google 風格 docstring；註解只解釋不直觀的邏輯。

## 預期輸出格式

撰寫 Python 程式碼時，公開函式要有型別標註與 Google 風格 docstring；以下為示意，import 與泛型依實際需要取用：

```python
def function_name(param1: str, param2: int) -> dict[str, str] | None:
    """簡短描述此函式的目的。
    
    如果需要的話可以提供更詳細的解釋，描述其行為、
    演算法或任何重要的注意事項。
    
    Args:
        param1: 第一個參數的描述
        param2: 第二個參數的描述
        
    Returns:
        回傳值的描述，包含回傳 None 的情況
        
    Raises:
        ValueError: 當 param2 為負數時拋出
        
    Example:
        >>> function_name("test", 42)
        {'result': 'test-42'}
    """
    if param2 < 0:
        raise ValueError("param2 必須是非負數")
    
    return {'result': f'{param1}-{param2}'}
```

## 範例

**使用者指令:** "寫一個函數從列表中找出重複項"

**回應範例:**
```python
from collections import Counter
from collections.abc import Hashable
from typing import TypeVar

T = TypeVar('T', bound=Hashable)

def find_duplicates(items: list[T]) -> list[T]:
    """找出 list 中所有重複的項目。
    
    Args:
        items: 要檢查是否有重複項目的 list 字串或陣列。
        
    Returns:
        出現超過一次的項目所組成的 list，維持其首次出現的順序。
        
    Example:
        >>> find_duplicates([1, 2, 2, 3, 3, 3])
        [2, 3]
        >>> find_duplicates(['a', 'b', 'a', 'c'])
        ['a']
    """
    counts = Counter(items)
    return [item for item, count in counts.items() if count > 1]
```

**解析說明:**
- 使用 collections 套件的 `Counter` 以達到高效率
- 泛型 `TypeVar` 允許接收任何型別的 list
- 提供完整的輸入與輸出型別提示
- 詳盡的 docstring 並附上使用範例
- 具有 Python 風格的串列推導式
- 具備 O(n) 的時間複雜度
