import { Link, useNavigate } from 'react-router-dom';
import { clearAuth, getUserInfo } from '../../utils/auth';

const Header = () => {
  const navigate = useNavigate();
  const user = getUserInfo();
  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user?.is_staff);
  const avatarUrl = user?.avatar_url;

  const handleLogout = () => {
    clearAuth();
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          4-Man Sport
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-primary font-medium">
            Trang chu
          </Link>
          <Link to="/pitches" className="text-gray-700 hover:text-primary font-medium">
            Danh sach san
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-primary font-medium">
            Lien he
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link to="/user/history" className="text-gray-700 hover:text-primary font-medium">
              Lich su dat san
            </Link>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/statistics" className="text-gray-700 hover:text-primary font-medium">
                Thong ke
              </Link>
              <Link to="/admin/pitches" className="text-gray-700 hover:text-primary font-medium">
                Quan ly
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="flex items-center space-x-3 text-gray-700 hover:text-primary font-medium">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.username || 'avatar'}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold uppercase">
                    {(user?.username || 'U').slice(0, 1)}
                  </div>
                )}
                <span>
                  Xin chao, <strong>{user?.username}</strong>
                </span>
              </Link>
              <button
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
              <Link to="/register" className="btn-primary">
                Dang ky
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

