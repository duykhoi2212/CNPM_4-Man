import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';
import FieldScheduleManager from '../../components/admin/FieldScheduleManager';
import FieldClosureManager from '../../components/admin/FieldClosureManager';
import TimeSlotPreview from '../../components/admin/TimeSlotPreview';

const ManageTimeslots = () => {
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const fieldResponse = await axiosInstance.get('/fields/', { params: { admin_scope: 'managed' } });
        const managedFields = fieldResponse.data.results || [];
        setFields(managedFields);
        setSelectedFieldId((prev) => prev || String(managedFields[0]?.id || ''));
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Không thể tải danh sách sân.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const selectedField = fields.find((item) => String(item.id) === selectedFieldId);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch hoạt động & khung giờ tự động</h1>
            <p className="text-gray-500 mt-2">
              Cấu hình lịch theo tuần, đóng cửa đặc biệt và tự động sinh khung giờ. Không cần nhập khung giờ thủ công nữa.
            </p>
          </div>
          <Link to="/" className="text-primary hover:underline">Về trang khách</Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
            Trang này đã được chuyển thành quản lý lịch theo tuần. Sau khi bấm "Tự động sinh khung giờ", hệ thống sẽ tạo danh sách slot.
          </div>

          {loading ? (
            <div className="p-8 text-center text-primary font-semibold">Đang tải danh sách sân...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <>
              <label className="block md:w-96">
                <span className="text-sm font-medium text-gray-700">Chọn sân cần cấu hình</span>
              <select
                  value={selectedFieldId}
                  onChange={(event) => setSelectedFieldId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </label>

              {!selectedField ? (
                <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Chưa chọn sân để quản lý.
                </div>
              ) : (
                <div className="space-y-8">
                  <FieldScheduleManager fieldId={selectedField.id} fieldName={selectedField.name} />
                  <FieldClosureManager fieldId={selectedField.id} />
                  <TimeSlotPreview fieldId={selectedField.id} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTimeslots;
