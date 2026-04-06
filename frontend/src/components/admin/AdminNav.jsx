import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const adminLinks = [
  { to: '/admin/pitches', label: 'San bong' },
  { to: '/admin/timeslots', label: 'Khung gio' },
  { to: '/admin/bookings', label: 'Booking', countKey: 'bookings' },
  { to: '/admin/reviews', label: 'Review', countKey: 'reviews' },
  { to: '/admin/users', label: 'User' },
  { to: '/admin/contacts', label: 'Lien he', countKey: 'contacts' },
];

const getLinkClassName = ({ isActive }) =>
  `relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
  }`;

const formatBadgeCount = (value) => (value > 99 ? '99+' : value);

const AdminNav = () => {
  const [summary, setSummary] = useState({ bookings: 0, reviews: 0, contacts: 0 });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axiosInstance.get('/auth/admin/nav-summary/');
        setSummary({
          bookings: response.data.bookings || 0,
          reviews: response.data.reviews || 0,
          contacts: response.data.contacts || 0,
        });
      } catch {
        setSummary({ bookings: 0, reviews: 0, contacts: 0 });
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="flex flex-wrap gap-3">
      {adminLinks.map((link) => (
        <NavLink key={link.to} to={link.to} className={getLinkClassName}>
          {link.label}
          {link.countKey && summary[link.countKey] > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
              {formatBadgeCount(summary[link.countKey])}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default AdminNav;
