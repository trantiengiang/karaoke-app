const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { createMoMoPayment } = require('../utils/momo');
const { sendConfirmationEmail } = require('../utils/email');

exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'username email')
            .populate('roomId', 'name pricePerHour');
        res.json(bookings);
    } catch (err) {
        console.error('Get bookings error:', err);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách đặt phòng: ' + err.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        console.log('Create booking request:', req.body);
        const { roomId, startTime, endTime, paymentMethod } = req.body;
        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }
        const room = await Room.findById(roomId);
        if (!room || room.status !== 'available') {
            return res.status(400).json({ message: 'Phòng không tồn tại hoặc đã được đặt' });
        }
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (start >= end) {
            return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
        }
        const hours = (end - start) / (1000 * 60 * 60);
        const totalPrice = hours * room.pricePerHour;
        const booking = new Booking({
            userId: req.user.id,
            roomId,
            startTime: start,
            endTime: end,
            totalPrice,
            paymentMethod,
            paymentStatus: paymentMethod === 'at_counter' ? 'pending' : 'pending'
        });
        await booking.save();
        room.status = 'booked';
        await room.save();
        if (paymentMethod === 'momo') {
            const paymentUrl = await createMoMoPayment({
                orderId: booking._id.toString(),
                amount: totalPrice,
                orderInfo: `Thanh toán đặt phòng ${room.name}`,
                returnUrl: 'http://localhost:5000/booking/return'
            });
            return res.json({ paymentUrl });
        }
        await sendConfirmationEmail(req.user.email, {
            bookingId: booking._id,
            roomName: room.name,
            startTime: start.toLocaleString('vi-VN'),
            endTime: end.toLocaleString('vi-VN'),
            totalPrice,
            paymentMethod
        });
        res.status(201).json(booking);
    } catch (err) {
        console.error('Create booking error:', err);
        res.status(500).json({ message: 'Lỗi khi tạo đặt phòng: ' + err.message });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
        }
        const room = await Room.findById(booking.roomId);
        if (room) {
            room.status = 'available';
            await room.save();
        }
        await Booking.deleteOne({ _id: req.params.id });
        res.json({ message: 'Hủy đặt phòng thành công' });
    } catch (err) {
        console.error('Delete booking error:', err);
        res.status(500).json({ message: 'Lỗi khi hủy đặt phòng: ' + err.message });
    }
};