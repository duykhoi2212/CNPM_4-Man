import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getStoredUser, isAuthenticated } from '../../utils/auth';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  useEffect(() => {
    const syncAuthState = () => {
      setUser(getStoredUser());
      setLoggedIn(isAuthenticated());
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener('auth-changed', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('auth-changed', syncAuthState);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              4-Man Sport
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary font-medium">Trang chu</Link>
            <Link to="/pitches" className="text-gray-700 hover:text-primary font-medium">Danh sach san</Link>
            {loggedIn && (
              <Link to="/user/history" className="text-gray-700 hover:text-primary font-medium">Lich su dat san</Link>
            )}
            {user?.is_staff && (
              <Link to="/admin/dashboard" className="text-gray-700 hover:text-primary font-medium">Admin</Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {loggedIn ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600">
                  Xin chao, <span className="font-semibold">{user?.username || 'user'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary font-medium"
                >
                  Dang xuat
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary font-medium">
                  Dang nhap
                </Link>
                <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-teal-600 transition">
                  Dang ky
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
