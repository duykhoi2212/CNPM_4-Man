<<<<<<< HEAD
import { useEffect, useLayoutEffect, useState } from 'react';
=======
import { useEffect, useState, useMemo } from 'react';
>>>>>>> origin/dev
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const formatTime = (value) => (value ? String(value).slice(0, 5) : '--:--');

const PitchList = () => {
  const [pitches, setPitches] = useState([]);
  const [nearbyPitches, setNearbyPitches] = useState([]);
  const [fieldTypes, setFieldTypes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [nearbyError, setNearbyError] = useState('');
<<<<<<< HEAD
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
=======
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('-avg_rating');
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
>>>>>>> origin/dev

  // Debounced search
  useLayoutEffect(() => {
    let cancelled = false;
    setPitches([]);
    setLoading(true);
    setError('');
    const fetchPitches = async () => {
      try {
<<<<<<< HEAD
        const params = {};
        if (searchTerm) params.search = searchTerm;
        const response = await axiosInstance.get('/fields/', { params });
        if (!cancelled) setPitches(response.data.results || []);
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.data?.error || 'Khong the tai danh sach san.');
=======
        setLoading(true);
        const [pitchesResponse, typesResponse] = await Promise.all([
          axiosInstance.get('/fields/'),
          axiosInstance.get('/fields/types/'),
        ]);
        setPitches(pitchesResponse.data.results || []);
        setFieldTypes(typesResponse.data.results || typesResponse.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Không thể tải danh sách sân.');
>>>>>>> origin/dev
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const debounce = setTimeout(fetchPitches, 300);
    return () => { cancelled = true; clearTimeout(debounce); };
  }, [searchTerm]);

  // Lọc và sắp xếp sân
  const filteredPitches = useMemo(() => {
    let result = [...pitches];

    if (activeFilter !== 'ALL') {
      result = result.filter((pitch) => pitch.field_type?.id === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pitch) =>
          pitch.name?.toLowerCase().includes(query) ||
          pitch.location?.toLowerCase().includes(query)
      );
    }

    if (priceRange.min !== '') {
      result = result.filter((pitch) => pitch.price_per_hour >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      result = result.filter((pitch) => pitch.price_per_hour <= Number(priceRange.max));
    }

    if (minRating !== '') {
      result = result.filter((pitch) => pitch.avg_rating >= Number(minRating));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price_per_hour - b.price_per_hour;
        case 'price_desc':
          return b.price_per_hour - a.price_per_hour;
        case 'rating_desc':
          return b.avg_rating - a.avg_rating;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'distance_asc':
          if (userLocation && a.distance_km !== undefined && b.distance_km !== undefined) {
            return a.distance_km - b.distance_km;
          }
          return 0;
        default:
          return b.avg_rating - a.avg_rating;
      }
    });

    return result;
  }, [pitches, activeFilter, searchQuery, priceRange, minRating, sortBy, userLocation]);

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
<<<<<<< HEAD
      setNearbyError('Trinh duyet khong ho tro lay vi tri.');
=======
      setNearbyError('Trình duyệt hiện tại không hỗ trợ lấy vị trí.');
>>>>>>> origin/dev
      return;
    }
    setLocating(true);
    setNearbyError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
<<<<<<< HEAD
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          const response = await axiosInstance.get('/fields/nearby/', {
            params: { latitude: loc.lat, longitude: loc.lng, radius_km: radiusKm, limit: 12 },
          });
          setNearbyPitches(response.data.results || []);
        } catch (requestError) {
          setNearbyError(requestError.response?.data?.error || 'Khong the tim san gan ban.');
=======
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });

          const response = await axiosInstance.get('/fields/nearby/', {
            params: {
              latitude: lat,
              longitude: lng,
              radius_km: 15,
              limit: 20,
            },
          });
          setNearbyPitches(response.data.results || []);
        } catch (requestError) {
          setNearbyError(requestError.response?.data?.error || 'Không thể tìm sân gần bạn lúc này.');
>>>>>>> origin/dev
        } finally {
          setLocating(false);
        }
      },
      () => {
<<<<<<< HEAD
        setNearbyError('Khong the lay vi tri. Vui long cap quyen.');
=======
        setNearbyError('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
>>>>>>> origin/dev
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

<<<<<<< HEAD
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

=======
  const resetFilters = () => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setMinRating('');
    setSortBy('-avg_rating');
    setActiveFilter('ALL');
  };

  const hasActiveFilters = searchQuery || priceRange.min || priceRange.max || minRating || activeFilter !== 'ALL';

>>>>>>> origin/dev
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Danh sách sân bóng</h2>

      {/* Nearby Section */}
      <div className="mb-10 rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Sân gần bạn</p>
            <h3 className="mt-2 text-2xl font-black text-gray-950">Tìm sân gần vị trí của bạn</h3>
            <p className="mt-3 text-gray-600 leading-7">
<<<<<<< HEAD
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
=======
              Cho phép truy cập vị trí để xem nhanh các sân trong bán kính 15km. Tính năng này giúp bạn chọn sân nhanh hơn khi không nhớ rõ tên sân.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFindNearby}
            disabled={locating}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {locating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tìm sân gần bạn...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.5l-4.95-4.45a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Tìm sân gần tôi
              </>
            )}
          </button>
