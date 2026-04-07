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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Tim giao luu</p>
          <h2 className="mt-3 text-3xl font-black text-gray-950">Danh sach yeu cau giao luu</h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-gray-500">
          Khi doi chap nhan, he thong giu cho 1 phut de nguoi tao yeu cau thanh toan coc. Qua thoi gian giu cho, slot se tu dong nhan lai la con trong.
        </p>
      </div>

      {loadingRequests ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-8 text-sm text-primary shadow-sm">Dang tai yeu cau giao luu...</div>
      ) : matchRequests.length ? (
        <div className="space-y-5">
          {matchRequests.map((requestItem) => {
            const statusBadge = requestItem.reservation_status === 'dang_giu_cho'
              ? 'Dang giu cho'
              : requestItem.status_display;

            return (
              <article key={requestItem.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">{statusBadge}</span>
                      {requestItem.reserved_seconds_left > 0 && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Giu cho con {requestItem.reserved_seconds_left}s
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-gray-950">
                      {requestItem.created_team_name}
                      {requestItem.accepted_team_name ? ` vs ${requestItem.accepted_team_name}` : ''}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {requestItem.field?.name} • {requestItem.booking_date}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-gray-600">{requestItem.notes || 'Khong co ghi chu'}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {requestItem.timeslots?.map((slot) => (
                        <span key={slot.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      ))}
                    </div>

                    {requestItem.accepted_team_name && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(requestItem)}
                          className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Xem thong tin doi
                        </button>
                        {requestItem.can_pay_deposit && (
                          <button
                            type="button"
                            onClick={() => handlePayDeposit(requestItem)}
                            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                          >
                            Da co doi chap nhan giao luu, xin moi thanh toan coc
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Nguoi tao</p>
                        <p className="mt-2 text-lg font-bold text-gray-950">{requestItem.created_team_name}</p>
                        <p className="text-sm text-gray-500">@{requestItem.creator_username}</p>
                      </div>
                      <img
                        src={requestItem.created_team_image_url || getTeamPlaceholder(requestItem.created_team_name)}
                        alt={requestItem.created_team_name}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    </div>

                    <div className="mt-5 rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">Tien coc can thanh toan</p>
                      <p className="mt-2 text-3xl font-black text-gray-950">{Number(requestItem.deposit_amount).toLocaleString('vi-VN')} d</p>
                      <p className="mt-1 text-xs text-gray-500">Tong tien {Number(requestItem.total_amount).toLocaleString('vi-VN')} d</p>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">Thong tin doi chap nhan</p>
                      {requestItem.accepted_team_name ? (
                        <div className="mt-3 flex items-center gap-3">
                          <img
                            src={requestItem.accepted_team_image_url || getTeamPlaceholder(requestItem.accepted_team_name)}
                            alt={requestItem.accepted_team_name}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-950">{requestItem.accepted_team_name}</p>
                            <p className="text-xs text-gray-500">Doi da chap nhan giao luu</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500">Chua co doi chap nhan.</p>
                      )}
                    </div>

                    {!requestItem.accepted_team_name && requestItem.can_accept && (
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(requestItem.id)}
                        disabled={busyRequestId === requestItem.id}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {busyRequestId === requestItem.id ? 'Dang xu ly...' : 'Chap nhan giao luu'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-100 bg-white p-8 text-sm text-gray-500 shadow-sm">
          Chua co yeu cau giao luu nao. Hay vao trang chi tiet san va tao mot yeu cau moi.
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" onClick={() => setSelectedRequest(null)}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Thong tin doi</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-950">{selectedRequest.accepted_team_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Dong
              </button>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
              <img
                src={selectedRequest.accepted_team_image_url || getTeamPlaceholder(selectedRequest.accepted_team_name)}
                alt={selectedRequest.accepted_team_name}
                className="h-56 w-full rounded-2xl object-cover"
              />
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Doi dang giao luu voi ban</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">{selectedRequest.accepted_team_name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">San va khung gio</p>
                  <p className="mt-2 text-sm font-semibold text-gray-950">
                    {selectedRequest.field?.name} • {selectedRequest.booking_date}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedRequest.timeslots?.map((slot) => `${slot.start_time} - ${slot.end_time}`).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
