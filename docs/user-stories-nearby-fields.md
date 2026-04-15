# User Stories: Tính năng "Tìm sân gần đây"

## Epic: Địa điểm & Bản đồ

---

### US-01: Tìm sân gần vị trí hiện tại
**Là** một người dùng muốn đặt sân,
**Tôi muốn** tìm các sân bóng gần vị trí hiện tại của tôi,
**Để** tôi có thể nhanh chóng chọn sân thuận tiện di chuyển.

**Acceptance Criteria:**
- [ ] Nút "Tìm sân gần tôi" trên trang chủ và trang danh sách sân
- [ ] Trình duyệt xin quyền truy cập vị trí (geolocation permission)
- [ ] Hiển thị danh sách sân theo khoảng cách tăng dần
- [ ] Mỗi sân hiển thị: tên, ảnh, giá, rating, **khoảng cách (km)**
- [ ] Người dùng có thể chọn bán kính tìm (3km, 5km, 10km, 20km)
- [ ] Nếu người dùng từ chối chia sẻ vị trí → hiện thông báo + cho phép nhập thủ công

**Priority:** P0 (Bắt buộc)
**Estimate:** 3 story points

---

### US-02: Xem sân trên bản đồ
**Là** một người dùng,
**Tôi muốn** xem vị trí các sân bóng trên bản đồ,
**Để** tôi dễ hình dung khoảng cách và路线 đi.

**Acceptance Criteria:**
- [ ] Bản đồ tương tác (Leaflet hoặc Google Maps) hiển thị các marker sân
- [ ] Click vào marker → popup hiển thị: tên sân, ảnh, giá, rating, link chi tiết
- [ ] Marker sân của tôi có màu/icon đặc biệt
- [ ] Toggle giữa chế độ "Danh sách" và "Bản đồ"
- [ ] Responsive: mobile hiển thị map full-screen

**Priority:** P0 (Bắt buộc)
**Estimate:** 5 story points

---

### US-03: Admin nhập toạ độ sân khi tạo/cập nhật
**Là** chủ sân (admin),
**Tôi muốn** nhập hoặc tự động lấy toạ độ (lat/lng) khi tạo sân,
**Để** sân của tôi xuất hiện khi người dùng tìm kiếm theo vị trí.

**Acceptance Criteria:**
- [ ] Form tạo/cập nhật sân có 2 field: latitude, longitude
- [ ] Có nút "Lấy vị trí hiện tại" (dùng browser geolocation)
- [ ] Có autocomplete địa chỉ (Google Places hoặc OpenStreetMap Nominatim)
- [ ] Validate: lat trong [-90, 90], lng trong [-180, 180]
- [ ] Preview vị trí trên mini-map trong form

**Priority:** P0 (Bắt buộc)
**Estimate:** 3 story points

---

### US-04: Lọc sân theo khoảng cách trên danh sách chính
**Là** một người dùng,
**Tôi muốn** lọc sân theo khoảng cách từ vị trí của tôi trên trang danh sách,
**Để** tôi có thể kết hợp filter khoảng cách với các tiêu chí khác (giá, loại sân, rating).

**Acceptance Criteria:**
- [ ] Endpoint `/api/fields/` hỗ trợ thêm param: `user_lat`, `user_lng`, `max_distance_km`
- [ ] Kết quả trả về có thêm field `distance_km` (nếu có user_lat/lng)
- [ ] Frontend có slider/input để chọn bán kính tối đa
- [ ] Kết hợp được với các filter hiện có (type, price, rating)

**Priority:** P1 (Quan trọng)
**Estimate:** 3 story points

---

### US-05: Gợi ý sân gần trên trang chủ
**Là** một người dùng truy cập trang chủ,
**Tôi muốn** thấy danh sách sân gần tôi ngay trên trang chủ,
**Để** tôi không cần vào trang danh sách sân.

**Acceptance Criteria:**
- [ ] Home.jsx có section "Sân gần bạn" (dưới hero section)
- [ ] Tự động xin quyền location khi user vào trang chủ
- [ ] Nếu có location → gọi `/api/fields/nearby/` và hiển thị 4-6 sân gần nhất
- [ ] Nếu không có location → hiện message "Cho phép truy cập vị trí để xem sân gần bạn"
- [ ] Card sân giống UI hiện tại + badge khoảng cách

**Priority:** P1 (Quan trọng)
**Estimate:** 2 story points

---

### US-06: Chỉ đường đến sân
**Là** một người dùng,
**Tôi muốn** xem chỉ đường từ vị trí hiện tại đến sân,
**Để** tôi dễ dàng di chuyển.

**Acceptance Criteria:**
- [ ] Trên trang chi tiết sân, có nút "Chỉ đường"
- [ ] Click → mở Google Maps / Apple Maps với route từ current location đến sân
- [ ] URL format: `https://www.google.com/maps/dir/?api=1&origin=lat1,lng1&destination=lat2,lng2`

**Priority:** P2 (Nên có)
**Estimate:** 1 story point

---

### US-07: Reverse geocoding - Hiển thị địa chỉ từ toạ độ
**Là** một người dùng,
**Tôi muốn** thấy địa chỉ đọc được (ví dụ: "123 Nguyễn Văn Linh, Q. Thanh Khê, Đà Nẵng") thay vì chỉ số lat/lng,
**Để** tôi dễ hiểu vị trí sân.

**Acceptance Criteria:**
- [ ] Backend: gọi OpenStreetMap Nominatim API để reverse geocode
- [ ] Lưu `address_display` vào Field model (hoặc tính toán on-the-fly)
- [ ] Frontend hiển thị địa chỉ thay vì "Chưa cập nhật địa chỉ"

**Priority:** P2 (Nên có)
**Estimate:** 2 story points

---

## Phụ thuộc & Thứ tự ưu tiên

```
Phase 1 (MVP):  US-01 → US-03 → US-05
                    ↓
Phase 2 (Core):   US-02 → US-04
                    ↓
Phase 3 (Nice):   US-06 → US-07
```

**Lý do:**
- Phase 1: Người dùng tìm được sân, admin nhập được toạ độ → có dữ liệu để hoạt động
- Phase 2: Trải nghiệm bản đồ + filter nâng cao → UX tốt hơn
- Phase 3: Tiện ích bổ sung → chỉ đường, địa chỉ đẹp
