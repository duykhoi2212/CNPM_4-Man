import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';

const emptyForm = {
  field: '',
  start_time: '',
  end_time: '',
  price: '',
  is_peak_hour: false,
  is_active: true,
};

const getReadableError = (responseData, fallbackMessage) => {
  if (!responseData) {
    return fallbackMessage;
  }

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData.error) {
    return responseData.error;
  }

  if (typeof responseData === 'object') {
    const firstEntry = Object.values(responseData)[0];
    if (Array.isArray(firstEntry)) {
      return firstEntry[0] || fallbackMessage;
    }
    if (typeof firstEntry === 'string') {
      return firstEntry;
    }
  }

  return fallbackMessage;
};

const ManageTimeslots = () => {
  const [fields, setFields] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const loadTimeslots = async (fieldId = selectedField) => {
    const response = await axiosInstance.get('/fields/timeslots/', {
      params: fieldId ? { field: fieldId } : {},
    });
    setTimeslots(response.data.results || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [fieldResponse, timeslotResponse] = await Promise.all([
          axiosInstance.get('/fields/'),
          axiosInstance.get('/fields/timeslots/'),
        ]);

        setFields(fieldResponse.data.results || []);
        setTimeslots(timeslotResponse.data.results || []);
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Khong the tai du lieu khung gio.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError('');
  };

  const handleFieldFilterChange = async (event) => {
    const fieldId = event.target.value;
    setSelectedField(fieldId);
    setError('');
    setSuccessMessage('');
    await loadTimeslots(fieldId);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTimeBlur = (event) => {
    const { name, value } = event.target;
    if (!value) {
      return;
    }

    const normalizedValue = value.trim();
    const isValidTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(normalizedValue);

    if (!isValidTime) {
      setFormError('Gio phai theo dinh dang 24h HH:MM, vi du 08:30 hoac 17:45.');
      return;
    }

    setFormError('');
    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));
  };

  const handleEdit = (timeslot) => {
    setEditingId(timeslot.id);
    setFormData({
      field: String(timeslot.field),
      start_time: timeslot.start_time,
      end_time: timeslot.end_time,
      price: timeslot.price,
      is_peak_hour: Boolean(timeslot.is_peak_hour),
      is_active: Boolean(timeslot.is_active),
    });
    setFormError('');
    setSuccessMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (timeslot) => {
    const shouldDelete = window.confirm(`Ban co chac muon xoa khung gio ${timeslot.start_time} - ${timeslot.end_time} khong?`);
    if (!shouldDelete) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await axiosInstance.delete(`/fields/timeslots/${timeslot.id}/`);
      await loadTimeslots();
      if (editingId === timeslot.id) {
        resetForm();
      }
      setSuccessMessage('Da xoa khung gio thanh cong.');
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Khong the xoa khung gio.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const payload = {
        ...formData,
        field: Number(formData.field),
        price: Number(formData.price),
      };

      if (isEditing) {
        await axiosInstance.patch(`/fields/timeslots/${editingId}/`, payload);
        setSuccessMessage('Cap nhat khung gio thanh cong.');
      } else {
        await axiosInstance.post('/fields/timeslots/', payload);
        setSuccessMessage('Them khung gio moi thanh cong.');
      }

      await loadTimeslots();
      resetForm();
    } catch (requestError) {
      setFormError(getReadableError(requestError.response?.data, 'Khong the luu khung gio.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quan ly khung gio</h1>
            <p className="text-gray-500 mt-2">Admin co the them, sua, xoa va bat tat khung gio theo tung san.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">Ve trang khach</Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Chinh sua khung gio' : 'Them khung gio moi'}</h2>
            {isEditing && (
              <button type="button" onClick={resetForm} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Huy chinh sua
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">San bong</span>
              <select
                name="field"
                value={formData.field}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Chon san</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Gia</span>
              <input
                type="number"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Gio bat dau</span>
              <input
                type="text"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                inputMode="numeric"
                placeholder="08:30"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Gio ket thuc</span>
              <input
                type="text"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                onBlur={handleTimeBlur}
                inputMode="numeric"
                placeholder="09:30"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                name="is_peak_hour"
                checked={formData.is_peak_hour}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Gio cao diem</span>
            </label>

            <label className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Dang hoat dong</span>
            </label>

            {formError && (
              <div className="md:col-span-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="md:col-span-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
              >
                {submitting ? 'Dang luu...' : isEditing ? 'Cap nhat khung gio' : 'Them khung gio'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Dat lai
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Danh sach khung gio</h2>
            <label className="block md:w-72">
              <span className="text-sm font-medium text-gray-700">Loc theo san</span>
              <select
                value={selectedField}
                onChange={handleFieldFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Tat ca san</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="p-8 text-center text-primary font-semibold">Dang tai danh sach khung gio...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : timeslots.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chua co khung gio nao.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">San</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khung gio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loai</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trang thai</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeslots.map((timeslot) => (
                    <tr key={timeslot.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{timeslot.field_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{timeslot.start_time} - {timeslot.end_time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{Number(timeslot.price).toLocaleString('vi-VN')} d</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${timeslot.is_peak_hour ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                          {timeslot.is_peak_hour ? 'Cao diem' : 'Thuong'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${timeslot.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {timeslot.is_active ? 'Hoat dong' : 'Tam dung'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(timeslot)}
                            className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Sua
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(timeslot)}
                            className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                          >
                            Xoa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTimeslots;
