const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// const { body, validationResult } = require('express-validator');

router.post('/', async (req, res, next) => {
    console.log('cart 中間件', req.body);
    const [data] = req.body;
    let saveItemData = await pool.execute(`INSERT INTO cart (user_id, product_id, category_id, amount) VALUE (?,?,?,?)`, [
        data.user_id,
        data.product_id,
        data.category_id,
        data.amount,
    ]);
    console.log('saveItemData', saveItemData);
    res.json({ message: '已加入購物車，可以去會員專區 > 購物車查看，謝謝' });
});

module.exports = router;
