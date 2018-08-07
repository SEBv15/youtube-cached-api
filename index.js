var { yt, token } = require("./yt-api");
var Search = require("./Search")
var Cache = require("./Cache")

async function t() {
    await Cache.connect();
    //console.log(await Cache.getEntry("search", { name: "test" }))
    console.log(await new Search({q: "pewdiepie", maxResults: 3}))
}
t()

module.exports = {
    Search: Search,
    connect: Cache.connect
}