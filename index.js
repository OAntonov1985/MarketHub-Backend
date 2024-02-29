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
    console.log(categoryId)

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

app.get('/goods/:goodId', (req, res) => {
    const goodId = req.params.goodId;
    console.log(goodId)


    db
        .collection('goods')
        .findOne({ id: goodId })
        .then((good) => {
            if (good) {
                res.status(200).json(good);
            } else {
                res.status(404).json({ error: "Товару не знайдено" });
            }
        })
        .catch(() => {
            res
                .status(500)
                .json({ error: "Упс... Щось пішло не так..." })
        })
});

app.get('/goods/categories/:categoryId/:skip/:limit', (req, res) => {
    const pageSize = 12;
    const categoryId = req.params.categoryId;
    const skip = parseInt(req.params.skip * pageSize);
    const limit = parseInt(req.params.limit);

    const totalQuery = db.collection('goods').find({ "category_details.id": categoryId }).count();
    const dataQuery = db.collection('goods')
        .find({ "category_details.id": categoryId })
        .skip(skip)
        .limit(limit)
        .toArray();

    Promise.all([totalQuery, dataQuery])
        .then(([total, data]) => {
            res.status(200).json({ total, data });
        })
        .catch((error) => {
            res.status(500).json({ error: "Упс... Щось пішло не так..." });
        });
});


app.get('/goods/subcategories/:subCategoryId', (req, res) => {
    const dataArray = [];
    const subCategoryId = req.params.subCategoryId;



    db
        .collection('ComputerEngineering')
        .find({ "sub_category_detail.id": subCategoryId })
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


