---
name: senior-architect
description: '系統架構設計與技術選型：評估單體或微服務、選資料庫與架構模式、規劃擴展性、撰寫 ADR、產生 Mermaid／PlantUML 架構圖、分析模組相依與分層。使用時機：design system architecture、monolith vs microservices、choose a database、architecture diagram、ADR。不用於一般非技術的選擇（改用 decision-helper）與單一 PR 的程式碼審查（改用 code-review）。'
---

# 系統架構設計

協助做架構決策，並用腳本分析現有專案的結構。結論一律附上取捨與理由，必要時寫成 ADR。

## 依任務載入

| 任務 | 參考文件 |
| --- | --- |
| 分析現有專案：架構圖、模組相依、分層違規 | [tools.md](references/tools.md) |
| 選擇架構模式、單體或微服務、事件驅動、CQRS | [architecture_patterns.md](references/architecture_patterns.md) |
| 系統設計流程、容量規劃、API 設計、遷移 | [system_design_workflows.md](references/system_design_workflows.md) |
| 選資料庫、框架、雲端、快取 | [tech_decision_guide.md](references/tech_decision_guide.md) |

## 選擇資料庫

1. 判斷資料特性：

	| 特性 | 傾向 |
	| --- | --- |
	| 結構化、有關聯、需要 ACID 交易 | SQL |
	| 結構常變動、文件導向 | 文件資料庫 |
	| 時間序列 | 時序資料庫，或 PostgreSQL + TimescaleDB |

2. 判斷規模：
	- 百萬筆以下、單一區域：PostgreSQL 或 MySQL。
	- 百萬到一億筆、讀多寫少：PostgreSQL 加讀取副本。
	- 一億筆以上、跨區域：CockroachDB、Spanner、DynamoDB。
	- 每秒一萬筆以上的寫入：Cassandra、ScyllaDB。
3. 判斷一致性：需要強一致選 SQL 或 CockroachDB；可接受最終一致才考慮 DynamoDB、Cassandra、MongoDB。
4. 沒有特殊需求時預設 PostgreSQL。快取與 session 用 Redis。
5. 寫 ADR（格式見文末）。

## 選擇架構模式

1. 依團隊規模決定起點：1～3 人用模組化單體；4～10 人用模組化單體或少量獨立服務；10 人以上才考慮微服務。
2. 依需求選模式：

	| 需求 | 模式 |
	| --- | --- |
	| 快速做出 MVP | 模組化單體 |
	| 各團隊需要獨立部署 | 微服務 |
	| 業務規則非常複雜 | 領域驅動設計（DDD） |
	| 讀寫負載差異很大 | CQRS |
	| 需要完整的變更歷程與稽核 | Event Sourcing |
	| 外部服務常替換 | 六角形架構（Ports & Adapters） |

3. 預設從模組化單體開始。只有下列情況才拆出獨立服務：
	- 這個模組的負載需求和其他模組差很多。
	- 負責的團隊需要獨立部署。
	- 需要換成不同的技術。

## 單體或微服務

符合下列多數條件時選單體：團隊少於 10 人、領域邊界還不清楚、重視快速迭代、希望維運簡單、可以共用資料庫。

符合下列多數條件時才選微服務：每個團隊能完整負責一個服務、獨立部署有明確的業務價值、各元件的擴展需求差很多、需要混用不同技術、領域邊界已經清楚。

## ADR 格式

```markdown
# ADR-<編號>：<決策標題>

- 狀態：提議／採用／取代
- 背景：要解決的問題與限制
- 選項：列出考慮過的選項與各自優缺點
- 決策：選了什麼，理由是什麼
- 取捨：接受了哪些缺點，之後在什麼情況下要重新評估
```
