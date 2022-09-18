const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//讀取我的問題
//http://localhost:3001/api/member/myquestion
router.get('/loading', async (req, res, next) => {
    console.log('loading myQuestion');
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    let [myQuestion] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id WHERE user_id=? ORDER BY create_time DESC',
        [req.session.member.id]
    );
    res.json(myQuestion);
});

//新增問題
router.post('/add', async (req, res, next) => {
    console.log('add myQuestion');
    //TODO:表單驗證
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    if (req.body.q_category == '0') {
        return res.status(401).json({ message: '請選擇問題類型' });
    }
    if (req.body.title === '') {
        return res.status(401).json({ message: '請填寫問題主旨' });
    }
    if (req.body.comment === '') {
        return res.status(401).json({ message: '請填寫完整內容' });
    }
    let result = await pool.execute('INSERT INTO user_qna (name, user_id, email, phone, q_category, title, comment) VALUES (?, ?, ?, ?, ?, ?, ?);', [
        req.session.member.fullName,
        req.session.member.id,
        req.session.member.email,
        req.session.member.phone,
        req.body.q_category,
        req.body.title,
        req.body.comment,
    ]);
    console.log('insert new Question', result);
    res.json({ message: '收到~小編會盡快回覆您的問題!!' });
});

//問題詳細
//http://localhost:3001/api/member/myquestion/detail?qaid=XXX
router.get('/detail', async (req, res, next) => {
    console.log('myQuestionDetail');
    const qaid = req.query.qaid;
    //TODO:檢驗是否為本人
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }

    let [myQuestionDetailArray] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id WHERE user_qna.id=? AND user_qna.user_id =?',
        [qaid, req.session.member.id]
    );
    let myQuestionDetail = myQuestionDetailArray[0];

    if (!myQuestionDetailArray) {
        return res.status(401).json({ message: '僅能查看本人詳細問答' });
    }

    let [myQuestionDetailContent] = await pool.execute('SELECT * FROM user_qna_detail WHERE user_qna_id=?', [qaid]);

    res.json({ myQuestionDetail, myQuestionDetailContent });
});

module.exports = router;