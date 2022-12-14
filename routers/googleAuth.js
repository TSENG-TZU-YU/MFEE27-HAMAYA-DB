const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const nodemailer = require('nodemailer');

// 可以針對這個 router 使用某些中間件
// router.use(express.json());
// for hash password
// npm i bcrypt
const bcrypt = require('bcrypt');
// npm i express-validator
const { body, validationResult } = require('express-validator');

const registerRules = [
    // 中間件: 檢查 email 是否合法
    body('email').isEmail().withMessage('Email 欄位請填寫正確格式'),
    // 中間件: 檢查密碼長度
    body('password').isLength({ min: 8 }).withMessage('密碼長度至少為 8'),
    // 中間件: 檢查 password & confirmPassword 是否一致
    // 客製自己想要的條件
    body('repassword')
        .custom((value, { req }) => {
            return value === req.body.password;
        })
        .withMessage('密碼驗證不一致'),
];

// nodejs 內建的物件
const path = require('path');
// 如果是用 FormData 上傳圖片，Content-Type 會是：
// Content-Type: multipart/form-data;
// 就要用 multer 相關的套件來處理
// npm i multer
const multer = require('multer');
// 圖面要存在哪裡？
const storage = multer.diskStorage({
    // 設定儲存的目的地（檔案夾）
    // 要先手動建立好檔案夾 /public/uploads
    destination: function (req, file, cb) {
        // path.join 避免不同作業系統之間的 / 或 \
        // __dirname 目前檔案的位置，用 __dirname 就可以不用管是在哪裡執行程式的
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
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

// C:\Users\QQ\Documents\MFEE27-HAMAYA-BE\public\uploads\logo.svg
//登入
// /api/googleAuth
router.post('/', async (req, res, next) => {
    console.log('login Innnnnnnn');
    // console.log('login', req.body);
    // TODO: 資料驗證
    // 確認這個 email 有沒有註冊過
    let [members] = await pool.execute('SELECT * FROM users WHERE email = ?', [req.body.email]);
    if (members.length == 0) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
    }
    let member = members[0];
    // // 有註冊過，就去比密碼

    //TODO:判斷帳號是否啟用
    if (member.enable === 0) {
        return res.status(401).json({ message: '帳號未啟用請至註冊信箱點選認證信' });
    }

    //比對密碼雜湊
    let compareResult = await bcrypt.compare(req.body.password, member.password);
    if (!compareResult) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    // 密碼比對成功 -> 存在 session
    let saveMember = {
        id: member.id,
        fullName: member.name,
        email: member.email,
        phone: member.phone,
        city: member.city,
        dist: member.dist,
        address: member.address,
        birthday: member.birthday,
        photo: member.photo,
        sub: member.sub,
        loginDt: new Date().toISOString(),
    };
    // 把資料寫進 session 裡
    req.session.member = saveMember;
    console.log(req.session);
    // // 回覆前端登入成功
    res.json(saveMember);
    // res.json({ message: 'TESTOK' });
});

//登出
// /api/auth/logout
router.get('/logout', (req, res, next) => {
    req.session.member = null;
    res.json({ message: '已登出' });
});

//更新資料
// /api/auth/profile
router.patch('/profile', uploader.single('photo'), async (req, res, next) => {
    console.log('會員資料更新: id =', req.body.id, ', name =', req.body.fullName);
    //表單驗證
    if (!req.session.member) {
        return res.status(401).json({ message: '已登出請重新登入' });
    }
    if (req.body.fullName === '') {
        return res.status(401).json({ message: '請填寫完整姓名' });
    }

    let filename = req.file ? '/uploads/' + req.file.filename : req.session.member.photo;
    let result = await pool.execute('UPDATE users SET name=?, phone=?, city=?, dist=?, address=?, birthday=?, photo=?, sub=? WHERE id=?', [
        req.body.fullName,
        req.body.phone,
        req.body.city,
        req.body.dist,
        req.body.address,
        req.body.birthday,
        filename,
        req.body.sub,
        req.body.id,
    ]);
    // console.log(result);

    // 更新session
    let [members] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.body.id]);
    let member = members[0];
    let saveMember = {
        id: member.id,
        fullName: member.name,
        email: member.email,
        phone: member.phone,
        city: member.city,
        dist: member.dist,
        address: member.address,
        birthday: member.birthday,
        photo: member.photo,
        sub: member.sub,
        loginDt: new Date().toISOString(),
    };
    req.session.member = saveMember;
    res.json([saveMember, '會員資料修改成功']);
    // res.json({ message: '新增照片成功', photo: filename });
});

//更新密碼
// /api/auth/password
router.patch('/password', async (req, res, next) => {
    console.log('password', req.body);
    //拿會員舊密碼
    let [members] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.body.id]);
    let member = members[0];
    console.log(member.password);
    console.log('update password');
    // //雜湊會員輸入舊密碼
    // let hashedPassword = await bcrypt.hash(req.body.password, 10);
    // console.log('hash', hashedPassword);
    //比對雜湊舊密碼
    let compareResult = await bcrypt.compare(req.body.password, member.password);
    console.log('com', compareResult);
    if (!compareResult) {
        return res.status(401).json({ message: '舊密碼輸入錯誤' });
    }
    if (req.body.newpassword.length < 8) {
        return res.status(401).json({ message: '密碼長度至少為 8' });
    }
    if (!(req.body.newpassword === req.body.renewpassword)) {
        return res.status(401).json({ message: '新密碼驗證不一致' });
    }
    //雜湊新密碼
    let hashedNewPassword = await bcrypt.hash(req.body.newpassword, 10);
    //儲存雜湊新密碼
    await pool.execute('UPDATE users SET password=? WHERE id=?', [hashedNewPassword, req.session.member.id]);
    res.json({ message: '密碼修改成功' });
});

//啟用會員帳號
//http://localhost:3001/api/auth/enable?userid=12&key=xdxjruurpg
router.get('/enable', async (req, res, next) => {
    console.log('enable member');
    // console.log(req.data);
    const userid = req.query.userid;
    const key = req.query.key;

    let [userkeyArr] = await pool.execute('SELECT * FROM user_enable WHERE user_id = ?', [userid]);
    let userkey = userkeyArr[0];
    // if (userkey.length == 0) {
    //     return res.status(401).json({ message: '啟用失敗' });
    // }

    //讀取儲存至 user_enable資料庫之雜湊完key

    let compareResult = await bcrypt.compare(key, userkey.enable_key);
    console.log('compareResult', compareResult);
    if (!compareResult) {
        return res.status(401).json({ message: '啟用失敗' });
    }
    await pool.execute('UPDATE users SET enable=1 WHERE id=?', [userid]);
    res.json({ message: '帳號啟用成功' });
});

module.exports = router;
