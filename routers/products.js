const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// 取最新商品
// http://localhost:3001/api/products
router.get('/', async (req, res) => {
    console.log('最新商品', '/api/products');
    let [data] = await pool.execute(`SELECT * FROM product JOIN product_img on product_img.product_id  = product.product_id ORDER BY product.create_time`);
    res.json(data);
});

module.exports = router;
