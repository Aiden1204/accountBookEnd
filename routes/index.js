const router = require('koa-router')()


// router.get('/', async (ctx, next) => {
//   console.log("3333");
//   await ctx.render('index', {
//     title: 'Hello Koa 2!'
//   })
// })
//
// router.get('/string', async (ctx, next) => {
//   ctx.body = 'koa2 string'
// })
//
// router.get('/json', async (ctx, next) => {
//   ctx.body = {
//     title: 'koa2 json'
//   }
// })

router.get('/test', async (ctx, next) => {
    ctx.body = {
        flag:"1"
    }
})



module.exports = router
