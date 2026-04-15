# 📅 Hướng dẫn sử dụng: Quản lý lịch hoạt động & Xử lý sự cố sân

## 🎯 Tổng quan

Hệ thống đã được nâng cấp với 2 tính năng quan trọng:

### ✅ **1. Quản lý lịch hoạt động thông minh**
- Tự động sinh khung giờ từ lịch mở/đóng cửa
- Quản lý lịch theo từng ngày trong tuần
- Đóng cửa đặc biệt (bảo trì, lễ tết, sự cố)
- Visual màu xanh/đỏ trực quan

### ✅ **2. Xử lý sự cố & Đổi sân**
- Báo cáo sự cố khi đang sử dụng sân
- Tự động tìm sân thay thế
- Flow đổi sân tự động
- Bồi thường & hoàn tiền

---

## 📋 PHẦN 1: QUẢN LÝ LỊCH HOẠT ĐỘNG

### **A. Model đã tạo**

#### 1. FieldSchedule - Lịch hoạt động theo ngày
```python
{
    "field": ForeignKey,
    "day_of_week": 0-6 (0=Thứ 2, 6=Chủ nhật),
    "is_open": Boolean,
    "open_time": TimeField,
    "close_time": TimeField,
    "slot_duration": Integer (phút, mặc định 60)
}
```

#### 2. FieldClosure - Ngày đóng cửa đặc biệt
```python
{
    "field": ForeignKey,
    "start_date": DateField,
    "end_date": DateField,
    "reason": TextField,
    "closure_type": "maintenance" | "holiday" | "issue" | "weather" | "other"
}
```

### **B. API Endpoints**

#### **Quản lý lịch tuần:**

```bash
# Lấy danh sách lịch của sân
GET /api/fields/schedules/?field=1

# Tạo lịch mới
POST /api/fields/schedules/
{
    "field": 1,
    "day_of_week": 0,
    "is_open": true,
    "open_time": "06:00:00",
    "close_time": "22:00:00",
    "slot_duration": 60
}

# Cập nhật lịch
PUT /api/fields/schedules/1/
{
    "is_open": true,
    "open_time": "06:00:00",
    "close_time": "23:00:00"
}

# Xóa lịch
DELETE /api/fields/schedules/1/
```

#### **Tự động sinh TimeSlot:**

```bash
# Sinh khung giờ từ schedule
POST /api/fields/1/schedules/generate-slots/

Response:
{
    "message": "Đã tạo thành công 112 khung giờ cho Sân 5-A",
    "total_slots": 112
}
```

**Logic hoạt động:**
1. Xóa tất cả TimeSlot cũ của sân
2. Duyệt qua từng ngày trong tuần (Thứ 2 - Chủ nhật)
3. Với mỗi ngày `is_open=true`:
   - Chia từ `open_time` đến `close_time` theo `slot_duration`
   - Tự động xác định giờ cao điểm (18:00-21:00) → áp peak_hour_price
   - Tạo TimeSlot mới

**Ví dụ:**
```
Sân 5-A:
- Thứ 2-5: 06:00-22:00, slot 60 phút → 16 slots/ngày
- Thứ 6-CN: 06:00-23:00, slot 60 phút → 17 slots/ngày

Tổng: 16×4 + 17×3 = 115 slots/tuần
```

#### **Quản lý ngày đóng cửa:**

```bash
# Tạo ngày đóng cửa
POST /api/fields/closures/
{
    "field": 1,
    "start_date": "2026-04-20",
    "end_date": "2026-04-22",
    "reason": "Bảo trì hệ thống đèn",
    "closure_type": "maintenance"
}

# Lấy danh sách ngày đóng cửa
GET /api/fields/closures/?field=1

# Xóa ngày đóng cửa
DELETE /api/fields/closures/1/
```

---

## 📋 PHẦN 2: XỬ LÝ SỰ CỐ & ĐỔI SÂN

### **A. Model đã tạo**

#### 1. IncidentReport - Báo cáo sự cố
```python
{
    "field": ForeignKey,
    "booking": ForeignKey,
    "reported_by": ForeignKey(User),
    "issue_type": "field_damage" | "weather" | "emergency" | "equipment" | "safety" | "other",
    "severity": "low" | "medium" | "high",
    "description": TextField,
    "photos": JSONField [url1, url2, ...],
    "status": "pending" | "investigating" | "resolving" | "resolved" | "cancelled"
}
```

