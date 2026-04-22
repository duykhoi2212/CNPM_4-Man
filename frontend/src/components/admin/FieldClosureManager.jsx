import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';

const CLOSURE_TYPES = [
  { value: 'maintenance', label: '🔧 Bảo trì' },
  { value: 'holiday', label: '🎉 Lễ/Tết' },
  { value: 'issue', label: '⚠️ Sự cố/Sửa chữa' },
  { value: 'weather', label: '🌧️ Thời tiết xấu' },
  { value: 'other', label: '📋 Khác' },
];

const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.detail === 'string') return data.detail;

  if (typeof data === 'object') {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }

  return fallbackMessage;
};

const FieldClosureManager = ({ fieldId }) => {
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    closure_type: 'maintenance',
  });

  useEffect(() => {
    if (fieldId) {
      fetchClosures();
    }
  }, [fieldId]);

  const fetchClosures = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/fields/closures/', {
        params: { field: fieldId },
      });
      setClosures(response.data.results || response.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách ngày đóng cửa.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      await axiosInstance.post('/fields/closures/', {
        field: fieldId,
        ...formData,
      });

      setSuccessMessage('✅ Đã thêm ngày đóng cửa thành công!');
      setFormData({
        start_date: '',
        end_date: '',
        reason: '',
        closure_type: 'maintenance',
      });
      setShowForm(false);
      await fetchClosures();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể thêm ngày đóng cửa.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa ngày đóng cửa này?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/fields/closures/${id}/`);
      setSuccessMessage('✅ Đã xóa ngày đóng cửa!');
      await fetchClosures();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa ngày đóng cửa.'));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getClosureTypeLabel = (type) => {
    const found = CLOSURE_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Ngày đóng cửa đặc biệt</h3>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các ngày sân đóng cửa (bảo trì, lễ tết, sự cố)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-teal-600 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Thêm ngày đóng cửa
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <h4 className="font-semibold text-gray-900">Thêm ngày đóng cửa mới</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại đóng cửa *
              </label>
              <select
                value={formData.closure_type}
                onChange={(e) =>
                  setFormData({ ...formData, closure_type: e.target.value })
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              >
                {CLOSURE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              required
              rows="3"
              placeholder="VD: Bảo trì hệ thống đèn sân..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Closures List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : closures.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Chưa có ngày đóng cửa nào.</p>
          <p className="text-gray-400 text-sm mt-2">
            Sân hoạt động bình thường theo lịch đã cấu hình.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {closures.map((closure) => (
            <div
              key={closure.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {/* Icon based on type */}
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-2xl">
                  {closure.closure_type === 'maintenance' && '🔧'}
                  {closure.closure_type === 'holiday' && '🎉'}
                  {closure.closure_type === 'issue' && '⚠️'}
                  {closure.closure_type === 'weather' && '🌧️'}
                  {closure.closure_type === 'other' && '📋'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {formatDate(closure.start_date)}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(closure.end_date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {getClosureTypeLabel(closure.closure_type)} - {closure.reason}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(closure.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldClosureManager;
