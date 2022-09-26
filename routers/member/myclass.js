const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

// 評價 post
// http://localhost:3001/api/member/myclass
router.patch('/', async (req, res, next) => {
    const data = req.body;

    try {
        // 是否有重複
        let [checkData] = await pool.execute('SELECT * FROM order_product_detail WHERE order_id=? && product_id = ? && member_id = ? ', [
            data.order,
            data.classProduct,
            data.memberID,
        ]);

        // 沒有重複才能新增
        if (checkData.length === 0) {
            let [saveEvaluation] = await pool.execute(`UPDATE order_product_detail SET member_id=?, rating=?, content=?, evaluation_date=? WHERE product_id=? && order_id=? `, [
                data.memberID,
                data.rating,
                data.content,
                data.date,
                data.classProduct,
                data.order,
            ]);
            res.json({ message: '評價成功' });
        } else {
            res.json({ message: '已經評價過了' });
        }
    } catch (err) {
        res.status(404).json({ message: '評價失敗' });
    }
});
// 評價 get
// http://localhost:3001/api/member/myclass/2
router.get('/:memberId', async (req, res, next) => {
    const memberId = req.params.memberId;

    // 開課中
    let [buyClass] = await pool.execute(
        `SELECT order_product_detail.* , order_product.user_id ,class.teacher ,class_img.image_1 FROM order_product_detail JOIN order_product ON order_product_detail.order_id=order_product.order_id JOIN class ON order_product_detail.product_id=class.product_id JOIN class_img ON order_product_detail.product_id=class_img.product_id  WHERE  order_product_detail.category_id = 'B' && order_product_detail.end_date > NOW() && order_product.user_id=?`,
        [memberId]
    );
    // 已完成課程
    let [finishClass] = await pool.execute(
        `SELECT order_product_detail.* , order_product.user_id ,class.teacher ,class.ins_main_id,class_img.image_1 FROM order_product_detail JOIN order_product ON order_product_detail.order_id=order_product.order_id JOIN class ON order_product_detail.product_id=class.product_id JOIN class_img ON order_product_detail.product_id=class_img.product_id  WHERE  order_product_detail.category_id = 'B' && order_product_detail.end_date < NOW() && order_product.user_id=? && order_product_detail.valid=1 `,
        [memberId]
    );
    // 會員平均評價 更新
    await pool.execute(
        `update class c join
            (select product_id, avg(rating) as rating ,count(member_id) as member from order_product_detail d group by  product_id ) r on c. product_id = r. product_id set c.rating =r.rating , c.member = r.member`
    );

    res.json({ buyClass, finishClass });
});

module.exports = router;
