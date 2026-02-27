import { Link } from 'react-router-dom';

const ManagePitches = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Sân Bóng</h1>
          <Link to="/admin/dashboard" className="text-primary hover:underline">Về Dashboard</Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-700">Danh sách các sân hiện tại</h2>
            <button className="bg-primary text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-teal-600">
              + Thêm sân mới
            </button>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sân</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Sân bóng A</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">5 người</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">Sửa</button>
                  <button className="text-red-600 hover:text-red-900">Ẩn</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Sân bóng B</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">7 người</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">Sửa</button>
                  <button className="text-red-600 hover:text-red-900">Ẩn</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagePitches;