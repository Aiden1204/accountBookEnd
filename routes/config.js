var Client = require("mysql-pro");

var client = new Client({
    mysql: {
        // host: "127.0.0.1",
        host: "localhost",
        port: 3306,
        database: "demo",
        user: "root",
        password: "qwe123" //台式数据库
        // password: "123456"  //笔记本数据库
    }
});

console.log("mySql启动");
// console.log(client._options);

module.exports = client;