#### 2. FieldSwap - Đổi sân
```python
{
    "incident": ForeignKey,
    "original_field": ForeignKey,
    "new_field": ForeignKey,
    "original_booking": ForeignKey,
    "new_booking": ForeignKey,
    "price_difference": DecimalField,
    "compensation_amount": DecimalField,
    "status": "pending" | "searching" | "proposed" | "confirmed" | "completed" | "cancelled" | "failed",
    "customer_notified": Boolean,
    "customer_accepted": Boolean
}
```

### **B. API Endpoints**

#### **Báo cáo sự cố:**

```bash
# Tạo báo cáo sự cố
POST /api/fields/incidents/
{
    "field": 1,
    "booking": 123,
    "issue_type": "field_damage",
    "severity": "high",
    "description": "Đèn khu vực A bị tắt, không thể tiếp tục chơi",
    "photos": ["url1.jpg", "url2.jpg"]
}

# Lấy danh sách sự cố
GET /api/fields/incidents/?status=pending&field=1

# Cập nhật trạng thái
PUT /api/fields/incidents/1/
{
    "status": "investigating",
    "admin_notes": "Đang kiểm tra với kỹ thuật viên"
}
```

#### **Tìm sân thay thế:**

```bash
# Tìm sân thay thế
POST /api/fields/swaps/find-alternative/
{
    "incident_id": 1
}

Response:
{
    "incident_id": 1,
    "original_field": {
        "id": 1,
        "name": "Sân 5-A"
    },
    "booking_date": "2026-04-15",
    "alternatives": [
        {
            "field_id": 2,
            "field_name": "Sân 5-B",
            "field_type": "Sân 5",
            "location": "456 Đường XYZ",
            "distance_km": 1.2,
            "total_price": 300000,
            "price_difference": 0,
            "available_slots": 2,
            "required_slots": 2
        },
        {
            "field_id": 3,
            "field_name": "Sân 5-C",
            "distance_km": 2.5,
            "total_price": 350000,
            "price_difference": 50000
        }
    ]
}
```

**Algorithm tìm sân thay thế:**
1. Lấy thông tin từ booking gốc:
   - Ngày đặt
   - Khung giờ đã đặt
   - Loại sân (5/7 người)

2. Tìm sân cùng loại, đang hoạt động

3. Loại các sân:
   - Đang đóng cửa ngày đó (FieldClosure)
   - Không có lịch mở cửa (FieldSchedule)

4. Với mỗi sân còn lại:
   - Kiểm tra các khung giờ tương ứng có trống không
   - Tính khoảng cách từ sân gốc (Haversine formula)
   - Tính chênh lệch giá

5. Sắp xếp theo:
   - Khoảng cách gần nhất
   - Giá chênh lệch thấp nhất

6. Trả về Top 5 sân phù hợp nhất

#### **Tạo yêu cầu đổi sân:**

```bash
# Tạo swap
POST /api/fields/swaps/
{
    "incident": 1,
    "original_field": 1,
    "new_field": 2,
    "original_booking": 123,
    "swap_reason": "Đèn sân hỏng, chuyển sang sân gần nhất"
}

# Cập nhật swap
PUT /api/fields/swaps/1/
{
    "status": "proposed",
    "price_difference": 0,
    "compensation_amount": 50000,
    "customer_notified": true
}
```

#### **Xác nhận đổi sân:**

```bash
# Xác nhận swap
POST /api/fields/swaps/1/confirm/

Response:
{
    "message": "Field swap confirmed successfully",
    "new_booking_id": 124,
    "swap": { ... }
}
```

**Flow xử lý khi confirm:**
1. Tạo booking mới ở sân mới với:
   - Cùng user, cùng ngày
   - Cùng khung giờ (timeslot tương ứng)
   - Giá mới (giá gốc + price_difference)
   
2. Link timeslots mới với booking mới

3. Cập nhật swap:
   - `new_booking` = booking mới
   - `status` = "confirmed"
   - `confirmed_at` = now

4. Hủy booking cũ:
   - `original_booking.status` = "cancelled"

5. Cập nhật incident:
   - `status` = "resolved"
   - `resolved_at` = now

---

## 🎨 GIAO DIỆN MONG MUỐN (Frontend - Chưa làm)

### **Admin - Quản lý lịch sân:**

