/**
 * 描述: 用户路由模块
 * 作者: Jack Chen
 * 日期: 2020-06-20
*/

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const user = require('../services/userService');

const fs = require('fs');
const multer = require('multer');
const upload = multer({
    dest: './public/uploads/'
}).single('avatar');
const uploadMore = multer({
    dest: './public/uploads/'
}).array('file', 5);


// 登录/注册校验
// const vaildator = [
//   body('username').isString().withMessage('用户名类型错误'),
//   body('password').isString().withMessage('密码类型错误')
// ]

// 重置密码校验
const resetPwdVaildator = [
  body('username').isString().withMessage('用户名类型错误'),
  body('oldPassword').isString().withMessage('密码类型错误'),
  body('newPassword').isString().withMessage('密码类型错误')
]

// 验证码登录
router.post('/login', user.login);

// 获取图形验证码
router.get('/getCaptcha', user.getCaptcha);

// 发送短信验证码
router.get('/sendCoreCode', user.sendCoreCode);

// 密码登录
router.post('/loginPwd', user.loginPwd);

// 密码重置
// router.post('/resetPwd', resetPwdVaildator, service.resetPwd);


module.exports = router;

