import { useParams, Link } from 'react-router-dom';

const PitchDetail = () => {
  // Lấy ID sân từ URL
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="md:flex">
          {/* Hình ảnh sân */}
          <div className="md:w-1/2">
            <img 
              src={`https://via.placeholder.com/800x600/14b8a6/ffffff?text=Hinh+Anh+San+${id}`} 
              alt="Chi tiết sân" 
              className="w-full h-full object-cover min-h-[300px]" 
            />
          </div>
          
          {/* Thông tin chi tiết */}
          <div className="p-8 md:w-1/2 flex flex-col justify-center">
            <div className="uppercase tracking-wide text-sm text-primary font-bold mb-1">
              Thông tin sân bóng
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Sân bóng Demo {id}
            </h2>
            
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              Sân cỏ nhân tạo đạt chuẩn FIFA, hệ thống đèn LED chiếu sáng chống lóa ban đêm. 
              Khu vực nghỉ ngơi rộng rãi, miễn phí nước uống và giữ xe an toàn. 
              Phù hợp cho các giải đấu phong trào và giao lưu công ty.
            </p>
            
            <div className="border-t border-gray-100 pt-6 mb-8">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Giá thuê tham khảo</dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">300,000đ / giờ</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Giờ hoạt động</dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">06:00 - 23:00</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Loại sân</dt>
                  <dd className="mt-1 text-lg font-medium text-gray-900">Sân 7 người</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Đánh giá</dt>
                  <dd className="mt-1 text-lg font-medium text-yellow-500">⭐⭐⭐⭐⭐ (4.8/5)</dd>
                </div>
              </dl>
            </div>
            
            {/* Nút Đặt sân */}
            <div>
              <Link 
                to="/checkout" 
                className="w-full flex justify-center items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-primary hover:bg-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Đặt sân ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchDetail;
