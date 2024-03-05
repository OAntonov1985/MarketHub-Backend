const express = require("express");
const { connectToDb, getDb } = require('./db');
const cors = require("cors");
const categoriesRoutes = require("./routes/categories");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());

const pageSize = 12;

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

/////////// КАТЕГОРІЇ на головній ///////////
app.get('/categories', (req, res) => {
    const goods = [];
    db
        .collection('categories')
        .find()
        .sort({ id: 1 })
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


/////////// Топ продажів на головній ///////////
app.get('/goods/top-sellers', (req, res) => {
    const goods = [];
    db
        .collection('goods')
        .find()
        .limit(4)
        .sort({ "how_many_solds": -1 })
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


/////////// Знижки на головній ///////////
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

/////////// Підкатегорії на сторінці категорії ///////////
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

/////////// Отримання списку брендів категорій ///////////
app.get('/goods/caregoriebrand/:categoryId', (req, res) => {
    const dataArray = [];
    const categoryId = req.params.categoryId;

    db
        .collection('goods')
        .find({ "category_details.id": categoryId })
        .forEach((item) => dataArray.push(item.brend))
        .then(() => {
            const newArr = [...new Set(dataArray)];
            res
                .status(200)
                .json(newArr);
        })
        .catch(() => {
            res
                .status(500)
                .json({ error: "Упс... Щось пішло не так..." })
        })
});

/////////// Отримання товару по ID ///////////
app.get('/goods/:goodId', (req, res) => {
    const goodId = req.params.goodId;


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

/////////// Отримання списку брендів субкатегорій ///////////
app.get('/goods/subcaregoriebrand/:subCategoryId', (req, res) => {
    const dataArray = [];
    const subCategoryId = req.params.subCategoryId;
    // console.log(subCategoryId)

    db
        .collection('goods')
        .find({ "sub_category_detail.id": subCategoryId })
        .forEach((item) => dataArray.push(item.brend))
        .then(() => {
            // console.log(dataArray)
            const newArr = [...new Set(dataArray)];
            res
                .status(200)
                .json(newArr);
        })
        .catch(() => {
            res
                .status(500)
                .json({ error: "Упс... Щось пішло не так..." })
        })
});

/////////// Отримання товарів в категорії з можливістю фільтрації ///////////
app.get('/goods/categories/:categoryId', async (req, res) => {
    const pageSize = 12;
    const categoryId = req.params.categoryId;
    const sortIndex = req.query.sortIndex === '1' ? 1 : req.query.sortIndex === '-1' ? -1 : null;
    const skip = parseInt(req.query.skip) * pageSize || 0;
    const limit = parseInt(req.query.limit) || 12;

    try {
        const min = req.query.min ? parseInt(req.query.min) : null;
        const max = req.query.max ? parseInt(req.query.max) : null;
        let brands = req.query.brend ? Array.isArray(req.query.brend) ? req.query.brend : [req.query.brend] : [];

        const filter = { "category_details.id": categoryId };
        if (min !== null || max !== null) {
            filter.price = {};
            if (min !== null) filter.price.$gte = min;
            if (max !== null) filter.price.$lte = max;
        }
        if (brands.length > 0) {
            filter.$and = [
                { "brend": { $in: brands } }
            ];
        }

        const sort = sortIndex ? { price: sortIndex } : null;

        const total = await db.collection('goods').countDocuments(filter);

        const data = await db.collection('goods')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();

        res.status(200).json({ total, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Упс... Щось пішло не так..." });
    }
});


/////////// Отримання товарів в підкатегорії з можливістю фільтрації///////////
app.get('/goods/subcategories/:subCategoryId', async (req, res) => {
    const pageSize = 12;
    const subCategoryId = req.params.subCategoryId;
    const sortIndex = req.query.sortIndex === '1' ? 1 : req.query.sortIndex === '-1' ? -1 : null;
    const skip = parseInt(req.query.skip) * pageSize || 0;
    const limit = parseInt(req.query.limit) || 12;

    try {
        const min = req.query.min ? parseInt(req.query.min) : null;
        const max = req.query.max ? parseInt(req.query.max) : null;
        let brands = req.query.brend ? Array.isArray(req.query.brend) ? req.query.brend : [req.query.brend] : [];

        const filter = { "sub_category_detail.id": subCategoryId };
        if (min !== null || max !== null) {
            filter.price = {};
            if (min !== null) filter.price.$gte = min;
            if (max !== null) filter.price.$lte = max;
        }
        if (brands.length > 0) {
            filter.$and = [
                { "brend": { $in: brands } }
            ];
        }

        const sort = sortIndex ? { price: sortIndex } : null;

        const total = await db.collection('goods').countDocuments(filter);

        const data = await db.collection('goods')
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();

        res.status(200).json({ total, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Упс... Щось пішло не так..." });
    }
});





/////////// Отримання товарів в категорії звичайне///////////
app.get('/goods/categories/:categoryId/:skip/:limit', (req, res) => {
    const pageSize = 12;
    const categoryId = req.params.categoryId;
    const skip = parseInt(req.params.skip * pageSize);
    const limit = parseInt(req.params.limit);

    const totalQuery = db.collection('goods').countDocuments({ "category_details.id": categoryId });
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






// /////////// Отримання товарів в підкатегорії звичайне///////////
app.get('/goods/subcategories/:subCategoryId/:skip/:limit', (req, res) => {
    const pageSize = 12;
    const subCategoryId = req.params.subCategoryId;
    const skip = parseInt(req.params.skip * pageSize);
    const limit = parseInt(req.params.limit);

    const totalQuery = db.collection('goods').countDocuments({ "sub_category_detail.id": subCategoryId });
    const dataQuery = db.collection('goods')
        .find({ "sub_category_detail.id": subCategoryId })
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

// /////////// Сортування для обраної категорії  по ціні (більше менше) ///////////
// app.get('/goods/categories/:categoryId/:sortIndex/:skip/:limit', (req, res) => {
//     const categoryId = req.params.categoryId;
//     const sortIndex = parseInt(req.params.sortIndex);
//     const skip = parseInt(req.params.skip * 12);
//     const limit = parseInt(req.params.limit);


//     const totalQuery = db.collection('goods').countDocuments({ "category_details.id": categoryId });
//     const dataQuery = db.collection('goods')
//         .find({ "category_details.id": categoryId })
//         .sort({ price: sortIndex })
//         .skip(skip)
//         .limit(limit)
//         .toArray();

//     Promise.all([totalQuery, dataQuery])
//         .then(([total, data]) => {
//             res.status(200).json({ total, data });
//         })
//         .catch((error) => {
//             res.status(500).json({ error: "Упс... Щось пішло не так..." });
//         });

// });

// // /////////// Сортування для обраної категорії  по ціні (новинки) ///////////
// // app.get('/newgoods/categories/:categoryId/:sortId/:skip/:limit', (req, res) => {
// //     const categoryId = req.params.categoryId;
// //     const sortId = req.params.sortId;
// //     const skip = parseInt(req.params.skip * 12);
// //     const limit = parseInt(req.params.limit);

// //     const totalQuery = db.collection('goods').countDocuments({ "category_details.id": categoryId });
// //     const dataQuery = db.collection('goods')
// //         .find({ "category_details.id": categoryId })
// //         .sort({ "create_at": sortId })
// //         .skip(skip)
// //         .limit(limit)
// //         .toArray();

// //     Promise.all([totalQuery, dataQuery])
// //         .then(([total, data]) => {
// //             res.status(200).json({ total, data });
// //         })
// //         .catch((error) => {
// //             res.status(500).json({ error: "Упс... Щось пішло не так..." });
// //         });
// // });


