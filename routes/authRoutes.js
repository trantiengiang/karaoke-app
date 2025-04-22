const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/users', authMiddleware.verifyToken, authMiddleware.isAdmin, authController.getUsers);
router.put('/users/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, authController.updateUser);
router.delete('/users/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, authController.deleteUser);

module.exports = router;