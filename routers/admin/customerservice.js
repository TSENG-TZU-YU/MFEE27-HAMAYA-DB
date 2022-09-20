const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

const http = require('http');
const server = http.createServer(router);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000'],
        credentials: true,
    },
});

//一般問答
router.get('/commonqa/loading', async (req, res, next) => {
    console.log('loading commonqa');
    console.log(req.session.member.id);
    let [commonqa] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id ORDER BY create_time DESC'
    );
    // io.on('connection', (socket) => {
    //     socket.emit(`userid${req.data.id}`, '連線成功');
    // });
    res.json(commonqa);
});
//一般問答 詳細
router.get('/commonqa/detail', async (req, res, next) => {
    console.log('loading commonqa detail');
    const nlid = req.query.nlid;
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);
    io.on('connection', (socket) => {
        socket.emit(`userid${req.data.id}`, '連線成功');
    });
    res.json(myPlace);
});

////一般問答 新增回覆
router.post('/commonqa/reply', async (req, res, next) => {
    console.log('reply commonqa');
    console.log('data:', req.body);
    console.log('name:', req.session.member.fullName);
    // const qaid = req.query.qaid;
    // if (!req.session.member) {
    //     return res.status(401).json({ message: '已登出請重新登入' });
    // }

    let [content] = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [
        req.body.user_qna_id,
        req.session.member.fullName,
        req.body.q_content,
    ]);
    //請會員更新資料庫
    io.on('connection', (socket) => {
        socket.emit(`userid${req.data.id}`, '請更新資料庫');
    });

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
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);

    res.json(myPlace);
});
router.get('/placeqa/detail', async (req, res, next) => {
    console.log('loading placeqa detail');
    const plid = req.query.plid;
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);

    res.json(myPlace);
});

module.exports = router;
