var Cache = require("./Cache")
var { yt, token } = require("./yt-api");

module.exports = class Search {

    /**
     * Search YouTube Videos
     * 
     * @param {Object} parameters Search parameters (https://developers.google.com/youtube/v3/docs/search/list#parameters)
     * @param {String} parameters.q the string to search for
     * @param {Boolean} forceUpdate force a new request even when the result is already cached
     */
    constructor(parameters, forceUpdate = false) {
        return new Promise(async (res, rej) => {
            this.parameters = {
                auth: token,
                'part': 'snippet',
                'maxResults': '10',
                'q': '',
                'type': 'video'
            }

            if(!parameters.q) {
                rej("Need parameter 'q'")
                return
            }

            this.parameters = { ...this.parameters, ...parameters }

            if(!forceUpdate) {
                var data = await Cache.getEntry("search", this.parameters)
                if(data) {
                    this.setAllData(data)
                    if(this.parameters.maxResults < this.items.length) {
                        var params = this.parameters
                        params.maxResults = this.parameters.maxResults - this.items.length
                        await this.loadResults(this.nextPageToken, params)
                    }
                    this.newItems = this.items
                    res(this)
                } else {
                    this.newItems = await this.loadResults()
                    res(this);
                }
            } else {
                this.newItems = await this.loadResults()
                res(this);
            }
        }) 
    }

    /**
     * Copies the data to the class
     * 
     * @param {Object} data the data
     */
    setAllData(data) {
        for (let i in data) {
            if(i != "parameters") 
                this[i] = data[i]
        }
    }

    /**
     * Load results via the YouTube API
     * 
     * @param {String} pageToken the page token where to start loading from
     * @param {Object} params the search parameters (leave undefined most of the time)
     */
    loadResults(pageToken, params = this.parameters) {
        return new Promise((resolve, rej) => {
            if (pageToken) {
                params.pageToken = pageToken
            }
            yt.search.list(params, (err, res) => {
                if(err) {
                    rej(err)
                }

                if(pageToken) {
                    this.nextPageToken = res.data.nextPageToken
                    this.items.concat(res.data.items)
                    Cache.updateEntry("search", this.parameters, {$set: {nextPageToken: this.nextPageToken}, $push: {items: this.items}})
                } else {
                    this.setAllData(res.data);
                    Cache.addEntry("search", this.parameters, res.data);
                }
                this.newItems = res.data.items
                resolve(this)
            })
        })
    }

    /**
     * Load more results
     * 
     * @param {Number} results the number of results to load
     */
    async next(results) {
        var params = {...this.parameters}
        params.maxResults = results
        return await this.loadResults(this.nextPageToken, params)
    }
}