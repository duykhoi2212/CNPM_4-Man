import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';

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

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleString('vi-VN');
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

const BookingDetail = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get(`/bookings/${bookingId}/`);
        setBooking(response.data);
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Không thể tải chi tiết lịch đặt.'));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-12 text-center text-primary font-semibold">Đang tải chi tiết lịch đặt...</div>;
  }

  if (error || !booking) {
    return <div className="max-w-6xl mx-auto px-4 py-12 text-center text-red-500">{error || 'Không tìm thấy booking.'}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Chi tiết booking</p>
          <h1 className="mt-3 text-3xl font-extrabold text-gray-900">Chi tiết lịch đặt #{booking.id}</h1>
          <p className="mt-2 text-gray-500">Xem lại thông tin sân, khung giờ, giao dịch cọc và ghi chú của booking.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
            {booking.status_display}
          </span>
          <Link
            to="/user/history"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Quay lại lịch sử
          </Link>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-gray-500">Sân bóng</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{booking.field?.name}</h2>
                <p className="mt-2 text-sm text-gray-500">Loại sân: {booking.field?.field_type?.name || 'Không rõ'}</p>
              </div>
              {booking.payment ? (
                <span className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${paymentStatusStyles[booking.payment.status] || 'bg-gray-100 text-gray-800'}`}>
                  {booking.payment.status_display}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                  Chưa tạo thanh toán
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Ngày sử dụng</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{booking.booking_date}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Đặt lúc</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatDateTime(booking.created_at)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Khung giờ đã đặt</h3>
              <p className="mt-1 text-sm text-gray-500">Danh sách các khung giờ bạn đã chọn cho booking này.</p>
            </div>
            {booking.booking_timeslots?.length ? (
              <div className="space-y-3">
                {booking.booking_timeslots.map((bookingTimeslot) => (
                  <div key={bookingTimeslot.id} className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {bookingTimeslot.timeslot?.start_time} - {bookingTimeslot.timeslot?.end_time}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {bookingTimeslot.timeslot?.is_peak_hour ? 'Giờ cao điểm' : 'Giờ thường'}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatMoney(bookingTimeslot.timeslot?.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Booking này chưa có khung giờ.</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 p-5">
            <h3 className="text-lg font-bold text-gray-900">Ghi chú</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-700">
              {booking.notes?.trim() ? booking.notes : 'Bạn chưa để lại ghi chú nào cho booking này.'}
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Thông tin liên hệ</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-900">Khách hàng:</span> {booking.customer_name}</p>
              <p><span className="font-semibold text-gray-900">Số điện thoại:</span> {booking.customer_phone}</p>
              <p className="break-all"><span className="font-semibold text-gray-900">Email:</span> {booking.customer_email || 'Chưa cung cấp'}</p>
              <p><span className="font-semibold text-gray-900">Cập nhật lần cuối:</span> {formatDateTime(booking.updated_at)}</p>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Tổng kết tài chính</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between gap-3">
                <span>Tổng tiền</span>
                <span className="font-semibold text-gray-900">{formatMoney(booking.total_amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Tiền cọc</span>
                <span className="font-semibold text-primary">{formatMoney(booking.deposit_amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Còn lại</span>
                <span className="font-semibold text-gray-900">{formatMoney(booking.remaining_amount)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Giao dịch cọc</h3>
            {booking.payment ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p><span className="font-semibold text-gray-900">Trạng thái:</span> {booking.payment.status_display}</p>
                <p><span className="font-semibold text-gray-900">Phương thức:</span> {booking.payment.payment_method_display}</p>
                <p><span className="font-semibold text-gray-900">Số tiền:</span> {formatMoney(booking.payment.amount)}</p>
                <p className="break-all"><span className="font-semibold text-gray-900">Mã giao dịch:</span> {booking.payment.transaction_id || 'Chưa có'}</p>
                <p><span className="font-semibold text-gray-900">Đã thanh toán lúc:</span> {formatDateTime(booking.payment.paid_at)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Booking này chưa có giao dịch cọc nào.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default BookingDetail;
