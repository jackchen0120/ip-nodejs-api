/**
 * 描述: 用户路由模块
 * 作者: Jack Chen
 * 日期: 2020-06-20
*/

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const user = require('../services/userService');
const auth = require('../services/authService');

const fs = require('fs');
const multer = require('multer');
const upload = multer({
    dest: './public/uploads/'
}).single('avatar');
// const uploadMore = multer({
//     dest: './public/uploads/'
// }).array('file', 5);


// 重置密码校验
// const resetPwdVaildator = [
//   body('username').isString().withMessage('用户名类型错误'),
//   body('oldPassword').isString().withMessage('密码类型错误'),
//   body('newPassword').isString().withMessage('密码类型错误')
// ]

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

// 密码重置
// router.post('/resetPwd', resetPwdVaildator, service.resetPwd);


module.exports = router;

