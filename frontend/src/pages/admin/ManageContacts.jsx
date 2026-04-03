import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const statusOptions = [
  { value: '', label: 'Tat ca trang thai' },
  { value: 'pending', label: 'Chua xu ly' },
  { value: 'resolved', label: 'Da xu ly' },
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

const ManageContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadContacts = useCallback(async (nextFilters) => {
    const params = {};
    if (nextFilters.q.trim()) params.q = nextFilters.q.trim();
    if (nextFilters.status) params.status = nextFilters.status;

    const response = await axiosInstance.get('/contacts/admin/', { params });
    setContacts(response.data.results || response.data || []);
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        setError('');
        await loadContacts({ q: '', status: '' });
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Khong the tai danh sach lien he.'));
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [loadContacts]);

  const handleFilterChange = async (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value,
    };
    setFilters(nextFilters);
    setError('');
    setSuccessMessage('');
    await loadContacts(nextFilters);
  };

  const handleResolve = async (contact) => {
    try {
      setActionLoadingId(contact.id);
      setError('');
      setSuccessMessage('');
      await axiosInstance.patch(`/contacts/admin/${contact.id}/update/`, {
        is_resolved: !contact.is_resolved,
      });
      await loadContacts(filters);
      setSuccessMessage('Da cap nhat trang thai lien he thanh cong.');
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Khong the cap nhat lien he.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quan ly lien he</h1>
            <p className="text-gray-500 mt-2">Tong hop cac yeu cau ho tro va gop y ma khach hang gui tu trang lien he.</p>
          </div>
          <Link to="/contact" className="text-primary hover:underline">Xem trang lien he</Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Tim kiem</span>
              <input
                type="text"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Ten, email, chu de..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Trang thai</span>
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

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-lg bg-white p-8 text-center text-primary font-semibold shadow-sm">Dang tai danh sach lien he...</div>
          ) : contacts.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">Chua co yeu cau lien he nao phu hop.</div>
          ) : (
            contacts.map((contact) => (
              <article key={contact.id} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">{contact.subject}</h2>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${contact.is_resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {contact.status_label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Gui luc {new Date(contact.created_at).toLocaleString('vi-VN')}</p>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-semibold text-gray-900">Nguoi gui:</span> {contact.name}</p>
                      <p><span className="font-semibold text-gray-900">Email:</span> {contact.email}</p>
                      <p><span className="font-semibold text-gray-900">So dien thoai:</span> {contact.phone || 'Chua cung cap'}</p>
                    </div>

                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{contact.message}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResolve(contact)}
                    disabled={actionLoadingId === contact.id}
                    className="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                  >
                    {actionLoadingId === contact.id
                      ? 'Dang cap nhat...'
                      : contact.is_resolved
                        ? 'Danh dau chua xu ly'
                        : 'Danh dau da xu ly'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageContacts;
