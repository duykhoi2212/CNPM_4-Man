import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { getStoredUser, isAuthenticated } from '../../utils/auth';

const getTomorrow = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split('T')[0];
};

const renderReviewStars = (rating) => (
  <div className="flex items-center gap-1 text-sm font-semibold text-yellow-500">
    {[1, 2, 3, 4, 5].map((value) => (
      <span key={value} className={value <= rating ? 'text-yellow-400' : 'text-gray-200'}>
        {String.fromCharCode(9733)}
      </span>
    ))}
    <span className="ml-1 text-gray-500">({rating}/5)</span>
  </div>
);

const PitchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdminViewer = Boolean(currentUser?.is_staff);
  const [pitch, setPitch] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState('');
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
    if (!pitch?.images?.length) {
      setActiveImage('');
      return;
    }

    const primary = pitch.images.find((image) => image.is_primary)?.image_url || pitch.images[0]?.image_url || '';
    setActiveImage(primary);
  }, [pitch]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const response = await axiosInstance.get('/reviews/', {
          params: { field: id },
        });
        setReviews(response.data.results || response.data || []);
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

  const handleCreateMatchRequest = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!selectedSlotDetails.length) {
      setError('Vui long chon it nhat mot khung gio.');
      return;
    }

    try {
      setLoadingSlots(true);
      setError('');
      const response = await axiosInstance.post('/matches/requests/', {
        field: pitch.id,
        booking_date: bookingDate,
        timeslot_ids: selectedSlotDetails.map((slot) => slot.timeslot_id),
        notes: '',
      });

      navigate('/teams?tab=tim-giao-luu', {
        state: {
          successMessage: response.data?.message || 'Da tao yeu cau giao luu thanh cong',
        },
      });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (responseData && typeof responseData === 'object') {
        if (responseData.error) {
          setError(responseData.error);
        } else {
          const firstMessage = Object.values(responseData).flat()[0];
          setError(firstMessage || 'Khong the tao yeu cau giao luu. Vui long thu lai.');
        }
      } else {
        setError('Khong the tao yeu cau giao luu. Vui long thu lai.');
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-primary font-bold">Dang tai chi tiet san...</div>;
  }

  if (error && !pitch) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">{error}</div>;
  }

  const allImages = pitch?.images || [];
  const fallbackImage = `https://via.placeholder.com/1200x900/14b8a6/ffffff?text=${encodeURIComponent(pitch.name)}`;
  const displayedImage = activeImage || allImages.find((image) => image.is_primary)?.image_url || allImages[0]?.image_url || fallbackImage;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.95fr]">
        <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-xl space-y-4">
          <div className="overflow-hidden rounded-2xl bg-gray-50">
            <img
              src={displayedImage}
              alt={pitch.name}
              className="h-full min-h-[320px] max-h-[520px] w-full object-cover"
            />
          </div>

          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {allImages.map((image) => {
                const imageUrl = image.image_url;
                const isActiveImage = displayedImage === imageUrl;
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(imageUrl)}
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      isActiveImage ? 'border-primary shadow-md' : 'border-transparent hover:border-teal-200'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${pitch.name}-${image.id}`}
                      className="h-20 w-full object-cover sm:h-24"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-xl space-y-6">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              {pitch.field_type?.name || 'Thong tin san'}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">{pitch.name}</h1>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {pitch.description || 'San hien dang hoat dong va san sang cho dat lich.'}
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <dt className="text-sm font-medium text-gray-500">Gia gio thuong</dt>
              <dd className="mt-2 text-xl font-bold text-gray-900">{Number(pitch.price_per_hour).toLocaleString('vi-VN')} d / gio</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <dt className="text-sm font-medium text-gray-500">Gia gio cao diem</dt>
              <dd className="mt-2 text-xl font-bold text-gray-900">{Number(pitch.peak_hour_price).toLocaleString('vi-VN')} d / gio</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Dia chi</dt>
              <dd className="mt-2 text-base font-semibold text-gray-900">{pitch.location}</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Danh gia hien tai</dt>
              <dd className="mt-2 flex items-center justify-between gap-4">
                <span className="text-xl font-bold text-yellow-500">{pitch.avg_rating} / 5</span>
                <span className="text-sm text-gray-500">{pitch.total_reviews} review</span>
              </dd>
            </div>
          </dl>

          {isAdminViewer && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Ban dang xem chi tiet san bang tai khoan admin. Nut dat san duoc an de tranh nham lan voi khu quan ly.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-8 shadow-xl space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chon lich dat san</h2>
            <p className="mt-2 text-sm text-gray-500">Danh sach khung gio duoc hien thi theo dang listview de de scan khi san co nhieu lich trong cung mot ngay.</p>
          </div>

          <label className="block min-w-[260px] text-sm font-medium text-gray-700">
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
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="hidden grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr] gap-4 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
            <span>Khung gio</span>
            <span>Loai</span>
            <span>Gia</span>
            <span>Trang thai</span>
          </div>

          {loadingSlots ? (
            <div className="px-5 py-6 text-sm font-medium text-primary">Dang kiem tra lich trong...</div>
          ) : availability.length ? (
            <div className="divide-y divide-gray-100">
              {availability.map((slot) => {
                const isSelected = selectedSlots.includes(slot.timeslot_id);
                  const isAvailable = slot.is_available;
                  const reservationStatus = slot.reservation_status || (isAvailable ? 'con_trong' : 'da_dat');
                  const statusLabel = reservationStatus === 'dang_giu_cho'
                    ? 'Dang giu cho'
                    : reservationStatus === 'da_dat'
                      ? 'Da dat'
                      : isSelected
                        ? 'Da chon'
                        : 'Con trong';
                  return (
                    <button
                      key={slot.timeslot_id}
                      type="button"
                      disabled={!isAvailable || isAdminViewer}
                    onClick={() => toggleSlot(slot.timeslot_id)}
                    className={`w-full px-5 py-4 text-left transition ${
                      isSelected
                        ? 'bg-teal-50'
                        : 'bg-white hover:bg-gray-50'
                    } ${(!isAvailable || isAdminViewer) ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr] md:items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{slot.start_time} - {slot.end_time}</p>
                        <p className="mt-1 text-xs text-gray-500 md:hidden">
                          {slot.is_peak_hour ? 'Gio cao diem' : 'Gio thuong'}  {Number(slot.price).toLocaleString('vi-VN')} d
                        </p>
                      </div>
                      <div className="hidden md:block text-sm text-gray-600">
                        {slot.is_peak_hour ? 'Gio cao diem' : 'Gio thuong'}
                      </div>
                      <div className="hidden md:block text-sm font-semibold text-gray-900">
                        {Number(slot.price).toLocaleString('vi-VN')} d
                      </div>
                      <div className="flex items-center justify-between gap-3 md:justify-start">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          reservationStatus === 'dang_giu_cho'
                            ? 'bg-amber-100 text-amber-700'
                            : !isAvailable
                            ? 'bg-gray-100 text-gray-500'
                            : isSelected
                              ? 'bg-primary text-white'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {statusLabel}
                        </span>
                        {isAdminViewer && <span className="text-xs text-gray-400">Xem-only</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-6 text-sm text-gray-500">Khong co khung gio trong cho ngay da chon.</div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-3">Tam tinh</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span>So khung gio da chon</span>
                <span className="font-semibold text-gray-900">{selectedSlotDetails.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Tong tien</span>
                <span className="font-semibold text-gray-900">{totalAmount.toLocaleString('vi-VN')} d</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Tien coc</span>
                <span className="font-semibold text-primary">{depositAmount.toLocaleString('vi-VN')} d</span>
              </div>
            </div>
            {!isAdminViewer && selectedSlotDetails.length === 0 && (
              <p className="mt-3 text-xs text-gray-500">Chon it nhat mot khung gio de tiep tuc dat san.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!isAdminViewer && (
              <>
                <button
                  type="button"
                  onClick={handleCreateMatchRequest}
                  disabled={selectedSlotDetails.length === 0}
                  className={`inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-bold text-white transition shadow-lg ${
                    selectedSlotDetails.length === 0
                      ? 'cursor-not-allowed bg-gray-300 shadow-none'
                      : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl'
                  }`}
                >
                  Tim doi giao luu
                </button>
                <button
                  type="button"
                  onClick={handleBooking}
                  disabled={selectedSlotDetails.length === 0}
                  className={`inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-bold text-white transition shadow-lg ${
                    selectedSlotDetails.length === 0
                      ? 'cursor-not-allowed bg-gray-300 shadow-none'
                      : 'bg-primary hover:bg-teal-600 hover:shadow-xl'
                  }`}
                >
                  Dat san ngay
                </button>
              </>
            )}
            <Link
              to="/pitches"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-6 py-4 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Quay lai
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </section>

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
                  {renderReviewStars(review.rating)}
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
