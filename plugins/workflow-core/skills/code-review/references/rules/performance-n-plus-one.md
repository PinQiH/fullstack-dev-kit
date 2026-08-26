---
title: 避免 N+1 查詢問題 (Avoid N+1 Query Problem)
impact: HIGH
category: performance
tags: database, performance, orm, queries
---

# 避免 N+1 查詢問題 (Avoid N+1 Query Problem)

當程式碼執行了 1 次查詢來取得列表，接著又執行了 N 次額外查詢來取得每個項目的關聯資料時，就會發生 N+1 查詢問題。這會導致嚴重的效能下降。

## 為什麼這很重要？

N+1 查詢是最常見的效能問題之一：
- **10 個項目** → 11 次查詢 (1 + 10)
- **100 個項目** → 101 次查詢 (1 + 100)
- **1000 個項目** → 1001 次查詢 (1 + 1000)

每次查詢都有網路延遲 (約 1-50 毫秒)，所以 1000 次查詢就等於要等上 1-50 秒！

## ❌ 錯誤示範

**問題:** 在迴圈內部抓取關聯資料。

### Python (Django ORM)
```python
# ❌ N+1 查詢
def get_posts_with_authors():
    posts = Post.objects.all()  # 第 1 次查詢: SELECT * FROM posts
    
    for post in posts:
        # 發生 N 次查詢 (每篇文章 1 次): SELECT * FROM users WHERE id = ?
        print(f"{post.title} 作者為 {post.author.name}")
    
    return posts

# 如果有 100 篇文章，就會執行 101 次資料庫查詢！
```

### JavaScript (Sequelize)
```javascript
// ❌ N+1 查詢
async function getPostsWithAuthors() {
  const posts = await Post.findAll();  // 1 次查詢
  
  for (const post of posts) {
    // N 次查詢
    const author = await User.findByPk(post.authorId);
    console.log(`${post.title} 作者為 ${author.name}`);
  }
}
```

### GraphQL (常見錯誤)
```javascript
// ❌ Resolvers 發生 N+1 查詢
const resolvers = {
  Query: {
    posts: () => db.posts.findAll()  // 1 次查詢
  },
  Post: {
    // 每一篇文章都會執行一次！
    author: (post) => db.users.findById(post.authorId)  // N 次查詢
  }
};
```

## ✅ 正確示範

### 解法 1: 積極載入 (Eager Loading) / Join Fetching

**Python (Django)**
```python
# ✅ 1 次查詢搞定 (使用 JOIN)
def get_posts_with_authors():
    posts = Post.objects.select_related('author').all()
    # 單一查詢: SELECT * FROM posts JOIN users ON posts.author_id = users.id
    
    for post in posts:
        print(f"{post.title} 作者為 {post.author.name}")  # 沒有額外查詢！
    
    return posts
```

**Python (SQLAlchemy)**
```python
# ✅ 1 次查詢搞定 (使用 JOIN)
from sqlalchemy.orm import joinedload

posts = session.query(Post).options(joinedload(Post.author)).all()
```

**JavaScript (Sequelize)**
```javascript
// ✅ 1 次查詢搞定 (使用 JOIN)
const posts = await Post.findAll({
  include: [{
    model: User,
    as: 'author'
  }]
});

posts.forEach(post => {
  console.log(`${post.title} 作者為 ${post.author.name}`);  // 沒有額外查詢！
});
```

**JavaScript (Prisma)**
```javascript
// ✅ 1 次查詢搞定 (使用 JOIN)
const posts = await prisma.post.findMany({
  include: {
    author: true
  }
});
```

### 解法 2: 批次處理 (Batching) / DataLoader (適用於 GraphQL)

