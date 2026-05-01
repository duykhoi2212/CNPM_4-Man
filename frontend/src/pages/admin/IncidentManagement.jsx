import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';
import AlternativeFieldFinder from '../../components/admin/AlternativeFieldFinder';
import FieldSwapManager from '../../components/admin/FieldSwapManager';

const ISSUE_TYPES = [
  { value: 'field_damage', label: 'Sân hư hỏng' },
  { value: 'weather', label: 'Thời tiết xấu' },
  { value: 'emergency', label: 'Sự cố khẩn cấp' },
  { value: 'equipment', label: 'Thiết bị hư hỏng' },
  { value: 'safety', label: 'Vấn đề an toàn' },
  { value: 'other', label: 'Khác' },
];

const SEVERITIES = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
];

const emptyForm = {
  field: '',
  booking: '',
  issue_type: 'field_damage',
  severity: 'medium',
  description: '',
};

const IncidentManagement = () => {
  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [swapRefreshKey, setSwapRefreshKey] = useState(0);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('');
  const [updatingIncidentId, setUpdatingIncidentId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingSwap, setCreatingSwap] = useState(false);
  const [processingFieldId, setProcessingFieldId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedIncident = useMemo(
    () => incidents.find((item) => item.id === selectedIncidentId) || null,
    [incidents, selectedIncidentId]
  );

  const filteredBookings = useMemo(() => {
    if (!formData.field) return bookings;
    return bookings.filter((booking) => String(booking.field?.id) === String(formData.field));
  }, [bookings, formData.field]);

  const filteredIncidents = useMemo(() => {
    if (!incidentStatusFilter) return incidents;
    return incidents.filter((incident) => incident.status === incidentStatusFilter);
  }, [incidents, incidentStatusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [fieldRes, bookingRes, incidentRes] = await Promise.all([
        axiosInstance.get('/fields/', { params: { admin_scope: 'managed' } }),
        axiosInstance.get('/bookings/'),
        axiosInstance.get('/fields/incidents/'),
      ]);
      const nextFields = fieldRes.data.results || [];
      const nextBookings = bookingRes.data.results || [];
      const nextIncidents = incidentRes.data.results || incidentRes.data || [];
      setFields(nextFields);
      setBookings(nextBookings);
      setIncidents(nextIncidents);
      setSelectedIncidentId((prev) => prev || nextIncidents[0]?.id || null);
      setFormData((prev) => ({ ...prev, field: prev.field || String(nextFields[0]?.id || '') }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể tải dữ liệu sự cố.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitIncident = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');
      await axiosInstance.post('/fields/incidents/', {
        ...formData,
        field: Number(formData.field),
        booking: Number(formData.booking),
        photos: [],
      });
      setFormData((prev) => ({ ...emptyForm, field: prev.field }));
      await loadData();
      setSuccessMessage('Đã tạo báo cáo sự cố thành công.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể tạo báo cáo sự cố.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSwapFromAlternative = async (alternative, options = {}) => {
    if (!selectedIncident) {
      setError('Vui lòng chọn một sự cố để thực hiện đổi sân.');
      return;
    }

    try {
      setCreatingSwap(true);
      setProcessingFieldId(alternative.field_id);
      setError('');
      setSuccessMessage('');
      const createSwapResponse = await axiosInstance.post('/fields/swaps/', {
        incident: selectedIncident.id,
        original_field: selectedIncident.field,
        new_field: alternative.field_id,
        original_booking: selectedIncident.booking,
        swap_reason: options.forceCancelConflicts
          ? `Đổi sân và hủy booking xung đột cho sự cố #${selectedIncident.id}`
          : `Đổi trực tiếp từ sự cố #${selectedIncident.id}`,
        price_difference: alternative.price_difference || 0,
        compensation_amount: 0,
        status: 'proposed',
      });

      const createdSwapId = createSwapResponse.data?.id || createSwapResponse.data?.results?.id;
      const swapId = createdSwapId || createSwapResponse.data?.swap?.id || createSwapResponse.data?.pk;

      if (!swapId) {
        const swapListResponse = await axiosInstance.get('/fields/swaps/', { params: { status: 'proposed' } });
        const latestSwap = (swapListResponse.data.results || swapListResponse.data || []).find(
          (item) => item.incident === selectedIncident.id && item.new_field === alternative.field_id
        );
        if (!latestSwap?.id) {
          throw new Error('Không xác định được bản ghi đổi sân vừa tạo.');
        }
        await axiosInstance.post(`/fields/swaps/${latestSwap.id}/confirm/`, {
          force_cancel_conflicts: Boolean(options.forceCancelConflicts),
        });
      } else {
        await axiosInstance.post(`/fields/swaps/${swapId}/confirm/`, {
          force_cancel_conflicts: Boolean(options.forceCancelConflicts),
        });
      }

      setSelectedAlternative(alternative);
      setSwapRefreshKey((prev) => prev + 1);
      await loadData();
      setSuccessMessage(
        options.forceCancelConflicts
          ? 'Đã hủy booking xung đột và đổi sân thành công.'
          : 'Đã đổi sân thành công và cập nhật booking hiện tại.'
      );
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Không thể đổi sân.');
    } finally {
      setCreatingSwap(false);
      setProcessingFieldId(null);
    }
  };

  const handleUpdateIncidentStatus = async (incident, nextStatus) => {
    try {
      setUpdatingIncidentId(incident.id);
      setError('');
      setSuccessMessage('');
      await axiosInstance.put(`/fields/incidents/${incident.id}/`, {
        field: incident.field,
        booking: incident.booking,
        issue_type: incident.issue_type,
        severity: incident.severity,
        description: incident.description,
        photos: incident.photos || [],
        admin_notes: incident.admin_notes || '',
        status: nextStatus,
      });
      await loadData();
      setSuccessMessage(`Đã cập nhật sự cố #${incident.id} sang trạng thái ${nextStatus}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể cập nhật trạng thái sự cố.');
    } finally {
      setUpdatingIncidentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IncidentManagement</h1>
            <p className="text-gray-500 mt-2">Báo cáo sự cố, tìm sân thay thế và xử lý đổi sân tại một nơi.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">Về trang khách</Link>
        </div>

        <AdminNav />

        {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {successMessage && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-8 items-start">
          <div className="space-y-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Form báo cáo sự cố</h2>
              <form onSubmit={handleSubmitIncident} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Sân bóng</span>
                  <select
                    value={formData.field}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      field: event.target.value,
                      booking: '',
                    }))}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                  >
                    <option value="">Chọn sân</option>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Booking liên quan</span>
                  <select
                    value={formData.booking}
                    onChange={(event) => setFormData((prev) => ({ ...prev, booking: event.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                  >
                    <option value="">Chọn booking</option>
                    {filteredBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        #{booking.id} - {booking.field?.name} - {booking.customer_name}
                      </option>
                    ))}
                  </select>
                  {formData.field && filteredBookings.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">Sân này chưa có booking để liên kết sự cố.</p>
                  )}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Loại sự cố</span>
                    <select
                      value={formData.issue_type}
                      onChange={(event) => setFormData((prev) => ({ ...prev, issue_type: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                    >
                      {ISSUE_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Mức độ</span>
                    <select
                      value={formData.severity}
                      onChange={(event) => setFormData((prev) => ({ ...prev, severity: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                    >
                      {SEVERITIES.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Mô tả</span>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo báo cáo sự cố'}
                </button>
              </form>
            </div>

            <FieldSwapManager refreshKey={swapRefreshKey} />
          </div>

          <div className="space-y-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900">Danh sách sự cố</h2>
                <label className="block w-full sm:w-60">
                  <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái</span>
                  <select
                    value={incidentStatusFilter}
                    onChange={(event) => setIncidentStatusFilter(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="investigating">Đang điều tra</option>
                    <option value="resolving">Đang giải quyết</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </label>
              </div>
              {loading ? (
                <div className="py-4 text-sm text-primary font-medium">Đang tải sự cố...</div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-4 text-sm text-gray-500">Chưa có báo cáo sự cố nào.</div>
              ) : (
                <div className="space-y-3">
                  {filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`w-full rounded-lg border p-4 ${
                        selectedIncidentId === incident.id ? 'border-primary bg-teal-50' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedIncidentId(incident.id)}
                        className="w-full text-left"
                      >
                        <p className="font-semibold text-gray-900">
                          #{incident.id} - {incident.field_name || `Field #${incident.field}`}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">{incident.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Booking #{incident.booking} - {incident.issue_type_display || incident.issue_type}
                        </p>
                      </button>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                          {incident.status_display || incident.status}
                        </span>
                        {incident.status !== 'investigating' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateIncidentStatus(incident, 'investigating')}
                            disabled={updatingIncidentId === incident.id}
                            className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                          >
                            Đang điều tra
                          </button>
                        )}
                        {incident.status !== 'resolving' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateIncidentStatus(incident, 'resolving')}
                            disabled={updatingIncidentId === incident.id}
                            className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                          >
                            Đang giải quyết
                          </button>
                        )}
                        {incident.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateIncidentStatus(incident, 'resolved')}
                            disabled={updatingIncidentId === incident.id}
                            className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
                          >
                            Đánh dấu đã giải quyết
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AlternativeFieldFinder
              incidentId={selectedIncidentId}
              onAlternativeSelected={handleCreateSwapFromAlternative}
              actionLoadingFieldId={processingFieldId}
            />

            {selectedAlternative && (
              <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800">
                Đã xử lý đổi sân với sân: <strong>{selectedAlternative.field_name}</strong>
                {creatingSwap ? ' (đang cập nhật booking...)' : ' (booking đã được cập nhật)'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentManagement;
