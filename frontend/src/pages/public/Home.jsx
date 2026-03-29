import { Link } from 'react-router-dom';

const benefits = [
  {
    title: 'Tìm kiếm siêu nhanh',
    description: 'Lọc theo địa điểm, giá, thời gian, và loại sân trong 1 giây.',
    icon: '⚡',
  },
  {
    title: 'Đặt lịch trong 1 bước',
    description: 'Chọn ô giờ, đặt, và nhận link xác nhận ngay lập tức.',
    icon: '🏟️',
  },
  {
    title: 'Quản lý lịch thông minh',
    description: 'Lịch sử, nhắc nhở, thay đổi dễ dàng từ điện thoại.',
    icon: '📱',
  },
];

const stats = [
  { label: 'Sân đã đăng ký', value: 42 },
  { label: 'Người dùng', value: 3500 },
  { label: 'Đơn đặt thành công', value: 7800 },
];

const Home = () => {
  return (
    <div className="bg-gradient-to-br from-cyan-50 via-white to-sky-50">
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem-136px)] px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.35),_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">Sân bóng thông minh</p>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
              Đặt sân nhanh hơn, chơi bóng đã hơn với <span className="text-primary">4-Man Sport</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl">
              Nền tảng đặt lịch sân bóng chuyên nghiệp, đồng bộ thời gian thực, hiển thị mọi khung giờ trống, thanh toán ngay trong app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/pitches"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-white font-semibold shadow-lg shadow-cyan-500/20 hover:bg-teal-600 transition"
              >
                Tìm sân ngay
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10 transition"
              >
                Đăng ký miễn phí
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {stats.map((item) => (
                <div key={item.label} className="bg-white/70 backdrop-blur rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-extrabold text-primary">{item.value.toLocaleString('vi-VN')}</div>
                  <div className="text-sm text-slate-600">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#14b8a6]/40 to-[#047481]/20 blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/40">
              <img
                src="https://images.unsplash.com/photo-1577413774059-40a0a0b3b481?auto=format&fit=crop&w=1080&q=80"
                alt="Sân bóng đá"
                className="w-full h-80 md:h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-10">Điểm nổi bật của 4-Man Sport</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((item) => (
            <div key={item.title} className="bg-white rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-transform duration-200 border border-white/60">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white pt-14 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-3">Liên hệ</h2>
          <p className="text-center text-slate-300 mb-10">Mọi thắc mắc, góp ý hoặc cần hỗ trợ, vui lòng liên hệ qua các kênh dưới đây.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800/70 p-6 rounded-2xl shadow-lg border border-slate-700">
              <h3 className="text-xl font-semibold mb-4">Thông tin liên hệ</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary text-xl">📍</span>
                  <span>Địa chỉ: 123 Đường Cầu Rồng, Q. Hải Châu, TP. Đà Nẵng</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary text-xl">☎️</span>
                  <span>Điện thoại: 0909 123 456</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary text-xl">✉️</span>
                  <span>Email: info@4mansport.vn</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary text-xl">💬</span>
                  <span>Fanpage: facebook.com/4manSport</span>
                </li>
              </ul>
            </div>

            <form className="bg-slate-800/70 p-6 rounded-2xl shadow-lg border border-slate-700">
              <h3 className="text-xl font-semibold mb-4">Gửi yêu cầu</h3>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <textarea
                  rows="4"
                  placeholder="Nội dung liên hệ"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition"
                >
                  Gửi liên hệ
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;