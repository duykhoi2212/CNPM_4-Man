import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} d`;

const PitchList = () => {
  const [pitches, setPitches] = useState([]);
  const [nearbyPitches, setNearbyPitches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [nearbyError, setNearbyError] = useState('');

  useEffect(() => {
    const fetchPitches = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/fields/');
        setPitches(response.data.results || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai danh sach san.');
      } finally {
        setLoading(false);
      }
    };

    fetchPitches();
  }, []);

  const filteredPitches = pitches.filter((pitch) => {
    if (activeFilter === 'ALL') return true;
    return pitch.field_type?.id === activeFilter;
  });

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setNearbyError('Trinh duyet hien tai khong ho tro lay vi tri.');
      return;
    }

    setLocating(true);
    setNearbyError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await axiosInstance.get('/fields/nearby/', {
            params: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              radius_km: 10,
              limit: 6,
            },
          });
          setNearbyPitches(response.data.results || []);
        } catch (requestError) {
          setNearbyError(requestError.response?.data?.error || 'Khong the tim san gan ban luc nay.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setNearbyError('Khong the lay vi tri hien tai. Vui long kiem tra quyen truy cap vi tri.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Danh sach san bong</h2>

      <div className="mb-10 rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Nearby fields</p>
            <h3 className="mt-2 text-2xl font-black text-gray-950">Tim san gan vi tri cua ban</h3>
            <p className="mt-3 text-gray-600 leading-7">
              Cho phep truy cap vi tri de xem nhanh cac san trong ban kinh 10km. Tinh nang nay giup ban chon san nhanh hon khi khong nho ro ten san.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFindNearby}
            disabled={locating}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {locating ? 'Dang tim san gan ban...' : 'Tim san gan toi'}
          </button>
        </div>

        {nearbyError && (
          <div className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {nearbyError}
          </div>
        )}

        {nearbyPitches.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {nearbyPitches.map((pitch) => (
              <article key={`nearby-${pitch.id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-950">{pitch.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">{pitch.field_type?.name || 'Loai san'}</p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-primary">
                    {pitch.distance_km} km
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-500">{pitch.location}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-primary">{formatMoney(pitch.price_per_hour)}</span>
                  <Link
                    to={`/pitches/${pitch.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                  >
                    Xem chi tiet
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mb-8 space-x-2 sm:space-x-4 flex-wrap gap-y-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-md transition ${activeFilter === 'ALL' ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Tat ca
        </button>
        {[...new Map(pitches.map((pitch) => [pitch.field_type?.id, pitch.field_type])).values()]
          .filter(Boolean)
          .map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              className={`px-4 py-2 rounded-md transition ${activeFilter === type.id ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
            >
              {type.name}
            </button>
          ))}
      </div>

      {loading ? (
        <div className="text-center text-primary text-xl py-12 font-bold animate-pulse">Dang tai danh sach san...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12 font-medium">{error}</div>
      ) : filteredPitches.length === 0 ? (
        <div className="text-center text-gray-500 py-12">Chua co san bong nao trong he thong.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPitches.map((pitch) => (
            <div key={pitch.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img
                src={pitch.primary_image || `https://via.placeholder.com/400x250/14b8a6/ffffff?text=${encodeURIComponent(pitch.name)}`}
                alt={pitch.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pitch.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{pitch.field_type?.name || 'Loai san'}</p>
                <p className="text-sm text-gray-500 mb-3">{pitch.location || 'Chua cap nhat dia chi'}</p>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-primary font-bold text-xl">
                    {formatMoney(pitch.price_per_hour)}
                  </p>
                  <span className="text-sm text-yellow-600 font-medium">
                    {pitch.avg_rating} / 5
                  </span>
                </div>

                <Link
                  to={`/pitches/${pitch.id}`}
                  className="block w-full text-center bg-teal-50 hover:bg-primary hover:text-white text-primary font-semibold py-2 rounded-md transition duration-200"
                >
                  Xem chi tiet
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PitchList;
