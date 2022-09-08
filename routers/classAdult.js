// 啟用 express
const express = require('express');
const router = express.Router();

const pool = require('../utils/db');

// http://localhost:3001/class/list/Adult
router.get('/class/list/Adult', async (req, res, next) => {
    let [data] = await pool.execute(`SELECT class.*,class_img.* FROM class JOIN class_img ON class.id=class_img.id WHERE class.id`);
    res.json(data);
});

// 匯出給別人用
module.exports = router;
