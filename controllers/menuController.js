const MenuItem = require('../models/MenuItem');

exports.getMenuItems = async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (err) {
        console.error('Get menu items error:', err.message);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách món: ' + err.message });
    }
};

exports.createMenuItem = async (req, res) => {
    try {
        console.log('Create menu item request:', req.body, req.file);
        const { name, price, description, category } = req.body;
        if (!name || !price || !category) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: name, price, category' });
        }
        if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return res.status(400).json({ message: 'Giá phải là số dương' });
        }
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || null;
        const menuItem = new MenuItem({
            name,
            price: parseFloat(price),
            description,
            category,
            image
        });
        const newMenuItem = await menuItem.save();
        res.status(201).json(newMenuItem);
    } catch (err) {
        console.error('Create menu item error:', err.message);
        res.status(400).json({ message: 'Lỗi khi tạo món: ' + err.message });
    }
};

exports.updateMenuItem = async (req, res) => {
    try {
        console.log('Update menu item request:', req.body, req.file);
        const { name, price, description, category } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Món không tồn tại' });
        menuItem.name = name || menuItem.name;
        menuItem.price = price ? parseFloat(price) : menuItem.price;
        menuItem.description = description !== undefined ? description : menuItem.description;
        menuItem.category = category || menuItem.category;
        menuItem.image = image || menuItem.image;
        if (price && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
            return res.status(400).json({ message: 'Giá phải là số dương' });
        }
        const updatedMenuItem = await menuItem.save();
        res.json(updatedMenuItem);
    } catch (err) {
        console.error('Update menu item error:', err.message);
        res.status(400).json({ message: 'Lỗi khi cập nhật món: ' + err.message });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Món không tồn tại' });
        res.json({ message: 'Xóa món thành công' });
    } catch (err) {
        console.error('Delete menu item error:', err.message);
        res.status(500).json({ message: 'Lỗi khi xóa món: ' + err.message });
    }
};