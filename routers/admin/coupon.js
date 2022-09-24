const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//讀取優惠券
//http://localhost:3001/api/admin/coupon/loading
router.get('/loading', async (req, res, next) => {
    console.log('loading coupon');
    let [result] = await pool.execute('SELECT * FROM coupon ORDER BY create_time DESC');
    // io.on('connection', (socket) => {
    //     socket.emit(`userid${req.data.id}`, '連線成功');
    // });
    res.json(result);
});
//優惠券詳細
//http://localhost:3001/api/admin/coupon/detail?cpid=${data.id}
router.get('/detail', async (req, res, next) => {
    console.log('loading coupon detail');
    const nlid = req.query.nlid;

    let [myQuestionDetailArray] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id WHERE user_qna.id=?',
        [nlid]
    );
    let detail = myQuestionDetailArray[0];

    // if (!myQuestionDetailArray) {
    //     return res.status(401).json({ message: '僅能查看本人詳細問答' });
    // }
    let [content] = await pool.execute('SELECT * FROM user_qna_detail WHERE user_qna_id=?', [nlid]);

    res.json({ detail, content });
});

//新增優惠券
router.post('/add', async (req, res, next) => {
    console.log('add coupon');
    // console.log(req);
    //表單驗證
    if (req.body.name === '') {
        return res.status(401).json({ message: '請填寫優惠券名稱' });
    }
    if (req.body.sn === '') {
        return res.status(401).json({ message: '請填寫優惠券序號' });
    }
    if (req.body.minimum === '') {
        return res.status(401).json({ message: '請填寫優惠券最低金額' });
    }
    if (req.body.discount === '') {
        return res.status(401).json({ message: '請填寫優惠券折扣金額' });
    }

    const starTime = new Date(req.body.start_time).getTime();
    console.log('starTime', starTime);
    const endTime = new Date(req.body.end_time).getTime();
    console.log('endTime', endTime);
    if (starTime >= endTime) {
        return res.status(401).json({ message: '開始時間必須在結束時間之前' });
    }
    //檢查SN是否重複
    let [checkSN] = await pool.execute('SELECT id FROM coupon WHERE sn = ?', [req.body.sn]);
    if (checkSN.length > 0) {
        return res.status(400).json({ message: '這個序號已經建立過' });
    }

    if (req.body.user_email != '') {
        //抓取會員ID
        let [members] = await pool.execute('SELECT id FROM users WHERE email = ?', [req.body.user_email]);
        let user_id = members[0].id;
        // console.log('user_id', user_id);

        let [result] = await pool.execute('INSERT INTO coupon (name, sn, minimum, discount, use_count, take_count, start_time,end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [
            req.body.name,
            req.body.sn,
            req.body.minimum,
            req.body.discount,
            1,
            0,
            req.body.start_time,
            req.body.end_time,
        ]);

        let [result2] = await pool.execute('INSERT INTO coupon_detail (coupon_id	, user_id) VALUES ( ?, ?)', [result.insertId, user_id]);

        return res.json({ message: '新增成功' });
    }

    if (req.body.use_count === '') {
        return res.status(401).json({ message: '請填寫優惠券使用次數' });
    }

    let [result] = await pool.execute('INSERT INTO coupon (name, sn, minimum, discount, use_count, take_count, start_time,end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [
        req.body.name,
        req.body.sn,
        req.body.minimum,
        req.body.discount,
        req.body.use_count,
        req.body.use_count,
        req.body.start_time,
        req.body.end_time,
    ]);
    console.log('insert new coupon', result);

    res.json({ message: '新增成功' });
});

module.exports = router;
