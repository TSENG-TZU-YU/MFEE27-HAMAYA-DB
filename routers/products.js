const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// 商品列表次類別
// GET http://localhost:3001/api/products/category
router.get('/category', async (req, res) => {
    try {
        // 商品類別 - 次類別
        let [categoryMain] = await pool.execute('SELECT * FROM product_ins_main');
        // 商品類別 - 主類別
        let [categorySub] = await pool.execute(
            'SELECT product_category.ins_main AS mainId, product_ins_sub.id AS subId, product_ins_sub.name AS subName FROM product_category INNER JOIN product_ins_sub ON product_ins_sub.id = product_category.ins_sub'
        );

        res.json({ categoryMain, categorySub });
    } catch (err) {
        console.log(err);
    }
});

// 商品列表
// GET http://localhost:3001/api/products?mainId=null&subId=1
router.get('/', async (req, res) => {
    try {
        const mainId = req.query.mainId;
        const subId = req.query.subId;
        if (mainId === 'null' && subId === 'null') {
            let [data] = await pool.execute(
                // 撈近 25 天內的資料
                // 'SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE DATE_SUB(CURDATE(), INTERVAL 25 DAY) <= product.create_time && valid = 1 ORDER BY product.create_time DESC'
                'WITH A AS (SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE DATE_SUB(CURDATE(), INTERVAL 25 DAY) <= product.create_time && valid = 1 ORDER BY product.create_time DESC), B as (SELECT product_id, SUM(amount) AS sales FROM order_product_detail WHERE product_id LIKE "A%" GROUP BY product_id) SELECT A.*, B.sales FROM A LEFT JOIN B ON A.product_id = B.product_id ORDER BY A.create_time DESC'
            );
            let [brand] = await pool.execute(
                'SELECT DISTINCT brand.id, brand.name AS brandName FROM brand JOIN product ON product.ins_brand = brand.id WHERE DATE_SUB(CURDATE(), INTERVAL 25 DAY) <= product.create_time && valid = 1 ORDER BY brand.id'
            );
            let [color] = await pool.execute('SELECT DISTINCT color FROM product WHERE DATE_SUB(CURDATE(), INTERVAL 25 DAY) <= product.create_time && valid = 1');
            let [maxPrice] = await pool.execute('SELECT MAX(price) AS maxPrice FROM product WHERE DATE_SUB(CURDATE(), INTERVAL 25 DAY) <= product.create_time && valid = 1');
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
                // 'SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE ins_sub_id = ? && valid = 1 ORDER BY product.create_time DESC',
                'WITH A AS (SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE ins_sub_id = ? && valid = 1), B as (SELECT product_id, SUM(amount) AS sales FROM order_product_detail WHERE product_id LIKE "A%" GROUP BY product_id) SELECT A.*, B.sales FROM A LEFT JOIN B ON A.product_id = B.product_id ORDER BY A.create_time DESC',
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
                // 'SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE ins_main_id = ? && valid = 1 ORDER BY product.create_time DESC',
                'WITH A AS (SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE ins_main_id = ? && valid = 1), B as (SELECT product_id, SUM(amount) AS sales FROM order_product_detail WHERE product_id LIKE "A%" GROUP BY product_id) SELECT A.*, B.sales FROM A LEFT JOIN B ON A.product_id = B.product_id ORDER BY A.create_time DESC',
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
        console.log(err);
    }
});

// 商品詳細頁
// GET http://localhost:3001/api/products/A1?mainId=1
router.get('/:productId', async (req, res) => {
    try {
        const mainId = req.query.mainId;
        const productId = req.params.productId;
        let [data] = await pool.execute(
            // 'SELECT product.*, brand.name AS brandName, order_shipment.name AS shipmentName FROM product INNER JOIN brand ON brand.id = product.ins_brand INNER JOIN order_shipment ON order_shipment.id = product.shipment WHERE product_id = ? && valid = 1',
            'WITH A AS (SELECT product.*, brand.name AS brandName, order_shipment.name AS shipmentName FROM product INNER JOIN brand ON brand.id = product.ins_brand INNER JOIN order_shipment ON order_shipment.id = product.shipment WHERE product_id = ? && valid = 1), B as (SELECT product_id, SUM(amount) AS sales FROM order_product_detail WHERE product_id LIKE "A%" GROUP BY product_id) SELECT A.*, B.sales FROM A LEFT JOIN B ON A.product_id = B.product_id',
            [productId]
        );
        let [dataImg] = await pool.execute('SELECT image, image_1, image_2 FROM product_img WHERE product_id= ?', [productId]);
        let [relatedProducts] = await pool.execute(
            // 'SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE ins_main_id = ? && valid = 1 ORDER BY RAND() LIMIT 4',
            'WITH A AS (SELECT product.*, product_img.image, brand.name AS brandName FROM product INNER JOIN product_img ON product_img.product_id = product.product_id INNER JOIN brand ON brand.id = product.ins_brand WHERE ins_main_id = ? && valid = 1 ORDER BY RAND() LIMIT 4), B as (SELECT product_id, SUM(amount) AS sales FROM order_product_detail WHERE product_id LIKE "A%" GROUP BY product_id) SELECT A.*, B.sales FROM A LEFT JOIN B ON A.product_id = B.product_id',
            [mainId]
        );
        // 抓商品銷售量
        let [totalSales] = await pool.execute('SELECT SUM(amount) AS total_sales FROM order_product_detail WHERE product_id = ?', [productId]);
        res.json({ data, dataImg, relatedProducts, totalSales });
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;
