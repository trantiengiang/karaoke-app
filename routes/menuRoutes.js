const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', menuController.getMenuItems);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, menuController.createMenuItem);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, menuController.updateMenuItem);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, menuController.deleteMenuItem);

module.exports = router;