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

//讀取我的問題
//http://localhost:3001/api/member/myquestion
router.get('/loading', async (req, res, next) => {
    console.log('loading myQuestion');
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    let [myQuestion] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category  FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id WHERE user_id=? ORDER BY create_time DESC',
        [req.session.member.id]
    );
    res.json(myQuestion);
});

//新增問題
router.post('/add', async (req, res, next) => {
    console.log('add myQuestion');
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
    let [result] = await pool.execute('INSERT INTO user_qna (name, user_id, email, phone, q_category, title, comment) VALUES (?, ?, ?, ?, ?, ?, ?);', [
        req.session.member.fullName,
        req.session.member.id,
        req.session.member.email,
        req.session.member.phone,
        req.body.q_category,
        req.body.title,
        req.body.comment,
    ]);
    console.log('insert new Question', result);

    let result2 = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [
        result.insertId,
        req.session.member.fullName,
        req.body.comment,
    ]);
    console.log('result2', result2);

    req.app.io.emit(`customer_List`, { newMessage: true });
    res.json({ message: '收到~小編會盡快回覆您的問題!!' });
});

//問題詳細
//http://localhost:3001/api/member/myquestion/detail?qaid=XXX
router.get('/detail', async (req, res, next) => {
    console.log('myQuestionDetail');
    const qaid = req.query.qaid;

    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    //檢驗是否為本人
    let [myQuestionDetailArray] = await pool.execute(
        'SELECT user_qna.*, user_q_category.name AS user_q_category ,users.photo FROM user_qna JOIN user_q_category ON user_qna.q_category = user_q_category.id JOIN users ON user_qna.user_id = users.id WHERE user_qna.id=? AND user_qna.user_id =?',
        [qaid, req.session.member.id]
    );
    let detail = myQuestionDetailArray[0];

    if (!myQuestionDetailArray) {
        return res.status(401).json({ message: '僅能查看本人詳細問答' });
    }

    let [content] = await pool.execute('SELECT * FROM user_qna_detail WHERE user_qna_id=?', [qaid]);

    res.json({ detail, content });
});

//新增回覆
//http://localhost:3001/api/member/myquestion/reply
router.post('/reply', uploader.single('photo'), async (req, res, next) => {
    console.log('req.file', req.file);
    // console.log('body:', req.body);
    // console.log('name:', req.session.member.fullName);

    // 輸入內容不能為空
    if (req.body.q_content === '' && req.file === undefined) {
        return res.status(401).json({ message: '不能為空值' });
    }

    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE user_qna SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE id=?', ['新訊息', '未回覆', now, req.body.user_qna_id]);

    //新增圖片
    if (req.file !== undefined) {
        let filename = '/uploadsQA/' + req.file.filename;
        let [photo] = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [
            req.body.user_qna_id,
            req.session.member.fullName,
            filename,
        ]);
    }
    //新增對話
    if (req.body.q_content !== '') {
        let [content] = await pool.execute('INSERT INTO user_qna_detail (user_qna_id, name, q_content) VALUES (?, ?, ?)', [
            req.body.user_qna_id,
            req.session.member.fullName,
            req.body.q_content,
        ]);
    }

    //請管理員更新資料庫
    req.app.io.emit(`userid${req.session.member.id}`, { newMessage: true });
    req.app.io.emit(`customer_List`, { newMessage: true });
    // req.app.io.emit(req.body.customer_id, { updateCommonQA: true });
    res.json({ message: 'OK' });
});

module.exports = router;
