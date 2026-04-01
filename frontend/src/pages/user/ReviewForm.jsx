import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const ReviewForm = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/bookings/${bookingId}/`);
        const bookingData = response.data;
        setBooking(bookingData);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai thong tin booking de danh gia.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/reviews/create/', {
        field: booking.field.id,
        booking_id: booking.id,
        rating: formData.rating,
        comment: formData.comment,
      });

      navigate('/user/history', {
        state: { successMessage: 'Danh gia cua ban da duoc gui thanh cong.' },
      });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (responseData?.error) {
        setError(responseData.error);
      } else if (responseData && typeof responseData === 'object') {
        const firstMessage = Object.values(responseData).flat()[0];
        setError(firstMessage || 'Khong the gui danh gia. Vui long thu lai.');
      } else {
        setError('Khong the gui danh gia. Vui long thu lai.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-primary font-semibold">Dang tai thong tin booking...</div>;
  }

  if (error && !booking) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Viet danh gia</h2>
          <p className="mt-2 text-gray-500">
            Booking #{booking.id} - {booking.field?.name}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Ngay dat: {booking.booking_date}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-sm font-medium text-gray-700">
            So sao
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            >
              <option value={5}>5 sao</option>
              <option value={4}>4 sao</option>
              <option value={3}>3 sao</option>
              <option value={2}>2 sao</option>
              <option value={1}>1 sao</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Noi dung danh gia
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows="6"
              placeholder="Chia se trai nghiem cua ban ve san bong, chat luong mat san, dich vu..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-primary px-4 py-3 font-bold text-white hover:bg-teal-600 disabled:opacity-60"
            >
              {submitting ? 'Dang gui danh gia...' : 'Gui danh gia'}
            </button>
            <Link
              to="/user/history"
              className="flex-1 rounded-md bg-gray-100 px-4 py-3 text-center font-bold text-gray-700 hover:bg-gray-200"
            >
              Quay lai
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
