const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        console.error('Get rooms error:', err);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách phòng: ' + err.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        console.log('Create room request:', { body: req.body, file: req.file });
        const { name, capacity, pricePerHour, equipment } = req.body;

        if (!name || !capacity || !pricePerHour) {
            return res.status(400).json({ message: 'Tên, sức chứa và giá mỗi giờ là bắt buộc' });
        }

        const parsedCapacity = parseInt(capacity);
        const parsedPricePerHour = parseFloat(pricePerHour);

        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({ message: 'Sức chứa phải là số dương' });
        }
        if (isNaN(parsedPricePerHour) || parsedPricePerHour <= 0) {
            return res.status(400).json({ message: 'Giá mỗi giờ phải là số dương' });
        }

        const room = new Room({
            name,
            capacity: parsedCapacity,
            pricePerHour: parsedPricePerHour,
            equipment: equipment ? equipment.split(',').map(e => e.trim()) : [],
            image: req.file ? `/uploads/${req.file.filename}` : null,
            status: 'available'
        });

        await room.save();
        res.status(201).json(room);
    } catch (err) {
        console.error('Create room error:', err);
        res.status(500).json({ message: 'Lỗi khi tạo phòng: ' + err.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        console.log('Update room request:', { body: req.body, file: req.file });
        const { name, capacity, pricePerHour, equipment, existingImage } = req.body;

        if (!name || !capacity || !pricePerHour) {
            return res.status(400).json({ message: 'Tên, sức chứa và giá mỗi giờ là bắt buộc' });
        }

        const parsedCapacity = parseInt(capacity);
        const parsedPricePerHour = parseFloat(pricePerHour);

        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({ message: 'Sức chứa phải là số dương' });
        }
        if (isNaN(parsedPricePerHour) || parsedPricePerHour <= 0) {
            return res.status(400).json({ message: 'Giá mỗi giờ phải là số dương' });
        }

        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Phòng không tồn tại' });
        }

        room.name = name;
        room.capacity = parsedCapacity;
        room.pricePerHour = parsedPricePerHour;
        room.equipment = equipment ? equipment.split(',').map(e => e.trim()) : room.equipment;
        room.image = req.file ? `/uploads/${req.file.filename}` : (existingImage || room.image);

        await room.save();
        res.json(room);
    } catch (err) {
        console.error('Update room error:', err);
        res.status(500).json({ message: 'Lỗi khi cập nhật phòng: ' + err.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Phòng không tồn tại' });
        }
        res.json({ message: 'Xóa phòng thành công' });
    } catch (err) {
        console.error('Delete room error:', err);
        res.status(500).json({ message: 'Lỗi khi xóa phòng: ' + err.message });
    }
};