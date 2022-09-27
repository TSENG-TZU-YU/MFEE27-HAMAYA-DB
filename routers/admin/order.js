const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//讀取訂單
//http://localhost:3001/api/admin/order/loading
router.get('/loading', async (req, res, next) => {
    console.log('loading order');
    let [result] = await pool.execute(
        'SELECT order_product.* , order_shipment.name AS shipment , order_pay_method.name AS pay_method ,order_pay_state.name AS pay_state , order_state.name AS order_state ,coupon.name AS coupon_name,coupon.sn, coupon.discount FROM order_product JOIN order_shipment ON order_product.shipment = order_shipment.id JOIN order_pay_method ON order_product.pay_method = order_pay_method.id JOIN order_pay_state ON order_product.pay_state = order_pay_state.id JOIN order_state ON order_product.order_state = order_state.id JOIN coupon ON order_product.coupon_id = coupon.id ORDER BY create_time DESC'
    );
    res.json(result);
});

//訂單詳細
//http://localhost:3001/api/admin/order/detail?id=${data.id}
router.get('/detail', async (req, res, next) => {
    console.log('loading order detail');
    const orid = req.query.orid;
    console.log('orid:', orid);

    let [myCouponDetailArray] = await pool.execute(
        'SELECT order_product.* , order_shipment.name AS shipment , order_pay_method.name AS pay_method ,order_pay_state.name AS pay_state , order_state.name AS order_state ,coupon.name AS coupon_name,coupon.sn, coupon.discount FROM order_product JOIN order_shipment ON order_product.shipment = order_shipment.id JOIN order_pay_method ON order_product.pay_method = order_pay_method.id JOIN order_pay_state ON order_product.pay_state = order_pay_state.id JOIN order_state ON order_product.order_state = order_state.id JOIN coupon ON order_product.coupon_id = coupon.id WHERE order_product.order_id = ? ORDER BY create_time',
        [orid]
    );
    let detail = myCouponDetailArray[0];

    // let [content] = await pool.execute('SELECT order_product_detail.* FROM order_product_detail WHERE order_product_detail.order_id=?', [orid]);

    //會員商城商品清單
    let [response_orderListA] = await pool.execute(
        `SELECT order_product_detail.* ,product_img.image, brand.name AS brand_name FROM order_product_detail JOIN product_img ON order_product_detail.product_id = product_img.product_id JOIN product ON order_product_detail.product_id = product.product_id JOIN brand ON product.ins_brand = brand.id WHERE order_product_detail.order_id=?`,
        [orid]
    );
    //會員課程清單
    let [response_orderListB] = await pool.execute(
        `SELECT order_product_detail.* ,class_img.image_1 FROM order_product_detail JOIN class_img ON order_product_detail.product_id = class_img.product_id WHERE  order_product_detail.order_id=?`,
        [orid]
    );

    res.json({ detail, response_orderListA, response_orderListB });
});

module.exports = router;
