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

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
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
          axiosInstance.get('/fields/', { params: { admin_scope: 'managed' } }),
        ]);
        setBookings(bookingResponse.data.results || []);
        setFields(fieldResponse.data.results || []);
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Không thể tải danh sách booking.'));
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
      setError(getReadableError(requestError.response?.data, 'Không thể tải chi tiết booking.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (bookingId, action) => {
    const actionConfig = {
      complete: { url: `/bookings/${bookingId}/complete/`, message: 'Đã cập nhật booking hoàn thành.' },
      cancel: { url: `/bookings/${bookingId}/cancel/`, message: 'Đã hủy booking thành công.' },
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
      setError(getReadableError(requestError.response?.data, 'Không thể cập nhật booking.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý booking</h1>
            <p className="text-gray-500 mt-2">Admin có thể theo dõi booking, xem chi tiết thanh toán và cập nhật trạng thái tại một nơi.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">Về trang khách</Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Trạng thái</span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Tất cả</option>
                <option value="pending_payment">Chờ thanh toán cọc</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Sân bóng</span>
              <select
                name="field"
                value={filters.field}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Tất cả sân</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Ngày đặt sân</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-8 items-start">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Danh sách booking</h2>

            {loading ? (
              <div className="p-8 text-center text-primary font-semibold">Đang tải danh sách booking...</div>
            ) : bookings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Không có booking nào phù hợp với bộ lọc hiện tại.</div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <article
                    key={booking.id}
                    className={`rounded-2xl border p-5 transition ${selectedBookingId === booking.id ? 'border-primary bg-teal-50/40 shadow-sm' : 'border-gray-100 bg-white'}`}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-4 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">#{booking.id} - {booking.field?.name}</h3>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                            {booking.status_display}
                          </span>
                          {booking.payment ? (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusStyles[booking.payment.status] || 'bg-gray-100 text-gray-800'}`}>
                              {booking.payment.status_display}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600">
                              Chưa tạo thanh toán
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                          <div>
                            <p className="font-semibold text-gray-900">Khách hàng</p>
                            <p>{booking.customer_name}</p>
                            <p className="text-gray-500">{booking.customer_phone}</p>
                            <p className="text-gray-500 break-all">{booking.customer_email || 'Chưa cung cấp email'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Thông tin đặt sân</p>
                            <p>Ngày sử dụng: {booking.booking_date}</p>
                            <p>Tiền sân: {formatMoney(booking.field_amount)}</p>
                            <p>Tiền dịch vụ: {formatMoney(booking.service_amount)}</p>
                            <p>Tổng tiền: {formatMoney(booking.total_amount)}</p>
                            <p>Tiền cọc: {formatMoney(booking.deposit_amount)}</p>
                            <p>Còn lại: {formatMoney(booking.remaining_amount)}</p>
                          </div>
                        </div>

                        {booking.service_items?.length > 0 && (
                          <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-4 py-3 text-sm text-teal-900">
                            <p className="font-semibold">Dịch vụ kèm: {booking.service_items.length} loại</p>
                            <p className="mt-1 text-teal-700">
                              {booking.service_items.map((item) => `${item.service_name_snapshot} x${item.quantity}`).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap lg:flex-col gap-3 lg:w-40 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(booking.id)}
                          className="rounded-md bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            Xem chi tiết
                        </button>
                        {booking.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === booking.id}
                            onClick={() => handleAction(booking.id, 'complete')}
                            className="rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                          >
                            Hoàn thành
                          </button>
                        )}
                        {['pending_payment', 'confirmed'].includes(booking.status) && (
                          <button
                            type="button"
                            disabled={actionLoadingId === booking.id}
                            onClick={() => handleAction(booking.id, 'cancel')}
                            className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="bg-white shadow-sm rounded-lg p-6 xl:sticky xl:top-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết booking</h2>
              {selectedBooking && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[selectedBooking.status] || 'bg-gray-100 text-gray-800'}`}>
                  {selectedBooking.status_display}
                </span>
              )}
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-primary font-semibold">Đang tải chi tiết booking...</div>
            ) : !selectedBooking ? (
              <div className="py-16 text-center text-gray-500">
                Chọn một booking bên trái để xem chi tiết thanh toán, khung giờ và ghi chú của khách.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Booking #{selectedBooking.id}</p>
                      <h3 className="text-lg font-bold text-gray-900">{selectedBooking.field?.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 text-right">Đặt lúc {formatDateTime(selectedBooking.created_at)}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Ngày sử dụng:</span> {selectedBooking.booking_date}</p>
                    <p><span className="font-semibold text-gray-900">Loại sân:</span> {selectedBooking.field?.field_type?.name || 'Không rõ'}</p>
                    <p><span className="font-semibold text-gray-900">Khách hàng:</span> {selectedBooking.customer_name}</p>
                    <p><span className="font-semibold text-gray-900">Số điện thoại:</span> {selectedBooking.customer_phone}</p>
                    <p className="sm:col-span-2 break-all"><span className="font-semibold text-gray-900">Email:</span> {selectedBooking.customer_email || 'Chưa cung cấp'}</p>
                    <p className="sm:col-span-2"><span className="font-semibold text-gray-900">Cập nhật lần cuối:</span> {formatDateTime(selectedBooking.updated_at)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">Khung giờ đã đặt</h4>
                  {selectedBooking.booking_timeslots?.length ? (
                    <div className="space-y-2">
                      {selectedBooking.booking_timeslots.map((bookingTimeslot) => (
                        <div key={bookingTimeslot.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {bookingTimeslot.timeslot?.start_time} - {bookingTimeslot.timeslot?.end_time}
                            </p>
                            <p className="text-gray-500">
                              {bookingTimeslot.timeslot?.is_peak_hour ? 'Giờ cao điểm' : 'Giờ thường'}
                            </p>
                          </div>
                          <div className="font-semibold text-gray-900 whitespace-nowrap">{formatMoney(bookingTimeslot.timeslot?.price)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Booking này chưa có khung giờ.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900">Dịch vụ kèm</h4>
                    {selectedBooking.service_items?.length ? (
                      <div className="space-y-2">
                        {selectedBooking.service_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">{item.service_name_snapshot}</p>
                              <p className="text-gray-500">{formatMoney(item.unit_price_snapshot)} / {item.unit_label_snapshot} · Số lượng: {item.quantity}</p>
                            </div>
                            <div className="font-semibold text-gray-900 whitespace-nowrap">{formatMoney(item.line_total)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Booking này không có dịch vụ kèm.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900">Thanh toán cọc</h4>
                    {selectedBooking.payment ? (
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-semibold text-gray-900">Trạng thái:</span> {selectedBooking.payment.status_display}</p>
                        <p><span className="font-semibold text-gray-900">Phương thức:</span> {selectedBooking.payment.payment_method_display}</p>
                        <p><span className="font-semibold text-gray-900">Số tiền:</span> {formatMoney(selectedBooking.payment.amount)}</p>
                        <p><span className="font-semibold text-gray-900">Trong đó tiền cọc:</span> {formatMoney(selectedBooking.payment.deposit_component)}</p>
                        <p><span className="font-semibold text-gray-900">Trong đó dịch vụ:</span> {formatMoney(selectedBooking.payment.service_component)}</p>
                        <p className="break-all"><span className="font-semibold text-gray-900">Mã giao dịch:</span> {selectedBooking.payment.transaction_id || 'Chưa có'}</p>
                        <p><span className="font-semibold text-gray-900">Đã thanh toán lúc:</span> {formatDateTime(selectedBooking.payment.paid_at)}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Booking này chưa có giao dịch cọc.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900">Tổng kết tài chính</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-semibold text-gray-900">Tiền sân:</span> {formatMoney(selectedBooking.field_amount)}</p>
                      <p><span className="font-semibold text-gray-900">Tiền dịch vụ:</span> {formatMoney(selectedBooking.service_amount)}</p>
                      <p><span className="font-semibold text-gray-900">Tổng tiền:</span> {formatMoney(selectedBooking.total_amount)}</p>
                      <p><span className="font-semibold text-gray-900">Tiền cọc:</span> {formatMoney(selectedBooking.deposit_amount)}</p>
                      <p><span className="font-semibold text-gray-900">Còn lại:</span> {formatMoney(selectedBooking.remaining_amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Ghi chú của khách</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selectedBooking.notes?.trim() ? selectedBooking.notes : 'Khách hàng không để lại ghi chú nào.'}
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
