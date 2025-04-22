const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        if (!file || !file.originalname) {
            return cb(new Error('No file provided'));
        }
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file) {
            return cb(null, false);
        }
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file JPEG hoặc PNG'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', roomController.getRooms);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('image'), roomController.createRoom);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('image'), roomController.updateRoom);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, roomController.deleteRoom);

module.exports = router;