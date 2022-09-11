const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// 取最新商品
// http://localhost:3001/api/products
router.get('/', async (req, res) => {
    console.log('所有商品', '/api/products');

    // 分頁
    let page = req.query.page || 1;
    // 每一頁拿24筆資料
    const perPage = 24;
    // 取得總筆數
    let [total] = await pool.execute('SELECT COUNT(*) AS total FROM product');
    total = total[0].total;
    // 計算總頁數 Math.ceil
    let lastPage = Math.ceil(total / perPage);
    // 計算 offset
    const offset = perPage * (page - 1);

    // 所有商品
    let [data] = await pool.execute(`SELECT * FROM product JOIN product_img ON product_img.product_id  = product.product_id ORDER BY product.create_time LIMIT ? OFFSET ?`, [
        perPage,
        offset,
    ]);

    // 商品類別 - 主類別
    let [categoryMain] = await pool.execute('SELECT product_ins_main.id AS mainId, product_ins_main.name AS mainName  FROM product_ins_main');

    // 商品類別 - 次類別
    let [categorySub] = await pool.execute(
        'SELECT product_category.ins_main AS mainId, product_ins_sub.id AS subId, product_ins_sub.name AS subName FROM product_category INNER JOIN product_ins_sub ON product_ins_sub.id = product_category.ins_sub'
    );

    // 把取得的資料回覆給前端
    res.json({
        pagination: {
            total, // 總共有幾筆
            perPage, // 一頁有幾筆
            page, // 目前在第幾頁
            lastPage, // 總頁數
        },
        data,
        categoryMain,
        categorySub,
    });
});

// // GET http://localhost:3000/products?main_id=1&sub_id=1
router.get('/:mainId&:subId', async (req, res) => {
    const mainId = req.params.mainId;
    const subId = req.params.subId;

    // 分頁
    let page = req.query.page || 1;
    // 每一頁拿24筆資料
    const perPage = 24;
    // 取得總筆數
    let [total] = await pool.execute('SELECT COUNT(*) AS total FROM product WHERE ins_main_id = ? && ins_sub_id = ? ', [mainId, subId]);
    total = total[0].total;
    // 計算總頁數 Math.ceil
    let lastPage = Math.ceil(total / perPage);
    // 計算 offset
    const offset = perPage * (page - 1);

    let [data] = await pool.execute(
        'SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE ins_main_id = ? && ins_sub_id = ? ORDER BY product.create_time LIMIT ? OFFSET ?',
        [mainId, subId, perPage, offset]
    );
    // 把取得的資料回覆給前端
    res.json({
        pagination: {
            total, // 總共有幾筆
            perPage, // 一頁有幾筆
            page, // 目前在第幾頁
            lastPage, // 總頁數
        },
        data,
    });
});

module.exports = router;
