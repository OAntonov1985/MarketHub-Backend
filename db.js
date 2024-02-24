const { MongoClient } = require('mongodb');

const URL = "mongodb+srv://aantonov1985:3jajpgnhNSYjUBw0@oleksandr.enofiot.mongodb.net/MarketHub";
let dbConnection;

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(URL)
            .then((client) => {
                console.log('Connected to MongoDB');
                dbConnection = client.db();
                return cb();
            })
            .catch((err) => {
                return cb(err);
            });
    },
    getDb: () => dbConnection,
};