const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const moment = require('moment');
const axios = require('axios');
const Base64 = require('crypto-js/enc-base64');
const HmacSHA256 = require('crypto-js/hmac-sha256');
const { LINEPAY_CHANNEL_ID, LINEPAY_VERSION, LINEPAY_SITE, LINEPAY_CHANNEL_SECRET_KEY, LINEPAY_RETURN_HOST, LINEPAY_RETURN_CONFIRM_URL, LINEPAY_RETURN_CANCEL_URL } = process.env;

const path = require('path');
const multer = require('multer');
// 圖面要存在哪裡？
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', '..', 'public', 'uploadsQA'));
    },
    // 圖片名稱
    filename: function (req, file, cb) {
        console.log('file', file);
        // {
        //   fieldname: 'photo',
        //   originalname: 'japan04-200.jpg',
        //   encoding: '7bit',
        //   mimetype: 'image/jpeg'
        // }
        // 原始檔名: file.originalname => test.abc.png
        const ext = file.originalname.split('.').pop();
        // or uuid
        // https://www.npmjs.com/package/uuid
        cb(null, `member-${Date.now()}.${ext}`);
    },
});
const uploader = multer({
    storage: storage,
    // 過濾圖片的種類
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/png') {
            cb(new Error('上傳的檔案型態不接受'), false);
        } else {
            cb(null, true);
        }
    },
    // 過濾檔案的大小
    limits: {
        // 1k = 1024 => 1MB = 1024 * 1024
        fileSize: 1024 * 1024,
    },
});

