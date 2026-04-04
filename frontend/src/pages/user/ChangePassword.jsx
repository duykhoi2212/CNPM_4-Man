import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { getStoredUser, setAuthSession } from '../../utils/auth';

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

const ChangePassword = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axiosInstance.post('/auth/change-password/', formData);

      setAuthSession({
        token: response.data.token,
        user: {
          ...storedUser,
          ...(response.data.user || {}),
        },
      });
      window.dispatchEvent(new Event('auth-changed'));

      setSuccessMessage('Doi mat khau thanh cong. He thong da cap nhat phien dang nhap moi cho ban.');
      setFormData({ old_password: '', new_password: '', new_password2: '' });

      setTimeout(() => {
        navigate('/profile');
      }, 1200);
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Khong the doi mat khau.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Doi mat khau</h2>
            <p className="mt-2 text-gray-500">
              Cap nhat mat khau moi de bao ve tai khoan cua ban. Sau khi doi thanh cong, he thong se giu ban dang nhap voi token moi.
            </p>
          </div>
          <Link to="/profile" className="text-primary font-semibold hover:underline">
            Quay lai ho so
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-sm font-medium text-gray-700">
            Mat khau hien tai
            <input
              type="password"
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Mat khau moi
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Xac nhan mat khau moi
            <input
              type="password"
              name="new_password2"
              value={formData.new_password2}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              required
            />
          </label>

          <div className="rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-600">
            Goi y: mat khau nen co it nhat 8 ky tu, bao gom chu hoa, chu thuong, so va ky tu dac biet de tang do an toan.
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {successMessage && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
          >
            {submitting ? 'Dang doi mat khau...' : 'Cap nhat mat khau'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
