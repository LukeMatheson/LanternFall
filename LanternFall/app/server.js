const pg = require("pg");
const bcrypt = require("bcrypt");
const express = require("express");
const multer = require("multer");
const jwt = require("jwt-simple");
const app = express();
const upload = multer({dest: 'uploads/', storage: multer.memoryStorage()});

const port = 80;
const hostname = "localhost";

const saltRounds = 10;
const secret = "*WaRsiZKrap";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

let totalKills = getTotalKills();
let topRecentKills = getRecentKills();
let leaderboard = getLeaderboard();

let totalKillsTimer = setInterval(getTotalKills, 1000 * 600);
let recentKillsTimer = setInterval(getRecentKills, 1000 * 600);
let leaderboardTimer = setInterval(getLeaderboard, 1000 * 3600);

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
                let accountCreated = await psqlCommand(text, values);

                if (accountCreated === "error") {
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

    if (!(req.query.hasOwnProperty("username")) || !(username.length >= 5 && username.length <= 64)) {
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

app.get(`/image`, async function(req, res) {
    let kill_id = req.query.kill;

    if (!(req.query.hasOwnProperty("kill")) || !(validateString(kill_id))) {
        res.status(401);
        res.json({error: "Invalid credentials"});
    }

    else {
        let data = await getValue("images", "kill_id", kill_id);
        
        if (data === "error") {
            res.status(400);
            res.json({error: "Something went wrong"});
        }
        
        else if (data === "false") {
            res.status(401);
            res.json({error: "No image exists"});
        }

        else {
            let img = Buffer.from(data[0].img, 'base64');

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img);
        }
    }
});

app.post('/kill', upload.single('photo'), async function (req, res) {
    let killInfo = JSON.parse(req.body.user);

    let token = killInfo.token;
    let date = killInfo.date;
    let latitude = killInfo.latitude;
    let longitude = killInfo.longitude;
    let nickname = killInfo.nickname;
    let description = killInfo.description;
    let imageExists = killInfo.image;

    if (!killInfo.hasOwnProperty("token") || !killInfo.hasOwnProperty("date") || !killInfo.hasOwnProperty("latitude") || 
        !killInfo.hasOwnProperty("longitude") || !killInfo.hasOwnProperty("nickname") || 
        !killInfo.hasOwnProperty("description") || !killInfo.hasOwnProperty("image") || 
        !(validateString(token)) || !(validateString(date)) || !(validateNumber(latitude)) || !(validateNumber(longitude)) ||
        !(validateString(nickname)) || !(validateString(description)) || !(validateString(imageExists)) || !(validateDate(date)) || 
        !(latitude >= -90 && latitude <= 90) || !(longitude >= -180 && longitude <= 180) ||
        !(nickname.length >= 1 && nickname.length <= 60) || !(description.length >= 0 && description.length <= 140) ||
        !(imageExists === "true" || imageExists === "false"))
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
            let text = `INSERT INTO kills (user_id, date, loc_lat, loc_lon, nickname, description, img_exist) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
            let values = [id, date, latitude, longitude, nickname, description, imageExists];
            let killCreated = await psqlCommand(text, values);

            if (killCreated === "error") {
                res.status(400);
                res.json({error: "Something went wrong"});
            }

            else {
                let text = `UPDATE users SET total_kills = total_kills + 1 WHERE id = $1`;
                let values = [user.id];
                let incrementKills = await psqlCommand(text, values);

                if (incrementKills === "error") {
                    console.log(`incrementKills did not work for ${user.id}`)
                }

                if (imageExists === "true") {
                    let photoInfo = req.file;
                    let photo = req.file.buffer;
                    const imageType = /image.*/;

                    if (!photoInfo.mimetype.match(imageType)) {
                        res.status(400);
                        res.json({error: "Not an image"});
                    }

                    else if (photo.size > 5000*1024) {
                        res.status(401);
                        res.json({error: "Image too big"});
                    }

                    else {
                        let text = `INSERT INTO images (kill_id, imgname, img) VALUES ($1, $2, $3) RETURNING *`;
                        let values = [killCreated[0].id, photoInfo.originalname, photo];
                        let imageUploaded = await psqlCommand(text, values);

                        if (imageUploaded === "error") {
                            res.status(401);
                            res.json({error: "Something went wrong"});
                        }

                        else {
                            res.status(200);
                            res.json({success: "Kill created"});
                        }
                    }
                }

                else {
                    res.status(200);
                    res.json({success: "Kill created"});
                }
            }
        } 
    }
});

app.post('/changeUsername', async function (req, res) {
    let token = req.body.token;
    let newUsername = req.body.username;

    if (!(req.body.hasOwnProperty("token")) || !(validateString(token)) || 
        !(req.body.hasOwnProperty("username")) || !(validateString(newUsername)))  
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
            let usernameExists = await getValue("users", "username", newUsername);

            if (usernameExists === "error") {
                res.status(400);
                res.json({error: "Something went wrong"});
            }

            else if (usernameExists !== "false") {
                res.status(401);
                res.json({error: "Username already exists"});
            }

            else {
                let id = user.id;
                let text = `UPDATE users SET username = $1 WHERE id = $2`;
                let values = [newUsername, id];
                let killCreated = await psqlCommand(text, values);

                if (killCreated === "error") {
                    res.status(400);
                    res.json({error: "Something went wrong"});
                }

                else {
                    res.status(200);
                    res.json({success: "Username changed"});
                }
            }
        } 
    }
});

app.post('/deletePost', async function (req, res) {
    let token = req.body.token;
    let kill_id = req.body.kill;

    if (!(req.body.hasOwnProperty("token")) || !(validateString(token)) || 
        !(req.body.hasOwnProperty("kill")) || !(validateNumber(kill_id)))  
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
            let userKills = await getValue("kills", "user_id", user.id);

            if (userKills === "error") {
                res.status(400);
                res.json({error: "Something went wrong"});
            }

            else if (userKills === "false") {
                res.status(401);
                res.json({error: "No kills from user"});
            }

            else {
                for (let x = 0; x < userKills.length; x++) {
                    if (userKills[x].id === kill_id) {
                        if (userKills[x].img_exist) {
                            let text = `DELETE FROM images WHERE kill_id = $1`;
                            let values = [kill_id];
                            let imageDeleted = await psqlCommand(text, values);

                            if (imageDeleted === "error") {
                                console.log(`Image not deleted at kill ${kill_id}`)
                            }
                        }

                        let text = `DELETE FROM kills WHERE id = $1`;
                        let values = [kill_id];
                        let killDeleted = await psqlCommand(text, values);

                        if (killDeleted === "error") {
                            res.status(400);
                            return res.json({error: "Something went wrong"});
                        }

                        else {
                            res.status(200);
                            return res.json({success: "Kill deleted"});
                        }
                    }
                }

                res.status(401);
                res.json({error: "Kill does not belong to user"});
            }
        } 
    }
});

app.post('/deleteAccount', async function (req, res) {
    let token = req.body.token;

    if (!(req.body.hasOwnProperty("token")) || !(validateString(token)))
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
            let userKills = await getValue("kills", "user_id", user.id);

            if (userKills === "error") {
                res.status(400);
                res.json({error: "Something went wrong"});
            }

            else if (userKills === "false") {
                res.status(401);
                res.json({error: "No kills from user"});
            }

            else {
                for (let x = 0; x < userKills.length; x++) {
                    if (userKills[x].img_exist) {
                        let text = `DELETE FROM images WHERE kill_id = $1`;
                        let values = [userKills[x].id];
                        let imageDeleted = await psqlCommand(text, values);

                        if (imageDeleted === "error") {
                            console.log(`Image not deleted at kill ${userKills[x].id}`)
                        }
                    }
                }

                let text = `DELETE FROM kills WHERE user_id = $1`;
                let values = [user.id];
                let killDeleted = await psqlCommand(text, values);

                if (killDeleted === "error") {
                    console.log(`Kills not deleted for user ${user.id}`)
                }

                text = `DELETE FROM users WHERE id = $1`;
                values = [user.id];
                let userDeleted = await psqlCommand(text, values);

                if (userDeleted === "error") {
                    res.status(400);
                    res.json({error: "Something went wrong"});
                }

                else {
                    res.status(200);
                    return res.json({success: "User deleted"});
                }
            }
        } 
    }
});

app.get('/leaderboard', async function (req, res) {
    res.status(200); 
    res.json({info: leaderboard});
});

app.get('/totalKills', async function (req, res) {
    res.status(200); 
    res.json({info: totalKills});
});

app.get('/topRecentKills', function (req, res) {
    res.status(200); 
    res.json({info: topRecentKills});
});

app.listen(port, hostname, () => {
    console.log(`Server running on port ${port}`);
});

// https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateNumber(n) {
    return (typeof n) === "number";
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

async function getLeaderboard() {
    let text = `SELECT * FROM users ORDER BY total_kills DESC LIMIT 10`;
    let values = [];

    let leaderboardList = await psqlCommand(text, values);

    if (leaderboardList === "error") {
        console.log("getLeaderboard() error"); 
    }

    else {
        leaderboard = leaderboardList;
    }
}

async function getTotalKills() {
    let text = `SELECT reltuples AS estimate FROM pg_class WHERE relname = 'kills'`;
    let values = [];

    let killLength = await psqlCommand(text, values);

    if (killLength === "error") {
        console.log("getTotalKill error"); 
    }

    else {
        totalKills = killLength[0].estimate;
    }
}

async function getRecentKills() {
    let text = `SELECT * FROM kills ORDER BY id DESC LIMIT 10`;
    let values = [];

    let killList = await psqlCommand(text, values);

    if (killList === "error") {
        console.log("getRecentKill error"); 
    }

    else {
        topRecentKills = killList;
    }
}

async function getUserFromToken(token) {
    try {
        let decoded = jwt.decode(token, secret);

        let user = await getValue("users", "email", decoded.email);

        if (user === "false") {
            return "false";
        }

        else {
            let hashedPassword = user[0].password; 
            let accountExists = await validatePassword(decoded.password, hashedPassword);

            if (accountExists === "true") {
                return user[0];
            }

            else {
                return "false";
            }
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
