# 專案分析腳本

三支腳本都只用 Python 標準函式庫，參數第一個是專案目錄。路徑以本 skill 目錄為準；
在 Claude Code 中可寫成 `${CLAUDE_PLUGIN_ROOT}/skills/senior-architect/scripts/<腳本>`。
每支腳本都支援 `--help`。

## architecture_diagram_generator.py：產生架構圖

依目錄結構產生架構圖。

| 參數 | 值 | 預設 |
| --- | --- | --- |
| `--format`, `-f` | `mermaid`、`plantuml`、`ascii` | `mermaid` |
| `--type`, `-t` | `component`（模組關係）、`layer`（分層）、`deployment`（部署） | `component` |
| `--output`, `-o` | 輸出檔案路徑 | 印在終端機 |
| `--json` | 輸出原始掃描結果 | — |

```bash
python scripts/architecture_diagram_generator.py ./project --format mermaid --type component
python scripts/architecture_diagram_generator.py ./project --format plantuml --type layer -o architecture.md
```

## dependency_analyzer.py：分析相依與耦合

讀取 `package.json`、`requirements.txt`、`pyproject.toml`、`go.mod` 或 `Cargo.toml`，
列出直接相依、模組之間的循環相依與耦合分數（0～100，越低越好）。
不檢查套件是否過期或有已知漏洞。

| 參數 | 值 | 預設 |
| --- | --- | --- |
| `--output`, `-o` | `human`、`json` | `human` |
| `--check` | `all`、`circular`、`coupling` | `all` |
| `--verbose`, `-v` | 附上改善建議 | — |
| `--save`, `-s` | 存成檔案 | — |

```bash
python scripts/dependency_analyzer.py ./project --check circular
python scripts/dependency_analyzer.py ./project --output json
```

## project_architect.py：評估現有架構

偵測架構模式（MVC、分層、六角形、微服務）、過大的檔案、混雜的職責與分層違規。

| 參數 | 值 | 預設 |
| --- | --- | --- |
| `--output`, `-o` | `human`、`json` | `human` |
| `--check` | `all`、`pattern`、`layers`、`code` | `all` |
| `--verbose`, `-v` | 附上重構建議 | — |
| `--save`, `-s` | 存成檔案 | — |

```bash
python scripts/project_architect.py ./project --verbose
python scripts/project_architect.py ./project --check layers
```

## 使用注意

- 腳本的判斷依據是目錄與檔名，結果只是起點，結論要再讀程式碼確認。
- 分數與偵測到的模式不要直接當成結論回報，要說明依據。
