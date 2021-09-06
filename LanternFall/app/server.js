const pg = require("pg");
const bcrypt = require("bcrypt");
const express = require("express");
const multer = require("multer");
const jwt = require("jwt-simple");
const https = require("https");
const fs = require("fs");
const helmet = require('helmet');
const app = express();
const upload = multer({dest: 'uploads/', storage: multer.memoryStorage()});

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

const PORT = process.env.PORT || 443;
const HOSTNAME = "localhost";
const SALTROUNDS = 10;
const SECRET = "*WaRsiZKrap";
const MINUTE = 1000 * 60;
const TENMINUTE = 1000 * 600;
const MINLENGTH = 5;
const MAXLENGTH = 64;
const MAXPHOTOSIZE = 1024 * 200;
const SUCCESSSTATUS = 200;
const FAILSTATUS = 401;
const ERRORSTATUS = 400;
const IMAGETYPE = /image.*/;

let totalKills = getTotalKills();
let topRecentKills = getRecentKills();
let leaderboard = getLeaderboard();

let totalKillsTimer = setInterval(getTotalKills, MINUTE);
let recentKillsTimer = setInterval(getRecentKills, MINUTE);
let leaderboardTimer = setInterval(getLeaderboard, MINUTE);

pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(express.static("public_html"));
app.use(express.json());

app.post('/login', async function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    email = email.toLowerCase();

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(validateString(password)) || !(password.length >= MINLENGTH && password.length <= MAXLENGTH)
    ) {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    } 
    
    let user = await getValue("users", "email", email);

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "No account exists"});
    }

    let hashedPassword = user[0].password;
    let accountExists = await validatePassword(password, hashedPassword);

    if (accountExists === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (accountExists === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    }

    let payload = {email: email, password: password}
    let username = user[0].username;

    res.status(SUCCESSSTATUS);
    return res.json({token: jwt.encode(payload, SECRET), username: username});
});

app.post('/create', async function (req, res) {
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;

    email = email.toLowerCase();

    if (
        !req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("password") ||
        !validateEmail(email) || !(validateString(username)) || !(validateString(password)) 
    ) {
        res.status(FAILSTATUS);
        return res.json({error: "Incomplete data"});
    } 

    if (!(username.length >= MINLENGTH && username.length <= MAXLENGTH) || (username.includes(" "))) {
        res.status(FAILSTATUS);
        return res.json({error: "Username needs to be at least five characters with no spaces"});
    }

    if (!(password.length >= MINLENGTH && password.length <= MAXLENGTH) || (password.includes(" "))) {
        res.status(FAILSTATUS);
        return res.json({error: "Password needs to be at least five characters with no spaces"});
    }
    
    let emailExists = await getValue("users", "email", email);
    let usernameExists = await getValue("users", "username", username);

    if (emailExists === "error" || usernameExists === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (emailExists !== "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account already exists"});
    } 

    if (usernameExists !== "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Username already exists"});
    }

    let hashedPassword = await createHashPassword(password);

    if (hashedPassword === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    let text = `INSERT INTO users(email, username, password) VALUES($1, $2, $3) RETURNING *`;
    let values = [email, username, hashedPassword];
    let accountCreated = await psqlCommand(text, values);

    if (accountCreated === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({success: "Account created"});
});

app.post('/imageUser', async function (req, res) {
    let token = req.body.token;
    let kill_id = req.body.kill;

    if (
        !(req.body.hasOwnProperty("token")) || !(req.body.hasOwnProperty("kill")) || 
        !(validateString(token) || !(validateString(kill_id)))
    ) {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    }

    let user = await getUserFromToken(token);

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Invalid token"});
    }

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account does not exist"});
    } 

    let kill = await getValue("kills", "id", kill_id);

    if (kill === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (kill === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "No kill"});
    } 
    
    if (kill[0].user_id === user.id) {
        res.status(SUCCESSSTATUS);
        return res.json({success: "true"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({success: "false"});
});

app.get('/history/:id', async function (req, res) {
    let username = req.params.id;

    if (!(req.params.hasOwnProperty("id")) || !(username.length >= MINLENGTH && username.length <= MAXLENGTH)) {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    }

    let data = await getValue("users", "username", username);

    if (data === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }
    
    if (data === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "No account exists"});
    }

    let userID = data[0].id;
    let killHistory = await getValue("kills", "user_id", userID);

    if (killHistory === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({info: killHistory});
});

app.get('/killInfo/:id', async function (req, res) {
    let kill_id = req.params.id;

    if (!(req.params.hasOwnProperty("id")) || !(validateString(kill_id))) {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    }

    let killHistory = await getValue("kills", "id", kill_id);

    if (killHistory === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({info: killHistory[0]});
});

app.get(`/image/:id`, async function(req, res) {
    let kill_id = req.params.id;

    if (!(req.params.hasOwnProperty("id")) || !(validateString(kill_id))) {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid credentials"});
    }

    let data = await getValue("images", "kill_id", kill_id);
    
    if (data === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }
    
    if (data === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "No image exists"});
    }

    let img = Buffer.from(data[0].img, 'base64');

    res.writeHead(SUCCESSSTATUS, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
    });
    return res.end(img);
});

