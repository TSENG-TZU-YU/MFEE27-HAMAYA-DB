const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

router.get('/', (req, res, next) => {
    console.log('check Login');
    console.log(req.session.member);
    if (!req.session.member) {
        // 尚未登入
        return res.status(401).json({ message: '尚未登入' });
    }
    // 方法 1: 根據 session 中儲存的 member id 去撈資料庫，
    //        把資料庫裡會員的資料回覆給前端
    //        優點: 這樣做資料比較即時跟正確
    //        缺點: 一直去存取資料庫

    // 方法 2: 是可以直接回覆 session 裡的資料
    // Note: 如果有提供修改會員資料功能，更新成功後，要去更新 session
    console.log(req.session);
    res.json(req.session.member);
    // res.json({ message: 'ok' });
});

module.exports = router;
