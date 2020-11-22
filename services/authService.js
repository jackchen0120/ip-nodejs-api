/**
 * 描述: 业务逻辑处理 - 第三方登录接口
 * 作者: Jack Chen
 * 日期: 2020-11-15
*/

const {
  queryOne,
  githubConfig,
  weiboConfig,
} = require("../utils/index");
const md5 = require("../utils/md5");
const jwt = require("jsonwebtoken");
const boom = require("boom");
const { body, validationResult } = require("express-validator");
const {
  CODE_ERROR,
  CODE_SUCCESS,
  PRIVATE_KEY,
  JWT_EXPIRED,
} = require("../utils/constant");
const axios = require("axios");
const moment = require("moment");

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
  );

  return token;
}

// github登录
const oauthGithub = async (req, res, next) => {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回
    next(boom.badRequest(msg));
  } else {
    let { code } = req.query;
    let tokenResponse = await axios({
      method: "post",
      url: `${githubConfig.access_token_url}?client_id=${githubConfig.client_id}&client_secret=${githubConfig.client_secret}&code=${code}`,
      headers: {
        accept: "application/json",
      },
    });

    // console.log("accessToken===", tokenResponse.data.access_token);
    let accessToken = tokenResponse.data.access_token;

    if (accessToken) {
      let result = await axios({
        method: "get",
        url: `${githubConfig.user_url}`,
        headers: {
          accept: "application/json",
          Authorization: `token ${accessToken}`,
          "User-Agent": "jackchen0120",
        },
      });

      // console.log('result===', result.data);
      let token = getToken(accessToken);
      if (result.status == 200) {
        let user = await validateAuthUser(result.data.id);
        // console.log("githubUser=========", user);
        if (user) {
          user[0].login_times += 1;
          let updateAuthUser = await setAuthUser(result.data, 3, accessToken, 0, user[0].login_times);
          if (updateAuthUser.affectedRows == 1) {
            let userinfo = {
              id: user[0].id,
              openid: user[0].openid,
              user_id: user[0].user_id,
              username: user[0].username,
              nickname: user[0].nickname,
              type: user[0].type,
              avatar_url: user[0].avatar_url,
              create_time: user[0].create_time,
              expire_time: user[0].expire_time,
              expires_in: user[0].expires_in,
              login_time: user[0].login_time,
              login_times: user[0].login_times,
            };
            res.send({
              code: CODE_SUCCESS,
              msg: "github账号登录成功",
              data: {
                token,
                userinfo,
              },
            });
          } else {
            res.send({
              code: CODE_ERROR,
              msg: "github账号登录失败",
              data: null,
            });
          }
        } else {
          let addAuthUser = await setAuthUser(result.data, 3, accessToken, 1, null);
          // console.log("addAuthUser===", addAuthUser);
          if (addAuthUser.affectedRows == 1) {
            let queryUser = await getAuthUser(addAuthUser.insertId);
            let userImage = await addUserImage(queryUser[0].openid);
            
            if (userImage) {
              let userinfo = {
                id: queryUser[0].id,
                openid: queryUser[0].openid,
                user_id: queryUser[0].user_id,
                username: queryUser[0].username,
                nickname: queryUser[0].nickname,
                type: queryUser[0].type,
                avatar_url: queryUser[0].avatar_url,
                create_time: queryUser[0].create_time,
                expire_time: queryUser[0].expire_time,
                expires_in: queryUser[0].expires_in,
                login_time: queryUser[0].login_time,
                login_times: queryUser[0].login_times,
              };

              res.send({
                code: CODE_SUCCESS,
                msg: "github账号登录成功",
                data: {
                  token,
                  userinfo,
                },
              });
            }
          } else {
            res.send({
              code: CODE_ERROR,
              msg: "github账号登录失败",
              data: null,
            });
          }
        }

      } else {
        res.send({
          code: CODE_ERROR,
          msg: "github账号登录失败",
        });
      }

    } else {
      res.send({
        code: CODE_ERROR,
        msg: "code码无效或已过期",
      });
    }
  }
}

