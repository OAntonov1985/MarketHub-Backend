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

// app.get("/api/v1/books", async (req, res) => {
//     const { limit = 5, orderBy = "name", sortBy = "asc", keyword } = req.query;
//     let page = +req.query?.page;

//     if (!page || page <= 0) page = 1;

//     const skip = (page - 1) * + limit;

//     const query = {};

//     if (keyword) query.name = { $regex: keyword, $options: "i" };

//     const key = `Book::${JSON.stringify({ query, page, limit, orderBy, sortBy })}`
//     let response = null
//     try {
//         const cache = await redis.get(key)
//         if (cache) {
//             response = JSON.parse(cache)
//         } else {
//             const data = await BookModel.find(query)
//                 .skip(skip)
//                 .limit(limit)
//                 .sort({ [orderBy]: sortBy });
//             const totalItems = await BookModel.countDocuments(query);

//             response = {
//                 msg: "Ok",
//                 data,
//                 totalItems,
//                 totalPages: Math.ceil(totalItems / limit),
//                 limit: +limit,
//                 currentPage: page,
//             }

//             redis.setex(key, 600, JSON.stringify(response))
//         }

//         return res.status(200).json(response);
//     } catch (error) {
//         return res.status(500).json({
//             msg: error.message,
//         });
//     }
// });

// app.get("/api/v1/books/:id", async (req, res) => {
//     try {
//         const data = await BookModel.findById(req.params.id);

//         if (data) {
//             return res.status(200).json({
//                 msg: "Ok",
//                 data,
//             });
//         }

//         return res.status(404).json({
//             msg: "Not Found",
//         });
//     } catch (error) {
//         return res.status(500).json({
//             msg: error.message,
//         });
//     }
// });

// app.post("/api/v1/books", async (req, res) => {
//     try {
//         const { name, author, price, description } = req.body;
//         const book = new BookModel({
//             name,
//             author,
//             price,
//             description,
//         });
//         const data = await book.save();
//         deleteKeys('Book')
//         return res.status(200).json({
//             msg: "Ok",
//             data,
//         });
//     } catch (error) {
//         return res.status(500).json({
//             msg: error.message,
//         });
//     }
// });

// app.put("/api/v1/books/:id", async (req, res) => {
//     try {
//         const { name, author, price, description } = req.body;
//         const { id } = req.params;

//         const data = await BookModel.findByIdAndUpdate(
//             id,
//             {
//                 name,
//                 author,
//                 price,
//                 description,
//             },
//             { new: true }
//         );
//         deleteKeys('Book')
//         return res.status(200).json({
//             msg: "Ok",
//             data,
//         });
//     } catch (error) {
//         return res.status(500).json({
//             msg: error.message,
//         });
//     }
// });

// app.delete("/api/v1/books/:id", async (req, res) => {
//     try {
//         await BookModel.findByIdAndDelete(req.params.id);
//         deleteKeys('Book')
//         return res.status(200).json({
//             msg: "Ok",
//         });
//     } catch (error) {
//         return res.status(500).json({
//             msg: error.message,
//         });
//     }
// });

