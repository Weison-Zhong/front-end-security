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

function encodeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
