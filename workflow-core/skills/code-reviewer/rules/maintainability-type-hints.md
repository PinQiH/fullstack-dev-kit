---
title: 加入型別提示 (Add Type Hints)
impact: MEDIUM
category: maintainability
tags: types, python, typescript, type-safety
---

# 加入型別提示 (Add Type Hints)

使用型別標註，讓程式碼達到自我文件化 (self-documenting) 的效果，並能在早期就捕捉到錯誤。

## 為什麼這很重要？

型別提示提供：
- **靜態分析 (Static analysis)** - 在執行期前就捕捉到 bugs
- **更好的 IDE 支援** - 自動補全、重構
- **文件化 (Documentation)** - 型別本身就是在解釋意圖
- **信心度 (Confidence)** - 讓重構更容易

## ❌ 錯誤示範

```python
# ❌ 沒有型別提示
def get_user(id):
    return users.get(id)

def process_order(order, discount):
    if discount:
        return order['total'] * (1 - discount)
    return order['total']
```

## ✅ 正確示範

```python
# ✅ 完整的型別提示
from typing import Optional, Dict, Any

def get_user(id: int) -> Optional[Dict[str, Any]]:
    """透過 ID 取得使用者資料。
    
    Args:
        id: 使用者 ID
        
    Returns:
        使用者的字典物件，若找不到則回傳 None
    """
    return users.get(id)

def process_order(order: Dict[str, Any], discount: Optional[float] = None) -> float:
    """計算含有可選折扣的訂單總價。
    
    Args:
        order: 包含 'total' 鍵的訂單字典
        discount: 折扣率 (0.0-1.0)，例如 0.1 代表 九折 (10% off)
        
    Returns:
        折扣後的最終價格
    """
    if discount:
        return order['total'] * (1 - discount)
    return order['total']
```

## TypeScript

```typescript
// ✅ 明確的型別
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User | null {
  return users.get(id) ?? null;
}

function processOrder(
  order: { total: number },
  discount?: number
): number {
  if (discount) {
    return order.total * (1 - discount);
  }
  return order.total;
}
```

## 參考資料 (References)

- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
