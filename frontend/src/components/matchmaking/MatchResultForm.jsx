import { useState } from 'react';
import { matchmakingAPI } from '../../api/matchmaking';

const MatchResultForm = ({ match, onClose, onSuccess }) => {
  const [result, setResult] = useState('pending');
  const [score, setScore] = useState({
    my_goals: 0,
    opponent_goals: 0,
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resultOptions = [
    { value: 'win', label: 'Toi Thang' },
    { value: 'loss', label: 'Toi Thua' },
    { value: 'draw', label: 'Hoa' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      await matchmakingAPI.recordMatchResult(match.id, {
        match_result: result,
        my_goals: parseInt(score.my_goals),
        opponent_goals: parseInt(score.opponent_goals),
        notes,
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Loi ghi ket qua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ghi Ket Qua Tran Dau</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Match Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">Tran Dau:</p>
            <p className="font-semibold text-gray-900">
              {match.requester.first_name} vs {match.opponent.first_name}
            </p>
            <p className="text-xs text-gray-500 mt-1">{match.scheduled_date} {match.scheduled_time_start}</p>
          </div>

          {/* Score Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Ty So</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  value={score.my_goals}
                  onChange={(e) => setScore({ ...score, my_goals: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-center text-2xl font-bold"
                />
                <p className="text-xs text-gray-600 text-center mt-1">Ban</p>
              </div>

              <span className="text-2xl font-bold text-gray-900">-</span>

              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  value={score.opponent_goals}
                  onChange={(e) => setScore({ ...score, opponent_goals: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-center text-2xl font-bold"
                />
                <p className="text-xs text-gray-600 text-center mt-1">Doi Thu</p>
              </div>
            </div>
          </div>

          {/* Result Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Ket Qua</label>
            <div className="space-y-2">
              {resultOptions.map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value={option.value}
                    checked={result === option.value}
                    onChange={(e) => setResult(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-gray-900 font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">Ghi Chu (Tuy Chon)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhan xet ve tran dau..."
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 h-20"
              maxLength="200"
            />
            <p className="text-xs text-gray-500">{notes.length}/200</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              {loading ? 'Dang Luu...' : 'Luu Ket Qua'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition"
            >
              Huy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchResultForm;
