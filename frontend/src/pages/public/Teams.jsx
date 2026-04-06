import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';

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
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get('/auth/teams/');
        setTeams(response.data.results || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai bang xep hang doi bong luc nay.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const topTeam = teams[0] || null;

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Football Community</p>
              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight">
                Doi bong tieu bieu duoc xep hang theo so luot dat san.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-gray-600 leading-8">
                Bang xep hang nay tong hop thong tin doi bong tu ho so nguoi dung va sap xep theo tong so booking. Day la cach de nhin nhanh doi nao dang hoat dong noi bat nhat tren he thong.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/pitches"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-white font-semibold shadow-md hover:bg-teal-600 transition"
                >
                  Dat san ngay
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Lien he tu van
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">Top ranking</p>
              <h2 className="mt-3 text-2xl font-bold">Doi bong dan dau</h2>
              {loading ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-300">Dang tai doi bong noi bat...</div>
              ) : error ? (
                <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-6 text-sm text-red-200">{error}</div>
              ) : topTeam ? (
                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img
                    src={topTeam.team_image_url || getTeamPlaceholder(topTeam.team_name)}
                    alt={topTeam.team_name}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Hang #1</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">{topTeam.team_name}</h3>
                      </div>
                      <span className="rounded-full bg-teal-400/15 px-4 py-2 text-sm font-semibold text-teal-200">{topTeam.booking_count} booking</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">Doi bong nay dang dan dau bang xep hang va co tan suat dat san cao nhat trong he thong hien tai.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-300">Chua co du lieu doi bong de hien thi.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Bang xep hang</p>
            <h2 className="mt-3 text-3xl font-black text-gray-950">Danh sach doi bong tieu bieu</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-gray-500">Thu tu duoc tinh theo tong so booking cua cac user thuoc cung mot doi bong. Neu nhieu doi bang nhau, he thong sap xep theo ten doi.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 animate-pulse h-[360px]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-red-600">{error}</div>
        ) : teams.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teams.map((team) => (
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
                  <Link
                    to="/pitches"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                  >
                    Xem san de dat ngay
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-gray-500 shadow-sm">
            Chua co doi bong nao du thong tin de hien thi trong bang xep hang.
          </div>
        )}
      </section>
    </div>
  );
};

export default Teams;
