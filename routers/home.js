const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// http://localhost:3001/api/home/21?mainId=3
router.get('/:content', async (req, res, next) => {
    const content = req.params.content;
    const mainId = req.query.mainId;
    if (!content == 'null') {
        let [data] = await pool.execute(
            'SELECT article.*, article_category.id AS category, article_category.name AS articleName FROM article  JOIN article_category ON article.category=article_category.id WHERE article.id=8',
            [content]
        );

        let [read] = await pool.execute(
            'SELECT article.*, article_category.id AS category, article_category.name AS articleName FROM article JOIN article_category ON article.category=article_category.id WHERE article.category=4 && valid = 1 ORDER BY RAND() LIMIT 3',
            [mainId]
        );
        res.json({ data, read });
        return;
    }
});
module.exports = router;
