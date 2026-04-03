import { useState } from 'react';
import axiosInstance from '../../api/axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axiosInstance.post('/contacts/', formData);
      setSuccessMessage(response.data.message);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      if (responseData?.error) {
        setError(responseData.error);
      } else if (responseData && typeof responseData === 'object') {
        const firstMessage = Object.values(responseData).flat()[0];
        setError(firstMessage || 'Khong the gui lien he.');
      } else {
        setError('Khong the gui lien he.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl bg-white p-8 shadow-xl space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Lien he voi chung toi</h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Neu ban can ho tro dat san, muon hop tac hoac co gop y cho he thong 4-Man Sport, hay de lai thong tin tai day.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">Hotline</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">0909 999 999</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">support@4mansport.vn</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Dia chi</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">Da Nang, Viet Nam</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Gio ho tro</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">08:00 - 22:00 moi ngay</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900">Gui thong tin lien he</h2>
          <p className="mt-2 text-sm text-gray-500">Chung toi se ghi nhan thong tin cua ban va phan hoi trong thoi gian som nhat.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Ho ten
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                So dien thoai
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary" />
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Email
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary" />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Chu de
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary" />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Noi dung
              <textarea name="message" value={formData.message} onChange={handleChange} rows="6" className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-primary" />
            </label>

            {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {successMessage && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

            <button type="submit" disabled={submitting} className="rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-teal-600 disabled:opacity-60">
              {submitting ? 'Dang gui...' : 'Gui lien he'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Contact;
