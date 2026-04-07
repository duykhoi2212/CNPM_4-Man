import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { isAuthenticated } from '../../utils/auth';

const TEAM_TABS = [
  { key: 'doi-bong-tieu-bieu', label: 'Doi bong tieu bieu' },
  { key: 'doi-co-san-co-dinh', label: 'Doi co san co dinh' },
  { key: 'tim-giao-luu', label: 'Tim giao luu' },
];

const getTeamPlaceholder = (name) => {
  const safeName = (name || '4-Man Team').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const initials = safeName.split(' ').map((part) => part[0]).join('').slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 240">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#14b8a6"/>
      </linearGradient>
    </defs>
    <rect width="420" height="240" rx="32" fill="url(#bg)"/>
    <circle cx="340" cy="60" r="42" fill="rgba(255,255,255,0.12)"/>
    <circle cx="80" cy="190" r="56" fill="rgba(255,255,255,0.10)"/>
    <text x="34" y="108" fill="white" font-size="48" font-family="Arial, sans-serif" font-weight="700">${initials}</text>
    <text x="34" y="156" fill="rgba(255,255,255,0.88)" font-size="26" font-family="Arial, sans-serif" font-weight="700">${safeName}</text>
    <text x="34" y="190" fill="rgba(255,255,255,0.72)" font-size="16" font-family="Arial, sans-serif">Doi bong tieu bieu cua 4-Man Sport</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');

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

const getReservationBadge = (requestItem) => {
  if (requestItem.reservation_status === 'dang_giu_cho') {
    return {
      label: 'Dang giu cho',
      tone: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (requestItem.reservation_status === 'da_dat') {
    return {
      label: 'Da dat',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  return {
    label: requestItem.status_display,
    tone: 'border-sky-200 bg-sky-50 text-sky-700',
  };
};

const Teams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = searchParams.get('tab') || 'doi-bong-tieu-bieu';
  const [teams, setTeams] = useState([]);
  const [matchRequests, setMatchRequests] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [busyRequestId, setBusyRequestId] = useState(null);

  useEffect(() => {
    if (location.state?.successMessage) {
      setError(location.state.successMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        setError('');
        const response = await axiosInstance.get('/auth/teams/');
        setTeams(response.data.results || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai bang xep hang doi bong luc nay.');
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchMatchRequests = async () => {
      try {
        setLoadingRequests(true);
        const response = await axiosInstance.get('/matches/requests/', { params: { scope: 'active' } });
        setMatchRequests(response.data.results || []);
      } catch (requestError) {
        setMatchRequests([]);
        setError(requestError.response?.data?.error || 'Khong the tai danh sach giao luu.');
      } finally {
        setLoadingRequests(false);
      }
    };

    if (activeTab === 'tim-giao-luu') {
      fetchMatchRequests();
    }
  }, [activeTab]);

  const topTeam = teams[0] || null;
  const rankedTeams = teams.slice(1);
  const getMatchDialogTeamInfo = (requestItem) => {
    const teamName = requestItem.counterpart_team_name
      || requestItem.viewing_team_name
      || requestItem.accepted_team_name
      || requestItem.created_team_name
      || 'Chua co du lieu doi';
    const teamImage = requestItem.counterpart_team_image_url
      || requestItem.viewing_team_image_url
      || requestItem.accepted_team_image_url
      || requestItem.created_team_image_url
      || getTeamPlaceholder(teamName);

    return {
      teamName,
      teamImage,
    };
  };

  const handleChangeTab = (tabKey) => {
    setSearchParams(tabKey === 'doi-bong-tieu-bieu' ? {} : { tab: tabKey });
  };

  const handleAcceptRequest = async (requestId) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setBusyRequestId(requestId);
      setError('');
      await axiosInstance.post(`/matches/requests/${requestId}/accept/`, {});
      const response = await axiosInstance.get('/matches/requests/', { params: { scope: 'active' } });
      setMatchRequests(response.data.results || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Khong the chap nhan giao luu luc nay.');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handlePayDeposit = (requestItem) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    navigate('/checkout', {
      state: {
        pitch: requestItem.field,
        bookingDate: requestItem.booking_date,
        selectedSlots: requestItem.timeslots.map((slot) => ({
          timeslot_id: slot.id,
          ...slot,
        })),
        totalAmount: Number(requestItem.total_amount),
        depositAmount: Number(requestItem.deposit_amount),
        matchRequestId: requestItem.id,
      },
    });
  };

  const renderRankingTab = () => (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Bang xep hang</p>
          <h2 className="mt-3 text-3xl font-black text-gray-950">Danh sach doi bong tieu bieu</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-gray-500">
          Thu tu duoc tinh theo tong so booking cua cac user thuoc cung mot doi bong. Neu nhieu doi bang nhau, he thong sap xep theo ten doi.
        </p>
      </div>

      {loadingTeams ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 animate-pulse h-[360px]" />
          ))}
        </div>
      ) : topTeam ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8 items-start">
            <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <img
                src={topTeam.team_image_url || getTeamPlaceholder(topTeam.team_name)}
                alt={topTeam.team_name}
                className="h-80 w-full object-cover"
              />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Top 1</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-950">{topTeam.team_name}</h3>
                  </div>
                  <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">#{topTeam.rank}</span>
                </div>
                <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm text-gray-500">Tong so tran dau duoc ghi nhan</p>
                  <p className="mt-2 text-4xl font-black text-gray-950">{topTeam.booking_count}</p>
                  <p className="mt-1 text-sm text-gray-500">booking dat san</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/pitches"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-white font-semibold shadow-md hover:bg-teal-600 transition"
                  >
                    Dat san ngay
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleChangeTab('tim-giao-luu')}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Tim giao luu
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">Noi bat</p>
              <h2 className="mt-3 text-2xl font-bold">Doi bong dan dau</h2>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-300">
                Doi bong nay dang dan dau bang xep hang va co tan suat dat san cao nhat trong he thong hien tai.
              </div>
              {rankedTeams.length > 0 && (
                <div className="mt-6 space-y-4">
                  {rankedTeams.slice(0, 2).map((team) => (
                    <article key={team.rank} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <img
                        src={team.team_image_url || getTeamPlaceholder(team.team_name)}
                        alt={team.team_name}
                        className="h-36 w-full object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Hang #{team.rank}</p>
                            <h3 className="mt-1 text-lg font-bold text-white">{team.team_name}</h3>
                          </div>
                          <span className="rounded-full bg-teal-400/15 px-3 py-2 text-xs font-semibold text-teal-200">{team.booking_count} booking</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rankedTeams.map((team) => (
              <article key={team.rank} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <img
                  src={team.team_image_url || getTeamPlaceholder(team.team_name)}
                  alt={team.team_name}
                  className="h-56 w-full object-cover"
                />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Top {team.rank}</p>
                      <h3 className="mt-2 text-2xl font-bold text-gray-950">{team.team_name}</h3>
                    </div>
                    <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">#{team.rank}</span>
                  </div>
                  <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-sm text-gray-500">Tong so tran dau duoc ghi nhan</p>
                    <p className="mt-2 text-3xl font-black text-gray-950">{team.booking_count}</p>
                    <p className="mt-1 text-sm text-gray-500">booking dat san</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChangeTab('tim-giao-luu')}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                  >
                    Tim giao luu
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-gray-500 shadow-sm">
          Chua co doi bong nao du thong tin de hien thi trong bang xep hang.
        </div>
      )}
    </section>
  );

  const renderFixedPitchTab = () => (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Doi co san co dinh</p>
        <h2 className="mt-3 text-3xl font-black text-gray-950">Sach san theo doi co san co dinh</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
          Tab nay se gom cac doi bong co xu huong dat lap lai cung mot san hoac mot cum san. Hien tai chung ta moi da co nen data tu profile va booking, nen tab nay se duoc mo rong tiep sau khi co du lieu du.
        </p>
        <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm text-gray-600">
          Chuc nang nay da duoc dat trong roadmap, va se duoc noi voi du lieu dat san lap lai cua tung doi bong trong giai doan tiep theo.
        </div>
      </div>
    </section>
  );

  const renderMatchTab = () => (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Tim giao luu</p>
          <h2 className="mt-3 text-3xl font-black text-gray-950">Danh sach yeu cau giao luu</h2>
        </div>
        <div className="max-w-3xl rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          <p className="text-sm leading-7 text-slate-600">
            User chon ngay va khung gio o trang chi tiet san, bam <span className="font-semibold text-slate-900">Tim doi giao luu</span> de dua request vao day.
            Khi co doi chap nhan, he thong giu cho 1 phut de thanh toan coc, qua han se tu nhan slot ve trang thai trong.
          </p>
        </div>
      </div>

      {loadingRequests ? (
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-sm text-primary shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          Dang tai yeu cau giao luu...
        </div>
      ) : matchRequests.length ? (
        <div className="space-y-6">
          {matchRequests.map((requestItem) => {
            const statusBadge = getReservationBadge(requestItem);
            const scheduleText = requestItem.timeslots?.map((slot) => `${slot.start_time} - ${slot.end_time}`).join(' • ') || 'Chua co khung gio';
            const matchTitle = requestItem.accepted_team_name
              ? `${requestItem.created_team_name} vs ${requestItem.accepted_team_name}`
              : requestItem.created_team_name;

            return (
              <article
                key={requestItem.id}
                className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(20,184,166,0.08))] px-6 py-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold ${statusBadge.tone}`}>
                          {statusBadge.label}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                          {requestItem.field?.name}
                        </span>
                      </div>
                      <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">{matchTitle}</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatBookingDate(requestItem.booking_date)} • {scheduleText}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tien coc</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(requestItem.deposit_amount)} d</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tong tien</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(requestItem.total_amount)} d</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Ma request</p>
                        <p className="mt-2 text-lg font-bold text-slate-950">#{requestItem.id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">San bong</p>
                        <p className="mt-3 text-lg font-bold text-slate-950">{requestItem.field?.name}</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Ngay thi dau</p>
                        <p className="mt-3 text-lg font-bold text-slate-950">{formatBookingDate(requestItem.booking_date)}</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:col-span-2 xl:col-span-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Khung gio</p>
                        <p className="mt-3 text-base font-bold text-slate-950">{scheduleText}</p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {requestItem.reserved_seconds_left > 0 && (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Giu cho con {requestItem.reserved_seconds_left}s
                          </span>
                        )}
                        {requestItem.can_pay_deposit && (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            San sang thanh toan coc
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600">{requestItem.notes || 'Khong co ghi chu cho tran giao luu nay.'}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {!requestItem.accepted_team_name && requestItem.can_accept && (
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(requestItem.id)}
                          disabled={busyRequestId === requestItem.id}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {busyRequestId === requestItem.id ? 'Dang xu ly...' : 'Chap nhan giao luu'}
                        </button>
                      )}
                      {requestItem.accepted_team_name && (
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(requestItem)}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                        >
                          Xem thong tin doi
                        </button>
                      )}
                      {requestItem.can_pay_deposit && (
                        <button
                          type="button"
                          onClick={() => handlePayDeposit(requestItem)}
                          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(20,184,166,0.24)] transition hover:bg-teal-600"
                        >
                          Thanh toan coc
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4">
                      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Doi tao</p>
                        <div className="mt-4 flex items-center gap-4">
                          <img
                            src={requestItem.created_team_image_url || getTeamPlaceholder(requestItem.created_team_name)}
                            alt={requestItem.created_team_name}
                            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="text-base font-bold text-slate-950">{requestItem.created_team_name}</p>
                            <p className="text-sm text-slate-500">@{requestItem.creator_username}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Doi chap nhan</p>
                        {requestItem.accepted_team_name ? (
                          <div className="mt-4 flex items-center gap-4">
                            <img
                              src={requestItem.accepted_team_image_url || getTeamPlaceholder(requestItem.accepted_team_name)}
                              alt={requestItem.accepted_team_name}
                              className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <p className="text-base font-bold text-slate-950">{requestItem.accepted_team_name}</p>
                              <p className="text-sm text-slate-500">
                                {requestItem.accepted_username ? `@${requestItem.accepted_username}` : 'Da chap nhan giao luu'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            Chua co doi chap nhan giao luu.
                          </div>
                        )}
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] p-5 text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200">Trang thai request</p>
                        <p className="mt-3 text-xl font-bold">{statusBadge.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {requestItem.accepted_team_name
                            ? 'Request da co doi nhan giao luu. Nguoi tao can thanh toan coc dung han de chot slot.'
                            : 'Request dang mo de cac doi khac xem va chap nhan giao luu.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          Chua co yeu cau giao luu nao. Hay vao trang chi tiet san va tao mot yeu cau moi.
        </div>
      )}

      {selectedRequest && (() => {
        const { teamName: displayTeamName, teamImage: displayTeamImage } = getMatchDialogTeamInfo(selectedRequest);
        const scheduleText = selectedRequest.timeslots?.map((slot) => `${slot.start_time} - ${slot.end_time}`).join(' • ') || 'Chua co khung gio';
        const viewerContext = selectedRequest.viewer_role === 'creator'
          ? 'Doi da chap nhan giao luu voi ban'
          : selectedRequest.viewer_role === 'accepted'
            ? 'Doi tao loi moi giao luu'
            : 'Thong tin doi giao luu';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[3px]" onClick={() => setSelectedRequest(null)}>
            <div
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(20,184,166,0.92))] p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">Thong tin doi</p>
                  <h3 className="mt-4 text-3xl font-black leading-tight">{displayTeamName}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-100">{viewerContext}</p>
                  <img
                    src={displayTeamImage}
                    alt={displayTeamName}
                    className="mt-6 h-64 w-full rounded-[28px] object-cover ring-1 ring-white/15"
                  />
                </div>

                <div className="p-6 lg:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Lich thi dau</p>
                      <h4 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                        {selectedRequest.field?.name}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Dong
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Ten doi</p>
                      <p className="mt-3 text-lg font-bold text-slate-950">{displayTeamName}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Ngay thi dau</p>
                      <p className="mt-3 text-lg font-bold text-slate-950">{formatBookingDate(selectedRequest.booking_date)}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Khung gio</p>
                      <p className="mt-3 text-lg font-bold text-slate-950">{scheduleText}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tien coc</p>
                      <p className="mt-3 text-lg font-bold text-slate-950">{formatCurrency(selectedRequest.deposit_amount)} d</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Thong tin tran giao luu</p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                      <p><span className="font-semibold text-slate-950">San:</span> {selectedRequest.field?.name}</p>
                      <p><span className="font-semibold text-slate-950">Ngay:</span> {formatBookingDate(selectedRequest.booking_date)}</p>
                      <p><span className="font-semibold text-slate-950">Gio:</span> {scheduleText}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
  const activeSection = activeTab === 'tim-giao-luu'
    ? renderMatchTab()
    : activeTab === 'doi-co-san-co-dinh'
      ? renderFixedPitchTab()
      : renderRankingTab();

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Football Community</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight">
                Doi bong va giao luu san bong duoc gom lai o mot noi.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-gray-600 leading-8">
                Bang dieu khien nay tong hop doi bong tieu bieu, doi co san co dinh va cac yeu cau giao luu dang cho xu ly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => handleChangeTab('tim-giao-luu')}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-white font-semibold shadow-md hover:bg-teal-600 transition"
                >
                  Tim giao luu
                </button>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Lien he tu van
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">Football Hub</p>
              <h2 className="mt-3 text-2xl font-bold">Kenh ket noi giao luu</h2>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-300">
                Chon san, chon gio, tao yeu cau giao luu. Doi khac chap nhan, he thong giu cho 1 phut de ban thanh toan coc.
              </div>
              <div className="mt-6 flex gap-3">
                {TEAM_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleChangeTab(tab.key)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activeTab === tab.key ? 'bg-teal-400 text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mx-auto max-w-7xl mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm">
            {error}
          </div>
        )}
      </div>

      {activeSection}
    </div>
  );
};

export default Teams;
