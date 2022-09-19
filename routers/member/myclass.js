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

    // 已完成課程
    let [finishClass] = await pool.execute(
        `SELECT order_product_detail.* , order_product.user_id ,class.teacher,class.start_date,class.end_date ,class_img.image_1 FROM order_product_detail JOIN order_product ON order_product_detail.order_id=order_product.order_id JOIN class ON order_product_detail.product_id=class.product_id JOIN class_img ON order_product_detail.product_id=class_img.product_id WHERE  order_product_detail.category_id = 'B' && class.end_date<NOW() `
    );
    // 開課中
    let [buyClass] = await pool.execute(
        `SELECT order_product_detail.* , order_product.user_id ,class.teacher,class.start_date,class.end_date ,class_img.image_1 FROM order_product_detail JOIN order_product ON order_product_detail.order_id=order_product.order_id JOIN class ON order_product_detail.product_id=class.product_id JOIN class_img ON order_product_detail.product_id=class_img.product_id WHERE  order_product_detail.category_id = 'B' && class.end_date>NOW() `
    );
    console.log('buyClass', buyClass);
    res.json({ data, buyClass, finishClass });
});

module.exports = router;
