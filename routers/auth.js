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

//登入驗證
// /api/auth
router.get('/', async (req, res, next) => {
    try {
        console.log('check Login');
        console.log(req.session.member);
        if (!req.session.member) {
            return res.status(401).json({ message: '尚未登入' });
        }
        // 更新session
        let [members] = await pool.execute('SELECT * FROM users WHERE email = ?', [req.session.member.email]);
        let member = members[0];
        if (member.enable === 0) {
            return res.status(401).json({ message: '帳號未啟用請至註冊信箱點選認證信' });
        }
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
        res.json(saveMember);
    } catch (err) {
        console.log(err);
    }
});

//註冊
// /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        //表單驗證
        const checkForm = {};
        //姓名驗證
        if (req.body.fullName === '') {
            checkForm.fullName = '*請輸入姓名';
        }
        //email驗證
        if (req.body.email === '') {
            checkForm.email = '*請輸入信箱';
        }
        const emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
        if (req.body.email.search(emailRule) == -1) {
            checkForm.email = '*請填寫正確 email 格式';
        }
        let [members] = await pool.execute('SELECT * FROM users WHERE email = ?', [req.body.email]);
        if (members.length > 0) {
            checkForm.email = '*這個 email 已經註冊過';
            // return res.status(400).json({ message: '這個 email 已經註冊過' });
        }
        //密碼驗證
        if (req.body.password.length < 8) {
            checkForm.password = '*密碼長度至少為 8';
        }
        if (!(req.body.password === req.body.repassword)) {
            checkForm.password = '*密碼驗證不一致';
            // return res.status(401).json({ message: '密碼驗證不一致' });
        }

        if (Object.keys(checkForm).length != 0) {
            console.log('date', req.body.date);
            res.status(401).json(checkForm);
            return;
        }

        // 密碼要雜湊 hash
        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        // 資料存到資料庫
        let filename = req.file ? '/uploads/' + req.file.filename : '';
        let [result] = await pool.execute('INSERT INTO users (name, email, password, sub) VALUES (?, ?, ?, ?);', [req.body.fullName, req.body.email, hashedPassword, req.body.sub]);
        console.log('insert new member', result);

        //產生隨機10位密碼 並雜湊存進資料庫
        let key = Math.random().toString(36).substring(2);
        let hashkey = await bcrypt.hash(key, 10);
        console.log('key', key);
        console.log('result.insertId', result.insertId);
        console.log('hashkey', hashkey);
        let [result2] = await pool.execute('INSERT INTO user_enable (user_id, enable_key) VALUES (?, ? );', [result.insertId, hashkey]);
        //寄送認證信至註冊帳號
        res.json({ message: '歡迎唷~!已寄送認證信至註冊信箱' });
        //http://localhost:3000/enable?id=${result2.insertId}&key=${key}
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mffee27hamaya@gmail.com',
                pass: 'cmcgsgffouiiyxbr',
            },
        });
        let sendemail = await transporter.sendMail({
            from: 'mffee27hamaya@gmail.com',
            to: req.body.email,
            subject: 'HAMAYA MUSIC會員啟用認證信',
            html: `<div 
                        style="
                        font-family: Sans-Serif;
                        width: 500px;
                        height: 250px;
                        background-color: #00323d;
                        text-align: center;
                        letter-spacing: 0.1rem;
                        padding-top: 10px;"
                        >
                        <img src="https://upload.cc/i1/2022/09/29/Q1UzAD.png"
                            style="
                            width: 500px;
                            align-self: center;
                            margin: 20px 0 5px 0;"
                            alt="HAMAYA" />
                        <h2 
                            style="
                            font-size: 1.7rem;
                            color: #f2f2f2;
                            margin: 15px 0;
                        ">親愛的HAMAYA會員您好</h2>
                        <a 
                            href="http://localhost:3000/enable?id=${result2.insertId}&key=${key}"
                            title="HAMAYA會員啟用帳號連結"
                            style="
                            font-size: 1.5rem;
                            text-align: center;
                            display: block;
                            height: 50px;
                            background-color: #6a777a;
                            color: #f2f2f2;
                            text-decoration: none;
                            line-height: 50px;
                            font-weight: bold;
                        ">請點選此處前往啟用帳號</a>
                    </div>`,
        });
        console.log('sendemail', sendemail);
    } catch (err) {
        console.log(err);
    }
});
// C:\Users\QQ\Documents\MFEE27-HAMAYA-BE\public\uploads\logo.svg
//登入
// /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        console.log('member login');
        // 確認這個 email 有沒有註冊過
        let [members] = await pool.execute('SELECT * FROM users WHERE email = ?', [req.body.email]);
        if (members.length == 0) {
            return res.status(401).json({ message: '帳號或密碼錯誤' });
        }
        let member = members[0];
        // 有註冊過，就去比密碼

        // 判斷帳號是否啟用
        if (member.enable === 0) {
            return res.status(401).json({ message: '帳號未啟用請至註冊信箱點選認證信' });
        }

        // 比對密碼雜湊
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
    } catch (err) {
        console.log(err);
    }
});

//登出
// /api/auth/logout
router.get('/logout', (req, res, next) => {
    try {
        req.session.member = null;
        res.json({ message: '已登出' });
    } catch (err) {
        console.log(err);
    }
});

//更新資料
// /api/auth/profile
router.patch('/profile', uploader.single('photo'), async (req, res, next) => {
    try {
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
    } catch (err) {
        console.log(err);
    }
});

