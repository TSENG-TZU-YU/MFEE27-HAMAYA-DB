const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//撈出文章的id與種類
router.get('/', async (req, res, next) => {
    let [News] = await pool.execute('SELECT * FROM article_category');
    console.log('result', News);
    console.log(News);
    res.json({ News });
});

//關聯資料表
router.get('/news/articles', async (req, res, next) => {
    let [NewsArticles] = await pool.execute('SELECT * FROM article');
    console.log('result', NewsArticles);
    console.log(NewsArticles);
    res.json({ NewsArticles });
});

module.exports = router;
