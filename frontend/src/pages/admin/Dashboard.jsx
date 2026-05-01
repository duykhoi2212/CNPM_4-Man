import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/statistics/admin/overview/');
        setStats(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Không thể tải thống kê admin.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản trị hệ thống</h1>
            <p className="text-gray-500 mt-2">Đây là trang tổng quan. Các chức năng quản lý sẽ được tách thành từng module riêng.</p>
          </div>
          <Link to="/" className="text-primary font-medium hover:underline">Quay lại trang khách</Link>
        </div>

        <AdminNav />

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-primary font-semibold shadow-sm">Đang tải dashboard...</div>
        ) : error ? (
          <div className="rounded-lg bg-white p-8 text-center text-red-500 shadow-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary">
                <p className="text-sm text-gray-500 font-medium">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{Number(stats?.booking?.total_revenue || 0).toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 font-medium">Lượt đặt sân</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.booking?.total_bookings || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <p className="text-sm text-gray-500 font-medium">Tiền cọc đã thanh toán</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{Number(stats?.payment?.completed_deposit || 0).toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-rose-500">
                <p className="text-sm text-gray-500 font-medium">Đánh giá từ booking</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_reviews_from_bookings || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Trạng thái booking</h2>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between"><span>Chờ xác nhận</span><span className="font-semibold">{stats?.booking?.pending_bookings || 0}</span></div>
                  <div className="flex justify-between"><span>Đã xác nhận</span><span className="font-semibold">{stats?.booking?.confirmed_bookings || 0}</span></div>
                  <div className="flex justify-between"><span>Đã hoàn thành</span><span className="font-semibold">{stats?.booking?.completed_bookings || 0}</span></div>
                  <div className="flex justify-between"><span>Đã hủy</span><span className="font-semibold">{stats?.booking?.cancelled_bookings || 0}</span></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Hành động tiếp theo</h2>
                <div className="space-y-3 text-gray-600">
                  <p>1. Quản lý sân và hình ảnh tại module Sân bóng.</p>
                  <p>2. Thêm trang thống kê chi tiết để xem doanh thu theo thời gian.</p>
                  <p>3. Sau khi hoàn thành, tôi sẽ tiếp tục mở rộng Khung giờ, User, Booking và Review.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
