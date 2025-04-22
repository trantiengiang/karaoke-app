const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['food', 'drink', 'accessory'], required: true },
    image: { type: String } // Đường dẫn đến hình ảnh
});

module.exports = mongoose.model('MenuItem', menuItemSchema);