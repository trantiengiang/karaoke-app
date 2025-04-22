const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const momoConfig = {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'YOUR_PARTNER_CODE',
    accessKey: process.env.MOMO_ACCESS_KEY || 'YOUR_ACCESS_KEY',
    secretKey: process.env.MOMO_SECRET_KEY || 'YOUR_SECRET_KEY',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    queryEndpoint: 'https://test-payment.momo.vn/v2/gateway/api/query',
    requestType: 'captureWallet'
};

exports.createOrder = async (req, res) => {
    try {
        const { items, paymentMethod } = req.body;
        console.log('Dữ liệu tạo đơn hàng:', { items, paymentMethod });

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Items là bắt buộc và phải là mảng không rỗng' });
        }

        if (!['cod', 'momo'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
        }

        let totalPrice = 0;
        for (const item of items) {
            if (!item.menuItemId || !item.quantity) {
                return res.status(400).json({ message: 'menuItemId và quantity là bắt buộc' });
            }

            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem) {
                return res.status(400).json({ message: `Món với ID ${item.menuItemId} không tồn tại` });
            }

            const price = Number(menuItem.price);
            const quantity = Number(item.quantity);

            if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ message: 'Giá hoặc số lượng không hợp lệ' });
            }

            totalPrice += price * quantity;
        }

        const order = new Order({
            userId: req.user.id,
            items,
            totalPrice,
            paymentMethod,
            paymentStatus: 'pending'
        });

        await order.save();

        if (paymentMethod === 'momo') {
            const paymentUrl = await createMomoPayment(order);
            return res.status(201).json({ paymentUrl });
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('Lỗi tạo đơn hàng:', error.message);
        res.status(400).json({ message: 'Lỗi tạo đơn hàng', error: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId')
            .populate('items.menuItemId');
        res.json(orders);
    } catch (error) {
        console.error('Lỗi lấy danh sách đơn hàng:', error.message);
        res.status(500).json({ message: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const updates = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Lỗi cập nhật đơn hàng:', error.message);
        res.status(400).json({ message: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        res.json({ message: 'Đã xoá đơn hàng thành công' });
    } catch (error) {
        console.error('Lỗi xoá đơn hàng:', error.message);
        res.status(400).json({ message: error.message });
    }
};

exports.handleMoMoIPN = async (req, res) => {
    try {
        const {
            partnerCode, orderId, requestId, amount, orderInfo,
            orderType, transId, resultCode, message, payType,
            responseTime, extraData, signature
        } = req.body;

        // Kiểm tra chữ ký từ MoMo
        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const expectedSignature = crypto.createHmac('sha256', momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Chữ ký MoMo không hợp lệ:', { received: signature, expected: expectedSignature });
            return res.status(400).json({ message: 'Chữ ký không hợp lệ' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        // Cập nhật trạng thái đơn hàng
        order.paymentStatus = resultCode === 0 ? 'completed' : 'failed';
        order.transactionId = transId;
        await order.save();

        console.log(`IPN processed for order ${orderId}: paymentStatus=${order.paymentStatus}`);

        res.status(200).json({ message: 'IPN processed successfully' });
    } catch (error) {
        console.error('Lỗi xử lý IPN MoMo:', error.message);
        res.status(400).json({ message: error.message });
    }
};

exports.checkMoMoPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.query;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        const requestId = `REQ-${Date.now()}`;
        const rawSignature = `accessKey=${momoConfig.accessKey}&orderId=${orderId}&partnerCode=${momoConfig.partnerCode}&requestId=${requestId}`;
        const signature = crypto.createHmac('sha256', momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode: momoConfig.partnerCode,
            requestId,
            orderId,
            signature,
            lang: 'vi'
        };

        const response = await axios.post(momoConfig.queryEndpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Phản hồi kiểm tra trạng thái từ MoMo:', response.data);

        if (response.data.resultCode === 0) {
            order.paymentStatus = 'completed';
            order.transactionId = response.data.transId;
            await order.save();
        } else {
            order.paymentStatus = 'failed';
            await order.save();
        }

        res.status(200).json({ paymentStatus: order.paymentStatus });
    } catch (error) {
        console.error('Lỗi kiểm tra trạng thái MoMo:', error.response ? error.response.data : error.message);
        res.status(400).json({ message: 'Lỗi kiểm tra trạng thái', error: error.response ? error.response.data : error.message });
    }
};

async function createMomoPayment(order) {
    try {
        console.log('Tạo thanh toán MoMo cho đơn hàng:', order._id);

        // Sử dụng Ngrok hoặc URL công khai thay vì localhost
        const redirectUrl = `http://localhost:5000/order/return?orderId=${order._id}`; // Cập nhật với Ngrok nếu cần
        const ipnUrl = `http://localhost:5000/api/orders/momo-ipn`; // Cập nhật với Ngrok nếu cần
        const orderInfo = `Thanh toán đơn hàng #${order._id}`;
        const amount = Math.round(order.totalPrice).toString();
        const orderId = order._id.toString();
        const requestId = `REQ-${Date.now()}`;
        const extraData = '';

        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;
        const signature = crypto.createHmac('sha256', momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode: momoConfig.partnerCode,
            accessKey: momoConfig.accessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            requestType: momoConfig.requestType,
            signature,
            extraData
        };

        console.log('Dữ liệu gửi đến MoMo:', requestBody);

        const response = await axios.post(momoConfig.endpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Phản hồi từ MoMo:', response.data);

        if (response.data.payUrl) {
            return response.data.payUrl;
        } else {
            throw new Error('Không nhận được payUrl từ MoMo');
        }
    } catch (error) {
        console.error('Lỗi khi tạo thanh toán MoMo:', error.response ? error.response.data : error.message);
        throw new Error('Lỗi tạo thanh toán MoMo: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
}