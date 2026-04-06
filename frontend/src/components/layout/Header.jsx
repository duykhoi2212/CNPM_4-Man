import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getStoredUser, isAuthenticated } from '../../utils/auth';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [showUserMenu, setShowUserMenu] = useState(false);

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
            {loggedIn && !user?.is_staff && (
              <>
                <Link to="/user/history" className="text-gray-700 hover:text-primary font-medium">Lich su dat san</Link>
                <Link to="/user/find-opponent" className="text-gray-700 hover:text-primary font-medium">Tim Doi Bong</Link>
                <Link to="/user/skill-profile" className="text-gray-700 hover:text-primary font-medium">Ho So Doi Bong</Link>
              </>
            )}
            {user?.is_staff && (
              <>
                <Link to="/admin/statistics" className="text-gray-700 hover:text-primary font-medium">Thong ke</Link>
                <Link to="/admin/pitches" className="text-gray-700 hover:text-primary font-medium">Quan ly</Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {loggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary font-medium"
                >
                  <span className="hidden sm:inline">{user?.username || 'user'}</span>
                  <span className="text-xl">▼</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-40">
                    <Link
                      to="/user/history"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Lich su dat san
                    </Link>
                    {!user?.is_staff && (
                      <>
                        <Link
                          to="/user/skill-profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Ho So Doi Bong
                        </Link>
                        <Link
                          to="/user/find-opponent"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Tim Doi Bong
                        </Link>
                      </>
                    )}
                    <hr />
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="block px-4 py-2 text-red-700 hover:bg-gray-100 w-full text-left"
                    >
                      Dang xuat
                    </button>
                  </div>
                )}
              </div>
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
