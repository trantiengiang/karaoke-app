const { useState, useEffect } = React;

const App = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <div className="container">
            <header>
                <h1>Thiên Đường Karaoke</h1>
                <p>Đặt phòng và tận hưởng trải nghiệm karaoke tuyệt vời!</p>
            </header>
            <nav>
                <a href="/">Trang chủ</a>
                <a href="/rooms">Phòng</a>
                {user && <a href="/booking">Đặt phòng</a>}
                {user && <a href="/order">Đặt món</a>}
                {user && user.role === 'admin' && <a href="/admin">Quản lý</a>}
                {user && user.role === 'admin' && <a href="/user-management">Quản lý người dùng</a>}
                {!user ? (
                    <>
                        <a href="/login">Đăng nhập</a>
                        <a href="/register">Đăng ký</a>
                    </>
                ) : (
                    <button onClick={logout}>Đăng xuất ({user.username})</button>
                )}
            </nav>
            <Router setUser={setUser} />
        </div>
    );
};

const Router = ({ setUser }) => {
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const onPopState = () => setPath(window.location.pathname);
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const navigate = (url) => {
        window.history.pushState({}, '', url);
        setPath(url);
    };

    return (
        <>
            {path === '/' && <Home />}
            {path === '/rooms' && <Rooms navigate={navigate} />}
            {path === '/booking' && <Booking navigate={navigate} />}
            {path === '/order' && <Order navigate={navigate} />}
            {path === '/login' && <LoginPage navigate={navigate} setUser={setUser} />}
            {path === '/register' && <RegisterPage navigate={navigate} setUser={setUser} />}
            {path === '/admin' && <AdminPage navigate={navigate} />}
            {path === '/user-management' && <UserManagementPage navigate={navigate} />}
            {path === '/booking/return' && <BookingReturn navigate={navigate} />}
            {path === '/order/return' && <OrderReturn navigate={navigate} />}
        </>
    );
};

const Home = () => (
    <div>
        <h2>Chào mừng đến với Thiên Đường Karaoke</h2>
        <p>Thưởng thức niềm vui karaoke đỉnh cao với các phòng hiện đại, đồ ăn ngon và đồ uống tươi mát. Đặt ngay để hát hết mình!</p>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/rooms" style={{ padding: '10px 20px', background: '#ff6b6b', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
                Khám phá các phòng
            </a>
        </div>
    </div>
);

