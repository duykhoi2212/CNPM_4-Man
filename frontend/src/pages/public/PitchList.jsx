import { Link } from 'react-router-dom';

const PitchList = () => {
  // Dữ liệu giả lập (Mock data) trong lúc chờ kết nối Backend
  const pitches = [
    { id: 1, name: 'Sân bóng A (5 người)', price: '200,000đ/h', image: '[https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+A](https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+A)' },
    { id: 2, name: 'Sân bóng B (7 người)', price: '300,000đ/h', image: '[https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+B](https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+B)' },
    { id: 3, name: 'Sân bóng C (11 người)', price: '500,000đ/h', image: '[https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+C](https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+C)' },
    { id: 4, name: 'Sân bóng D (5 người)', price: '250,000đ/h', image: '[https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+D](https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+D)' },
    { id: 5, name: 'Sân bóng E (7 người)', price: '350,000đ/h', image: '[https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+E](https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+E)' },
    { id: 6, name: 'Sân bóng F (Futsal)', price: '400,000đ/h', image: '[https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+F](https://via.placeholder.com/400x250/14b8a6/ffffff?text=San+Bong+F)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Danh sách sân bóng</h2>
      
      {/* Bộ lọc tạm thời */}
      <div className="flex justify-center mb-8 space-x-4">
        <button className="px-4 py-2 bg-primary text-white rounded-md shadow">Tất cả</button>
        <button className="px-4 py-2 bg-white text-gray-700 border rounded-md hover:bg-gray-50">Sân 5</button>
        <button className="px-4 py-2 bg-white text-gray-700 border rounded-md hover:bg-gray-50">Sân 7</button>
        <button className="px-4 py-2 bg-white text-gray-700 border rounded-md hover:bg-gray-50">Sân 11</button>
      </div>

      {/* Lưới danh sách sân */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pitches.map(pitch => (
          <div key={pitch.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img src={pitch.image} alt={pitch.name} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pitch.name}</h3>
              <p className="text-primary font-semibold text-lg mb-4">{pitch.price}</p>
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
    </div>
  );
};

export default PitchList;
