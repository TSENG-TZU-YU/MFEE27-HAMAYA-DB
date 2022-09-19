const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const moment = require('moment');

//成立訂單
router.post('/', async (req, res, next) => {
    // console.log('myorder 中間件', req.body);
    const [data] = req.body;
    //產生訂單編號
    let order_id = 'A' + parseInt(Date.now() % 10000000);
    //郵遞區號
    let newDist = data.dist.split(',');
    let newAddress = newDist[0] + data.city + newDist[1] + data.address;
    //當前時間
    let momentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        //存order_product order_finish先拿掉
        let saveOrderData = await pool.execute(
            `INSERT INTO order_product (order_id, user_id, receiver, phone, freight, shipment, address, pay_method, pay_state,pay_time, order_state, coupon_id, total_amount,create_time, valid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [order_id, data.user_id, data.receiver, data.phone, data.freight, 1, newAddress, data.pay_method, 1, momentTime, 1, 9, data.total_amount, momentTime, 1]
        );

        //產品組陣列
        let product_detail = data.product_detail.map((item) => {
            return [order_id, item.product_id, item.category_id, item.name, item.amount, item.price, 1];
        });
        //存detail
        let saveItemData = await pool.query(`INSERT INTO order_product_detail (order_id, product_id, category_id, name, amount, price, valid) VALUES ?`, [product_detail]);

        console.log('saveItemData', saveItemData);

        res.json({ order_id: order_id, message: '訂單已成立，可以去會員專區 > 訂單查詢 查看，謝謝' });
    } catch (err) {
        res.status(404).json({ message: '新增訂單失敗' });
    }
});

//SELECT * FROM `order_product` WHERE user_id=2
router.get('/:id', async (req, res, next) => {
    console.log('req.params', req.params);
    const user_id = req.params.id;
    // let [response] = await pool.execute(`SELECT * FROM order_product WHERE user_id=?`, [user_id]);
    let [response_product] = await pool.execute(
        `SELECT order_product.*, order_product_detail.category_id,product_img.image FROM (order_product JOIN order_product_detail ON order_product_detail.order_id = order_product.order_id) JOIN product_img ON order_product_detail.product_id = product_img.product_id WHERE order_product.user_id = ?;`,
        [user_id]
    );
    let [response_class] = await pool.execute(
        `SELECT order_product.*, order_product_detail.category_id,class_img.image_1 FROM (order_product JOIN order_product_detail ON order_product_detail.order_id = order_product.order_id) JOIN class_img ON order_product_detail.product_id = class_img.product_id WHERE order_product.user_id = ?;`,
        [user_id]
    );
    const response = response_product.concat(response_class);
    console.log(response);

    res.json({ user_id: user_id, message: 'All Good 訂單查詢', myOrder: response });
});

//TODO:查detail時要比對連線這跟該資料使用id是否相同

module.exports = router;
