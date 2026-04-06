# Hướng Dẫn: Tìm Đối Thủ Để Đấu

## 📋 Tóm Tắt

Tính năng này cho phép người dùng **tự yêu cầu tìm đối thủ** khi chưa có đội. Hệ thống sẽ gợi ý những người chơi phù hợp dựa trên trình độ kỹ năng và đánh giá.

---

## 🎯 Các Bước Sử Dụng

### Bước 1: Cập Nhật Hồ Sơ Người Chơi

Trước khi tìm đối thủ, hãy cập nhật hồ sơ của bạn:

```
PUT /api/auth/profile/update/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "first_name": "Thanh",
  "last_name": "Nguyen",
  "email": "thanh@example.com",
  "phone": "0912345678",
  "address": "123 Main St",
  
  // Thêm vào để sử dụng matchmaking
  "skill_level": "advanced",        // beginner|intermediate|advanced|professional
  "rating": 4.5,                    // 0-5 sao (admin set hoặc tính từ reviews)
  "bio": "Football enthusiast",     // Ghi chú về bạn
  "preferred_position": "Forward"   // Vị trí ưa thích (VD: thủ môn, hậu vệ, tiền đạo)
}

Response (200 OK):
{
  "message": "Cap nhat profile thanh cong",
  "data": { ... updated profile ... }
}
```

### Bước 2: Tạo Yêu Cầu Tìm Đối Thủ

Có **2 cách** để tạo yêu cầu:

#### **Cách 1: Tạo Nhanh (Recommended)** ⭐

```
POST /api/matchmaking/requests/quick_create/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "preferred_skill_level": "advanced",
  "min_rating": 3.5,
  "notes": "Looking for friendly match on weekend"
}

Response (201 Created):
{
  "message": "Yeu cau tim doi thu da duoc tao/cap nhat thanh cong",
  "request": {
    "id": 1,
    "user": {
      "id": 5,
      "username": "thanh123",
      "profile": {
        "skill_level": "advanced",
        "rating": 4.5,
        "total_matches": 10
      }
    },
    "preferred_skill_level": "advanced",
    "min_rating": 3.5,
    "notes": "Looking for friendly match on weekend",
    "status": "Dang tim",
    "created_at": "2026-04-06T15:30:00Z",
    "expires_at": "2026-04-13T15:30:00Z"
  }
}
```

**Lưu ý**: 
- Nếu bạn đã có yêu cầu active, hệ thống sẽ **update** nó thay vì tạo cái mới
- Yêu cầu sẽ hết hạn sau **7 ngày**

#### **Cách 2: Tạo Chi Tiết**

```
POST /api/matchmaking/requests/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "field": 1,                       // ID sân bóng (optional)
  "preferred_skill_level": "any",   // beginner|intermediate|advanced|professional|any
  "min_rating": 0,                  // Đánh giá tối thiểu
  "preferred_date": "2026-04-10",   // Ngày ưa thích (YYYY-MM-DD)
  "preferred_time_start": "19:00",  // Giờ bắt đầu (HH:MM)
  "preferred_time_end": "20:00",    // Giờ kết thúc (HH:MM)
  "notes": "Looking for competitive match",
  "is_open_to_team": true           // Chấp nhận join vào đội không?
}
```

---

### Bước 3: Xem Yêu Cầu Hiện Tại

```
GET /api/matchmaking/requests/my_current/
Authorization: Token YOUR_TOKEN

Response (200 OK):
{
  "id": 1,
  "user": { ... },
  "preferred_skill_level": "advanced",
  "status": "Dang tim",
  "is_expired": false,
  "created_at": "2026-04-06T15:30:00Z",
  "expires_at": "2026-04-13T15:30:00Z"
}
```

---

### Bước 4: Cập Nhật Yêu Cầu

Nếu muốn thay đổi tiêu chí tìm kiếm:

