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

app.post('/login',async function (req, res) {
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
        let hashedPassword = await getPassword(email);

        if (hashedPassword === "error") {
            res.status(400);
            res.json({error: "Something went wrong"});
        }

        else if (hashedPassword === "false") {
            res.status(401);
            res.json({error: "No account exists"});
        }

        else {
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
    }
});

app.post('/create',async function (req, res) {
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
        let emailExists = await doesValueExist("email", email);
        let nicknameExists = await doesValueExist("nickname", nickname);

        if (emailExists === "error" || nicknameExists === "error") {
            res.status(400);
            res.json({error: "Something went wrong"});
        }

        else if (emailExists === "true") {
            res.status(401);
            res.json({error: "Account already exists"});
        } 

        else if (nicknameExists === "true") {
            res.status(401);
            res.json({error: "Nickname already exists"});
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
                            res.json({success: "Account created"});
                        }
                    });
                }
            });
        }
    }
});

app.get('/history', function (req, res) {
    let user = req.query.user;
    let text = `SELECT * FROM kills WHERE user_id = '${user}`;

    pool.query(text, function (err, data) {
        if (err) {
            console.log(err.stack);
            res.status(400);
            res.json({error: "Something went wrong"});
        } else {
            res.status(200);
            res.json({info: data});
        }
    });
});

app.post('/kill', function (req, res) {
    let user = req.body.user;
    let name = req.body.name;
    let date = req.body.date;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let comments = req.body.comments;
    let image = req.body.image;

    //Not doing user validation here since we are taking the primary key from the users table itself
    //Not sure how to validate date/location/image, I figure that date might need to be validated client-side but I could be wrong

    if (!req.body.hasOwnProperty("user") || !req.body.hasOwnProperty("name") || !req.body.hasOwnProperty("date") ||
        !req.body.hasOwnProperty("latitude") || !req.body.hasOwnProperty("longitude") || !req.body.hasOwnProperty("comments") || 
        !req.body.hasOwnProperty("image") || !(name.length >= 1 && name.length <= 50) || !(comments.length >= 1 && comments.length <= 300)) 
    {
        res.status(401);
        res.json({error: "Invalid data, please try again"});
    } else {
        let text = `INSERT INTO kills(user_id, date, loc_lat, loc_lon, nickname, description, image_name) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        let values = [user, date, latitude, longitude, name, comments, image];

        pool.query(text, values, function (err, data) {
            if (err) {
                console.log(err.stack);
                res.status(400);
                res.json({error: "Something went wrong"});
            } else {
                res.status(200);
                res.json({success: "Kill logged"});
            }
        });
    }
});

app.post('/settings', function (req, res) {
    //What settings are we changing here?
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

async function doesValueExist(category, value) {
    let text = `SELECT * FROM users WHERE ${category} = $1`;
    let values = [value];
    try {
        const res = await pool.query(text, values);
        
        if (res.rows.length > 0) {
            return "true";
        }

        else {
            return "false";
        }
    } catch (err) {
        console.log(err.stack);
        return "error";
    } 
}

async function getPassword(email) {
    let text = `SELECT password FROM users WHERE email = $1`;
    let values = [email];

    try {
        const res = await pool.query(text, values);
        
        if (res.rows.length === 0) {
            return "false";
        }

        else {
            return res.rows[0].password;
        }
    } catch (err) {
        console.log(err.stack);
        return "error";
    } 
}