import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';
import { getStoredUser } from '../../utils/auth';

const roleOptions = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'Người dùng' },
];

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã khóa' },
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

const ManageUsers = () => {
  const currentUser = getStoredUser();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = useCallback(async (nextFilters = filters) => {
    const params = {};
    if (nextFilters.q.trim()) params.q = nextFilters.q.trim();
    if (nextFilters.role) params.role = nextFilters.role;
    if (nextFilters.status) params.status = nextFilters.status;

    const response = await axiosInstance.get('/auth/admin/users/', { params });
    setUsers(response.data.results || response.data || []);
  }, [filters]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        await loadUsers({ q: '', role: '', status: '' });
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Không thể tải danh sách tài khoản.'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [loadUsers]);

  const handleFilterChange = async (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value,
    };
    setFilters(nextFilters);
    setError('');
    setSuccessMessage('');
    await loadUsers(nextFilters);
  };

  const handleToggle = async (user, fieldName) => {
    try {
      setActionLoadingId(user.id);
      setError('');
      setSuccessMessage('');
      await axiosInstance.patch(`/auth/admin/users/${user.id}/update/`, {
        [fieldName]: !user[fieldName],
      });
      await loadUsers();
      setSuccessMessage('Đã cập nhật tài khoản thành công.');
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Không thể cập nhật tài khoản.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-500 mt-2">Admin có thể theo dõi, lọc và quản lý quyền hoặc trạng thái của tài khoản tại đây.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">Về trang khách</Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <label className="block md:col-span-1">
              <span className="text-sm font-medium text-gray-700">Tìm kiếm</span>
              <input
                type="text"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Tên đăng nhập, email, số điện thoại..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Vai trò</span>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Trạng thái</span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {successMessage && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Danh sách tài khoản</h2>

          {loading ? (
            <div className="p-8 text-center text-primary font-semibold">Đang tải danh sách tài khoản...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không có tài khoản nào phù hợp với bộ lọc hiện tại.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tài khoản</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Liên hệ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Đội bóng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-sm font-semibold text-primary">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover" />
                              ) : (
                                user.username.slice(0, 1).toUpperCase()
                              )}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-gray-400">Tham gia: {new Date(user.date_joined).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <p>{user.email || 'Chưa cập nhật email'}</p>
                          <p>{user.phone || 'Chưa cập nhật số điện thoại'}</p>
                          <p className="text-xs text-gray-400">{user.address || 'Chưa cập nhật địa chỉ'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              {user.team_image_url ? (
                                <img src={user.team_image_url} alt={user.team_name || user.username} className="h-full w-full object-cover" />
                              ) : (
                                'Team'
                              )}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">{user.team_name || 'Chưa tham gia đội bóng'}</p>
                              <p className="text-xs text-gray-400">Thông tin này sẽ được dùng cho bảng xếp hạng đội bóng tiêu biểu.</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.is_staff ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.is_staff ? 'Admin' : 'Người dùng'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              disabled={actionLoadingId === user.id || isSelf}
                              onClick={() => handleToggle(user, 'is_active')}
                              className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                            >
                              {user.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === user.id || isSelf}
                              onClick={() => handleToggle(user, 'is_staff')}
                              className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                            >
                              {user.is_staff ? 'Bỏ quyền admin' : 'Cấp quyền admin'}
                            </button>
                          </div>
                          {isSelf && <p className="mt-2 text-xs text-gray-400">Không thể tự sửa quyền hoặc khóa chính mình</p>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
