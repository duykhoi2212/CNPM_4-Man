import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const adminLinks = [
  { to: '/admin/pitches', label: 'San bong' },
  { to: '/admin/services', label: 'Dich vu kem' },
  { to: '/admin/timeslots', label: 'Lich hoat dong' },
  { to: '/admin/incidents', label: 'Su co & doi san' },
  { to: '/admin/bookings', label: 'Booking', countKey: 'bookings' },
  { to: '/admin/reviews', label: 'Review', countKey: 'reviews' },
  { to: '/admin/users', label: 'User' },
  { to: '/admin/contacts', label: 'Lien he', countKey: 'contacts' },
];

const routeToSection = {
  '/admin/bookings': 'bookings',
  '/admin/reviews': 'reviews',
  '/admin/contacts': 'contacts',
};

const getLinkClassName = ({ isActive }) =>
  `relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
  }`;

const formatBadgeCount = (value) => (value > 99 ? '99+' : value);

const AdminNav = () => {
  const location = useLocation();
  const [summary, setSummary] = useState({ bookings: 0, reviews: 0, contacts: 0 });

  const activeSection = useMemo(() => routeToSection[location.pathname] || null, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const response = await axiosInstance.get('/auth/admin/nav-summary/');
        if (cancelled) return;
        setSummary({
          bookings: response.data.bookings || 0,
          reviews: response.data.reviews || 0,
          contacts: response.data.contacts || 0,
        });
      } catch {
        if (!cancelled) {
          setSummary({ bookings: 0, reviews: 0, contacts: 0 });
        }
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const markSectionAsRead = async () => {
      if (!activeSection) return;

      try {
        await axiosInstance.post('/auth/admin/nav-summary/mark-read/', { section: activeSection });
        const response = await axiosInstance.get('/auth/admin/nav-summary/');
        if (cancelled) return;
        setSummary({
          bookings: response.data.bookings || 0,
          reviews: response.data.reviews || 0,
          contacts: response.data.contacts || 0,
        });
      } catch {
        // Ignore badge refresh failures to keep nav stable.
      }
    };

    markSectionAsRead();

    return () => {
      cancelled = true;
    };
  }, [activeSection]);

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
