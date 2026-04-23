import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { getStoredUser, isAuthenticated } from '../../utils/auth';

const AVAILABILITY_POLLING_MS = 10000;

const getTomorrow = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split('T')[0];
};

const formatDate = (value) => new Date(value).toLocaleDateString('vi-VN');

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
    let isMounted = true;

    const fetchAvailability = async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setLoadingSlots(true);
        }
        const response = await axiosInstance.get(`/fields/${id}/availability/`, {
          params: { date: bookingDate },
        });

        if (!isMounted) {
          return;
        }

        const nextAvailability = response.data.timeslots || [];
        setAvailability(nextAvailability);
        setSelectedSlots((prev) => {
          const availableSlotIds = new Set(
            nextAvailability.filter((slot) => slot.is_available).map((slot) => slot.timeslot_id)
          );
          return prev.filter((slotId) => availableSlotIds.has(slotId));
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setAvailability([]);
        setSelectedSlots([]);
        setError(requestError.response?.data?.error || 'Không thể tải lịch trống của sân.');
      } finally {
        if (isMounted && showLoading) {
          setLoadingSlots(false);
        }
      }
    };

    if (bookingDate) {
      fetchAvailability();
      const intervalId = window.setInterval(() => {
        fetchAvailability({ showLoading: false });
      }, AVAILABILITY_POLLING_MS);

      return () => {
        isMounted = false;
        window.clearInterval(intervalId);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [bookingDate, id]);

  useEffect(() => {
    const fetchPitch = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/fields/${id}/`);
        setPitch(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Không thể tải chi tiết sân.');
      } finally {
        setLoading(false);
      }
    };

    fetchPitch();
  }, [id]);

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
  const availableSlots = useMemo(
    () => availability.filter((slot) => slot.is_available),
    [availability]
  );
  const unavailableSlots = useMemo(
    () => availability.filter((slot) => !slot.is_available),
    [availability]
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
      setError('Vui lòng chọn ít nhất một khung giờ.');
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
      setError('Vui lòng chọn ít nhất một khung giờ.');
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
          successMessage: response.data?.message || 'Đã tạo yêu cầu giao lưu thành công',
        },
      });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (responseData && typeof responseData === 'object') {
        if (responseData.error) {
          setError(responseData.error);
        } else {
          const firstMessage = Object.values(responseData).flat()[0];
          setError(firstMessage || 'Không thể tạo yêu cầu giao lưu. Vui lòng thử lại.');
        }
      } else {
        setError('Không thể tạo yêu cầu giao lưu. Vui lòng thử lại.');
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-primary font-bold">Đang tải chi tiết sân...</div>;
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
              {pitch.field_type?.name || 'Thông tin sân'}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">{pitch.name}</h1>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {pitch.description || 'Sân hiện đang hoạt động và sẵn sàng cho đặt lịch.'}
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <dt className="text-sm font-medium text-gray-500">Giá giờ thường</dt>
              <dd className="mt-2 text-xl font-bold text-gray-900">{Number(pitch.price_per_hour).toLocaleString('vi-VN')} đ / giờ</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <dt className="text-sm font-medium text-gray-500">Giá giờ cao điểm</dt>
              <dd className="mt-2 text-xl font-bold text-gray-900">{Number(pitch.peak_hour_price).toLocaleString('vi-VN')} đ / giờ</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Địa chỉ</dt>
              <dd className="mt-2 text-base font-semibold text-gray-900">{pitch.location}</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Đánh giá hiện tại</dt>
              <dd className="mt-2 flex items-center justify-between gap-4">
                <span className="text-xl font-bold text-yellow-500">{pitch.avg_rating} / 5</span>
                <span className="text-sm text-gray-500">{pitch.total_reviews} đánh giá</span>
              </dd>
            </div>
          </dl>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Lịch hoạt động theo tuần</h3>
            {pitch.schedules?.length ? (
              <div className="grid grid-cols-1 gap-2">
                {pitch.schedules.map((schedule) => (
                  <div key={schedule.day_of_week} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <span className="text-sm font-medium text-gray-700">{schedule.day_name}</span>
                    <span className={`text-sm font-semibold ${schedule.is_open ? 'text-green-700' : 'text-red-700'}`}>
                      {schedule.is_open ? `${String(schedule.open_time).slice(0, 5)} - ${String(schedule.close_time).slice(0, 5)}` : 'Đóng cửa'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Chưa có cấu hình lịch hoạt động.</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Ngày đóng cửa sắp tới</h3>
            {pitch.active_closures?.length ? (
              <div className="space-y-2">
                {pitch.active_closures.map((closure) => (
                  <div key={closure.id} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                    <p className="text-sm font-semibold text-red-800">
                      {formatDate(closure.start_date)} - {formatDate(closure.end_date)}
                    </p>
                    <p className="text-xs text-red-700">{closure.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Không có lịch đóng cửa đặc biệt.</p>
            )}
          </div>

          {isAdminViewer && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Bạn đang xem chi tiết sân bằng tài khoản admin. Nút đặt sân được ẩn để tránh nhầm lẫn với khu quản lý.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-8 shadow-xl space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chọn lịch đặt sân</h2>
            <p className="mt-2 text-sm text-gray-500">Danh sách khung giờ được hiển thị dạng danh sách để dễ xem khi sân có nhiều lịch trong cùng một ngày.</p>
          </div>

          <label className="block min-w-[260px] text-sm font-medium text-gray-700">
            Chọn ngày đặt sân
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
            <span>Khung giờ</span>
            <span>Loại</span>
            <span>Giá</span>
            <span>Trạng thái</span>
          </div>

          {loadingSlots ? (
            <div className="px-5 py-6 text-sm font-medium text-primary">Đang kiểm tra lịch trống...</div>
          ) : availability.length ? (
            <div className="space-y-4 p-4">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-green-700">Khung giờ có thể chọn ({availableSlots.length})</h4>
                {availableSlots.length === 0 ? (
                  <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                    Không có khung giờ trống để đặt ở ngày này.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 rounded-lg border border-green-100">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlots.includes(slot.timeslot_id);
                      return (
                        <button
                          key={slot.timeslot_id}
                          type="button"
                          disabled={isAdminViewer}
                          onClick={() => toggleSlot(slot.timeslot_id)}
                          className={`w-full px-5 py-4 text-left transition ${
                            isSelected ? 'bg-teal-50' : 'bg-white hover:bg-gray-50'
                          } ${isAdminViewer ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                          <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr] md:items-center">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{slot.start_time} - {slot.end_time}</p>
                              <p className="mt-1 text-xs text-gray-500 md:hidden">
                                {slot.is_peak_hour ? 'Giờ cao điểm' : 'Giờ thường'}  {Number(slot.price).toLocaleString('vi-VN')} đ
                              </p>
                            </div>
                            <div className="hidden md:block text-sm text-gray-600">
                              {slot.is_peak_hour ? 'Giờ cao điểm' : 'Giờ thường'}
                            </div>
                            <div className="hidden md:block text-sm font-semibold text-gray-900">
                              {Number(slot.price).toLocaleString('vi-VN')} d
                            </div>
                            <div className="flex items-center justify-between gap-3 md:justify-start">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                isSelected ? 'bg-primary text-white' : 'bg-green-100 text-green-700'
                              }`}>
                                {isSelected ? 'Đã chọn' : 'Còn trống'}
                              </span>
                              {isAdminViewer && <span className="text-xs text-gray-400">Xem-only</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-red-700">Khung giờ không thể chọn ({unavailableSlots.length})</h4>
                {unavailableSlots.length === 0 ? (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Tất cả khung giờ đều đang khả dụng.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 rounded-lg border border-red-100">
                    {unavailableSlots.map((slot) => {
                      const reservationStatus = slot.reservation_status || 'da_dat';
                      const statusNote = reservationStatus === 'dang_giu_cho'
                        ? 'Khung giờ đang được giữ chỗ trong 1 phút để thanh toán cọc.'
                        : 'Khung giờ này đã được đặt.';
                      return (
                        <div key={slot.timeslot_id} className="w-full bg-white px-5 py-4 opacity-80">
                          <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr] md:items-center">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{slot.start_time} - {slot.end_time}</p>
                            </div>
                            <div className="hidden md:block text-sm text-gray-600">
                              {slot.is_peak_hour ? 'Giờ cao điểm' : 'Giờ thường'}
                            </div>
                            <div className="hidden md:block text-sm font-semibold text-gray-900">
                              {Number(slot.price).toLocaleString('vi-VN')} d
                            </div>
                            <div className="flex items-center justify-between gap-3 md:justify-start">
                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                                Đã đặt
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">{statusNote}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-6 text-sm text-gray-500">Không có khung giờ trống cho ngày đã chọn.</div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-3">Tạm tính</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span>Số khung giờ đã chọn</span>
                <span className="font-semibold text-gray-900">{selectedSlotDetails.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Tổng tiền</span>
                <span className="font-semibold text-gray-900">{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Tiền cọc</span>
                <span className="font-semibold text-primary">{depositAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
            {!isAdminViewer && selectedSlotDetails.length === 0 && (
              <p className="mt-3 text-xs text-gray-500">Chọn ít nhất một khung giờ để tiếp tục đặt sân.</p>
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
                  Tìm đội giao lưu
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
                  Đặt sân ngay
                </button>
              </>
            )}
            <Link
              to="/pitches"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-6 py-4 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Quay lại
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
            <h3 className="text-2xl font-bold text-gray-900">Đánh giá từ người chơi</h3>
            <p className="text-sm text-gray-500 mt-1">Tổng cộng {pitch.total_reviews} đánh giá</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-yellow-500">{pitch.avg_rating}</p>
            <p className="text-sm text-gray-500">Điểm trung bình</p>
          </div>
        </div>

        {loadingReviews ? (
          <p className="text-primary text-sm">Đang tải đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">Chưa có đánh giá nào cho sân này.</p>
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
