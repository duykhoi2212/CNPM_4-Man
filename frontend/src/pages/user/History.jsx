import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const HISTORY_TABS = [
  { key: 'booking', label: 'Lich su dat san' },
  { key: 'match', label: 'Lich su giao luu' },
];

const bookingStatusStyles = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const matchStatusStyles = {
  waiting_opponent: 'bg-sky-100 text-sky-800',
  accepted_waiting_deposit: 'bg-amber-100 text-amber-800',
  deposit_paid: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const formatBookingDate = (value) => {
  if (!value) {
    return 'Chua xac dinh';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getReviewInfo = (booking) => {
  if (booking.status !== 'completed') {
    return null;
  }

  if (booking.has_review) {
    return {
      text: 'Booking nay da duoc danh gia',
      className: 'bg-green-50 text-green-700',
    };
  }

  if (booking.can_review_now) {
    return {
      text: 'Da den thoi diem danh gia. Ban co the viet danh gia ngay bay gio.',
      className: 'bg-blue-50 text-blue-700',
    };
  }

  const eligibleAtText = booking.latest_end_time
    ? `${booking.booking_date} ${booking.latest_end_time}`
    : booking.booking_date;

  return {
    text: `Ban chi co the danh gia sau ${eligibleAtText}`,
    className: 'bg-yellow-50 text-yellow-700',
  };
};

const History = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'booking';
  const [bookings, setBookings] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState('');
  const [matchDateFilter, setMatchDateFilter] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        const response = await axiosInstance.get('/bookings/');
        setBookings(response.data.results || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai lich su dat san.');
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchMatchHistory = async () => {
      try {
        setLoadingMatches(true);
        const response = await axiosInstance.get('/matches/requests/', { params: { scope: 'mine' } });
        const formedMatches = (response.data.results || []).filter(
          (requestItem) => requestItem.accepted_team_name
        );
        setMatchHistory(formedMatches);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai lich su giao luu.');
      } finally {
        setLoadingMatches(false);
      }
    };

    if (activeTab === 'match') {
      fetchMatchHistory();
    }
  }, [activeTab]);

  const filteredMatchHistory = matchDateFilter
    ? matchHistory.filter((requestItem) => requestItem.booking_date === matchDateFilter)
    : matchHistory;

  const handleChangeTab = (tabKey) => {
    setSearchParams(tabKey === 'booking' ? {} : { tab: tabKey });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Lich su</p>
          <h2 className="mt-3 text-3xl font-black text-gray-900">Lich su hoat dong cua ban</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500">
            Theo doi booking da tao va cac tran giao luu da ket noi thanh cong trong cung mot khu vuc lich su.
          </p>
        </div>
        {location.state?.successMessage && (
          <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm text-green-700 shadow-sm">
            {location.state.successMessage}
          </div>
        )}
      </div>

      <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3 md:grid-cols-2">
          {HISTORY_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleChangeTab(tab.key)}
                className={`rounded-[28px] border px-5 py-5 text-left transition ${
                  isActive
                    ? 'border-primary bg-[linear-gradient(135deg,rgba(20,184,166,0.14),rgba(15,23,42,0.06))] shadow-[0_16px_32px_rgba(20,184,166,0.12)]'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                  Lich su
                </p>
                <h3 className={`mt-3 text-xl font-black tracking-tight ${isActive ? 'text-slate-950' : 'text-slate-800'}`}>
                  {tab.label}
                </h3>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {activeTab === 'booking' ? (
        loadingBookings ? (
          <div className="text-center text-primary font-semibold">Dang tai lich su dat san...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">Ban chua co booking nao.</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {bookings.map((booking) => {
                const reviewInfo = getReviewInfo(booking);

                return (
                  <li key={booking.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary truncate">
                          #{booking.id} - {booking.field?.name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bookingStatusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                            {booking.status_display}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Ngay: {booking.booking_date} | Tong tien: {formatCurrency(booking.total_amount)}
                          </p>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-gray-500 sm:mt-0 sm:text-right">
                          <p>Coc: {formatCurrency(booking.deposit_amount)}</p>
                          <p>Con lai: {formatCurrency(booking.remaining_amount || 0)}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link
                          to={`/user/history/${booking.id}`}
                          className="inline-flex items-center justify-center rounded-md bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Chi tiet lich dat
                        </Link>
                      </div>
                      {reviewInfo && (
                        <div className={`mt-3 rounded-md px-3 py-2 text-sm ${reviewInfo.className}`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span>{reviewInfo.text}</span>
                            {booking.can_review_now && !booking.has_review && (
                              <Link
                                to={`/user/reviews/new/${booking.id}`}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                              >
                                Viet danh gia
                              </Link>
                            )}
                            {booking.has_review && booking.review && (
                              <Link
                                to={`/user/reviews/new/${booking.id}`}
                                state={{ review: booking.review }}
                                className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                              >
                                Sua danh gia
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      ) : (
        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Bo loc ngay</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Loc lich su giao luu theo ngay thi dau</h3>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="block text-sm font-medium text-slate-700">
                  Ngay thi dau
                  <input
                    type="date"
                    value={matchDateFilter}
                    onChange={(event) => setMatchDateFilter(event.target.value)}
                    className="mt-2 block w-full min-w-[220px] rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setMatchDateFilter('')}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                >
                  Xoa loc
                </button>
              </div>
            </div>
          </div>

          {loadingMatches ? (
            <div className="text-center text-primary font-semibold">Dang tai lich su giao luu...</div>
          ) : filteredMatchHistory.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
              {matchDateFilter ? 'Khong co tran giao luu nao trong ngay ban da chon.' : 'Ban chua co tran giao luu nao duoc ket noi.'}
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredMatchHistory.map((matchItem) => (
                <article
                  key={matchItem.id}
                  className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                >
                  <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(20,184,166,0.08))] px-6 py-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${matchStatusStyles[matchItem.status] || 'bg-gray-100 text-gray-800'}`}>
                            {matchItem.status_display}
                          </span>
                          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {matchItem.field?.name}
                          </span>
                        </div>
                        <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                          {matchItem.created_team_name}
                          {matchItem.accepted_team_name ? ` vs ${matchItem.accepted_team_name}` : ''}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {formatBookingDate(matchItem.booking_date)} • {matchItem.timeslots?.map((slot) => `${slot.start_time} - ${slot.end_time}`).join(' • ')}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tien coc</p>
                          <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(matchItem.deposit_amount)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tong tien</p>
                          <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(matchItem.total_amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Thong tin tran giao luu</p>
                      <div className="mt-4 grid gap-3 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-950">San:</span> {matchItem.field?.name}</p>
                        <p><span className="font-semibold text-slate-950">Ngay:</span> {formatBookingDate(matchItem.booking_date)}</p>
                        <p><span className="font-semibold text-slate-950">Khung gio:</span> {matchItem.timeslots?.map((slot) => `${slot.start_time} - ${slot.end_time}`).join(' • ')}</p>
                        <p><span className="font-semibold text-slate-950">Ghi chu:</span> {matchItem.notes || 'Khong co ghi chu'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Doi tao</p>
                        <div className="mt-4 flex items-center gap-4">
                          <img
                            src={matchItem.created_team_image_url}
                            alt={matchItem.created_team_name}
                            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="text-base font-bold text-slate-950">{matchItem.created_team_name}</p>
                            <p className="text-sm text-slate-500">@{matchItem.creator_username}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Doi chap nhan</p>
                        <div className="mt-4 flex items-center gap-4">
                          <img
                            src={matchItem.accepted_team_image_url}
                            alt={matchItem.accepted_team_name}
                            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="text-base font-bold text-slate-950">{matchItem.accepted_team_name}</p>
                            <p className="text-sm text-slate-500">
                              {matchItem.accepted_username ? `@${matchItem.accepted_username}` : 'Da chap nhan giao luu'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default History;
