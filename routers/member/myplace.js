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
        //4MB
        fileSize: 4096 * 1024,
    },
});

//讀取場地表單
router.get('/loading', async (req, res, next) => {
    console.log('loading myPlace');
    console.log(req.session.member.id);
    let [myPlace] = await pool.execute('SELECT * FROM `venue_reservation` WHERE user_id=? ORDER BY create_time DESC ', [req.session.member.id]);

    res.json(myPlace);
});

//場地詳細
router.get('/detail', async (req, res, next) => {
    console.log('myPlaceDetail');
    const plid = req.query.plid;
    //TODO:檢驗是否為本人
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }

    let [myPlaceDetailArray] = await pool.execute(
        'SELECT venue_reservation.*,users.photo FROM venue_reservation JOIN users ON venue_reservation.user_id = users.id WHERE venue_reservation.id=? AND venue_reservation.user_id =?',
        [plid, req.session.member.id]
    );
    let detail = myPlaceDetailArray[0];

    if (!myPlaceDetailArray) {
        return res.status(401).json({ message: '僅能查看本人詳細問答' });
    }

    let [content] = await pool.execute('SELECT * FROM venue_detail WHERE place_rt_id=?', [plid]);

    console.log({ detail, content });
    res.json({ detail, content });
});

//新增回覆
//http://localhost:3001/api/member/myquestion/reply
router.post('/reply', uploader.single('photo'), async (req, res, next) => {
    console.log('reply myplace');
    console.log('data:', req.body);
    console.log('req.file', req.file);
    // const qaid = req.query.qaid;
    // if (!req.session.member) {
    //     return res.status(401).json({ message: '已登出請重新登入' });
    // }

    // 輸入內容不能為空
    if (req.body.place_content === '' && req.file === undefined) {
        return res.status(401).json({ message: '不能為空值' });
    }

    //更新回覆狀態
    const now = new Date();
    await pool.execute('UPDATE venue_reservation SET manager_reply_state=?, user_reply_state=?, update_time=? WHERE id=?', ['未回覆', '已回覆', now, req.body.place_rt_id]);

    //新增圖片
    if (req.file !== undefined) {
        let filename = '/uploadsQA/' + req.file.filename;
        let [photo] = await pool.execute('INSERT INTO venue_detail (place_rt_id, name, place_content) VALUES (?, ?, ?)', [
            req.body.place_rt_id,
            req.session.member.fullName,
            filename,
        ]);
    }

    //新增對話
    if (req.body.place_content !== '') {
        let [content] = await pool.execute('INSERT INTO venue_detail (place_rt_id, name, place_content) VALUES (?, ?, ?)', [
            req.body.place_rt_id,
            req.session.member.fullName,
            req.body.place_content,
        ]);
    }
    //請會員更新資料庫
    req.app.io.emit(`userid${req.session.member.id}`, { newMessage: true });

    res.json({ message: 'OK' });
});

module.exports = router;
