# 📍 Hướng dẫn sử dụng tính năng "Tìm kiếm sân bóng gần đây"

## 🎯 Tổng quan

Dự án đã được nâng cấp với các tính năng chuyên nghiệp:

### ✅ **Cho Admin (Quản lý sân)**
1. **Bản đồ tương tác Leaflet.js** - Chọn vị trí trực quan
2. **Tìm kiếm địa chỉ tự động** - Gõ địa chỉ → Tự động gợi ý tọa độ
3. **Click trên bản đồ** - Chọn vị trí chính xác bằng 1 click
4. **Lấy vị trí hiện tại** - 1 click để lấy tọa độ GPS
5. **Kéo marker** - Điều chỉnh vị trí chính xác

### ✅ **Cho User (Tìm kiếm sân)**
1. **Tìm sân gần đây** - Tự động lấy vị trí GPS
2. **Thanh tìm kiếm** - Tìm theo tên/địa chỉ sân
3. **Bộ lọc nâng cao**:
   - Khoảng giá (từ - đến)
   - Đánh giá tối thiểu (3-5 sao)
   - Loại sân (5 người, 7 người, ...)
4. **Sắp xếp linh hoạt**:
   - Khoảng cách gần nhất
   - Giá tăng/giảm dần
   - Đánh giá cao nhất
   - Tên A-Z
5. **Hiển thị khoảng cách** - Xem khoảng cách từ vị trí bạn đến sân

---

## 📋 Hướng dẫn sử dụng cho Admin

### **Thêm sân mới**

1. **Truy cập trang quản lý**:
   - Đăng nhập với tài khoản admin
   - Vào `/admin/manage-pitches`

2. **Nhập thông tin cơ bản**:
   - Chọn loại sân
   - Tên sân
   - Mô tả
   - Địa chỉ (text)

3. **Chọn vị trí trên bản đồ** (3 cách):

   **Cách 1: Tìm kiếm địa chỉ**
   ```
   - Gõ địa chỉ vào ô tìm kiếm (VD: "123 Nguyễn Văn Linh, Đà Nẵng")
   - Hệ thống gợi ý 5 địa chỉ phù hợp
   - Click vào kết quả → Marker tự động nhảy đến vị trí đó
   ```

   **Cách 2: Click trên bản đồ**
   ```
   - Click trực tiếp vào vị trí mong muốn trên bản đồ
   - Marker sẽ xuất hiện tại vị trí bạn click
   - Tọa độ tự động cập nhật
   ```

   **Cách 3: Lấy vị trí hiện tại**
   ```
   - Click nút 📍 (bên phải ô tìm kiếm)
   - Trình duyệt yêu cầu quyền truy cập vị trí
   - Cho phép → Marker nhảy đến vị trí hiện tại của bạn
   ```

4. **Điều chỉnh chính xác** (nếu cần):
   - Kéo marker đến vị trí mong muốn
   - Tọa độ tự động cập nhật

5. **Kiểm tra tọa độ**:
   - Phía dưới bản đồ hiển thị tọa độ đã chọn
   - VD: `Đã chọn: 16.054407, 108.202164`

6. **Nhập thông tin còn lại**:
   - Giá giờ thường
   - Giá giờ cao điểm
   - Phần trăm tiền cọc
   - Upload hình ảnh

7. **Click "Thêm sân"** để lưu

### **Chỉnh sửa sân hiện có**

1. Tìm sân trong bảng danh sách
2. Click nút **"Sửa"**
3. Bản đồ sẽ hiển thị marker tại vị trí cũ
4. Thay đổi vị trí (nếu cần) bằng 1 trong 3 cách trên
5. Click **"Cập nhật sân"** để lưu

---

## 📋 Hướng dẫn sử dụng cho User

### **Tìm sân gần vị trí hiện tại**

1. **Truy cập trang danh sách sân**:
   - Vào `/pitches` hoặc click "Sân bóng" trên menu

2. **Tìm sân gần tôi**:
   ```
   - Cuộn lên phần "Tìm sân gần vị trí của bạn"
   - Click nút "Tìm sân gần tôi"
   - Cho phép truy cập vị trí khi trình duyệt yêu cầu
   - Hệ thống hiển thị các sân trong bán kính 15km
   - Mỗi sân hiển thị khoảng cách (VD: 2.5 km)
   ```

3. **Xem kết quả**:
   - Các sân được sắp xếp theo khoảng cách (gần nhất trước)
   - Hiển thị: Tên sân, loại, địa chỉ, giá, đánh giá, khoảng cách
   - Click "Xem chi tiết" để xem thông tin đầy đủ

