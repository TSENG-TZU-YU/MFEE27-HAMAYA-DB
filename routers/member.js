const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//讀取優惠券
router.post('/mycoupon', async (req, res, next) => {
    console.log('loading myCoupon');
    // console.log(req.session.member);
    let result = await pool.execute('SELECT * FROM coupon WHERE user_id = ?', [req.session.member.id]);

    res.json({ message: 'TEST myCoupon' });
});

//新增優惠券
router.post('/addcoupon', async (req, res, next) => {
    console.log('addcoupon ');
    console.log(req.session.member);

    let result = await pool.execute('UPDATE coupon SET take_count=?  WHERE id=?', [req.body, req.body]);
    let result2 = await pool.execute('UPDATE coupon_detail SET valid=? WHERE coupon_id=? AND user_id=?', [req.body, req.body, req.body]);

    console.log(req.session);
    res.json({ message: 'TEST myCoupon' });
});

//使用優惠券

module.exports = router;
