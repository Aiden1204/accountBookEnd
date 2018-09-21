const router = require('koa-router')()
const client = require('../routes/config')
router.prefix('/users')
const md5 = require('md5');

// 前端服务器的ip
let frontServer = "172.20.10.5";

// 生成token方法
let createToken = (userId,userName) => {
    let result = {};
    result.time = new Date();
    // token生成时间
    result.saveTime = result.time.toLocaleString();
    // token过期时间
    result.maxTime = new Date(result.time.getTime() + 1000*60*60*24).toLocaleString();
    console.log("saveTime",result.saveTime);
    console.log("maxTime",result.maxTime);
    // 拼装token
    result.token = userId + userName + result.saveTime + result.maxTime;
    // 对token加密
    result.token = md5(result.token);
    return result;
};


// 用户注册
router.post('/register', async (ctx, next) => {
    let data = ctx.request.body.params;
    let flag = 0; //0用户名未注册  1用户名已注册
    await client.query("select userName from user;", []).then(function(result) {
        // 判断用户名是否已被注册
        for(i in result){
            if(result[i].userName === data.username){
                flag = 1;
            }
        }
    }, function(error){
        // error
        console.log("用户注册报错");
        console.log(error);
    });
    // 用户名已注册
    if(flag === 1){
        ctx.body = {
            returnCode:'999999',
            errMessage:'用户名已存在'
        };
    } else {
        // 用户名未注册
        await client.query("INSERT INTO user (userName,password) VALUES (?,?);", [data.username,data.password]).then(function(result) {
            console.log("注册成功",data.username,data.password);
            console.log(result);
                ctx.body = {
                    returnCode:'000000',
                    errMessage:'注册成功'
                };
        }, function(error){
            // error
            console.log("用户注册后台报错");
            console.log(error);
            ctx.body = {
                returnCode:'999999',
                errMessage:'注册失败，请检查网络'
            };
        });
    }
});

// 用户登录
router.post('/login', async (ctx, next) => {
    let data = ctx.request.body.params;
    let flag = false; //标记用户名密码是否正确
    let userId = "";
    let userName = "";
    console.log("登录信息",data,data.password,new Date().toLocaleString());
    await client.query("select * from user where userName = ? and password = ?;", [data.username,data.password]).then(function(result) {
        console.log('查询结果',result);
        if(result.length === 0){
            console.log("登录失败，账号密码不正确",data.username,data.password);
            ctx.body = {
                returnCode:'999999',
                errMessage:'账号或密码错误'
            };
        } else {
            flag = true;
            userId = result[0].userId;
            userName = result[0].userName;
        }
    }, function(error){
        // error
        console.log("用户登录失败，数据库报错");
        console.log(error);
        ctx.body = {
            returnCode:'999999',
            errMessage:'登录失败，请检查网络'
        };
    });

    // 账号密码正确时
    if(flag){
        // 生成token
        let result = createToken(userId,userName);
        await client.query("update user set saveTime = ?, maxTime = ?, token = ? where userId = ?;", [result.saveTime,result.maxTime,result.token,userId]).then(function(result) {
            console.log("插入结果",result);
        }, function(error){
            // error
            console.log(error);
        });
        // 用cookie保存用户的登录状态
        ctx.cookies.set(
            'token',
            result.token,
            {
                domain: frontServer,  // 写cookie所在的域名
                path: '/',       // 写cookie所在的路径
                maxAge: 10 * 60 * 1000, // cookie有效时长
                expires: new Date('2018-11-15'),  // cookie失效时间
                httpOnly: false,  // 是否只用于http请求中获取
                overwrite: true  // 是否允许重写
            }
        );
        // console.log('获取到的cookie',ctx.cookies.get('token'));
        console.log("登录成功",data.username,data.password,new Date().toLocaleString());
        ctx.body = {
            returnCode:'000000',
            message:'登录成功'
        };
    }
});

module.exports = router
