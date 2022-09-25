const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//讀取訂單
//http://localhost:3001/api/admin/order/loading
router.get('/loading', async (req, res, next) => {
    console.log('loading order');
    let [result] = await pool.execute(
        'SELECT order_product.* , order_shipment.name AS shipment , order_pay_method.name AS pay_method ,order_pay_state.name AS pay_state , order_state.name AS order_state ,coupon.name AS coupon_name,coupon.sn, coupon.discount FROM order_product JOIN order_shipment ON order_product.shipment = order_shipment.id JOIN order_pay_method ON order_product.pay_method = order_pay_method.id JOIN order_pay_state ON order_product.pay_state = order_pay_state.id JOIN order_state ON order_product.order_state = order_state.id JOIN coupon ON order_product.coupon_id = coupon.id ORDER BY create_time'
    );
    res.json(result);
});

//訂單詳細
//http://localhost:3001/api/admin/order/detail?id=${data.id}
router.get('/detail', async (req, res, next) => {
    console.log('loading order detail');
    const orid = req.query.orid;

    let [myCouponDetailArray] = await pool.execute(
        'SELECT order_product.* , order_shipment.name AS shipment , order_pay_method.name AS pay_method ,order_pay_state.name AS pay_state , order_state.name AS order_state FROM order_product JOIN order_shipment ON order_product.shipment = order_shipment.id JOIN order_pay_method ON order_product.pay_method = order_pay_method.id JOIN order_pay_state ON order_product.pay_state = order_pay_state.id JOIN order_state ON order_product.order_state = order_state.id WHERE order_product.id = ? ORDER BY create_time',
        [orid]
    );
    let detail = myCouponDetailArray[0];

    let [content] = await pool.execute('SELECT order_product_detail.* FROM order_product_detail WHERE order_product_detail.order_id=?', [orid]);

    res.json({ detail, content });
});

//SELECT order_product.* , order_shipment.name AS shipment , order_pay_method.name AS pay_method ,order_pay_state.name AS pay_state , order_state.name AS order_state FROM order_product JOIN order_shipment ON order_product.shipment = order_shipment.id JOIN order_pay_method ON order_product.pay_method = order_pay_method.id JOIN order_pay_state ON order_product.pay_state = order_pay_state.id JOIN order_state ON order_product.order_state = order_state.id;

module.exports = router;
