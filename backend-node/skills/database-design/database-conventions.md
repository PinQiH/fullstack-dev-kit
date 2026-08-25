# 資料庫命名規範

設計資料表、欄位或撰寫 SQL 時永遠遵守以下規則。
完整的 SQL 風格指南與 Sequelize 規範請參閱 `database-design` skill。

---

## 命名原則

- 一律使用 **snake_case**，禁止 camelCase
- 不使用描述性前綴（`tbl_`、`sp_` ❌）
- 名稱以字母開頭，不以底線結尾
- 不使用連續底線（`user__id` ❌）
- 盡量避免縮寫；需縮寫時確保意義清晰
- 長度不超過 **30 字元**

## 資料表命名

- 使用**集合名詞或複數**（`staff`、`orders`、`categories`）
- 避免將兩個表名相連當關聯表名（`cars_mechanics` ❌ → `services` ✅）
- 表名不得與其欄位名相同

## 欄位命名

- 總是使用**單數**形式
- 避免直接用 `id` 做主鍵名，改用 `<table>_id`（或配合 ORM 慣例）
- 總是小寫，除非是縮寫詞（`ip_addr`）

## 統一後綴

| 後綴 | 用途 | 範例 |
|------|------|------|
| `_id` | 主鍵或外鍵 | `user_id`、`order_id` |
| `_status` | 狀態值 | `publication_status`、`order_status` |
| `_total` | 加總值 | `amount_total` |
| `_num` | 數值 | `item_num` |
| `_name` | 名稱 | `user_name`、`product_name` |
| `_seq` | 序號/序列 | `sort_seq` |
| `_date` | 日期 | `created_date`、`expired_date` |
| `_tally` | 計數 | `view_tally` |
| `_size` | 大小 | `file_size` |
| `_addr` | 地址 | `ip_addr`、`mac_addr` |

## 日期格式

儲存日期一律使用 **ISO-8601**：`YYYY-MM-DDTHH:MM:SS.SSSSS`

## Sequelize Migration 必備欄位

每張 table 必須包含：

```js
createdAt: { type: DataTypes.DATE, allowNull: false },
updatedAt: { type: DataTypes.DATE, allowNull: false },
```

關聯表需建立**唯一索引**。軟刪除使用 `paranoid: true`。
