# CNPM_4-Man
Website đặt lịch sân bóng đá

## 📋 Mục lục
- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [API Documentation](#api-documentation)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)

## 🎯 Giới thiệu
Website đặt lịch sân bóng đá được xây dựng bằng Django REST Framework (backend) và React + Vite (frontend). Hệ thống hỗ trợ quản lý sân bóng, đặt lịch, thanh toán và đánh giá.

## ✨ Tính năng chính

### 🔍 Tìm kiếm sân bóng gần đây
- **Admin**: Quản lý vị trí sân với bản đồ Leaflet.js tương tác
- **User**: Tìm sân gần vị trí hiện tại với GPS, bộ lọc và sắp xếp

### 📅 Quản lý lịch hoạt động
- Tự động sinh khung giờ từ lịch mở/đóng cửa
- Quản lý lịch theo ngày trong tuần
- Đóng cửa đặc biệt (bảo trì, lễ tết)

### 🚨 Xử lý sự cố & Đổi sân
- Báo cáo sự cố khi sử dụng sân
- Tự động tìm sân thay thế
- Flow đổi sân và bồi thường

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.10+
- Node.js 18+
- MySQL 8+
- Windows PowerShell

### Backend (Django)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Tạo file .env từ .env.example
Copy-Item .env.example .env
# Cập nhật thông tin thực tế trong .env (DJANGO_SECRET_KEY, DB_PASSWORD, v.v.)

# Database và migrations
.\venv\Scripts\python.exe manage.py migrate

# (Tùy chọn) Tạo tài khoản admin
.\venv\Scripts\python.exe manage.py createsuperuser

# Chạy server
.\venv\Scripts\python.exe manage.py runserver
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

API base URL: `http://127.0.0.1:8000`

## 📖 Hướng dẫn sử dụng

### Cho Admin
#### Quản lý sân với bản đồ
1. Đăng nhập admin
2. Vào `/admin/manage-pitches`
3. Chọn vị trí bằng cách:
   - Tìm kiếm địa chỉ
   - Click trên bản đồ
   - Lấy vị trí GPS hiện tại
4. Kéo marker để điều chỉnh chính xác

#### Quản lý lịch hoạt động
- Tạo lịch theo ngày trong tuần
- Tự động sinh khung giờ
- Quản lý ngày đóng cửa đặc biệt

### Cho User
#### Tìm sân gần đây
1. Vào trang `/pitches`
2. Click "Tìm sân gần tôi" để lấy GPS
3. Sử dụng bộ lọc: giá, đánh giá, loại sân
4. Sắp xếp theo khoảng cách, giá, đánh giá

#### Đặt lịch và thanh toán
1. Chọn sân và khung giờ
2. Điền thông tin khách hàng
3. Thanh toán qua MoMo
4. Nhận xác nhận booking

## 📚 API Documentation

Base URL: `http://127.0.0.1:8000`

### Authentication
- Sử dụng Token Authentication
- Header: `Authorization: Token <token>`

### Các API chính

#### Auth
- `POST /api/auth/register/` - Đăng ký
- `POST /api/auth/login/` - Đăng nhập
- `POST /api/auth/logout/` - Đăng xuất
- `GET /api/auth/profile/` - Xem profile

#### Fields
- `GET /api/fields/` - Danh sách sân
- `GET /api/fields/{id}/` - Chi tiết sân
- `GET /api/fields/{id}/availability/?date=YYYY-MM-DD` - Tình trạng sân
- `POST /api/fields/create/` - Tạo sân (Admin)

#### Bookings
- `GET /api/bookings/` - Danh sách booking
- `POST /api/bookings/create/` - Tạo booking
- `PUT /api/bookings/{id}/cancel/` - Hủy booking

#### Payments
- `POST /api/payments/` - Tạo thanh toán
- `POST /api/payments/{id}/confirm/` - Xác nhận thanh toán

#### Reviews
- `GET /api/reviews/` - Danh sách đánh giá
- `POST /api/reviews/create/` - Tạo đánh giá

### Tính năng nâng cao

#### Quản lý lịch sân
```bash
# Tạo lịch hoạt động
POST /api/fields/schedules/
{
    "field": 1,
    "day_of_week": 0,
    "is_open": true,
    "open_time": "06:00:00",
    "close_time": "22:00:00",
    "slot_duration": 60
}

# Sinh khung giờ tự động
POST /api/fields/1/schedules/generate-slots/
```

#### Báo cáo sự cố và tìm sân thay thế
```bash
# Báo cáo sự cố
POST /api/fields/incidents/
{
    "field": 1,
    "booking": 1,
    "issue_type": "field_damage",
    "severity": "high",
    "description": "Đèn sân khu vực A bị tắt"
}

# Tìm sân thay thế
POST /api/fields/swaps/find-alternative/
{
    "incident_id": 1
}
```

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|--------|
| Backend | Django 4.2 + DRF | REST API |
| Frontend | React 18 + Vite | UI Framework |
| Database | MySQL 8+ | Dữ liệu |
| Maps | Leaflet.js + React-Leaflet | Bản đồ tương tác |
| Authentication | Token Auth | Xác thực |
| Payment | MoMo API | Thanh toán |
| Geocoding | Nominatim API | Tìm kiếm địa chỉ |
| Distance | Haversine Formula | Tính khoảng cách |

## 📝 Ghi chú
- Dự án sử dụng Python 3.10+, Node.js 18+
- Database: MySQL 8+
- Frontend: React với Tailwind CSS
- Backend: Django với Token Authentication
