import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản trị Hệ thống (Admin)</h1>
          <Link to="/" className="text-primary font-medium hover:underline">Quay lại Trang khách</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary">
            <p className="text-sm text-gray-500 font-medium">Doanh thu tháng này</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">12,500,000 đ</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-medium">Lượt đặt sân</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">145</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 font-medium">Người dùng mới</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">32</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Truy cập nhanh</h2>
          <div className="flex gap-4">
            <Link to="/admin/pitches" className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-teal-600">Quản lý Sân bóng</Link>
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300">Quản lý Booking</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;