>>>>>>> origin/dev
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
          <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Sân gần bạn ({nearbyPitches.length} sân)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {nearbyPitches.map((pitch) => (
                <article key={`nearby-${pitch.id}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-950">{pitch.name}</h4>
                      <p className="mt-1 text-sm text-gray-500">{pitch.field_type?.name || 'Loại sân'}</p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-primary">
                      {pitch.distance_km} km
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">{pitch.location}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-primary">{formatMoney(pitch.price_per_hour)}</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{pitch.avg_rating}</span>
                    </div>
                  </div>
<<<<<<< HEAD
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
=======
                  <Link
                    to={`/pitches/${pitch.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition"
                  >
                    Xem chi tiết
>>>>>>> origin/dev
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

<<<<<<< HEAD
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
=======
      <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sân theo tên hoặc địa chỉ..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-primary focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-xl font-medium transition ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá từ</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  placeholder="0 đ"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá đến</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  placeholder="1.000.000 đ"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá tối thiểu</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary"
                >
                  <option value="">Tất cả</option>
                  <option value="3">Từ 3 sao</option>
                  <option value="3.5">Từ 3.5 sao</option>
                  <option value="4">Từ 4 sao</option>
                  <option value="4.5">Từ 4.5 sao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp theo</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-primary"
                >
                  <option value="-avg_rating">Đánh giá cao nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="name_asc">Tên A-Z</option>
                  {userLocation && <option value="distance_asc">Khoảng cách gần nhất</option>}
                </select>
              </div>

              {hasActiveFilters && (
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm text-primary hover:text-teal-700 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
>>>>>>> origin/dev
          )}
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* Field Type Filter Buttons */}
      <div className="flex justify-center mb-8 space-x-2 sm:space-x-4 flex-wrap gap-y-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-md transition ${
            activeFilter === 'ALL'
              ? 'bg-primary text-white shadow'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          Tất cả
        </button>
        {fieldTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveFilter(type.id)}
            className={`px-4 py-2 rounded-md transition ${
              activeFilter === type.id
                ? 'bg-primary text-white shadow'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {filteredPitches.length > 0 && (
        <div className="mb-6 text-sm text-gray-600">
          Hiển thị <span className="font-semibold text-gray-900">{filteredPitches.length}</span> sân
        </div>
      )}

      {/* Pitch List */}
>>>>>>> origin/dev
      {loading ? (
        <div className="text-center text-primary text-xl py-12 font-bold animate-pulse">Đang tải danh sách sân...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12 font-medium">{error}</div>
      ) : filteredPitches.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">Không tìm thấy sân nào phù hợp bộ lọc của bạn.</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 text-primary hover:text-teal-700 font-medium"
            >
              Xóa bộ lọc và thử lại
            </button>
          )}
        </div>
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
<<<<<<< HEAD
                <p className="text-sm text-gray-500 mb-2">{pitch.field_type?.name || 'Loai san'}</p>
                <p className="text-sm text-gray-500 mb-3">{pitch.location || 'Chua cap nhat dia chi'}</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-primary font-bold text-xl">{formatMoney(pitch.price_per_hour)}</p>
                  <span className="text-sm text-yellow-600 font-medium">{pitch.avg_rating} / 5</span>
                </div>
                <Link to={`/pitches/${pitch.id}`}
                  className="block w-full text-center bg-teal-50 hover:bg-primary hover:text-white text-primary font-semibold py-2 rounded-md transition duration-200">
                  Xem chi tiet
=======
                <p className="text-sm text-gray-500 mb-2">{pitch.field_type?.name || 'Loại sân'}</p>
                <p className="text-sm text-gray-500 mb-3">{pitch.location || 'Chưa cập nhật địa chỉ'}</p>

                <div className="mb-3">
                  {pitch.is_open_today ? (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      Mo hom nay: {formatTime(pitch.today_open_time)} - {formatTime(pitch.today_close_time)}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                      Dong hom nay
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-primary font-bold text-xl">
                    {formatMoney(pitch.price_per_hour)}
                  </p>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{pitch.avg_rating || '0'}</span>
                  </div>
                </div>

                {pitch.distance_km !== undefined && userLocation && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.5l-4.95-4.45a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Cách bạn <span className="font-semibold text-primary">{pitch.distance_km} km</span></span>
                  </div>
                )}

                <Link
                  to={`/pitches/${pitch.id}`}
                  className="block w-full text-center bg-teal-50 hover:bg-primary hover:text-white text-primary font-semibold py-2 rounded-md transition duration-200"
                >
                  Xem chi tiết
>>>>>>> origin/dev
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
