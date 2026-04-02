import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const MAX_IMAGES = 5;

const buildErrorMessage = (responseData, fallbackMessage) => {
  if (!responseData) return fallbackMessage;
  if (responseData.error) return responseData.error;
  if (typeof responseData === 'object') {
    const firstMessage = Object.values(responseData).flat()[0];
    if (typeof firstMessage === 'string') return firstMessage;
  }
  return fallbackMessage;
};

const ReviewForm = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const existingReview = location.state?.review || null;
  const [booking, setBooking] = useState(null);
  const [reviewDetail, setReviewDetail] = useState(existingReview);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 5,
    comment: existingReview?.comment || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const bookingResponse = await axiosInstance.get(`/bookings/${bookingId}/`);
        setBooking(bookingResponse.data);

        if (existingReview?.id) {
          const reviewResponse = await axiosInstance.get(`/reviews/${existingReview.id}/`);
          setReviewDetail(reviewResponse.data);
          setFormData({
            rating: reviewResponse.data.rating,
            comment: reviewResponse.data.comment,
          });
        }
      } catch (requestError) {
        setError(buildErrorMessage(requestError.response?.data, 'Khong the tai thong tin booking de danh gia.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, existingReview?.id]);

  const imageSlotsLeft = useMemo(() => MAX_IMAGES - (reviewDetail?.images?.length || 0), [reviewDetail]);

  const handleCommentChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      comment: event.target.value,
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      setSelectedFiles([]);
      return;
    }

    if (files.length > imageSlotsLeft) {
      setError(`Ban chi co the tai them toi da ${imageSlotsLeft} anh.`);
      event.target.value = '';
      return;
    }

    setError('');
    setSelectedFiles(files);
  };

  const uploadSelectedImages = async (reviewId) => {
    if (!selectedFiles.length) return;

    setUploadingImages(true);
    try {
      for (const file of selectedFiles) {
        const payload = new FormData();
        payload.append('image', file);
        await axiosInstance.post(`/reviews/${reviewId}/add-image/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let reviewId = reviewDetail?.id;

      if (reviewDetail?.id) {
        const response = await axiosInstance.patch(`/reviews/${reviewDetail.id}/update/`, {
          rating: formData.rating,
          comment: formData.comment,
        });
        reviewId = response.data.review.id;
      } else {
        const response = await axiosInstance.post('/reviews/create/', {
          field: booking.field.id,
          booking_id: booking.id,
          rating: formData.rating,
          comment: formData.comment,
        });
        reviewId = response.data.review.id;
      }

      await uploadSelectedImages(reviewId);

      navigate('/user/history', {
        state: {
          successMessage: reviewDetail?.id
            ? 'Danh gia cua ban da duoc cap nhat thanh cong.'
            : 'Danh gia cua ban da duoc gui thanh cong.',
        },
      });
    } catch (requestError) {
      setError(buildErrorMessage(requestError.response?.data, 'Khong the gui danh gia. Vui long thu lai.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewDetail?.id) return;

    const confirmed = window.confirm('Ban co chac muon xoa danh gia nay khong?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await axiosInstance.delete(`/reviews/${reviewDetail.id}/delete/`);
      navigate('/user/history', {
        state: { successMessage: 'Danh gia cua ban da duoc xoa thanh cong.' },
      });
    } catch (requestError) {
      setError(buildErrorMessage(requestError.response?.data, 'Khong the xoa danh gia. Vui long thu lai.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!reviewDetail?.id) return;

    try {
      setError('');
      const response = await axiosInstance.delete(`/reviews/${reviewDetail.id}/images/${imageId}/`);
      setReviewDetail(response.data.review);
    } catch (requestError) {
      setError(buildErrorMessage(requestError.response?.data, 'Khong the xoa anh danh gia.'));
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
          <h2 className="text-3xl font-bold text-gray-900">{reviewDetail?.id ? 'Chinh sua danh gia' : 'Viet danh gia'}</h2>
          <p className="mt-2 text-gray-500">
            Booking #{booking.id} - {booking.field?.name}
          </p>
          <p className="mt-1 text-sm text-gray-500">Ngay dat: {booking.booking_date}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">So sao</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= formData.rating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, rating: value }))}
                    className={`text-4xl transition ${active ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}
                    aria-label={`${value} sao`}
                  >
                    {String.fromCharCode(9733)}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Noi dung danh gia
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleCommentChange}
              rows="6"
              placeholder="Chia se trai nghiem cua ban ve san bong, chat luong mat san, dich vu..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
            />
          </label>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Anh danh gia</p>
              <p className="mt-1 text-xs text-gray-500">Ban co the tai toi da {MAX_IMAGES} anh cho moi danh gia.</p>
            </div>

            {reviewDetail?.images?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reviewDetail.images.map((image) => (
                  <div key={image.id} className="rounded-xl border border-gray-100 p-2">
                    <img src={image.image_url} alt={`review-${image.id}`} className="h-28 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      className="mt-2 w-full rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Xoa anh
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageSlotsLeft > 0 ? (
              <label className="block text-sm font-medium text-gray-700">
                Tai anh moi
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-sm"
                />
              </label>
            ) : (
              <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                Ban da tai du 5 anh cho danh gia nay.
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Dang chon {selectedFiles.length} anh moi de tai len sau khi luu danh gia.
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={submitting || uploadingImages}
              className="flex-1 rounded-md bg-primary px-4 py-3 font-bold text-white hover:bg-teal-600 disabled:opacity-60"
            >
              {submitting || uploadingImages ? 'Dang xu ly...' : reviewDetail?.id ? 'Luu thay doi' : 'Gui danh gia'}
            </button>
            {reviewDetail?.id && (
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={deleting}
                className="flex-1 rounded-md bg-red-50 px-4 py-3 text-center font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {deleting ? 'Dang xoa...' : 'Xoa danh gia'}
              </button>
            )}
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
