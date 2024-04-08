const express = require("express");
const { connectToDb, getDb } = require('./db');
const cors = require("cors");
require('dotenv').config()
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage');

// const { upload, uploadMultiple } = require('./helper_functions/multer')
// const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
// const { auth } = require('./config/firebase.config')

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
        const isAvailable = req.query.isAvailable ? req.query.isAvailable === 'true' : null;

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
        if (isAvailable !== null) {
            filter.available = isAvailable;
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
        const isAvailable = req.query.isAvailable ? req.query.isAvailable === 'true' : null;

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
        if (isAvailable !== null) {
            filter.available = isAvailable;
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

// /////////// Отримання покупок юзера ///////////
app.get('/users/purchases/:userId/:skip/:limit', (req, res) => {
    const userId = parseInt(req.params.userId);
    // console.log(userId)
    const skip = parseInt(req.params.skip) * 6;
    const limit = parseInt(req.params.limit);

    const totalQuery = db.collection('user_purchses').countDocuments({ "buyer_id": userId });
    const dataQuery = db.collection('user_purchses')
        .find({ "buyer_id": userId })
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



// /////////// Отримання товарів юзера ///////////
app.get('/users/usergoods/:userId/:skip/:limit', (req, res) => {
    const userId = parseInt(req.params.userId);
    const skip = parseInt(req.params.skip) * 6;
    const limit = parseInt(req.params.limit);
    const isActive = req.query.isActive;

    const filter = { "seller_id": userId };

    if (isActive === 'true') {
        filter.available = true;
    } else if (isActive === 'false') {
        filter.available = false;
    }

    const totalQuery = db.collection('goods').countDocuments(filter);
    const dataQuery = db.collection('goods')
        .find(filter)
        .sort({ "created_at": 1 })
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

// // /////////// Зміна наявності товару по  id ///////////

app.put('/goods/:id/:isAvalable', (req, res) => {
    const id = req.params.id;
    const isAvalable = req.params.isAvalable === 'true';

    db.collection('goods').updateOne(
        { "id": id },
        { $set: { "available": isAvalable } },
        (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "Упс... Щось пішло не так..." });
                return;
            }
            res.status(200).json({ message: "Наявність товару успішно оновлена" });
        }
    );
});



// // /////////// Видаленн товару по id  ///////////
app.delete('/goods/:id', (req, res) => {
    const id = req.params.id;

    db.collection('goods').deleteOne(
        { "id": id },
        (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "Упс... Щось пішло не так..." });
                return;
            }
            res.status(200).json({ message: "Товар успішно видалено" });
        }
    );
});

// // /////////// Пошук товару  в хедері (повертає title, id, thumbnail, price, available) ///////////
app.get('/search/:searchTerm', (req, res) => {
    const searchTerm = req.params.searchTerm;

    const titleQuery = { "title": { $regex: searchTerm, $options: "i" } };
    const idQuery = { "id": { $regex: searchTerm, $options: "i" } };

    const searchPipeline = [
        { $match: { $or: [titleQuery, idQuery] } },
        { $group: { _id: null, count: { $sum: 1 }, data: { $push: "$$ROOT" } } }
    ];

    db.collection('goods').aggregate(searchPipeline).toArray((err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Упс... Щось пішло не так..." });
            return;
        }

        if (result.length === 0) {
            res.status(200).json({ total: 0, data: [] });
            return;
        }

        const total = result[0].count;
        // const data = result[0].data.map(item => {
        //     return {
        //         title: item.title,
        //         id: item.id,
        //         price: item.price,
        //         thumbnail: item.thumbnail,
        //         available: item.available
        //     };
        // });
        console.log(result[0].data)
        const data = result[0].data;

        res.status(200).json({ total, data });
    });
});

