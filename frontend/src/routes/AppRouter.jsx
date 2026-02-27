import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// Public Pages
import Home from '../pages/public/Home';
import PitchList from '../pages/public/PitchList';
import PitchDetail from '../pages/public/PitchDetail';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// User Pages
import Checkout from '../pages/user/Checkout';
import History from '../pages/user/History';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import ManagePitches from '../pages/admin/ManagePitches';

const AppRouter = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Các trang Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pitches" element={<PitchList />} />
        <Route path="/pitches/:id" element={<PitchDetail />} />
        
        {/* Các trang cho User đã đăng nhập */}
        <Route path="/user/history" element={<History />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      {/* Các trang dành cho Admin (Không dùng chung Header của khách) */}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/pitches" element={<ManagePitches />} />
      
      {/* Route bắt lỗi nhập sai link */}
      <Route path="*" element={<h2 className="p-16 text-center text-red-500 font-bold text-3xl">404 - Không tìm thấy trang</h2>} />
    </Routes>
  );
};

export default AppRouter;
