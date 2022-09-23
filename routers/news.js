const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//撈出文章的id與種類 GET/news種類for前端的NEWs切換頁
// http://localhost:3001/api/news?categoryId=4
// TODO:更改到資料庫的日期時間，要提醒大家更改
router.get('/', async (req, res, next) => {
    const categoryId = req.query.categoryId;
    if (categoryId) {
        let [data] = await pool.execute(
            `SELECT article.id, article.author, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? ORDER BY article.creation_date DESC LIMIT 6`,
            [categoryId]
        );
        let [news] = await pool.execute(
            `SELECT article.id, article.author, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=2 ORDER BY article.creation_date DESC LIMIT 1`,
            [categoryId]
        );
        //TODO:抓到每個種類的最新一筆，但關聯不到種類名稱
        // let [news2] = await pool.execute(
        //     'SELECT * FROM article as t1 WHERE EXISTS (select article.category,max(creation_date) as article_category FROM article group by article.category having t1.category = article.category and t1.creation_date =max(creation_date)) ORDER BY creation_date DESC LIMIT 3',
        //     [categoryId]
        // );

        res.json({ data, news });
        return;
    }
    let [data] = await pool.execute(
        `SELECT article.id, article.author, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=1 ORDER BY article.creation_date DESC LIMIT 6`
    );
    let [news] = await pool.execute(
        `SELECT article.id, article.author, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=2 ORDER BY article.creation_date DESC LIMIT 1`
    );
    res.json({ data, news });
});

// http://localhost:3001/api/news/section?categoryList=4
// TODO:要將categoryid與articleid改名
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

// http://localhost:3001/api/news/21?mainId=3
// 可以先console.log看req的是收到body params query哪一種值
//文章頁的資料與下面三個隨機的文章
router.get('/:content', async (req, res, next) => {
    console.log('content', req);
    console.log('mainId', req);
    const content = req.params.content;
    const mainId = req.query.mainId;
    let [data] = await pool.execute(
        `SELECT article.*, article_category.id AS category,  article_category.name AS articleName FROM article  JOIN article_category ON article.category=article_category.id WHERE article.id=?`,
        [content]
    );

    let [read] = await pool.execute(
        'SELECT article.*, article_category.id AS category, article_category.name AS articleName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=? && valid = 1 ORDER BY RAND() LIMIT 3',
        [mainId]
    );
    res.json({ data, read });
});

//TODO:多做的等等再更改
// router.get('/', async (req, res, next) => {
//     const activity = req.query.activity;
//     let [news] = await pool.execute(
//         `SELECT article.id, article.author, article.image, article.title, article.creation_date, article_category.id AS categoryId, article_category.name As categoryName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=2 ORDER BY article.creation_date DESC LIMIT 1`,
//         [activity]
//     );
//     res.json({ news });
// });

//匯出
module.exports = router;
