import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const Statistics = () => {
  const [overview, setOverview] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [topFields, setTopFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const [overviewResponse, revenueResponse, topFieldsResponse] = await Promise.all([
          axiosInstance.get('/statistics/admin/overview/'),
          axiosInstance.get('/statistics/admin/revenue/', { params: { group_by: 'day' } }),
          axiosInstance.get('/statistics/admin/top-fields/', { params: { limit: 5 } }),
        ]);

        setOverview(overviewResponse.data);
        setRevenueSeries(revenueResponse.data.series || []);
        setTopFields(topFieldsResponse.data.top_fields || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai trang thong ke admin.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thong ke he thong</h1>
            <p className="text-gray-500 mt-2">Trang nay se la noi tap trung cac chi so va bieu do admin can theo doi.</p>
          </div>
          <Link to="/" className="text-primary font-medium hover:underline">Quay lai trang khach</Link>
        </div>

        <AdminNav />

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-primary font-semibold shadow-sm">Dang tai trang thong ke...</div>
        ) : error ? (
          <div className="rounded-lg bg-white p-8 text-center text-red-500 shadow-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 font-medium">Gia tri booking trung binh</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{Number(overview?.booking?.average_booking_value || 0).toLocaleString('vi-VN')} d</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 font-medium">Ty le hoan thanh</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{overview?.booking?.completion_rate_percent || 0}%</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 font-medium">Tien coc cho thanh toan</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{Number(overview?.payment?.pending_deposit || 0).toLocaleString('vi-VN')} d</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Doanh thu gan day</h2>
                {revenueSeries.length === 0 ? (
                  <p className="text-gray-500">Chua co du lieu doanh thu de hien thi.</p>
                ) : (
                  <div className="space-y-3">
                    {revenueSeries.slice(0, 7).map((item) => (
                      <div key={item.period} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                        <span className="text-gray-600">{item.period}</span>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{Number(item.total_revenue || 0).toLocaleString('vi-VN')} d</p>
                          <p className="text-xs text-gray-500">{item.bookings_count || 0} booking</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Top san noi bat</h2>
                {topFields.length === 0 ? (
                  <p className="text-gray-500">Chua co san nao trong bang xep hang.</p>
                ) : (
                  <div className="space-y-3">
                    {topFields.map((field, index) => (
                      <div key={`${field.field_id}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{field.field__name}</p>
                          <p className="text-xs text-gray-500">{field.bookings_count || 0} luot dat</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{Number(field.completed_revenue || 0).toLocaleString('vi-VN')} d</p>
                          <p className="text-xs text-gray-500">{field.cancelled_count || 0} huy</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Statistics;
