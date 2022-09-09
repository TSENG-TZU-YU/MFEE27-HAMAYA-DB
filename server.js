const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.SERVER_PORT;
const pool = require('./utils/db.js');

const cors = require('cors');
app.use(cors());

let authRouter = require('./routers/auth');
app.use(authRouter);

let homeRouter = require('./routers/home');
app.use('/api/home', homeRouter);

let newsRouter = require('./routers/news');
app.use('/api/news', newsRouter);

let productsRouter = require('./routers/products');
app.use('/api/products', productsRouter);

let classRouter = require('./routers/class');
app.use('/api/class', classRouter);

let placeRouter = require('./routers/place');
app.use('/api/place', placeRouter);

let aboutusRouter = require('./routers/aboutus');
app.use('/api/aboutus', aboutusRouter);

let products = require('./routers/products');
app.use(products);

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
