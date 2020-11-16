/**
 * 描述: 业务逻辑处理 - 用户相关接口
 * 作者: Jack Chen
 * 日期: 2020-06-20
*/


const { 
  querySql, 
  queryOne, 
  randomCode,
  redirect_uri
} = require('../utils/index');
const md5 = require('../utils/md5');
const jwt = require('jsonwebtoken');
const boom = require('boom');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const {
  CODE_ERROR,
  CODE_SUCCESS,
  PRIVATE_KEY,
  JWT_EXPIRED
} = require('../utils/constant');
// const { decode } = require('../utils/user-jwt');
const svgCaptcha = require('svg-captcha');
const smsConfig = require('../utils/smsConfig');
const uuid = require('node-uuid');
const moment = require('moment');


// 验证手机号是否发过短信验证码
let validatePhoneCode = [];
let sendCodePhone = (phone) => {
  console.log('validatePhoneCode===', validatePhoneCode);
  for (let item of validatePhoneCode) {
    if (phone == item.phone) {
      return true;
    }
  }
  return false;
}

// 匹配手机号和短信验证码
let findCodeAndPhone = (phone, sms) => {
  for (let item of validatePhoneCode) {
    if (phone == item.phone && sms == item.sms) {
      return 'login';
    }
  }
  return 'error';
}

// 获取token
const getToken = (username) => {
  // 登录成功，签发一个token并返回给前端
  let token = jwt.sign(
    // payload：签发的 token 里面要包含的一些数据。
    { username },
    // 私钥
    PRIVATE_KEY,
    // 设置过期时间
    { expiresIn: JWT_EXPIRED }
  )

  return token;
}

