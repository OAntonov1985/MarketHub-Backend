const { MongoClient } = require('mongodb');
require('dotenv').config();

let dbConnection;

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect("mongodb+srv://aantonov1985:3jajpgnhNSYjUBw0@oleksandr.enofiot.mongodb.net/MarketHub")
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