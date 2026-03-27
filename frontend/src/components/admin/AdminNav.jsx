import { NavLink } from 'react-router-dom';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Tong quan' },
  { to: '/admin/statistics', label: 'Thong ke' },
  { to: '/admin/pitches', label: 'San bong' },
];

const getLinkClassName = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
  }`;

const AdminNav = () => {
  return (
    <div className="flex flex-wrap gap-3">
      {adminLinks.map((link) => (
        <NavLink key={link.to} to={link.to} className={getLinkClassName}>
          {link.label}
        </NavLink>
      ))}
    </div>
  );
};

export default AdminNav;
