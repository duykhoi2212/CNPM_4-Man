import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const ManagePitches = () => {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPitches = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/fields/');
        setPitches(response.data.results || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai danh sach san cho admin.');
      } finally {
        setLoading(false);
      }
    };

    fetchPitches();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quan ly san bong</h1>
          <Link to="/admin/dashboard" className="text-primary hover:underline">Ve Dashboard</Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-700">Danh sach san hien tai</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-primary font-semibold">Dang tai danh sach san...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ten san</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gia / gio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trang thai</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pitches.map((pitch) => (
                  <tr key={pitch.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{pitch.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{pitch.field_type?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{Number(pitch.price_per_hour).toLocaleString('vi-VN')} d</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pitch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {pitch.is_active ? 'Hoat dong' : 'Tam dung'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePitches;
