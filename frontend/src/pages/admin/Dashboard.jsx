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
        setError(requestError.response?.data?.error || 'Khong the tai thong ke admin.');
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
            <h1 className="text-3xl font-bold text-gray-900">Quan tri he thong</h1>
            <p className="text-gray-500 mt-2">Day la trang tong quan. Cac chuc nang quan ly se duoc tach thanh tung module rieng.</p>
          </div>
          <Link to="/" className="text-primary font-medium hover:underline">Quay lai trang khach</Link>
        </div>

        <AdminNav />

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-primary font-semibold shadow-sm">Dang tai dashboard...</div>
        ) : error ? (
          <div className="rounded-lg bg-white p-8 text-center text-red-500 shadow-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary">
                <p className="text-sm text-gray-500 font-medium">Tong doanh thu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{Number(stats?.booking?.total_revenue || 0).toLocaleString('vi-VN')} d</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 font-medium">Luot dat san</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.booking?.total_bookings || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <p className="text-sm text-gray-500 font-medium">Tien coc da thanh toan</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{Number(stats?.payment?.completed_deposit || 0).toLocaleString('vi-VN')} d</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-rose-500">
                <p className="text-sm text-gray-500 font-medium">Danh gia tu booking</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_reviews_from_bookings || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Trang thai booking</h2>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between"><span>Cho xac nhan</span><span className="font-semibold">{stats?.booking?.pending_bookings || 0}</span></div>
                  <div className="flex justify-between"><span>Da xac nhan</span><span className="font-semibold">{stats?.booking?.confirmed_bookings || 0}</span></div>
                  <div className="flex justify-between"><span>Da hoan thanh</span><span className="font-semibold">{stats?.booking?.completed_bookings || 0}</span></div>
                  <div className="flex justify-between"><span>Da huy</span><span className="font-semibold">{stats?.booking?.cancelled_bookings || 0}</span></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Hanh dong tiep theo</h2>
                <div className="space-y-3 text-gray-600">
                  <p>1. Quan ly san va hinh anh tai module San bong.</p>
                  <p>2. Them trang thong ke chi tiet de xem doanh thu theo thoi gian.</p>
                  <p>3. Sau do minh se tiep tuc mo rong Khung gio, User, Booking va Review.</p>
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
