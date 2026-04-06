import { useEffect, useState } from 'react';
import { matchmakingAPI } from '../../api/matchmaking';

const skillLevelColors = {
  beginner: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-green-100 text-green-800',
  advanced: 'bg-purple-100 text-purple-800',
  professional: 'bg-red-100 text-red-800',
};

const skillLevelLabels = {
  beginner: 'Yếu',
  intermediate: 'Trung bình',
  advanced: 'Khá',
  professional: 'Tốt',
};

const FindOpponent = () => {
  const [myRequest, setMyRequest] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    preferred_skill_level: 'any',
    min_rating: 0,
    notes: '',
  });
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);

  // Fetch current request and suggestions
  useEffect(() => {
    fetchMyRequest();
    fetchMatches();
  }, []);

  const fetchMyRequest = async () => {
    try {
      setLoading(true);
      const response = await matchmakingAPI.getMyCurrentRequest();
      setMyRequest(response.data);
      if (response.data.id) {
        fetchSuggestions();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching request');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await matchmakingAPI.getSuggestions();
      setSuggestions(response.data);
    } catch (err) {
      // Silently fail- suggestions might not be available
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await matchmakingAPI.getMyMatches();
      setMatches(response.data.results || response.data);
    } catch (err) {
      // Silently fail
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await matchmakingAPI.createOrUpdateRequest(formData);
      setMyRequest(response.data.request);
      setSuggestions([]);
      setShowForm(false);
      setError('');
      fetchSuggestions();
      fetchMatches();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating request');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async () => {
    try {
      setLoading(true);
      const response = await matchmakingAPI.updateMyRequest(formData);
      setMyRequest(response.data.data);
      setError('');
      fetchSuggestions();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (window.confirm('Ban chac chan muon huy yeu cau?')) {
      try {
        await matchmakingAPI.cancelMyRequest();
        setMyRequest(null);
        setSuggestions([]);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Error cancelling request');
      }
    }
  };

  const handleSelectOpponent = async (opponentId) => {
    try {
      const response = await matchmakingAPI.createMatch({
        opponent_id: opponentId,
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time_start: '19:00',
        scheduled_time_end: '20:00',
      });
      alert('Match tao thanh cong! Dang cho doi bong xac nhan.');
      fetchMatches();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating match');
    }
  };

  const handleConfirmMatch = async (matchId) => {
    try {
      await matchmakingAPI.confirmMatch(matchId);
      alert('Match da duoc xac nhan!');
      fetchMatches();
    } catch (err) {
      alert(err.response?.data?.error || 'Error confirming match');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Tim Doi Bong</h1>
          <p className="text-gray-600 mt-2">Tim va tham gia tran dau voi cac doi bong khac</p>
        </div>

        {/* My Request Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Yeu Cau Tim Doi Bong</h2>

          {myRequest ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Trang Thai: <span className="font-semibold">{myRequest.status_display}</span></p>
                  <p className="text-sm text-gray-500 mt-1">Het han: {new Date(myRequest.expires_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Trinh Do Theo Yeu Cau</p>
                  <p className="font-semibold">{myRequest.preferred_skill_level_display}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Danh Gia Toi Thieu</p>
                  <p className="font-semibold">{myRequest.min_rating} sao</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Ghi Chu</p>
                <p className="text-gray-900">{myRequest.notes || 'Khong co'}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowForm(true);
                    setFormData({
                      preferred_skill_level: myRequest.preferred_skill_level,
                      min_rating: myRequest.min_rating,
                      notes: myRequest.notes,
                    });
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Cap Nhat
                </button>
                <button
                  onClick={handleCancelRequest}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Huy
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Ban chua tao yeu cau tim doi bong nao. Hay tao yeu cau moi!</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
              >
                Tao Yeu Cau Moi
              </button>
            </div>
          )}
        </div>

        {/* Create/Update Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {myRequest ? 'Cap Nhat Yeu Cau' : 'Tao Yeu Cau Moi'}
            </h3>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trinh Do Theo Yeu Cau
                </label>
                <select
                  value={formData.preferred_skill_level}
                  onChange={(e) => setFormData({ ...formData, preferred_skill_level: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="any">Bat Ky</option>
                  <option value="beginner">Yeu</option>
                  <option value="intermediate">Trung Binh</option>
                  <option value="advanced">Kha</option>
                  <option value="professional">Tot</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh Gia Toi Thieu
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={formData.min_rating}
                  onChange={(e) => setFormData({ ...formData, min_rating: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi Chu
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24"
                  placeholder="VD: Looking for competitive match..."
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:bg-gray-400"
                >
                  {loading ? 'Dang Xu Ly...' : myRequest ? 'Cap Nhat' : 'Tao'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg"
                >
                  Huy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Goi Y Doi Bong Phu Hop</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((player) => (
                <div key={player.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                  <div className="mb-3">
                    <h3 className="font-bold text-lg">{player.first_name} {player.last_name}</h3>
                    <p className="text-sm text-gray-600">@{player.username}</p>
                  </div>

                  {player.profile && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${skillLevelColors[player.profile.skill_level] || 'bg-gray-100'}`}>
                          {skillLevelLabels[player.profile.skill_level] || player.profile.skill_level}
                        </span>
                      </div>

                          {player.profile.team_name && (
                            <p className="text-sm font-semibold text-blue-600">Đội: {player.profile.team_name}</p>
                          )}

                          <div>
                            <p className="text-sm text-gray-600">Danh Gia: <span className="font-semibold">{player.profile.rating} ⭐</span></p>
                            <p className="text-sm text-gray-600">Tran Dau: {player.profile.total_matches}</p>
                            <p className="text-sm text-gray-600">Thang: {player.profile.total_wins}</p>
                          </div>

                          {player.win_rate > 0 && (
                            <p className="text-sm text-green-600 font-semibold">Win Rate: {player.win_rate}%</p>
                          )}

                          {player.profile.bio && (
                            <p className="text-sm text-gray-600 italic">"{player.profile.bio}"</p>
                          )}
                        </div>
                      )}

                  <button
                    onClick={() => handleSelectOpponent(player.id)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Tao Match
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matches Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Cac Tran Dau Cua Doi Bong</h2>
            <button
              onClick={() => setShowMatches(!showMatches)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              {showMatches ? 'An' : 'Hien Thi'}
            </button>
          </div>

          {showMatches && (
            <div>
              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Tran Dau</p>
                          <p className="font-semibold">
                            {match.requester.first_name} vs {match.opponent.first_name}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Trang Thai</p>
                          <p className="font-semibold">{match.status_display}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Thoi Gian</p>
                          <p className="font-semibold">{match.scheduled_date} {match.scheduled_time_start}</p>
                        </div>
                      </div>

                      {match.status === 'pending_confirmation' && (
                        <button
                          onClick={() => handleConfirmMatch(match.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Xac Nhan Match
                        </button>
                      )}

                      {match.status === 'confirmed' && !match.match_result && (
                        <p className="text-blue-600 text-sm">Cho tran dau dien ra...</p>
                      )}

                      {match.match_result && (
                        <p className="text-green-600 font-semibold">{match.match_result_display}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Doi bong cua ban chua co tran dau nao</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindOpponent;
