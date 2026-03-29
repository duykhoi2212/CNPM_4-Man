import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const PitchList = () => {
  const [pitches, setPitches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">Danh sách sân bóng</h2>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === 'ALL' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200 hover:bg-gray-50'}`}
        >
          Tất cả
        </button>
        {[...new Map(pitches.map((pitch) => [pitch.field_type?.id, pitch.field_type])).values()]
          .filter(Boolean)
          .map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === type.id ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200 hover:bg-gray-50'}`}
            >
              {type.name}
            </button>
          ))}
      </div>

      {loading ? (
        <div className="text-center text-primary text-xl py-12 font-bold animate-pulse">Đang tải danh sách sân...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12 font-medium">{error}</div>
      ) : filteredPitches.length === 0 ? (
        <div className="text-center text-slate-500 py-12">Chưa có sân bóng nào trong hệ thống.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPitches.map((pitch) => (
            <div key={pitch.id} className="group relative rounded-3xl border border-slate-200 bg-white shadow-[0_20px_30px_-15px_rgba(15,23,42,0.15)] overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative h-52">
                <img
                  src={pitch.primary_image || `https://via.placeholder.com/500x350/14b8a6/ffffff?text=${encodeURIComponent(pitch.name)}`}
                  alt={pitch.name}
                  className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                  {pitch.field_type?.name || 'Không xác định'}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="text-xl font-bold text-slate-900">{pitch.name}</h3>
                <p className="text-sm text-slate-500 min-h-[46px]">{pitch.location || 'Chưa cập nhật địa chỉ'}</p>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-primary font-semibold text-lg">{Number(pitch.price_per_hour).toLocaleString('vi-VN')} đ/h</p>
                  <span className="text-sky-600 font-semibold">{pitch.status || 'Đang hoạt động'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {(Array.from({ length: 5 })).map((_, idx) => (
                      <svg
                        key={idx}
                        className={`w-4 h-4 ${idx < (Number(pitch.avg_rating) || 0) ? 'text-yellow-500' : 'text-slate-300'}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.17 3.592a1 1 0 0 0 .95.69h3.777c.969 0 1.371 1.24.588 1.81l-3.053 2.21a1 1 0 0 0-.364 1.118l1.17 3.591c.3.922-.755 1.688-1.54 1.118L10 13.011l-3.053 2.209c-.784.57-1.838-.196-1.539-1.118l1.17-3.59a1 1 0 0 0-.364-1.118L3.16 9.02c-.783-.57-.38-1.81.588-1.81h3.777a1 1 0 0 0 .95-.69l1.17-3.592z" />
                      </svg>
                    ))}
                    <span className="text-slate-500 text-xs">{Number(pitch.avg_rating).toFixed(1)} / 5</span>
                  </div>
                  <Link
                    to={`/pitches/${pitch.id}`}
                    className="text-xs font-semibold text-white bg-primary hover:bg-teal-600 py-2 px-3 rounded-lg transition"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PitchList;
