import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const ratingOptions = [
  { value: '', label: 'Tat ca so sao' },
  { value: '5', label: 'Tu 5 sao' },
  { value: '4', label: 'Tu 4 sao' },
  { value: '3', label: 'Tu 3 sao' },
  { value: '2', label: 'Tu 2 sao' },
  { value: '1', label: 'Tu 1 sao' },
];

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

const renderStars = (rating) => (
  <div className="flex gap-1 text-xl">
    {[1, 2, 3, 4, 5].map((value) => (
      <span key={value} className={value <= rating ? 'text-yellow-400' : 'text-gray-200'}>
        {String.fromCharCode(9733)}
      </span>
    ))}
  </div>
);

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [fields, setFields] = useState([]);
  const [filters, setFilters] = useState({ field: '', rating_min: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadReviews = async (nextFilters = filters) => {
    const params = {};
    if (nextFilters.field) params.field = nextFilters.field;
    if (nextFilters.rating_min) params.rating_min = nextFilters.rating_min;

    const response = await axiosInstance.get('/reviews/', { params });
    setReviews(response.data.results || response.data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [reviewResponse, fieldResponse] = await Promise.all([
          axiosInstance.get('/reviews/'),
          axiosInstance.get('/fields/'),
        ]);
        setReviews(reviewResponse.data.results || reviewResponse.data || []);
        setFields(fieldResponse.data.results || fieldResponse.data || []);
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Khong the tai danh sach danh gia.'));
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
    await loadReviews(nextFilters);
  };

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm('Ban co chac muon xoa danh gia nay khong?');
    if (!confirmed) return;

    try {
      setActionLoadingId(reviewId);
      setError('');
      setSuccessMessage('');
      await axiosInstance.delete(`/reviews/${reviewId}/delete/`);
      await loadReviews();
      setSuccessMessage('Da xoa danh gia thanh cong.');
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Khong the xoa danh gia.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quan ly review</h1>
            <p className="text-gray-500 mt-2">Admin co the theo doi, loc va xoa cac danh gia khong phu hop ngay tren trang nay.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">Ve trang khach</Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <span className="text-sm font-medium text-gray-700">Muc danh gia</span>
              <select
                name="rating_min"
                value={filters.rating_min}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                {ratingOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {successMessage && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Danh sach review</h2>

          {loading ? (
            <div className="p-8 text-center text-primary font-semibold">Dang tai danh sach review...</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Khong co review nao phu hop voi bo loc hien tai.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.user}</p>
                        <p className="text-sm text-gray-500">{review.field_name}</p>
                      </div>
                      {renderStars(review.rating)}
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      <p className="text-xs text-gray-500">Cap nhat lan cuoi: {new Date(review.updated_at).toLocaleString('vi-VN')}</p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
                      {review.images?.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 md:max-w-xs">
                          {review.images.map((image) => (
                            <img
                              key={image.id}
                              src={image.image_url}
                              alt={`review-${review.id}-${image.id}`}
                              className="h-20 w-20 rounded-lg object-cover border border-gray-100"
                            />
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        disabled={actionLoadingId === review.id}
                        className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {actionLoadingId === review.id ? 'Dang xoa...' : 'Xoa review'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageReviews;
