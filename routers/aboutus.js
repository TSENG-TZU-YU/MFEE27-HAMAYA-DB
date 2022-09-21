const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

router.post('/ask', async (req, res, next) => {
    console.log('444', req.body);

    try {
        const emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
        const askerros = {};
        if (req.body.fullName === '') {
            askerros.fullName = '請填入姓名';
        }
        if (req.body.phone === '') {
            askerros.phone = '請填入連絡電話';
        }
        if (req.body.email === '') {
            askerros.email = '請輸入信箱';
        } else if (req.body.email.search(emailRule) != -1) {
            console.log('yes');
        } else {
            askerros.email = '請輸入正確格式';
        }
        if (req.body.q_category == '0') {
            askerros.q_category = '請選擇問題類型';
        }
        if (req.body.title === '') {
            askerros.title = '請填寫問題主旨';
        }
        if (req.body.comment === '') {
            askerros.comment = '請填寫提問內容';
        }
        console.log('erromessage', Object.keys(askerros).length);

        if (Object.keys(askerros).length != 0) {
            res.status(401).json(askerros);
            return;
        }
        let [result] = await pool.execute('INSERT INTO user_qna (name, user_id, email, phone, q_category, title, comment) VALUES (?, ?, ?, ?, ?, ?, ?);', [
            req.body.fullName,
            req.body.user_id,
            req.body.email,
            req.body.phone,
            req.body.q_category,
            req.body.title,
            req.body.comment,
        ]);
        await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?);', [result.insertId, req.body.fullName, req.body.comment]);
        res.json({ message: 'ok' });
    } catch (err) {
        console.log();
    }
});

module.exports = router;
