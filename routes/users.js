const router = require('koa-router')()
const client = require('../routes/config')
router.prefix('/users')


// 用户注册
router.post('/register', async (ctx, next) => {
    let data = ctx.request.body.params;
    await client.query("select userName from user;", []).then(function(result) {
        // 判断用户名是否已被注册
        let flag = 0; //0用户名未注册  1用户名已注册
        for(i in result){
            if(result[i].userName === data.username){
                flag = 1;
            }
        }
        if(flag === 1){
            ctx.body = {
                returnCode:'999999',
                errMessage:'用户名已存在'
            };
        } else {
            client.query("INSERT INTO user (userName,password) VALUES (?,?);", [data.username,data.password]).then(function(result) {
                console.log(result);
                ctx.body = {
                    returnCode:'000000',
                    message:'注册成功'
                };
            }, function(error){
                // error
                console.log("报错了");
                console.log(error);
            });
        }

    }, function(error){
        // error
        console.log("报错了");
        console.log(error);
    });

});


module.exports = router
