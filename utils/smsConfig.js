/**
 * 描述: 腾讯云短信接入Nodejs SDK
 * 作者: Jack Chen
 * 日期: 2020-11-01
*/

const tencentcloud = require("tencentcloud-sdk-nodejs");

// 导入对应产品模块的client models。
const SmsClient = tencentcloud.sms.v20190711.Client;
const models = tencentcloud.sms.v20190711.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;

// 实例化一个认证对象，入参需要传入腾讯云账户secretId，secretKey
let cred = new Credential("AKIDvgyCBtXZrrb4VajtocABwSWKr76nET2H", "8zZvrJWgdJituimbx4uACftqXyB7RVu4");

// 实例化一个http选项，可选的，没有特殊需求可以跳过。
let httpProfile = new HttpProfile();
// 指定接入地域域名(默认就近接入)
httpProfile.endpoint = "sms.tencentcloudapi.com";

// 实例化一个client选项，可选的，没有特殊需求可以跳过。
let clientProfile = new ClientProfile();
clientProfile.httpProfile = httpProfile;

module.exports = {
    client: new SmsClient(cred, "", clientProfile),
    reqSms: new models.SendSmsRequest()
}