```
PUT /api/matchmaking/requests/my_current/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "preferred_skill_level": "professional",
  "min_rating": 4.0,
  "notes": "Looking for professional players only"
}

Response (200 OK):
{
  "message": "Yeu cau da duoc cap nhat",
  "data": { ... updated request ... }
}
```

---

### Bước 5: Xem Gợi Ý Đối Thủ

Sau khi tạo yêu cầu, xem những người chơi được gợi ý:

```
GET /api/matchmaking/requests/suggestions/
Authorization: Token YOUR_TOKEN

Response (200 OK):
[
  {
    "id": 3,
    "username": "player2",
    "first_name": "Tran",
    "last_name": "Thi B",
    "email": "player2@example.com",
    "profile": {
      "skill_level": "advanced",
      "skill_level_display": "Khá - Kỹ thuật tốt",
      "rating": 4.2,
      "total_matches": 25,
      "total_wins": 18,
      "preferred_position": "Midfield"
    },
    "win_rate": 72.0
  },
  {
    "id": 4,
    "username": "player3",
    "first_name": "Le",
    "last_name": "Tuan C",
    ...
  }
]
```

**Các tiêu chí tìm kiếm**:
- **Trình độ kỹ năng**: Match theo tiêu chí của bạn
- **Đánh giá (Rating)**: Ít nhất phải ≥ `min_rating` bạn chỉ định
- **Được sắp xếp**: Theo đánh giá cao nhất trước

---

### Bước 6: Tạo Match Với Một Người Chơi

Khi bạn muốn tạo trận đấu với một người cụ thể:

```
POST /api/matchmaking/matches/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "opponent_id": 3,                 // ID của người chơi từ suggestions
  "field": 1,                       // ID sân bóng (optional)
  "scheduled_date": "2026-04-10",   // YYYY-MM-DD
  "scheduled_time_start": "19:00",  // HH:MM
  "scheduled_time_end": "20:00",    // HH:MM
  "notes": "Meet at main entrance"
}

Response (201 Created):
{
  "message": "Da tao match, dang cho doi thu xac nhan",
  "match": {
    "id": 1,
    "requester": { ... your profile ... },
    "opponent": { ... opponent profile ... },
    "scheduled_date": "2026-04-10",
    "scheduled_time_start": "19:00",
    "scheduled_time_end": "20:00",
    "requester_confirmed": false,
    "opponent_confirmed": false,
    "both_confirmed": false,
    "status": "Cho xac nhan",
    "created_at": "2026-04-06T15:35:00Z"
  }
}
```

---

### Bước 7: Xác Nhận Match

Khi cả hai người chơi đã đồng ý với time/location:

```
PUT /api/matchmaking/matches/{match_id}/confirm/
Authorization: Token YOUR_TOKEN

Response (200 OK):
{
  "message": "Ban da xac nhan match",
  "match": {
    ...
    "requester_confirmed": true,    // hoặc opponent_confirmed
    "opponent_confirmed": true,     // nếu cả 2 confirm
    "status": "Da xac nhan",
    "confirmed_at": "2026-04-06T15:40:00Z"
  }
}
```

---

### Bước 8: Sau Khi Đấu - Ghi Kết Quả

Sau khi trận đấu kết thúc, ghi lại kết quả:

```
PUT /api/matchmaking/matches/{match_id}/record_result/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "match_result": "requester_win"  // requester_win | opponent_win | draw
}

Response (200 OK):
{
  "message": "Ket qua trận dấu da duoc ghi nhan",
  "match": {
    ...
    "match_result": "Nguoi tim thang",
    "status": "Hoan thanh",
    "completed_at": "2026-04-10T20:30:00Z"
  }
}
```

**Tự động cập nhật**:
- ✅ `total_matches` += 1 cho cả 2 người
- ✅ `total_wins` += 1 nếu thắng
- ✅ `total_draws` += 1 nếu hòa
- ✅ `win_rate` được tính lại

