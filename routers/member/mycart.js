const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//單筆 INSERT http://localhost:3001/api/member/mycart
router.post('/single', async (req, res, next) => {
    console.log('cart 中間件 single', req.body);
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
            //這樣可以取得insertId
            // console.log('saveItemData', saveItemData[0].insertId);
            res.json({ message: '成功加入購物車' });
        } else {
            //訊息為臨時購物車關閉,加入購物車出現的訊息
            res.json({ duplicate: 1, message: '已加入購物車，請去會員購物車修改數量' });
        }
    } catch (err) {
        res.status(404).json({ message: '新增失敗單筆' });
    }
});

//購物車 多筆 INSERT http://localhost:3001/api/member/mycart/multi
//INSERT 陣列處理 很重要！
router.post('/multi', async (req, res, next) => {
    // console.log('cart 中間件 multi', req.body);
    const data = req.body;
    const user_id = data[0][0];
    //取得product_id
    let checkId = data.map((v) => {
        return v[1];
    });
    // console.log('checkId', checkId);
    try {
        //確認商品 && user是否重複
        for (let i = 0; i < checkId.length; i++) {
            let [checkData] = await pool.execute('SELECT product_id FROM user_cart WHERE product_id = ? AND user_id = ?', [checkId[i], user_id]);
            //db沒有的商品則進行新增
            // console.log('checkData', checkData);
            if (checkData.length === 0) {
                let newData = data.filter((v) => {
                    return v[1] === checkId[i];
                });
                console.log('newData', newData);
                let saveItemData = await pool.query('INSERT INTO user_cart (user_id, product_id, category_id, amount) VALUES ? ', [newData]);
                console.log('saveItemData', saveItemData);
            }
        }
        res.json({ message: '成功加入購物車' });
    } catch (err) {
        res.status(404).json({ message: '新增失敗' });
    }
});

//http://localhost:3001/api/member/mycart
//delete會員刪除購物車內容
router.delete('/', async (req, res, next) => {
    // console.log('取得該會員要刪除user_cart內容', req.body);
    //單筆
    if (req.body.length === 1) {
        const [newData] = req.body;
        // console.log('req.body.length === 1', newData);
        try {
            let responseDelete = await pool.execute('DELETE FROM user_cart WHERE (user_id=?) AND (product_id=?);', newData);

            // console.log('responseDelete', responseDelete);
            res.json({ user_id: newData[0], product_id: newData[1], message: '成功刪除購物車內容' });
        } catch (err) {
            res.status(404).json({ message: '刪除失敗' });
        }
    }
    //多筆
    if (req.body.length > 1) {
        const newData = req.body;
        try {
            let product_id = [];
            for (let i = 0; i < req.body.length; i++) {
                let deleteItemData = await pool.query(`DELETE FROM user_cart WHERE (user_id=?) AND (product_id=?)`, newData[i]);
                product_id.push(newData[i][1]);
                // console.log('deleteItemData', deleteItemData);
            }
            res.json({ user_id: newData[0][0], product_id: product_id, message: '成功刪除多筆購物車內容' });
        } catch (err) {
            res.status(404).json({ message: '多筆刪除失敗' });
        }
    }
});

//GET查詢購物車
router.get('/', async (req, res, next) => {
    // console.log('req.params', req.params);
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    const user_id = req.session.member.id;
    console.log('user_id', user_id);
    try {
        let [userInfo] = await pool.execute(`SELECT users.name, users.phone FROM users WHERE id=?`, [user_id]);
        console.log('userInfo', userInfo);
        //product
        let [response_product] = await pool.execute(
            `SELECT user_cart.*, product.product_id,product.name,product.price,product.ins_main_id, product.stock, brand.name AS brand_name,product_img.image FROM (user_cart INNER JOIN product on product.product_id = user_cart.product_id) INNER JOIN product_img on user_cart.product_id = product_img.product_id  INNER JOIN brand on brand.id = product.ins_brand WHERE user_id= ?`,
            [user_id]
        );
        //class
        let [response_class] = await pool.execute(
            `SELECT user_cart.*, class.product_id,class.name,class.price, class.stock,class.start_date,class.end_date,class_img.image_1 FROM (user_cart INNER JOIN class on class.product_id = user_cart.product_id) INNER JOIN class_img on user_cart.product_id = class_img.product_id WHERE user_id= ?`,
            [user_id]
        );
        const response = response_product.concat(response_class);
        // const response = response_class;
        // console.log('get response', response);
        if (response) {
            res.json({ user_id: user_id, message: 'GET 購物車 資料成功', myCart: response, userInfo: userInfo });
        } else {
            res.json({ message: 'NOT GET 購物車資料 可能資料表為空' });
        }
    } catch (err) {
        res.status(404).json({ message: '購物車查詢失敗' });
    }
});

module.exports = router;
