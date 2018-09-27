const router = require('koa-router')()
const client = require('../routes/config')
router.prefix('/users')
const md5 = require('md5');

// 前端服务器的ip
// let frontServer = "172.20.10.5";
let frontServer = "192.168.11.226";

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
        console.log("用户注册报错",new Date().toLocaleString());
        console.log(error,new Date().toLocaleString());
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
            console.log("注册成功",data.username,data.password,new Date().toLocaleString());
            console.log(result,new Date().toLocaleString());
                ctx.body = {
                    returnCode:'000000',
                    errMessage:'注册成功'
                };
        }, function(error){
            // error
            console.log("用户注册后台报错",new Date().toLocaleString());
            console.log(error,new Date().toLocaleString());
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
        console.log('查询结果',result,new Date().toLocaleString());
        if(result.length === 0){
            console.log("登录失败，账号密码不正确",data.username,data.password,new Date().toLocaleString());
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
        console.log("用户登录失败，数据库报错",new Date().toLocaleString());
        console.log(error,new Date().toLocaleString());
        ctx.body = {
            returnCode:'999999',
            errMessage:'登录失败，请检查网络'
        };
    });

    // 账号密码正确时
    if(flag){
        // 生成token
        let token = createToken(userId,userName);
        await client.query("update user set saveTime = ?, maxTime = ?, token = ? where userId = ?;", [token.saveTime,token.maxTime,token.token,userId]).then(function(result) {
            console.log("插入结果",result,new Date().toLocaleString());
        }, function(error){
            // error
            console.log(error,new Date().toLocaleString());
        });
        // 用cookie保存用户的登录状态
        ctx.cookies.set(
            'token',
            token.token,
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

// 用户提交记录
router.post('/submitLog', async (ctx, next) => {
    let data = ctx.request.body.params;
    let token = ctx.cookies.get('token');
    let flag = false; //判断数据库内是否有对应token
    let userId = ''; //用户id
    let userName = ''; //用户名
    console.log('test data',data,new Date().toLocaleString());
    console.log('test token',token,new Date().toLocaleString());
    // 判断浏览器的cookie中是否存在token字段
    if(typeof(token) === 'undefined'){
        // 没有token时
        ctx.body = {
            returnCode:'999999',
            errMessage:'登录超时，请重新登录',
            goRouter:'/account/login'
        };
    } else {
        // 有token时查库，判断库中是否有一致的token
        await client.query("select * from user where token = ?;", [token]).then(function(result) {
            console.log('token查询结果',result,new Date().toLocaleString());
            if(result.length === 0){
                // 数据库中没有符合的token
                console.log("数据库中没有对应的token",token,new Date().toLocaleString());
                ctx.body = {
                    returnCode:'999999',
                    errMessage:'登录超时，请重新登录',
                    goRouter:'/account/login'
                };
            } else {
                // 数据库中有对应的token
                flag = true; //判断数据库内是否有对应token
                userId = result[0].userId; //用户id
                userName = result[0].userName; //用户名
            }
        }, function(error){
            // error
            console.log("用户token免登录失败，数据库报错",new Date().toLocaleString());
            console.log(error,new Date().toLocaleString());
            ctx.body = {
                returnCode:'999999',
                errMessage:'登录超时，请重新登录',
                goRouter:'/account/login'
            };
        });
    }
    // 数据库中有对应的token时
    if(flag){
        // 生成token
        let token = createToken(userId,userName);
        console.log('新改的token',token.token);
        // 更新用户的token
        await client.query("update user set saveTime = ?, maxTime = ?, token = ? where userId = ?;", [token.saveTime,token.maxTime,token.token,userId]).then(function(result) {
            console.log("用户token更新结果",result,new Date().toLocaleString());
            // 用cookie保存用户的登录状态
            ctx.cookies.set(
                'token',
                token.token,
                {
                    domain: frontServer,  // 写cookie所在的域名
                    path: '/',       // 写cookie所在的路径
                    maxAge: 10 * 60 * 1000, // cookie有效时长
                    expires: new Date('2018-11-15'),  // cookie失效时间
                    httpOnly: false,  // 是否只用于http请求中获取
                    overwrite: true  // 是否允许重写
                }
            );
        }, function(error){
            // error
            console.log(error,new Date().toLocaleString());
        });
        // 将用户提交的记录写入数据库
        data.money = parseFloat(data.money);
        await client.query("INSERT INTO log (userId,category,categoryName,money,remarks,imgUrl) VALUES (?,?,?,?,?,?);", [userId,data.category,data.categoryName,data.money,data.remarks,data.imgUrl]).then(function(result) {
            console.log("新增记录结果",result,new Date().toLocaleString());
            ctx.body = {
                returnCode:'000000',
                message:'提交成功'
            };
        }, function(error){
            // error
            console.log(error,new Date().toLocaleString());
            ctx.body = {
                returnCode:'999999',
                errMessage:'网络异常，请重新尝试',
            };
        });
    }
});

// 用户查询记录
router.post('/queryLog', async (ctx, next) => {
    let data = ctx.request.body.params;
    let token = ctx.cookies.get('token');
    let flag = false; //判断数据库内是否有对应token
    let userId = ''; //用户id
    let userName = ''; //用户名
    console.log('test data',data,new Date().toLocaleString());
    console.log('test token',token,new Date().toLocaleString());
    // 判断浏览器的cookie中是否存在token字段
    if(typeof(token) === 'undefined'){
        // 没有token时
        ctx.body = {
            returnCode:'999999',
            errMessage:'登录超时，请重新登录',
            goRouter:'/account/login'
        };
    } else {
        // 有token时查库，判断库中是否有一致的token
        await client.query("select * from user where token = ?;", [token]).then(function(result) {
            console.log('token查询结果',result,new Date().toLocaleString());
            if(result.length === 0){
                // 数据库中没有符合的token
                console.log("数据库中没有对应的token",token,new Date().toLocaleString());
                ctx.body = {
                    returnCode:'999999',
                    errMessage:'登录超时，请重新登录',
                    goRouter:'/account/login'
                };
            } else {
                // 数据库中有对应的token
                flag = true; //判断数据库内是否有对应token
                userId = result[0].userId; //用户id
                userName = result[0].userName; //用户名
            }
        }, function(error){
            // error
            console.log("用户token免登录失败，数据库报错",new Date().toLocaleString());
            console.log(error,new Date().toLocaleString());
            ctx.body = {
                returnCode:'999999',
                errMessage:'登录超时，请重新登录',
                goRouter:'/account/login'
            };
        });
    }
    // 数据库中有对应的token时
    if(flag){
        // 生成token
        let token = createToken(userId,userName);
        console.log('新改的token',token.token);
        // 更新用户的token
        await client.query("update user set saveTime = ?, maxTime = ?, token = ? where userId = ?;", [token.saveTime,token.maxTime,token.token,userId]).then(function(result) {
            console.log("用户token更新结果",result,new Date().toLocaleString());
            // 用cookie保存用户的登录状态
            ctx.cookies.set(
                'token',
                token.token,
                {
                    domain: frontServer,  // 写cookie所在的域名
                    path: '/',       // 写cookie所在的路径
                    maxAge: 10 * 60 * 1000, // cookie有效时长
                    expires: new Date('2018-11-15'),  // cookie失效时间
                    httpOnly: false,  // 是否只用于http请求中获取
                    overwrite: true  // 是否允许重写
                }
            );
        }, function(error){
            // error
            console.log(error,new Date().toLocaleString());
        });
        // 根据时间查询用户记录表
        await client.query("select * from log where userId = ?;", [userId]).then(function(result) {
            console.log("查询用户记录表结果",result,new Date().toLocaleString());
            data.startTime = new Date(data.startTime);
            console.log(data.startTime);
            // 比较时结束日期需要多加一天
            data.endTime = new Date(data.endTime);
            data.endTime = data.endTime.getTime() + 1000*60*60*24;
            data.endTime = new Date(data.endTime);
            console.log(data.endTime);
            // 返回的记录数组
            let dataList = [];
            for(let x of result){
                if(data.startTime <= x.createTime && data.endTime >= x.createTime){
                    let time = x.createTime.toLocaleTimeString();
                    let date = x.createTime.toLocaleDateString().split('-');
                    if(date[1].length < 2){
                        date[1] = '0' + date[1];
                    }
                    if(date[2].length < 2){
                        date[2] = '0' + date[2];
                    }
                    date = date.join('-');
                    x.createTime = date + ' ' + time;
                    dataList.push(x);
                }
            }
            ctx.body = {
                returnCode:'000000',
                message:'查询成功',
                dataList:dataList
            };
        }, function(error){
            // error
            console.log(error,new Date().toLocaleString());
            ctx.body = {
                returnCode:'999999',
                errMessage:'网络异常，请重新尝试',
            };
        });
    }
});

module.exports = router
