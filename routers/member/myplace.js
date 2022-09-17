const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//讀取場地表單
router.get('/loading', async (req, res, next) => {
    console.log('loading myPlace');
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=?', [req.session.member.id]);

    res.json(myPlace);
});

module.exports = router;
