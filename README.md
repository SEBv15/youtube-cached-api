# youtube-cached-api

A YouTube API wrapper for Node.JS that caches results to limit quota usage. 

### This library saves *ALL* request parameters and responses so it will generate a lot of data very quickly. Therefore it should only be used in applications were the same videos/channels/etc are accessed most of the time.

#### Also since it is cached, search results will not show the newest videos, but the content it received when a request was made for the first time. (Except when the `forceUpdate` flag is set).

## Installation

To install the library use
```shell
npm i youtube-cached-api --save
```

## Usage

Go to the [Google Developer API Console](https://console.developers.google.com/) to get an API token

```js
var youtube = require("youtube-cached-api")
youtube.connect("mongodb://localhost:27017")
youtube.token("your API token")

youtube.on("connection", async () => {
    // search for despacito
    var despacitoSearch = new youtube.Search({
        q: "Despacito"
    })
    console.log(despacitoSearch.newItems)

    // Get 5 more search results
    await despacitoSearch.next(5)
    console.log(despacitoSearch.newItems)
})
```