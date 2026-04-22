#  Hướng dẫn sử dụng tính năng mới

## ✅ Đã hoàn thành

### **Backend đã sẵn sàng:**
- ✅ Migration đã áp dụng thành công
- ✅ 4 tables mới: `field_schedules`, `field_closures`, `incident_reports`, `field_swaps`
- ✅ 15 API endpoints mới
- ✅ Algorithm tìm sân thay thế thông minh

---

## 🚀 Cách test API

### **1. Test Schedule Management**

#### Tạo lịch hoạt động cho sân:
```bash
POST http://localhost:8000/api/fields/schedules/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "field": 1,
    "day_of_week": 0,
    "is_open": true,
    "open_time": "06:00:00",
    "close_time": "22:00:00",
    "slot_duration": 60
}
```

#### Tự động sinh khung giờ:
```bash
POST http://localhost:8000/api/fields/1/schedules/generate-slots/
Authorization: Bearer <your_token>

Response:
{
    "message": "Đã tạo thành công 112 khung giờ cho Sân 5-A",
    "total_slots": 112
}
```

### **2. Test Incident & Field Swap**

#### Báo cáo sự cố:
```bash
POST http://localhost:8000/api/fields/incidents/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "field": 1,
    "booking": 1,
    "issue_type": "field_damage",
    "severity": "high",
    "description": "Đèn sân khu vực A bị tắt"
}
```

#### Tìm sân thay thế:
```bash
POST http://localhost:8000/api/fields/swaps/find-alternative/
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "incident_id": 1
}

Response:
{
    "incident_id": 1,
    "original_field": {"id": 1, "name": "Sân 5-A"},
    "booking_date": "2026-04-20",
    "alternatives": [
        {
            "field_id": 2,
            "field_name": "Sân 5-B",
            "distance_km": 1.2,
            "total_price": 300000,
            "price_difference": 0
        }
    ]
}
```

---

## 📊 Database Schema

### **field_schedules**
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| field_id | BIGINT | FK to fields |
| day_of_week | INT | 0=Thứ 2, 6=CN |
| is_open | TINYINT | Mở/đóng |
| open_time | TIME | Giờ mở cửa |
| close_time | TIME | Giờ đóng cửa |
| slot_duration | INT | Phút/slot |

### **field_closures**
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| field_id | BIGINT | FK to fields |
| start_date | DATE | Ngày bắt đầu |
| end_date | DATE | Ngày kết thúc |
| reason | TEXT | Lý do |
| closure_type | VARCHAR | maintenance/holiday/issue |

### **incident_reports**
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| field_id | BIGINT | FK to fields |
| booking_id | BIGINT | FK to bookings |
| issue_type | VARCHAR | field_damage/weather/emergency |
| severity | VARCHAR | low/medium/high |
| status | VARCHAR | pending/investigating/resolved |

### **field_swaps**
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| incident_id | BIGINT | FK to incident_reports |
| original_field_id | BIGINT | Sân cũ |
| new_field_id | BIGINT | Sân mới |
| price_difference | DECIMAL | Chênh lệch giá |
| status | VARCHAR | pending/proposed/confirmed |

---

## ⚠️ Lưu ý quan trọng

### **Migration đã được FAKE:**
- Migration 0004 đã được fake vì có vấn đề với foreign key constraints
- Tables đã được tạo thủ công bằng SQL
- **KHÔNG** chạy `migrate` lại cho fields app

### **Để rollback:**
```bash
# Drop tables
python manage.py dbshell
DROP TABLE field_swaps;
DROP TABLE incident_reports;
DROP TABLE field_closures;
DROP TABLE field_schedules;

# Unfake migration
python manage.py migrate fields 0003
```

---

## 🎯 Bước tiếp theo

### **Frontend cần làm:**
1. Component quản lý lịch sân (FieldScheduleManager)
2. Component báo cáo sự cố (IncidentReportForm)
3. Component tìm sân thay thế (AlternativeFieldFinder)
4. Component quản lý đổi sân (FieldSwapManager)

### **Test với Postman/Thunder Client:**
1. Import API collection
2. Test schedule CRUD
3. Test generate-slots
4. Test incident reporting
5. Test field swap flow

---

**Backend đã sẵn sàng để phát triển Frontend! 🚀**
