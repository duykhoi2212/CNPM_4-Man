import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingState = location.state;
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
    payment_method: 'vnpay',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingState) {
      navigate('/pitches');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/auth/profile/');
        setProfile(response.data);
        setFormData((prev) => ({
          ...prev,
          customer_name: `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim(),
          customer_phone: response.data.profile?.phone || '',
          customer_email: response.data.email || '',
        }));
      } catch {
        setError('Khong the tai thong tin nguoi dung. Vui long dang nhap lai.');
      }
    };

    fetchProfile();
  }, [bookingState, navigate]);

  if (!bookingState) {
    return null;
  }

  const { pitch, bookingDate, selectedSlots, totalAmount, depositAmount, matchRequestId, returnToMatchTab } = bookingState;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (matchRequestId) {
        await axiosInstance.post(`/matches/requests/${matchRequestId}/pay/`, {
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email,
          notes: formData.notes,
        });
      } else {
        const bookingResponse = await axiosInstance.post('/bookings/create/', {
          field: pitch.id,
          booking_date: bookingDate,
          timeslot_ids: selectedSlots.map((slot) => slot.timeslot_id || slot.id),
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email,
          notes: formData.notes,
        });

        const bookingId = bookingResponse.data.booking.id;
        const paymentResponse = await axiosInstance.post('/payments/', {
          booking_id: bookingId,
          payment_method: formData.payment_method,
        });

        await axiosInstance.post(`/payments/${paymentResponse.data.payment.id}/confirm/`, {});
      }

      if (matchRequestId && returnToMatchTab) {
        navigate('/teams?tab=tim-giao-luu', {
          state: {
            successMessage: 'Da thanh toan coc giao luu thanh cong. Danh sach da duoc cap nhat.',
            refreshMatchesAt: Date.now(),
          },
        });
      } else {
        navigate('/user/history', {
          state: { successMessage: 'Dat san va thanh toan tien coc qua VNPay thanh cong.' },
        });
      }
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (responseData && typeof responseData === 'object') {
        if (responseData.error) {
          setError(responseData.error);
        } else {
          const firstMessage = Object.values(responseData).flat()[0];
          setError(firstMessage || 'Khong the hoan tat dat san. Vui long thu lai.');
        }
      } else {
        setError('Khong the hoan tat dat san. Vui long thu lai.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Xac nhan dat san va thanh toan</h2>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8">
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold mb-4">Thong tin don dat</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p><span className="font-medium">San:</span> {pitch.name}</p>
            <p><span className="font-medium">Ngay dat:</span> {bookingDate}</p>
            <p><span className="font-medium">Khung gio:</span> {selectedSlots.map((slot) => `${slot.start_time} - ${slot.end_time}`).join(', ')}</p>
            <p><span className="font-medium">Tong tien:</span> {Number(totalAmount).toLocaleString('vi-VN')} VND</p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-primary">Tien coc can thanh toan</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{Number(depositAmount).toLocaleString('vi-VN')} VND</p>
          <p className="text-sm text-gray-500">He thong se tao giao dich dat coc qua VNPay. Ban se thanh toan phan con lai tai san sau khi su dung dich vu.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Ten khach hang
            <input name="customer_name" value={formData.customer_name} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-primary" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            So dien thoai
            <input name="customer_phone" value={formData.customer_phone} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-primary" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input name="customer_email" value={formData.customer_email} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-primary" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Phuong thuc thanh toan
            <input
              value="VNPay"
              disabled
              className="mt-1 block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 outline-none"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Ghi chu
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-primary" />
        </label>

        {profile && (
          <p className="text-sm text-gray-500">
            Dang dat san voi tai khoan: <span className="font-semibold">{profile.username}</span>
          </p>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-primary text-white text-center py-3 rounded-md font-bold hover:bg-teal-600 transition disabled:opacity-60"
          >
            {loading ? 'Dang xu ly...' : 'Thanh toan coc qua VNPay'}
          </button>
          <Link to={`/pitches/${pitch.id}`} className="flex-1 bg-gray-100 text-gray-700 text-center py-3 rounded-md font-bold hover:bg-gray-200 transition">
            Quay lai
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
