import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

import Home from '../pages/public/Home';
import PitchList from '../pages/public/PitchList';
import PitchDetail from '../pages/public/PitchDetail';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import Checkout from '../pages/user/Checkout';
import History from '../pages/user/History';

import Dashboard from '../pages/admin/Dashboard';
import Statistics from '../pages/admin/Statistics';
import ManagePitches from '../pages/admin/ManagePitches';
import ManageTimeslots from '../pages/admin/ManageTimeslots';
import ManageBookings from '../pages/admin/ManageBookings';

const AppRouter = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pitches" element={<PitchList />} />
        <Route path="/pitches/:id" element={<PitchDetail />} />
        <Route path="/user/history" element={<History />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/statistics" element={<Statistics />} />
      <Route path="/admin/pitches" element={<ManagePitches />} />
      <Route path="/admin/timeslots" element={<ManageTimeslots />} />
      <Route path="/admin/bookings" element={<ManageBookings />} />

      <Route path="*" element={<h2 className="p-16 text-center text-red-500 font-bold text-3xl">404 - Khong tim thay trang</h2>} />
    </Routes>
  );
};

export default AppRouter;
