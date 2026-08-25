---
name: python-environment
description: >
  Python 開發環境與虛擬環境 (venv) 規範。包含如何安全地建立、啟動與使用 Python 虛擬環境，避免污染系統全域環境。
---

# Python 開發環境與虛擬環境 (venv) 規範

## 0. 前置確認（開始前）

- 已確認 Python 版本（例：3.10）
- 已確認專案目錄結構
- 已確認執行方式

**完成標準**：

> 我知道「用哪個 Python、在哪跑、怎麼跑」。

---

## 1. 檢查與建立虛擬環境

- 檢查專案根目錄下是否已存在虛擬環境 (`venv` 或 `.venv` 資料夾)。
- 若不存在，必須建立 venv 虛擬環境: `python -m venv venv`
- 虛擬環境目錄位置固定且不混用
- Python 版本正確

**SOP 說明**：

- 不假設環境已存在
- 建立失敗即中止 workflow，並向使用者回報。

**完成標準**：

> 有且只有一個正確的虛擬環境可用。

---

## 2. 啟動虛擬環境（Activate）

- 依作業系統使用正確啟動指令 (Windows: `.\venv\Scripts\Activate.ps1`, macOS/Linux: `source venv/bin/activate`)
- 確認 `python` / `pip` 指向虛擬環境
- 啟動失敗即中止 workflow

**SOP 說明**：

- 絕對不直接使用系統 Python
- Agent 在終端機執行指令時，都必須在虛擬環境內執行。

**完成標準**：

> 後續所有指令皆在虛擬環境內執行。

---

## 3. 相依套件檢查與安裝

- 已確認需求來源（`requirements.txt` / `pyproject.toml`）
- 在虛擬環境啟動的狀態下，使用 `pip install -r requirements.txt`。
- **⚠️ 重要提醒：後續開發過程中，如果有主動使用 `pip install <package>` 安裝或更新任何套件，必須立刻執行 `pip freeze > requirements.txt`，確保相依套件清單隨時保持最新同步。**
- 套件安裝失敗即中止 workflow。
- 無未鎖版套件（避免不穩定）。

**完成標準**：

> 程式可在此環境穩定執行。

---

## 4. 執行 Python 程式

- 使用虛擬環境內的 python 執行
- 明確指定執行檔案
- 傳入必要參數
- 設定 timeout（避免卡死）

**完成標準**：

> 程式開始正常運作。

---

## 5. 執行結果處理

- 成功完成流程
- 捕捉例外與錯誤碼
- 明確區分成功 / 失敗狀態
- 回傳執行結果

**SOP 說明**：

- 非 0 exit code 視為失敗
- 不吞錯誤

**完成標準**：

> 上下文能正確判斷執行結果。

---