//更新密碼
// /api/auth/password
router.patch('/password', async (req, res, next) => {
    try {
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
            return res.status(401).json({ message: '新密碼長度至少為 8' });
        }
        if (!(req.body.newpassword === req.body.renewpassword)) {
            return res.status(401).json({ message: '新密碼驗證不一致' });
        }
        //雜湊新密碼
        let hashedNewPassword = await bcrypt.hash(req.body.newpassword, 10);
        //儲存雜湊新密碼
        await pool.execute('UPDATE users SET password=? WHERE id=?', [hashedNewPassword, req.session.member.id]);
        res.json({ message: '密碼修改成功' });
    } catch (err) {
        console.log(err);
    }
});

//啟用會員帳號
//http://localhost:3001/api/auth/enable?userid=12&key=xdxjruurpg
router.get('/enable', async (req, res, next) => {
    try {
        console.log('enable member');
        const id = req.query.id;
        const key = req.query.key;
        let [userkeyArr] = await pool.execute('SELECT * FROM user_enable WHERE id = ?', [id]);
        let userkey = userkeyArr[0];

        //讀取儲存至 user_enable資料庫之雜湊完key
        let compareResult = await bcrypt.compare(key, userkey.enable_key);
        console.log('compareResult', compareResult);
        if (!compareResult) {
            return res.status(401).json({ message: '啟用失敗' });
        }
        await pool.execute('UPDATE users SET enable=1 WHERE id=?', [userkey.user_id]);
        res.json({ message: '帳號啟用成功' });
    } catch (err) {
        console.log(err);
    }
});

//忘記密碼寄送修改密碼連結
//http://localhost:3001/api/auth/forgetpassword
router.post('/forgetpassword', async (req, res, next) => {
    try {
        console.log('forgetpassword');
        if (req.body.email === '') {
            return res.status(401).json({ message: '請輸入註冊E-MAIL' });
        }
        const emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
        if (req.body.email.search(emailRule) == -1) {
            return res.status(401).json({ message: '請填寫正確 email 格式' });
        }
        //檢查email 讀取使用者資料
        let [members] = await pool.execute('SELECT * FROM users WHERE email = ?', [req.body.email]);

        if (members.length == 0) {
            return res.status(401).json({ message: '此帳號尚未註冊' });
        }
        let member = members[0];

        //產生隨機10位密碼 並雜湊存進資料庫
        let key = Math.random().toString(36).substring(2);
        let hashkey = await bcrypt.hash(key, 10);
        console.log('hashkey', hashkey);
        let [result] = await pool.execute('INSERT INTO user_forget (user_id, forget_key) VALUES (?, ? );', [member.id, hashkey]);
        //寄送認證信至註冊帳號
        res.json({ message: '已寄送重設密碼連結至註冊信箱' });
        //http://localhost:3000/forget?id=${result.insertId}&key=${key}
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'mffee27hamaya@gmail.com',
                pass: 'cmcgsgffouiiyxbr',
            },
        });
        let sendemail = await transporter.sendMail({
            from: 'mffee27hamaya@gmail.com',
            to: req.body.email,
            subject: 'HAMAYA MUSIC會員重設密碼',
            html: `<div 
                        style="
                        font-family: Sans-Serif;
                        width: 500px;
                        height: 250px;
                        background-color: #5b322f;
                        text-align: center;
                        letter-spacing: 0.1rem;
                        padding-top: 10px;"
                        >
                        <img src="https://upload.cc/i1/2022/09/29/Q1UzAD.png"
                        style="
                        width: 500px;
                        align-self: center;
                        margin: 20px 0 5px 0;"
                        alt="HAMAYA" />
                        <h2 
                            style="
                            font-size: 1.7rem;
                            color: #f2f2f2;
                            margin: 15px 0;
                        ">親愛的HAMAYA會員您好</h2>
                        <a 
                            href="http://localhost:3000/forget?id=${result.insertId}&key=${key}"
                            title="HAMAYA會員啟用帳號連結"
                            style="
                            font-size: 1.5rem;
                            text-align: center;
                            display: block;
                            height: 50px;
                            background-color: #6a777a;
                            color: #f2f2f2;
                            text-decoration: none;
                            line-height: 50px;
                            font-weight: bold;
                        ">請點選此處重設密碼</a>
                    </div>`,
        });
        console.log('sendemail', sendemail);
    } catch (err) {
        console.log(err);
    }
});
//忘記密碼修改
//http://localhost:3001/api/auth/forget?id=12&key=xdxjruurpg
router.patch('/newpassword', async (req, res, next) => {
    try {
        //讀取儲存至 user_forget資料庫之雜湊完key
        let [userkeyArr] = await pool.execute('SELECT * FROM user_forget WHERE id = ?', [req.body.id]);
        let userkey = userkeyArr[0];
        //比較資料庫與會員持有key是否相同
        let compareResult = await bcrypt.compare(req.body.key, userkey.forget_key);
        if (!compareResult) {
            return res.status(401).json({ message: '認證失敗' });
        }
        if (req.body.newpassword.length < 8) {
            return res.status(401).json({ message: '新密碼長度至少為 8' });
        }
        if (!(req.body.newpassword === req.body.renewpassword)) {
            return res.status(401).json({ message: '新密碼驗證不一致' });
        }
        //雜湊新密碼
        let hashedNewPassword = await bcrypt.hash(req.body.newpassword, 10);
        //儲存雜湊新密碼
        await pool.execute('UPDATE users SET password=? WHERE id=?', [hashedNewPassword, userkey.user_id]);
        res.json({ message: '密碼修改成功' });
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;
