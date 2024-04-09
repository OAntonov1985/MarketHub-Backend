// const multer = require("multer");
// const path = require("path");

// // Функция для проверки типа файла
// function checkFileType(file, cb) {
//     const fileTypes = /jpeg|jpg|png|gif/;
//     const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimeType = fileTypes.test(file.mimetype);

//     if (mimeType && extName) {
//         return cb(null, true);
//     } else {
//         cb("Error: Images Only !!!");
//     }
// }

// // Функция для загрузки нескольких файлов
// function uploadMultiple(req, res, next) {
//     const storage = multer.memoryStorage();
//     const upload = multer({
//         storage: storage,
//         limits: { fileSize: 5000000 },
//         fileFilter: function (req, file, cb) {
//             checkFileType(file, cb);
//         }
//     }).array("images", 12); // Здесь "images" - это имя поля формы, в котором передаются файлы, а 12 - это максимальное количество файлов

//     upload(req, res, function (err) {
//         if (err instanceof multer.MulterError) {
//             return res.status(400).json({ error: 'Failed to upload images' });
//         } else if (err) {
//             return res.status(500).json({ error: 'Failed to upload images' });
//         }
//         next();
//     });
// }

// module.exports = { uploadMultiple };
