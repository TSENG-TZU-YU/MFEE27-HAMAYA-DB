const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

router.put('/rent', async(req, res, next) => {
    console.log('123', req.body);
    await pool.execute('INSERT INTO venue_reservation (name, user_id, email, phone, usedate, item, comment, usercount) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [
        req.body.fullName,
        req.body.user_id,
        req.body.email,
        req.body.phone,
        req.body.usedate,
        req.body.item,
        req.body.comment,
        req.body.usercount,   
    ]);
    res.json({ message: 'ok' });
});

module.exports = router;