### **Tìm kiếm theo tên/địa chỉ**

1. **Sử dụng thanh tìm kiếm**:
   ```
   - Gõ tên sân hoặc địa chỉ vào ô tìm kiếm
   - VD: "Sân bóng ABC" hoặc "Nguyễn Văn Linh"
   - Kết quả lọc ngay khi bạn gõ
   ```

### **Sử dụng bộ lọc nâng cao**

1. **Mở bộ lọc**:
   ```
   - Click nút 🎛️ (bên phải ô tìm kiếm)
   - Hoặc click "Bộ lọc" nếu có
   ```

2. **Thiết lập bộ lọc**:
   ```
   - Giá từ: Nhập giá tối thiểu (VD: 200000)
   - Giá đến: Nhập giá tối đa (VD: 500000)
   - Đánh giá tối thiểu: Chọn từ dropdown (3-5 sao)
   - Sắp xếp theo: Chọn tiêu chí sắp xếp
   ```

3. **Áp dụng**:
   - Bộ lọc tự động áp dụng ngay khi thay đổi
   - Click "Xóa bộ lọc" để reset tất cả

### **Sắp xếp kết quả**

Các tùy chọn sắp xếp:
- ⭐ **Đánh giá cao nhất** (mặc định)
- 💰 **Giá tăng dần** - Rẻ nhất trước
- 💰💰 **Giá giảm dần** - Đắt nhất trước
- 🔤 **Tên A-Z** - Theo alphabet
- 📍 **Khoảng cách gần nhất** (chỉ xuất hiện khi đã cho phép truy cập vị trí)

---

## 🔧 Kỹ thuật

### **Công nghệ sử dụng**

#### Frontend:
- **Leaflet.js** 1.9.4 - Thư viện bản đồ mã nguồn mở
- **React-Leaflet** 5.0.0 - React wrapper cho Leaflet
- **OpenStreetMap** - Tile layer miễn phí
- **Nominatim Geocoding API** - Chuyển địa chỉ → tọa độ

#### Backend:
- **Haversine Formula** - Tính khoảng cách giữa 2 điểm trên Trái Đất
- API endpoint: `GET /api/fields/nearby/`
- Parameters: `latitude`, `longitude`, `radius_km`, `limit`

### **Cấu trúc dữ liệu**

```python
# Field model
{
    "latitude": Decimal(9, 6),  # VD: 16.054407
    "longitude": Decimal(9, 6), # VD: 108.202164
    "location": "String"         # Địa chỉ text
}
```

### **API Nearby**

**Request:**
```
GET /api/fields/nearby/?latitude=16.054407&longitude=108.202164&radius_km=15&limit=6
```

**Response:**
```json
{
  "origin": {
    "latitude": 16.054407,
    "longitude": 108.202164,
    "radius_km": 15
  },
  "results": [
    {
      "id": 1,
      "name": "Sân ABC",
      "location": "123 Đường XYZ",
      "latitude": 16.055000,
      "longitude": 108.203000,
      "price_per_hour": 300000,
      "avg_rating": 4.5,
      "distance_km": 0.85,
      ...
    }
  ]
}
```

### **Component LocationPicker**

**File:** `frontend/src/components/LocationPicker.jsx`

**Props:**
```jsx
<LocationPicker
  value={{ latitude: '16.054407', longitude: '108.202164' }}
  onChange={(location) => console.log(location)}
  height="400px"
  defaultLocation={{ lat: 16.054407, lng: 108.202164 }}
/>
```

**Tính năng:**
- ✅ Tìm kiếm địa chỉ với debounce 500ms
- ✅ Click trên bản đồ để chọn vị trí
- ✅ Lấy vị trí hiện tại qua GPS
- ✅ Marker tùy chỉnh màu teal
- ✅ Hiển thị tọa độ đã chọn
- ✅ Auto-complete từ Nominatim API

---

## 🎨 Tùy chỉnh

### **Thay đổi màu marker**

Mở `frontend/src/components/LocationPicker.jsx`, tìm dòng:
```javascript
const createCustomIcon = (color = '#14b8a6') => {
```

Thay `#14b8a6` bằng màu bạn muốn (hex code).

### **Thay đổi bán kính tìm kiếm**

Mở `frontend/src/pages/public/PitchList.jsx`, tìm dòng:
```javascript
radius_km: 15,
```

Thay bằng giá trị bạn muốn (1-100 km).

### **Thay đổi vị trí mặc định (Default Center)**

