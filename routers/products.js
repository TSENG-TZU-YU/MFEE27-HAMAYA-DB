const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// // 取最新商品
// // http://localhost:3001/api/products
// router.get('/', async (req, res) => {
//     console.log('所有商品', '/api/products');

//     // 分頁
//     let page = req.query.page || 1;
//     // 每一頁拿24筆資料
//     const perPage = 24;
//     // 取得總筆數
//     let [total] = await pool.execute('SELECT COUNT(*) AS total FROM product WHERE valid = 1');
//     total = total[0].total;
//     // 計算總頁數 Math.ceil
//     let lastPage = Math.ceil(total / perPage);
//     // 計算 offset
//     const offset = perPage * (page - 1);

//     // 所有商品
//     let [data] = await pool.execute(
//         `SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE valid = 1 ORDER BY product.create_time LIMIT ? OFFSET ?`,
//         [perPage, offset]
//     );

//     // 商品類別 - 主類別
//     let [categoryMain] = await pool.execute('SELECT product_ins_main.id AS mainId, product_ins_main.name AS mainName  FROM product_ins_main');

//     // 商品類別 - 次類別
//     let [categorySub] = await pool.execute(
//         'SELECT product_category.ins_main AS mainId, product_ins_sub.id AS subId, product_ins_sub.name AS subName FROM product_category INNER JOIN product_ins_sub ON product_ins_sub.id = product_category.ins_sub'
//     );

//     // 把取得的資料回覆給前端
//     res.json({
//         pagination: {
//             total, // 總共有幾筆
//             perPage, // 一頁有幾筆
//             page, // 目前在第幾頁
//             lastPage, // 總頁數
//         },
//         data,
//         categoryMain,
//         categorySub,
//     });
// });

// GET http://localhost:3001/api/products/category
router.get('/category', async (req, res) => {
    try {
        // 商品類別 - 次類別
        let [categorySub] = await pool.execute(
            'SELECT product_category.ins_main AS mainId, product_ins_sub.id AS subId, product_ins_sub.name AS subName FROM product_category INNER JOIN product_ins_sub ON product_ins_sub.id = product_category.ins_sub'
        );
        res.json({ categorySub });
    } catch (err) {
        res.status(404).json({ err: err });
    }
});

// GET http://localhost:3001/api/products?mainId=null&subId=1
router.get('/', async (req, res) => {
    try {
        const mainId = req.query.mainId;
        const subId = req.query.subId;
        if (mainId === 'null' && subId === 'null') {
            let [data] = await pool.execute(
                'SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE valid = 1 ORDER BY product.create_time DESC'
            );
            let [color] = await pool.execute('SELECT DISTINCT color FROM product WHERE valid = 1');
            res.json({
                data,
                color,
            });
            return;
        }
        if (mainId === 'null') {
            let [data] = await pool.execute(
                'SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE ins_sub_id = ? && valid = 1 ORDER BY product.create_time DESC',
                [subId]
            );
            let [color] = await pool.execute('SELECT DISTINCT color FROM product WHERE ins_sub_id = ? && valid = 1', [subId]);
            res.json({
                data,
                color,
            });
            return;
        }
        if (subId === 'null') {
            let [data] = await pool.execute(
                'SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE ins_main_id = ? && valid = 1 ORDER BY product.create_time DESC',
                [mainId]
            );
            let [color] = await pool.execute('SELECT DISTINCT color FROM product WHERE ins_main_id = ? && valid = 1', [mainId]);
            res.json({
                data,
                color,
            });
            return;
        }
    } catch (err) {
        res.status(404).json({ err: err });
    }
});

// GET http://localhost:3001/api/products/1
router.get('/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        // let [data] = await pool.execute('SELECT * FROM product WHERE product_id = ? && valid = 1', [productId]);
        let [data] = await pool.execute(
            'SELECT product.*, brand.name AS brandName, order_shipment.name AS shipmentName FROM product INNER JOIN brand ON brand.id = product.ins_brand INNER JOIN order_shipment ON order_shipment.id = product.shipment WHERE product_id = ? && valid = 1',
            [productId]
        );
        let [dataImg] = await pool.execute('SELECT image FROM product_img WHERE product_id= ?', [productId]);
        // 把取得的資料回覆給前端
        res.json({ data, dataImg });
    } catch (err) {
        res.status(404).json({ err: err });
    }
});

module.exports = router;
