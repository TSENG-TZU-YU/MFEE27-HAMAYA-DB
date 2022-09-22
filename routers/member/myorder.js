const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const moment = require('moment');

//成立訂單
router.post('/', async (req, res, next) => {
    console.log('myorder 中間件', req.body);
    const [data] = req.body;
    // console.log('data', data);
    //產生訂單編號
    let order_id = 'A' + parseInt(Date.now() % 10000000);
    //優惠券
    let coupon_id = data.coupon_id;
    console.log('coupon_id', coupon_id, data.user_id);
    //郵遞區號
    let newDist = data.dist.split(',');
    let newAddress = newDist[0] + data.city + newDist[1] + data.address;
    //當前時間
    let momentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        //存order_product order_finish先拿掉
        try {
            await pool.execute(
                `INSERT INTO order_product (order_id, user_id, receiver, phone, freight, shipment, address, pay_method, pay_state,pay_time, order_state, coupon_id, total_amount,create_time, valid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [order_id, data.user_id, data.receiver, data.phone, data.freight, 1, newAddress, data.pay_method, 1, momentTime, 1, coupon_id, data.total_amount, momentTime, 1]
            );
        } catch (err) {
            res.status(404).json({ message: '新增訂單失敗' });
        }

        //產品組陣列
        let filter_A = data.product_detail.filter((value) => {
            return value.category_id === 'A';
        });

        let product_detailA = filter_A.map((item) => {
            return [order_id, item.product_id, item.category_id, item.name, item.amount, item.price, 1];
        });

        let filter_B = data.product_detail.filter((value) => {
            return value.category_id === 'B';
        });

        let product_detailB = filter_B.map((item) => {
            return [order_id, item.product_id, item.category_id, item.name, item.start_date, item.end_date, item.amount, item.price, 1];
        });
        try {
            //存detail
            if (product_detailA.length !== 0) {
                await pool.query(`INSERT INTO order_product_detail (order_id, product_id, category_id, name, amount, price, valid) VALUES ?`, [product_detailA]);
            }

            if (product_detailB.length !== 0) {
                await pool.query(`INSERT INTO order_product_detail (order_id, product_id, category_id, name, start_date, end_date, amount, price, valid) VALUES ?`, [
                    product_detailB,
                ]);
            }
        } catch (err) {
            res.status(404).json({ message: '新增訂詳細失敗' });
        }

        let products_delete = data.product_detail.map((item) => {
            return [item.product_id];
        });

        // console.log('刪除cart 產生訂單', products_delete);
        try {
            //刪除在購物車的商品
            for (let i = 0; i < products_delete.length; i++) {
                await pool.query(`DELETE FROM user_cart WHERE (user_id=?) AND (product_id=?)`, [data.user_id, products_delete[i]]);
                // console.log('deleteItemData', deleteItemData);
            }
        } catch (err) {
            res.status(404).json({ message: '刪除購物車清單失敗' });
        }

        //TODO:修改優惠券使用額度
        // if (coupon_id != 0) {
        //     try {
        //         let updateCouponUse = await pool.execute('UPDATE coupon_detail SET use = ? WHERE user_id= ? AND coupon_id= ?', [0, coupon_id, data.user_id]);
        //         console.log('updateCouponUse', updateCouponUse);
        //     } catch (err) {
        //         res.status(404).json({ message: '修改優惠券使用失敗' });
        //     }
        // }

        res.json({ order_id: order_id, message: '訂單已成立' });
    } catch (err) {
        res.status(404).json({ message: '新增訂單失敗' });
    }
});

//SELECT * FROM `order_product` WHERE user_id=2
//查詢訂單
router.get('/:id', async (req, res, next) => {
    // console.log('查詢user_id req.params', req.params);
    const user_id = req.params.id;
    // let [response] = await pool.execute(`SELECT * FROM order_product WHERE user_id=?`, [user_id]);
    try {
        let [response_product] = await pool.execute(
            `SELECT order_product.*, order_product_detail.category_id,product_img.image FROM (order_product JOIN order_product_detail ON order_product_detail.order_id = order_product.order_id) JOIN product_img ON order_product_detail.product_id = product_img.product_id WHERE order_product.user_id = ? ORDER BY order_product.create_time DESC;`,
            [user_id]
        );
        let [response_class] = await pool.execute(
            `SELECT order_product.*, order_product_detail.category_id,class_img.image_1 FROM (order_product JOIN order_product_detail ON order_product_detail.order_id = order_product.order_id) JOIN class_img ON order_product_detail.product_id = class_img.product_id WHERE order_product.user_id = ? ORDER BY order_product.create_time DESC;`,
            [user_id]
        );
        const response = response_product.concat(response_class);
        console.log(response);

        res.json({ user_id: user_id, message: 'All Good 訂單查詢', myOrder: response });
    } catch (err) {
        res.status(404).json({ message: '訂單查詢失敗' });
    }
});

//TODO:查detail時要比對連線這跟該資料使用id是否相同
// params: { order_id: 'A6542801' },
// query: { user_id: '123', order_id: 'A123456' }
router.get('/detail/:order_id', async (req, res, next) => {
    // console.log('查詢order_id req.params', req);
    //取得user_id判斷此訂單是否為該使用者輸入
    const user_id = req.query.user_id;
    const order_id = req.query.order_id;
    try {
        //使用者資訊
        let [response_userInfo] = await pool.execute(`SELECT * FROM order_product WHERE order_id= ? AND user_id = ?`, [order_id, user_id]);

        console.log('response_userInfo', response_userInfo);

        //使用者購買清單
        let [response_orderListA] = await pool.execute(
            `SELECT order_product_detail.* ,product_img.image, brand.name AS brand_name FROM order_product_detail JOIN product_img ON order_product_detail.product_id = product_img.product_id JOIN product ON order_product_detail.product_id = product.product_id JOIN brand ON product.ins_brand = brand.id WHERE order_product_detail.order_id=?`,
            [order_id]
        );
        let [response_orderListB] = await pool.execute(
            `SELECT order_product_detail.* ,class_img.image_1 FROM order_product_detail JOIN class_img ON order_product_detail.product_id = class_img.product_id WHERE  order_product_detail.order_id=?`,
            [order_id]
        );

        // console.log('response_userInfo', response_userInfo);

        const response = response_orderListA.concat(response_orderListB);
        // console.log('response', response);

        res.json({ user_id: user_id, message: 'All Good 訂單詳細查詢', userInfo: response_userInfo, orderList: response });
    } catch (err) {
        res.status(404).json({ message: '訂單詳細查詢失敗' });
    }
});

module.exports = router;
