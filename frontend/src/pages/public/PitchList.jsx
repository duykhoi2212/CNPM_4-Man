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
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Danh sach san bong</h2>

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
                    {Number(pitch.price_per_hour).toLocaleString('vi-VN')} d
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
