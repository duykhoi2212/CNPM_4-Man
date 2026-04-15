import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axiosInstance from '../../api/axios';
import AdminNav from '../../components/admin/AdminNav';
import { getStoredUser } from '../../utils/auth';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const emptyForm = {
  field_type: '',
  owner: '',
  name: '',
  description: '',
  location: '',
  latitude: '',
  longitude: '',
  price_per_hour: '',
  peak_hour_price: '',
  deposit_percent: '30',
  is_active: true,
};

const createDraftImage = (file, order, isPrimary) => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  previewUrl: URL.createObjectURL(file),
  order,
  is_primary: isPrimary,
});

const ManagePitches = () => {
  const currentUser = getStoredUser();
  const canAssignOwner = Boolean(currentUser?.is_superuser);
  const [pitches, setPitches] = useState([]);
  const [fieldTypes, setFieldTypes] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [pitchImages, setPitchImages] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imageOrder, setImageOrder] = useState('0');
  const [imageIsPrimary, setImageIsPrimary] = useState(false);
  const [pendingCreateImages, setPendingCreateImages] = useState([]);
  const [editingPitchId, setEditingPitchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [imageError, setImageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const isEditing = useMemo(() => Boolean(editingPitchId), [editingPitchId]);

  const loadPitches = async () => {
    const response = await axiosInstance.get('/fields/', { params: { admin_scope: 'managed' } });
    setPitches(response.data.results || []);
    return response.data.results || [];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const requests = [
          axiosInstance.get('/fields/', { params: { admin_scope: 'managed' } }),
          axiosInstance.get('/fields/types/'),
        ];
        if (canAssignOwner) {
          requests.push(axiosInstance.get('/auth/admin/users/', { params: { role: 'admin' } }));
        }

        const [pitchResponse, typeResponse, ownerResponse] = await Promise.all(requests);

        setPitches(pitchResponse.data.results || []);
        setFieldTypes(typeResponse.data.results || typeResponse.data || []);
        if (ownerResponse) {
          setAdminUsers(ownerResponse.data.results || ownerResponse.data || []);
        }
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Khong the tai du lieu quan ly san.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canAssignOwner]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current).setView([16.0544, 108.2022], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setFormData((p) => ({ ...p, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', (ev) => {
          const { lat: dLat, lng: dLng } = ev.target.getLatLng();
          setFormData((p) => ({ ...p, latitude: dLat.toFixed(6), longitude: dLng.toFixed(6) }));
        });
      }
    });
    mapInstanceRef.current = map;
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  // Sync marker when lat/lng changes
  useEffect(() => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
        markerRef.current.on('dragend', (e) => {
          const { lat: dLat, lng: dLng } = e.target.getLatLng();
          setFormData((p) => ({ ...p, latitude: dLat.toFixed(6), longitude: dLng.toFixed(6) }));
        });
      }
    }
  }, [formData.latitude, formData.longitude]);

  const resetForm = () => {
    pendingCreateImages.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });
    setFormData(emptyForm);
    setEditingPitchId(null);
    setPitchImages([]);
    setImageFile(null);
    setImageOrder('0');
    setImageIsPrimary(false);
    setPendingCreateImages([]);
    setFormError('');
    setImageError('');
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = async (pitchId) => {
    try {
      setFormError('');
      setSuccessMessage('');
      const response = await axiosInstance.get(`/fields/${pitchId}/`, {
        params: { admin_scope: 'managed' },
      });
      const pitch = response.data;

      setEditingPitchId(pitch.id);
      setPitchImages(pitch.images || []);
      pendingCreateImages.forEach((image) => {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
      setPendingCreateImages([]);
      setFormData({
        field_type: String(pitch.field_type?.id || ''),
        owner: String(pitch.owner_id || ''),
        name: pitch.name || '',
        description: pitch.description || '',
        location: pitch.location || '',
        latitude: pitch.latitude || '',
        longitude: pitch.longitude || '',
        price_per_hour: pitch.price_per_hour || '',
        peak_hour_price: pitch.peak_hour_price || '',
        deposit_percent: pitch.deposit_percent || '30',
        is_active: Boolean(pitch.is_active),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setFormError(requestError.response?.data?.error || 'Khong the tai thong tin san de chinh sua.');
    }
  };

  const refreshEditingPitchImages = async (pitchId = editingPitchId) => {
    if (!pitchId) {
      return;
    }

    const response = await axiosInstance.get(`/fields/${pitchId}/`, {
      params: { admin_scope: 'managed' },
    });
    setPitchImages(response.data.images || []);
  };

  const handleDelete = async (pitchId, pitchName) => {
    const shouldDelete = window.confirm(`Ban co chac muon xoa san "${pitchName}" khong?`);
    if (!shouldDelete) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      await axiosInstance.delete(`/fields/${pitchId}/delete/`);
      await loadPitches();

      if (editingPitchId === pitchId) {
        resetForm();
      }

      setSuccessMessage('Da xoa san thanh cong.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Khong the xoa san.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const payload = {
        ...formData,
        field_type: Number(formData.field_type),
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        price_per_hour: Number(formData.price_per_hour),
        peak_hour_price: Number(formData.peak_hour_price),
        deposit_percent: Number(formData.deposit_percent),
      };
      if (canAssignOwner) {
        payload.owner = formData.owner ? Number(formData.owner) : null;
      } else {
        delete payload.owner;
      }

      if (isEditing) {
        await axiosInstance.patch(`/fields/${editingPitchId}/update/`, payload);
        setSuccessMessage('Cap nhat san thanh cong.');
      } else {
        const existingPitchIds = new Set(pitches.map((pitch) => pitch.id));
        await axiosInstance.post('/fields/create/', payload);
        const refreshedPitches = await loadPitches();
        const createdPitch = refreshedPitches.find((pitch) => (
          !existingPitchIds.has(pitch.id)
          && pitch.name === payload.name
          && pitch.location === payload.location
          && Number(pitch.price_per_hour) === payload.price_per_hour
          && Number(pitch.peak_hour_price) === payload.peak_hour_price
        ));
        const createdPitchId = createdPitch?.id;

        if (pendingCreateImages.length && !createdPitchId) {
          throw new Error('Khong the xac dinh san vua tao de upload anh.');
        }

        if (createdPitchId && pendingCreateImages.length) {
          for (const image of pendingCreateImages) {
            const formPayload = new FormData();
            formPayload.append('image', image.file);
            formPayload.append('order', String(image.order || 0));
            formPayload.append('is_primary', image.is_primary ? 'true' : 'false');

            await axiosInstance.post(`/fields/${createdPitchId}/images/upload/`, formPayload, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          }
        }

        setSuccessMessage(
          pendingCreateImages.length ? 'Them san moi va upload anh thanh cong.' : 'Them san moi thanh cong.'
        );
      }

      await loadPitches();
      resetForm();
    } catch (requestError) {
      if (requestError instanceof Error && !requestError.response) {
        setFormError(requestError.message);
        return;
      }
      const responseData = requestError.response?.data;
      if (typeof responseData === 'string') {
        setFormError(responseData);
      } else if (responseData && typeof responseData === 'object') {
        const firstMessage = Object.values(responseData).flat()[0];
        setFormError(firstMessage || 'Khong the luu thong tin san.');
      } else {
        setFormError('Khong the luu thong tin san.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCreateImage = () => {
    if (!imageFile) {
      setImageError('Vui long chon mot file anh.');
      return;
    }

    const nextImage = createDraftImage(imageFile, Number(imageOrder || 0), imageIsPrimary);
    setPendingCreateImages((prev) => {
      const normalizedPrev = imageIsPrimary
        ? prev.map((item) => ({ ...item, is_primary: false }))
        : prev;
      return [...normalizedPrev, nextImage];
    });
    setImageError('');
    setImageFile(null);
    setImageOrder('0');
    setImageIsPrimary(false);
  };

  const handleRemoveCreateImage = (imageId) => {
    setPendingCreateImages((prev) => {
      const imageToRemove = prev.find((item) => item.id === imageId);
      if (imageToRemove?.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== imageId);
    });
  };

  const handleImageUpload = async (event) => {
    event.preventDefault();

    if (!editingPitchId) {
      setImageError('Hay chon mot san de chinh sua truoc khi them anh.');
      return;
    }

    if (!imageFile) {
      setImageError('Vui long chon mot file anh.');
      return;
    }

    try {
      setUploadingImage(true);
      setImageError('');
      setSuccessMessage('');

      const formPayload = new FormData();
      formPayload.append('image', imageFile);
      formPayload.append('order', imageOrder || '0');
      formPayload.append('is_primary', imageIsPrimary ? 'true' : 'false');

      await axiosInstance.post(`/fields/${editingPitchId}/images/upload/`, formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await refreshEditingPitchImages();
      await loadPitches();
      setImageFile(null);
      setImageOrder('0');
      setImageIsPrimary(false);
      setSuccessMessage('Them anh san thanh cong.');
    } catch (requestError) {
      setImageError(requestError.response?.data?.error || 'Khong the upload anh san.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      setImageError('');
      setSuccessMessage('');
      await axiosInstance.patch(`/fields/${editingPitchId}/images/${imageId}/set-primary/`);
      await refreshEditingPitchImages();
      await loadPitches();
      setSuccessMessage('Da cap nhat anh chinh.');
    } catch (requestError) {
      setImageError(requestError.response?.data?.error || 'Khong the cap nhat anh chinh.');
    }
  };

  const handleDeleteImage = async (imageId) => {
    const shouldDelete = window.confirm('Ban co chac muon xoa anh nay khong?');
    if (!shouldDelete) {
      return;
    }

    try {
      setImageError('');
      setSuccessMessage('');
      await axiosInstance.delete(`/fields/${editingPitchId}/images/${imageId}/delete/`);
      await refreshEditingPitchImages();
      await loadPitches();
      setSuccessMessage('Da xoa anh san.');
    } catch (requestError) {
      setImageError(requestError.response?.data?.error || 'Khong the xoa anh san.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quan ly san bong</h1>
            <p className="text-gray-500 mt-2">Thong tin san, hinh anh va sau nay la khung gio se duoc quan ly tap trung tai day.</p>
          </div>
          <Link to="/" className="text-primary hover:underline">
            Ve trang khach
          </Link>
        </div>

        <AdminNav />

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Chinh sua san' : 'Them san moi'}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Huy chinh sua
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Loai san</span>
              <select
                name="field_type"
                value={formData.field_type}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Chon loai san</option>
                {fieldTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            {canAssignOwner && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Chu san</span>
                <select
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                >
                  <option value="">Chon admin quan ly</option>
                  {adminUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Ten san</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Mo ta</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Dia chi</span>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Vi do</span>
              <input
                type="number"
                step="0.000001"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="16.054407"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Kinh do</span>
              <input
                type="number"
                step="0.000001"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="108.202164"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            {/* Leaflet Mini Map */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Vi tri tren ban do</span>
                <span className="text-xs text-gray-500">Click vao ban do hoac keo marker de chon vi tri</span>
              </div>
              <div
                ref={mapContainerRef}
                className="w-full h-64 rounded-lg border border-gray-300 overflow-hidden"
                style={{ zIndex: 1 }}
              />
              {formData.latitude && formData.longitude && (
                <p className="mt-2 text-xs text-gray-500">
                  Toa do: {formData.latitude}, {formData.longitude}
                </p>
              )}
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Gia gio thuong</span>
              <input
                type="number"
                min="0"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Gia gio cao diem</span>
              <input
                type="number"
                min="0"
                name="peak_hour_price"
                value={formData.peak_hour_price}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Phan tram tien coc</span>
              <input
                type="number"
                min="0"
                max="100"
                name="deposit_percent"
                value={formData.deposit_percent}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            <label className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Dang hoat dong</span>
            </label>

            <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hinh anh san</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {isEditing
                      ? 'Ban dang o che do chinh sua. Co the them anh moi ngay ben duoi va quan ly thu vien anh hien tai.'
                      : 'Chon anh truoc khi tao san. He thong se tu dong upload ngay sau khi san duoc tao thanh cong.'}
                  </p>
                </div>

                {!isEditing && (
                  <>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.4fr)_180px_220px] md:items-end">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Chon anh</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Thu tu hien thi</span>
                        <input
                          type="number"
                          min="0"
                          value={imageOrder}
                          onChange={(event) => setImageOrder(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                        />
                      </label>

                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={imageIsPrimary}
                            onChange={(event) => setImageIsPrimary(event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-gray-700">Dat lam anh chinh</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAddCreateImage}
                          className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                        >
                          Them vao danh sach anh
                        </button>
                      </div>
                    </div>

                    {pendingCreateImages.length > 0 && (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {pendingCreateImages.map((image) => (
                          <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <img src={image.previewUrl} alt={image.file.name} className="h-48 w-full object-cover" />
                            <div className="space-y-3 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-slate-500">Thu tu: {image.order}</span>
                                {image.is_primary && (
                                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                                    Anh chinh
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-sm font-medium text-slate-800">{image.file.name}</p>
                              <button
                                type="button"
                                onClick={() => handleRemoveCreateImage(image.id)}
                                className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                              >
                                Xoa khoi danh sach
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {formError && (
              <div className="md:col-span-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="md:col-span-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
              >
                {submitting ? 'Dang luu...' : isEditing ? 'Cap nhat san' : 'Them san'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Dat lai
              </button>
            </div>
          </form>
        </div>

        {isEditing && (
          <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quan ly anh san</h2>
              <p className="text-sm text-gray-500 mt-2">
                Upload anh cho san dang duoc chinh sua. Ban co the dat anh chinh va xoa anh khong can dung.
              </p>
            </div>

            <form onSubmit={handleImageUpload} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Chon anh</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Thu tu hien thi</span>
                <input
                  type="number"
                  min="0"
                  value={imageOrder}
                  onChange={(event) => setImageOrder(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={imageIsPrimary}
                  onChange={(event) => setImageIsPrimary(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Dat lam anh chinh</span>
              </label>

              <div>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                >
                  {uploadingImage ? 'Dang upload...' : 'Them anh'}
                </button>
              </div>
            </form>

            {imageError && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {imageError}
              </div>
            )}

            {pitchImages.length === 0 ? (
              <p className="text-sm text-gray-500">San nay chua co anh nao.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {pitchImages.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <img src={image.image_url} alt={`pitch-${editingPitchId}-${image.id}`} className="w-full h-48 object-cover" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Thu tu: {image.order}</span>
                        {image.is_primary && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                            Anh chinh
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(image.id)}
                          className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Dat anh chinh
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Xoa anh
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-700">Danh sach san hien tai</h2>
            <span className="text-sm text-gray-500">{pitches.length} san</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-primary font-semibold">Dang tai danh sach san...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : pitches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chua co san nao trong he thong.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ten san</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loai</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chu san</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gia / gio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tien coc</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trang thai</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pitches.map((pitch) => (
                    <tr key={pitch.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{pitch.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{pitch.field_type?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{pitch.owner_username || 'Chua gan'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {Number(pitch.price_per_hour).toLocaleString('vi-VN')} d
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{pitch.deposit_percent}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            pitch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pitch.is_active ? 'Hoat dong' : 'Tam dung'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(pitch.id)}
                            className="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Sua
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pitch.id, pitch.name)}
                            className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                          >
                            Xoa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePitches;
