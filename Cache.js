var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId; 

class Cache {

    /**
     * Connnect to the Database (required before any other operation)
     * 
     * @param {String} url the url of the MongoDB
     */
    static connect(url = 'mongodb://localhost:27017') {
        return new Promise((res, rej) => {
            MongoClient.connect(url, {useNewUrlParser: true}, (err, client) => {
                if(err) {
                    console.error("Couldn't Connect to MongoDB Database. Provide a valid URL")
                    process.exit(1)
                }
                
                console.log("Connected to MongoDB");

                this.db = client.db("youtube-cached-api")

                res(this.db)
            });
        })
    }

    /**
     * Get a database entry
     * 
     * @param {String} collection the name of the collection to use
     * @param {Object} parameters what parameters were used for the API request. If _id specified, that id will be selected
     */
    static getEntry(collection, parameters) {
        return new Promise((res, rej) => {
            if(!collection || typeof parameters != "object") {
                rej("Not enough arguments given")
                return
            }

            parameters = Object.assign({}, parameters)
            delete parameters.maxResults
            delete parameters.auth;

            var query = (parameters._id)?{_id: parameters._id}:{parameters: parameters}

            this.db.collection(collection).findOne(query, async (err, doc) => {
                if(err) {
                    rej(err)
                    return
                }

                if(doc && doc.items) {
                    for(let i in doc.items) {
                        if(doc.items[i] instanceof ObjectId) {
                            doc.items[i] = await this.getEntry("videos", {_id: doc.items[i]})
                        }
                    }
                }

                res(doc)
            })
        })
    }

    /**
     * Add an API call response to the database
     * 
     * @param {String} collection The name of the collection to update to
     * @param {Object} parameters The parameters of the API call
     * @param {Object} data The response of the call
     */
    static addEntry(collection, parameters, data) {
        return new Promise((res, rej) => {
            if (!collection || typeof parameters != "object" || typeof data != "object") {
                rej("Not enough arguments given")
                return
            }

            parameters = Object.assign({}, parameters)
            delete parameters.maxResults;
            delete parameters.auth;

            this.saveVideos(data.items).then((out) => {
                data.items = out
                res(this.db.collection(collection).insertOne({ parameters: parameters, ...data }))
            })
        })
    }

    /**
     * Updates a document by its parameters
     * 
     * @param {String} collection The name of the collection to save to
     * @param {Object} parameters The parameters of the API call
     * @param {Object} change The data to update WITH atomic update thingies
     */
    static updateEntry(collection, parameters, change) {
        return new Promise((res, rej) => {
            if (!collection || typeof parameters != "object" || typeof change != "object") {
                rej("Not enough arguments given")
                return
            }

            parameters = Object.assign({}, parameters)
            delete parameters.maxResults;
            delete parameters.auth;

            var query = (parameters._id) ? { _id: parameters._id } : { parameters: parameters }

            res(this.db.collection(collection).updateOne(query, change))
        })
    }

    /**
     * Saves videos from an array as their own document in the "videos" collection and replaces them with their ObjectId
     * 
     * @param {Array} videos An array of videos like from searchresults
     * @return {Array} An array with the video objects replaced with their ObjectId
     */
    static saveVideos(videos) {
        return new Promise(async (res, rej) => {
            for(let i in videos) {
                if(videos[i].id.kind == "youtube#video") {
                    let res = (await this.db.collection("videos").findOneAndUpdate({"id.videoId": videos[i].id.videoId}, {$set: videos[i]}, {
                        upsert: true
                    }))
                    videos[i] = (res.lastErrorObject.upserted)?res.lastErrorObject.upserted:res.value._id
                }
            }
            res(videos)
        })
    }
}

module.exports = Cache;