```
┌─────────────────────────────────────────────────────────┐
│  Lịch hoạt động - Sân 5-A                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Thứ 2]  🟢 06:00 - 22:00  [✏️] [🗑️]                  │
│  [Thứ 3]  🟢 06:00 - 22:00  [✏️] [🗑️]                  │
│  [Thứ 4]  🟢 06:00 - 22:00  [✏️] [🗑️]                  │
│  [Thứ 5]  🟢 06:00 - 22:00  [✏️] [🗑️]                  │
│  [Thứ 6]  🟢 06:00 - 23:00  [✏️] [🗑️]                  │
│  [Thứ 7]  🟢 05:00 - 23:00  [✏️] [🗑️]                  │
│  [CN]     🟢 05:00 - 23:00  [✏️] [🗑️]                  │
│                                                          │
│  [➕ Thêm ngày đóng cửa]                                 │
│  [⚙️ Tự động sinh khung giờ]                            │
│                                                          │
│  ┌─ Khung giờ đã sinh (112 slots) ───────────────────┐ │
│  │ 06:00-07:00 🟢🟢🟢🟢🟢                      │ │
│  │ 07:00-08:00 🟢🟢🟢🟢🟢🟢                      │ │
│  │ ...                                                │ │
│  │ 18:00-19:00 🔴🟢🔴🟢🟢🔴 (Giờ cao điểm)     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Admin - Báo cáo sự cố:**

```
┌─────────────────────────────────────────────────────────┐
│  Báo cáo sự cố #123                                     │
├─────────────────────────────────────────────────────────┤
│  📅 Booking: #456 (18:00-19:00, 15/04/2026)            │
│  👤 Khách: Nguyễn Văn A (0901234567)                    │
│  🏟️ Sân: Sân 5-A                                        │
│                                                          │
│  ⚠️ Loại sự cố: Đèn sân khu vực A bị tắt               │
│  🔴 Mức độ: CAO - Buộc phải dừng chơi                   │
│                                                          │
│  📝 Mô tả chi tiết:                                     │
│  "Đang chơi thì đèn khu vực A đột ngột tắt,             │
│   còn 45 phút nữa mới hết giờ. Không thể tiếp tục."     │
│                                                          │
│  📸 Ảnh: [️] [🖼️] [🖼️]                               │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  💡 Gợi ý sân thay thế:                                  │
│                                                          │
│  ✅ Sân 5-B (cách 1.2km)                                │
│     - 18:00-19:00: TRỐNG                                │
│     - Giá: 300.000đ (giống sân gốc)                     │
│     - [🔄 Chọn sân này]                                 │
│                                                          │
│  ✅ Sân 5-C (cách 2.5km)                                │
│     - 18:00-19:00: TRỐNG                                │
│     - Giá: 350.000đ (+50.000đ)                          │
│     - [🔄 Chọn sân này]                                 │
│                                                          │
│  [❌ Hủy booking - Hoàn tiền]                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🗺️ ROADMAP TRIỂN KHAI FRONTEND

### **Giai đoạn tiếp theo (Cần làm):**

#### **Task 1: Admin - Quản lý lịch sân** (2-3 ngày)
- [ ] Component `FieldScheduleManager`
  - Bảng lịch theo tuần (Thứ 2 - CN)
  - Toggle mở/đóng cho từng ngày
  - Time picker cho open/close
  - Slot duration selector
  
- [ ] Component `TimeSlotPreview`
  - Hiển thị grid khung giờ đã sinh
  - Màu xanh: Còn trống
  - Màu đỏ: Đã đặt
  - Màu vàng: Giờ cao điểm
  
- [ ] Component `FieldClosureManager`
  - Date range picker
  - Reason textarea
  - Closure type dropdown
  - Danh sách ngày đã đóng

- [ ] Tích hợp vào trang `ManagePitches`
  - Tab mới "Lịch hoạt động"
  - Nút "Tự động sinh khung giờ"
  - Confirmation dialog

#### **Task 2: Admin - Quản lý sự cố** (2-3 ngày)
- [ ] Trang `IncidentManagement`
  - Danh sách sự cố theo status
  - Filter theo severity, field
  - Chi tiết sự cố với ảnh
  
- [ ] Component `AlternativeFieldFinder`
  - List sân thay thế với khoảng cách, giá
  - Sort options
  - Select & propose button
  
