const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//讀取優惠券
router.get('/mycoupon', async (req, res, next) => {
    console.log('loading myCoupon');
    // console.log(req.session.member);
    let [myCoupon] = await pool.execute('SELECT coupon_detail.* ,coupon.* FROM coupon_detail JOIN coupon ON coupon_detail.coupon_id  = coupon.id WHERE coupon_detail.user_id=? ', [
        req.session.member.id,
    ]);
    // let [myCoupon] = await pool.execute(
    //     'SELECT coupon.* ,coupon_detail.user_id FROM coupon JOIN coupon_detail ON coupon.id = coupon_detail.coupon_id WHERE coupon_detail.user_id=? ',
    //     [req.session.member.id]
    // );

    res.json(myCoupon);
});

//新增優惠券
router.post('/addcoupon', async (req, res, next) => {
    console.log('addcoupon ');
    //判斷是否有輸入
    if (!req.body.sn) {
        return res.status(401).json({ message: '不能為空值' });
    }
    //尋找輸入sn之優惠碼
    let [getcoupon] = await pool.execute('SELECT * FROM coupon WHERE sn=?', [req.body.sn]);
    if (getcoupon.length == 0) {
        return res.status(401).json({ message: '沒有此優惠碼' });
    }
    let coupon = getcoupon[0];
    //判斷優惠券剩餘領取次數
    if (coupon.take_count == 0) {
        return res.status(401).json({ message: '此優惠碼已達領取上限' });
    }
    //確認是否有領取過此優惠券
    let [result1] = await pool.execute('SELECT * FROM coupon_detail WHERE coupon_id=? AND user_id=?', [coupon.id, req.session.member.id]);
    console.log('result1', result1);
    if (result1.length > 0) {
        return res.status(401).json({ message: '已領取過此優惠券' });
    }
    //扣除此優惠碼可領取次數
    let new_take_count = Number(coupon.take_count) - 1;
    let result2 = await pool.execute('UPDATE coupon SET take_count=?  WHERE id=?', [new_take_count, coupon.id]);
    //新增優惠券持有人
    let result3 = await pool.execute('INSERT INTO coupon_detail (coupon_id, user_id) VALUES (?, ?);', [coupon.id, req.session.member.id]);
    res.json({ message: '優惠券新增成功' });
});

//使用優惠券

module.exports = router;
