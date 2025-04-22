const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email, role: 'user' });
        await user.save();
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { id: user._id, username, email, role: user.role } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Lỗi khi đăng ký: ' + err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
        }
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, username, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Lỗi khi đăng nhập: ' + err.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng: ' + err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        await user.save();
        res.json(user);
    } catch (err) {
        console.error('Update user error:', err);
        res.status(400).json({ message: 'Lỗi khi cập nhật người dùng: ' + err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        res.json({ message: 'Xóa người dùng thành công' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: 'Lỗi khi xóa người dùng: ' + err.message });
    }
};