import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';

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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quan tri he thong</h1>
          <Link to="/" className="text-primary font-medium hover:underline">Quay lai trang khach</Link>
        </div>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-primary font-semibold shadow-sm">Dang tai dashboard...</div>
        ) : error ? (
          <div className="rounded-lg bg-white p-8 text-center text-red-500 shadow-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">Truy cap nhanh</h2>
              <div className="flex gap-4">
                <Link to="/admin/pitches" className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-teal-600">Quan ly san bong</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
