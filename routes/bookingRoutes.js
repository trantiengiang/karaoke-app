const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, bookingController.getBookings);
router.post('/', authMiddleware.verifyToken, bookingController.createBooking);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, bookingController.deleteBooking);

module.exports = router;