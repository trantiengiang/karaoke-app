const mongoose = require('mongoose');
const Room = require('../models/Room');
const MenuItem = require('../models/MenuItem');

mongoose.connect('mongodb://localhost:27017/karaoke', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('MongoDB connected');

    // Xóa dữ liệu cũ
    await Room.deleteMany({});
    await MenuItem.deleteMany({});

    // Thêm phòng mẫu
    const rooms = [
        { name: 'Phòng VIP 1', capacity: 10, pricePerHour: 20, status: 'available', equipment: ['Micro', 'Loa', 'TV'], image: '/uploads/room1.jpg' },
        { name: 'Phòng Tiêu chuẩn 1', capacity: 6, pricePerHour: 15, status: 'available', equipment: ['Micro', 'Loa'], image: '/uploads/room2.jpg' },
        { name: 'Phòng VIP 2', capacity: 12, pricePerHour: 25, status: 'occupied', equipment: ['Micro', 'Loa', 'Máy chiếu'], image: '/uploads/room3.jpg' }
    ];
    await Room.insertMany(rooms);

    // Thêm menu mẫu
    const menuItems = [
        { name: 'Coca', price: 2, category: 'drink', image: '/uploads/cola.jpg' },
        { name: 'Gà rán', price: 8, category: 'food', image: '/uploads/chicken.jpg' },
        { name: 'Bọc micro', price: 1, category: 'accessory', image: '/uploads/mic_cover.jpg' },
        { name: 'Bia', price: 3, category: 'drink', image: '/uploads/beer.jpg' },
        { name: 'Đĩa trái cây', price: 10, category: 'food', image: '/uploads/fruit.jpg' }
    ];
    await MenuItem.insertMany(menuItems);

    console.log('Data seeded');
    mongoose.connection.close();
}).catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
});