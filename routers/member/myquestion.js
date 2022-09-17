const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//讀取我的問題
//http://localhost:3001/api/member/myquestion
router.get('/loading', async (req, res, next) => {
    console.log('loading myQuestion');
    let [myQuestion] = await pool.execute('SELECT user_qna.*  FROM user_qna WHERE user_id=? ORDER BY create_time DESC', [req.session.member.id]);
    res.json(myQuestion);
});

module.exports = router;
