import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const getReadableError = (responseData, fallbackMessage) => {
  if (!responseData) return fallbackMessage;
  if (typeof responseData === 'string') return responseData;
  if (responseData.error) return responseData.error;
  if (typeof responseData === 'object') {
    const firstEntry = Object.values(responseData)[0];
    if (Array.isArray(firstEntry)) return firstEntry[0] || fallbackMessage;
    if (typeof firstEntry === 'string') return firstEntry;
  }
  return fallbackMessage;
};

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [fields, setFields] = useState([]);
  const [filters, setFilters] = useState({ status: '', field: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadBookings = async (nextFilters = filters) => {
    const params = {};
    if (nextFilters.status) params.status = nextFilters.status;
    if (nextFilters.field) params.field = nextFilters.field;
    if (nextFilters.date) params.date = nextFilters.date;

    const response = await axiosInstance.get('/bookings/', { params });
    setBookings(response.data.results || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [bookingResponse, fieldResponse] = await Promise.all([
          axiosInstance.get('/bookings/'),
          axiosInstance.get('/fields/'),
        ]);
        setBookings(bookingResponse.data.results || []);
        setFields(fieldResponse.data.results || []);
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Khong the tai danh sach booking.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = async (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value,
    };
    setFilters(nextFilters);
    setError('');
    setSuccessMessage('');
    await loadBookings(nextFilters);
  };

  const handleAction = async (bookingId, action) => {
    const actionConfig = {
      confirm: { url: `/bookings/${bookingId}/confirm/`, message: 'Da xac nhan booking thanh cong.' },
      complete: { url: `/bookings/${bookingId}/complete/`, message: 'Da cap nhat booking thanh hoan thanh.' },
      cancel: { url: `/bookings/${bookingId}/cancel/`, message: 'Da huy booking thanh cong.' },
    };

    const selectedAction = actionConfig[action];
    if (!selectedAction) return;

    try {
      setActionLoadingId(bookingId);
      setError('');
      setSuccessMessage('');
      await axiosInstance.put(selectedAction.url, {});
      await loadBookings();
      setSuccessMessage(selectedAction.message);
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Khong the cap nhat booking.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quan ly booking</h1>
            <p className="text-gray-500 mt-2">Admin co the theo doi toan bo booking va cap nhat trang thai ngay tren trang nay.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">Ve trang khach</Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Trang thai</span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Tat ca</option>
                <option value="pending">Cho xac nhan</option>
                <option value="confirmed">Da xac nhan</option>
                <option value="completed">Da hoan thanh</option>
                <option value="cancelled">Da huy</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">San bong</span>
              <select
                name="field"
                value={filters.field}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Tat ca san</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Ngay dat san</span>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {successMessage && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Danh sach booking</h2>

          {loading ? (
            <div className="p-8 text-center text-primary font-semibold">Dang tai danh sach booking...</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Khong co booking nao phu hop voi bo loc hien tai.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khach hang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">San</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tong tien</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trang thai</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#{booking.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        <div>
                          <p className="font-medium text-gray-900">{booking.customer_name}</p>
                          <p className="text-xs text-gray-500">{booking.customer_phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{booking.field?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{booking.booking_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{Number(booking.total_amount).toLocaleString('vi-VN')} d</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                          {booking.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-3">
                          {booking.status === 'pending' && (
                            <button
                              type="button"
                              disabled={actionLoadingId === booking.id}
                              onClick={() => handleAction(booking.id, 'confirm')}
                              className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                            >
                              Xac nhan
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              type="button"
                              disabled={actionLoadingId === booking.id}
                              onClick={() => handleAction(booking.id, 'complete')}
                              className="rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                            >
                              Hoan thanh
                            </button>
                          )}
                          {['pending', 'confirmed'].includes(booking.status) && (
                            <button
                              type="button"
                              disabled={actionLoadingId === booking.id}
                              onClick={() => handleAction(booking.id, 'cancel')}
                              className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              Huy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBookings;
