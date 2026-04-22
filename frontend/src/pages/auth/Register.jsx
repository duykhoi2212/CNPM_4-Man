import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { setAuthSession } from '../../utils/auth';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    password2: '',
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
      const response = await axiosInstance.post('/auth/register/', formData);
      setAuthSession({
        token: response.data.token,
        user: response.data.user,
      });
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/pitches');
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data && typeof data === 'object') {
        const firstMessage = Object.values(data).flat().join(' ');
        setError(firstMessage || 'Đăng ký thất bại.');
      } else {
        setError('Đăng ký thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem-136px)] bg-gray-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Đăng ký tài khoản</h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
            <input name="username" value={formData.username} onChange={handleChange} type="text" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="hau123" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} type="text" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="Tran" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} type="text" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="Hau" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="0901234567" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" value={formData.email} onChange={handleChange} type="email" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="email@example.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input name="address" value={formData.address} onChange={handleChange} type="text" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="43 Ca Mau" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input name="password" value={formData.password} onChange={handleChange} type="password" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="••••••••" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
            <input name="password2" value={formData.password2} onChange={handleChange} type="password" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" placeholder="••••••••" required />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-teal-600 focus:outline-none disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-teal-600">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
