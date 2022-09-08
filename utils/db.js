// 初始化 dotenv
require('dotenv').config();
const mysql = require('mysql2');
// TODO: createPool
let pool = mysql
    .createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 10,
        // 請保持 date 是 string，不要轉成 js 的 date 物件
        dateStrings: true,
    })
    .promise();

module.exports = pool;