//成立訂單
router.post('/', async (req, res, next) => {
    // console.log('myorder 中間件', req.body);
    const [data] = req.body;
    // console.log('data', data);
    //產生訂單編號
    let order_id = 'A' + parseInt(Date.now() / 10000);
    //優惠券
    let coupon_id = Number(data.coupon_id);
    //郵遞區號
    let newDist = data.dist.split(',');
    let newAddress = newDist[0] + data.city + newDist[1] + data.address;
    //當前時間
    let momentTime = moment().format('YYYY-MM-DD HH:mm:ss');

    //過濾分類
    let A = data.product_detail.filter((value) => {
        return value.category_id === 'A';
    });
    let B = data.product_detail.filter((value) => {
        return value.category_id === 'B';
    });
    //只取商品編號及數量
    let product_id = A.map((item) => {
        return [item.product_id, item.amount];
    });
    //只取商品編號及數量
    let class_id = B.map((item) => {
        return [item.product_id, item.amount];
    });
    //確認庫存cate A
    let product_detailA;
    let noStockProduct_detailA;
    let enoughStockA = [];
    let otherStockA = [];
    let newA;
    if (product_id.length !== 0) {
        for (let i = 0; i < product_id.length; i++) {
            let [productStock] = await pool.execute('SELECT stock, product_id FROM product WHERE product_id = ?', [product_id[i][0]]);
            //庫存大於購買數量
            if (productStock[0].stock >= product_id[i][1]) {
                let newStock = Number(productStock[0].stock) - Number(product_id[i][1]);
                enoughStockA.push(productStock[0].product_id);
                otherStockA.push([newStock, productStock[0].product_id]);
            }
        }
        newA = A.filter((item) => {
            return enoughStockA.indexOf(item.product_id) !== -1;
        });
        let noStockA = A.filter((item) => {
            return enoughStockA.indexOf(item.product_id) === -1;
        });
        //庫存不足會跳訊息 終止執行
        if (noStockA.length !== 0) {
            noStockProduct_detailA = noStockA.map((item) => {
                return [item.name];
            });
            return res.json({ noStock: noStockProduct_detailA, message: '不符合庫存數量' });
        }
        //庫存充足 這裡會在擋一次數量為0商品 (數量為零卻未刪除的情況)
        let amountNoZero = newA.filter((v) => {
            return v.amount !== 0;
        });
        product_detailA = amountNoZero.map((item) => {
            return [order_id, item.product_id, item.category_id, item.name, item.amount, item.price, 1];
        });
    }

    //確認庫存cate B
    let product_detailB;
    let noStockProduct_detailB;
    let enoughStockB = [];
    let otherStockB = [];
    let newB;
    if (class_id.length !== 0) {
        for (let i = 0; i < class_id.length; i++) {
            let [classStock] = await pool.execute('SELECT stock, product_id FROM class WHERE product_id = ?', [class_id[i][0]]);
            //庫存大於購買數量
            if (classStock[0].stock >= class_id[i][1]) {
                //扣庫存
                let newStock = Number(classStock[0].stock) - Number(class_id[i][1]);
                enoughStockB.push(classStock[0].product_id);
                otherStockB.push([newStock, classStock[0].product_id]);
            }
        }
        newB = B.filter((item) => {
            return enoughStockB.indexOf(item.product_id) !== -1;
        });
        let noStockB = B.filter((item) => {
            return enoughStockB.indexOf(item.product_id) === -1;
        });
        //庫存不足
        if (noStockB.length !== 0) {
            noStockProduct_detailB = noStockB.map((item) => {
                return [item.name];
            });

            return res.json({ noStock: noStockProduct_detailB, message: '不符合剩餘名額' });
        }
        //庫存充足 這裡會在擋一次數量為0商品 (數量為零卻未刪除的情況)
        let amountNoZero = newB.filter((v) => {
            return v.amount !== 0;
        });
        product_detailB = amountNoZero.map((item) => {
            return [order_id, item.product_id, item.category_id, item.name, item.start_date, item.end_date, item.amount, item.price, 1];
        });
    }

    try {
        //產生訂單
        await pool.execute(
            `INSERT INTO order_product (order_id, user_id, receiver, phone, freight, shipment, address, pay_method, pay_state,pay_time, order_state, coupon_id, total_amount,create_time, valid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [order_id, data.user_id, data.receiver, data.phone, data.freight, 1, newAddress, data.pay_method, 1, momentTime, 1, coupon_id, data.total_amount, momentTime, 1]
        );

        //存order_product_detail
        if (Array.isArray(product_detailA)) {
            await pool.query('INSERT INTO `order_product_detail`(`order_id`, `product_id`, `category_id`, `name`, `amount`, `price`, `valid`) VALUES ?', [product_detailA]);

            //修改庫存
            for (let i = 0; i < otherStockA.length; i++) {
                await pool.query('UPDATE product SET product.stock = ? WHERE product_id = ?', [otherStockA[i][0], otherStockA[i][1]]);
            }
        }

        if (Array.isArray(product_detailB)) {
            await pool.query(`INSERT INTO order_product_detail (order_id, product_id, category_id, name, start_date, end_date, amount, price, valid) VALUES ?`, [product_detailB]);

            //修改庫存
            for (let i = 0; i < otherStockB.length; i++) {
                await pool.query('UPDATE class SET class.stock = ? WHERE product_id = ?', [otherStockB[i][0], otherStockB[i][1]]);
            }
        }

        let products_delete = data.product_detail.map((item) => {
            return [item.product_id];
        });

        // console.log('刪除cart 產生訂單', products_delete);

        //刪除在購物車的商品
        for (let i = 0; i < products_delete.length; i++) {
            await pool.query(`DELETE FROM user_cart WHERE (user_id=?) AND (product_id=?)`, [data.user_id, products_delete[i]]);
        }

        //修改優惠券use額度
        if (coupon_id != 0) {
            await pool.execute('UPDATE coupon_detail SET coupon_detail.use = 0 WHERE user_id= ? && coupon_id= ?', [data.user_id, data.coupon_id]);
        }

        res.json({ order_id: order_id, message: '訂單已成立' });
    } catch (err) {
        res.status(404).json({ message: '新增訂單失敗' });
    }
});

//查詢訂單詳細
router.get('/detail/:order_id', async (req, res, next) => {
    console.log('查詢order_id req.params', req.params, req.query.user_id);
    //取得user_id判斷此訂單是否為該使用者輸入
    // console.log('req.session.member', req.session.member);
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    const user_id = req.query.user_id;
    const order_id = req.params.order_id;

    try {
        //使用者資訊
        let [response_userInfo] = await pool.execute(
            `SELECT order_product.*, coupon.name AS coupon_name,coupon.discount FROM order_product LEFT JOIN coupon ON order_product.coupon_id = coupon.id WHERE order_id= ? AND user_id = ?`,
            [order_id, user_id]
        );

        // console.log('response_userInfo', response_userInfo);

        //使用者購買清單
        let [response_orderListA] = await pool.execute(
            `SELECT order_product_detail.* ,product_img.image, brand.name AS brand_name FROM order_product_detail JOIN product_img ON order_product_detail.product_id = product_img.product_id JOIN product ON order_product_detail.product_id = product.product_id JOIN brand ON product.ins_brand = brand.id WHERE order_product_detail.order_id=?`,
            [order_id]
        );
        let [response_orderListB] = await pool.execute(
            `SELECT order_product_detail.* ,class_img.image_1 FROM order_product_detail JOIN class_img ON order_product_detail.product_id = class_img.product_id WHERE  order_product_detail.order_id=?`,
            [order_id]
        );

        console.log('response_userInfo', response_userInfo);

        const response = response_orderListA.concat(response_orderListB);
        // console.log('response', response);

        res.json({ user_id: user_id, message: 'All Good 訂單詳細查詢', userInfo: response_userInfo, orderList: response });
    } catch (err) {
        res.status(404).json({ message: '訂單詳細查詢失敗' });
    }
});

//訂單付款
router.post('/detail/checkout/:order_id', async (req, res, next) => {
    // console.log('訂單前往付款', req.body);
    let order_id = req.params.order_id;
    let user_id = req.body.user_id;
    try {
        let orders = {};
        let products = req.body.myOrderList.map((item) => {
            return { name: item.name, quantity: item.amount, price: item.price };
        });
        let amount = req.body.myOrderList
            .map((item) => {
                return item.amount * item.price;
            })
            .reduce((prev, current) => prev + current, 0);

        // console.log('product amount', products, amount);
        //暫時不計算總價
        let newTotalAmount = req.body.myOrderUserInfo[0].total_amount - req.body.myOrderUserInfo[0].freight + req.body.myOrderUserInfo[0].discount;

        orders = {
            amount: newTotalAmount,
            currency: 'TWD',
            orderId: order_id,
            packages: [
                {
                    id: 'products_1',
                    amount: amount,
                    products: products,
                },
            ],
        };
        //request body
        const linePayBody = {
            ...orders,
            redirectUrls: {
                confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
                cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
            },
        };
        //uri
        const uri = '/payments/request';
        //nonce
        const { headers } = createSignature(uri, linePayBody);
        // //發請求的路徑
        const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
        //對line pay請求
        const linepayReq = await axios.post(url, linePayBody, { headers });
        //收到回覆
        if (linepayReq?.data?.returnCode === '0000') {
            res.json({ web: linepayReq?.data?.info.paymentUrl.web });
        }
    } catch (err) {
        console.log('err', err);
        res.end();
    }
});
//前端付款完進來
router.get('/linepay/confirm', async (req, res, next) => {
    // console.log(req.query);
    try {
        const { transactionId, orderId } = req.query;
        let [response] = await pool.execute(
            'SELECT order_product.user_id, order_product.total_amount,freight, coupon.discount  FROM order_product LEFT JOIN coupon ON coupon.id = order_product.coupon_id WHERE order_id=?',
            [orderId]
        );
        // console.log('response select', response);
        //
        let amount = Number(response[0].total_amount) + Number(response[0].discount - Number(response[0].freight));
        let user_id = response[0].user_id;

        const linePayBody = {
            amount: amount,
            currency: 'TWD',
        };

        const uri = `/payments/${transactionId}/confirm`;
        const { headers } = createSignature(uri, linePayBody);

        const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
        //告訴linepay交易結果
        const linePayRes = await axios.post(url, linePayBody, { headers });

        // console.log('linePayRes.data.info', linePayRes.data.info);

        if (linePayRes?.data?.returnCode === '0000') {
            let response = await pool.execute('UPDATE order_product SET order_state=2 WHERE order_id = ? AND user_id =?', [orderId, user_id]);
        }

        res.json({ message: '付款成功' });
    } catch (err) {
        res.status(404).json({ message: '訂單付款失敗' });
    }
});
//linepay重要驗證
function createSignature(uri, linePayBody) {
    const nonce = parseInt(new Date().getTime() / 1000);

    const string = `${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linePayBody)}${nonce}`;

    const signature = Base64.stringify(HmacSHA256(string, LINEPAY_CHANNEL_SECRET_KEY));

    const headers = {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
    };
    return { signature, headers };
}

//訂單完成
router.put('/detail/finish/:order_id', async (req, res, next) => {
    // console.log('訂單完成', req.params, req.body.user_id);
    let order_id = req.params.order_id;
    let user_id = req.body.user_id;
    try {
        let response = await pool.execute('UPDATE order_product SET order_state=3 WHERE order_id = ? AND user_id =?', [order_id, user_id]);

        // console.log('response update order_state', response);
        res.json({ user_id: user_id, message: '訂單完成' });
    } catch (err) {
        res.status(404).json({ message: '訂單完成失敗' });
    }
});

router.get('/replystate', async (req, res, next) => {
    console.log('確認回覆狀態');
    console.log('123', req.session);
    let [response] = await pool.execute(
        'SELECT order_product.*,order_qna.user_reply_state FROM order_product JOIN order_qna ON order_product.id = order_qna.order_id WHERE order_product.user_id = ? AND qa=1',
        [req.session.member.id]
    );
    console.log(response);
    res.json(response);
});

//新增訂單問題
//http://localhost:3001/api/member/myorder/addqa
router.post('/addqa', async (req, res, next) => {
    console.log('add myOrderQA');
    console.log(req.body);
    //表單驗證
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    if (req.body.q_category == '0') {
        return res.status(401).json({ message: '請選擇問題類型' });
    }
    if (req.body.title === '') {
        return res.status(401).json({ message: '請填寫問題主旨' });
    }
    if (req.body.comment === '') {
        return res.status(401).json({ message: '請填寫完整內容' });
    }
    //新增問題
    let [result] = await pool.execute('INSERT INTO order_qna (name, user_id, order_id,q_category, title, q_content) VALUES (?, ?, ?, ?, ?, ?)', [
        req.session.member.fullName,
        req.session.member.id,
        req.body.order_id,
        req.body.q_category,
        req.body.title,
        req.body.comment,
    ]);
    console.log('insert new myOrderQA', result);
    //新增問題詳細
    let result2 = await pool.execute('INSERT INTO order_qna_detail (order_id, name, q_content) VALUES (?, ?, ?)', [
        req.body.order_id,
        req.session.member.fullName,
        req.body.comment,
    ]);
    console.log('result2', result2);

    //更新訂單是否有問題
    let result3 = await pool.execute('UPDATE order_product SET qa=? WHERE id=?', [1, req.body.order_id]);

    req.app.io.emit(`customer_List`, { newMessage: true });
    res.json({ message: '收到~小編會盡快回覆您的問題!!' });
});
//訂單問答 詳細
//http://localhost:3001/api/member/myorder/qadetail?orid=${data.id}
router.get('/qadetail', async (req, res, next) => {
    console.log('loading orderqa detail');
    const orid = req.query.orid;
    // console.log('orid', orid);
    //訂單資訊
    let [orderArray] = await pool.execute('SELECT * FROM order_product WHERE order_product.id=? ORDER BY create_time DESC', [orid]);
    let order = orderArray[0];

    //問答資訊
    let [myOrderQADetailArray] = await pool.execute(
        'SELECT order_qna.*, order_q_category.name AS q_category, users.email, users.phone ,users.photo FROM order_qna JOIN order_q_category ON order_qna.q_category = order_q_category.id JOIN users ON order_qna.user_id = users.id WHERE order_qna.order_id=? ORDER BY create_time DESC',
        [orid]
    );
    let detail = myOrderQADetailArray[0];

    //問答詳細
    let [content] = await pool.execute('SELECT * FROM order_qna_detail WHERE order_id=?', [orid]);
    // console.log({ detail, content });
    res.json({ order, detail, content });
});
//訂單問答 新增回覆
//http://localhost:3001/api//member/myorder/qareply
router.post('/qareply', uploader.single('photo'), async (req, res, next) => {
    console.log('reply orderqa');
    console.log('data:', req.body);

    // 輸入內容不能為空
    if (req.body.q_content === '' && req.file === undefined) {
        return res.status(401).json({ message: '不能為空值' });
    }

    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE order_qna SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE order_id=?', ['新訊息', '未回覆', now, req.body.order_id]);

    //新增圖片
    if (req.file !== undefined) {
        let filename = '/uploadsQA/' + req.file.filename;
        let [photo] = await pool.execute('INSERT INTO order_qna_detail (order_id, name, q_content) VALUES (?, ?, ?)', [req.body.order_id, req.session.member.fullName, filename]);
    }

    //新增對話
    if (req.body.q_content !== '') {
        let [content] = await pool.execute('INSERT INTO order_qna_detail (order_id, name, q_content) VALUES (?, ?, ?)', [
            req.body.order_id,
            req.session.member.fullName,
            req.body.q_content,
        ]);
    }

    //請管理員更新資料庫
    req.app.io.emit(`userid${req.session.member.id}`, { newMessage: true });

    res.json({ message: 'OK' });
});

//查詢訂單
router.get('/', async (req, res, next) => {
    // console.log('查詢user_id req.params', req.params);
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    const user_id = req.session.member.id;
    try {
        let [response_product] = await pool.execute(
            `SELECT order_product.*, order_product_detail.category_id,product_img.image, order_state.name AS order_stateName FROM (order_product JOIN order_product_detail ON order_product_detail.order_id = order_product.order_id) JOIN product_img ON order_product_detail.product_id = product_img.product_id JOIN order_state ON order_state.id = order_product.order_state WHERE order_product.user_id = ? ORDER BY order_product.create_time DESC;`,
            [user_id]
        );
        let [response_class] = await pool.execute(
            `SELECT order_product.*, order_product_detail.category_id,class_img.image_1, order_state.name AS order_stateName FROM (order_product JOIN order_product_detail ON order_product_detail.order_id = order_product.order_id) JOIN class_img ON order_product_detail.product_id = class_img.product_id JOIN order_state ON order_state.id = order_product.order_state WHERE order_product.user_id = ? ORDER BY order_product.create_time DESC;`,
            [user_id]
        );
        const response = response_product.concat(response_class);
        // console.log(response);

        res.json({ user_id: user_id, message: 'All Good 訂單查詢', myOrder: response });
    } catch (err) {
        res.status(404).json({ message: '訂單查詢失敗' });
    }
});
module.exports = router;
