const pg = require("pg");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jwt-simple");
const app = express();

const port = 80;
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

    email = email.toLowerCase();

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(validateString(password)) || !(password.length >= 5 && password.length <= 64)
    ) {
        res.status(401);
        res.json({error: "Invalid credentials"});
    } 
    
    else {
        let user = await getValue("users", "email", email);

        if (user === "error") {
            res.status(400);
            res.json({error: "Something went wrong"});
        }

        else if (user === "false") {
            res.status(401);
            res.json({error: "No account exists"});
        }

        else {
            let hashedPassword = user[0].password;
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
                let username = user[0].username;

                res.status(200);
                res.json({token: jwt.encode(payload, secret), username: username});
            }
        }
    }
});

app.post('/create', async function (req, res) {
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;

    email = email.toLowerCase();

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(validateString(username)) || !(validateString(password)) || 
        !(username.length >= 5 && username.length <= 64) || (username.includes(" ")) || !(password.length >= 5 && password.length <= 64) 
    ) {
        res.status(401);
        res.json({error: "Invalid credentials"});
    } 
    
    else {
        let emailExists = await getValue("users", "email", email);
        let usernameExists = await getValue("users", "username", username);

        if (emailExists === "error" || usernameExists === "error") {
            res.status(400);
            res.json({error: "Something went wrong"});
        }

        else if (emailExists !== "false") {
            res.status(401);
            res.json({error: "Account already exists"});
        } 

        else if (usernameExists !== "false") {
            res.status(401);
            res.json({error: "Username already exists"});
        }

        else {
            let hashedPassword = await createHashPassword(password);

            if (hashedPassword === "error") {
                res.status(500);
                res.json({error: "Something went wrong"});
            }

            else {
                let text = `INSERT INTO users(email, username, password) VALUES($1, $2, $3) RETURNING *`;
                let values = [email, username, hashedPassword];
                let isAccountCreated = await psqlCommand(text, values);

                if (isAccountCreated === "error") {
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
    let username = req.query.username;

    if (!(username.length >= 5 && username.length <= 64)) {
        res.status(401);
        res.json({error: "Invalid credentials"});
    }

    else {
        let data = await getValue("users", "username", username);

        if (data === "error") {
            res.status(400);
            res.json({error: "Something went wrong"});
        }
        
        else if (data === "false") {
            res.status(401);
            res.json({error: "No account exists"});
        }

        else {
            let userID = data[0].id;
            let killHistory = await getValue("kills", "user_id", userID);

            if (killHistory === "error") {
                res.status(400);
                res.json({error: "Something went wrong"});
            }

            else {
                res.status(200);
                res.json({info: killHistory});
            }
        }
    }
});

app.post('/kill', async function (req, res) {
    let token = req.body.token;
    let date = req.body.date;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let nickname = req.body.nickname;
    let description = req.body.description;
    let image = req.body.image;

    if (!req.body.hasOwnProperty("token") || !req.body.hasOwnProperty("date") || !req.body.hasOwnProperty("latitude") || 
        !req.body.hasOwnProperty("longitude") || !req.body.hasOwnProperty("nickname") || 
        !req.body.hasOwnProperty("description") || !req.body.hasOwnProperty("image") || 
        !(validateString(token)) || !(validateString(date)) || !(validateNumber(latitude)) || !(validateNumber(longitude)) ||
        !(validateString(nickname)) || !(validateString(description)) || !(validateString(image)) || !(validateDate(date)) || 
        !(latitude >= -90 && latitude <= 90) || !(longitude >= -180 && longitude <= 180) ||
        !(nickname.length >= 1 && nickname.length <= 60) || !(description.length >= 0 && description.length <= 140) ||
        !(image === "true" || image === "false"))
    {
        res.status(401);
        res.json({error: "Invalid data, please try again"});
    } 

    else {
        let user = await getUserFromToken(token);

        if (user === "false") {
            res.status(401);
            res.json({error: "Account does not exist"});
        } 

        else if (user === "error") {
            res.status(400);
            res.json({error: "Invalid token"});
        }
        
        else {
            let id = user.id;
            let text = `INSERT INTO kills (user_id, date, loc_lat, loc_lon, nickname, description, img_exist) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
            let values = [id, date, latitude, longitude, nickname, description, image];
            let isKillCreated = await psqlCommand(text, values);

            if (isKillCreated === "error") {
                res.status(400);
                res.json({error: "Something went wrong"});
            }

            else {
                res.status(200);
                res.json({success: "Kill created"});
            }
        } 
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

// https://dev.to/uzairsamad/how-to-check-if-number-is-float-in-js-h98
function validateNumber(n) {
    return (typeof n) === "number"
}

function validateString(n) {
    return (typeof n) === "string";
}

// https://www.geeksforgeeks.org/how-to-check-a-date-is-valid-or-not-using-javascript/
function validateDate(n) {
    let d = new Date(n);

    if (Object.prototype.toString.call(d) === "[object Date]") {
        if (isNaN(d.getTime())) { 
            return false;
        }
        else {
            return true;
        }
    }
}

async function getUserFromToken(token) {
    try {
        let decoded = jwt.decode(token, secret);

        let user = await getValue("users", "email", decoded.email);
        let hashedPassword = user[0].password; 
        let accountExists = await validatePassword(decoded.password, hashedPassword);

        if (accountExists === "true") {
            return user[0];
        }

        else {
            return "false";
        }

    } catch (err) {
        return "error";
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

async function psqlCommand(text, values) {
    try {
        const res = await pool.query(text, values);
        
        return res.rows;

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
