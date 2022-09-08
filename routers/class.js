// 啟用 express
const express = require('express');
const router = express.Router();

const pool = require('../utils/db');

// http://localhost:3001/api/class/list?class=1
router.get('/list?:category', async (req, res, next) => {
    const classCategory = req.query.class;
    console.log(classCategory);
    // const page = req.query.page;

    // let [data] = await pool.execute(`SELECT class.*,class_img.* FROM class JOIN class_img ON class.id=class_img.id WHERE class.id`);
    let [data] = await pool.execute(`SELECT * FROM class WHERE  class.ins_main_id=?`, [classCategory]);

    res.json(data);
});

// 匯出給別人用
module.exports = router;
