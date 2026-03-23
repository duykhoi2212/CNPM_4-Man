import { Link } from 'react-router-dom';

const Checkout = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Xác nhận Đặt Sân & Thanh toán</h2>
      
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="border-b pb-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Thông tin đơn đặt</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <p><span className="font-medium">Sân:</span> Sân bóng Demo 1 (7 người)</p>
            <p><span className="font-medium">Ngày đá:</span> 28/02/2026</p>
            <p><span className="font-medium">Khung giờ:</span> 18:00 - 19:30</p>
            <p><span className="font-medium">Tổng tiền:</span> 450,000 VNĐ</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-primary">Yêu cầu đặt cọc (30%)</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">135,000 VNĐ</p>
          <p className="text-sm text-gray-500">Bạn cần thanh toán khoản cọc này để hệ thống giữ sân.</p>
        </div>

        <div className="flex gap-4">
          <Link to="/user/history" className="flex-1 bg-primary text-white text-center py-3 rounded-md font-bold hover:bg-teal-600 transition">
            Thanh toán & Xác nhận
          </Link>
          <Link to="/pitches/1" className="flex-1 bg-gray-100 text-gray-700 text-center py-3 rounded-md font-bold hover:bg-gray-200 transition">
            Hủy bỏ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Checkout;