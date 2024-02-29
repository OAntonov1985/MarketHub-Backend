const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
    const goods = [];
    db.collection('categories')
        .find()
        .toArray()
        .then((items) => {
            items.forEach((item) => goods.push(item));
            res.status(200).json(goods);
        })
        .catch((error) => {
            console.error("Error fetching categories:", error);
            res.status(500).json({ error: "Упс... Щось пішло не так..." });
        });
});

module.exports = router;