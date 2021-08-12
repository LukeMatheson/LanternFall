const pg = require("pg");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jwt-simple");
const app = express();

const port = 3000;
const hostname = "localhost";

const saltRounds = 10;
const secret = "*WaRsiZKrap";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});

app.use(express.static("public_html"));
app.use(express.json());

app.post('/user', function (req, res) {
    let userid = req.query.id;
    //profile page, send query call to database and retrieve info
    //should use query string to get username, so something like:
    //http://localhost:3000/user?id="some id here"
    res.send();
});

app.post('/login', function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(password.length >= 5 && password.length <= 36) 
    ) {
        res.status(401);
        res.json({error: "Invalid credentials"});
    } 
    
    else {
        let text = `SELECT password FROM users WHERE email = $1`;
        let values = [email];

        pool.query(text, values, function (err, data) {
            if (err) {
                console.log(err.stack);
                res.status(400);
                res.json({error: "Something went wrong"});
            } 
            
            else if (data.rows.length === 0) {
                res.status(401);
                res.json({error: "No account exists"});
            }

            else {
                let hashedPassword = data.rows[0].password;

                bcrypt.compare(password, hashedPassword, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.status(500);
                        res.json({error: "Something went wrong"});
                    }

                    else if (data) {
                        let payload = {email: email, password: password};

                        res.status(200);
                        res.json({token: jwt.encode(payload, secret)});
                    }

                    else {
                        res.status(401);
                        res.json({error: "Invalid credentials"});
                    }
                });
            } 
        });
    }
});

app.post('/create', function (req, res) {
    let email = req.body.email;
    let nickname = req.body.nickname;
    let password = req.body.password;

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("nickname") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(nickname.length >= 1 && nickname.length <= 32) || !(password.length >= 5 && password.length <= 36) 
    ) {
        res.status(401);
        res.json({error: "Invalid credentials"});
    } 
    
    else {
        let text = `SELECT * FROM users WHERE email = $1`;
        let values = [email];

        pool.query(text, values, function(err, data) {
            if (err) {
                console.log(err.stack);
                res.status(400);
                res.json({error: "Something went wrong"});
            } 
            
            else if (data.rows.length > 0) {
                res.status(401);
                res.json({error: "Account already exists"});
            }

            else {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    if (err) {
                        console.log(err);
                        res.status(500);
                        res.json({error: "Something went wrong"});
                    }

                    else {
                        let text = `INSERT INTO users(email, nickname, password) VALUES($1, $2, $3) RETURNING *`;
                        let values = [email, nickname, hash];

                        pool.query(text, values, function(err, data) {
                            if (err) {
                                console.log(err.stack);
                                res.status(400);
                                res.json({error: "Something went wrong"});
                            }

                            else {
                                res.status(200);
                                res.json({success: "Works correctly"});
                            }
                        });
                    }
                });
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

// https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
