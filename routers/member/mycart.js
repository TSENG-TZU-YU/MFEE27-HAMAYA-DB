const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//單筆 INSERT http://localhost:3001/api/member/mycart
router.post('/', async (req, res, next) => {
    // console.log('cart 中間件', req.body);
    const [data] = req.body;
    try {
        let [checkData] = await pool.execute('SELECT product_id FROM user_cart WHERE product_id = ? AND user_id = ?', [data.product_id, data.user_id]);
        if (checkData.length === 0) {
            let saveItemData = await pool.execute(`INSERT INTO user_cart (user_id, product_id, category_id, amount) VALUE (?,?,?,?)`, [
                data.user_id,
                data.product_id,
                data.category_id,
                data.amount,
            ]);
            //TODO:這樣可以取得insertId
            console.log('saveItemData', saveItemData[0].insertId);
            res.json({ message: '已加入購物車，可以去會員專區 > 購物車查看，謝謝' });
        } else {
            res.json({ duplicate: 1, message: '已加入購物車，可以去會員專區 > 購物車修改數量，謝謝' });
        }
    } catch (err) {
        res.status(404).json({ message: '新增失敗單筆?' });
    }
});

//購物車 多筆 INSERT http://localhost:3001/api/member/mycart/multi
//INSERT 陣列處理 很重要！
router.post('/multi', async (req, res, next) => {
    // console.log('cart 中間件', req.body);
    const data = req.body;
    const user_id = data[0][0];
    //取得product_id
    let checkId = data.map((v) => {
        return v[1];
    });
    try {
        //確認商品 && user是否重複
        checkId.forEach(async (id) => {
            let [checkData] = await pool.execute('SELECT product_id FROM user_cart WHERE product_id = ? AND user_id = ?', [id, user_id]);
            //db沒有的商品則進行新增
            if (checkData.length === 0) {
                let newData = data.filter((v) => {
                    return v[1] === id;
                });
                let saveItemData = await pool.query('INSERT INTO user_cart (user_id, product_id, category_id, amount) VALUES ? ', [newData]);
                console.log('saveItemData', saveItemData);
            }
        });
        res.json({ message: '已加入購物車，可以去會員專區 > 購物車查看，謝謝' });
    } catch (err) {
        res.status(404).json({ message: '新增失敗' });
    }
});

//http://localhost:3001/api/member/mycart
//DELETE FROM user_cart WHERE user_id=2 AND product_id=A123
//delete會員刪除購物車內容
router.delete('/', async (req, res, next) => {
    // console.log('取得該會員要刪除user_cart內容', req.body);
    const user_id = req.body.user_id;
    const product_id = req.body.product_id;
    try {
        let responseDelete = await pool.execute('DELETE FROM user_cart WHERE (user_id=?) AND (product_id=?);', [user_id, product_id]);
        //刪除完再查詢送回刪除過後的資料
        // let [response_product] = await pool.execute(
        //     `SELECT user_cart.*, product.product_id,product.name,product.price,product_img.image FROM (user_cart INNER JOIN product on product.product_id = user_cart.product_id) INNER JOIN product_img on user_cart.product_id = product_img.product_id WHERE user_id= ?`,
        //     [user_id]
        // );
        //class圖片db
        // let [response_class] = await pool.execute(
        //     `SELECT user_cart.*, class.product_id,class.name,class.price,class_img.image_1 FROM (user_cart INNER JOIN class on class.product_id = user_cart.product_id) INNER JOIN class_img on user_cart.product_id = class_img.product_id WHERE user_id= ?`,
        //     [user_id]
        // );
        // const response = response_product.concat(response_class);
        // const response = response_class;
        // console.log('get response', response);
        // res.json({ user_id: user_id, items_amount: response.length, message: '已成功刪除購物車內容，可以去會員專區 > 購物車查看，謝謝', myCart: response });
        res.json({ user_id: user_id, product_id: product_id, message: '已成功刪除購物車內容，可以去會員專區 > 購物車查看，謝謝' });
    } catch (err) {
        res.status(404).json({ message: '刪除失敗' });
    }
});

//GET查詢資料庫
router.get('/:id', async (req, res, next) => {
    console.log('req.params', req.params);
    const user_id = req.params.id;
    try {
        //查到product
        let [response_product] = await pool.execute(
            `SELECT user_cart.*, product.product_id,product.name,product.price,product_img.image FROM (user_cart INNER JOIN product on product.product_id = user_cart.product_id) INNER JOIN product_img on user_cart.product_id = product_img.product_id WHERE user_id= ?`,
            [user_id]
        );
        //class圖片db
        let [response_class] = await pool.execute(
            `SELECT user_cart.*, class.product_id,class.name,class.price,class_img.image_1 FROM (user_cart INNER JOIN class on class.product_id = user_cart.product_id) INNER JOIN class_img on user_cart.product_id = class_img.product_id WHERE user_id= ?`,
            [user_id]
        );
        const response = response_product.concat(response_class);
        // const response = response_class;
        // console.log('get response', response);
        if (response) {
            res.json({ user_id: user_id, message: 'GET 購物車 資料成功', myCart: response });
        } else {
            res.json({ message: 'NOT GET 購物車資料 可能資料表為空' });
        }
    } catch (err) {
        res.status(404).json({ message: '購物車查詢失敗' });
    }
});

module.exports = router;
