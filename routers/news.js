const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//撈出文章的id與種類 GET/news種類for前端的NEWs切換頁
// http://localhost:3001/api/news?categoryId=4
router.get('/', async (req, res, next) => {
    const categoryId = req.query.categoryId;
    if (categoryId) {
        let [data] = await pool.execute(
            `SELECT article.id, article.author, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 6`,
            [categoryId]
        );
        res.json({ data });
        return;
    }
    let [data] = await pool.execute(
        `SELECT article.id, article.author, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=1 ORDER BY article.creation_date DESC LIMIT 6`
    );
    res.json({ data });
});

// http://localhost:3001/api/news/section?categoryList=4
//TODO:要將categoryid與articleid改名
//TODO:改了資料庫作者的欄位名稱，要跟大家說
router.get('/section?:categoryList', async (req, res, next) => {
    const categoryList = req.query.categoryList;
    let [data] = await pool.execute(
        `SELECT article.id, article.author, article.image, article.title, article.content, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 2`,
        [categoryList]
    );

    let [SmallArticles] = await pool.execute(
        `SELECT article.id, article.author, article.image, article.title, article.content, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 30 OFFSET 2`,
        [categoryList]
    );

    res.json({ data, SmallArticles });
});

module.exports = router;
