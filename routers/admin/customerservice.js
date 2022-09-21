const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

// const http = require('http');
// const server = http.createServer(router);
// const { Server } = require('socket.io');
// const io = new Server(server, {
//     cors: {
//         origin: ['http://localhost:3000'],
//         credentials: true,
//     },
// });

//一般問答
//http://localhost:3001/api/admin/customerservice/commonqa/loading
router.get('/commonqa/loading', async (req, res, next) => {
    console.log('loading commonqa');
    let [commonqa] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id ORDER BY create_time DESC'
    );
    // io.on('connection', (socket) => {
    //     socket.emit(`userid${req.data.id}`, '連線成功');
    // });
    res.json(commonqa);
});
//一般問答 詳細
//http://localhost:3001/api/admin/customerservice/commonqa/detail?nlid=${data.id}
router.get('/commonqa/detail', async (req, res, next) => {
    console.log('loading commonqa detail');
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

////一般問答 新增回覆
//http://localhost:3001/api/admin/customerservice/commonqa/reply
router.post('/commonqa/reply', async (req, res, next) => {
    console.log('reply commonqa');
    console.log('data:', req.body);
    // console.log('name:', req.session.member.fullName);
    // const qaid = req.query.qaid;
    // if (!req.session.member) {
    //     return res.status(401).json({ message: '已登出請重新登入' });
    // }

    let [content] = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [req.body.user_qna_id, '客服小編', req.body.q_content]);

    //請會員更新資料庫
    req.app.io.emit(`userid${req.body.user_id}`, { updateMyQA: true });
    // io.on('connection', (socket) => {
    //     console.log('123456');
    //     socket.emit(`userid${req.body.user_id}`, '請更新資料庫');
    // });

    res.json({ message: 'OK' });
});

//訂單問答
router.get('/orderqa/loading', async (req, res, next) => {
    console.log('loading orderqa');
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);

    res.json(myPlace);
});
router.get('/orderqa/detail', async (req, res, next) => {
    console.log('loading orderqa detail');
    const orid = req.query.orid;
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);

    res.json(myPlace);
});

//場地問答
router.get('/placeqa/loading', async (req, res, next) => {
    console.log('loading placeqa');

    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` ORDER BY create_time DESC');

    res.json(myPlace);
});

//場地問答詳細
router.get('/placeqa/detail', async (req, res, next) => {
    console.log('loading placeqa detail');
    const plid = req.query.plid;
    console.log(plid);

    let [myPlaceDetailArray] = await pool.execute('SELECT * FROM `venue_reservation` WHERE id=? ORDER BY create_time DESC', [plid]);

    let detail = myPlaceDetailArray[0];
    console.log(detail);

    let [myPlace] = await pool.execute('SELECT * FROM `venue_detail` WHERE place_rt_id=?', [plid]);
    console.log(myPlace);

    res.json({ detail, myPlace });
});

////場地問答 新增回覆
//http://localhost:3001/api/admin/customerservice/commonqa/reply
router.post('/placeqa/reply', async (req, res, next) => {
    console.log('reply placeqa');
    console.log('data:', req.body);

    let [content] = await pool.execute('INSERT INTO venue_detail (place_rt_id, name, place_content) VALUES (?, ?, ?)', [req.body.place_rt_id, '客服小編', req.body.place_content]);

    //請會員更新資料庫
    // req.app.io.emit(`userid${req.body.user_id}`, { MyQuestionDetail: true });

    res.json({ message: 'OK' });
});

module.exports = router;
