import { useState } from 'react';
import axiosInstance from '../../api/axios';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} d`;

const AlternativeFieldFinder = ({ incidentId, onAlternativeSelected }) => {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [error, setError] = useState('');

  const handleFindAlternatives = async () => {
    if (!incidentId) {
      setError('Vui long chon mot su co de tim san thay the.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.post(`/fields/swaps/find-alternative/${incidentId}/`);
      setAlternatives(response.data.alternatives || []);
    } catch (requestError) {
      setAlternatives([]);
      setError(requestError.response?.data?.error || 'Khong the tim san thay the.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">AlternativeFieldFinder</h3>
          <p className="text-sm text-gray-500 mt-1">Tim san thay the gan nhat cho su co dang chon.</p>
        </div>
        <button
          type="button"
          onClick={handleFindAlternatives}
          disabled={loading || !incidentId}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Dang tim...' : 'Tim san thay the'}
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {alternatives.length > 0 && (
        <div className="space-y-3">
          {alternatives.map((item) => (
            <div key={item.field_id} className="rounded-lg border border-green-100 bg-green-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{item.field_name}</p>
                  <p className="text-sm text-gray-600">{item.location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Khoang cach: {item.distance_km ?? 'N/A'} km - Slot trong: {item.available_slots}/{item.required_slots}
                  </p>
                </div>
                <div className="text-sm text-gray-700">
                  <p>Tong gia: <span className="font-semibold">{formatMoney(item.total_price)}</span></p>
                  <p>Chenh lech: <span className="font-semibold">{formatMoney(item.price_difference)}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAlternativeSelected?.(item)}
                className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600"
              >
                Chon san nay
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlternativeFieldFinder;
