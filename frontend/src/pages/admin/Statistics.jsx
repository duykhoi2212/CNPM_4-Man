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
  pending_payment: 'Cho thanh toan cọc',
  confirmed: 'Đã xác nhận',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

const bookingStatusStyles = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const rangeOptions = [
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' },
  { value: '1y', label: '1 năm qua' },
  { value: 'all', label: 'Tất cả' },
  { value: 'custom', label: 'Tùy chọn' },
];

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const formatChartMoney = (value) => {
  const numeric = Number(value || 0);
  if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}tr`;
  if (numeric >= 1000) return `${Math.round(numeric / 1000)}k`;
  return `${numeric}`;
};

const formatPeriodLabel = (period, groupBy) => {
  if (!period) return '';
  if (groupBy === 'year') {
    return String(period).slice(0, 4);
  }
  if (groupBy === 'month') {
    const [year, month] = String(period).split('-');
    return `${month}/${year}`;
  }

  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return String(period);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

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

const buildStatsParams = (nextFilters) => {
  const params = {};
  if (nextFilters.date_from) params.date_from = nextFilters.date_from;
  if (nextFilters.date_to) params.date_to = nextFilters.date_to;
  if (nextFilters.field_id) params.field_id = nextFilters.field_id;
  params.group_by = nextFilters.group_by;
  return params;
};

const getPresetDates = (rangeKey) => {
  if (rangeKey === 'all' || rangeKey === 'custom') {
    return { date_from: '', date_to: '' };
  }

  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const startDate = new Date(today);

  if (rangeKey === '30d') startDate.setDate(startDate.getDate() - 29);
  if (rangeKey === '90d') startDate.setDate(startDate.getDate() - 89);
  if (rangeKey === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

  return {
    date_from: startDate.toISOString().slice(0, 10),
    date_to: end,
  };
};

const RevenueChart = ({ series, groupBy }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const chartData = useMemo(() => {
    if (!series.length) {
      return {
        width: 760,
        height: 320,
        plotWidth: 0,
        plotHeight: 0,
        points: [],
        yTicks: [],
      };
    }

    const width = 760;
    const height = 320;
    const margin = { top: 20, right: 20, bottom: 48, left: 72 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxRevenue = Math.max(...series.map((item) => Number(item.total_revenue || 0)), 1);
    const yTickValues = Array.from({ length: 5 }, (_, index) => Math.round((maxRevenue / 4) * (4 - index)));

    const points = series.map((item, index) => {
      const x = margin.left + (index / Math.max(series.length - 1, 1)) * plotWidth;
      const revenue = Number(item.total_revenue || 0);
      const y = margin.top + plotHeight - (revenue / maxRevenue) * plotHeight;
      return {
        x,
        y,
        revenue,
        bookings_count: item.bookings_count,
        rawPeriod: item.period,
        label: formatPeriodLabel(item.period, groupBy),
      };
    });

    const yTicks = yTickValues.map((value) => ({
      value,
      y: margin.top + plotHeight - (value / Math.max(maxRevenue, 1)) * plotHeight,
    }));

    return { width, height, margin, plotWidth, plotHeight, points, yTicks };
  }, [series, groupBy]);

  if (!series.length) {
    return <p className="text-gray-500">Chưa có dữ liệu doanh thu để hiển thị.</p>;
  }

  const polylinePoints = chartData.points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = [
    `${chartData.margin.left},${chartData.margin.top + chartData.plotHeight}`,
    ...chartData.points.map((point) => `${point.x},${point.y}`),
    `${chartData.margin.left + chartData.plotWidth},${chartData.margin.top + chartData.plotHeight}`,
  ].join(' ');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-950 p-4 text-white overflow-x-auto">
        <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full min-w-[680px] h-[320px]">
          <defs>
            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {chartData.yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={chartData.margin.left}
                x2={chartData.margin.left + chartData.plotWidth}
                y1={tick.y}
                y2={tick.y}
                stroke="rgba(255,255,255,0.08)"
              />
              <text
                x={chartData.margin.left - 12}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="12"
                fill="rgba(255,255,255,0.70)"
              >
                {formatChartMoney(tick.value)}
              </text>
            </g>
          ))}

          <line
            x1={chartData.margin.left}
            x2={chartData.margin.left}
            y1={chartData.margin.top}
            y2={chartData.margin.top + chartData.plotHeight}
            stroke="rgba(255,255,255,0.18)"
          />
          <line
            x1={chartData.margin.left}
            x2={chartData.margin.left + chartData.plotWidth}
            y1={chartData.margin.top + chartData.plotHeight}
            y2={chartData.margin.top + chartData.plotHeight}
            stroke="rgba(255,255,255,0.18)"
          />

          <polygon fill="url(#revenueGradient)" points={areaPoints} />
          <polyline
            fill="none"
            stroke="#5eead4"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polylinePoints}
          />

          {chartData.points.map((point, index) => (
            <g key={point.rawPeriod}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === index ? 7 : 5}
                fill="#ffffff"
                stroke="#2dd4bf"
                strokeWidth="3"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <text
                x={point.x}
                y={chartData.margin.top + chartData.plotHeight + 22}
                textAnchor="middle"
                fontSize="12"
                fill="rgba(255,255,255,0.70)"
              >
                {point.label}
              </text>
              {hoveredIndex === index && (
                <g>
                  <rect
                    x={point.x - 68}
                    y={Math.max(point.y - 64, 10)}
                    width="136"
                    height="48"
                    rx="10"
                    fill="rgba(15,23,42,0.96)"
                    stroke="rgba(45,212,191,0.6)"
                  />
                  <text x={point.x} y={Math.max(point.y - 40, 26)} textAnchor="middle" fontSize="12" fill="#cbd5e1">
                    {point.label}
                  </text>
                  <text x={point.x} y={Math.max(point.y - 22, 44)} textAnchor="middle" fontSize="13" fontWeight="700" fill="#ffffff">
                    {formatMoney(point.revenue)}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {chartData.points.slice(-3).map((item) => (
          <div key={item.rawPeriod} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-500">{formatPeriodLabel(item.rawPeriod, groupBy)}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{formatMoney(item.revenue)}</p>
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
  const [fieldPerformance, setFieldPerformance] = useState([]);
  const [fields, setFields] = useState([]);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    field_id: '',
    group_by: 'day',
    range: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async (nextFilters) => {
    const params = buildStatsParams(nextFilters);

    const [overviewResponse, revenueResponse, topFieldsResponse, fieldPerformanceResponse] = await Promise.all([
      axiosInstance.get('/statistics/admin/overview/', { params }),
      axiosInstance.get('/statistics/admin/revenue/', { params }),
      axiosInstance.get('/statistics/admin/top-fields/', { params: { ...params, limit: 5 } }),
      axiosInstance.get('/statistics/admin/field-performance/', { params }),
    ]);

    setOverview(overviewResponse.data);
    setRevenueSeries(revenueResponse.data.series || []);
    setTopFields(topFieldsResponse.data.top_fields || []);
    setFieldPerformance(fieldPerformanceResponse.data.fields || []);
  }, []);

  useEffect(() => {
    const initialFilters = {
      date_from: '',
      date_to: '',
      field_id: '',
      group_by: 'day',
      range: 'all',
    };

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError('');
        const [fieldResponse] = await Promise.all([
          axiosInstance.get('/fields/', { params: { admin_scope: 'managed' } }),
          loadStatistics(initialFilters),
        ]);
        setFields(fieldResponse.data.results || []);
      } catch (requestError) {
        setError(getReadableError(requestError.response?.data, 'Không thể tải trang thống kê admin.'));
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [loadStatistics]);

  const applyFilters = async (nextFilters) => {
    setFilters(nextFilters);
    setError('');

    try {
      setLoading(true);
      await loadStatistics(nextFilters);
    } catch (requestError) {
      setError(getReadableError(requestError.response?.data, 'Không thể cập nhật bộ lọc thống kê.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (event) => {
    const { name, value } = event.target;
    const nextFilters = {
      ...filters,
      [name]: value,
      range: name === 'date_from' || name === 'date_to' ? 'custom' : filters.range,
    };
    await applyFilters(nextFilters);
  };

  const handleRangeSelect = async (rangeKey) => {
    const presetDates = getPresetDates(rangeKey);
    const nextFilters = {
      ...filters,
      ...presetDates,
      range: rangeKey,
      group_by: rangeKey === '1y' ? 'month' : filters.group_by,
    };
    await applyFilters(nextFilters);
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const response = await axiosInstance.get('/statistics/admin/export/', {
        params: buildStatsParams(filters),
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] || '';
      const matchedFileName = contentDisposition.match(/filename="([^"]+)"/);
      const fileName = matchedFileName?.[1] || `bao-cao-thong-ke-${new Date().toISOString().slice(0, 10)}.csv`;

      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setError('Không thể xuất báo cáo thống kê lúc này.');
    } finally {
      setExporting(false);
    }
  };

  const summaryCards = overview ? [
    {
      label: 'Doanh thu tiền sân',
      value: formatMoney(overview.booking?.completed_field_revenue),
      helper: `${overview.booking?.completed_bookings || 0} booking đã hoàn thành`,
    },
    {
      label: 'Doanh thu dịch vụ',
      value: formatMoney(overview.booking?.completed_service_revenue),
      helper: `${overview.booking?.completed_bookings || 0} booking có dịch vụ kèm`,
    },
    {
      label: 'Tổng đã thu checkout',
      value: formatMoney(overview.payment?.completed_collected_total),
      helper: `${overview.booking?.confirmed_bookings || 0} booking đang xác nhận`,
    },
    {
      label: 'Tỷ lệ hoàn thành',
      value: `${overview.booking?.completion_rate_percent || 0}%`,
      helper: `${overview.booking?.cancelled_bookings || 0} booking đã hủy`,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Phân tích quản trị</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950">Thống kê hệ thống</h1>
            <p className="mt-3 max-w-3xl text-gray-500">
              Tổng hợp doanh thu, tiền cọc, nhóm booking và các sân nổi bật để bạn có thể theo dõi vận hành hệ thống theo một dashboard gọn và rõ ràng hơn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <button
              type="button"
              onClick={handleExportReport}
              disabled={exporting}
              className="rounded-md bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? 'Đang xuất báo cáo...' : 'Xuất báo cáo CSV'}
            </button>
            <Link
              to="/"
              title="Về trang khách"
              aria-label="Về trang khách"
              className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
                <path d="M3 12h12" />
              </svg>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-primary font-semibold shadow-sm">Đang tải trang thống kê...</div>
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
                <div className="mb-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Doanh thu</p>
                      <h2 className="text-2xl font-bold text-gray-950">Doanh thu hoàn tất</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tổng đang chờ thanh toán</p>
                      <p className="text-lg font-bold text-gray-900">{formatMoney(overview?.payment?.pending_collected_total)}</p>
                    </div>
                  </div>
                  </div>
                  <div className="space-y-4">
                    {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Bộ lọc chi tiết</p>
                        <h3 className="mt-1 text-lg font-bold text-gray-900">Điều chỉnh biểu đồ</h3>
                      </div>
                      <p className="text-sm text-gray-500">Bộ lọc này áp dụng trực tiếp cho biểu đồ và các số liệu bên dưới.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Từ ngày</span>
                        <input
                          type="date"
                          name="date_from"
                          value={filters.date_from}
                          onChange={handleFilterChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Đến ngày</span>
                        <input
                          type="date"
                          name="date_to"
                          value={filters.date_to}
                          onChange={handleFilterChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Sân bóng</span>
                        <select
                          name="field_id"
                          value={filters.field_id}
                          onChange={handleFilterChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary"
                        >
                          <option value="">Tất cả sân</option>
                          {fields.map((field) => (
                            <option key={field.id} value={field.id}>{field.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Nhóm doanh thu theo</span>
                        <select
                          name="group_by"
                          value={filters.group_by}
                          onChange={handleFilterChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary"
                        >
                          <option value="day">Ngày</option>
                          <option value="month">Tháng</option>
                          <option value="year">Năm</option>
                        </select>
                        </label>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">So sánh theo mốc thời gian</p>
                      <div className="flex flex-wrap gap-3">
                        {rangeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleRangeSelect(option.value)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filters.range === option.value ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <RevenueChart series={revenueSeries} groupBy={filters.group_by} />
                  </div>
                </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Overview</p>
                  <h2 className="text-2xl font-bold text-gray-950">Tổng hợp nhanh</h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-950 p-5 text-white">
                    <p className="text-sm text-white/70">Tổng đánh giá từ các booking</p>
                    <p className="mt-2 text-3xl font-black">{overview?.total_reviews_from_bookings || 0}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Cho cọc</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.pending_bookings || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Đã xác nhận</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.confirmed_bookings || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Đã hoàn thành</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.completed_bookings || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Đã hủy</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.booking?.cancelled_bookings || 0}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Giá trị booking trung bình:</span> {formatMoney(overview?.booking?.average_booking_value)}</p>
                    <p className="mt-2"><span className="font-semibold text-gray-900">Tiền cọc đã thu:</span> {formatMoney(overview?.payment?.completed_deposit)}</p>
                    <p className="mt-2"><span className="font-semibold text-gray-900">Tiền dịch vụ đã thu:</span> {formatMoney(overview?.payment?.completed_service)}</p>
                    <p className="mt-2"><span className="font-semibold text-gray-900">Tiền cọc thất bại:</span> {formatMoney(overview?.payment?.failed_deposit)}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.95fr)] gap-6">
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Ranking</p>
                  <h2 className="text-2xl font-bold text-gray-950">Top sân nổi bật</h2>
                </div>
                {topFields.length === 0 ? (
                  <p className="text-gray-500">Chưa có sân nào trong bảng xếp hạng.</p>
                ) : (
                  <div className="space-y-4">
                    {topFields.map((field, index) => (
                      <div key={`${field.field_id}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Top {index + 1}</p>
                          <h3 className="mt-1 text-lg font-bold text-gray-900">{field.field__name}</h3>
                          <p className="text-sm text-gray-500">{field.bookings_count || 0} lượt đặt · {field.cancelled_count || 0} lượt hủy</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Doanh thu hoàn tất</p>
                          <p className="text-xl font-bold text-gray-900">{formatMoney(field.completed_revenue)}</p>
                          <p className="text-xs text-gray-500">San: {formatMoney(field.completed_field_revenue)} · DV: {formatMoney(field.completed_service_revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Recent</p>
                  <h2 className="text-2xl font-bold text-gray-950">Booking gần đây</h2>
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
                          <span>San: {formatMoney(booking.field_amount)}</span>
                          <span>Dich vu: {formatMoney(booking.service_amount)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
                          <span>Tong tien: {formatMoney(booking.total_amount)}</span>
                          <span>Coc: {formatMoney(booking.deposit_amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Chưa có booking gần đây trong bộ lọc hiện tại.</p>
                )}
              </section>
            </div>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Operations</p>
                <h2 className="text-2xl font-bold text-gray-950">Hiệu suất theo sân</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Tong hop nhanh theo tung san trong bo loc hien tai de doi chieu doanh thu, tien coc va trang thai booking.
                </p>
              </div>

              {fieldPerformance.length === 0 ? (
                <p className="text-gray-500">Chua co du lieu hieu suat theo san trong bo loc hien tai.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">San</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tong booking</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cho coc</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Da xac nhan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Da hoan thanh</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Da huy</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tien coc da thu</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Doanh thu tien san</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Doanh thu dich vu</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tong doanh thu</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Ty le hoan thanh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {fieldPerformance.map((row) => (
                        <tr key={row.field_id}>
                          <td className="px-4 py-4 font-medium text-gray-900">{row.field__name}</td>
                          <td className="px-4 py-4 text-gray-600">{row.total_bookings}</td>
                          <td className="px-4 py-4 text-amber-700">{row.pending_bookings}</td>
                          <td className="px-4 py-4 text-blue-700">{row.confirmed_bookings}</td>
                          <td className="px-4 py-4 text-emerald-700">{row.completed_bookings}</td>
                          <td className="px-4 py-4 text-red-700">{row.cancelled_bookings}</td>
                          <td className="px-4 py-4 text-gray-700">{formatMoney(row.completed_deposit)}</td>
                          <td className="px-4 py-4 text-gray-700">{formatMoney(row.completed_field_revenue)}</td>
                          <td className="px-4 py-4 text-gray-700">{formatMoney(row.completed_service_revenue)}</td>
                          <td className="px-4 py-4 font-semibold text-gray-900">{formatMoney(row.completed_revenue)}</td>
                          <td className="px-4 py-4 text-gray-700">{row.completion_rate_percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Statistics;
