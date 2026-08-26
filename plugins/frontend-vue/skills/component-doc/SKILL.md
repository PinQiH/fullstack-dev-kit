---
name: component-doc
description: '為 Vue 元件或 Composable 撰寫可交接文件，涵蓋用途、Props、Emits、Slots、三態、無障礙、使用範例與相依風險。'
---

# 前端元件文件

撰寫 Vue 元件 / Composable 文件 SOP / Checklist，對應 `api-doc` 的前端版本。
不一定要產出實體檔案，可直接在回應中提供內容；只有使用者要求時才建立文件。

搭配 `vue-nuxt-guidelines` 與 `ux-heuristics` skill 使用。

## 0. 前置確認

- 已確認元件 / composable 名稱與用途
- 已確認是新建或修改
- 已確認主要使用者（哪些頁面 / 父元件會用到）

**完成標準**：我知道這個元件「誰在用、用在哪」。

---

## 1. 用途（What）

- 已用一句話說明元件負責什麼
- 未描述內部實作細節
- 非前端也能理解

---

## 2. Props（Input）

- 已列出所有 props、型別、是否必填、預設值
- 已說明每個 prop 的含意與限制
- 型別以 TypeScript interface 定義（禁止 any）

| Prop | 型別 | 必填 | 預設 | 說明 |
| ---- | ---- | ---- | ---- | ---- |

---

## 3. Emits / 事件（Output）

- 已列出所有 emit 事件名稱與 payload 型別
- 已說明各事件的觸發時機

---

## 4. Slots（若有）

- 已列出具名 slot 與 slot props
- 已說明各 slot 的用途

---

## 5. 三態行為（UX）

- Loading：資料載入中呈現什麼
- Error：失敗時呈現什麼、是否可重試
- Empty：無資料時呈現什麼
- 對照 `ux-heuristics` 的三態規範確認皆有覆蓋

---

## 6. 無障礙（A11y）

- 互動元素具可讀文字或 aria-label
- 鍵盤導航與 focus 行為正確
- 不只靠顏色傳遞資訊

---

## 7. 使用範例（Usage）

- 已提供最小可用的父元件呼叫範例
- 範例與實際 props / emit 一致

---

## 8. 注意事項（Notes）

- 已標註高風險相依（全域 store、外部 API）
- 已說明效能考量（大量渲染、v-for key）
- 已標註版本相容性或待辦
