const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//撈出文章的id與種類 GET/news種類
router.get('/', async (req, res, next) => {
    const categoryId = req.query.categoryId;
    if (categoryId) {
        let [data] = await pool.execute(
            `SELECT article.id, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 6`,
            [categoryId]
        );
        res.json({ data });
        return;
    }
    let [data] = await pool.execute(
        `SELECT article.id, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=1 ORDER BY article.creation_date DESC LIMIT 6`
    );
    res.json({ data });
});

//撈出文章的id與種類 GET/news種類
// http://localhost:3001/api/news/section?news=1
// router.get('/section?:category', async (req, res, next) => {
//     const NewsCategory = req.query.news;
//     let [data] = await pool.execute(
//         `SELECT article.id, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 6`,
//         [NewsCategory]
//     );

//     // 把取得的資料回覆給前端
//     res.json(data);
// });

// //關聯資料表
// router.get('/news/articles', async (req, res, next) => {
//     let [NewsArticles] = await pool.execute('SELECT * FROM article');
//     console.log('result', NewsArticles);
//     console.log(NewsArticles);
//     res.json({ NewsArticles });
// });

module.exports = router;