// 微博登录
const oauthWeibo = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { code } = req.query;
    let tokenResponse = await axios({
      method: "post",
      url: `${weiboConfig.access_token_url}?client_id=${weiboConfig.client_id}&client_secret=${weiboConfig.client_secret}&grant_type=authorization_code&redirect_uri=${weiboConfig.redirect_uri}&code=${code}`,
      headers: {
        accept: "application/json",
      }
    }).then().catch(err => {
      return err.response;
    });

    // console.log('tokenResponse===', tokenResponse.data.access_token);
    let accessToken = tokenResponse.data.access_token;

    if (accessToken) {
      let uid = tokenResponse.data.uid;
      let result = await axios({
        method: "get",
        url: `${weiboConfig.user_url}?access_token=${accessToken}&uid=${uid}`,
        headers: {
          accept: "application/json",
        }
      });
      
      let token = getToken(accessToken);
      if (result.status == 200) {
        let user = await validateAuthUser(uid);
        // console.log("weiboUser=========", user);
        if (user) {
          user[0].login_times += 1;
          let updateAuthUser = await setAuthUser(result.data, 2, accessToken, 0, user[0].login_times);
          if (updateAuthUser.affectedRows == 1) {
            let userinfo = {
              id: user[0].id,
              openid: user[0].openid,
              user_id: user[0].user_id,
              username: user[0].username,
              nickname: user[0].nickname,
              type: user[0].type,
              avatar_url: user[0].avatar_url,
              create_time: user[0].create_time,
              expire_time: user[0].expire_time,
              expires_in: user[0].expires_in,
              login_time: user[0].login_time,
              login_times: user[0].login_times,
            };
            res.send({
              code: CODE_SUCCESS,
              msg: "weibo账号登录成功",
              data: {
                token,
                userinfo,
              },
            });

          } else {
            res.send({
              code: CODE_ERROR,
              msg: "weibo账号登录失败",
              data: null,
            });
          }

        } else {
          let addAuthUser = await setAuthUser(result.data, 2, accessToken, 1, null);
          // console.log("addAuthUser===", addAuthUser);
          if (addAuthUser.affectedRows == 1) {
            let queryUser = await getAuthUser(addAuthUser.insertId);
            let userImage = await addUserImage(queryUser[0].openid);

            if (userImage) {
              let userinfo = {
                id: queryUser[0].id,
                openid: queryUser[0].openid,
                user_id: queryUser[0].user_id,
                username: queryUser[0].username,
                nickname: queryUser[0].nickname,
                type: queryUser[0].type,
                avatar_url: queryUser[0].avatar_url,
                create_time: queryUser[0].create_time,
                expire_time: queryUser[0].expire_time,
                expires_in: queryUser[0].expires_in,
                login_time: queryUser[0].login_time,
                login_times: queryUser[0].login_times,
              };
              
              res.send({
                code: CODE_SUCCESS,
                msg: "weibo账号登录成功",
                data: {
                  token,
                  userinfo,
                },
              });
            }
          } else {
            res.send({
              code: CODE_ERROR,
              msg: "weibo账号登录失败",
              data: null,
            });
          }
        }

      } else {
        res.send({
          code: CODE_ERROR,
          msg: "weibo账号登录失败",
          data: null,
        });
      }

    } else {
      if (tokenResponse.data.error_code == 21325) {
        res.send({
          code: CODE_ERROR,
          msg: "code码无效或已过期",
        });
      } else if (tokenResponse.data.error_code == 21327) {
        res.send({
          code: -2,
          msg: "token已过期",
        });
      } else {
        res.send({
          code: CODE_ERROR,
          msg: tokenResponse.data.error_description,
        });
      }
    } 
  }
}

// 核验用户是否第一次登录
const validateAuthUser = (openid) => {
  let sql = `select * from user_third_auth where openid=${openid}`;
  return queryOne(sql);
}

// 获取第三方用户信息
const getAuthUser = (id) => {
  let sql = `select * from user_third_auth where id=${id}`;
  return queryOne(sql);
}

// 更新或新增第三方登录信息
const setAuthUser = (user, type, accessToken, status, loginTimes) => {
  let sql = "",
    username = "",
    nickname = "",
    avatar = "";
  if (type == 3) {
    username = user.login;
    nickname = user.name;
    avatar = user.avatar_url;
  } else if (type == 2) {
    username = user.name;
    nickname = user.screen_name;
    avatar = user.profile_image_url;
  }

  if (status == 0) {
    sql = `update user_third_auth set type='${type}', username='${username}', nickname='${nickname}', 
		access_token='${accessToken}', avatar_url='${avatar}', login_time='${moment().format(
      "YYYY-MM-DD HH:mm:ss"
    )}', login_times='${loginTimes}' where openid='${user.id}'`;
  } else if (status == 1) {
    addUser(user, type);
    sql = `insert into user_third_auth(openid, type, username, nickname, access_token, avatar_url, create_time, login_time, login_times) 
		values('${user.id
      }', '${type}', '${username}', '${nickname}', '${accessToken}', '${avatar}', '${moment().format(
        "YYYY-MM-DD HH:mm:ss"
      )}', '${moment().format("YYYY-MM-DD HH:mm:ss")}', 1)`;
  }
  return queryOne(sql);
}

// 新增个人用户信息
const addUser = (user, type) => {
  let nickname = "",
    avatar = "";
  if (type == 3) {
    nickname = user.name;
    avatar = user.avatar_url;
  } else if (type == 2) {
    nickname = user.screen_name;
    avatar = user.profile_image_url;
  }
  let sql = `insert into user_info(user_id, avatar, nickname) values('${user.id}', '${avatar}', '${nickname}')`;
  return queryOne(sql);
}

// 新增用户图片
const addUserImage = (user_id) => {
  let sql = `insert into user_image(user_id) values('${user_id}')`;
  return queryOne(sql);
}

module.exports = {
  oauthGithub,
  oauthWeibo,
}