```javascript
// ✅ 使用 DataLoader 來批次處理查詢
const DataLoader = require('dataloader');

const userLoader = new DataLoader(async (userIds) => {
  // 收集所有 userIds 後，只呼叫一次: [1, 2, 3, 4, ...]
  const users = await db.users.findAll({
    where: { id: { in: userIds } }
  });
  
  // 以請求順序回傳
  return userIds.map(id => users.find(u => u.id === id));
});

const resolvers = {
  Post: {
    author: (post) => userLoader.load(post.authorId)  // 會自動批次化！
  }
};

// 100 篇文章 → 只需要 2 次查詢 (1 次查文章, 1 次批次查作者)
```

### 解法 3: 預先抓取 ID 再批次查詢 (Prefetch IDs, Then Batch)

```python
# ✅ 一次抓取所有資料再配對
def get_posts_with_authors():
    posts = Post.objects.all()
    
    # 取得所有不重複的作者 ID
    author_ids = {post.author_id for post in posts}
    
    # 單一查詢取得所有作者
    authors = User.objects.filter(id__in=author_ids)
    author_map = {author.id: author for author in authors}
    
    # 將作者附加至文章上
    for post in posts:
        post.author = author_map[post.author_id]
    
    return posts

# 總共 2 次查詢 (比 N+1 好太多了)
```

## 多對多關聯 (Many-to-Many Relationships)

**❌ 多對多關聯的 N+1**
```python
# ❌ 錯誤
posts = Post.objects.all()
for post in posts:
    tags = post.tags.all()  # N 次查詢！
```

**✅ 預載多對多關聯 (Prefetch many-to-many)**
```python
# ✅ 正確
posts = Post.objects.prefetch_related('tags').all()
for post in posts:
    tags = post.tags.all()  # 沒有額外查詢！

# 使用 2 次查詢:
# 1. SELECT * FROM posts
# 2. SELECT * FROM tags WHERE post_id IN (1,2,3,...)
```

## 如何檢測 N+1 查詢

### Django Debug Toolbar
```python
# settings.py
INSTALLED_APPS = ['debug_toolbar', ...]

# 會將執行的精確查詢顯示出來
# 並會將重複的查詢標記高光
```

### 查詢紀錄 (Query Logging)
```python
# Python: 紀錄所有查詢
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

```javascript
// Sequelize: 紀錄查詢
const sequelize = new Sequelize({
  logging: console.log  // 或自訂 logger
});
```

### 效能分析工具 (Profiling Tools)
- **Django**: django-silk, django-debug-toolbar
- **Rails**: bullet gem
- **Node.js**: Sequelize logging, Prisma debug mode
- **GraphQL**: graphql-query-complexity

## 效能比較 (Performance Comparison)

```
測試: 抓取 100 篇文章及作者

N+1 查詢 (101 次):
- 本地資料庫 (Local DB): 約 101 毫秒 (1 毫秒/次)
- 遠端資料庫 (Remote DB): 約 5.1 秒 (50 毫秒延遲 × 101)

積極載入 (Eager Loading, 1 次):
- 本地資料庫 (Local DB): 約 10 毫秒
- 遠端資料庫 (Remote DB): 約 50 毫秒

🚀 快上 10-100 倍！
```

## 最佳實踐 (Best Practices)

- [ ] **使用積極載入 (Eager loading)** (`select_related`, `prefetch_related`, `include`)
- [ ] 無法積極載入時，**使用批次查詢 (Batch queries)**
- [ ] 寫 GraphQL 時，**使用 DataLoader**
- [ ] 開發階段時，**啟用查詢日誌 (Query logging)**
- [ ] 上線環境，**監控查詢數量**
- [ ] **撰寫測試**驗證資料庫查詢次數

## 參考資料 (References)

- [Django select_related/prefetch_related](https://docs.djangoproject.com/en/stable/ref/models/querysets/#select-related)
- [Sequelize Eager Loading](https://sequelize.org/docs/v6/advanced-association-concepts/eager-loading/)
- [DataLoader for GraphQL](https://github.com/graphql/dataloader)
- [Bullet gem (Rails)](https://github.com/flyerhzm/bullet)
