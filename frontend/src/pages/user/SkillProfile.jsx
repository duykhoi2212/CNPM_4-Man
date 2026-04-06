import { useEffect, useState } from 'react';
import { matchmakingAPI } from '../../api/matchmaking';

const skillLevelOptions = [
  { value: 'beginner', label: 'Yeu (Beginner)', description: 'Moi bat dau hoac choi chua toi 1 nam' },
  { value: 'intermediate', label: 'Trung Binh (Intermediate)', description: 'Choi duoc 1-3 nam, co ky nang co ban' },
  { value: 'advanced', label: 'Kha (Advanced)', description: 'Choi duoc 3-5 nam, co ky nang nang cao' },
  { value: 'professional', label: 'Tot (Professional)', description: 'Choi tren 5 nam hoac tham gia giai dau' },
];

const positions = [
  'Goalkeeper (Thu mon)',
  'Defender (Cau thu phong ngu)',
  'Midfielder (Cau thu trung tuyen)',
  'Forward (Cau thu tan cong)',
  'Any (Bat ky)',
];

const SkillProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    skill_level: 'beginner',
    team_name: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await matchmakingAPI.getProfile();
      setProfile(response.data);
      setFormData({
        skill_level: response.data.skill_level || 'beginner',
        team_name: response.data.team_name || '',
        bio: response.data.bio || '',
      });
    } catch (err) {
      setError('Loi tai profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await matchmakingAPI.updateProfile(formData);

      setSuccess('Cap nhat thanh cong!');
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Loi cap nhat profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Dang tai...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Ho So Doi Bong</h1>
          <p className="text-gray-600 mt-2">Cap nhat thong tin va trinh do cua doi bong cua ban</p>
        </div>

        {/* Stats Section */}
        {profile && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Danh Gia</p>
              <p className="text-3xl font-bold text-yellow-500">{profile.rating || 0} ⭐</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Tran Dau</p>
              <p className="text-3xl font-bold text-blue-500">{profile.total_matches || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Thang</p>
              <p className="text-3xl font-bold text-green-500">{profile.total_wins || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Hoa</p>
              <p className="text-3xl font-bold text-purple-500">{profile.total_draws || 0}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Skill Level */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Chon Trinh Do Khi Nang
              </label>
              <div className="space-y-3">
                {skillLevelOptions.map((option) => (
                  <label key={option.value} className="flex items-start cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition"
                    style={{
                      borderColor: formData.skill_level === option.value ? '#3b82f6' : '#e5e7eb',
                      backgroundColor: formData.skill_level === option.value ? '#eff6ff' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="skill_level"
                      value={option.value}
                      checked={formData.skill_level === option.value}
                      onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                      className="mt-1 w-4 h-4"
                    />
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Team Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tên Đội Bóng
              </label>
              <input
                type="text"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                placeholder="VD: FC VietNam, Real Madrid VN..."
                maxLength="100"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Gioi Thieu Ban Than
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Viet vi ct gioi thieu ban than, kinh nghiem, pong cach choi..."
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-32 focus:border-blue-500 focus:outline-none"
                maxLength="500"
              />
              <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500</p>
            </div>

            {/* Current Skill Info */}
            {profile && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Trinh Do Hien Tai:</span> {profile.skill_level_display || 'Chua dat'}
                </p>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                {saving ? 'Dang Luu...' : 'Luu Cap Nhat'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">Ghi Chu Quan Trong</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Trinh do kha nang se giup he thong tim doi bong phu hop cho ban</li>
            <li>• Danh gia va do thong ke da bong se tu dong cap nhat theo ket qua tran dau</li>
            <li>• Ten doi bong se duoc hien thi khi doi bong khac tim kiem</li>
            <li>• Dung gian doa hoac lang man trong ghi chu - co the bi cam hoat dong</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SkillProfile;
