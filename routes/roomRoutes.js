const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', roomController.getRooms);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, roomController.createRoom);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, roomController.updateRoom);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, roomController.deleteRoom);

module.exports = router;