Mở `frontend/src/components/LocationPicker.jsx`, tìm:
```javascript
defaultLocation = { lat: 16.054407, lng: 108.202164 } // Default: Da Nang
```

Thay bằng tọa độ thành phố của bạn.

---

## 🚀 Kiểm thử

### **Test cho Admin:**

1. ✅ Đăng nhập admin
2. ✅ Vào trang quản lý sân
3. ✅ Click "Thêm sân mới"
4. ✅ Gõ địa chỉ "Cầu Rồng, Đà Nẵng" → Chọn kết quả
5. ✅ Kiểm tra marker đã nhảy đúng vị trí chưa
6. ✅ Click thử trên bản đồ → Marker di chuyển
7. ✅ Click nút 📍 → Lấy vị trí hiện tại
8. ✅ Kiểm tra tọa độ hiển thị bên dưới bản đồ
9. ✅ Lưu sân và kiểm tra database

### **Test cho User:**

1. ✅ Vào trang `/pitches`
2. ✅ Click "Tìm sân gần tôi"
3. ✅ Cho phép truy cập vị trí
4. ✅ Kiểm tra kết quả hiển thị
5. ✅ Thử thanh tìm kiếm
6. ✅ Mở bộ lọc, thiết lập khoảng giá
7. ✅ Thay đổi sắp xếp theo khoảng cách
8. ✅ Click "Xóa bộ lọc" → Reset

---

## 📝 Lưu ý quan trọng

### **Cho Admin:**
- ⚠️ **Luôn chọn vị trí chính xác** trên bản đồ để user tìm kiếm dễ dàng
- ⚠️ **Kiểm tra lại tọa độ** trước khi lưu
- ⚠️ Địa chỉ text và tọa độ nên khớp nhau
- ⚠️ Nếu không tìm thấy địa chỉ, thử gõ tên đường + quận + thành phố

### **Cho User:**
- ⚠️ **Cho phép truy cập vị trí** khi trình duyệt yêu cầu
- ⚠️ GPS chính xác hơn trên điện thoại
- ⚠️ Trên máy tính, vị trí có thể lệch vài km

### **Performance:**
- ✅ Nominatim API miễn phí nhưng có rate limit (1 request/giây)
- ✅ Debounce 500ms đã được tích hợp
- ✅ Nếu cần scale lớn, nên dùng Google Maps API (trả phí)

---

## 🐛 Xử lý lỗi

### **Lỗi: "Không thể lấy vị trí hiện tại"**
**Nguyên nhân:**
- Người dùng từ chối quyền truy cập
- Trình duyệt không hỗ trợ
- Không có GPS (máy tính bàn)

**Giải pháp:**
- Cho phép truy cập vị trí khi được yêu cầu
- Thử trên điện thoại
- Nhập địa chỉ thủ công trong ô tìm kiếm

### **Lỗi: "Không tìm thấy địa chỉ"**
**Nguyên nhân:**
- Địa chỉ không tồn tại trong OpenStreetMap
- Gõ sai chính tả

**Giải pháp:**
- Thử gõ ngắn gọn hơn (VD: "Nguyễn Văn Linh, Đà Nẵng")
- Click trực tiếp trên bản đồ

### **Lỗi: Bản đồ không hiển thị**
**Nguyên nhân:**
- Chưa cài leaflet
- Lỗi CSS

**Giải pháp:**
```bash
cd frontend
npm install leaflet react-leaflet
```

---

## 🎯 Phát triển tiếp theo (Giai đoạn 3)

Các tính năng có thể thêm trong tương lai:

1. **Hiển thị bản đồ trong PitchList**
   - Bản đồ với tất cả marker sân
   - Click marker → Xem thông tin nhanh

2. **Chỉ đường đến sân**
   - Tích hợp Google Maps Directions
   - Hiển thị đường đi từ vị trí user → sân

3. **Lưu vị trí yêu thích**
   - Lưu các sân đã đặt
   - Gợi ý dựa trên vị trí yêu thích

4. **Real-time availability**
   - Hiển thị sân trống theo thời gian thực
   - Lọc theo khung giờ mong muốn

5. **Heatmap sân đông đúc**
   - Hiển thị khu vực nhiều sân
   - Màu sắc theo đánh giá/giá

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console trình duyệt (F12 → Console)
2. Xem log backend
3. Kiểm tra database có latitude/longitude chưa
4. Đảm bảo đã cài `leaflet` và `react-leaflet`

---

**Chúc bạn thành công! 🚀⚽**
