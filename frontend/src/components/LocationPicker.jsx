import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix cho icon marker của Leaflet trong React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icon tùy chỉnh cho marker
const createCustomIcon = (color = '#14b8a6') => {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="45">
      <path fill="${color}" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12zm0 16a4 4 0 110-8 4 4 0 010 8z"/>
    </svg>`,
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
    className: 'custom-marker-icon',
  });
};

// Component để xử lý click trên bản đồ
function LocationMarker({ onLocationSelect, initialPosition }) {
  const [position, setPosition] = useState(initialPosition);
  
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      onLocationSelect({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    },
  });

  useEffect(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  return position === null ? null : (
    <Marker 
      position={[position.lat, position.lng]}
      icon={createCustomIcon()}
    />
  );
}

// Component chính
const LocationPicker = ({ 
  value = {}, 
  onChange, 
  height = '400px',
  defaultLocation = { lat: 16.054407, lng: 108.202164 } // Default: Đà Nẵng
}) => {
  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Khi có vị trí từ form (chế độ sửa), cập nhật marker
  useEffect(() => {
    if (value.latitude && value.longitude) {
      const lat = parseFloat(value.latitude);
      const lng = parseFloat(value.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
      }
    }
  }, [value.latitude, value.longitude]);

  // Xử lý khi chọn vị trí trên bản đồ
  const handleLocationSelect = (location) => {
    onChange(location);
  };

  // Tìm kiếm địa chỉ qua Nominatim API
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce 500ms
  };

  // Chọn kết quả tìm kiếm
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setMapCenter({ lat, lng });
    setMarkerPosition({ lat, lng });
    onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  // Lấy vị trí hiện tại của người dùng
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });
          setMarkerPosition({ lat, lng });
          onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Trình duyệt không hỗ trợ lấy vị trí.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Nhập địa chỉ để tìm kiếm (VD: 123 Nguyễn Văn Linh, Đà Nẵng)..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-primary"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
            title="Lay vi tri hien tai"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.5l-4.95-4.45a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-[9999] mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onMouseDown={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">{result.display_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border-2 border-gray-300" style={{ height }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            onLocationSelect={handleLocationSelect}
            initialPosition={markerPosition}
          />
        </MapContainer>
      </div>

      {/* Coordinates Display */}
      {value.latitude && value.longitude && (
        <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.5l-4.95-4.45a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-teal-900">
              Đã chọn: <span className="font-bold">{value.latitude}, {value.longitude}</span>
            </span>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        💡 <strong>Mẹo:</strong> Click vào bản đồ để chọn vị trí chính xác, hoặc nhập địa chỉ để tìm kiếm
      </p>
    </div>
  );
};

export default LocationPicker;
