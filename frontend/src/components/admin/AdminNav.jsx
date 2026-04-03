import { NavLink } from 'react-router-dom';

const adminLinks = [
  { to: '/admin/pitches', label: 'San bong' },
  { to: '/admin/timeslots', label: 'Khung gio' },
  { to: '/admin/bookings', label: 'Booking' },
  { to: '/admin/reviews', label: 'Review' },
  { to: '/admin/users', label: 'User' },
  { to: '/admin/contacts', label: 'Lien he' },
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
