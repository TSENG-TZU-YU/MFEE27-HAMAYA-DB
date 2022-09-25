const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

//localhost:3001/api/home/21?mainId=3
router.get('/:content', async (req, res, next) => {
    const content = req.params.content;
    const mainId = req.query.mainId;
    let [data] = await pool.execute(
        'SELECT article.*, article_category.id AS category, article_category.name AS articleName FROM article  JOIN article_category ON article.category=article_category.id WHERE article.id=15',
        [content]
    );

    let [read] = await pool.execute(
        'SELECT article.*, article_category.id AS category, article_category.name AS articleName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=4 && valid = 1 ORDER BY RAND() LIMIT 2',
        [mainId]
    );
    //TODO:slider的api
    //輪播資料在這邊
    let [slider] = await pool.execute('SELECT article.id, article.category,article.creation_date,article.title FROM `article` WHERE category=1 LIMIT 1', [content]);
    res.json({ data, read, slider });
});
module.exports = router;
