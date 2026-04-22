import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { getStoredUser, updateStoredUser } from '../../utils/auth';

const Profile = () => {
  const storedUser = useMemo(() => getStoredUser(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [teamImagePreview, setTeamImagePreview] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    avatar: null,
    currentAvatarUrl: '',
    team_name: '',
    team_image: null,
    currentTeamImageUrl: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/auth/profile/');
        setFormData({
          username: response.data.username || '',
          email: response.data.email || '',
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          phone: response.data.profile?.phone || '',
          address: response.data.profile?.address || '',
          avatar: null,
          currentAvatarUrl: response.data.profile?.avatar_url || '',
          team_name: response.data.profile?.team_name || '',
          team_image: null,
          currentTeamImageUrl: response.data.profile?.team_image_url || '',
        });
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Không thể tải thông tin tài khoản.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!formData.avatar) {
      setAvatarPreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(formData.avatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [formData.avatar]);

  useEffect(() => {
    if (!formData.team_image) {
      setTeamImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(formData.team_image);
    setTeamImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [formData.team_image]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = new FormData();
      payload.append('email', formData.email);
      payload.append('first_name', formData.first_name);
      payload.append('last_name', formData.last_name);
      payload.append('phone', formData.phone);
      payload.append('address', formData.address);
      payload.append('team_name', formData.team_name);
      if (formData.avatar) {
        payload.append('avatar', formData.avatar);
      }
      if (formData.team_image) {
        payload.append('team_image', formData.team_image);
      }

      const response = await axiosInstance.patch('/auth/profile/update/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = {
        ...storedUser,
        username: response.data.user.username,
        email: response.data.user.email,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        phone: response.data.user.profile?.phone || '',
        avatar_url: response.data.user.profile?.avatar_url || null,
        team_name: response.data.user.profile?.team_name || '',
        team_image_url: response.data.user.profile?.team_image_url || null,
        is_staff: storedUser?.is_staff || false,
        is_superuser: storedUser?.is_superuser || false,
      };
      updateStoredUser(updatedUser);
      window.dispatchEvent(new Event('auth-changed'));

      setFormData((prev) => ({
        ...prev,
        avatar: null,
        currentAvatarUrl: response.data.user.profile?.avatar_url || '',
        team_image: null,
        currentTeamImageUrl: response.data.user.profile?.team_image_url || '',
      }));
      setSuccessMessage('Thong tin tai khoan da duoc cap nhat thanh cong.');
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (responseData?.error) {
        setError(responseData.error);
      } else if (responseData && typeof responseData === 'object') {
        const firstMessage = Object.values(responseData).flat()[0];
        setError(firstMessage || 'Không thể cập nhật tài khoản.');
      } else {
        setError('Không thể cập nhật tài khoản.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-primary font-semibold">Đang tải thông tin tài khoản...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Thong tin tai khoan</h2>
            <p className="mt-2 text-gray-500">Bạn có thể cập nhật thông tin cá nhân, avatar và quản lý bảo mật tại đây.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/change-password" className="rounded-md border border-primary px-4 py-2 font-semibold text-primary hover:bg-teal-50">
              Doi mat khau
            </Link>
            <Link to={storedUser?.is_staff ? '/admin/pitches' : '/pitches'} className="text-primary font-semibold hover:underline">
              {storedUser?.is_staff ? 'Về khu quản lý' : 'Về danh sách sân'}
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-1/3 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {(avatarPreview || formData.currentAvatarUrl) ? (
                  <img
                    src={avatarPreview || formData.currentAvatarUrl}
                    alt={formData.username}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-teal-100 text-6xl font-bold text-primary">
                    {(formData.username || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <label className="block text-sm font-medium text-gray-700">
                Avatar moi
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleChange}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-sm"
                />
              </label>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {(teamImagePreview || formData.currentTeamImageUrl) ? (
                  <img
                    src={teamImagePreview || formData.currentTeamImageUrl}
                    alt={formData.team_name || 'team'}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-100 text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Chưa có ảnh đại diện
                  </div>
                )}
              </div>

              <label className="block text-sm font-medium text-gray-700">
                Anh doi bong
                <input
                  type="file"
                  name="team_image"
                  accept="image/*"
                  onChange={handleChange}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Username
                <input
                  type="text"
                  value={formData.username}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Ho
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Ten
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                So dien thoai
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Ten doi bong
                <input
                  type="text"
                  name="team_name"
                  value={formData.team_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                  placeholder="VD: Blue Storm FC"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Dia chi
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {successMessage && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
          >
            {saving ? 'Đang cập nhật...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
