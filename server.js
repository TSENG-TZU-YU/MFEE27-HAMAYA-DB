const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.SERVER_PORT;
const pool = require('./utils/db.js');
const path = require('path');

// nodejs 內建的 http 功能
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000'],
        credentials: true,
    },
});

//傳到router中才能被呼叫
app.io = io;

// 當有 client 連線的時候，觸發這個 connection 事件
io.on('connection', (socket) => {
    console.log('socket: a user connected', socket.id);
    socket.on('disconnect', () => {
        console.log('socket: user disconnected');
    });
    //會員連線
    socket.on('memberName', (data) => {
        console.log('會員連線', data.fullName);
        socket.emit(`userid${data.id}`, '連線成功');
    });
    //管理員連線
    socket.on('customer_conn', async (data) => {
        console.log('管理員連線', data.customer_id);

        //尋找會員user_id
        let [getMemberArray] = await pool.execute('SELECT * FROM user_qna WHERE id=?', [data.user_qna_id]);
        let getMember = getMemberArray[0];
        console.log('getMember', getMember);

        //傳送管理員ID給會員
        io.emit(`userid${getMember.user_id}`, { customer_id: data.customer_id });
    });
});

const cors = require('cors');
const corsOptions = {
    // 如果要讓 cookie 可以跨網域存取，這邊要設定 credentials
    // 且 origin 也要設定
    credentials: true,
    origin: ['http://localhost:3000'],
};
app.use(cors(corsOptions));

// 啟用 session
const expressSession = require('express-session');
// 把 session 存在硬碟中
var FileStore = require('session-file-store')(expressSession);
app.use(
    expressSession({
        store: new FileStore({
            // session 儲存的路徑
            path: path.join(__dirname, '..', 'sessions'),
        }),
        secret: process.env.SESSION_SECRET,
        // 如果 session 沒有改變的話，要不要重新儲存一次？
        resave: false,
        // 還沒初始化的，要不要存
        saveUninitialized: false,
    })
);

app.use(express.json());

// http://localhost:3001/public/uploads/member-1662947792766.jpg
app.use('/public', express.static(path.join(__dirname, 'public')));

let authRouter = require('./routers/auth');
app.use('/api/auth', authRouter);

let membrtRouter = require('./routers/member');
app.use('/api/member', membrtRouter);

let homeRouter = require('./routers/home');
app.use('/api/home', homeRouter);

let newsRouter = require('./routers/news');
app.use('/api/news', newsRouter);

let productsRouter = require('./routers/products');
app.use('/api/products', productsRouter);

let classRouter = require('./routers/class');
app.use('/api/class', classRouter);

let placeRouter = require('./routers/place');
app.use('/api/place', placeRouter);

let aboutusRouter = require('./routers/aboutus');
app.use('/api/aboutus', aboutusRouter);

let adminRouter = require('./routers/admin');
app.use('/api/admin', adminRouter);

app.use((req, res, next) => {
    console.log('在所有路由中間件的下面 -> 404 了！');
    res.status(404).send('Not Found!!');
});

// 啟動 server，並且開始 listen 一個 port
server.listen(port, () => {
    console.log(`server start at ${port}`);
});
