const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

let customerserviceRouter = require('./customerservice');
router.use('/customerservice', customerserviceRouter);

let couponRouter = require('./coupon');
router.use('/coupon', couponRouter);

let membersRouter = require('./members');
router.use('/members', membersRouter);

// http://localhost:3001/api//admin/login
router.post('/login', async (req, res, next) => {
    console.log('admin login');
    // console.log('login', req.body);
    // 確認這個 email 有沒有註冊過
    let [members] = await pool.execute('SELECT * FROM admin WHERE account = ?', [req.body.account]);
    if (members.length == 0) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
    }
    let member = members[0];
    // //暫時註解
    // // let compareResult = await bcrypt.compare(req.body.password, member.password);
    // // if (!compareResult) {
    // //     // 如果密碼不對，就回覆 401
    // //     return res.status(401).json({ message: '帳號或密碼錯誤' });
    // // }
    //TODO:測試暫時跳過密碼雜湊
    if (!(req.body.password === member.password)) {
        // 如果密碼不對，就回覆 401
        return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    // 密碼比對成功 -> 存在 session
    let saveMember = {
        id: member.id,
        fullName: member.name,
        account: member.account,
    };
    // 把資料寫進 session 裡
    req.session.member = saveMember;
    console.log(req.session);
    // // 回覆前端登入成功
    res.json(saveMember);
    // res.json({ message: 'TESTOK' });
});

//登出
// http://localhost:3001/api//admin/logout
router.get('/logout', (req, res, next) => {
    console.log('admin logout');
    req.session.member = null;
    res.json({ message: '已登出' });
});

module.exports = router;
