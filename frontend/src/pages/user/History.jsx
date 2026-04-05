import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const statusStyles = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const getReviewInfo = (booking) => {
  if (booking.status !== 'completed') {
    return null;
  }

  if (booking.has_review) {
    return {
      text: 'Booking nay da duoc danh gia',
      className: 'bg-green-50 text-green-700',
    };
  }

  if (booking.can_review_now) {
    return {
      text: 'Da den thoi diem danh gia. Ban co the viet danh gia ngay bay gio.',
      className: 'bg-blue-50 text-blue-700',
    };
  }

  const eligibleAtText = booking.latest_end_time
    ? `${booking.booking_date} ${booking.latest_end_time}`
    : booking.booking_date;

  return {
    text: `Ban chi co the danh gia sau ${eligibleAtText}`,
    className: 'bg-yellow-50 text-yellow-700',
  };
};

const History = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/bookings/');
        setBookings(response.data.results || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai lich su dat san.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Lich su dat san cua ban</h2>

      {location.state?.successMessage && (
        <div className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          {location.state.successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center text-primary font-semibold">Dang tai lich su dat san...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">Ban chua co booking nao.</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {bookings.map((booking) => {
              const reviewInfo = getReviewInfo(booking);

              return (
                <li key={booking.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary truncate">
                        #{booking.id} - {booking.field?.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                          {booking.status_display}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Ngay: {booking.booking_date} | Tong tien: {Number(booking.total_amount).toLocaleString('vi-VN')} VND
                        </p>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-500 sm:mt-0 sm:text-right">
                        <p>Coc: {Number(booking.deposit_amount).toLocaleString('vi-VN')} VND</p>
                        <p>Con lai: {Number(booking.remaining_amount || 0).toLocaleString('vi-VN')} VND</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link
                        to={`/user/history/${booking.id}`}
                        className="inline-flex items-center justify-center rounded-md bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Chi tiet lich dat
                      </Link>
                    </div>
                    {reviewInfo && (
                      <div className={`mt-3 rounded-md px-3 py-2 text-sm ${reviewInfo.className}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span>{reviewInfo.text}</span>
                          {booking.can_review_now && !booking.has_review && (
                            <Link
                              to={`/user/reviews/new/${booking.id}`}
                              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                            >
                              Viet danh gia
                            </Link>
                          )}
                          {booking.has_review && booking.review && (
                            <Link
                              to={`/user/reviews/new/${booking.id}`}
                              state={{ review: booking.review }}
                              className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                            >
                              Sua danh gia
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default History;