const Rooms = ({ navigate }) => {
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        fetch('/api/rooms')
            .then(res => res.json())
            .then(data => {
                console.log('Dữ liệu phòng:', data);
                setRooms(data);
            })
            .catch(err => console.error('Lỗi khi tải danh sách phòng:', err));
    }, []);

    return (
        <div>
            <h2>Danh sách phòng</h2>
            <div className="room-list">
                {rooms.length === 0 ? (
                    <p>Không có phòng nào</p>
                ) : (
                    rooms.map(room => (
                        <div key={room._id} className="room-card">
                            {room.image && <img src={room.image} alt={room.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
                            <h3>{room.name}</h3>
                            <p>Sức chứa: {room.capacity} người</p>
                            <p>Giá: ${room.pricePerHour}/giờ</p>
                            <p>Trạng thái: {room.status === 'available' ? 'Còn trống' : 'Đã đặt'}</p>
                            <p>Thiết bị: {room.equipment.join(', ') || 'Không có'}</p>
                            {room.status === 'available' && (
                                <button onClick={() => navigate('/booking')}>Đặt ngay</button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const Booking = ({ navigate }) => {
    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState({ roomId: '', startTime: '', endTime: '', paymentMethod: 'at_counter' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/rooms')
            .then(res => res.json())
            .then(data => {
                console.log('Dữ liệu phòng khả dụng:', data);
                setRooms(data.filter(r => r.status === 'available'));
            })
            .catch(err => console.error('Lỗi khi tải danh sách phòng:', err));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Vui lòng đăng nhập trước khi đặt phòng');
            navigate('/login');
            return;
        }
        if (!form.roomId || !form.startTime || !form.endTime) {
            setError('Vui lòng nhập đầy đủ thông tin đặt phòng');
            return;
        }
        const start = new Date(form.startTime);
        const end = new Date(form.endTime);
        if (start >= end) {
            setError('Thời gian kết thúc phải sau thời gian bắt đầu');
            return;
        }
        console.log('Gửi yêu cầu đặt phòng:', { token, form });
        fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(form)
        })
            .then(res => {
                console.log('Phản hồi từ API bookings:', res.status, res.statusText);
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi bookings:', data);
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else if (data._id) {
                    alert('Đặt phòng thành công! Vui lòng kiểm tra email xác nhận.');
                    navigate('/rooms');
                } else {
                    setError(data.message || 'Lỗi khi đặt phòng');
                }
            })
            .catch(err => {
                console.error('Lỗi khi gửi yêu cầu:', err);
                setError('Lỗi khi đặt phòng: ' + err.message);
            });
    };

    return (
        <div className="form-container">
            <h2>Đặt phòng</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <select
                    value={form.roomId}
                    onChange={e => setForm({ ...form, roomId: e.target.value })}
                    required
                >
                    <option value="">Chọn phòng</option>
                    {rooms.map(room => (
                        <option key={room._id} value={room._id}>{room.name} (${room.pricePerHour}/giờ)</option>
                    ))}
                </select>
                <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    required
                    placeholder="Thời gian bắt đầu"
                />
                <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    required
                    placeholder="Thời gian kết thúc"
                />
                <select
                    value={form.paymentMethod}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                >
                    <option value="at_counter">Tại quầy</option>
                    <option value="momo">MoMo</option>
                </select>
                <button type="submit">Đặt ngay</button>
            </form>
        </div>
    );
};

const Order = ({ navigate }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/menu')
            .then(res => res.json())
            .then(data => {
                console.log('Dữ liệu menu:', data);
                setMenuItems(data);
            })
            .catch(err => console.error('Lỗi khi tải menu:', err));
    }, []);

    const addToCart = (item) => {
        const existingItem = cart.find(cartItem => cartItem.menuItemId === item._id);
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.menuItemId === item._id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, { menuItemId: item._id, quantity: 1 }]);
        }
    };

    const removeFromCart = (menuItemId) => {
        setCart(cart.filter(item => item.menuItemId !== menuItemId));
    };

    const handleOrder = () => {
        if (cart.length === 0) {
            setError('Giỏ hàng trống');
            return;
        }
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Vui lòng đăng nhập trước khi đặt món');
            navigate('/login');
            return;
        }
        const payload = { items: cart, paymentMethod };
        console.log('Gửi yêu cầu đặt món:', { token, payload });
        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
            .then(res => {
                console.log('Phản hồi từ API orders:', res.status, res.statusText);
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi orders:', data);
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else if (data._id) {
                    alert('Đặt món thành công! Vui lòng kiểm tra email xác nhận.');
                    setCart([]);
                    navigate('/rooms');
                } else {
                    setError(data.message || 'Lỗi khi đặt món');
                }
            })
            .catch(err => {
                console.error('Lỗi khi gửi yêu cầu:', err);
                setError('Lỗi khi đặt món: ' + err.message);
            });
    };

    return (
        <div>
            <h2>Menu</h2>
            <div className="menu-list">
                {menuItems.length === 0 ? (
                    <p>Không có món nào</p>
                ) : (
                    menuItems.map(item => (
                        <div key={item._id} className="menu-card">
                            {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
                            <h3>{item.name}</h3>
                            <p>Giá: ${item.price}</p>
                            <p>Danh mục: {item.category === 'food' ? 'Đồ ăn' : item.category === 'drink' ? 'Đồ uống' : 'Phụ kiện'}</p>
                            <button onClick={() => addToCart(item)}>Thêm vào giỏ</button>
                        </div>
                    ))
                )}
            </div>
            {cart.length > 0 && (
                <div className="cart-container">
                    <h3>Giỏ hàng của bạn</h3>
                    {error && <p className="error-message">{error}</p>}
                    <OrderSummary items={cart} menuItems={menuItems} removeFromCart={removeFromCart} />
                    <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        style={{ margin: '10px 0', padding: '10px', width: '100%' }}
                    >
                        <option value="cod">Khi nhận hàng</option>
                        <option value="momo">MoMo</option>
                    </select>
                    <button onClick={handleOrder}>Đặt món</button>
                </div>
            )}
        </div>
    );
};

const OrderSummary = ({ items, menuItems, removeFromCart }) => {
    const total = items.reduce((sum, item) => {
        const menuItem = menuItems.find(m => m._id === item.menuItemId);
        return sum + (menuItem ? menuItem.price * item.quantity : 0);
    }, 0);

    return (
        <div>
            {items.map((item, index) => {
                const menuItem = menuItems.find(m => m._id === item.menuItemId);
                return (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
                        <span>{menuItem?.name} x {item.quantity}</span>
                        <span>${menuItem?.price * item.quantity}</span>
                        <button onClick={() => removeFromCart(item.menuItemId)} style={{ background: '#e55a5a' }}>
                            Xóa
                        </button>
                    </div>
                );
            })}
            <h4>Tổng cộng: ${total}</h4>
        </div>
    );
};

const BookingReturn = ({ navigate }) => {
    useEffect(() => {
        alert('Thanh toán hoàn tất! Vui lòng kiểm tra email xác nhận.');
        navigate('/rooms');
    }, [navigate]);
    return <div>Đang xử lý...</div>;
};

const OrderReturn = ({ navigate }) => {
    const [status, setStatus] = useState('Đang xử lý...');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');

        if (orderId) {
            fetch(`/api/orders/check-payment-status?orderId=${orderId}`)
                .then(res => {
                    if (!res.ok) {
                        return res.text().then(text => {
                            console.error('Phản hồi không phải JSON:', text);
                            throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.paymentStatus === 'completed') {
                        alert('Thanh toán thành công! Vui lòng kiểm tra email xác nhận.');
                        setStatus('Thanh toán thành công!');
                    } else {
                        alert('Thanh toán thất bại. Vui lòng thử lại.');
                        setStatus('Thanh toán thất bại.');
                    }
                    setTimeout(() => navigate('/rooms'), 2000);
                })
                .catch(err => {
                    console.error('Lỗi kiểm tra trạng thái:', err);
                    setStatus('Lỗi khi kiểm tra trạng thái.');
                    setTimeout(() => navigate('/rooms'), 2000);
                });
        } else {
            setStatus('Không tìm thấy đơn hàng.');
            setTimeout(() => navigate('/rooms'), 2000);
        }
    }, [navigate]);

    return <div>{status}</div>;
};

const LoginPage = ({ navigate, setUser }) => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!form.username || !form.password) {
            setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
            return;
        }
        console.log('Gửi yêu cầu đăng nhập:', form);
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })
            .then(res => {
                console.log('Phản hồi đăng nhập:', res.status, res.statusText);
                if (res.status === 401) {
                    throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
                }
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu đăng nhập:', data);
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setUser(data.user);
                    navigate('/');
                } else {
                    setError(data.message || 'Lỗi khi đăng nhập');
                }
            })
            .catch(err => {
                console.error('Lỗi đăng nhập:', err);
                setError(err.message || 'Lỗi khi đăng nhập');
            });
    };

    return (
        <div className="form-container">
            <h2>Đăng nhập</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                />
                <button type="submit">Đăng nhập</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
                Chưa có tài khoản? <a href="/register">Đăng ký</a>
            </p>
        </div>
    );
};

