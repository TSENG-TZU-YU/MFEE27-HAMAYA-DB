const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//一般問答
//http://localhost:3001/api/admin/customerservice/commonqa/loading
router.get('/commonqa/loading', async (req, res, next) => {
    console.log('loading commonqa');
    let [commonqa] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id ORDER BY create_time DESC'
    );
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

    let [content] = await pool.execute('SELECT * FROM user_qna_detail WHERE user_qna_id=?', [nlid]);

    res.json({ detail, content });
});

//一般問答 新增回覆
//http://localhost:3001/api/admin/customerservice/commonqa/reply
router.post('/commonqa/reply', async (req, res, next) => {
    console.log('reply commonqa');
    console.log('data:', req.body);

    //輸入內容不能為空
    if (req.body.q_content === '') {
        return res.status(401).json({ message: '不能為空值' });
    }
    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE user_qna SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE id=?', ['已回覆', '已回覆', now, req.body.user_qna_id]);

    //新增對話
    let [content] = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [req.body.user_qna_id, '客服小編', req.body.q_content]);

    //請會員更新資料庫
    req.app.io.emit(`userid${req.body.user_id}`, { newMessage: true });

    res.json({ message: 'OK' });
});

//訂單問答
//http://localhost:3001/api/admin/customerservice/orderqa/loading
router.get('/orderqa/loading', async (req, res, next) => {
    console.log('loading orderqa');
    let [orderqa] = await pool.execute(
        'SELECT order_qna.*, order_q_category.name AS q_category ,users.email ,users.phone FROM order_qna JOIN order_q_category ON order_qna.q_category = order_q_category.id JOIN users ON order_qna.user_id = users.id ORDER BY create_time DESC'
    );
    res.json(orderqa);
});
//訂單問答 詳細
//http://localhost:3001/api/admin/customerservice/orderqa/detail?orid=${data.id}
router.get('/orderqa/detail', async (req, res, next) => {
    console.log('loading orderqa detail');
    const orid = req.query.orid;

    let [myQuestionDetailArray] = await pool.execute(
        'SELECT order_qna.*, order_q_category.name AS q_category, users.email, users.phone FROM order_qna JOIN order_q_category ON order_qna.q_category = order_q_category.id JOIN users ON order_qna.user_id = users.id WHERE order_qna.order_id=? ORDER BY create_time DESC',
        [orid]
    );
    let detail = myQuestionDetailArray[0];

    let [content] = await pool.execute('SELECT * FROM order_qna_detail WHERE order_id=?', [orid]);
    // console.log({ detail, content });
    res.json({ detail, content });
});
//訂單問答 新增回覆
//http://localhost:3001/api/admin/customerservice/commonqa/reply
router.post('/orderqa/reply', async (req, res, next) => {
    console.log('reply orderqa');
    console.log('data:', req.body);

    //輸入內容不能為空
    if (req.body.q_content === '') {
        return res.status(401).json({ message: '不能為空值' });
    }
    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE order_qna SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE order_id=?', ['已回覆', '已回覆', now, req.body.order_id]);

    //新增對話
    let [content] = await pool.execute('INSERT INTO order_qna_detail (order_id, name, q_content) VALUES (?, ?, ?)', [req.body.order_id, '客服小編', req.body.q_content]);

    //請會員更新資料庫
    req.app.io.emit(`userid${req.body.user_id}`, { newMessage: true });

    res.json({ message: 'OK' });
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

    //輸入內容不能為空
    if (req.body.place_content === '') {
        return res.status(401).json({ message: '不能為空值' });
    }

    let [content] = await pool.execute('INSERT INTO venue_detail (place_rt_id, name, place_content) VALUES (?, ?, ?)', [req.body.place_rt_id, '客服小編', req.body.place_content]);

    const now = new Date();
    await pool.execute('UPDATE venue_reservation SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE id=?', ['已回覆', '未回覆', now, req.body.place_rt_id]);
    //請會員更新資料庫
    req.app.io.emit(`userid${req.body.user_id}`, { newMessage: true });

    res.json({ message: 'OK' });
});

module.exports = router;