// 用户注册
const regUser = async (phone) => {
  // 检测用户是否第一次注册
  let sql = `insert into user(user_id, phone, status, create_time) value('${uuid.v1()}', '${phone}', 1, '${moment().format('YYYY-MM-DD HH:mm:ss')}')`;
  let res = await queryOne(sql);
  
  console.log('用户注册===', res);
  if (res.affectedRows == 1) {
    // 执行成功获取用户信息，获取用户信息的方法
    let user = await getUser(phone);

    // 创建用户副表
    let userinfo = await createUserInfo(user[0].user_id);
    if (userinfo.affectedRows == 1) {
      return user;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// 创建用户副表
const createUserInfo = (user_id) => {
  let sql = `insert into user_info(user_id) values('${user_id}')`;
  return queryOne(sql);
}

// 腾讯云短信验证码
const sendCoreCode = (req, res) => {
  let { phone } = req.query;
  let sms = randomCode(1000, 9999);
  let params = {
    'PhoneNumberSet': [
      `+86${phone}`
    ],
    'TemplateID': '738936',
    'Sign': '懒人码农',
    'TemplateParamSet': [
      sms,
      '30'
    ],
    'SmsSdkAppid': '1400433036'
  }
  smsConfig.reqSms.from_json_string(JSON.stringify(params));

  smsConfig.client.SendSms(smsConfig.reqSms, (errMsg, response) => {
    // 请求异常返回，打印异常信息
    if (errMsg) {
      res.send({
        code: 400,
        msg: '短信发送失败'
      })
      return;
    }
    // 请求正常返回，打印response对象
    // console.log('response===', response.to_json_string());
    res.send({
      code: 200,
      msg: '短信发送成功'
    })
    validatePhoneCode.push({
      phone: phone,
      sms: sms
    })
  });
}

// 验证码登录
const login = async (req, res, next) => {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    let { phone, captcha, sms } = req.body;
    // console.log('req.session===', req.session.captcha)
    if (typeof req.session.captcha == 'undefined') {
      res.json({
        code: -2,
        msg: '重新输入图形验证码',
        data: null
      })
      return false;
    }

    if (captcha.toLowerCase() == req.session.captcha) {
      if (sendCodePhone(phone)) {
        // 短信验证码和手机号是否匹配
        let status = findCodeAndPhone(phone, sms);
        if (status == 'login') {
          // 登录成功之后的操作
          const sql = `select id, user_id, username, phone, status, create_time, update_time from user where phone='${phone}'`;
          let user = await queryOne(sql);
          console.log('验证码登录===', user);
          if (!user || user.length == 0) {
            // 用户第一次注册，绑定表
            let newUser = await regUser(phone);
            
            if (newUser && newUser.length > 0) {
              let token = getToken(phone);
              let userinfo = newUser[0];
              let addSql = `insert into user_image(user_id) values('${userinfo.user_id}')`;
              let addUserImage = await queryOne(addSql);

              if (addUserImage) {
                res.json({
                  code: CODE_SUCCESS,
                  msg: '自动注册成功',
                  data: {
                    token,
                    userinfo
                  }
                })
              }
            } else {
              res.json({
                code: CODE_ERROR,
                msg: '自动注册失败',
                data: null
              })
            }
          } else {
            let token = getToken(phone);
            let userinfo = user[0];

            res.json({
              code: CODE_SUCCESS,
              msg: '登录成功',
              data: {
                token,
                userinfo
              }
            })
          }
        } else if (status == 'error') {
          res.json({
            code: CODE_ERROR,
            msg: '手机号或验证码错误',
            data: null
          })
        }
      } else {
        res.json({
          code: CODE_ERROR,
          msg: '短信错误或已过期',
          data: null
        })
      }
    } else {
      res.json({
        code: CODE_ERROR,
        msg: '图形验证码错误',
        data: null
      })
    }
  }
}

// 获取图形验证码
const getCaptcha = (req, res) => {
  let codeConfig = {
    size: 4, // 验证码长度
    ignoreChars: '0o1i', // 验证码字符中排除 0o1i
    noise: 0, // 干扰线条数
    width: 60, // 宽度
    height: 30, // 高度
    inverse: false, // 翻转颜色
    fontSize: 35, // 字体大小
  }
  let getImageCode = svgCaptcha.create(codeConfig);
  req.session.captcha = getImageCode.text.toLowerCase();
  // console.log('captcha===', req.session);

  res.type('svg');
  res.status(200).send(getImageCode.data);
}

// 密码登录
const loginPwd = async (req, res, next) => {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    let { username, password } = req.body;
    // md5加密
    password = md5(password);
    console.log('pwd===', password);
    const sql = `select id, user_id, username, phone, status, create_time, update_time from user where username='${username}' or phone='${username}' and password='${password}'`;
    let user = await queryOne(sql);
    console.log(user);
    if (user) {
      let token = getToken(username);
      let userinfo = user[0];

      res.json({
        code: CODE_SUCCESS,
        msg: '登录成功',
        data: {
          token,
          userinfo
        }
      })
    } else {
      res.json({ 
        code: CODE_ERROR, 
        msg: '用户名或密码错误', 
        data: null 
      })
    }
  }
}


// 重置密码
const resetPwd = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { username, oldPassword, newPassword } = req.body;
    oldPassword = md5(oldPassword);
    let validUser = await validateUser(username, oldPassword);
    
    console.log('校验用户名和密码===', validUser);
    if (validUser) {
      if (newPassword) {
        newPassword = md5(newPassword);
        const sql = `update user set password='${newPassword}' where username='${username}' or phone='${username}'`;
        querySql(sql)
          .then(user => {
            // console.log('密码重置===', user);
            if (!user || user.length === 0) {
              res.json({
                code: CODE_ERROR,
                msg: '重置密码失败',
                data: null
              })
            } else {
              res.json({
                code: CODE_SUCCESS,
                msg: '重置密码成功',
                data: null
              })
            }
          })
      } else {
        res.json({
          code: CODE_ERROR,
          msg: '新密码不能为空',
          data: null
        })
      }

    } else {
      res.json({
        code: CODE_ERROR,
        msg: '用户名或旧密码错误',
        data: null
      })
    }
  }
}

