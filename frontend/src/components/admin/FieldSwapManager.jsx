import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';

const statusStyles = {
  pending: 'bg-gray-100 text-gray-700',
  searching: 'bg-blue-100 text-blue-700',
  proposed: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  failed: 'bg-rose-100 text-rose-700',
};

const FieldSwapManager = ({ refreshKey }) => {
  const [swaps, setSwaps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadSwaps = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/fields/swaps/', {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setSwaps(response.data.results || response.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể tải danh sách đổi sân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwaps();
  }, [refreshKey, statusFilter]);

  const handleConfirm = async (swapId) => {
    try {
      setBusyId(swapId);
      setError('');
      await axiosInstance.post(`/fields/swaps/${swapId}/confirm/`);
      await loadSwaps();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể xác nhận đổi sân.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Quản lý đổi sân</h3>
        <p className="text-sm text-gray-500 mt-1">Theo dõi lịch sử đổi sân và kết quả xử lý sự cố.</p>
      </div>

      <label className="block max-w-xs">
        <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Tất cả</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="searching">Đang tìm sân</option>
          <option value="proposed">Đã đề xuất</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
          <option value="failed">Thất bại</option>
        </select>
      </label>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="py-5 text-sm text-primary font-medium">Đang tải danh sách đổi sân...</div>
      ) : swaps.length === 0 ? (
        <div className="py-5 text-sm text-gray-500">Chưa có yêu cầu đổi sân nào.</div>
      ) : (
        <div className="space-y-3">
          {swaps.map((swap) => (
            <div key={swap.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    #{swap.id} - {swap.original_field_name} {'->'} {swap.new_field_name || 'Chưa chọn'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Sự cố: #{swap.incident} - Booking: #{swap.original_booking}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[swap.status] || statusStyles.pending}`}>
                  {swap.status_display || swap.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-3">{swap.swap_reason}</p>
              {swap.admin_notes && (
                <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {swap.admin_notes}
                </div>
              )}
              {['proposed', 'pending'].includes(swap.status) && (
                <button
                  type="button"
                  onClick={() => handleConfirm(swap.id)}
                  disabled={busyId === swap.id}
                  className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                >
                  {busyId === swap.id ? 'Đang xác nhận...' : 'Xác nhận đổi sân'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldSwapManager;
