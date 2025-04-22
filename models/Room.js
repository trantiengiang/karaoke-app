const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    pricePerHour: { type: Number, required: true },
    status: { type: String, enum: ['available', 'occupied'], default: 'available' },
    equipment: [{ type: String }],
    image: { type: String } // Đường dẫn đến hình ảnh
});

module.exports = mongoose.model('Room', roomSchema);