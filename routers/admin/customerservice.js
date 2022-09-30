const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

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

//一般問答
//http://localhost:3001/api/admin/customerservice/commonqa/loading
router.get('/commonqa/loading', async (req, res, next) => {
    console.log('loading commonqa');
    let [commonqa] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id ORDER BY create_time DESC'
    );
    res.json(commonqa);
});
//一般問答 詳細
//http://localhost:3001/api/admin/customerservice/commonqa/detail?nlid=${data.id}
router.get('/commonqa/detail', async (req, res, next) => {
    console.log('loading commonqa detail');
    const nlid = req.query.nlid;

    let [myQuestionDetailArray] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category ,users.photo  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id LEFT JOIN users ON user_qna.user_id = users.id WHERE user_qna.id=?',
        [nlid]
    );
    let detail = myQuestionDetailArray[0];

    let [content] = await pool.execute('SELECT * FROM user_qna_detail WHERE user_qna_id=?', [nlid]);

    res.json({ detail, content });
});

//一般問答 新增回覆
//http://localhost:3001/api/admin/customerservice/commonqa/reply
router.post('/commonqa/reply', uploader.single('photo'), async (req, res, next) => {
    console.log('reply commonqa');
    console.log('data:', req.body);
    console.log('req.file', req.file);

    // 輸入內容不能為空
    if (req.body.q_content === '' && req.file === undefined) {
        return res.status(401).json({ message: '不能為空值' });
    }
    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE user_qna SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE id=?', ['已回覆', '已回覆', now, req.body.user_qna_id]);

    //新增圖片
    if (req.file !== undefined) {
        let filename = '/uploadsQA/' + req.file.filename;
        let [photo] = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [req.body.user_qna_id, '客服小編', filename]);
    }
    //新增對話
    if (req.body.q_content !== '') {
        let [content] = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [req.body.user_qna_id, '客服小編', req.body.q_content]);
    }
    //請會員更新資料庫
    req.app.io.emit(`userid${req.body.user_id}`, { newMessage: true });

    res.json({ message: 'OK' });
});

//訂單問答
//http://localhost:3001/api/admin/customerservice/orderqa/loading
router.get('/orderqa/loading', async (req, res, next) => {
    console.log('loading orderqa');
    let [orderqa] = await pool.execute(
        'SELECT order_qna.*, order_q_category.name AS q_category ,users.email ,users.phone,order_product.order_id AS order_id1 FROM order_qna JOIN order_q_category ON order_qna.q_category = order_q_category.id JOIN users ON order_qna.user_id = users.id JOIN order_product ON order_qna.order_id = order_product.id ORDER BY create_time DESC'
    );
    res.json(orderqa);
});
//訂單問答 詳細
//http://localhost:3001/api/admin/customerservice/orderqa/detail?orid=${data.id}
router.get('/orderqa/detail', async (req, res, next) => {
    console.log('loading orderqa detail');
    const orid = req.query.orid;

    let [myQuestionDetailArray] = await pool.execute(
        'SELECT order_qna.*, order_q_category.name AS q_category, users.email, users.phone,users.photo FROM order_qna JOIN order_q_category ON order_qna.q_category = order_q_category.id JOIN users ON order_qna.user_id = users.id WHERE order_qna.order_id=? ORDER BY create_time DESC',
        [orid]
    );
    let detail = myQuestionDetailArray[0];

    let [content] = await pool.execute('SELECT * FROM order_qna_detail WHERE order_id=?', [orid]);
    // console.log({ detail, content });
    res.json({ detail, content });
});
//訂單問答 新增回覆
//http://localhost:3001/api/admin/customerservice/commonqa/reply
router.post('/orderqa/reply', uploader.single('photo'), async (req, res, next) => {
    console.log('reply orderqa');
    console.log('data:', req.body);

    // 輸入內容不能為空
    if (req.body.q_content === '' && req.file === undefined) {
        return res.status(401).json({ message: '不能為空值' });
    }
    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE order_qna SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE order_id=?', ['已回覆', '已回覆', now, req.body.order_id]);

    //新增圖片
    if (req.file !== undefined) {
        let filename = '/uploadsQA/' + req.file.filename;
        let [photo] = await pool.execute('INSERT INTO order_qna_detail (order_id, name, q_content) VALUES (?, ?, ?)', [req.body.order_id, '客服小編', filename]);
    }

    //新增對話
    if (req.body.q_content !== '') {
        let [content] = await pool.execute('INSERT INTO order_qna_detail (order_id, name, q_content) VALUES (?, ?, ?)', [req.body.order_id, '客服小編', req.body.q_content]);
    }

    //請會員更新資料庫
    req.app.io.emit(`userid${req.body.user_id}`, { newMessage: true });

    res.json({ message: 'OK' });
});

//場地問答
router.get('/placeqa/loading', async (req, res, next) => {
    console.log('loading placeqa');

    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` ORDER BY create_time DESC');

    res.json(myPlace);
});

//場地問答詳細
router.get('/placeqa/detail', async (req, res, next) => {
    console.log('loading placeqa detail');
    const plid = req.query.plid;
    console.log(plid);

    let [myPlaceDetailArray] = await pool.execute(
        'SELECT venue_reservation.*, users.photo FROM venue_reservation LEFT JOIN users ON venue_reservation.user_id = users.id WHERE venue_reservation.id=? ORDER BY create_time DESC',
        [plid]
    );

    let detail = myPlaceDetailArray[0];
    console.log(detail);

    let [myPlace] = await pool.execute('SELECT * FROM `venue_detail` WHERE place_rt_id=?', [plid]);
    console.log(myPlace);

    res.json({ detail, myPlace });
});

////場地問答 新增回覆
//http://localhost:3001/api/admin/customerservice/commonqa/reply
router.post('/placeqa/reply', uploader.single('photo'), async (req, res, next) => {
    console.log('reply placeqa');
    console.log('data:', req.body);

    // 輸入內容不能為空
    if (req.body.place_content === '' && req.file === undefined) {
        return res.status(401).json({ message: '不能為空值' });
    }

    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE venue_reservation SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE id=?', ['已回覆', '未回覆', now, req.body.place_rt_id]);

    //新增圖片
    if (req.file !== undefined) {
        let filename = '/uploadsQA/' + req.file.filename;
        let [photo] = await pool.execute('INSERT INTO venue_detail (place_rt_id, name, place_content) VALUES (?, ?, ?)', [req.body.place_rt_id, '客服小編', filename]);
    }
    //新增對話
    if (req.body.place_content !== '') {
        let [content] = await pool.execute('INSERT INTO venue_detail (place_rt_id, name, place_content) VALUES (?, ?, ?)', [
            req.body.place_rt_id,
            '客服小編',
            req.body.place_content,
        ]);
    }

    //請會員更新資料庫
    req.app.io.emit(`userid${req.body.user_id}`, { newMessage: true });

    res.json({ message: 'OK' });
});

module.exports = router;
