import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const emptyForm = {
  name: '',
  code: '',
  unit_label: 'chai',
  unit_price: '',
  sort_order: '0',
  is_active: true,
};

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

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadServices = useCallback(async () => {
    const response = await axiosInstance.get('/bookings/services/products/admin/');
    setServices(response.data.results || response.data || []);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        await loadServices();
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Không thể tải danh sách dịch vụ.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadServices]);

  const filteredServices = useMemo(() => {
    let result = [...services];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          String(item.name || '').toLowerCase().includes(query)
          || String(item.code || '').toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      const active = filterStatus === 'active';
      result = result.filter((item) => Boolean(item.is_active) === active);
    }

    return result;
  }, [services, searchQuery, filterStatus]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      const payload = {
        name: formData.name,
        code: formData.code,
        unit_label: formData.unit_label,
        unit_price: Number(formData.unit_price || 0),
        sort_order: Number(formData.sort_order || 0),
        is_active: Boolean(formData.is_active),
      };

      if (editingId) {
        await axiosInstance.put(`/bookings/services/products/admin/${editingId}/`, payload);
        setSuccessMessage('Đã cập nhật dịch vụ thành công.');
      } else {
        await axiosInstance.post('/bookings/services/products/admin/', payload);
        setSuccessMessage('Đã tạo dịch vụ mới thành công.');
      }

      await loadServices();
      resetForm();
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Không thể lưu dịch vụ.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service) => {
    setError('');
    setSuccessMessage('');
    setEditingId(service.id);
    setFormData({
      name: service.name || '',
      code: service.code || '',
      unit_label: service.unit_label || 'chai',
      unit_price: service.unit_price || '',
      sort_order: String(service.sort_order || 0),
      is_active: Boolean(service.is_active),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (service) => {
    const shouldDelete = window.confirm(`Bạn có chắc muốn xóa dịch vụ \"${service.name}\" không?`);
    if (!shouldDelete) return;

    try {
      setActionLoadingId(service.id);
      setError('');
      setSuccessMessage('');
      await axiosInstance.delete(`/bookings/services/products/admin/${service.id}/`);
      await loadServices();
      if (editingId === service.id) resetForm();
      setSuccessMessage('Đã xóa dịch vụ thành công.');
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Không thể xóa dịch vụ.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý dịch vụ kèm</h1>
            <p className="mt-2 text-gray-500">Tạo và cập nhật giá dịch vụ để hiển thị trong trang thanh toán.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">Về trang khách</Link>
        </div>

        <AdminNav />

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            {editingId ? `Chỉnh sửa dịch vụ #${editingId}` : 'Thêm dịch vụ mới'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Tên dịch vụ</span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Mã dịch vụ</span>
              <input
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="drink_water_bottle"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Đơn vị tính</span>
              <input
                name="unit_label"
                value={formData.unit_label}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Đơn giá (VND)</span>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                min="0"
                step="1000"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Thứ tự hiển thị</span>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleChange}
                min="0"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="mt-7 inline-flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Đang kinh doanh
            </label>

            <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Đang lưu...' : (editingId ? 'Lưu cập nhật' : 'Thêm dịch vụ')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </form>

          {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {successMessage && <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold text-gray-900">Danh sách dịch vụ</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc mã dịch vụ"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary md:w-72"
              />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang kinh doanh</option>
                <option value="inactive">Tạm ngừng</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center font-semibold text-primary">Đang tải danh sách dịch vụ...</div>
          ) : filteredServices.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Không có dịch vụ nào phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên dịch vụ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Mã</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Đơn giá</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Đơn vị</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Thứ tự</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredServices.map((service) => (
                    <tr key={service.id}>
                      <td className="px-4 py-4 font-medium text-gray-900">{service.name}</td>
                      <td className="px-4 py-4 text-gray-600">{service.code}</td>
                      <td className="px-4 py-4 text-gray-700">{formatMoney(service.unit_price)}</td>
                      <td className="px-4 py-4 text-gray-600">/{service.unit_label}</td>
                      <td className="px-4 py-4 text-gray-600">{service.sort_order}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                          {service.is_active ? 'Đang kinh doanh' : 'Tạm ngừng'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(service)}
                            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === service.id}
                            onClick={() => handleDelete(service)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionLoadingId === service.id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ManageServices;
