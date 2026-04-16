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
      setError(requestError.response?.data?.error || 'Khong the tai danh sach doi san.');
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
      setError(requestError.response?.data?.error || 'Khong the xac nhan doi san.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">FieldSwapManager</h3>
        <p className="text-sm text-gray-500 mt-1">Theo doi va xac nhan cac yeu cau doi san.</p>
      </div>

      <label className="block max-w-xs">
        <span className="text-sm font-medium text-gray-700">Loc theo trang thai</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Tat ca</option>
          <option value="pending">Cho xac nhan</option>
          <option value="searching">Dang tim san</option>
          <option value="proposed">Da de xuat</option>
          <option value="confirmed">Da xac nhan</option>
          <option value="completed">Da hoan thanh</option>
          <option value="cancelled">Da huy</option>
          <option value="failed">That bai</option>
        </select>
      </label>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="py-5 text-sm text-primary font-medium">Dang tai swaps...</div>
      ) : swaps.length === 0 ? (
        <div className="py-5 text-sm text-gray-500">Chua co yeu cau doi san nao.</div>
      ) : (
        <div className="space-y-3">
          {swaps.map((swap) => (
            <div key={swap.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    #{swap.id} - {swap.original_field_name} {'->'} {swap.new_field_name || 'Chua chon'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Incident: #{swap.incident} - Booking: #{swap.original_booking}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[swap.status] || statusStyles.pending}`}>
                  {swap.status_display || swap.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-3">{swap.swap_reason}</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className={`inline-flex rounded-full px-2 py-1 ${swap.customer_notified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {swap.customer_notified ? 'Da thong bao khach' : 'Chua thong bao khach'}
                </span>
                <span className={`inline-flex rounded-full px-2 py-1 ${swap.customer_accepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {swap.customer_accepted ? 'Khach da chap nhan' : 'Cho khach xac nhan'}
                </span>
              </div>
              {swap.status === 'proposed' && (
                <button
                  type="button"
                  onClick={() => handleConfirm(swap.id)}
                  disabled={busyId === swap.id}
                  className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                >
                  {busyId === swap.id ? 'Dang xac nhan...' : 'Xac nhan doi san'}
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
