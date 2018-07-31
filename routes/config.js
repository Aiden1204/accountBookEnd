var Client = require("mysql-pro");

var client = new Client({
    mysql: {
        // host: "127.0.0.1",
        host: "localhost",
        port: 3306,
        database: "nodejsdb",
        user: "root",
        password: "123456"
    }
});

console.log("mySql启动");
console.log(client._options);

module.exports = client