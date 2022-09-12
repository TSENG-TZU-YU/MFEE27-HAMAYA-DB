const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

router.put('/ask', async (req, res, next) => {
    console.log('123', req.body);
    await pool.execute('INSERT INTO user_qna (name, user_id, email, phone, q_category, title, comment) VALUES (?, ?, ?, ?, ?, ?, ?);', [
        req.body.fullName,
        req.body.user_id,
        req.body.email,
        req.body.phone,
        req.body.q_category,
        req.body.title,
        req.body.comment,
    ]);
    res.json({ message: 'ok' });
});

module.exports = router;
