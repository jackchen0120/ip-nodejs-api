/**
 * 描述: 用户路由模块
 * 作者: Jack Chen
 * 日期: 2020-06-20
*/

const express = require('express');
const router = express.Router();
const user = require('../services/userService');
const auth = require('../services/authService');
const path = require('path');

const multer = require('multer');
const upload = multer({
    dest: path.join(__dirname, '../public/uploads/')
}).single('file');
// const uploadMore = multer({
//     dest: './public/uploads/'
// }).array('file', 5);


// 验证码登录
router.post('/login', user.login);

// 获取图形验证码
router.get('/getCaptcha', user.getCaptcha);

// 发送短信验证码
router.get('/sendCoreCode', user.sendCoreCode);

// 密码登录
router.post('/loginPwd', user.loginPwd);

// github登录
router.get('/oauthGithub', auth.oauthGithub);

// weibo登录
router.get('/oauthWeibo', auth.oauthWeibo);

// 获取个人信息
router.get('/getMemberInfo', user.getMemberInfo);

// 修改个人信息
router.post('/modifyUser', user.modifyUser);

// 上传头像
router.post('/editUserAvatar', upload, user.editUserAvatar);

// 获取七牛云上传凭证
router.get('/qiniuToken', user.uploadQiniu);

// 密码重置
// router.post('/resetPwd', service.resetPwd);


module.exports = router;

