const express = require("express");
const { connectToDb, getDb } = require('./db');
const cors = require("cors");
require('dotenv').config()
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage');
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");


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
        .sort({ "created_at": -1 })
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


app.post('/createnewgood', async (req, res) => {
    let good_id;
    let next_good_id;

    try {
        const newGoodData = req.body;

        if (newGoodData && Object.keys(newGoodData).length > 0) {
            const requiredFields = ['title', 'price', 'brend', 'available', 'description', 'images', 'category_details', 'sub_category_detail', 'seller_id', 'create_at', 'how_many_solds'];

            const missingFields = requiredFields.filter(field => !newGoodData.hasOwnProperty(field));

            if (missingFields.length > 0) {
                return res.status(400).json({ error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}` });
            }

            const collection = db.collection("technicalInfo");
            const document = await collection.findOne({});
            good_id = document.next_good_id;
            next_good_id = document.next_good_id;

            const firstPart = next_good_id.substring(0, 2);
            const secondPart = next_good_id.substring(2);
            const newSecondPart = (parseInt(secondPart) + 1).toString();

            const newNextGoodId = firstPart + newSecondPart;


            const result = await collection.updateOne(
                {},
                { $set: { next_good_id: newNextGoodId } }
            );

            const newGoodDataToPush = {
                id: next_good_id,
                title: newGoodData.title,
                price: parseInt(newGoodData.price),
                brend: newGoodData.brend,
                available: Boolean(newGoodData.available),
                description: newGoodData.description,
                thumbnail: newGoodData.thumbnail,
                images: newGoodData.images,
                category_details: {
                    id: newGoodData.category_details.id,
                    name: newGoodData.category_details.name
                },
                sub_category_detail: {
                    id: newGoodData.sub_category_detail.id,
                    name: newGoodData.sub_category_detail.name
                },
                seller_id: parseInt(newGoodData.seller_id),
                create_at: newGoodData.create_at,
                how_many_solds: parseInt(newGoodData.how_many_solds),
            };

            const collectionToPush = db.collection('goods');
            const resultToPush = await collectionToPush.insertOne(newGoodDataToPush);

            res.status(200).json({ status: 'SUCCESS', id: next_good_id });
        } else {
            res.status(400).json({ error: "Данные отсутствуют" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Произошла ошибка при добавлении товара', errorDetails: error.message });
    }
});


app.get('/imagelist/:id', (req, res) => {
    const goodId = req.params.id;

    db.collection('goods')
        .findOne({ id: goodId })
        .then((result) => {
            if (!result) {
                res.status(404).json({ error: "Товар не найден" });
                return;
            }

            const { thumbnail, images } = result;
            const responseData = [thumbnail, ...images];

            res.status(200).json(responseData);
        })
        .catch((error) => {
            console.error("Упс. щось пішло не так. Зверніться до розробників:");
            res.status(500).json({ error: "Упс... Щось пішло не так..." });
        });
});


app.post('/createNewUser', async (req, res) => {
    const { email, name, surname, pfone, password } = req.body;

    try {
        const userExists = await db.collection('users').findOne({ email });
        if (userExists) {
            res.status(400).json({ error: "Користувач з такою поштобю вже існує" });
            return;
        }

        const techInfo = await db.collection('technicalInfo').findOne({});
        if (!techInfo || techInfo.next_user_id == null) {
            res.status(500).json({ error: "Упс... Щось пішло не так. Зверніться до розробників" });
            return;
        }

        const nextUserId = techInfo.next_user_id + 1;
        await db.collection('technicalInfo').updateOne({}, { $set: { next_user_id: nextUserId } });

        const newUser = {
            id: techInfo.next_user_id,
            name,
            surname,
            nameAs: {
                nameAs: name,
                surnameAs: surname
            },
            email,
            userOrders: {},
            userProductsToSale: {},
            pfone,
            password
        };

        await db.collection('users').insertOne(newUser);

        res.status(201).json({ message: "Користувача успішно додано", user: { email, password } });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ error: "Помилка при створенні користувача" });
    }
});


app.post('/newOrder', async (req, res) => {
    const { userInfo, userBuyingGoods, userAdress, sellersIDArray } = req.body;

    try {
        const techInfo = await db.collection('technicalInfo').findOne({});
        if (!techInfo || techInfo.next_order_number == null) {
            return res.status(500).json({ error: "Упс... Щось пішло не так. Зверніться до розробників" });
        }

        const nextOrderNumber = techInfo.next_order_number;

        const updatePromises = sellersIDArray.map(async (searchingUser, index) => {
            const userExists = await db.collection('users').findOne({ id: searchingUser });
            if (userExists) {
                const orderNum = nextOrderNumber + index;
                const actualUserOrderGood = [];
                userBuyingGoods.forEach(item => {
                    if (item.seller_id === searchingUser) {
                        actualUserOrderGood.push(item)
                    }
                })
                const newOrder = {
                    orderNum,
                    userInfo,
                    userAdress,
                    actualUserOrderGood
                };

                const updateResult = await db.collection('users').updateOne(
                    { id: searchingUser },
                    { $push: { userOrders: newOrder } }
                );

                if (updateResult.modifiedCount > 0) {
                    return { success: true, message: 'Ваше замовлення додано успішно' };
                } else {
                    return { success: false, message: 'Помилка при створенні замовлення' };
                }
            } else {
                return { success: false, message: 'Користувача не знайдено. Зверніться до розробників' };
            }
        });

        await db.collection('technicalInfo').updateOne({}, { $set: { next_order_number: nextOrderNumber + sellersIDArray.length } });

        const results = await Promise.all(updatePromises);

        const errors = results.filter(result => !result.success);
        if (errors.length > 0) {
            console.error('Помилка при опрацюванні замовлення:', errors);
            return res.status(500).json({ error: 'Помилка при створенні замовлення', details: errors });
        }

        return res.status(201).json({ message: "Ваше замовлення успішно створене" });
    } catch (error) {
        console.error('Error creating new order:', error);
        return res.status(500).json({ error: "Помилка при створенні замовлення" });
    }
});









