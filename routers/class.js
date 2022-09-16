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

    //AND class_img.main_image=1 限制圖片
    //ORDER BY  class.start_date
    // class.product_id=class_img.product_id
    let [data] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE  class.ins_main_id=? && valid=1  `, [
        classCategory,
    ]);

    // 把取得的資料回覆給前端
    res.json(data);
});

// 列出某個課程
// http://localhost:3001/api/class/list/1
router.get('/list/:classDetailID', async (req, res, next) => {
    // 使用網址 params
    const classDetailID = req.params.classDetailID;
    console.log(classDetailID);
    // const page = req.query.page;

    let [data] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.id=? `, [classDetailID]);

    function generateRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    let [data2] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.id=?  `, [generateRandomInt(10)]);
    let [data3] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.id=?  `, [generateRandomInt(10)]);
    let [data4] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.id=?  `, [generateRandomInt(10)]);
    let [data5] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.id=?  `, [generateRandomInt(10)]);

    res.json({
        data,
        dataALL: {
            data2,
            data3,
            data4,
            data5,
        },
    });
});

// 列出老師
router.get('/', async (req, res, next) => {
    let [data] = await pool.execute(`SELECT * FROM teacher WHERE  teacher.id && valid=1 ORDER BY teacher.id DESC`);

    res.json(data);
});

// 列出某個老師
// http://localhost:3001/api/class/teacher/1
router.get('/teacher/:teacherDetailID', async (req, res, next) => {
    const teacherDetailID = req.params.teacherDetailID;
    console.log('teacherDetailID', teacherDetailID);
    let [data] = await pool.execute(`SELECT * FROM teacher WHERE  teacher.id=?  `, [teacherDetailID]);

    res.json(data);
});
// 匯出
module.exports = router;
