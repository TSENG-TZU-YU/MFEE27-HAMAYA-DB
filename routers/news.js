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
router.get('/section', async (req, res, next) => {
    console.log('section', req);
    const categoryList = req.query.categoryList;
    console.log(categoryList);

    // if有category這個變數就跑以下第一支api
    if (categoryList !== 'null') {
        let [data] = await pool.execute(
            `SELECT article.id, article.author, article.image, article.title, article.content, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 2`,
            [categoryList]
        );

        let [SmallArticles] = await pool.execute(
            `SELECT article.id, article.author, article.image, article.title, article.content, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 30 OFFSET 2`,
            [categoryList]
        );

        res.json({ data, SmallArticles });
        return;
    }
    let [data] = await pool.execute(
        `SELECT article.id, article.author, article.image, article.title, article.content, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=1 ORDER BY article.creation_date DESC LIMIT 2`
    );

    let [SmallArticles] = await pool.execute(
        `SELECT article.id, article.author, article.image, article.title, article.content, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=1 ORDER BY article.creation_date DESC LIMIT 30 OFFSET 2`
    );

    res.json({ data, SmallArticles });
});

// http://localhost:3001/api/news/56
// 可以先console.log看req的是收到body params query哪一種值
router.get('/:content', async (req, res, next) => {
    console.log('content', req.params);
    const content = req.params.content;
    let [data] = await pool.execute(`SELECT * FROM article WHERE article.id=?`, [content]);

    res.json(data);
});

module.exports = router;
