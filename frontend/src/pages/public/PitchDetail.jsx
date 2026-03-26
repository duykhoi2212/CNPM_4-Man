import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { isAuthenticated } from '../../utils/auth';

const getTomorrow = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split('T')[0];
};

const PitchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pitch, setPitch] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookingDate, setBookingDate] = useState(getTomorrow());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPitch = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/fields/${id}/`);
        setPitch(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai chi tiet san.');
      } finally {
        setLoading(false);
      }
    };

    fetchPitch();
  }, [id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoadingSlots(true);
        const response = await axiosInstance.get(`/fields/${id}/availability/`, {
          params: { date: bookingDate },
        });
        setAvailability(response.data.timeslots || []);
      } catch (requestError) {
        setAvailability([]);
        setError(requestError.response?.data?.error || 'Khong the tai lich trong cua san.');
      } finally {
        setLoadingSlots(false);
      }
    };

    if (bookingDate) {
      fetchAvailability();
    }
  }, [bookingDate, id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const response = await axiosInstance.get('/reviews/', {
          params: { field: id },
        });
        setReviews(response.data.results || []);
      } catch {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  const selectedSlotDetails = useMemo(
    () => availability.filter((slot) => selectedSlots.includes(slot.timeslot_id)),
    [availability, selectedSlots]
  );

  const totalAmount = selectedSlotDetails.reduce((sum, slot) => sum + Number(slot.price), 0);
  const depositAmount = pitch ? (totalAmount * Number(pitch.deposit_percent || 0)) / 100 : 0;

  const toggleSlot = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((idValue) => idValue !== slotId) : [...prev, slotId]
    );
  };

  const handleBooking = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!selectedSlotDetails.length) {
      setError('Vui long chon it nhat mot khung gio.');
      return;
    }

    navigate('/checkout', {
      state: {
        pitch,
        bookingDate,
        selectedSlots: selectedSlotDetails,
        totalAmount,
        depositAmount,
      },
    });
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-primary font-bold">Dang tai chi tiet san...</div>;
  }

  if (error && !pitch) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">{error}</div>;
  }

  const primaryImage = pitch?.images?.find((image) => image.is_primary)?.image_url || pitch?.images?.[0]?.image_url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <img
              src={primaryImage || `https://via.placeholder.com/800x600/14b8a6/ffffff?text=${encodeURIComponent(pitch.name)}`}
              alt={pitch.name}
              className="w-full h-full object-cover min-h-[300px]"
            />
          </div>

          <div className="p-8 md:w-1/2 flex flex-col justify-center">
            <div className="uppercase tracking-wide text-sm text-primary font-bold mb-1">
              {pitch.field_type?.name || 'Thong tin san'}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{pitch.name}</h2>

            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              {pitch.description || 'San hien dang hoat dong va san sang cho dat lich.'}
            </p>

            <div className="border-t border-gray-100 pt-6 mb-8">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gia gio thuong</dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">{Number(pitch.price_per_hour).toLocaleString('vi-VN')} d / gio</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gia gio cao diem</dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">{Number(pitch.peak_hour_price).toLocaleString('vi-VN')} d / gio</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dia chi</dt>
                  <dd className="mt-1 text-lg font-medium text-gray-900">{pitch.location}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Danh gia</dt>
                  <dd className="mt-1 text-lg font-medium text-yellow-500">{pitch.avg_rating} / 5</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Chon ngay dat san
                <input
                  type="date"
                  value={bookingDate}
                  min={getTomorrow()}
                  onChange={(event) => {
                    setBookingDate(event.target.value);
                    setSelectedSlots([]);
                    setError('');
                  }}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none"
                />
              </label>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Khung gio trong</p>
                {loadingSlots ? (
                  <p className="text-sm text-primary">Dang kiem tra lich trong...</p>
                ) : availability.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availability.map((slot) => (
                      <button
                        key={slot.timeslot_id}
                        type="button"
                        disabled={!slot.is_available}
                        onClick={() => toggleSlot(slot.timeslot_id)}
                        className={`rounded-lg border px-3 py-3 text-sm text-left transition ${
                          selectedSlots.includes(slot.timeslot_id)
                            ? 'border-primary bg-teal-50 text-primary'
                            : slot.is_available
                              ? 'border-gray-200 hover:border-primary'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-semibold">{slot.start_time} - {slot.end_time}</div>
                        <div>{Number(slot.price).toLocaleString('vi-VN')} d</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Khong co khung gio trong cho ngay da chon.</p>
                )}
              </div>

              {selectedSlotDetails.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-2">Tam tinh</p>
                  <p>Tong tien: {totalAmount.toLocaleString('vi-VN')} d</p>
                  <p>Tien coc: {depositAmount.toLocaleString('vi-VN')} d</p>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBooking}
                  className="w-full flex justify-center items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-primary hover:bg-teal-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Dat san ngay
                </button>
                <Link
                  to="/pitches"
                  className="px-6 py-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Quay lai
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Danh gia tu nguoi choi</h3>
            <p className="text-sm text-gray-500 mt-1">Tong cong {pitch.total_reviews} danh gia</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-yellow-500">{pitch.avg_rating}</p>
            <p className="text-sm text-gray-500">diem trung binh</p>
          </div>
        </div>

        {loadingReviews ? (
          <p className="text-primary text-sm">Dang tai danh gia...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">Chua co danh gia nao cho san nay.</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <article key={review.id} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{review.user}</p>
                    <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="text-sm font-semibold text-yellow-500">
                    {'*'.repeat(review.rating)}{'-'.repeat(5 - review.rating)} ({review.rating}/5)
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                {review.images?.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {review.images.map((image) => (
                      <img
                        key={image.id}
                        src={image.image_url}
                        alt={`review-${review.id}-${image.id}`}
                        className="w-full h-28 object-cover rounded-lg border border-gray-100"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PitchDetail;