const RegisterPage = ({ navigate, setUser }) => {
    const [form, setForm] = useState({ username: '', password: '', email: '' });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!form.username || !form.password || !form.email) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(form.email)) {
            setError('Email không hợp lệ');
            return;
        }
        console.log('Gửi yêu cầu đăng ký:', form);
        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })
            .then(res => {
                console.log('Phản hồi đăng ký:', res.status, res.statusText);
                if (res.status === 400) {
                    throw new Error('Tên đăng nhập hoặc email đã tồn tại');
                }
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu đăng ký:', data);
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setUser(data.user);
                    navigate('/');
                } else {
                    setError(data.message || 'Lỗi khi đăng ký');
                }
            })
            .catch(err => {
                console.error('Lỗi đăng ký:', err);
                setError(err.message || 'Lỗi khi đăng ký');
            });
    };

    return (
        <div className="form-container">
            <h2>Đăng ký</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                />
                <button type="submit">Đăng ký</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
                Đã có tài khoản? <a href="/login">Đăng nhập</a>
            </p>
        </div>
    );
};

const AdminPage = ({ navigate }) => {
    const [rooms, setRooms] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [roomForm, setRoomForm] = useState({ id: '', name: '', capacity: '', pricePerHour: '', equipment: '', image: null });
    const [menuForm, setMenuForm] = useState({ id: '', name: '', price: '', category: 'food', description: '', image: null });
    const [error, setError] = useState('');
    const [isEditingRoom, setIsEditingRoom] = useState(false);
    const [isEditingMenu, setIsEditingMenu] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetch('/api/rooms', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                console.log('Dữ liệu phòng:', data);
                setRooms(data);
            })
            .catch(err => setError('Lỗi khi tải danh sách phòng: ' + err.message));
        fetch('/api/menu', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                console.log('Dữ liệu menu:', data);
                setMenuItems(data);
            })
            .catch(err => setError('Lỗi khi tải menu: ' + err.message));
        fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                console.log('Dữ liệu đặt phòng:', data);
                setBookings(data);
            })
            .catch(err => setError('Lỗi khi tải danh sách đặt phòng: ' + err.message));
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                console.log('Dữ liệu đơn hàng:', data);
                setOrders(data);
            })
            .catch(err => setError('Lỗi khi tải danh sách đơn hàng: ' + err.message));
    }, [navigate]);

    const handleRoomSubmit = (e) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (!roomForm.name || !roomForm.capacity || !roomForm.pricePerHour) {
            setError('Vui lòng nhập đầy đủ tên, sức chứa và giá mỗi giờ');
            return;
        }
        if (isNaN(parseInt(roomForm.capacity)) || parseInt(roomForm.capacity) <= 0) {
            setError('Sức chứa phải là số dương');
            return;
        }
        if (isNaN(parseFloat(roomForm.pricePerHour)) || parseFloat(roomForm.pricePerHour) <= 0) {
            setError('Giá mỗi giờ phải là số dương');
            return;
        }
        const formData = new FormData();
        formData.append('name', roomForm.name);
        formData.append('capacity', roomForm.capacity);
        formData.append('pricePerHour', roomForm.pricePerHour);
        formData.append('equipment', roomForm.equipment);
        if (roomForm.image instanceof File) {
            formData.append('image', roomForm.image);
        } else if (roomForm.image && isEditingRoom) {
            formData.append('existingImage', roomForm.image);
        }
        console.log('Gửi dữ liệu phòng:', {
            name: roomForm.name,
            capacity: roomForm.capacity,
            pricePerHour: roomForm.pricePerHour,
            equipment: roomForm.equipment,
            image: roomForm.image ? roomForm.image.name || roomForm.image : null
        });
        const url = isEditingRoom ? `/api/rooms/${roomForm.id}` : '/api/rooms';
        const method = isEditingRoom ? 'PUT' : 'POST';
        fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
            .then(res => {
                console.log('Phản hồi từ API rooms:', res.status, res.statusText);
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi rooms:', data);
                if (data._id) {
                    if (isEditingRoom) {
                        setRooms(rooms.map(room => (room._id === data._id ? data : room)));
                    } else {
                        setRooms([...rooms, data]);
                    }
                    setRoomForm({ id: '', name: '', capacity: '', pricePerHour: '', equipment: '', image: null });
                    setIsEditingRoom(false);
                    alert(isEditingRoom ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!');
                } else {
                    setError(data.message || 'Lỗi khi lưu phòng');
                }
            })
            .catch(err => {
                console.error('Lỗi khi lưu phòng:', err);
                setError('Lỗi khi lưu phòng: ' + err.message);
            });
    };

    const handleMenuSubmit = (e) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (!menuForm.name || !menuForm.price || !menuForm.category) {
            setError('Vui lòng nhập đầy đủ tên, giá và danh mục');
            return;
        }
        if (isNaN(parseFloat(menuForm.price)) || parseFloat(menuForm.price) <= 0) {
            setError('Giá phải là số dương');
            return;
        }
        const formData = new FormData();
        formData.append('name', menuForm.name);
        formData.append('price', menuForm.price);
        formData.append('category', menuForm.category);
        if (menuForm.description) formData.append('description', menuForm.description);
        if (menuForm.image instanceof File) {
            formData.append('image', menuForm.image);
        } else if (menuForm.image && isEditingMenu) {
            formData.append('existingImage', menuForm.image);
        }
        console.log('Gửi dữ liệu món:', {
            name: menuForm.name,
            price: menuForm.price,
            category: menuForm.category,
            description: menuForm.description,
            image: menuForm.image ? menuForm.image.name || menuForm.image : null
        });
        const url = isEditingMenu ? `/api/menu/${menuForm.id}` : '/api/menu';
        const method = isEditingMenu ? 'PUT' : 'POST';
        fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
            .then(res => {
                console.log('Phản hồi từ API menu:', res.status, res.statusText);
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi menu:', data);
                if (data._id) {
                    if (isEditingMenu) {
                        setMenuItems(menuItems.map(item => (item._id === data._id ? data : item)));
                    } else {
                        setMenuItems([...menuItems, data]);
                    }
                    setMenuForm({ id: '', name: '', price: '', category: 'food', description: '', image: null });
                    setIsEditingMenu(false);
                    alert(isEditingMenu ? 'Cập nhật món thành công!' : 'Thêm món thành công!');
                } else {
                    setError(data.message || 'Lỗi khi lưu món');
                }
            })
            .catch(err => {
                console.error('Lỗi khi lưu món:', err);
                setError('Lỗi khi lưu món: ' + err.message);
            });
    };

    const editRoom = (room) => {
        setRoomForm({
            id: room._id,
            name: room.name,
            capacity: room.capacity,
            pricePerHour: room.pricePerHour,
            equipment: room.equipment.join(', '),
            image: room.image
        });
        setIsEditingRoom(true);
    };

    const editMenuItem = (item) => {
        setMenuForm({
            id: item._id,
            name: item.name,
            price: item.price,
            category: item.category,
            description: item.description || '',
            image: item.image
        });
        setIsEditingMenu(true);
    };

    const deleteRoom = (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetch(`/api/rooms/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                console.log('Phản hồi từ API delete room:', res.status, res.statusText);
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi delete room:', data);
                setRooms(rooms.filter(room => room._id !== id));
                alert('Xóa phòng thành công!');
            })
            .catch(err => {
                console.error('Lỗi khi xóa phòng:', err);
                setError('Lỗi khi xóa phòng: ' + err.message);
            });
    };

    const deleteMenuItem = (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetch(`/api/menu/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                console.log('Phản hồi từ API delete menu:', res.status, res.statusText);
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi delete menu:', data);
                setMenuItems(menuItems.filter(item => item._id !== id));
                alert('Xóa món thành công!');
            })
            .catch(err => {
                console.error('Lỗi khi xóa món:', err);
                setError('Lỗi khi xóa món: ' + err.message);
            });
    };

    const cancelBooking = (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetch(`/api/bookings/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                console.log('Phản hồi từ API cancel booking:', res.status, res.statusText);
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi cancel booking:', data);
                setBookings(bookings.filter(booking => booking._id !== id));
                alert('Hủy đặt phòng thành công!');
            })
            .catch(err => {
                console.error('Lỗi khi hủy đặt phòng:', err);
                setError('Lỗi khi hủy đặt phòng: ' + err.message);
            });
    };

    return (
        <div>
            <h2>Bảng điều khiển quản trị</h2>
            {error && <p className="error-message">{error}</p>}

            <h3>{isEditingRoom ? 'Sửa phòng' : 'Thêm phòng mới'}</h3>
            <div className="admin-form">
                <form onSubmit={handleRoomSubmit}>
                    <input
                        type="text"
                        placeholder="Tên phòng"
                        value={roomForm.name}
                        onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Sức chứa"
                        value={roomForm.capacity}
                        onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Giá mỗi giờ"
                        value={roomForm.pricePerHour}
                        onChange={e => setRoomForm({ ...roomForm, pricePerHour: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Thiết bị (phân tách bằng dấu phẩy)"
                        value={roomForm.equipment}
                        onChange={e => setRoomForm({ ...roomForm, equipment: e.target.value })}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setRoomForm({ ...roomForm, image: e.target.files[0] })}
                    />
                    <button type="submit">{isEditingRoom ? 'Cập nhật' : 'Thêm'}</button>
                    {isEditingRoom && (
                        <button type="button" onClick={() => { setRoomForm({ id: '', name: '', capacity: '', pricePerHour: '', equipment: '', image: null }); setIsEditingRoom(false); }}>
                            Hủy
                        </button>
                    )}
                </form>
            </div>

            <h3>{isEditingMenu ? 'Sửa món' : 'Thêm món mới'}</h3>
            <div className="admin-form">
                <form onSubmit={handleMenuSubmit}>
                    <input
                        type="text"
                        placeholder="Tên món"
                        value={menuForm.name}
                        onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Giá"
                        value={menuForm.price}
                        onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                        required
                    />
                    <select
                        value={menuForm.category}
                        onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}
                    >
                        <option value="food">Đồ ăn</option>
                        <option value="drink">Đồ uống</option>
                        <option value="accessory">Phụ kiện</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Mô tả (tùy chọn)"
                        value={menuForm.description}
                        onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setMenuForm({ ...menuForm, image: e.target.files[0] })}
                    />
                    <button type="submit">{isEditingMenu ? 'Cập nhật' : 'Thêm'}</button>
                    {isEditingMenu && (
                        <button type="button" onClick={() => { setMenuForm({ id: '', name: '', price: '', category: 'food', description: '', image: null }); setIsEditingMenu(false); }}>
                            Hủy
                        </button>
                    )}
                </form>
            </div>

            <h3>Quản lý phòng</h3>
            <div className="admin-list">
                {rooms.map(room => (
                    <div key={room._id} className="admin-card">
                        {room.image && <img src={room.image} alt={room.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
                        <h3>{room.name}</h3>
                        <p>Sức chứa: {room.capacity}</p>
                        <p>Giá: ${room.pricePerHour}/giờ</p>
                        <p>Trạng thái: {room.status === 'available' ? 'Còn trống' : 'Đã đặt'}</p>
                        <button onClick={() => editRoom(room)}>Sửa</button>
                        <button onClick={() => deleteRoom(room._id)} style={{ background: '#e55a5a', marginLeft: '10px' }}>Xóa</button>
                    </div>
                ))}
            </div>

            <h3>Quản lý menu</h3>
            <div className="admin-list">
                {menuItems.map(item => (
                    <div key={item._id} className="admin-card">
                        {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
                        <h3>{item.name}</h3>
                        <p>Giá: ${item.price}</p>
                        <p>Danh mục: {item.category === 'food' ? 'Đồ ăn' : item.category === 'drink' ? 'Đồ uống' : 'Phụ kiện'}</p>
                        <button onClick={() => editMenuItem(item)}>Sửa</button>
                        <button onClick={() => deleteMenuItem(item._id)} style={{ background: '#e55a5a', marginLeft: '10px' }}>Xóa</button>
                    </div>
                ))}
            </div>

            <h3>Đặt phòng</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Người dùng</th>
                        <th>Phòng</th>
                        <th>Thời gian bắt đầu</th>
                        <th>Thời gian kết thúc</th>
                        <th>Tổng giá</th>
                        <th>Phương thức</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking._id}>
                            <td>{booking.userId?.username}</td>
                            <td>{booking.roomId?.name}</td>
                            <td>{new Date(booking.startTime).toLocaleString('vi-VN')}</td>
                            <td>{new Date(booking.endTime).toLocaleString('vi-VN')}</td>
                            <td>${booking.totalPrice}</td>
                            <td>{booking.paymentMethod === 'at_counter' ? 'Tại quầy' : 'MoMo'}</td>
                            <td>{booking.paymentStatus === 'pending' ? 'Chờ xử lý' : booking.paymentStatus === 'completed' ? 'Hoàn tất' : 'Thất bại'}</td>
                            <td>
                                <button onClick={() => cancelBooking(booking._id)} style={{ background: '#e55a5a' }}>Hủy</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3>Đơn hàng</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Người dùng</th>
                        <th>Món</th>
                        <th>Tổng giá</th>
                        <th>Phương thức</th>
                        <th>Trạng thái</th>
                        <th>Thời gian đặt</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order._id}>
                            <td>{order.userId?.username}</td>
                            <td>
                                {order.items.map(item => (
                                    <div key={item._id}>{item.menuItemId?.name} x {item.quantity}</div>
                                ))}
                            </td>
                            <td>${order.totalPrice}</td>
                            <td>{order.paymentMethod === 'cod' ? 'Khi nhận hàng' : 'MoMo'}</td>
                            <td>{order.paymentStatus === 'pending' ? 'Chờ xử lý' : order.paymentStatus === 'completed' ? 'Hoàn tất' : 'Thất bại'}</td>
                            <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const UserManagementPage = ({ navigate }) => {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ id: '', username: '', password: '', email: '', role: 'user' });
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchUsers();
    }, [navigate]);

    const fetchUsers = () => {
        const token = localStorage.getItem('token');
        fetch('/api/auth/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                console.log('Phản hồi từ API users:', res.status, res.statusText);
                if (res.status === 401) {
                    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                }
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu người dùng:', data);
                setUsers(data);
            })
            .catch(err => {
                console.error('Lỗi khi tải danh sách người dùng:', err);
                setError(err.message);
                if (err.message.includes('hết hạn')) navigate('/login');
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (!form.username || !form.email || (!isEditing && !form.password)) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(form.email)) {
            setError('Email không hợp lệ');
            return;
        }
        const url = isEditing ? `/api/auth/users/${form.id}` : '/api/auth/register';
        const method = isEditing ? 'PUT' : 'POST';
        const body = JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password || undefined,
            role: form.role
        });
        console.log('Gửi dữ liệu người dùng:', { url, method, body });
        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body
        })
            .then(res => {
                console.log('Phản hồi từ API users:', res.status, res.statusText);
                if (res.status === 401) {
                    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                }
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi users:', data);
                if (data._id || data.id) {
                    fetchUsers();
                    setForm({ id: '', username: '', password: '', email: '', role: 'user' });
                    setIsEditing(false);
                    alert(isEditing ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!');
                } else {
                    setError(data.message || 'Lỗi khi lưu người dùng');
                }
            })
            .catch(err => {
                console.error('Lỗi khi lưu người dùng:', err);
                setError(err.message);
                if (err.message.includes('hết hạn')) navigate('/login');
            });
    };

    const editUser = (user) => {
        setForm({ id: user._id, username: user.username, password: '', email: user.email, role: user.role });
        setIsEditing(true);
    };

    const deleteUser = (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetch(`/api/auth/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                console.log('Phản hồi từ API delete user:', res.status, res.statusText);
                if (res.status === 401) {
                    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                }
                if (!res.ok) {
                    return res.text().then(text => {
                        console.error('Phản hồi không phải JSON:', text);
                        throw new Error(`Phản hồi không hợp lệ: ${res.status} ${res.statusText}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Dữ liệu phản hồi delete user:', data);
                setUsers(users.filter(user => user._id !== id));
                alert('Xóa người dùng thành công!');
            })
            .catch(err => {
                console.error('Lỗi khi xóa người dùng:', err);
                setError(err.message);
                if (err.message.includes('hết hạn')) navigate('/login');
            });
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <h2>Quản lý người dùng</h2>
            {error && <p className="error-message">{error}</p>}

            <h3>{isEditing ? 'Sửa người dùng' : 'Thêm người dùng mới'}</h3>
            <div className="admin-form">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Tên đăng nhập"
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required={!isEditing}
                    />
                    <select
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="user">Người dùng</option>
                        <option value="admin">Quản trị viên</option>
                    </select>
                    <button type="submit">{isEditing ? 'Cập nhật' : 'Thêm'}</button>
                    {isEditing && (
                        <button type="button" onClick={() => { setForm({ id: '', username: '', password: '', email: '', role: 'user' }); setIsEditing(false); }}>
                            Hủy
                        </button>
                    )}
                </form>
            </div>

            <h3>Danh sách người dùng</h3>
            <input
                type="text"
                placeholder="Tìm kiếm theo tên đăng nhập"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: '20px', padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user._id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.role === 'user' ? 'Người dùng' : 'Quản trị viên'}</td>
                            <td>
                                <button onClick={() => editUser(user)}>Sửa</button>
                                <button onClick={() => deleteUser(user._id)} style={{ background: '#e55a5a', marginLeft: '10px' }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));