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

app.post('/login', function (req, res) {
    if (!req.body.hasOwnProperty(email) || !req.body.hasOwnProperty(password) ||
    !(password.length >= 5 && password.length <= 36)) {
        res.status(401).send();
    } else {
        let text = `SELECT password FROM users WHERE email = $1`;
        let values = [req.body.email];
        pool.query(text, values, function (err, a) {
            if (err) {
                console.log(err.stack);
                res.status(400).send();
            } else {
                if (a.rows.length === 0) {
                    res.status(401).send();
                }
            }
        })
    }
});

app.post('/create', function (req, res) {
    if (!req.body.hasOwnProperty(email) || !req.body.hasOwnProperty(nickname) || !req.body.hasOwnProperty(password) ||
    !(password.length >= 5 && password.length <= 36) || !(nickname.length >= 1 && nickname.length <= 20)) {
        res.status(401).send();
    } else {
        let text = `INSERT INTO users(email, nickname, password) VALUES($1, $2, $3) RETURNING *`;
        let values = [req.body.email, req.body.nickname, req.body.password];

        pool.query(text, values, function (err, a) {
            if (err) {
                console.log(err.stack);
                res.status(400).send();
            } else {
                res.status(200).send();
            }
        });
    }
});

app.get('/history', function (req, res) {
    //kill history for current user
    res.send();
});

app.post('/kill', function (req, res) {
    //send kill information to database
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