---

### Bước 9: Hủy Yêu Cầu (Nếu Cần)

```
DELETE /api/matchmaking/requests/cancel_my_request/
Authorization: Token YOUR_TOKEN

Response (200 OK):
{
  "message": "Yeu cau tim doi thu da duoc huy"
}
```

---

## 📊 Phân Hạng Kỹ Năng

| Hạng | Mô Tả | Ví Dụ |
|------|-------|--------|
| **Yếu** (beginner) | Mới bắt đầu chơi | Lần đầu chơi bóng |
| **Trung bình** (intermediate) | Có kinh nghiệm, nắm vững cơ bản | Chơi 1-2 năm, có kỹ thuật cơ bản |
| **Khá** (advanced) | Kỹ thuật tốt, thường xuyên chơi | Chơi 3+ năm, kỹ thuật chuyên nghiệp |
| **Tốt** (professional) | Chuyên nghiệp, nghiệp dư hoặc bán chuyên | Chơi bóng nhiều năm hoặc từng thi đấu |

---

## 🔍 Xem Tất Cả Requests & Matches

### Lấy Tất Cả Yêu Cầu Của Tôi

```
GET /api/matchmaking/requests/my_requests/
Authorization: Token YOUR_TOKEN

Response (200 OK):
[
  {
    "id": 1,
    "status": "Dang tim",
    ...
  },
  {
    "id": 2,
    "status": "Da huy",
    ...
  }
]
```

### Lấy Tất Cả Matches Của Tôi

```
GET /api/matchmaking/matches/my_matches/
Authorization: Token YOUR_TOKEN

Response (200 OK):
[
  {
    "id": 1,
    "requester": { ... },
    "opponent": { ... },
    "status": "Cho xac nhan",
    ...
  }
]
```

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Nguyên Nhân | Cách Fix |
|-----|-----------|---------|
| 404 - "Ban chua co yeu cau tim doi thu nao" | Không có yêu cầu active | Tạo yêu cầu mới bằng quick_create |
| 400 - "Khong tim thay doi thu" | ID opponent không tồn tại | Kiểm tra ID từ suggestions |
| 400 - "Chi co the ghi ket qua match da xac nhan" | Match chưa được xác nhận | Xác nhận match trước |
| 404 - "Khong tim thay match" | Match không tồn tại | Kiểm tra ID match |

---

## 📱 Ví Dụ Thực Tế

### Scenario 1: Người Chơi Mới Tìm Đối Thủ

```bash
# 1. Update profile
curl -X PUT http://localhost:8000/api/auth/profile/update/ \
  -H "Authorization: Token abc123" \
  -d '{"skill_level":"beginner","rating":0,"bio":"Just started playing"}'

# 2. Create request
curl -X POST http://localhost:8000/api/matchmaking/requests/quick_create/ \
  -H "Authorization: Token abc123" \
  -d '{"preferred_skill_level":"beginner","min_rating":0}'

# 3. Get suggestions  
curl -X GET http://localhost:8000/api/matchmaking/requests/suggestions/ \
  -H "Authorization: Token abc123"

# 4. Create match with player #5
curl -X POST http://localhost:8000/api/matchmaking/matches/ \
  -H "Authorization: Token abc123" \
  -d '{"opponent_id":5,"scheduled_date":"2026-04-12","scheduled_time_start":"18:00","scheduled_time_end":"19:00"}'
```

### Scenario 2: Cập Nhật Yêu Cầu

```bash
# Update current request
curl -X PUT http://localhost:8000/api/matchmaking/requests/my_current/ \
  -H "Authorization: Token abc123" \
  -d '{"preferred_skill_level":"advanced","min_rating":3.5}'
```

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
- Kiểm tra hồ sơ đã được cập nhật chưa (skill_level, rating)
- Xem thống kê trận đấu trong admin
- Liên hệ quản trị viên để được hỗ trợ

