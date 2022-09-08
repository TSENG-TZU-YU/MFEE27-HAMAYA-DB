// 啟用 express
const express = require('express');
const router = express.Router();

const pool = require('../utils/db');

// http://localhost:3001/products
router.get('/products', async (req, res, next) => {
  let [data] = await pool.execute(`SELECT product.*,product_img.* FROM class JOIN product_img ON product.id=product_img.product_id WHERE product.id`);
  res.json(data);
});

// 匯出給別人用
module.exports = router;