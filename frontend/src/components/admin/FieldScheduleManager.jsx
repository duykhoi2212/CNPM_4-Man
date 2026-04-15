import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Thứ Hai' },
  { value: 1, label: 'Thứ Ba' },
  { value: 2, label: 'Thứ Tư' },
  { value: 3, label: 'Thứ Năm' },
  { value: 4, label: 'Thứ Sáu' },
  { value: 5, label: 'Thứ Bảy' },
  { value: 6, label: 'Chủ Nhật' },
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

const normalizeTime = (timeValue, fallback) => {
  if (!timeValue || typeof timeValue !== 'string') return fallback;
  return timeValue.slice(0, 5);
};

const FieldScheduleManager = ({ fieldId, fieldName }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state cho từng ngày
  const [formData, setFormData] = useState(
    DAYS_OF_WEEK.map((day) => ({
      day_of_week: day.value,
      is_open: true,
      open_time: '06:00',
      close_time: '22:00',
      slot_duration: 60,
    }))
  );

  useEffect(() => {
    if (fieldId) {
      fetchSchedules();
    }
  }, [fieldId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/fields/schedules/', {
        params: { field: fieldId },
      });
      const existingSchedules = response.data.results || response.data || [];
      setSchedules(existingSchedules);

      // Update form data với dữ liệu từ server
      const updatedFormData = DAYS_OF_WEEK.map((day) => {
        const existing = existingSchedules.find(
          (s) => s.day_of_week === day.value
        );
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            is_open: existing.is_open,
            open_time: normalizeTime(existing.open_time, '06:00'),
            close_time: normalizeTime(existing.close_time, '22:00'),
            slot_duration: existing.slot_duration,
          };
        }
        return {
          day_of_week: day.value,
          is_open: true,
          open_time: '06:00',
          close_time: '22:00',
          slot_duration: 60,
        };
      });
      setFormData(updatedFormData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải lịch hoạt động.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      // Xóa tất cả schedules cũ
      for (const schedule of schedules) {
        await axiosInstance.delete(`/fields/schedules/${schedule.id}/`);
      }

      // Tạo schedules mới
      for (const dayData of formData) {
        await axiosInstance.post('/fields/schedules/', {
          field: fieldId,
          ...dayData,
        });
      }

      setSuccessMessage('Đã lưu lịch hoạt động thành công!');
      await fetchSchedules();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu lịch hoạt động.'));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSlots = async () => {
    if (!window.confirm('⚠️ Hành động này sẽ XÓA TẤT CẢ khung giờ hiện tại và tạo lại từ lịch. Bạn có chắc chắn?')) {
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setSuccessMessage('');

      const response = await axiosInstance.post(
        `/fields/${fieldId}/schedules/generate-slots/`
      );

      setSuccessMessage(response.data.message || 'Đã tạo khung giờ thành công!');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo khung giờ.'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Lịch hoạt động - {fieldName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Cấu hình giờ mở/đóng cửa cho từng ngày trong tuần
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGenerateSlots}
            disabled={generating}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Tự động sinh khung giờ
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Lưu lịch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✅ {successMessage}
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Cấu hình theo ngày</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {formData.map((day, index) => (
            <div key={day.day_of_week} className="px-6 py-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Day Label */}
                <div className="w-24">
                  <span className="font-semibold text-gray-900">
                    {DAYS_OF_WEEK[index].label}
                  </span>
                </div>

                {/* Toggle Open/Closed */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={day.is_open}
                      onChange={(e) =>
                        handleDayChange(index, 'is_open', e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        day.is_open ? 'bg-green-500' : 'bg-red-400'
                      }`}
                    ></div>
                    <div
                      className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        day.is_open ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      day.is_open ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {day.is_open ? '🟢 Mở cửa' : '🔴 Đóng cửa'}
                  </span>
                </label>

                {/* Time Inputs */}
                {day.is_open && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Từ:</label>
                      <input
                        type="time"
                        value={day.open_time}
                        onChange={(e) =>
                          handleDayChange(index, 'open_time', e.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Đến:</label>
                      <input
                        type="time"
                        value={day.close_time}
                        onChange={(e) =>
                          handleDayChange(index, 'close_time', e.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Slot:</label>
                      <select
                        value={day.slot_duration}
                        onChange={(e) =>
                          handleDayChange(index, 'slot_duration', Number(e.target.value))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value={30}>30 phút</option>
                        <option value={60}>60 phút</option>
                        <option value={90}>90 phút</option>
                        <option value={120}>120 phút</option>
                      </select>
                    </div>

                    {/* Preview */}
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const [openH, openM] = day.open_time.split(':').map(Number);
                        const [closeH, closeM] = day.close_time.split(':').map(Number);
                        const totalMinutes = (closeH * 60 + closeM) - (openH * 60 + openM);
                        const slots = Math.floor(totalMinutes / day.slot_duration);
                        return `~${slots} khung giờ`;
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Helper Info */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Hướng dẫn:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Bật/tắt "Mở cửa" cho từng ngày trong tuần</li>
              <li>Chọn giờ mở cửa và đóng cửa</li>
              <li>Chọn thời gian mỗi khung giờ (30/60/90/120 phút)</li>
              <li>Click "Tự động sinh khung giờ" để tạo TimeSlots</li>
              <li>Giờ cao điểm (18:00-21:00) sẽ tự động áp giá cao hơn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldScheduleManager;
