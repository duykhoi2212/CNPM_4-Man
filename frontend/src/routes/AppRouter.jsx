import { Routes, Route } from 'react-router-dom';

// Chú thích: Sau này Ẩn và Hậu sẽ import các Pages thật vào đây
// import Home from '../pages/public/Home';
// import Login from '../pages/auth/Login';

const AppRouter = () => {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES (Dành cho Guest - Ẩn đảm nhiệm) */}
      <Route path="/" element={<div className="p-4 text-center"><h1>Trang chủ (Đang xây dựng)</h1></div>} />
      <Route path="/pitches" element={<div>Danh sách sân</div>} />
      <Route path="/pitches/:id" element={<div>Chi tiết sân</div>} />

      {/* 2. AUTH ROUTES (Đăng nhập/Đăng ký - Ẩn đảm nhiệm) */}
      <Route path="/login" element={<div>Đăng nhập</div>} />
      <Route path="/register" element={<div>Đăng ký</div>} />

      {/* 3. USER ROUTES (Dành cho Khách đã đăng nhập - Hậu đảm nhiệm) */}
      <Route path="/user/history" element={<div>Lịch sử đặt sân</div>} />
      <Route path="/checkout" element={<div>Thanh toán cọc</div>} />

      {/* 4. ADMIN ROUTES (Trang quản trị cho Chủ sân - Hậu đảm nhiệm) */}
      <Route path="/admin/dashboard" element={<div>Dashboard Thống kê</div>} />
      <Route path="/admin/pitches" element={<div>Quản lý Sân bóng</div>} />
      
      {/* Route 404 - Bắt lỗi nếu nhập sai link */}
      <Route path="*" element={<h2>404 - Không tìm thấy trang</h2>} />
    </Routes>
  );
};

export default AppRouter;