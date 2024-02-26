const express = require("express");
const { connectToDb, getDb } = require('./db');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

let db;

connectToDb((err) => {
    if (!err) {
        app.listen(PORT, (err) => {
            err ? console.log(err) : console.log(`listening port ${PORT}`);
        });
        db = getDb();
    } else {
        console.log(`DB connection error: ${err}`);
    }
});


app.get('/categories', (req, res) => {
    const goods = [];
    db
        .collection('categories')
        .find()
        .forEach((item) => goods.push(item))
        .then(() => {
            res
                .status(200)
                .json(goods);
        })
        .catch(() => {
            res
                .status(500)
                .json({ error: "Упс... Щось пішло не так..." })
        })
});

app.get('/goods/top-sellers', (req, res) => {
    const goods = [];
    db
        .collection('topSellers')
        .find()
        .forEach((item) => goods.push(item))
        .then(() => {
            res
                .status(200)
                .json(goods);
        })
        .catch(() => {
            res
                .status(500)
                .json({ error: "Упс... Щось пішло не так..." })
        })
});

app.get('/sales', (req, res) => {
    const goods = [];
    db
        .collection('sales')
        .find()
        .forEach((item) => goods.push(item))
        .then(() => {
            res
                .status(200)
                .json(goods);
        })
        .catch(() => {
            res
                .status(500)
                .json({ error: "Упс... Щось пішло не так..." })
        })
});

app.get('/categorie/:categoryId', (req, res) => {
    const dataArray = [];
    const categoryId = req.params.categoryId;

    db
        .collection('subcategories')
        .find({ parent_category_id: categoryId })
        .forEach((item) => dataArray.push(item))
        .then(() => {
            res
                .status(200)
                .json(dataArray);
        })
        .catch(() => {
            res
                .status(500)
                .json({ error: "Упс... Щось пішло не так..." })
        })
});


