import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { getUserInfo } from '../../utils/auth';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const getPitchPlaceholder = (name) => {
  const safeName = (name || '4-Man Sport').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#14b8a6"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#g)"/>
    <circle cx="320" cy="48" r="36" fill="rgba(255,255,255,0.12)"/>
    <circle cx="80" cy="188" r="48" fill="rgba(255,255,255,0.10)"/>
<<<<<<< HEAD
    <text x="32" y="120" fill="white" font-size="30" font-family="Arial" font-weight="700">${safeName}</text>
    <text x="32" y="156" fill="rgba(255,255,255,0.78)" font-size="16" font-family="Arial">Goi y san thong minh</text>
=======
    <text x="32" y="120" fill="white" font-size="30" font-family="Arial, sans-serif" font-weight="700">${safeName}</text>
    <text x="32" y="156" fill="rgba(255,255,255,0.78)" font-size="16" font-family="Arial, sans-serif">Gợi ý sân thông minh</text>
>>>>>>> origin/dev
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const Home = () => {
  const user = getUserInfo();
  const isAuthenticated = Boolean(user);
  const [recommendedFields, setRecommendedFields] = useState([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [recError, setRecError] = useState('');

  // Nearby state
  const [nearbyFields, setNearbyFields] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locDenied, setLocDenied] = useState(false);

  useEffect(() => {
    const fetchRec = async () => {
      try {
<<<<<<< HEAD
        setLoadingRec(true);
        setRecError('');
        const res = await axiosInstance.get('/fields/recommendations/', { params: { limit: 4 } });
        setRecommendedFields(res.data.results || []);
      } catch (err) {
        setRecError(err.response?.data?.error || 'Khong the tai goi y.');
=======
        setLoadingRecommendations(true);
        setRecommendationError('');
        const response = await axiosInstance.get('/fields/recommendations/', { params: { limit: 4 } });
        setRecommendedFields(response.data.results || []);
      } catch (error) {
        setRecommendationError(error.response?.data?.error || 'Không thể tải gợi ý sân lúc này.');
>>>>>>> origin/dev
      } finally {
        setLoadingRec(false);
      }
    };
    fetchRec();
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    const fetchNearby = async () => {
      try {
        setLoadingNearby(true);
        setNearbyError('');
        const res = await axiosInstance.get('/fields/nearby/', {
          params: { latitude: userLocation.lat, longitude: userLocation.lng, radius_km: 10, limit: 6 },
        });
        setNearbyFields(res.data.results || []);
      } catch {
        setNearbyError('Khong the tai san gan day.');
      } finally {
        setLoadingNearby(false);
      }
    };
    fetchNearby();
  }, [userLocation]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setLocDenied(true); return; }
    setLoadingNearby(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocDenied(false); },
      () => { setLocDenied(true); setLoadingNearby(false); }
    );
  };

  return (
    <div className="bg-gray-50">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">4-Man Sport</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight">
                Đặt lịch sân bóng nhanh, gọn và dễ chọn khung giờ phù hợp.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-gray-600 leading-8">
                Tìm sân theo mức giá, xem lịch trống theo ngày và đặt cọc nhanh để giữ chỗ. Hệ thống ưu tiên các sân có đánh giá cao và dễ đặt trong thời điểm bạn cần.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to={isAuthenticated ? '/pitches' : '/login'}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-white font-semibold shadow-md hover:bg-teal-600 transition"
                >
                  Tìm sân ngay
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Liên hệ tư vấn
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">Gợi ý sân</p>
              <h2 className="mt-3 text-2xl font-bold">Đề xuất thông minh cho bạn</h2>
              <p className="mt-2 text-sm text-slate-300">
                Chọn từ các sân có đánh giá cao, giá hợp lý, dễ đặt nhanh và phù hợp với xu hướng đặt sân hiện tại.
              </p>
              <div className="mt-6 space-y-3">
<<<<<<< HEAD
                {loadingRec ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">Dang tai goi y san...</div>
                ) : recError ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">{recError}</div>
=======
                {loadingRecommendations ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">Đang tải gợi ý sân...</div>
                ) : recommendationError ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">{recommendationError}</div>
>>>>>>> origin/dev
                ) : recommendedFields.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">Chưa có sân để gợi ý lúc này.</div>
                ) : (
                  recommendedFields.slice(0, 2).map((field) => (
                    <div key={field.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{field.name}</p>
                          <p className="mt-1 text-sm text-slate-300">{field.field_type?.name || 'Loại sân'}  {Number(field.avg_rating || 0).toFixed(1)}/5</p>
                        </div>
                        <span className="rounded-full bg-teal-400/15 px-3 py-1 text-xs font-semibold text-teal-200">Top đề xuất</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{field.recommendation_reason}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-white">{formatMoney(field.price_per_hour)}</span>
                        <Link
                          to={isAuthenticated ? `/pitches/${field.id}` : '/login'}
                          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
                        >
                          Đặt sân ngay
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-[28px] border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-slate-50 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Banner gợi ý sân</p>
              <h2 className="mt-3 text-3xl font-black text-gray-950">Gợi ý sân thông minh cho lịch đặt tiếp theo</h2>
              <p className="mt-3 text-gray-600 leading-7">
                Hệ thống ưu tiên các sân có đánh giá tốt, nhiều khung giờ đang mở và mức giá hợp lý. Nếu bạn đã từng đặt sân, đề xuất sẽ ưu tiên loại sân bạn hay chọn.
              </p>
            </div>
            <Link
              to="/pitches"
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-white font-semibold hover:bg-slate-800"
            >
              Xem toàn bộ danh sách sân
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {loadingRec ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 animate-pulse h-64" />
              ))
            ) : recommendedFields.length ? (
              recommendedFields.map((field) => (
                <article key={field.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
                  <img
                    src={field.primary_image || getPitchPlaceholder(field.name)}
                    alt={field.name}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-950">{field.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{field.field_type?.name || 'Loại sân'}</p>
                      </div>
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-primary">{Number(field.avg_rating || 0).toFixed(1)}/5</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 min-h-[40px]">{field.recommendation_reason}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span>{formatMoney(field.price_per_hour)}</span>
                      <span>{field.total_reviews || 0} đánh giá</span>
                    </div>
                    <Link
                      to={isAuthenticated ? `/pitches/${field.id}` : '/login'}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-teal-600"
                    >
                      Dat san ngay
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-gray-100 bg-white px-6 py-8 text-center text-gray-500 shadow-sm">
                Chưa có gợi ý sân phù hợp lúc này.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Nearby Fields */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">San gan ban</h2>
            <p className="text-gray-500 mt-1">Tim san bong gan vi tri cua ban</p>
          </div>
          {!userLocation && !locDenied && (
            <button onClick={handleGetLocation} disabled={loadingNearby}
              className="bg-primary text-white px-5 py-2 rounded-full font-semibold hover:bg-teal-700 transition disabled:opacity-50">
              {loadingNearby ? 'Dang lay vi tri...' : '📍 Tim san gan toi'}
            </button>
          )}
        </div>

        {locDenied && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800 font-medium">Trinh duyet da tu oc truy cap vi tri.</p>
            <button onClick={handleGetLocation} className="mt-3 text-primary font-semibold hover:underline">Thu lai</button>
          </div>
        )}

        {userLocation && (
          <>
            {nearbyError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">{nearbyError}</div>}
            {loadingNearby ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 animate-pulse h-64" />
                ))}
              </div>
            ) : nearbyFields.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                Khong co san nao trong ban kinh 10km.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyFields.map((field) => (
                  <article key={field.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img src={field.primary_image || getPitchPlaceholder(field.name)} alt={field.name} className="h-44 w-full object-cover" />
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {field.distance_km} km
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-950">{field.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{field.field_type?.name || 'Loai san'}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-primary font-bold">{formatMoney(field.price_per_hour)}</span>
                        <span className="text-sm text-yellow-600 font-medium">{Number(field.avg_rating || 0).toFixed(1)}/5</span>
                      </div>
                      <Link to={isAuthenticated ? `/pitches/${field.id}` : '/login'}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-teal-600">
                        Dat san ngay
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home;
