const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

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
                // SELECT product.*, brand.name AS brandName FROM product INNER JOIN brand ON brand.id = product.ins_brand INNER JOIN product_img ON product_img.product_id = product.product_id WHERE valid = 1 ORDER BY product.create_time DESC
                'SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE valid = 1 ORDER BY product.create_time DESC'
            );
            let [brand] = await pool.execute(
                'SELECT DISTINCT brand.id, brand.name AS brandName FROM brand JOIN product ON product.ins_brand = brand.id WHERE valid = 1 ORDER BY brand.id'
            );
            let [color] = await pool.execute('SELECT DISTINCT color FROM product WHERE valid = 1');
            let [maxPrice] = await pool.execute('SELECT MAX(price) AS maxPrice FROM product WHERE valid = 1');
            res.json({
                data,
                brand,
                color,
                maxPrice,
            });
            return;
        }
        if (mainId === 'null') {
            let [data] = await pool.execute(
                'SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE ins_sub_id = ? && valid = 1 ORDER BY product.create_time DESC',
                [subId]
            );
            let [brand] = await pool.execute(
                'SELECT DISTINCT brand.id, brand.name AS brandName FROM brand JOIN product ON product.ins_brand = brand.id WHERE ins_sub_id = ? && valid = 1 ORDER BY brand.id',
                [subId]
            );
            let [color] = await pool.execute('SELECT DISTINCT color FROM product WHERE ins_sub_id = ? && valid = 1', [subId]);
            let [maxPrice] = await pool.execute('SELECT MAX(price) AS maxPrice FROM product WHERE ins_sub_id = ? && valid = 1', [subId]);
            res.json({
                data,
                brand,
                color,
                maxPrice,
            });
            return;
        }
        if (subId === 'null') {
            let [data] = await pool.execute(
                'SELECT * FROM product JOIN product_img ON product_img.product_id = product.product_id WHERE ins_main_id = ? && valid = 1 ORDER BY product.create_time DESC',
                [mainId]
            );
            let [brand] = await pool.execute(
                'SELECT DISTINCT brand.id, brand.name AS brandName FROM brand JOIN product ON product.ins_brand = brand.id WHERE ins_main_id = ? && valid = 1 ORDER BY brand.id',
                [mainId]
            );
            let [color] = await pool.execute('SELECT DISTINCT color FROM product WHERE ins_main_id = ? && valid = 1', [mainId]);
            let [maxPrice] = await pool.execute('SELECT MAX(price) AS maxPrice FROM product WHERE ins_main_id = ? && valid = 1', [mainId]);
            res.json({
                data,
                brand,
                color,
                maxPrice,
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
