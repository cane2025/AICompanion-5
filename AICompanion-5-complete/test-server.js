const express = require("express");
const app = express();

app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ message: "GET works" });
});

app.post("/test", (req, res) => {
  res.json({ message: "POST works", body: req.body });
});

app.listen(3002, () => {
  console.log("Test server running on port 3002");
});
