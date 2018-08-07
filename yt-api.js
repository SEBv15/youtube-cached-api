var { google } = require('googleapis');
var fs = require("fs")
module.exports = {
    yt: google.youtube('v3'),
    token: JSON.parse(fs.readFileSync("token.json")).token
}