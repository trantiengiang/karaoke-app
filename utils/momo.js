const crypto = require('crypto');
const axios = require('axios');

const createPaymentRequest = async (orderId, amount, orderInfo, redirectUrl, ipnUrl) => {
    const requestId = Date.now().toString();
    const extraData = ''; // Có thể truyền dữ liệu base64 nếu cần

    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${process.env.MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
    const signature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest('hex');

    const requestBody = {
        partnerCode: process.env.MOMO_PARTNER_CODE,
        partnerName: 'Thiên Đường Karaoke',
        storeId: 'KaraokeApp',
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: 'vi',
        requestType: 'captureWallet',
        autoCapture: true,
        extraData,
        signature
    };

    try {
        const response = await axios.post(`${process.env.MOMO_API_ENDPOINT}/create`, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Trả về URL để client redirect
        return response.data.payUrl;
    } catch (error) {
        console.error('MoMo API error:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = { createPaymentRequest };
