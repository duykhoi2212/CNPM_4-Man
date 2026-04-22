import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

const getTomorrow = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split('T')[0];
};

const TimeSlotPreview = ({ fieldId }) => {
  const [bookingDate, setBookingDate] = useState(getTomorrow());
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fieldId || !bookingDate) {
      setSlots([]);
      return;
    }

    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get(`/fields/${fieldId}/availability/`, {
          params: { date: bookingDate },
        });
        setSlots(response.data.timeslots || []);
      } catch (requestError) {
        setSlots([]);
        setError(requestError.response?.data?.error || 'Không thể tải xem trước khung giờ.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [fieldId, bookingDate]);

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Xem trước khung giờ đã sinh</h3>
          <p className="mt-1 text-sm text-gray-500">Màu xanh: còn trống, màu đỏ/xám: đã đặt hoặc không khả dụng.</p>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Ngày kiểm tra</span>
          <input
            type="date"
            value={bookingDate}
            min={getTomorrow()}
            onChange={(event) => setBookingDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
          />
        </label>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="py-6 text-sm font-medium text-primary">Đang tải khung giờ...</div>
      ) : slots.length === 0 ? (
        <div className="py-6 text-sm text-gray-500">Không có dữ liệu khung giờ cho ngày đã chọn.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => {
            const isAvailable = Boolean(slot.is_available);
            return (
              <div
                key={slot.timeslot_id}
                className={`rounded-lg border p-3 ${
                  isAvailable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">
                  {slot.start_time} - {slot.end_time}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {slot.is_peak_hour ? 'Giờ cao điểm' : 'Giờ thường'} - {Number(slot.price).toLocaleString('vi-VN')} đ
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}
                >
                  {isAvailable ? 'Còn trống' : 'Không khả dụng'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimeSlotPreview;
