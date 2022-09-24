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
    let [maxPrice] = await pool.execute(`SELECT MAX(price) AS maxPrice From class WHERE valid=1 GROUP BY ins_main_id `);

    let [minPrice] = await pool.execute(`SELECT MIN(price) AS minPrice From class WHERE valid=1 GROUP BY ins_main_id `);

    // 把取得的資料回覆給前端
    res.json({ data, maxPrice, minPrice });
});

// 列出某個課程 +  取得會員評價
// http://localhost:3001/api/class/list/B1
router.get('/list/:classDetailID', async (req, res, next) => {
    const classCategory = req.query.class;
    // 使用網址 params
    const classDetailID = req.params.classDetailID;
    console.log('classDetailID', classDetailID);

    // 課程
    let [data] = await pool.execute(`SELECT class.*,class_img.*  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.product_id=? && valid=1 `, [
        classDetailID,
    ]);

    let [dataImg] = await pool.execute('SELECT image_1, image_2, image_3 FROM class_img WHERE class_img.product_id= ?', [classDetailID]);

    let [recommendClass] = await pool.execute(
        `SELECT class.*,class_img.product_id,class_img.image_1  FROM class JOIN class_img ON  class.product_id=class_img.product_id WHERE class.ins_main_id=? ORDER BY RAND() LIMIT 4`,
        [classCategory]
    );

    // 會員評價
    let [evaluation] = await pool.execute(
        `SELECT order_product_detail.* , users.name , users.photo FROM order_product_detail JOIN users ON order_product_detail.member_id = users.id WHERE  order_product_detail.category_id = 'B'  && order_product_detail.product_id=? ORDER BY order_product_detail.evaluation_date DESC`,
        [classDetailID]
    );

    // 會員平均評價--只需要一筆
    let [avg] = await pool.execute(`SELECT  round(AVG(rating),0) AS rating, COUNT(member_id) AS member_id FROM order_product_detail  WHERE product_id=?`, [classDetailID]);

    // 會員平均評價--全部課程的評價
    await pool.execute(`select product_id, avg(rating) as rating,count(member_id) as member
    from order_product_detail d
    group by product_id`);

    res.json({ data, dataImg, recommendClass, evaluation, avg });
});

// 列出老師 + 最新音樂文章
router.get('/', async (req, res, next) => {
    let [teacher] = await pool.execute(`SELECT * FROM teacher WHERE  teacher.id && valid=1 ORDER BY teacher.id ASC`);

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
