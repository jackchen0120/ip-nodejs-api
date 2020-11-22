const mysql = require('mysql');
const config = require('../db/dbConfig');
const qiniu = require('qiniu');
const redirect_uri = 'http://106.55.168.13';

// 获取随机验证码
const randomCode = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
}

// github配置
const githubConfig = {
    // oauth_uri: 'https://github.com/login/oauth/authorize',
    access_token_url: 'https://github.com/login/oauth/access_token',
    // 获取 github 用户信息 url // eg: https://api.github.com/user?access_token=******&scope=&token_type=bearer
    user_url: 'https://api.github.com/user',

    redirect_uri: redirect_uri,
    client_id: '',
    client_secret: '',
};

// weibo配置
const weiboConfig = {
  // oauth_uri: 'https://api.weibo.com/oauth2/authorize',
  access_token_url: 'https://api.weibo.com/oauth2/access_token',
  // 获取 weibo 用户信息 url // eg: https://api.weibo.com/2/users/show.json?access_token=******&uid=******
  user_url: 'https://api.weibo.com/2/users/show.json',
  
  redirect_uri: redirect_uri,
  client_id: '',
  client_secret: '',
};

// 创建七牛云上传凭证
let bucket = ''; // 上传的空间名
let imageUrl = ''; // 域名名称
let accessKey = '';
let secretKey = '';
let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
let options = {
  scope: bucket,
};
let putPolicy = new qiniu.rs.PutPolicy(options);
let uploadToken = putPolicy.uploadToken(mac);
let qnConfig = new qiniu.conf.Config();
qnConfig.zone = qiniu.zone.Zone_z2;

// 连接mysql
const connect = () => {
  const { host, user, password, database } = config;
  return mysql.createConnection({
    host,
    user,
    password,
    database
  })
}

// 新建查询连接
const querySql = (sql) => { 
  const conn = connect();
  return new Promise((resolve, reject) => {
    try {
      conn.query(sql, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    } catch (e) {
      reject(e);
    } finally {
      // 释放连接
      conn.end();
    }
  })
}

// 查询一条语句
const queryOne = (sql) => {
  return new Promise((resolve, reject) => {
    querySql(sql).then(res => {
      // console.log('queryOne===', res)
      if ((res && res.length > 0) || res.affectedRows == 1) {
        resolve(res);
      } else {
        resolve(null);
      }
    }).catch(err => {
      reject(err);
    })
  })
}

module.exports = {
  queryOne,
  randomCode,
  githubConfig,
  weiboConfig,
  redirect_uri,
  uploadToken
}