const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

//一般問答
//http://localhost:3001/api/admin/customerservice/commonqa/loading
router.get('/loading', async (req, res, next) => {
    console.log('loading members');
    let [result] = await pool.execute('SELECT * FROM users ORDER BY create_time DESC');
    // io.on('connection', (socket) => {
    //     socket.emit(`userid${req.data.id}`, '連線成功');
    // });
    res.json(result);
});

module.exports = router;
