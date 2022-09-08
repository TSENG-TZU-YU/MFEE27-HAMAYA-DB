const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

router.post('/rent', (req, res, next) => {
    console.log('123', req.body);
    // const datetime = req.rent.usedate + req.rent.time
    // console.log(datetime);
    // let [data] = await pool.execute(`INSERT INTO venue_reservation `);
    // console.log('1');
    res.json({ message: 'ok' });
});

module.exports = router;