// // /////////// Пошук товару  на сторінці пошуку (повертає весь item) ///////////
app.get('/searchPage/:searchTerm', async (req, res) => {
    const searchTerm = req.params.searchTerm;
    const limit = 12;
    const skip = parseInt(req.query.skip) || 0;

    const titleQuery = { "title": { $regex: searchTerm, $options: "i" } };
    const idQuery = { "id": { $regex: searchTerm, $options: "i" } };

    try {

        const searchPipeline = [
            { $match: { $or: [titleQuery, idQuery] } }

        ];


        let brands = req.query.brend ? Array.isArray(req.query.brend) ? req.query.brend : [req.query.brend] : [];
        if (brands.length > 0) {
            searchPipeline.unshift({ $match: { "brend": { $in: brands } } });
        }


        const min = req.query.min ? parseInt(req.query.min) : null;
        const max = req.query.max ? parseInt(req.query.max) : null;
        if (min !== null) {
            searchPipeline.unshift({ $match: { "price": { $gte: min } } });
        }
        if (max !== null) {
            searchPipeline.unshift({ $match: { "price": { $lte: max } } });
        }


        const isAvailable = req.query.isAvailable ? req.query.isAvailable === 'true' : null;
        if (isAvailable !== null) {
            searchPipeline.unshift({ $match: { "available": isAvailable } });
        }


        const sortIndex = req.query.sortIndex === '1' ? 1 : req.query.sortIndex === '-1' ? -1 : null;
        if (sortIndex !== null) {
            searchPipeline.push({ $sort: { "price": sortIndex } });
        }

        let data = await db.collection('goods').aggregate(searchPipeline).toArray();
        const total = data.length;

        const limitedData = data.slice(skip * limit, skip === 0 ? limit : (skip + 1) * limit);


        res.status(200).json({ total, data: limitedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Упс... Щось пішло не так..." });
    }
});

const { uploadMultiple } = require("./multer");

app.post('/createnewgood', uploadMultiple, async (req, res) => {
    let good_id;
    let next_good_id;

    const categoryDetailsObject = JSON.parse(decodeURIComponent(req.body.category_details));
    const subCategoryDetailsObject = JSON.parse(decodeURIComponent(req.body.sub_category_detail));

    const { auth } = require('./config/firebase.config');

    try {
        const newGoodData = req.body;
        const imageURLs = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const fileName = `${newGoodData.title}/${Date.now()}_${file.originalname}`;
            const storageRef = ref(getStorage(), fileName);
            const metadata = {
                contentType: file.mimetype,
            };

            await uploadBytesResumable(storageRef, file.buffer, metadata);
            const downloadURL = await getDownloadURL(storageRef);
            imageURLs.push(downloadURL);
        }

        // if (imageURLs.length > 0) {
        //     const collection = db.collection("technicalInfo");
        //     const document = await collection.findOne({});
        //     good_id = document.next_good_id;
        //     next_good_id = document.next_good_id;

        //     const firstCharacter = next_good_id.charAt(0);
        //     const remainingCharacters = next_good_id.substring(1);
        //     const newNextGoodId = firstCharacter + (parseInt(remainingCharacters) + 1);

        //     // const result = await collection.updateOne(
        //     //     {},
        //     //     { $set: { next_good_id: newNextGoodId } }
        //     // );

        //     // const newGoodDataToPush = {
        //     //     id: good_id,
        //     //     title: newGoodData.title,
        //     //     price: parseInt(newGoodData.price),
        //     //     brend: newGoodData.brend,
        //     //     available: Boolean(newGoodData.available),
        //     //     description: newGoodData.description.slice(1, -1).split(", "),
        //     //     thumbnail: imageURLs[0].toString(),
        //     //     images: imageURLs.splice(1),
        //     //     category_details: {
        //     //         id: categoryDetailsObject.id.toString(),
        //     //         name: categoryDetailsObject.name
        //     //     },
        //     //     sub_category_detail: {
        //     //         id: subCategoryDetailsObject.id.toString(),
        //     //         name: subCategoryDetailsObject.name
        //     //     },
        //     //     seller_id: parseInt(newGoodData.seller_id),
        //     //     create_at: newGoodData.create_at,
        //     //     how_many_solds: parseInt(newGoodData.how_many_solds),
        //     // }

        //     const collectionToPush = db.collection('goods');
        //     const resultToPush = await collectionToPush.insertOne(newGoodDataToPush);

        //     res.status(200).json({ status: 'SUCCESS', id: good_id });
        // } else {
        //     res.status(500).json({ error: 'помилка 1 ' });
        // }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'помилка 2', errorDetails: error.message, error });
    }
});






