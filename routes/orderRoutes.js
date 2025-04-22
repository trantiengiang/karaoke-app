const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, orderController.getOrders);
router.post('/', authMiddleware.verifyToken, orderController.createOrder);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, orderController.updateOrder);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, orderController.deleteOrder);

module.exports = router;