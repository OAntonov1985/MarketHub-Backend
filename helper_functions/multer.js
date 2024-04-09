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


// const uploadMultiple = multer({
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 1000000 },
//     fileFilter: function (req, file, cb) {
//         checkFileType(file, cb);
//     }
// }).array("images", 12); // Здесь "images" - это имя поля формы, в котором передаются файлы, а 12 - это максимальное количество файлов

// // Middleware для загрузки одного файла
// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 1000000 },
//     fileFilter: function (req, file, cb) {
//         checkFileType(file, cb);
//     }
// }).single("image");

// module.exports = { uploadMultiple, upload };
