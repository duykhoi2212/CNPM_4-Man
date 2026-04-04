import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const statusStyles = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusStyles = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-200 text-gray-700',
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

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} d`;

const formatDateTime = (value) => {
  if (!value) return 'Chua cap nhat';
  return new Date(value).toLocaleString('vi-VN');
};

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [fields, setFields] = useState([]);
  const [filters, setFilters] = useState({ status: '', field: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadBookings = useCallback(async (nextFilters) => {
    const params = {};
    if (nextFilters.status) params.status = nextFilters.status;
    if (nextFilters.field) params.field = nextFilters.field;
    if (nextFilters.date) params.date = nextFilters.date;

    const response = await axiosInstance.get('/bookings/', { params });
    setBookings(response.data.results || []);
  }, []);

  const loadBookingDetail = useCallback(async (bookingId) => {
    const response = await axiosInstance.get(`/bookings/${bookingId}/`);
    setSelectedBooking(response.data);
  }, []);

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

  const handleViewDetail = async (bookingId) => {
    try {
      setSelectedBookingId(bookingId);
      setDetailLoading(true);
      setError('');
      await loadBookingDetail(bookingId);
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Khong the tai chi tiet booking.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (bookingId, action) => {
    const actionConfig = {
      complete: { url: `/bookings/${bookingId}/complete/`, message: 'Da cap nhat booking hoan thanh.' },
      cancel: { url: `/bookings/${bookingId}/cancel/`, message: 'Da huy booking thanh cong.' },
    };

    const selectedAction = actionConfig[action];
    if (!selectedAction) return;

    try {
      setActionLoadingId(bookingId);
      setError('');
      setSuccessMessage('');
      await axiosInstance.put(selectedAction.url, {});
      await loadBookings(filters);
      if (selectedBookingId === bookingId) {
        await loadBookingDetail(bookingId);
      }
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
            <p className="text-gray-500 mt-2">Admin co the theo doi booking, xem chi tiet thanh toan va cap nhat trang thai tai mot noi.</p>
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
                <option value="pending_payment">Cho thanh toan coc</option>
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

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-8">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tien coc</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thanh toan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trang thai</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tac</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className={selectedBookingId === booking.id ? 'bg-teal-50/40' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#{booking.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          <div>
                            <p className="font-medium text-gray-900">{booking.customer_name}</p>
                            <p className="text-xs text-gray-500">{booking.customer_phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{booking.field?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{booking.booking_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatMoney(booking.total_amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatMoney(booking.deposit_amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.payment ? (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusStyles[booking.payment.status] || 'bg-gray-100 text-gray-800'}`}>
                              {booking.payment.status_display}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Chua tao</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                            {booking.status_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleViewDetail(booking.id)}
                              className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Xem chi tiet
                            </button>
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
                            {['pending_payment', 'confirmed'].includes(booking.status) && (
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

          <aside className="bg-white shadow-sm rounded-lg p-6 min-h-[28rem]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Chi tiet booking</h2>
              {selectedBooking && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[selectedBooking.status] || 'bg-gray-100 text-gray-800'}`}>
                  {selectedBooking.status_display}
                </span>
              )}
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-primary font-semibold">Dang tai chi tiet booking...</div>
            ) : !selectedBooking ? (
              <div className="py-16 text-center text-gray-500">
                Chon mot booking o bang ben trai de xem chi tiet thanh toan, khung gio va ghi chu cua khach.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Booking #{selectedBooking.id}</p>
                      <h3 className="text-lg font-bold text-gray-900">{selectedBooking.field?.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500">Dat luc {formatDateTime(selectedBooking.created_at)}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Ngay su dung:</span> {selectedBooking.booking_date}</p>
                    <p><span className="font-semibold text-gray-900">Loai san:</span> {selectedBooking.field?.field_type?.name || 'Khong ro'}</p>
                    <p><span className="font-semibold text-gray-900">Khach hang:</span> {selectedBooking.customer_name}</p>
                    <p><span className="font-semibold text-gray-900">So dien thoai:</span> {selectedBooking.customer_phone}</p>
                    <p><span className="font-semibold text-gray-900">Email:</span> {selectedBooking.customer_email || 'Chua cung cap'}</p>
                    <p><span className="font-semibold text-gray-900">Cap nhat lan cuoi:</span> {formatDateTime(selectedBooking.updated_at)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">Khung gio da dat</h4>
                  {selectedBooking.booking_timeslots?.length ? (
                    <div className="space-y-2">
                      {selectedBooking.booking_timeslots.map((bookingTimeslot) => (
                        <div key={bookingTimeslot.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {bookingTimeslot.timeslot?.start_time} - {bookingTimeslot.timeslot?.end_time}
                            </p>
                            <p className="text-gray-500">
                              {bookingTimeslot.timeslot?.is_peak_hour ? 'Gio cao diem' : 'Gio thuong'}
                            </p>
                          </div>
                          <div className="font-semibold text-gray-900">{formatMoney(bookingTimeslot.timeslot?.price)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Booking nay chua co khung gio.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900">Thanh toan coc</h4>
                    {selectedBooking.payment ? (
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-semibold text-gray-900">Trang thai:</span> {selectedBooking.payment.status_display}</p>
                        <p><span className="font-semibold text-gray-900">Phuong thuc:</span> {selectedBooking.payment.payment_method_display}</p>
                        <p><span className="font-semibold text-gray-900">So tien:</span> {formatMoney(selectedBooking.payment.amount)}</p>
                        <p><span className="font-semibold text-gray-900">Ma giao dich:</span> {selectedBooking.payment.transaction_id || 'Chua co'}</p>
                        <p><span className="font-semibold text-gray-900">Da thanh toan luc:</span> {formatDateTime(selectedBooking.payment.paid_at)}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Booking nay chua co giao dich coc.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900">Tong ket tai chinh</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-semibold text-gray-900">Tong tien:</span> {formatMoney(selectedBooking.total_amount)}</p>
                      <p><span className="font-semibold text-gray-900">Tien coc:</span> {formatMoney(selectedBooking.deposit_amount)}</p>
                      <p><span className="font-semibold text-gray-900">Con lai:</span> {formatMoney(selectedBooking.remaining_amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Ghi chu cua khach</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selectedBooking.notes?.trim() ? selectedBooking.notes : 'Khach hang khong de lai ghi chu nao.'}
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ManageBookings;
