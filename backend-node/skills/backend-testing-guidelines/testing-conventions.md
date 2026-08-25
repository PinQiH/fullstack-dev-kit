# 測試撰寫規範

撰寫或審查測試程式碼時永遠遵守以下規則。
完整的測試策略、分層說明與 Mock 技巧請參閱 `backend-testing-guidelines` skill。

---

## 測試命名

測試案例名稱一律遵守格式：`序號. HTTP方法 路徑 - 行為描述`

```javascript
// ✅
it("01. POST /courses - 建立課程成功")
it("02. POST /courses - 缺少必要參數，回傳驗證錯誤")
it("03. POST /courses - 使用者無權限，回傳 403")

// ❌
it("test create course")
it("should work")
```

## 測試生命週期

- Service 單元測試：`beforeEach` 中**必須**呼叫 `jest.clearAllMocks()` 或 `jest.resetAllMocks()`
- DB 整合測試：`afterAll` 中**必須**清空測試資料並呼叫 `close()` 關閉連線

```javascript
beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(async () => {
  await TestModel.destroy({ where: {}, force: true })
  await db.close()
})
```

## 嚴格禁止事項

- ❌ 為了讓測試通過而修改 Production Code
- ❌ 直接呼叫 Controller 函式（整合測試必須透過 supertest 發送 HTTP 請求）
- ❌ 斷言內部變數或實作細節（只驗證對外可觀察結果）
- ❌ 一個 `it` 裡塞多種不同邏輯（每個 `it` 只做一件事）
- ❌ 測試結束後留下髒資料給下一個測試

## Mock 邊界原則

Service 單元測試**必須** Mock Repository 層，不可直接操作真實 DB：

```javascript
// ✅ Mock 邊界依賴
jest.spyOn(userRepository, 'findUser').mockResolvedValue(mockUser)

// ❌ 反模式：Mock 被測物件的內部私有方法
jest.spyOn(userService, '_validateInternal').mockReturnValue(true)
```

## 斷言規範

整合測試成功案例**至少**驗證三項：

```javascript
expect(res.status).toBe(200)
expect(res.body.rtnCode).toBe("0000")
expect(res.body.data).toHaveProperty("id")
```

## 完成標準

- 核心 Service 分支覆蓋率 ≥ 80%
- 所有測試可獨立執行（不依賴執行順序）
- 僅讀 `describe` / `it` 敘述即可理解 API 的完整預期行為
