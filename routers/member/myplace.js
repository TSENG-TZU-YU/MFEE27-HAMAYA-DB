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

//新增回覆
//http://localhost:3001/api/member/myquestion/reply
router.post('/reply', async (req, res, next) => {
    console.log('reply myQuestion');
    console.log('data:', req.body);
    console.log('name:', req.session.member.fullName);
    // const qaid = req.query.qaid;
    // if (!req.session.member) {
    //     return res.status(401).json({ message: '已登出請重新登入' });
    // }

    let [content] = await pool.execute('INSERT INTO venue_detail (place_rt_id, name, place_content) VALUES (?, ?, ?)', [
        req.body.place_rt_id,
        req.session.member.fullName,
        req.body.place_content,
    ]);

    //請管理員更新資料庫

    res.json({ message: 'OK' });
});

module.exports = router;