// 通过用户名或手机号查询用户表
const getUser = (username) => {
  const sql = `select id, user_id, username, phone, status, create_time, update_time from user where username='${username}' or phone='${username}'`;
  return queryOne(sql);
}

// 获取注册的用户详情
const getUserInfo = (user_id) => {
    let sql = `select * from user_info where user_id='${user_id}'`;
    return queryOne(sql);
}

// 校验用户名和密码
const validateUser = (username, oldPassword) => {
  const sql = `select id, username from user where username='${username}' or phone='${username}' and password='${oldPassword}'`;
  return queryOne(sql);
}

// 查看用户个人信息
const getMemberInfo = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { user_id } = req.query;
    let userinfo = await getUserInfo(user_id);
    console.log('userinfo===', userinfo);

    if (userinfo) {
      res.send({
        code: CODE_SUCCESS,
        msg: '获取个人信息成功',
        data: userinfo[0]
      })
    } else {
      res.send({
        code: CODE_ERROR,
        msg: '获取个人信息失败',
        data: null
      })
    }
  }
}

// 编辑用户个人信息
const modifyUser = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { user_id, avatar, nickname, age, sex, birthday, area, address, code } = req.body;
    let userinfo = await getUserInfo(user_id);
    
    if (userinfo) {
      const sql = `update user_info set avatar='${avatar}', nickname='${nickname}', age='${age}', sex='${sex}', birthday='${birthday}', area='${area}', code='${code}', address='${address}' where user_id='${user_id}'`;
      let updateInfo = await queryOne(sql);

      if (updateInfo) {
        res.send({
          code: CODE_SUCCESS,
          msg: '修改个人信息成功'
        })
      } else {
        res.send({
          code: CODE_ERROR,
          msg: '修改个人信息失败'
        })
      }
    } else {
      res.send({
        code: CODE_ERROR,
        msg: '查询个人信息失败'
      })
    }
    
  }
}

// 修改头像（单图上传）
const editUserAvatar = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let file = req.file;
    if (file) {
        // 存储上传对象信息
        let fileInfo = {};
        // 修改名字，第一个参数为旧路径，第二个参数为新路径（注意：旧路径要和上面的dest保持一致）
        fs.renameSync('./public/uploads/' + file.filename, './public/uploads/' + file.filename + '.' + file.originalname.split('.')[1]);
        // 获取文件信息
        console.log('file===',file)
        fileInfo.mimetype = file.mimetype;
        fileInfo.originalname = file.originalname;
        fileInfo.size = file.size;
        fileInfo.path = file.path;

        // 设置响应类型及编码
        res.set({
            'content-type': 'application/json; charset=utf-8'
        })

        let { user_id } = req.body;
        let imgUrl = redirect_uri + '/static/uploads/' + file.filename + '.' + file.originalname.split('.')[1];
        
        if (user_id) {
            let sql = `update user_image set url='${imgUrl}', create_time='${moment().format('YYYY-MM-DD HH:mm:ss')}' where user_id='${user_id}'`;
            let image = await queryOne(sql);

            if (image) {
              res.send({
                code: CODE_SUCCESS,
                msg: '上传头像成功',
                url: imgUrl
              })
            } else {
              res.send({
                code: CODE_ERROR,
                msg: '用户user_id不存在'
              })
            }
            
        } else {
            res.send({
                code: CODE_ERROR,
                msg: '用户user_id不能为空'
            })
        }
      
    } else {
        // 判断图片文件是否存在
        res.send({
            code: CODE_ERROR,
            msg: '上传文件不能为空'
        })
        return;
    }

  }
  
}

// 获取图片详情
const getImageDetail = (user_id) => {
  let sql = `select * from user_image where user_id='${user_id}'`;
  return queryOne(sql);
}

module.exports = {
  login,
  getCaptcha,
  sendCoreCode,
  loginPwd,
  resetPwd,
  modifyUser,
  getMemberInfo,
  editUserAvatar
}
