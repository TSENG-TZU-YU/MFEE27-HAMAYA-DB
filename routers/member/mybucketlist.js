const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

// 單筆 新增收藏 POST http://localhost:3001/api/member/mybucketlist
router.post('/', async (req, res, next) => {
    // TODO: 要在前端包成陣列送後端
    // data =[{
    //   user_id: , number
    //   product_id: , string
    //   category_id: , string
    // }]
    console.log('收藏 中間件', req.body);
    const data = req.body;
    console.log(data);

    try {
        // 確認 product_id 是否存在
        let [checkProductData] = await pool.execute('SELECT product.product_id FROM product WHERE product_id = ? UNION SELECT class.product_id FROM class WHERE product_id = ?', [
            data[0].product_id,
            data[0].product_id,
        ]);
        // 不存在: 回給前端
        if (checkProductData.length === 0) {
            return res.json({ message: '查無此商品!' });
        }
        // 確認 是否有加入過收藏 liked
        let [checkData] = await pool.execute('SELECT user_id, product_id FROM user_liked WHERE user_id = ? && product_id = ?', [data[0].user_id, data[0].product_id]);
        // 沒有: 進行新增
        if (checkData.length === 0) {
            // 寫入 user_liked 資料表
            await pool.execute('INSERT INTO user_liked (user_id, product_id, category_id) VALUES (?, ?, ?)', [data[0].user_id, data[0].product_id, data[0].category_id]);

            // 再去拿一次資料回給前端 要放在愛心icon上 ui顯示已收藏
            let [response_product] = await pool.execute(
                `SELECT user_liked.*, product.product_id,product.name,product.price,product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id= ?`,
                [data[0].user_id]
            );

            let [response_class] = await pool.execute(
                `SELECT user_liked.*, class.product_id,class.name,class.price,class.start_date,class.end_date,class.deadline,class.teacher,class.stock,class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id= ?`,
                [data[0].user_id]
            );

            res.json({ message: '加入收藏', product: response_product, class: response_class });
        }
    } catch (err) {
        res.status(404).json({ message: '加入收藏失敗' });
        console.log('失敗了');
    }
});

// 單筆 取消收藏 DELETE http://localhost:3001/api/member/mybucketlist/:id
router.delete('/', async (req, res, next) => {
    const user_id = req.session.member.id;
    const product_id = req.params.id;
    console.log(user_id);
    console.log(product_id);
    try {
        await pool.execute(`DELETE FROM user_liked WHERE user_id = ? && product_id = ?`, [user_id, product_id]);

        // 再去拿一次資料回給前端 要放在愛心icon上 ui顯示已收藏
        let [response_product] = await pool.execute(
            `SELECT user_liked.*, product.product_id,product.name,product.price,product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id= ?`,
            [user_id]
        );

        let [response_class] = await pool.execute(
            `SELECT user_liked.*, class.product_id,class.name,class.price,class.start_date,class.end_date,class.deadline,class.teacher,class.stock,class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id= ?`,
            [user_id]
        );

        res.json({ message: '取消收藏', product: response_product, class: response_class });
    } catch (err) {
        res.status(404).json({ message: '取消收藏失敗' });
    }
});

router.delete('/delete', async (req, res, next) => {
    console.log('多筆移除收藏', req.body); //[ [ 2, 'B1' ], [ 2, 'B2' ] ]
    const user_id = req.session.member.id;
    // const product_id = req.params.id;
    // console.log(user_id);
    // console.log(product_id);
    try {
        for (let i = 0; i < req.body.length; i++) {
            await pool.query(`DELETE FROM user_liked WHERE user_id = ? && product_id = ?`, req.body[i]);
        }
        // 再去拿一次資料回給前端 要放在愛心icon上 ui顯示已收藏
        let [response_product] = await pool.execute(
            `SELECT user_liked.*, product.product_id,product.name,product.price,product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id= ?`,
            [user_id]
        );

        let [response_class] = await pool.execute(
            `SELECT user_liked.*, class.product_id,class.name,class.price,class.start_date,class.end_date,class.deadline,class.teacher,class.stock,class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id= ?`,
            [user_id]
        );

        res.json({ message: '取消收藏', product: response_product, class: response_class });
    } catch (err) {
        res.status(404).json({ message: '取消收藏失敗' });
    }
});
// 多筆 INSERT POST

//查詢
router.get('/:id', async (req, res, next) => {
    console.log('查詢bucket user_id req.params', req.params);
    // SELECT * FROM `user_liked` WHERE user_id = 2
    const user_id = req.params.id;

    let [response_product] = await pool.execute(
        `SELECT user_liked.*, product.product_id,product.name,product.price,product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id= ?`,
        [user_id]
    );

    let [response_class] = await pool.execute(
        `SELECT user_liked.*, class.product_id,class.name,class.price,class.start_date,class.end_date,class.deadline,class.teacher,class.stock,class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id= ?`,
        [user_id]
    );
    const response = response_product.concat(response_class);
    console.log('response', response);
    if (response) {
        res.json({ user_id: user_id, message: 'GET 收藏 資料成功', myBucketList: response, product: response_product, class: response_class });
    } else {
        res.json({ message: 'NOT GET 購物車資料 可能資料表為空' });
    }
});

module.exports = router;
