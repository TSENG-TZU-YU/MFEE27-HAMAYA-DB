// 啟用 express
const express = require('express');
const router = express.Router();

const pool = require('../utils/db');

// 列出所有課程
// http://localhost:3001/api/class/list?class=1
router.get('/list?:category', async (req, res, next) => {
    // 使用數字 query
    const classCategory = req.query.class;

    let [data] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE  class.ins_main_id=? && valid=1  `, [
        classCategory,
    ]);

    // 把取得的資料回覆給前端
    res.json(data);
});

// 列出某個課程
// http://localhost:3001/api/class/list/1
router.get('/list/:classDetailID', async (req, res, next) => {
    const classCategory = req.query.class;
    // 使用網址 params
    const classDetailID = req.params.classDetailID;
    console.log('classCategory', classCategory);

    let [data] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.id=? && valid=1 `, [
        classDetailID,
    ]);

    let [dataImg] = await pool.execute('SELECT image_1, image_2, image_3 FROM class_img WHERE class_img.id= ?', [classDetailID]);

    let [recommendClass] = await pool.execute(
        `SELECT class.*,class_img.product_id,class_img.image_1  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.ins_main_id=? ORDER BY RAND() LIMIT 4`,
        [classCategory]
    );

    res.json({ data, dataImg, recommendClass });
});

// 列出老師 + 最新音樂文章
router.get('/', async (req, res, next) => {
    let [teacher] = await pool.execute(`SELECT * FROM teacher WHERE  teacher.id && valid=1 ORDER BY teacher.id DESC`);

    // article、article_img、article_category  關聯
    let [article] = await pool.execute(
        `SELECT article.*,article_img.*,article_category.* FROM article JOIN article_img ON article.id=article_img.id  JOIN article_category ON article.category=article_category.id  WHERE article.category=4 ORDER BY article.creation_date DESC LIMIT 3 OFFSET 1`
    );
    let [article1] = await pool.execute(
        `SELECT article.*,article_img.*,article_category.* FROM article JOIN article_img ON article.id=article_img.id  JOIN article_category ON article.category=article_category.id  WHERE article.category=4 ORDER BY article.creation_date DESC LIMIT 1`
    );
    res.json({ teacher, article, article1 });
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
