const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');

let myclassRouter = require('./myclass');
router.use('/myclass', myclassRouter);

let mybucketlistRouter = require('./mybucketlist');
router.use('/mybucketlist', mybucketlistRouter);

let mycartRouter = require('./mycart');
router.use('/mycart', mycartRouter);

let myorderRouter = require('./myorder');
router.use('/myorder', myorderRouter);

let mycouponRouter = require('./mycoupon');
router.use('/mycoupon', mycouponRouter);

let myquestionRouter = require('./myquestion');
router.use('/myquestion', myquestionRouter);

let myplaceRouter = require('./myplace');
router.use('/myplace', myplaceRouter);

module.exports = router;
