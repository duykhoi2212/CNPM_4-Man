import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getStoredUser, isAuthenticated } from '../../utils/auth';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const menuItems = (
    <>
      <Link
        to="/"
        onClick={() => setMobileOpen(false)}
        className="text-gray-700 hover:text-primary font-medium block px-3 py-2 rounded-md"
      >
        Trang chu
      </Link>
      <Link
        to="/pitches"
        onClick={() => setMobileOpen(false)}
        className="text-gray-700 hover:text-primary font-medium block px-3 py-2 rounded-md"
      >
        Danh sach san
      </Link>
      {loggedIn && (
        <Link
          to="/user/history"
          onClick={() => setMobileOpen(false)}
          className="text-gray-700 hover:text-primary font-medium block px-3 py-2 rounded-md"
        >
          Lich su dat san
        </Link>
      )}
      {user?.is_staff && (
        <>
          <Link
            to="/admin/statistics"
            onClick={() => setMobileOpen(false)}
            className="text-gray-700 hover:text-primary font-medium block px-3 py-2 rounded-md"
          >
            Thong ke
          </Link>
          <Link
            to="/admin/pitches"
            onClick={() => setMobileOpen(false)}
            className="text-gray-700 hover:text-primary font-medium block px-3 py-2 rounded-md"
          >
            Quan ly
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden text-gray-600 hover:text-primary"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
            <Link to="/" className="text-2xl font-bold text-primary">
              4-Man Sport
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {menuItems}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {loggedIn ? (
              <>
                <span className="text-sm text-gray-600">
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

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {menuItems}
            {loggedIn ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full text-left text-gray-700 hover:text-primary font-medium px-3 py-2 rounded-md"
              >
                Dang xuat
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-gray-700 hover:text-primary font-medium px-3 py-2 rounded-md"
                >
                  Dang nhap
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block bg-primary text-white px-3 py-2 rounded-md text-center font-medium hover:bg-teal-600 transition"
                >
                  Dang ky
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
