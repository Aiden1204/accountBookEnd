const router = require('koa-router')()
const client = require('../routes/config')

router.get('/test', async (ctx, next) => {
    await client.query("select * from user_info;", []).then(function(result) {
        console.log(result);
        ctx.body = result;
    }, function(error){
        // error
        console.log("报错了");
        console.log(error);
    });
})



module.exports = router
