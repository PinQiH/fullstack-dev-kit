---
title: 表單可用性規範
category: UX
version: 2025-12
---

# 表單可用性規範

## 標籤（Label）規範

```vue
<!-- ✅ 正確：獨立 label，使用 for 綁定 -->
<label for="email">電子郵件 <span class="required">*</span></label>
<input id="email" type="email" v-model="form.email" />

<!-- ❌ 禁止：用 placeholder 替代 label -->
<input type="email" placeholder="電子郵件（必填）" v-model="form.email" />
```

**原因**：placeholder 在輸入後消失，用戶無法確認欄位用途。

---

## 驗證時機規範

| 時機 | 適用場景 | 禁用場景 |
|------|---------|---------|
| `onBlur`（失焦後） | 單一欄位格式驗證（email、手機） | 不適用 |
| `onSubmit`（送出時） | 整體表單必填檢查 | 不適用 |
| `onKeyDown`（輸入中） | ❌ 禁止用於錯誤顯示（可用於字數計數） | 避免逐字報錯 |

```vue
<!-- ✅ onBlur 驗證 -->
<input
  v-model="form.email"
  @blur="validateEmail"
/>
<span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
```

---

## 錯誤訊息撰寫規範

**公式**：`[發生什麼] + [如何修正]`

| ❌ 不好 | ✅ 好 |
|--------|------|
| 格式錯誤 | 請輸入有效的電子郵件地址（例如：name@example.com） |
| 必填 | 請輸入手機號碼 |
| 超出限制 | 標題最多 50 個字元，目前已輸入 63 個字元 |
| 發生錯誤 | 此帳號已被使用，請嘗試其他電子郵件或直接登入 |

---

## 送出按鈕規範

```vue
<button
  type="submit"
  :disabled="isSubmitting || !isFormValid"
  @click="handleSubmit"
>
  <span v-if="isSubmitting">
    <Spinner size="sm" /> 送出中...
  </span>
  <span v-else>送出</span>
</button>
```

規則：
- 送出中必須 disabled（防止重複送出）
- 必須有視覺回饋（Spinner / 文字變更）
- 送出成功後導向或顯示成功訊息

---

## 多步驟表單規範

- 步驟指示器（Step Indicator）必須顯示：當前步驟 / 總步驟數
- 每一步驟必須能「返回上一步」且保留已填資料
- 最後一步送出前，提供「預覽確認」或摘要頁
