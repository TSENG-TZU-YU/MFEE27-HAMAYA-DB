const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//讀取場地表單
router.get('/loading', async (req, res, next) => {
    console.log('loading myPlace');
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);

    res.json(myPlace);
});

//場地詳細
router.get('/detail', async (req, res, next) => {
    console.log('myPlaceDetail');
    const plid = req.query.plid;
    //TODO:檢驗是否為本人
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }

    let [myPlaceDetailArray] = await pool.execute('SELECT * FROM venue_reservation WHERE id=? AND user_id =?', [plid, req.session.member.id]);
    let detail = myPlaceDetailArray[0];

    if (!myPlaceDetailArray) {
        return res.status(401).json({ message: '僅能查看本人詳細問答' });
    }

    let [content] = await pool.execute('SELECT * FROM venue_detail WHERE place_rt_id=?', [plid]);

    res.json({ detail, content });
});

module.exports = router;
