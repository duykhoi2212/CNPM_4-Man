import { useEffect, useLayoutEffect, useState } from 'react';
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
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search
  useLayoutEffect(() => {
    let cancelled = false;
    setPitches([]);
    setLoading(true);
    setError('');
    const fetchPitches = async () => {
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        const response = await axiosInstance.get('/fields/', { params });
        if (!cancelled) setPitches(response.data.results || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.data?.error || 'Khong the tai danh sach san.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const debounce = setTimeout(fetchPitches, 300);
    return () => { cancelled = true; clearTimeout(debounce); };
  }, [searchTerm]);

  const filteredPitches = pitches.filter((pitch) => {
    if (activeFilter === 'ALL') return true;
    return pitch.field_type?.id === activeFilter;
  });

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setNearbyError('Trinh duyet khong ho tro lay vi tri.');
      return;
    }
    setLocating(true);
    setNearbyError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          const response = await axiosInstance.get('/fields/nearby/', {
            params: { latitude: loc.lat, longitude: loc.lng, radius_km: radiusKm, limit: 12 },
          });
          setNearbyPitches(response.data.results || []);
        } catch (requestError) {
          setNearbyError(requestError.response?.data?.error || 'Khong the tim san gan ban.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setNearbyError('Khong the lay vi tri. Vui long cap quyen.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchNearby = async () => {
    if (!userLocation) return;
    try {
      setLocating(true);
      setNearbyError('');
      const response = await axiosInstance.get('/fields/nearby/', {
        params: { latitude: userLocation.lat, longitude: userLocation.lng, radius_km: radiusKm, limit: 12 },
      });
      setNearbyPitches(response.data.results || []);
    } catch (requestError) {
      setNearbyError(requestError.response?.data?.error || 'Khong the tim san gan ban.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Danh sach san bong</h2>

      {/* Nearby Section */}
      <div className="mb-10 rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Nearby fields</p>
            <h3 className="mt-2 text-2xl font-black text-gray-950">Tim san gan vi tri cua ban</h3>
            <p className="mt-3 text-gray-600 leading-7">
              Cho phep truy cap vi tri de xem nhanh cac san. Giup ban chon san nhanh hon khi khong nho ro ten san.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!userLocation && (
              <button type="button" onClick={handleFindNearby} disabled={locating}
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {locating ? 'Dang tim...' : '📍 Tim san gan toi'}
              </button>
            )}
            {userLocation && (
              <button type="button" onClick={handleSearchNearby} disabled={locating}
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {locating ? 'Dang tim...' : '🔍 Tim lai'}
              </button>
            )}
          </div>
        </div>

        {userLocation && (
          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Ban kinh:</span>
            <div className="flex gap-2">
              {[3, 5, 10, 20, 50].map((r) => (
                <button key={r} onClick={() => { setRadiusKm(r); if (userLocation) handleSearchNearby(); }}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${radiusKm === r ? 'bg-primary text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
                  {r} km
                </button>
              ))}
            </div>
          </div>
        )}

        {nearbyError && (
          <div className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{nearbyError}</div>
        )}

        {userLocation && nearbyPitches.length === 0 && !nearbyError && !locating && (
          <div className="mt-5 rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3">
            <p className="text-yellow-800 font-medium">Khong co san nao trong ban kinh {radiusKm}km.</p>
            <p className="text-yellow-600 text-sm mt-1">Co the cac san chua duoc cap nhat toa do.</p>
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
                  <Link to={`/pitches/${pitch.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">
                    Xem chi tiet
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="max-w-xl mx-auto relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" placeholder="Tim theo ten san hoac dia chi..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center mb-8 space-x-2 sm:space-x-4 flex-wrap gap-y-2">
        <button onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-md transition ${activeFilter === 'ALL' ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
          Tat ca
        </button>
        {[...new Map(pitches.map((pitch) => [pitch.field_type?.id, pitch.field_type])).values()]
          .filter(Boolean)
          .map((type) => (
            <button key={type.id} onClick={() => setActiveFilter(type.id)}
              className={`px-4 py-2 rounded-md transition ${activeFilter === type.id ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
              {type.name}
            </button>
          ))}
      </div>

      {/* Pitch Grid */}
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
                  <p className="text-primary font-bold text-xl">{formatMoney(pitch.price_per_hour)}</p>
                  <span className="text-sm text-yellow-600 font-medium">{pitch.avg_rating} / 5</span>
                </div>
                <Link to={`/pitches/${pitch.id}`}
                  className="block w-full text-center bg-teal-50 hover:bg-primary hover:text-white text-primary font-semibold py-2 rounded-md transition duration-200">
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
