const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendBookingConfirmation = async (to, booking, room) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Xác nhận đặt phòng - Thiên Đường Karaoke',
        html: `
            <h2>Xác nhận đặt phòng</h2>
            <p>Cảm ơn bạn đã đặt phòng tại Thiên Đường Karaoke!</p>
            <p><strong>Phòng:</strong> ${room.name}</p>
            <p><strong>Thời gian bắt đầu:</strong> ${new Date(booking.startTime).toLocaleString('vi-VN')}</p>
            <p><strong>Thời gian kết thúc:</strong> ${new Date(booking.endTime).toLocaleString('vi-VN')}</p>
            <p><strong>Tổng giá:</strong> ${booking.totalPrice} VND</p>
            <p><strong>Phương thức thanh toán:</strong> ${booking.paymentMethod === 'at_counter' ? 'Tại quầy' : 'MoMo'}</p>
            <p>Vui lòng đến đúng giờ và thanh toán tại quầy nếu chọn phương thức "Tại quầy".</p>
        `
    };
    await transporter.sendMail(mailOptions);
};

const sendOrderConfirmation = async (to, order, items) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Xác nhận đơn hàng - Thiên Đường Karaoke',
        html: `
            <h2>Xác nhận đơn hàng</h2>
            <p>Cảm ơn bạn đã đặt món tại Thiên Đường Karaoke!</p>
            <h3>Chi tiết đơn hàng:</h3>
            <ul>
                ${items.map(item => `<li>${item.menuItemId.name} x ${item.quantity} - ${item.menuItemId.price * item.quantity} VND</li>`).join('')}
            </ul>
            <p><strong>Tổng giá:</strong> ${order.totalPrice} VND</p>
            <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cod' ? 'Khi nhận hàng' : 'MoMo'}</p>
            <p>Đơn hàng sẽ được giao sớm. Nếu chọn "Khi nhận hàng", vui lòng chuẩn bị tiền mặt.</p>
        `
    };
    await transporter.sendMail(mailOptions);
};

module.exports = { sendBookingConfirmation, sendOrderConfirmation };