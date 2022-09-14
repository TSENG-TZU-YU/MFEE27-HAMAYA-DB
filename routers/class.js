// 啟用 express
const express = require('express');
const router = express.Router();

const pool = require('../utils/db');

// 列出所有課程
// http://localhost:3001/api/class/list?class=1
router.get('/list?:category', async (req, res, next) => {
    // 使用數字 query
    const classCategory = req.query.class;
    console.log(classCategory);

    // 分頁
    let page = req.query.page || 1;
    // 每一頁拿幾筆資料
    const perPage = 6;
    // 取得總筆數
    let [total] = await pool.execute('SELECT COUNT(*) AS total FROM class WHERE class.ins_main_id=?', [classCategory]);
    total = total[0].total;

    // 計算總頁數 Math.ceil
    let lastPage = Math.ceil(total / perPage);
    // 計算 offset
    const offset = perPage * (page - 1);

    //AND class_img.main_image=1 限制圖片
    //ORDER BY  class.start_date
    let [data] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON class.id=class_img.id WHERE  class.ins_main_id=? && valid=1  `, [classCategory]);

    // 把取得的資料回覆給前端
    res.json(data);
    // res.json({
    //     pagination: {
    //         total, // 總共有幾筆
    //         perPage, // 一頁有幾筆
    //         page, // 目前在第幾頁
    //         lastPage, // 總頁數
    //     },
    //     data,
    // });
});

// 列出某個課程
router.get('/list/:classDetailID', async (req, res, next) => {
    // 使用網址 params
    const classDetailID = req.params.classDetailID;
    console.log(classDetailID);
    // const page = req.query.page;

    let [data] = await pool.execute(`SELECT * FROM class WHERE  class.id=? `, [classDetailID]);

    res.json(data);
});

// 列出老師
router.get('/', async (req, res, next) => {
    let [data] = await pool.execute(`SELECT * FROM teacher WHERE  teacher.id && valid=1 ORDER BY teacher.id DESC`);

    res.json(data);
});
// 匯出
module.exports = router;
