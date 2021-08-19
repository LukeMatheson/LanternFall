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

app.post('/login', async function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(password.length >= 5 && password.length <= 64)
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
            let accountExists = await validatePassword(password, hashedPassword);

            if (accountExists === "error") {
                res.status(500);
                res.json({error: "Something went wrong"});
            }

            else if (accountExists === "false") {
                res.status(401);
                res.json({error: "Invalid credentials"});
            }

            else {
                let payload = {email: email, password: password}

                res.status(200);
                res.json({token: jwt.encode(payload, secret)});
            }
        }
    }
});

app.post('/create', async function (req, res) {
    let email = req.body.email;
    let nickname = req.body.nickname;
    let password = req.body.password;

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("nickname") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(nickname.length >= 5 && nickname.length <= 64) || !(password.length >= 5 && password.length <= 64) 
    ) {
        res.status(401);
        res.json({error: "Invalid credentials"});
    } 
    
    else {
        let emailExists = await getValue("users", "email", email);
        let nicknameExists = await getValue("users", "nickname", nickname);

        if (emailExists === "error" || nicknameExists === "error") {
            res.status(400);
            res.json({error: "Something went wrong"});
        }

        else if (emailExists.length > 0) {
            res.status(401);
            res.json({error: "Account already exists"});
        } 

        else if (nicknameExists.length > 0) {
            res.status(401);
            res.json({error: "Nickname already exists"});
        }

        else {
            let hashedPassword = await createHashPassword(password);

            if (hashedPassword === "error") {
                res.status(500);
                res.json({error: "Something went wrong"});
            }

            else {
                let isAccountCreated = await createAccount(email, nickname, hashedPassword);

                if (isAccountCreated === "false") {
                    res.status(400);
                    res.json({error: "Something went wrong"});
                }

                else {
                    res.status(200);
                    res.json({success: "Account created"});
                }
            }
        }
    }
});

app.get('/history', async function (req, res) {
    let killHistory = await getValue("kills", "email", email);

    if (killHistory === "error") {
        res.status(400);
        res.json({error: "Something went wrong"});
    }

    else {
        res.status(200);
        res.json({info: killHistory});
    }
});

app.post('/kill', function (req, res) {
    let user = req.body.user;
    let date = req.body.date;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let name = req.body.name;
    let comments = req.body.comments;
    let image = req.body.image;

    let text = `SELECT * FROM users WHERE nickname = '${user}'`;
    pool.query(text, function (err, data) {
        if (err) {
            console.log(err.stack);
            res.status(400);
            res.json({error: "Something went wrong"});
        } else {
            if (data.length === 0) {
                res.status(401);
                res.json({error: "Username does not exist"});
            } else {
                user = data.nickname;
                console.log(user);
            }
        }
    });

    if (!req.body.hasOwnProperty("user") ||  !req.body.hasOwnProperty("date") || !req.body.hasOwnProperty("latitude") || 
        !req.body.hasOwnProperty("longitude") || !req.body.hasOwnProperty("name") || !req.body.hasOwnProperty("comments") || 
        !(name.length >= 1 && name.length <= 60) || !(comments.length >= 1 && comments.length <= 240)) 
    {
        res.status(401);
        res.json({error: "Invalid data, please try again"});
    } 
    
    else {
        let imageExists = true;
        text = `INSERT INTO kills (user_id, date, loc_lat, loc_lon, nickname, description, img_exist) VALUES($1, $2, $3, $4, $5, $6, $7)`;
        let values = [user, date, latitude, longitude, name, comments, imageExists];

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

async function validateToken(token) {
    let decoded = jwt.decode(token, secret);

    let hashedPassword = await getPassword(decoded.email);
    let accountExists = await validatePassword(decoded.password, hashedPassword);

    if (accountExists === "true") {
        return true;
    }

    else {
        return false;
    }
}

async function validatePassword(password, hashedPassword) {
    try {
        const res = await bcrypt.compare(password, hashedPassword);
        
        if (res) {
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

async function createHashPassword(password) {
    try {
        const res = await bcrypt.hash(password, saltRounds);
        
        return res;

    } catch (err) {
        console.log(err.stack);
        return "error";
    }
}

async function createAccount(email, nickname, hashedPassword) {
    let text = `INSERT INTO users(email, nickname, password) VALUES($1, $2, $3) RETURNING *`;
    let values = [email, nickname, hashedPassword];
    
    try {
        const res = await pool.query(text, values);
        
        return "true";

    } catch (err) {
        console.log(err.stack);
        return "error";
    } 
}

async function getValue(table, category, value) {
    let text = `SELECT * FROM ${table} WHERE ${category} = $1`;
    let values = [value];

    try {
        const res = await pool.query(text, values);
        
        if (res.rows.length > 0) {
            return res.rows;
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