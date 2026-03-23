import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem-136px)] bg-gray-50 px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Hệ thống Đặt lịch Sân bóng <span className="text-primary">4-Man Sport</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Nền tảng tìm kiếm và đặt sân bóng đá nhanh chóng, tiện lợi nhất Đà Nẵng. 
          Hiển thị lịch trống thời gian thực, không lo trùng giờ!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/pitches" 
            className="bg-primary text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-teal-600 transition"
          >
            Tìm sân ngay
          </Link>
          <Link 
            to="/register" 
            className="bg-white text-primary border border-primary font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-teal-50 transition"
          >
            Đăng ký tài khoản
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;