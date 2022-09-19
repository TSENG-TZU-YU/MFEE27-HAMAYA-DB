const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

// 評價 post
// http://localhost:3001/api//member/myclass
router.post('/', async (req, res, next) => {
    const data = req.body;
    try {
        // 是否有重複
        let [checkData] = await pool.execute('SELECT * FROM class_evaluation WHERE class_product_id = ? AND member_id = ?', [data.classProduct, data.memberID]);
        console.log('checkData.length', checkData.length);
        // 沒有重複才能新增
        if (checkData.length === 0) {
            let [saveEvaluation] = await pool.execute(`INSERT INTO class_evaluation (class_product_id,member_id,rating, content) VALUE (?,?,?,?)`, [
                data.classProduct,
                data.memberID,
                data.rating,
                data.content,
            ]);
            res.json({ message: '評價成功' });
        }
        if (checkData.length > 0) {
            res.json({ message: '已經評價過了' });
        }
    } catch (err) {
        res.status(404).json({ message: '評價失敗' });
    }
});
// 評價 get
// http://localhost:3001/api//member/myclass
router.get('/:memberId', async (req, res, next) => {
    const memberId = req.params.memberId;
    let [data] = await pool.execute('SELECT * FROM  class_evaluation WHERE member_id=?', [memberId]);
    console.log(' memberId', memberId);
    console.log('data', data);

    res.json(data);
});

module.exports = router;
