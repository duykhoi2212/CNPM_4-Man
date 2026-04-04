import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const statCardStyles = [
  'border-l-4 border-primary',
  'border-l-4 border-blue-500',
  'border-l-4 border-emerald-500',
  'border-l-4 border-amber-500',
];

const bookingStatusLabels = {
  pending_payment: 'Cho thanh toan coc',
  confirmed: 'Da xac nhan',
  completed: 'Da hoan thanh',
  cancelled: 'Da huy',
};

const bookingStatusStyles = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} d`;

const getReadableError = (responseData, fallbackMessage) => {
  if (!responseData) return fallbackMessage;
  if (typeof responseData === 'string') return responseData;
  if (responseData.error) return responseData.error;
  if (typeof responseData === 'object') {
    const firstEntry = Object.values(responseData)[0];
    if (Array.isArray(firstEntry)) return firstEntry[0] || fallbackMessage;
    if (typeof firstEntry === 'string') return firstEntry;
  }
  return fallbackMessage;
};

const RevenueChart = ({ series }) => {
  const chartData = useMemo(() => {
    if (!series.length) return { points: '', labels: [] };

    const width = 640;
    const height = 220;
    const maxRevenue = Math.max(...series.map((item) => Number(item.total_revenue || 0)), 1);

    const points = series.map((item, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * (width - 40) + 20;
      const revenue = Number(item.total_revenue || 0);
      const y = height - (revenue / maxRevenue) * 160 - 30;
      return `${x},${y}`;
    }).join(' ');

    const labels = series.map((item) => ({
      period: item.period,
      total_revenue: item.total_revenue,
      bookings_count: item.bookings_count,
    }));

    return { points, labels, width, height };
  }, [series]);

  if (!series.length) {
    return <p className="text-gray-500">Chua co du lieu doanh thu de hien thi.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-950 p-4 text-white">
        <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-64">
          <defs>
            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((tick) => {
            const y = 20 + tick * 50;
            return <line key={tick} x1="20" x2={chartData.width - 20} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />;
          })}
          <polyline
            fill="none"
            stroke="#5eead4"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={chartData.points}
          />
          <polygon
            fill="url(#revenueGradient)"
            points={`20,${chartData.height - 30} ${chartData.points} ${chartData.width - 20},${chartData.height - 30}`}
          />
          {series.map((item, index) => {
            const point = chartData.points.split(' ')[index];
            const [x, y] = point.split(',');
            return <circle key={item.period} cx={x} cy={y} r="5" fill="#ffffff" stroke="#2dd4bf" strokeWidth="3" />;
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {chartData.labels.slice(-3).map((item) => (
          <div key={item.period} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-500">{item.period}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{formatMoney(item.total_revenue)}</p>
            <p className="text-xs text-gray-500">{item.bookings_count || 0} booking hoan thanh</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Statistics = () => {
  const [overview, setOverview] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [topFields, setTopFields] = useState([]);
  const [fields, setFields] = useState([]);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    field_id: '',
    group_by: 'day',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async (nextFilters) => {
    const params = {};
    if (nextFilters.date_from) params.date_from = nextFilters.date_from;
    if (nextFilters.date_to) params.date_to = nextFilters.date_to;
    if (nextFilters.field_id) params.field_id = nextFilters.field_id;
    params.group_by = nextFilters.group_by;

    const [overviewResponse, revenueResponse, topFieldsResponse] = await Promise.all([
      axiosInstance.get('/statistics/admin/overview/', { params }),
      axiosInstance.get('/statistics/admin/revenue/', { params }),
      axiosInstance.get('/statistics/admin/top-fields/', { params: { ...params, limit: 5 } }),
    ]);

    setOverview(overviewResponse.data);
    setRevenueSeries(revenueResponse.data.series || []);
    setTopFields(topFieldsResponse.data.top_fields || []);
  }, []);

  useEffect(() => {
    const initialFilters = {
      date_from: '',
      date_to: '',
      field_id: '',
      group_by: 'day',
    };

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError('');
        const [fieldResponse] = await Promise.all([
          axiosInstance.get('/fields/'),
          loadStatistics(initialFilters),
        ]);
        setFields(fieldResponse.data.results || []);
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Khong the tai trang thong ke admin.'));
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [loadStatistics]);

  const handleFilterChange = async (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value,
    };
    setFilters(nextFilters);
    setError('');

    try {
      setLoading(true);
      await loadStatistics(nextFilters);
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Khong the cap nhat bo loc thong ke.'));
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = overview ? [
    {
      label: 'Doanh thu hoan tat',
      value: formatMoney(overview.booking?.total_revenue),
      helper: `${overview.booking?.completed_bookings || 0} booking da hoan thanh`,
    },
    {
      label: 'Tien coc da thu',
      value: formatMoney(overview.payment?.completed_deposit),
      helper: `${overview.booking?.confirmed_bookings || 0} booking dang xac nhan`,
    },
    {
      label: 'Tong booking',
      value: `${overview.booking?.total_bookings || 0}`,
      helper: `${overview.booking?.pending_bookings || 0} booking cho thanh toan coc`,
    },
    {
      label: 'Ty le hoan thanh',
      value: `${overview.booking?.completion_rate_percent || 0}%`,
      helper: `${overview.booking?.cancelled_bookings || 0} booking da huy`,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Admin analytics</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950">Thong ke he thong</h1>
            <p className="mt-3 max-w-3xl text-gray-500">
              Tong hop doanh thu, tien coc, nhom booking va cac san noi bat de ban co the theo doi van hanh he thong theo mot dashboard gon va ro rang hon.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/pitches" className="rounded-md border border-primary px-4 py-3 font-semibold text-primary hover:bg-teal-50">Ve khu quan ly</Link>
            <Link to="/" className="rounded-md border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50">Ve trang khach</Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Tu ngay</span>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Den ngay</span>
              <input
                type="date"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">San bong</span>
              <select
                name="field_id"
                value={filters.field_id}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Tat ca san</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Nhom doanh thu theo</span>
              <select
                name="group_by"
                value={filters.group_by}
                onChange={handleFilterChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="day">Ngay</option>
                <option value="month">Thang</option>
              </select>
            </label>
          </div>
          {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-primary font-semibold shadow-sm">Dang tai trang thong ke...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {summaryCards.map((card, index) => (
                <div key={card.label} className={`rounded-2xl bg-white p-6 shadow-sm ${statCardStyles[index % statCardStyles.length]}`}>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-gray-950">{card.value}</p>
                  <p className="mt-3 text-sm text-gray-500">{card.helper}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] gap-6">
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Revenue</p>
                    <h2 className="text-2xl font-bold text-gray-950">Doanh thu hoan tat</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Tien coc dang cho thanh toan</p>
                    <p className="text-lg font-bold text-gray-900">{formatMoney(overview?.payment?.pending_deposit)}</p>
                  </div>
                </div>
                <RevenueChart series={revenueSeries} />
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Overview</p>
                  <h2 className="text-2xl font-bold text-gray-950">Tong hop nhanh</h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-950 p-5 text-white">
                    <p className="text-sm text-white/70">Tong review tu cac booking</p>
                    <p className="mt-2 text-3xl font-black">{overview?.total_reviews_from_bookings || 0}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Cho coc</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.pending_bookings || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Da xac nhan</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.confirmed_bookings || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Da hoan thanh</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.completed_bookings || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Da huy</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.cancelled_bookings || 0}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Gia tri booking trung binh:</span> {formatMoney(overview?.booking?.average_booking_value)}</p>
                    <p className="mt-2"><span className="font-semibold text-gray-900">Tien coc that bai:</span> {formatMoney(overview?.payment?.failed_deposit)}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.95fr)] gap-6">
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Ranking</p>
                  <h2 className="text-2xl font-bold text-gray-950">Top san noi bat</h2>
                </div>
                {topFields.length === 0 ? (
                  <p className="text-gray-500">Chua co san nao trong bang xep hang.</p>
                ) : (
                  <div className="space-y-4">
                    {topFields.map((field, index) => (
                      <div key={`${field.field_id}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Top {index + 1}</p>
                          <h3 className="mt-1 text-lg font-bold text-gray-900">{field.field__name}</h3>
                          <p className="text-sm text-gray-500">{field.bookings_count || 0} luot dat · {field.cancelled_count || 0} huy</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Doanh thu hoan tat</p>
                          <p className="text-xl font-bold text-gray-900">{formatMoney(field.completed_revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Recent</p>
                  <h2 className="text-2xl font-bold text-gray-950">Booking gan day</h2>
                </div>
                {overview?.recent_bookings?.length ? (
                  <div className="space-y-3">
                    {overview.recent_bookings.map((booking) => (
                      <div key={booking.id} className="rounded-xl border border-gray-100 px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">#{booking.id} - {booking.field__name}</p>
                            <p className="mt-1 text-sm text-gray-500">{booking.customer_name} · {booking.booking_date}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${bookingStatusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                            {bookingStatusLabels[booking.status] || booking.status}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                          <span>Tong tien: {formatMoney(booking.total_amount)}</span>
                          <span>Coc: {formatMoney(booking.deposit_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Chua co booking gan day trong bo loc hien tai.</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Statistics;
