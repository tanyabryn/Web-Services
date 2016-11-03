const express = require("express");
const mongoose = require("mongoose");
const api = require("./api");
const bodyParser = require('body-parser');
const port = 4000;
const app = express();


app.use("/api", api);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());



mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/app');
mongoose.connection.open("open", () => {
    console.log("Connected to database");
    app.listen(port, function () {
        console.log("Web server started on port: " + port)
    });
});