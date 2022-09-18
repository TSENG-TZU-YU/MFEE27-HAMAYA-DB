const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//撈出文章的id與種類 GET/news種類
// router.get('/', async (req, res, next) => {
//     let [news] = await pool.execute(`SELECT * FROM article_category`);
//     console.log('result', news);
//     console.log(news);
//     res.json({ news });
// });

router.get('/', async (req, res, next) => {
    let [news] = await pool.execute(`SELECT * FROM article_category`);
    //     console.log('result', news);
    //     console.log(news);
    //     res.json({ news });
    let [news2] = await pool.execute(
        `SELECT article.title,article.creation_date,article_category.* FROM article JOIN article_category ON article.category=article_category.id  WHERE article.category=3 ORDER BY article.creation_date DESC LIMIT 6`
    );
    console.log('result', news2);
    console.log(news2);
    res.json({ news, news2 });
});

//關聯資料表
router.get('/news/articles', async (req, res, next) => {
    let [NewsArticles] = await pool.execute('SELECT * FROM article');
    console.log('result', NewsArticles);
    console.log(NewsArticles);
    res.json({ NewsArticles });
});

module.exports = router;
