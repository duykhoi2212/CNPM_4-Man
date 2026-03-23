import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              4-Man Sport
            </Link>
          </div>

          {/* Menu Links */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary font-medium">Trang chủ</Link>
            <Link to="/pitches" className="text-gray-700 hover:text-primary font-medium">Danh sách Sân</Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-700 hover:text-primary font-medium">
              Đăng nhập
            </Link>
            <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-teal-600 transition">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;