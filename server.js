let express = require("express");
let app = express();
app.use(express.json());

//TODO: ask about the following:
//-we certainly aren't using localhost, so what should the hostname/port be?
//-find out information about databasing so that we know what to do with the information.

//TODO: set up folder for web server and upload code to github repo

let port = 3000;
let hostname = "localhost";

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