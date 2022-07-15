const express = require("express");
const app = express();
app.get("/xss", function (req, res) {
  res.send("xss");
});

app.listen(4000, () => {
  console.log("App is listening on port 4000!");
});
