const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const menuRoutes = require('./routes/menuRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const orderRoutes = require('./routes/orderRoutes');

dotenv.config();
const app = express();

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

const optionalUpload = (req, res, next) => {
    console.log('Processing request:', req.method, req.url, req.headers['content-type']);
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        upload.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error('Multer error:', err);
                return res.status(400).json({ message: 'Lỗi khi tải tệp: ' + err.message });
            } else if (err) {
                console.error('File upload error:', err);
                return res.status(400).json({ message: 'Lỗi khi tải tệp: ' + err.message });
            }
            next();
        });
    } else {
        next();
    }
};

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', optionalUpload, roomRoutes);
app.use('/api/menu', optionalUpload, menuRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);

app.use(express.static('public'));

// Route để phục vụ trang order/return
app.get('/order/return', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route chỉ áp dụng cho GET
app.get('*', (req, res) => {
    console.log('Serving index.html for unmatched GET route:', req.url);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Xử lý các phương thức không phải GET (POST, PUT, DELETE, v.v.) nếu không có route khớp
app.use((req, res) => {
    res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
});

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));