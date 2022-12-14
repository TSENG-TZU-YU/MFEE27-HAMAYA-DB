const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

// 單筆 新增收藏 POST http://localhost:3001/api/member/mybucketlist
router.post('/', async (req, res, next) => {
    // 要在前端包成陣列送後端
    // data =[{
    //   user_id: , number
    //   product_id: , string
    //   category_id: , string
    // }]
    const data = req.body;
    // 單筆
    if (data.length === 1) {
        try {
            // 確認 product_id 是否存在
            let [checkProductData] = await pool.execute(
                'SELECT product.product_id FROM product WHERE product_id = ? UNION SELECT class.product_id FROM class WHERE product_id = ?',
                [data[0].product_id, data[0].product_id]
            );
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
                    `SELECT user_liked.*, product.product_id, product.name, product.price, product.stock, product.ins_main_id, product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id = ?`,
                    [data[0].user_id]
                );

                let [response_class] = await pool.execute(
                    `SELECT user_liked.*, class.product_id, class.name, class.price,class.stock, class.start_date, class.end_date, class.deadline, class.teacher, class.stock, class.ins_main_id, class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id = ?`,
                    [data[0].user_id]
                );
                res.json({ message: '成功加入收藏!', product: response_product, class: response_class });
            }
        } catch (err) {
            console.log(err);
        }
        return;
    }
    // 多筆
    if (data.length > 1) {
        try {
            for (let i = 0; i < data.length; i++) {
                // 確認 是否有加入過收藏 liked
                let [checkData] = await pool.execute('SELECT user_id, product_id FROM user_liked WHERE user_id = ? && product_id = ?', [data[i].user_id, data[i].product_id]);
                // 沒有: 進行新增
                if (checkData.length === 0) {
                    // 寫入 user_liked 資料表
                    await pool.query('INSERT INTO user_liked (user_id, product_id, category_id) VALUES (?, ?, ?)', [data[0].user_id, data[i].product_id, data[i].category_id]);
                }
            }
            // 再去拿一次資料回給前端 要放在愛心icon上 ui顯示已收藏
            let [response_product] = await pool.execute(
                `SELECT user_liked.*, product.product_id, product.name, product.price, product.ins_main_id, product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id = ?`,
                [data[0].user_id]
            );
            let [response_class] = await pool.execute(
                `SELECT user_liked.*, class.product_id, class.name, class.price, class.start_date, class.end_date, class.deadline, class.teacher, class.stock, class.ins_main_id, class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id = ?`,
                [data[0].user_id]
            );
            res.json({ message: '成功加入收藏!', product: response_product, class: response_class });
        } catch (err) {
            console.log(err);
        }
    }
});
//刪除
router.delete('/delete', async (req, res, next) => {
    // data =[{
    //   user_id: , number
    //   product_id: , string
    // }]
    const data = req.body;

    // 單筆
    if (data.length === 1) {
        try {
            await pool.query(`DELETE FROM user_liked WHERE user_id = ? && product_id = ?`, [data[0].user_id, data[0].product_id]);
            // 再去拿一次資料回給前端 要放在愛心icon上 ui顯示已收藏
            let [response_product] = await pool.execute(
                `SELECT user_liked.*, product.product_id, product.name, product.price, product.stock,product.ins_main_id, product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id = ?`,
                [data[0].user_id]
            );
            let [response_class] = await pool.execute(
                `SELECT user_liked.*, class.product_id, class.name, class.price,class.stock, class.start_date, class.end_date, class.deadline, class.teacher, class.stock, class.ins_main_id, class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id = ?`,
                [data[0].user_id]
            );
            res.json({ message: '成功取消收藏!', product: response_product, class: response_class });
        } catch (err) {
            console.log(err);
        }
        return;
    }
    // 多筆
    if (data.length > 1) {
        console.log('取消收藏', data);
        try {
            for (let i = 0; i < data.length; i++) {
                await pool.query(`DELETE FROM user_liked WHERE user_id = ? && product_id = ?`, [data[i].user_id, data[i].product_id]);
            }
            // 再去拿一次資料回給前端 要放在愛心icon上 ui顯示已收藏
            let [response_product] = await pool.execute(
                `SELECT user_liked.*, product.product_id, product.name, product.price, product.ins_main_id, product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id = ?`,
                [data[0].user_id]
            );
            let [response_class] = await pool.execute(
                `SELECT user_liked.*, class.product_id, class.name, class.price, class.start_date, class.end_date, class.deadline, class.teacher, class.stock, class.ins_main_id, class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id = ?`,
                [data[0].user_id]
            );
            res.json({ message: '成功取消收藏!', product: response_product, class: response_class });
        } catch (err) {
            console.log(err);
        }
    }
});

//查詢
router.get('/', async (req, res, next) => {
    // SELECT * FROM `user_liked` WHERE user_id = 2
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    const user_id = req.session.member.id;
    try {
        let [response_product] = await pool.execute(
            `SELECT user_liked.*, product.product_id, product.name, product.price,product.stock, product.ins_main_id, product_img.image FROM (user_liked INNER JOIN product on product.product_id = user_liked.product_id) INNER JOIN product_img on user_liked.product_id = product_img.product_id WHERE user_id = ?`,
            [user_id]
        );
        let [response_class] = await pool.execute(
            `SELECT user_liked.*, class.product_id, class.name, class.price,class.stock, class.start_date, class.end_date, class.deadline, class.teacher, class.stock, class.ins_main_id, class_img.image_1 FROM (user_liked INNER JOIN class on class.product_id = user_liked.product_id) INNER JOIN class_img on user_liked.product_id = class_img.product_id WHERE user_id = ?`,
            [user_id]
        );
        const response = response_product.concat(response_class);
        // console.log('response', response);
        if (response) {
            res.json({ user_id: user_id, message: 'GET 收藏 資料成功', myBucketList: response, product: response_product, class: response_class });
        } else {
            res.json({ message: 'NOT GET 購物車資料 可能資料表為空' });
        }
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;
