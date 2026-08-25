# 系統設計工作管線 (System Design Workflows)

**針對常見系統設計任務的拆解與逐步工作流程。**

## 工作管線索引 (Workflows Index)

1. [系統設計面試/討論法 (System Design Interview Approach)](#1-system-design-interview-approach)
2. [容量評估規劃 (Capacity Planning Workflow)](#2-capacity-planning-workflow)
3. [API 介面設計 (API Design Workflow)](#3-api-design-workflow)
4. [資料庫結構設計 (Database Schema Design)](#4-database-schema-design-workflow)
5. [擴展能力與瓶頸評估 (Scalability Assessment)](#5-scalability-assessment-workflow)
6. [系統遷移大計 (Migration Planning)](#6-migration-planning-workflow)

---

## 1. 系統設計面試/討論法 (System Design Interview Approach)

適用於團隊從零開始白板設計某個全新系統，或是向主管或客戶解說你的設計。

### 步驟 1：釐清實際需求與邊界 (Clarify Requirements) (3-5 分鐘)

**功能性需求分析 (Functional requirements):**

- 這個專案產品的最核心功能價值是什麼？
- 誰會來使用它？(外部客戶/內部員工/其他服務？)
- 這些使用者，能對這系統做出哪些關鍵操作來互動？

**非功能性需求盤點 (Non-functional requirements):**

- 這東西可能會面對到多大的量能暴風？(活躍使用人數額度、每秒發送與存取 Request/sec、累積的儲存容量大小)
- 響應延遲的最高容忍基準線在哪裡？
- 這東西有多不允許當機斷線？可用性級數在哪？(99.9% 還是 99.99%?)
- 對資料一致性最硬脾氣的要求底線？(強一致性 Strong？最終一致性 Eventual 就好？)

**你可以反問的常見情境問題範例：**

```
- 這個系統每日與每月大約有多少人在使用？(DAU / MAU)
- 這邊的讀取比例與寫入比例之間的大致差距？(Read/write ratio)
- 我們這邊儲存的歷史資料到底要留存多久？
- 是否要橫跨多國/多個主要地理區進行部署發行？
- 平日的常規負載量 vs 重大節慶的極限瘋狂峰值(Peak vs average load)?
```

### 步驟 2：信封背後的算數預估量級 (Estimate Scale) (2-3 分鐘)

**估算那些極具殺傷力的系統量級指標 (Key Metrics):**

```
用戶數量 (Users):        1,000 萬的月活躍人數 (Monthly Active Users)
日活躍數 (DAU):          100 萬的日活躍人數 (Daily Active Users)
請求量計算 (Requests):   每位用戶每天發生 100 筆請求 = 全球每天湧入 1 億筆請求
                       = 換算為 1,200 req/sec (這是全天均攤)
                       = 約 3,600 req/sec (推估峰值通常為均值的 3 倍率)

儲存空間預抓 (Storage):   每筆操作封包為 1KB × 1 億 = 每天需要 100GB 磁碟寫入空間
                       = 累積一年長大為 36TB 總儲存

頻寬負載量 (Bandwidth):   100GB/每天 = 算下來約每秒 1.2 MB/sec (常態均值)
```

### 步驟 3：在白板上揮灑出高階草圖 (Design High-Level Architecture) (5-10 分鐘)

**永遠從最樸實無華的基礎大三元骨幹開始:**

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 客戶端點 │────▶│ 後端 API │────▶│ 資料庫區 │
└──────────┘     └──────────┘     └──────────┘
```

**依照功能演進，像疊積木一樣補上有用且針對性的加強神兵:**

- 掛上負載平衡器 (Load balancer) 以拆分塞爆的排隊車流
- 在資料庫門口請 Redis 先生來當「快取 (Cache)」大軍抵抗暴躁的瘋狂讀取仔
- 對於靜態不會變的素材與影音請開 CDN 佈建發布站
- 用「非同步訊息佇列機 (Message queue)」攔下可以暫緩稍後處理的重量作業
- 利用「搜索索引伺服器 (Search index)」搞定原本資料庫搜到當場往生的恐怖長難查詢條件

### 步驟 4：針對每個組件深度剖析盤問 (Deep Dive into Components) (10-15 分鐘)

**對於所選上的每一個重點關卡或是重砲兵器，你得準備好面對：**

- 為什麼非要用這套核心技術不可？你的憑證與信心哪來的？
- 萬一日月星辰倒流，這個組件它原地暴斃斷線了，系統是怎麼處置的？(Handling failures)
- 他未來裝不下或是乘載不了時，請問要怎麼橫跨延展出去？(How does it scale)
- 選這個有什麼要忍痛犧牲掉的「陰暗面權衡」? (Trade-offs)

### 步驟 5：掐住扼刀瓶頸口 (Address Bottlenecks) (5 分鐘)

**列舉這張新地圖上被看破手腳的最容易癱瘓與陣亡點:**

- 資料庫對讀/寫 IO 的天花板上限臨界值
- 頻繁交互對著外部打的網路頻寬阻塞網
- 最害怕死掉的那一個「脆弱單點伺服器 (Single points of failure)」
- 熱力圖大塞車點 (少數熱炒資料群) 的極強熱點衝突 (Hot spots)

**提出的終極方案解答 (Solutions):**

- Caching 快取鎮守前門 (如 Redis, Memcached)
- 將資料庫揮刀大卸八塊分散在地球各角落的 Sharding 分片術
- 加掛無限多顆專為頂住讀取而生的附體子資料庫 (Read replicas)
- CDN (內容傳遞分發網路群)
- 將不是必須現在就回答顧客答案的動作全丟到 Async 非同步池子慢慢弄

---

## 2. 容量評估規劃 (Capacity Planning Workflow)

當主管跟你估報預算、或是為全新功能提出硬體採購或雲端機房租賃費用計算時必備。

### 步驟 1：統整商業推演數據表 (Gather Requirements)

| 關鍵參考指標                               | 啟用當下 | 第 6 個月預估 | 第 1 年成長展望 |
| ------------------------------------------ | -------- | ------------- | --------------- |
| 月活躍帳號總人數 (MAU)                     |          |               |                 |
| 同時線上火拼衝突極限人數 (Peak concurrent) |          |               |                 |
| 全球每秒鐘擊殺要求數 (RPS)                 |          |               |                 |
| 重量級檔案儲存空間累計消耗量 (GB)          |          |               |                 |
| 對外吐出的水管總頻寬 (Mbps)                |          |               |                 |

### 步驟 2：推算實際運算處理器需求量 (Calculate Compute Requirements)

**無情冷酷的 Web/API 伺服器機群推演:**

```
最高狂暴極限連線 (Peak RPS):       3,600 次
抓保守點的一台機器能扛幾招:        500 次/台 (非常保守的做法)
所以光算數量需要幾台機組:          3,600 / 500 = 死道友需要 8 台伺服器

通常得帶上為了防呆備援的 (N+2) 台:  補上預備役，答案為 10 台伺服器待命
```

**更底層剝開的 CPU 推演與精算:**

```
每處理一通電話預估耗時:  花了 50 毫秒的 CPU 生命歷程
最高峰湧入來電頻率:    3,600
算下來佔去幾顆處理器核心: 3,600 × 0.05 = 約 180 顆 CPU

為了不能把人操死保留安全氣囊緩衝空間 (目標 70% 極限使用度):
                    180 / 0.7 = 257 顆核心
                    = 大約開列 32 台裝有 8 核心的強大猛獸兵團
```

### 步驟 3：精算磁碟與巨大無盡倉庫儲存槽 (Calculate Storage)

**高貴的關聯性 Database 寫入儲存規劃:**

```
每天狂轟猛炸收到的實體紀錄數:  100,000 筆紀錄
每筆紀錄吃掉幾個 Bytes:       2 筆 KB
每日累積成堆長大吃掉:          200 MB 巨獸空間

因為要好查還要附加上「資料庫索引」所以會變成原來兩倍腫脹 (2x): 400MB/每天
這專案說要保留 1 年以上的發票不砍掉:                    大約是 146 GB 的磁碟空間

考量到備分與多重抄寫大業 (3x 重複副本術):               實砸 438 GB 來應付
```

**實體夾檔上傳圖片影音的無盡汪洋倉儲:**

```
每日狂傳附件與縮圖:      10,000 個夾檔
這些檔案大小平均平均來看:  500 KB 規模
每一天被灌進這黑洞的速度: 5 GB 的上傳成長

忍痛保留滿 1 年為止:    大約達到了 1.8 TB 境界
```

### 步驟 4：水管多粗不用擠破表頻寬網路總算 (Network Requirements)

**對外輸出極限流量頻寬結算 (Bandwidth):**

```
回給人家每次包包大小均為:      大約 10KB average
最高峰一秒湧進來索取量 (Peak RPS): 3,600 次
全部吐出去的流速 (Outbound):   3,600 × 10KB = 每秒瘋狂灑出 36MB/s = 等同於扯開 288 Mbps 對連頻寬

如果抓這條專線水管有 50% 是塞車浪費掉的保險分: 432 Mbps ≈ 老闆請去租一條「500 Mbps 保證專通大水管」
```

### 步驟 5：產文與敲定下一次的相聚評估 (Document and Review)

**為這計畫撰寫一份霸氣外露但深藏不露的《系統容量作戰企劃書文件》:**

- 闡述今日此刻的殘酷現況要求
- 放眼未來成長與通膨爆量預報
- 我身為國王指派顧問正式建議添購清單 (Infrastructure recommendations)
- 買完後老闆會吐血倒下的實質財報預算估列數字
- 我們何時該面對現實再拿出來重新算帳 (Review triggers: 何時達標或哪日到期須再評估)

---

## 3. API 介面設計 (API Design Workflow)

一套為了讓未來不管是接手的前端還是 APP 的外包公司看了頻頻拍手叫好的一致性 API 設計路徑流。

### 步驟 1：抓出真正的名詞英雄 (Identify Resources)

**把你眼前這錯綜復雜滿地名詞的商業戰場，找出最關鍵名詞主角:**

```
以經營電子商務拍賣王為例:
- 買賣英雄榜 (Users)
- 琳瑯滿目的實體寶貝 (Products)
- 客服查單地獄表 (Orders)
- 金流交涉戰 (Payments)
- 酸民留言與五星好評 (Reviews)
```

### 步驟 2：定義能對英雄們做出什麼暴行 (Define Operations)

**把老套的 CRUD 動詞跟經典萬年不敗 HTTP Method 狠狠黏在一起配對:**

| 終極目的操作 (Operation)        | 派定用場的 HTTP 使者 | 美麗對齊一致的 URL 結尾宣告口號 |
| ------------------------------- | -------------------- | ------------------------------- |
| 觀看眾生 (List)                 | GET                  | /resources                      |
| 只抓那個倒楣鬼 (Get one)        | GET                  | /resources/{id}                 |
| 無中生有創造繁榮 (Create)       | POST                 | /resources                      |
| 進廠局部美容保養 (Update)       | PUT/PATCH            | /resources/{id}                 |
| 無情地讓它化作歷史塵埃 (Delete) | DELETE               | /resources/{id}                 |

### 步驟 3：定義嚴謹的送取往返長相 (Design Format)

**要人給東西前的基本禮儀打招呼示範 (Request example):**

```json
POST /api/v1/orders
Content-Type: application/json

{
  "customer_id": "cust-123",
  "items": [
    {"product_id": "prod-456", "quantity": 2}
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  }
}
```

**我們莊嚴宣告使命必達的回信 (Response example):**

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "ord-789",
  "status": "pending",
  "customer_id": "cust-123",
  "items": [...],
  "total": 99.99,
  "created_at": "2024-01-15T10:30:00Z",
  "_links": {
    "self": "/api/v1/orders/ord-789",
    "customer": "/api/v1/customers/cust-123"
  }
}
```

### 步驟 4：出事犯蠢要統一致歉 (Handle Errors Consistently)

**專屬於大公司該有的得體失誤自白信體裁 (Error response format):**

```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters 您似乎打成了火星文喔",
    "details": [
      {
        "field": "quantity",
        "message": "這數量必須大於 0 才行"
      }
    ]
  },
  "request_id": "req-abc12345"
}
```

**背得滾瓜爛熟的老派行話標準 (Standard error codes):**

| HTTP 官腔狀態數字 | 什麼時候你該端出它來用                                              |
| ----------------- | ------------------------------------------------------------------- |
| 400               | 表單錯字、不守規矩被驗證當場退貨者                                  |
| 401               | 先生您沒付錢或是沒配戴狗牌 (未驗證)                                 |
| 403               | 您雖然戴狗牌但不符合經理階級不准進此禁區 (權限受限)                 |
| 404               | 根本就沒有這東西你活見鬼了 (找不到)                                 |
| 409               | 撞名、撞單與歷史無盡輪迴的衝突者                                    |
| 429               | 你打太快了你這個機器刷票蟲被防護網擋住了 (觸發 Rate limit)          |
| 500               | 千錯萬錯不是使用者的錯，全怪後端工程師昨晚寫出了超醜 Bug (內部當機) |

### 步驟 5：寫下千古流傳不朽詩經 (Document the API)

**最棒的文件一定不能忘了寫入:**

- 這支 API 的通關密語驗證如何防禦與解法
- 最前方那個又長又臭到底主網址 Base URL 是哪台，然後現在是第幾套版本？
- 列出終端口子外加活生生的打靶範例
- 錯誤代碼表跟這些火星編號相對應的白話故事書
- Rate limits 限制次數防禦條款
- Pagination 如何一頁一頁地帶你走向下一頁

---

## 4. 資料庫結構設計 (Database Schema Design Workflow)

無可救藥的重構大典，或是新專案動工挖第一抔土的必要儀式指南。

### 步驟 1：具象化盤點實體怪物 (Identify Entities)

**老實地把你打算偷塞進這黑膠盤的項目全部打字出來:**

```
電子大賣場實例 (E-commerce):
- 苦命刷卡客 User (需要追蹤 id, 郵件 email, 怎麼稱呼 name, 何時初來乍到這家店 created_at)
- 架上的金雞母 Product (id, 封為神稱的 name, 定出了天價 price, 庫存庫房還剩多少 stock)
- 發大財交易憑證 Order (id, 歸哪個苦主的 user_id, 這筆生意的近況進度 status, 坑了多少錢 total)
- 在這筆單裡的無辜細節們 OrderItem (自己的獨立 id, 綁去哪筆單 order_id, 產品對應 product_id, 搶包幾件 quantity, 當下購買價格 price)
```

### 步驟 2：牽線搭橋論關係 (Define Relationships)

**用小指頭想都知道的主僕或是群聚從屬派對大盤點:**

```
一名顧客 ──無數筆被坑錢的紀錄──▶ Order       (一對多 One user, many orders)
一張明細單 ──帶著各種阿貓阿狗的商品小細項──▶ OrderItem  (一對多 One order, many items)
架上一種品項 ──落入了千萬人的訂單細節囊中──▶ OrderItem (一對多 One product, many order items)
```

### 步驟 3：一錘定音的最強主鍵挑選賽 (Choose Primary Keys)

**神仙打架各種各派的主鍵優劣大比拚:**

| 陣營種類                    | 讚賞歌頌 (Pros)                                                                | 唾棄缺點 (Cons)                                             |
| --------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 自帶數字累加 Auto-increment | 直觀到爆、而且天生自帶排隊大小時間排序                                         | 一碰到分散各機跨越天際的雲端分散世界就徹底變智障            |
| 落落長的亂數 UUID           | 到宇宙盡頭也保證絕對不跟你撞名的唯一存在                                       | 字串超大坨又肥又醜、完全隨機打亂在磁碟中寫入超傷性能 (亂跳) |
| 進化究極體 ULID             | 保有了 UUID 橫跨宇宙唯一的傲慢、又能兼顧像數列一樣自備嚴謹優雅的時間先發排序法 | 也是字體稍嫌巨大了一些                                      |

### 步驟 4：掛上光速檢索標籤與索引神器 (Add Indexes)

**別亂貼免得引火上身的 Index 神奇過濾規則:**

```sql
-- 只要這欄位很常出現在你的 WHERE 質問盤查行列裡，請為其打造過濾神器
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 為了加快 JOIN 千絲萬縷關係縫合術的欄位
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 如果會同時用 WHERE 加上還要雞婆去使用 ORDER BY 的刁鑽場合
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 把多個查詢條件綑在一起的「複合式查水表 (Composite indexes)」策略
-- 當你要對應這種需求: SELECT * FROM orders WHERE user_id = ? AND status = 'active'
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

### 步驟 5：考慮裝不下的破表成長該怎麼擴容 (Plan for Scale)

**神聖的垂直分片與破裂術 (Partitioning strategies):**

```sql
-- 隨著四季推演瘋狂長出無窮紀錄的「事件日誌」最愛用的：依時間軸切大塊切碎碎法 (Partition by date)
CREATE TABLE events (
  id BIGINT,
  created_at TIMESTAMP,
  data JSONB
) PARTITION BY RANGE (created_at);

-- 利用 Hash 函數像吃角子老虎機一樣，把資料雨露均霑完美灑落於所有磁區深處的分配術 (Partition by hash)
CREATE TABLE users (
  id BIGINT,
  email VARCHAR(255)
) PARTITION BY HASH (id);
```

**碎成千萬片 Sharding 魔法的額外副作用警示:**

- 第一刀的 Shard key 挑選是生是死定江山 (用 user_id, 用 tenant_id, 等等)
- 跨宇宙藩籬去 JOIN 不同片 Shard 查詢資料會痛不欲生的噩耗限制
- 未來要是不小心不平衡，想要再度移動搬遷碎片的乾坤大挪移極端恐怖策略

---

## 5. 擴展能力與瓶頸評估 (Scalability Assessment Workflow)

適用於質疑現有這尊大神還能撐過明後兩年大撒幣式的會員瘋狂增長大考驗嗎？

### 步驟 1：調出過往光輝或悲慘病歷 (Profile Current System)

**把監護儀器全盤拖出列陣監測:**

```
今日真實接客場景打樁底線：
- 每秒溫柔處理客人均數 (Avg RPS): ___
- 全面發飆每秒最高承接天花板 (Peak RPS): ___
- 一般人平均感到痛苦等候的轉圈時間 (Avg Latency): ___ ms
- 前 1% 那群極端倒楣鬼最慘等到要死的延遲極限 (P99 Latency): ___ ms
- 出包給錯答案的不良率大調查 (Error Rate): ___%

榨乾資源的地圖全開指標：
- 幫人家算數學花盡腦汁的處理器 (CPU): ___%
- 擠滿公車排隊無盡等待死背瞎猜的記憶體 (Memory): ___%
- 硬碟被來回摩擦寫寫讀讀的次數極限 (Disk I/O): ___%
- 對外面送資料頻寬被塞死飽和的慘況 (Network): ___%
```

### 步驟 2：誰是隊伍裡面拖後腿的第一名 (Identify Bottlenecks)

**拿手電筒到每一層房間裡面去照妖找麻煩:**

| 從上到下各種分層 (Layer)              | 原形畢露的拖後腿元凶證據大解碼                                              |
| ------------------------------------- | --------------------------------------------------------------------------- |
| 開著大門迎客的前線網頁伺服機 (Web)    | CPU 呈現一直紅爆滿檔、一堆連線等待接起、大門癱瘓爆限                        |
| 夾在中間算業務邏輯苦力的應用服 (App)  | 回覆給人的速度如蝸牛慢爬、Thread pool 執行緒活活被塞死耗盡卡死              |
| 深在巢穴管儲存的大金庫 (Database)     | 一句查詢可以卡五分鐘、一大堆死鎖塞車跟相撞相殺的鎖 (Lock contention)        |
| 用來救援與加速的快遞兵 (Cache Memory) | 一直查無資料瘋狂失誤 (High miss rate)、記憶體根本擠不出空間塞要被踢除的殘念 |
| 對接天涯海角的總水管 (Network)        | 水管全面被塞滿再也擠不出半毛 Byte，延遲呈現鬼片斷路跳動現象                 |

### 步驟 3：火力展示的極限重炮全網壓力測試 (Load Test)

**編寫地獄火般的瘋狂考驗軍情局:**

```
1. 戰鬥無傷巡航期 (Baseline)：用今日實際上線的人潮量再跑一次感受氣氛
2. 預言成長翻兩番 (2x Load)：給定系統成長預估在未來 6 個月暴增時的考驗
3. 崩潰邊緣終極試煉 (5x Load)：地獄難度的惡意灌滿壓迫式測試底線在哪
4. 心電圖尖刺大突襲 (Spike)：瞬間沒有理由來個 10 倍超級大風暴橫掃五分鐘看他會不會崩掉
```

**可以端上檯面的各項殘酷刑具(測試工具選擇):**

- 拿來猛灌塞滿 HTTP Request 專用刑具：k6, Locust, 歷史悠久笨重的 JMeter
- 讓 PostgreSQL 自己跟自己瘋狂互砍的神器：pgbench
- redis 對打不死操暴工具：redis-benchmark

### 步驟 4：針對弱點擬定出萬兵迎駕策略 (Identify Scaling Strategy)

**長高又長壯的硬碾垂直強心針強化術 (Vertical scaling - 往上疊加大絕):**

- 最無腦直接花大錢買最高級旗艦的 CPU, 插滿最高昂的 RAM, 換上最極致的 SSD 磁碟空間
- 極度無腦無技術痛點，但會撞上地球物理上的終點極限板
- **何時登場**: 當你覺得「一台伺服器本身」還沒被你操到極致，潛力無窮之時

**橫空出世無窮無盡的瘋狂複製人海戰術 (Horizontal scaling - 往側排灑大軍):**

- 加買多買 100 台、1,000 台窮到只剩下機器的玩法
- 只有你的軟體建築可以做到像空氣一般的「無狀態 (Stateless)」時才能大顯神威
- **何時登場**: 當你面對無垠大海並只追求呈現直線上升戰力的極致規模化成長時

### 步驟 5：簽呈送交決策白皮書 (Create Scaling Plan)

**以這個嚴肅公文做收束:**

```
觸發擴容起義信號槍 (Trigger)：一旦 CPU 哀嚎率衝破 70% 長達 15 分鐘拉不下來就動手

緊急應對防衛戰略 (Action)：
1. 叫雲端機房火速增援 2 台配備齊全的戰鬥 Web server 伺服器
2. 通知大門口的負載平衡器 Load balancer 把新進來的小綿羊接引過來新的機器上
3. 打幾下測試針確認新人呼吸順暢 (Verify health checks) 再全放

投降輸一半倒退嚕機制 (Rollback)：
1. 立馬切斷剛才開進來的新增軍團
2. 刷新 Load balancer 確保它停止送單進死胡同
3. 在旁邊觀望調查系統出包的醜陋真相
```

---

## 6. 系統遷移大計 (Migration Planning Workflow)

系統大限已到，全面將整個城市與居民轉移到新星球、新基礎工程、新資料庫的跨越史詩戰役指南。

### 步驟 1：留住過往美好的舊城全景畫 (Assess Current State)

**用相機與紙筆盤點即將要告別的一切：**

- 畫出舊系統宛如義大利麵條般的相愛相殺建築藍圖 (Current architecture diagram)
- 老百姓這無數個年頭究竟生了多少的龐大資料庫體積 (Data volumes)
- 藏在深山裡到底我們依賴了哪些別人的外部小外掛工具 (Dependencies)
- 當年私自牽線串去別人家暗門的不可告人地下橋樑點 (Integration points)
- 被罵得很難聽的效能現況紀錄表留存 (Performance baselines)

### 步驟 2：繪出應許之地的新城鎮烏托邦藍圖 (Define Target State)

**發下未來願景豪語的新契約文件:**

- 來畫那充滿光與亮潔無瑕的完美系統新藍圖
- 細數我們即將升級捨棄掉的陳舊技術有哪些科技轉換史
- 畫超級大餅這新系統上線後我們的世界會變得多麼和平順暢美麗
- 老闆只看「如果這樣才算過關」的評分勝選標準清單 (Success criteria)

### 步驟 3：排兵佈陣渡河大決戰策略選定 (Plan Migration Strategy)

**帶你認識所有瘋狂作死或保守至極的各式無損轉移陣行:**

| 極密遷徙手段戰略 (Strategy)                    | 亡國風險度                             | 要關機斷線多久                   | 我們人為出大錯超難搞砸度                     |
| ---------------------------------------------- | -------------------------------------- | -------------------------------- | -------------------------------------------- |
| Big bang 大爆炸法 (一次全過重啟見生死了)       | 絕對最高危險級                         | 是的，要挑大半夜祈禱然後斷網維修 | 超低 (因為一翻兩瞪眼)                        |
| Blue-green 藍綠相間部署 (平行測試開新切換)     | 中庸之道風險                           | 短到無感或極少                   | 很中等的管理麻煩度                           |
| Canary 金絲雀放飛毒氣測試法 (慢慢開小眾測試區) | 出事風險極度安全與可控                 | 大致不會被發現有斷過             | 必須耗盡技術與無盡設定的超級高度難題         |
| Strangler fig 絞殺樹包圍寄生法 (慢性吞食)      | 出了錯根本抓不到因為太慢了極危險零確性 | 毫無斷線，因為是在背後慢慢搞     | 技術宅們也崩潰頭疼的高天花板級極大麻煩精難關 |

**最強力推薦針對歷史神獸巨大系統：慢性寄生替換包圍法 (Strangler fig pattern):**

```
1. 站在老舊廢物系統前面打造一座超強超美的偽裝城牆替身 (加Facade屏障)
2. 偷偷把那不重要只有 1% 的阿貓阿狗流量暗渡陳倉倒引到全新城鎮去試跑水溫
3. 看沒事之後，慢慢開始拉拔、增開水閘口把流量灌給全新城鎮伺服群
4. 直到最後所有舊城居民全撤空死城時，一把大火燒了光榮除役老系統
```

### 步驟 4：吃下後悔藥與逃命路線規劃總表 (Create Rollback Plan)

**對於我們這偉大航道的每一步進程，都需要事先規畫失敗急救步驟:**

```
今日要面對的大動作 (Step)：把使用者的個人檔案身分服務大軍推上最新最酷的資料星球上

按下血紅色「全站緊急撤退急救按鈕」的地獄標準線 (Rollback trigger)：
- 超過 1% 倒楣鬼使用者在網頁前噴火出現大叉叉無法登入操作
- P99 這邊的慘叫聲延遲超越了突破天際的 500 毫秒極限紅線標準
- 傳說中「昨天錢還在，今天少一半」的可怕兩方資料不再一致性錯亂怪談出現

跑路與還原大時光機實施手冊流程 (Rollback steps)：
1. 在負載切換大門毫不留情把河流全部斷折直接接回原本又破又舊的資料老家水管
2. 把這剛好去新星球玩卻意外多出來更新的那一點點微不足道的進度給備份抄回那破爛的舊老家庫裡去
3. 大家開始圍著錯誤 Log 抓犯人準備找戰犯
4. 預估要停血補救搞完這場鬧劇花費：15分鐘的公關噩夢時間
```

### 步驟 5：一路上插旗為號執行千秋大業 (Execute with Checkpoints)

**長到讓人想要一槍斃了這張清單的遷徙檢查條款地圖 (Checklist):**

```
□ 先好好的把當下完美的悲慘系統完整備份一輪
□ 確認你剛備份的那個還原鍵是真的壓的下去按了還活得回來
□ 準備好了新的機房與星球開始點火發動
□ 先派小兵上去新大陸抽幾根菸烤烤肉測試看看會不會活生生自燃 (Smoke tests 冒煙測試)
□ 偷偷放第一批的 (1%) 可憐測試實驗鼠大軍先去踏踏草皮看會不會死在這
□ 拿著望遠鏡觀測整整一輪日月更替 (24 小時駐守)
□ 加大閥門開放了整整一成 (10%) 的居民進城同樂
□ 繼續死命觀測整整一輪日月更替 (再一個 24 小時)
□ 直接霸氣強勢通關到一半 (50%) 迎接大考驗
□ 再撐住觀測無盡日月交替一輪 (又是個漫長的 24 小時)
□ 全面宣告偉大帝國遷徙成功 (100% 全面進駐全新系統星球)
□ 風光並無情的把那個舊伺服器家鄉轟成渣 (Decommission 廢棄舊系統)
□ 坐下來大家針對這次學到的慘烈教訓寫成厚厚一本技術反省血淚史
```

---

## 極速就醫救急導航索引 (Quick Reference)

| 你現在眼前正要解決哪種煩惱瞎事 (Task)    | 就從這招開啟起手勢 (Start Here)                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| 空空如也被要求生出個能動的全系統宇宙     | [System Design Interview Approach 系統面試規劃思考法](#1-system-design-interview-approach) |
| 老闆問你租一台機器要多少錢怎麼開規格     | [Capacity Planning 網路機房空間頻寬評估算計與抓包](#2-capacity-planning-workflow)          |
| 被勒令生出全新且美麗不生繡的 API         | [API Design 介面連接口禮儀標準設計](#3-api-design-workflow)                                |
| 不知道這個要開幾個欄位關聯多雜時         | [Database Schema Design 神聖的資料庫拆分與相連](#4-database-schema-design-workflow)        |
| 面對排山倒海使用者要用錢砸卻不知會不會掛 | [Scalability Assessment 無盡擴容抗壓的死亡交叉測試](#5-scalability-assessment-workflow)    |
| 要把專案資料完整端去另一個伺服雲端地獄時 | [Migration Planning 大江大海星際難民大遷移指南](#6-migration-planning-workflow)            |
