const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//一般問答
//http://localhost:3001/api/admin/customerservice/commonqa/loading
router.get('/loading', async (req, res, next) => {
    console.log('loading coupon');
    let [result] = await pool.execute('SELECT * FROM coupon ORDER BY create_time DESC');
    // io.on('connection', (socket) => {
    //     socket.emit(`userid${req.data.id}`, '連線成功');
    // });
    res.json(result);
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

module.exports = router;
