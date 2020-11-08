/**
 * 描述: 连接mysql模块
 * 作者: Jack Chen
 * 日期: 2020-06-20
*/


const mysql = require('mysql');
const config = require('../db/dbConfig');

// 获取随机验证码
const randomCode = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
}

// github配置
const githubConfig = {
    oauth_uri: 'https://github.com/login/oauth/authorize',
    access_token_url: 'https://github.com/login/oauth/access_token',
    // 获取 github 用户信息 url // eg: https://api.github.com/user?access_token=******&scope=&token_type=bearer
    user_url: 'https://api.github.com/user',

    redirect_uri: "http://localhost:8080",
    client_id: '6f555f8eb5c6677a6f0b',
    client_secret: '5c7284c91cae13f6be05980716788cec6dafd960',
};

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
      console.log('sql===', res)
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
  querySql,
  queryOne,
  randomCode,
  githubConfig
}