- [ ] Component `FieldSwapManager`
  - Tạo swap request
  - Confirm flow
  - Status tracking

#### **Task 3: User - Xem sự cố** (1 ngày)
- [ ] Component `ReportIncident` trong BookingDetail
  - Form báo cáo sự cố
  - Upload ảnh
  - Track status

---

## 📊 DATABASE MIGRATION

Đã tạo migration thành công:
```bash
python manage.py makemigrations fields
```

Migration file: `0004_alter_field_options_alter_fieldimage_options_and_more.py`

**Tables created:**
- `field_schedules`
- `field_closures`
- `incident_reports`
- `field_swaps`

**Để áp dụng:**
```bash
cd backend
python manage.py migrate
```

---

## 🧪 TESTING GUIDE

### **Test Schedule & TimeSlot Generation:**

```bash
# 1. Tạo schedule cho sân
POST /api/fields/schedules/
{
    "field": 1,
    "day_of_week": 0,
    "is_open": true,
    "open_time": "06:00:00",
    "close_time": "10:00:00",
    "slot_duration": 60
}

# 2. Sinh timeslots
POST /api/fields/1/schedules/generate-slots/

# 3. Kiểm tra timeslots đã tạo
GET /api/fields/timeslots/?field=1

# Expected: 4 slots (06-07, 07-08, 08-09, 09-10)
```

### **Test Incident & Field Swap:**

```bash
# 1. Tạo booking test
POST /api/bookings/create/
{
    "field": 1,
    "booking_date": "2026-04-20",
    "timeslot_ids": [1, 2]
}

# 2. Báo cáo sự cố
POST /api/fields/incidents/
{
    "field": 1,
    "booking": <booking_id>,
    "issue_type": "field_damage",
    "severity": "high",
    "description": "Test incident"
}

# 3. Tìm sân thay thế
POST /api/fields/swaps/find-alternative/
{
    "incident_id": <incident_id>
}

# 4. Tạo swap
POST /api/fields/swaps/
{
    "incident": <incident_id>,
    "original_field": 1,
    "new_field": 2,
    "original_booking": <booking_id>,
    "swap_reason": "Test swap"
}

# 5. Confirm swap
POST /api/fields/swaps/<swap_id>/confirm/

# 6. Kiểm tra:
# - Booking cũ status = "cancelled"
# - Booking mới được tạo ở sân 2
# - Incident status = "resolved"
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. TimeSlot Generation:**
- ⚠️ **Xóa hết timeslot cũ** trước khi sinh mới
- ✅ Nên backup trước khi chạy generate-slots
- ✅ Có thể chạy lại nhiều lần (idempotent)

### **2. Field Swap:**
- ⚠️ **Chỉ hoạt động** khi booking có timeslots
- ⚠️ **Yêu cầu** sân thay thế phải có cùng loại và khung giờ trống
- ✅ Tự động xử lý chênh lệch giá

### **3. Incident Status Flow:**
```
pending → investigating → resolving → resolved
   ↓
cancelled
```

### **4. Field Swap Status Flow:**
```
pending → searching → proposed → confirmed → completed
   ↓
cancelled / failed
```

---

## 📞 TROUBLESHOOTING

### **Lỗi: "No timeslots found for this booking"**
- Kiểm tra booking có timeslots chưa
- Booking phải có ít nhất 1 timeslot

### **Lỗi: "No alternative fields found"**
- Thử tăng radius tìm kiếm
- Kiểm tra sân khác có cùng loại không
- Xem sân khác có đóng cửa ngày đó không

### **Lỗi: "Swap must be in proposed status"**
- Swap phải ở status "proposed" mới confirm được

---

## 🚀 KẾT LUẬN

✅ **Backend đã hoàn thành 100%:**
- Models: FieldSchedule, FieldClosure, IncidentReport, FieldSwap
- APIs: CRUD + Generate slots + Find alternative + Confirm swap
- Algorithm: Tìm sân thay thế thông minh
- Migration: Đã tạo và sẵn sàng áp dụng

🔄 **Frontend cần làm:**
- UI quản lý lịch theo tuần
- Visual grid khung giờ
- Form báo cáo sự cố
- Quản lý đổi sân

📚 **Tài liệu:**
- API đã được document đầy đủ
- Testing guide có sẵn
- Flow diagrams rõ ràng

**Sẵn sàng để phát triển Frontend! 🎉**
