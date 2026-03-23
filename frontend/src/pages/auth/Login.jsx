import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { setAuthSession } from '../../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login/', formData);
      setAuthSession({
        token: response.data.token,
        user: response.data.user,
      });
      window.dispatchEvent(new Event('auth-changed'));
      navigate(response.data.user.is_staff ? '/admin/dashboard' : '/pitches');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Dang nhap that bai. Vui long kiem tra lai thong tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem-136px)] bg-gray-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Dang nhap</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              type="text"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none transition"
              placeholder="Nhap username cua ban"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mat khau</label>
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type="password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60"
          >
            {loading ? 'Dang xu ly...' : 'Dang nhap'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Chua co tai khoan?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-teal-600">Dang ky ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
