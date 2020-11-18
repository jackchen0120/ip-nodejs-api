/**
 * 描述: jwt-token验证和解析函数
 * 作者: Jack Chen
 * 日期: 2020-06-20
 */

const jwt = require('jsonwebtoken'); // 引入验证jsonwebtoken模块
const expressJwt = require('express-jwt'); // 引入express-jwt模块
const {
  PRIVATE_KEY
} = require('./constant'); // 引入自定义的jwt密钥

// 验证token是否过期
const jwtAuth = expressJwt({
  // 设置密钥
  secret: PRIVATE_KEY,
  // 设置为true表示校验，false表示不校验
  credentialsRequired: true,
  // 自定义获取token的函数
  getToken: (req) => {
    if (req.headers.authorization) {
      return req.headers.authorization;
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
  // 设置jwt认证白名单，比如/api/login登录接口不需要拦截
}).unless({
  path: [
    '/',
    '/api/users/getCaptcha',
    '/api/users/sendCoreCode',
    '/api/users/login',
    '/api/users/loginPwd',
    '/api/users/oauthGithub',
    '/api/users/oauthWeibo',
  ]
})

// jwt-token解析
const decode = (req) => {
  const token = req.get('Authorization');
  let con = jwt.verify(token, PRIVATE_KEY, (err, decoded) => {
    if (err) {
      console.log('error===', err);
      if (err.name == 'TokenExpiredError') { // token过期
        let str = {
          iat: 1,
          exp: 0,
          msg: 'token过期'
        }
        return str;
      } else if (err.name == 'JsonWebTokenError') { // 无效的token
        let str = {
          iat: 1,
          exp: 0,
          msg: '无效的token'
        }
        return str;
      }
    } else {
      return decoded;
    }

  });

  console.log('con===', con);
  if (con.iat < con.exp) {
    // 开始时间小于结束时间，代表token还有效
    return true;
  } else {
    return false;
  }
}

module.exports = {
  jwtAuth,
  decode
}