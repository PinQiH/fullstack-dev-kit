# 系統架構模式參考指南 (Architecture Patterns Reference)

**詳細介紹各種軟體架構模式的指南，包含其優缺點權衡以及實作上的指引。**

## 模式索引 (Patterns Index)

1. [單體架構 (Monolithic Architecture)](#1-monolithic-architecture)
2. [模組化單體架構 (Modular Monolith)](#2-modular-monolith)
3. [微服務架構 (Microservices Architecture)](#3-microservices-architecture)
4. [事件驅動架構 (Event-Driven Architecture)](#4-event-driven-architecture)
5. [CQRS (命令查詢職責分離)](#5-cqrs)
6. [事件溯源 (Event Sourcing)](#6-event-sourcing)
7. [六角形架構 (Hexagonal Architecture / Ports & Adapters)](#7-hexagonal-architecture)
8. [整潔架構 (Clean Architecture)](#8-clean-architecture)
9. [API 閘道模式 (API Gateway Pattern)](#9-api-gateway-pattern)

---

## 1. 單體架構 (Monolithic Architecture)

**解決的問題:** 需要將完整的應用程式建置並部署為「單一部署單元 (Single unit)」，並將維運 (Operational) 複雜度降到最低。

**使用時機 (When to use):**
- 小團隊 (1-5 位開發人員)
- 產品早期階段 或 MVP 驗證期
- 系統領域簡單，邊界非常清晰
- 「簡單的部署」是目前的第一考量

**避免使用 (When NOT to use):**
- 多個團隊各自需要獨立部署的功能
- 系統的特定部分有著極為懸殊的擴展性 (Scaling) 需求
- 需要在同專案中混用不同的技術點與程式語言 (Tech diversity)

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 部署極其簡單 | 擴展時只能「全包 (All-or-nothing)」一起資源放大 |
| 容易除錯 | 程式碼庫龐大後將變得難以駕馭 |
| 元件間不存在網路通訊延遲 | 容易出現單點故障 (Single point of failure) |
| 單純的測試流程 | 技術綁定，難以局部遷移 |

**結構範例:**
```
monolith/
├── src/
│   ├── controllers/    # HTTP 請求處理器
│   ├── services/       # 業務邏輯 (Business logic)
│   ├── repositories/   # 資料存取 (Data access)
│   ├── models/         # 領域實體 (Domain entities)
│   └── utils/          # 共用工具 (Shared utilities)
├── tests/
└── package.json
```

---

## 2. 模組化單體架構 (Modular Monolith)

**解決的問題:** 需要單體架構的「簡單性」，但同時具備「清晰的邊界」，為未來可能抽離成獨立服務保留彈性。

**使用時機 (When to use):**
- 中型團隊 (5-15 位開發人員)
- 系統領域的邊界開始變得清晰
- 希望保留未來輕鬆抽離成微服務的選項
- 需要比傳統單體架構更優良的「程式碼組織結構」

**避免使用 (When NOT to use):**
- 當下就已經需要獨立部署
- 開發團隊之間無法協同一致釋出更新

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 清晰的模組邊界 | 依然受限於單一部署 |
| 後期未來要抽離微服務相對容易 | 需要強大的工程紀律才不會破壞邊界 |
| 單一資料庫讓交易管理 (Transaction) 變簡單 | 容易隨著時間退化成緊密耦合的普通單體架構 |
| 團隊可以認領各自的模組負責權 | |

**結構範例:**
```
modular-monolith/
├── modules/
│   ├── users/
│   │   ├── api/           # 對系統內公開的介面 (Public interface)
│   │   ├── internal/      # 內部實作 (Implementation)
│   │   └── index.ts       # 模組匯出設定 (Module exports)
│   ├── orders/
│   │   ├── api/
│   │   ├── internal/
│   │   └── index.ts
│   └── payments/
├── shared/                # 橫切關注點 (Cross-cutting concerns)
└── main.ts
```

**核心守則:** 模組之間「只能」透過彼此的 Public API 進行溝通，絕對禁止匯入其他模組的內部檔案 (Internal files)。

---

## 3. 微服務架構 (Microservices Architecture)

**解決的問題:** 需要為系統中不同的部分提供「獨立部署、獨立擴充及不同的技術選擇」。

**使用時機 (When to use):**
- 大規模團隊 (15+ 開發人員)，且以業務能力為中心組織團隊
- 系統之中的相異部分具備不同的效能與負載擴充需求
- 獨立且無關聯的快速部署成為關鍵路徑
- 擁抱技術多樣性 (不同模組適用不同的語言特性)

**避免使用 (When NOT to use):**
- 不具備處理微服務營運複雜度 (Operational complexity) 的小型團隊
- 系統的領域邊界還不清楚，仍在頻繁改動
- 「分散式交易管理 (Distributed transactions)」是系統常見的需求
- 無法容忍任何網路連線延遲 (Network latency) 的極限環境

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 完全獨立部署 | 極度複雜的網路層通訊與錯誤處理 |
| 各自獨立進行擴充 (Scaling) | 分散式系統與生俱來的困難挑戰 |
| 擁抱最高技術彈性 | 巨大的維運營運成本負擔 |
| 跨團隊享有高度自治 | 資料最終一致性 (Data consistency) 挑戰 |
| 自動具備故障隔離特性 | 超高難度的測試建置 |

**結構範例:**
```
microservices/
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── order-service/
│   └── payment-service/
├── api-gateway/
├── infrastructure/
│   ├── kubernetes/
│   └── terraform/
└── docker-compose.yml
```

**通訊模式 (Communication patterns):**
- 同步通訊 (Synchronous): REST, gRPC
- 非同步通訊 (Asynchronous): 訊息佇列 (Message queues 像是 RabbitMQ, Kafka)

---

## 4. 事件驅動架構 (Event-Driven Architecture)

**解決的問題:** 需要讓各組件之間保持鬆散耦合，並且組件只對「業務事件 (Business events)」採取非同步式反應。

**使用時機 (When to use):**
- 組件之間必須維持鬆耦合狀態
- 維持系統完整且無遺漏的歷史異動紀錄 (Audit trail) 極具商業價值
- 系統需要針對業務事件作出近乎即時的反應
- 針對同一個業務事件，會有多重消費群體訂閱處理

**避免使用 (When NOT to use):**
- 只是單純的資料增刪改查 CRUD 操作
- 每個請求都要求同步取回回應 (Synchronous answers)
- 團隊不熟悉非同步模式
- 將「除錯追蹤 (Debugging)」的難易度設為最優先考量的專案

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 終極的鬆耦合 | 最終一致性 (Eventual consistency) 導致讀取落後 |
| 優秀的系統擴展能力 | 噩夢般的除錯複雜度 |
| 內建歷史紀錄追蹤能力 | 訊息次序難以保證 (Message ordering) |
| 可隨時水平擴增新的監聽處理者 | 依賴龐大的基礎設施平台 |

**事件資料結構範例:**
```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata: {
    correlationId: string;
    causationId: string;
  };
}

// 事件範例
const orderCreated: DomainEvent = {
  eventId: "evt-123",
  eventType: "OrderCreated",
  aggregateId: "order-456",
  timestamp: new Date(),
  payload: {
    customerId: "cust-789",
    items: [...],
    total: 99.99
  },
  metadata: {
    correlationId: "req-001",
    causationId: "cmd-create-order"
  }
};
```

---

## 5. CQRS (Command Query Responsibility Segregation)

**解決的問題:** 讀取 (Queries) 以及寫入 (Commands) 各自具備不同的屬性與要求，因此必須拆分各自進行最佳化處置。

**使用時機 (When to use):**
- 讀取端與寫入端之間的請求比例極度失衡 (10:1 以上)
- 讀取時的資料流向 (Read models) 與寫入時的邏輯資料 (Write models) 結構存在顯著差異
- 擁有這輩子也無法套用到當初寫入時邏輯身上的超級複雜讀取查詢
- 讀寫之間存在完全相反擴充性需求的極端環境

**避免使用 (When NOT to use):**
- 讀寫比例大致平衡的一般單純 CRUD 應用
- 讀取型態和當初寫入一模一樣
- 開發團隊完全沒有這方面的經驗
- 追加這類複雜性根本不構成對專屬領域的價值增長

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 特化的極速讀取模型 | 原本寫下去的資料何時同步過去查詢庫誰知道 |
| 讀與寫可各自放肆擴容 | 難以形容的複雜度增加 |
| 讓查詢邏輯變得很簡潔 | 同步兩端資料庫所需的神秘邏輯 |
| 追求出彩的性能極致 | 要維護多出一倍甚至好幾倍的各種專屬模型物件 |

**結構範例:**
```typescript
// 寫入端 (Commands)
interface CreateOrderCommand {
  customerId: string;
  items: OrderItem[];
}

class OrderCommandHandler {
  async handle(cmd: CreateOrderCommand): Promise<void> {
    const order = Order.create(cmd);
    await this.repository.save(order);
    await this.eventBus.publish(order.events);
  }
}

// 讀取端 (Queries)
interface OrderSummaryQuery {
  customerId: string;
  dateRange: DateRange;
}

class OrderQueryHandler {
  async handle(query: OrderSummaryQuery): Promise<OrderSummary[]> {
    // 查詢最佳化後的視圖讀取庫 (且已被反正規化 Denormalized)
    return this.readDb.query(`
      SELECT * FROM order_summaries
      WHERE customer_id = ? AND created_at BETWEEN ? AND ?
    `, [query.customerId, query.dateRange.start, query.dateRange.end]);
  }
}
```

---

## 6. 事件溯源 (Event Sourcing)

**解決的問題:** 需要以不可變更 (Immutable) 的紀錄串記錄每個動作，賦予我們在任何時候也能復原或重現歷史當下那一刻狀態的神奇超能力。

**使用時機 (When to use):**
- 完整的軌跡與修改紀錄被法規強制要求
- 業務邏輯經常需要我們解釋「資料到底怎麼變成現在這樣子的？」
- 在複雜領域中對撤銷 (Undo) 與重做 (Redo) 抱有異常執念
- 需要透過歷史時光機 (Time-travel) 來幫線上崩潰難解的 Issue 進行案情重演來除錯

**避免使用 (When NOT to use):**
- 人畜無害的簡單 CRUD
- 無歷史足跡追溯需求
- 團隊沒有人懂這個神秘東東
- 把系統當下的狀態呈現為最主要的商業目標 (不Care到底怎麼來的)

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 終極完美的事件操作稽核軌跡 | 無可救藥、每天以驚人速度增長的儲存空間 |
| 時光拉回當下的案發現場除錯大法 | 將原本查詢的難度調升進入了地獄模式 |
| 天生擁抱 Event-Driven 領域 | 無盡的學習曲線陡坡 |
| 作為開啟 CQRS 模式的一把終極鑰匙 | 同步永遠是那個永遠到不了的未來 (Eventual consistency) |

**實作範例:**
```typescript
// 事件定義
type OrderEvent =
  | { type: 'OrderCreated'; customerId: string; items: Item[] }
  | { type: 'ItemAdded'; itemId: string; quantity: number }
  | { type: 'OrderShipped'; trackingNumber: string };

// 總集聚合 (Aggregate): 是從所有事件疊加出來的形狀！
class Order {
  private state: OrderState;

  static fromEvents(events: OrderEvent[]): Order {
    const order = new Order();
    events.forEach(event => order.apply(event));
    return order;
  }

  private apply(event: OrderEvent): void {
    switch (event.type) {
      case 'OrderCreated':
        this.state = { status: 'created', items: event.items };
        break;
      case 'ItemAdded':
        this.state.items.push({ id: event.itemId, qty: event.quantity });
        break;
      case 'OrderShipped':
        this.state.status = 'shipped';
        this.state.trackingNumber = event.trackingNumber;
        break;
    }
  }
}
```

---

## 7. 六角形架構 (Hexagonal Architecture / Ports & Adapters)

**解決的問題:** 需要把核心業務邏輯圈在一個神聖不可侵犯的核心區內隔離，不管是 DB、API，還是誰的 UI 都不准污染它。

**使用時機 (When to use):**
- 企業的業務邏輯太過複雜而且是專案核心財產所在點
- 此系統需要把同樣的東西開放給不同人或載體串接 (公開 Web API、專用 CLI、接收外部呼叫等)
- 測試覆蓋率必須完美是第一要務
- 外部使用的工具（某個資料庫品牌或雲端技術廠商）非常有潛在可能會大翻盤

**避免使用 (When NOT to use):**
- 商業價值極低的簡易 CRUD 套用版模應用程式
- 只會存在一種被呼叫的方式
- 架構建立與抽象耗費時間遠高於此項目可以賦予的價值性

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 孤立於世的核心業務邏輯 | 繁多複雜的抽象化 |
| 高度具備超容易測試性 | 前期的基底打底跟規劃時間極長 |
| 各種外部依賴都變成了免洗餐具 (Swappable) | 非常容易陷入過度設計 (Over-engineered) 的悲鳴中 |
| 連盲人都摸得出的乾淨邊界 | 專案初期的學習高牆 |

**結構範例:**
```
hexagonal/
├── domain/              # 商業邏輯 (完全不相依任何外部框架套件)
│   ├── entities/
│   ├── services/
│   └── ports/           # 介面定義 Interface (領域層宣告自己所渴望的方法合約)
│       ├── OrderRepository.ts
│       └── PaymentGateway.ts
├── adapters/            # 實作端 Implementations
│   ├── persistence/     # 資料存取轉接器
│   │   └── PostgresOrderRepository.ts
│   ├── payment/         # 第三方依賴廠商轉接器
│   │   └── StripePaymentGateway.ts
│   └── api/             # 外面對傳轉接器
│       └── OrderController.ts
└── config/              # 把所有上述元件全部給串聯、縫合的地方
```

---

## 8. 整潔架構 (Clean Architecture)

**解決的問題:** 提出「依賴只能由外向內指」的核心思想，把所有框架與外圍都視為是過眼雲煙，只有最裡面一環的企業實體才是永久流傳。

**使用時機 (When to use):**
- 需要維護十年甚至二十年以上跨生命週期，保證壽命可以熬死現在流行框架的長青專案
- 企業邏輯本身就是最賺錢的本體時
- 工程師的團隊紀律與設計思維極度卓越
- 多端輸出戰略 (手機 App, 穿戴裝置 Web 後端通吃)

**避免使用 (When NOT to use):**
- 六個月內沒上線就會倒掉的專案
- 這個產品主打就是該當紅框架最優秀的特性 (你依賴的就是那個框架本身)
- 只不過是要將 DB 表格存粹寫出去的普通系統

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 完全不受特定框架綁架制霸 | 寫出一堆極度瑣碎且攏長的對映轉換程式碼 |
| 從實體驗證邏輯起手最好測 | 剛學的人會充滿「有必要這麼設計嗎的過度反應感」 |
| 極具單向性的依賴方向 | 需要很重的精神消耗與專注力 |
| 彈性大解放的多渠道分發 | 動手前需要撰寫許多基礎盤 |

**依賴守則 (Dependency rule):** 依賴方向只准「指向內部區塊」。身處較外圍同心圓圈層的任何一點一滴，絕對不得干涉、或是知道身在此處較核心圈的任何情報與內容。

```
┌─────────────────────────────────────────┐
│           Frameworks & Drivers          │
│  ┌─────────────────────────────────┐    │
│  │     Interface Adapters          │    │
│  │  ┌─────────────────────────┐    │    │
│  │  │    Application Layer    │    │    │
│  │  │  ┌─────────────────┐    │    │    │
│  │  │  │    Entities     │    │    │    │
│  │  │  │ (Domain Logic)  │    │    │    │
│  │  │  └─────────────────┘    │    │    │
│  │  └─────────────────────────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## 9. API 閘道模式 (API Gateway Pattern)

**解決的問題:** 在滿山滿谷雜亂無章的後端分散式微服務叢集中，站出來統一接受所有的外部請求與調度處理的唯一守門員節點。

**使用時機 (When to use):**
- 面對超過多個以上的雜亂微服務後端群時
- 想要統一中心化管理如身分驗證/防爬蟲/紀錄軌跡 (橫切關注點) 的地方
- 不同國家的不同裝置類型，各自索取各自適應的回傳內容解析度的變形需求
- 擔任多服務合併 (Service aggregation)、封裝大集合後傳出的職掌

**避免使用 (When NOT to use):**
- 你就只有唯一一台單體應用伺服器...
- 強烈訴求單純直觀最好不要有任何介入
- 將來沒人可以專門來維護它的話

**貿易折衷 (Trade-offs):**
| 優點 (Pros) | 缺點 (Cons) |
|------|------|
| 有了唯一的統一入口點 | 有了唯一的系統全滅死亡點 (Single point of failure) |
| 橫切面功能收斂 | 免不了要替這道門關繳納些許的響應時間稅金 (Latency) |
| 把伺服器後端細節包了個密不透風 | 因為太多管閒事後來變得異常複雜 |
| 量身訂做符合對象裝置端點專屬格式的 API | 不小心它就會變成整體卡死流量的最大瓶頸點 |

**職責區塊 (Responsibilities):**
```
┌─────────────────────────────────────┐
│            API Gateway              │
├─────────────────────────────────────┤
│ • 身分驗證與授權 (Auth)               │
│ • 限流防刷機制 (Rate limiting)        │
│ • 請求與回傳轉換翻譯大師                │
│ • 附帶簡單的負載平衡轉發                │
│ • 熔斷器阻絕風暴 (Circuit breaking)    │
│ • 資源快取 (Caching)                 │
│ • 軌跡追蹤遙測日誌 (Logging)           │
└─────────────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
    ┌─────┐   ┌─────┐   ┌─────┐
    │Svc A│   │Svc B│   │Svc C│
    └─────┘   └─────┘   └─────┘
```

---

## 模式選擇的極速上手指南 (Pattern Selection Quick Reference)

| 當你需要... | 將強烈建議優先考慮... |
|----------------|-------------|
| 訴求單純、簡單，且團隊很小 | **Monolith** (單體架構) |
| 清楚的邊界感，留下為日後隨時出走的彈性 | **Modular Monolith** (模組化單體架構) |
| 必須享受完全割裂的獨立性與各自生死的彈性擴容 | **Microservices** (微服務架構) |
| 系統之間老死不相往來的鬆耦合，仰賴發布訂閱 | **Event-Driven** (事件驅動架構) |
| 讀取介面與寫入邏輯根本各自飛躍為兩套不相干系統時 | **CQRS** |
| 在極度嚴苛金融稽核下保有每一絲每一毫的完美變動足跡 | **Event Sourcing** (事件溯源) |
| 容易切入專心測試核心、隨便你換哪套第三方也沒差 | **Hexagonal** (六角形架構) |
| 不依賴任何市面當紅炸子雞框架的最核心價值保衛戰 | **Clean Architecture** (整潔架構) |
| 作為通向背後雜亂叢生多服務單一窗口保鑣 | **API Gateway** (API 閘道模式) |
