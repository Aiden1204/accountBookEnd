const router = require('koa-router')()
const client = require('../routes/config')
router.prefix('/users')


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
        console.log("报错了");
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
            console.log(result);
            if(result.length === 0){
                ctx.body = {
                    returnCode:'999999',
                    errMessage:'用户名或密码不正确'
                };
            }
        }, function(error){
            // error
            console.log("用户注册后台报错");
            console.log(error);
            ctx.body = {
                returnCode:'999999',
                errMessage:'登录操作'
            };
        });
    }
});

// 用户登录
router.post('/login', async (ctx, next) => {
    let data = ctx.request.body.params;
    console.log(data)
    await client.query("select userName from user where userName = ? and password = ?;", [data.username,data.password]).then(function(result) {
        console.log(result);
        if(result.length === 0){
            ctx.body = {
                returnCode:'999999',
                errMessage:'账号或密码错误'
            };
        } else {
            ctx.body = {
                returnCode:'000000',
                message:'登录成功'
            };
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
});

module.exports = router