app.post('/kill', upload.single('photo'), async function (req, res) {
    let killInfo = JSON.parse(req.body.user);

    let token = killInfo.token;
    let latitude = killInfo.latitude;
    let longitude = killInfo.longitude;
    let nickname = killInfo.nickname;
    let description = killInfo.description;
    let imageExists = killInfo.image;

    // https://tecadmin.net/get-current-date-time-javascript/
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;

    if (!killInfo.hasOwnProperty("token") || !killInfo.hasOwnProperty("latitude") || 
        !killInfo.hasOwnProperty("longitude") || !killInfo.hasOwnProperty("nickname") || 
        !killInfo.hasOwnProperty("description") || !killInfo.hasOwnProperty("image") || 
        !(validateString(token)) || !(validateNumber(latitude)) || !(validateNumber(longitude)) ||
        !(validateString(nickname)) || !(validateString(description)) || !(validateString(imageExists)) || 
        !(latitude >= -90 && latitude <= 90) || !(longitude >= -180 && longitude <= 180) ||
        !(imageExists === "true" || imageExists === "false"))
    {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid data, please try again"});
    } 

    if (!(nickname.length >= 1 && nickname.length <= 20)) {
        res.status(FAILSTATUS);
        return res.json({error: "Nickname needs to be at least one character"});
    } 

    if (!(description.length >= 0 && description.length <= 140)) {
        res.status(FAILSTATUS);
        return res.json({error: "Description is too long"});
    } 

    let user = await getUserFromToken(token);

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account does not exist"});
    } 

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Invalid token"});
    }
    
    let id = user.id;

    let text = `SELECT * FROM kills WHERE user_id = $1 ORDER BY id DESC LIMIT 1`;
    let values = [id];
    let oldKill = await psqlCommand(text, values);

    if (oldKill === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }
   
    if (oldKill.length > 0) {
        let oldDate = new Date(oldKill[0].date);
        
        if (Math.abs(today.getTime() - oldDate.getTime()) < TENMINUTE) {
            res.status(FAILSTATUS);
            return res.json({error: "Wait at least 10 minutes"});
        }
    }

    text = `INSERT INTO kills (user_id, date, loc_lat, loc_lon, nickname, description, img_exist) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    values = [id, dateTime, latitude.toFixed(4), longitude.toFixed(4), nickname.trim(), description, imageExists];
    let killCreated = await psqlCommand(text, values);

    if (killCreated === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    text = `UPDATE users SET total_kills = total_kills + 1 WHERE id = $1`;
    values = [user.id];
    let incrementKills = await psqlCommand(text, values);

    if (incrementKills === "error") {
        console.log(`incrementKills did not work for ${user.id}`)
    }

    if (imageExists === "true") {
        let photoInfo = req.file;
        let photo = req.file.buffer;

        if (!photoInfo.mimetype.match(IMAGETYPE)) {
            res.status(ERRORSTATUS);
            return res.json({error: "Not an image"});
        }

        if (photo.size > MAXPHOTOSIZE) {
            res.status(FAILSTATUS);
            return res.json({error: "Image too big"});
        }

        let text = `INSERT INTO images (kill_id, imgname, img) VALUES ($1, $2, $3) RETURNING *`;
        let values = [killCreated[0].id, photoInfo.originalname, photo];
        let imageUploaded = await psqlCommand(text, values);

        if (imageUploaded === "error") {
            res.status(FAILSTATUS);
            return res.json({error: "Something went wrong"});
        }

        res.status(SUCCESSSTATUS);
        return res.json({success: "Kill created"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({success: "Kill created"});
});

app.post('/changeUsername', async function (req, res) {
    let token = req.body.token;
    let newUsername = req.body.username;

    if (!(req.body.hasOwnProperty("token")) || !(validateString(token)) || 
        !(req.body.hasOwnProperty("username")) || !(validateString(newUsername)))  
    {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid data, please try again"});
    } 

    if (!(newUsername.length >= MINLENGTH && newUsername.length <= MAXLENGTH) || (newUsername.includes(" "))) {
        res.status(FAILSTATUS);
        return res.json({error: "Username needs to be at least five characters with no spaces"});
    }

    let user = await getUserFromToken(token);

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account does not exist"});
    } 

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Invalid token"});
    }
    
    let usernameExists = await getValue("users", "username", newUsername);

    if (usernameExists === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (usernameExists !== "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Username already exists"});
    }

    let id = user.id;
    let text = `UPDATE users SET username = $1 WHERE id = $2`;
    let values = [newUsername, id];
    let killCreated = await psqlCommand(text, values);

    if (killCreated === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({info: newUsername, success: "Username changed"});
});

app.post('/deletePost', async function (req, res) {
    let token = req.body.token;
    let kill_id = req.body.kill;

    if (!(req.body.hasOwnProperty("token")) || !(validateString(token)) || 
        !(req.body.hasOwnProperty("kill")) || !(validateNumber(kill_id)))  
    {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid data, please try again"});
    } 

    let user = await getUserFromToken(token);

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account does not exist"});
    } 

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Invalid token"});
    }
    
    let userKills = await getValue("kills", "user_id", user.id);

    if (userKills === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (userKills === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "No kills from user"});
    }

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
                res.status(ERRORSTATUS);
                return res.json({error: "Something went wrong"});
            }

            for (let y = 0; y < topRecentKills.length; y++) {
                if (topRecentKills[y].id === kill_id) {
                    topRecentKills.splice(y, 1)
                } 
            }

            text = `UPDATE users SET total_kills = total_kills - 1 WHERE id = $1`;
            values = [user.id];
            let incrementKills = await psqlCommand(text, values);

            if (incrementKills === "error") {
                console.log(`decrementKills did not work for ${user.id}`)
            }

            res.status(SUCCESSSTATUS);
            return res.json({success: "Kill deleted"});
        }
    }

    res.status(FAILSTATUS);
    return res.json({error: "Kill does not belong to user"});
});

app.post('/deleteAccount', async function (req, res) {
    let token = req.body.token;

    if (!(req.body.hasOwnProperty("token")) || !(validateString(token)))
    {
        res.status(FAILSTATUS);
        return res.json({error: "Invalid data, please try again"});
    } 

    let user = await getUserFromToken(token);

    if (user === "false") {
        res.status(FAILSTATUS);
        return res.json({error: "Account does not exist"});
    } 

    if (user === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Invalid token"});
    }
    
    let userKills = await getValue("kills", "user_id", user.id);

    if (userKills === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    if (userKills !== "false") {
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

        for (let y = 0; y < topRecentKills.length; y++) {
            if (topRecentKills[y].user_id === user.id) {
                topRecentKills.splice(y, 1)
            } 
        }
    }

    let text = `DELETE FROM users WHERE id = $1`;
    let values = [user.id];
    let userDeleted = await psqlCommand(text, values);

    if (userDeleted === "error") {
        res.status(ERRORSTATUS);
        return res.json({error: "Something went wrong"});
    }

    res.status(SUCCESSSTATUS);
    return res.json({success: "User deleted"});
});

app.get('/leaderboard', async function (req, res) {
    res.status(SUCCESSSTATUS); 
    return res.json({info: leaderboard});
});

app.get('/totalKills', async function (req, res) {
    res.status(SUCCESSSTATUS); 
    return res.json({info: totalKills});
});

app.get('/topRecentKills', function (req, res) {
    res.status(SUCCESSSTATUS); 
    return res.json({info: topRecentKills});
});

// Comment out if on VPS
app.listen(80, HOSTNAME, () => {
    console.log(`Server running on port 80`);
});

// Uncomment if on VPS
/*
const options = {
	key: fs.readFileSync(`../lanternfall.com.key`),
	cert: fs.readFileSync(`../lanternfall.com.pem`)
}

const httpsServer = https.createServer(options, app).listen(PORT, () => {
	console.log(`HTTPS Server running on port ${PORT}`)
});
*/

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

async function getLeaderboard() {
    let text = `SELECT * FROM users ORDER BY total_kills DESC LIMIT 10`;
    let values = [];

    let leaderboardList = await psqlCommand(text, values);

    if (leaderboardList === "error") {
        return console.log("getLeaderboard() error"); 
    }

    leaderboard = leaderboardList;
}

async function getTotalKills() {
    let text = `SELECT reltuples AS estimate FROM pg_class WHERE relname = 'kills'`;
    let values = [];

    let killLength = await psqlCommand(text, values);

    if (killLength === "error") {
        return console.log("getTotalKill error"); 
    }

    totalKills = killLength[0].estimate;
}

async function getRecentKills() {
    let text = `SELECT * FROM kills ORDER BY id DESC LIMIT 10`;
    let values = [];

    let killList = await psqlCommand(text, values);

    if (killList === "error") {
        return console.log("getRecentKill error"); 
    }

    for (let x = 0; x < killList.length; x++) {
        let user = await getValue("users", "id", killList[x].user_id);

        if (user === "error") {
            return console.log("getRecentKill error"); 
        }

        killList[x].username = user[0].username;
    }

    topRecentKills = killList;
}

async function getUserFromToken(token) {
    try {
        let decoded = jwt.decode(token, SECRET);

        let user = await getValue("users", "email", decoded.email);

        if (user === "false") {
            return "false";
        }

        let hashedPassword = user[0].password; 
        let accountExists = await validatePassword(decoded.password, hashedPassword);

        if (accountExists === "true") {
            return user[0];
        }

        return "false";

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

        return "false";

    } catch (err) {
        console.log(err.stack);
        return "error";
    }
}

async function createHashPassword(password) {
    try {
        const res = await bcrypt.hash(password, SALTROUNDS);
        
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

        return "false";

    } catch (err) {
        console.log(err.stack);
        return "error";
    } 
}
