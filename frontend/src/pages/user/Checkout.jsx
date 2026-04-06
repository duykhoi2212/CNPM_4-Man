import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingState = location.state;
  const [profile, setProfile] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
    payment_method: 'bank_transfer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Chuyen khoan ngan hang', icon: '🏦' },
    { value: 'momo', label: 'MoMo', icon: '📱' },
    { value: 'vnpay', label: 'VNPay', icon: '💳' },
    { value: 'cash', label: 'Tien mat (dat tai san)', icon: '💰' },
  ];

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

  const { pitch, bookingDate, selectedSlots, totalAmount, depositAmount } = bookingState;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setPaymentData(null);

    try {
      const bookingResponse = await axiosInstance.post('/bookings/create/', {
        field: pitch.id,
        booking_date: bookingDate,
        timeslot_ids: selectedSlots.map((slot) => slot.timeslot_id),
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

      // Store payment data for display
      setPaymentData(paymentResponse.data.payment);

      // Auto confirm for testing
      await axiosInstance.post(`/payments/${paymentResponse.data.payment.id}/confirm/`, {});
      
      const methodName = paymentMethods.find(m => m.value === formData.payment_method)?.label || formData.payment_method;
      navigate('/user/history', {
        state: { successMessage: `Dat san va thanh toan tien coc qua ${methodName} thanh cong.` },
      });
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-2 text-primary">Tien coc can thanh toan</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{Number(depositAmount).toLocaleString('vi-VN')} VND</p>
          <p className="text-sm text-gray-600">
            {formData.payment_method === 'cash' 
              ? 'Ban se thanh toan tien coc truc tiep tai san khi den.'
              : 'He thong se tao giao dich dat coc. Ban se thanh toan phan con lai tai san sau khi su dung dich vu.'}
          </p>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Phuong thuc thanh toan</label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, payment_method: method.value }))}
                className={`p-4 rounded-lg border-2 text-center transition font-medium ${
                  formData.payment_method === method.value
                    ? 'border-primary bg-teal-50 text-primary'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <div className="text-sm">{method.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment instruction based on method */}
        {formData.payment_method === 'bank_transfer' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-semibold text-amber-900 mb-2">📋 Chuyen khoan ngan hang</p>
            <p className="text-sm text-amber-800">
              Sau khi tao don dat, he thong se tao ma QR cho ban. Scan ma nay va chuyen tien theo huong dan.
            </p>
          </div>
        )}

        {formData.payment_method === 'momo' && (
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
            <p className="font-semibold text-pink-900 mb-2">📱 MoMo</p>
            <p className="text-sm text-pink-800">
              Scan ma QR tren ung dung MoMo hoac chuyen tien theo huong dan sau khi tao don.
            </p>
          </div>
        )}

        {formData.payment_method === 'vnpay' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold text-blue-900 mb-2">💳 VNPay</p>
            <p className="text-sm text-blue-800">
              Ban se duoc chuyen huong den trang thanh toan VNPay. Lua chon phuong thuc thanh toan va hoan tat giao dich.
            </p>
          </div>
        )}

        {formData.payment_method === 'cash' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-semibold text-green-900 mb-2">💰 Tien mat</p>
            <p className="text-sm text-green-800">
              Ban se thanh toan tien coc truc tiep tai san khi den. Vui long lien he san de xac nhan thoi gian.
            </p>
          </div>
        )}

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

        {paymentData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-semibold text-green-900 mb-2">✓ Dat san thanh cong!</p>
            {paymentData.qr_code && (
              <div className="text-center">
                <img src={paymentData.qr_code} alt="QR Code" className="w-40 h-40 mx-auto mb-3 border border-green-300 p-2 bg-white" />
                <p className="text-sm text-green-800">Scan ma QR de hoan tat thanh toan</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-primary text-white text-center py-3 rounded-md font-bold hover:bg-teal-600 transition disabled:opacity-60"
          >
            {loading ? 'Dang xu ly...' : `Thanh toan tien coc (${Number(depositAmount).toLocaleString('vi-VN')} VND)`}
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
