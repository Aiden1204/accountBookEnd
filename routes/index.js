const router = require('koa-router')()
const client = require('../routes/config')

// 数据库操作样例
// router.get('/test', async (ctx, next) => {
//     await client.query("select * from user_info;", []).then(function(result) {
//         console.log(result);
//         ctx.body = result;
//     }, function(error){
//         // error
//         console.log("报错了");
//         console.log(error);
//     });
// });
//

// get传参样例
// router.get('/register', async (ctx, next) => {
//     console.log('ctx111',ctx.request.query);
//     ctx.body = "666";
// });


// post传参样例
// router.post('/register', async (ctx, next) => {
//     console.log('ctx111',ctx.request.body.params);
//     ctx.body = "666";
// });



module.exports = router
