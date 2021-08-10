const pg = require("pg");
const bcrypt = require("bcrypt");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

// number of rounds the bcrypt algorithm will use to generate the salt
// the more rounds, the longer it takes
// so the salt will be more secure
// https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds
const saltRounds = 10;

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});

app.use(express.static("public_html"));
app.use(express.json());

app.get('/', function (req, res) {
    //main hub, display map and kill button
    res.send();
});

app.get('/user', function (req, res) {
    let userid = req.query.id;
    //profile page, send query call to database and retrieve info
    //should use query string to get username, so something like:
    //http://localhost:3000/user?id="some id here"
    res.send();
});

app.get('/create', function (req, res) {
    //account creation, prompt for email, username, and password
    res.send();
});

app.post('/create', function (req, res) {
    //send data from account creation to database
    res.send();
});

app.get('/history', function (req, res) {
    //kill history for current user
    res.send();
});

app.get('/kill', function (req, res) {
    //webpage to input a kill
    res.send();
});

app.post('/kill', function (req, res) {
    //send kill information to database
    res.send();
});

app.get('/settings', function (req, res) {
    //settings page, user should be able to change specified settings here
    res.send();
});

app.post('/settings', function (req, res) {
    //send any updated settings changes to database/wherever it needs to go
    //may not need this, so double check
    res.send();
});

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});
