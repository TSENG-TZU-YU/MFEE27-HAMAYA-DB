const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.SERVER_PORT;
const pool = require('./utils/db.js');
const cors = require('cors');

app.use(cors());

app.get('/api', (req, res, next) => {
  console.log('這裡是首頁');
  res.send('Hello Express');
});

app.use((req, res, next) => {
  console.log('在所有路由中間件的下面 -> 404 了！');
  res.status(404).send('Not Found!!');
});

// 啟動 server，並且開始 listen 一個 port
app.listen(port, () => {
  console.log(`server start at ${port}`);
});
