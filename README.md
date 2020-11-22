# 前言
NodeJS全栈开发之H5移动端完整商城项目后端技术栈基于nodejs+mysql+express框架实现restful api接口功能，不断完善优化。如果觉得不错的话，请大大们给个:heart:star，也期待大家一起交流学习。

[在线DEMO演示](http://106.55.168.13/)

# 目录结构
```
│  app.js                             // 入口文件
│  package.json                       // npm包管理所需模块及配置信息
├─db
│      dbConfig.js                    // mysql数据库基础配置    
├─public
│  └─uploads                          // 图片文件夹
├─routes
│      index.js                       // 初始化路由信息，自定义全局异常处理
│      users.js                       // 用户路由模块
├─services
│      authService.js                 // 业务逻辑处理 - 任务相关接口
│      userService.js                 // 业务逻辑处理 - 用户相关接口
└─utils
        constant.js                   // 自定义常量
        index.js                      // 封装连接mysql模块
        md5.js                        // 后端封装md5方法
        smsConfig.js                  // 腾讯云短信接入Nodejs SDK
        user-jwt.js                   // jwt-token验证和解析函数
```


# 技术栈
* Node.js v10
* express v4
* mysql v5.7
* express-jwt
* express-session
* nodemon
* crypto
* cors
* boom
* moment
* multer
* svg-captcha
* tencentcloud-sdk-nodejs
 
# 功能模块
* 验证码登录
* 图形验证码
* 密码登录
* 微博/github登录
* 修改头像
* 编辑/获取个人信息

# 下载安装依赖
```
git clone https://github.com/jackchen0120/ip-nodejs-api.git
cd ip-nodejs-api
npm install 或 yarn
```

## 搭建部署开发教程

请移步到我的一篇博客[手把手带你进阶全栈打工人，手撸H5完整商城项目从0到1实战分享（附源码）](https://juejin.cn/post/6897973866733338631)


## 开发模式
```
npm start
```
运行之后，访问地址：http://localhost:3000

## 获取更多实操经验及项目源码

欢迎关注个人公众号：**懒人码农**

<img src="https://img-blog.csdnimg.cn/20200531011333650.png#pic_center?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzE1MDQxOTMx,size_16,color_FFFFFF,t_70" width="200" alt="公众号二维码" />