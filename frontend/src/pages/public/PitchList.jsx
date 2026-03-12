import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Khởi tạo cấu hình axios ngay trong file
const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const PitchList = () => {
  // 1. Quản lý trạng thái
  const [pitches, setPitches] = useState([]); // Chứa danh sách sân thật
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true); // Hiển thị đang tải
  const [error, setError] = useState(null);

  // 2. Gọi API lấy dữ liệu từ Backend của Khôi khi vừa vào trang
  useEffect(() => {
    const fetchPitches = async () => {
      try {
        setLoading(true);
        // Gọi vào API GET /api/fields/ mà Khôi đã viết
        const response = await axiosInstance.get('/api/fields/');
        
        // Theo tài liệu của Khôi, dữ liệu thực nằm trong mảng 'results'
        setPitches(response.data.results);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi tải danh sách sân:", err);
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchPitches();
  }, []);

  // 3. Logic lọc: Dựa vào ID loại sân của Khôi (1: Sân 5, 2: Sân 7, v.v...)
  const filteredPitches = pitches.filter(pitch => {
    if (activeFilter === 'ALL') return true;
    
    // Theo API, pitch.field_type là 1 object: { "id": 1, "name": "Sân 5 người" }
    // Giả định: ID 1 là Sân 5, ID 2 là Sân 7, ID 3 là Sân 11.
    return pitch.field_type && pitch.field_type.id === activeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Danh sách sân bóng</h2>
      
      {/* NÚT LỌC */}
      <div className="flex justify-center mb-8 space-x-2 sm:space-x-4">
        <button 
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-md transition ${activeFilter === 'ALL' ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setActiveFilter(1)} // Giả định ID loại sân 5 người là 1
          className={`px-4 py-2 rounded-md transition ${activeFilter === 1 ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Sân 5
        </button>
        <button 
          onClick={() => setActiveFilter(2)} // Giả định ID loại sân 7 người là 2
          className={`px-4 py-2 rounded-md transition ${activeFilter === 2 ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Sân 7
        </button>
        <button 
          onClick={() => setActiveFilter(3)} // Giả định ID loại sân 11 người là 3
          className={`px-4 py-2 rounded-md transition ${activeFilter === 3 ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Sân 11
        </button>
      </div>

      {/* HIỂN THỊ DỮ LIỆU */}
      {loading ? (
        <div className="text-center text-primary text-xl py-12 font-bold animate-pulse">Đang tải danh sách sân từ máy chủ...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12 font-medium">{error}</div>
      ) : filteredPitches.length === 0 ? (
        <div className="text-center text-gray-500 py-12">Chưa có sân bóng nào trong hệ thống.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPitches.map(pitch => (
            <div key={pitch.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Dùng biến primary_image theo đúng API của Khôi */}
              <img 
                src={pitch.primary_image || `https://via.placeholder.com/400x250/14b8a6/ffffff?text=${pitch.name}`} 
                alt={pitch.name} 
                className="w-full h-48 object-cover" 
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pitch.name}</h3>
                <p className="text-sm text-gray-500 mb-3">📍 {pitch.location || 'Chưa cập nhật địa chỉ'}</p>
                
                {/* Dùng biến price_per_hour theo đúng API */}
                <p className="text-primary font-bold text-xl mb-4">
                  {Number(pitch.price_per_hour).toLocaleString('vi-VN')} đ <span className="text-sm text-gray-500 font-normal">/ giờ</span>
                </p>
                
                <Link 
                  to={`/pitches/${pitch.id}`} 
                  className="block w-full text-center bg-teal-50 hover:bg-primary hover:text-white text-primary font-semibold py-2 rounded-md transition duration-200"
                >
                  Xem chi tiết
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