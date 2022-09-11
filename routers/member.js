const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//登入驗證
router.get('/', (req, res, next) => {
    console.log('check Login');
    console.log(req.session.member);
    if (!req.session.member) {
        return res.status(401).json({ message: '尚未登入' });
    }
    console.log(req.session);
    res.json(req.session.member);
});

router.get('/profile', (req, res, next) => {
    console.log('check Login');
    console.log(req.session.member);
    if (!req.session.member) {
        return res.status(401).json({ message: '尚未登入' });
    }
    console.log(req.session);
    res.json(req.session.member);
});

router.get('/password', (req, res, next) => {
    console.log('check Login');
    console.log(req.session.member);
    if (!req.session.member) {
        return res.status(401).json({ message: '尚未登入' });
    }
    console.log(req.session);
    res.json(req.session.member);
});

module.exports = router;
