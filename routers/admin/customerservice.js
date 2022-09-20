const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

router.get('/commonqa/loading', async (req, res, next) => {
    console.log('loading commonqa');
    console.log(req.session.member.id);
    let [commonqa] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id ORDER BY create_time DESC'
    );
    res.json(commonqa);
});

router.get('/commonqa/detail', async (req, res, next) => {
    console.log('loading commonqa detail');
    const nlid = req.query.nlid;
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);

    res.json(myPlace);
});

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
