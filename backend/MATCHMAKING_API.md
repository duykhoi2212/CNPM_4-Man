# Hướng dẫn Tính năng Tìm Đối Thủ (Matchmaking)

## 1. Khái niệm chung

Tính năng **tìm đối thủ** cho phép người dùng:
- Tìm kiếm những người chơi khác để cùng tham gia một trận đấu
- Lọc theo trình độ kỹ năng: Yếu, Trung bình, Khá, Tốt
- Xem lịch sử trận đấu và thống kê
- Tự động cập nhật ranking dựa trên kết quả trận đấu

## 2. Phân hạng Kỹ Năng (Skill Levels)

### Các mức độ:
- **Yếu (Beginner)**: Mới bắt đầu chơi
- **Trung bình (Intermediate)**: Có kinh nghiệm, nắm vững cơ bản
- **Khá (Advanced)**: Kỹ thuật tốt, thường xuyên chơi
- **Tốt (Professional)**: Chuyên nghiệp, nghiệp dư hoặc bán chuyên

### Thống kê Người Chơi:
- `total_matches`: Tổng số trận đã chơi
- `total_wins`: Số trận thắng
- `total_draws`: Số trận hòa
- `rating`: Đánh giá từ 0-5 sao
- `win_rate`: Tỷ lệ thắng (%)

## 3. API Endpoints

### A. Yêu Cầu Tìm Đối Thủ (Opponent Requests)

#### 1. Tạo yêu cầu tìm đối thủ
```
POST /api/matchmaking/requests/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "field": 1,                        // Optional: ID sân bóng
  "preferred_skill_level": "advanced",  // beginner|intermediate|advanced|professional|any
  "min_rating": 3.5,                 // Optional: đánh giá tối thiểu
  "preferred_date": "2026-04-10",    // Optional: YYYY-MM-DD
  "preferred_time_start": "19:00",   // Optional: HH:MM
  "preferred_time_end": "20:00",     // Optional: HH:MM
  "notes": "Looking for friendly match", // Optional
  "is_open_to_team": true            // Chấp nhận join vào đội không?
}

Response (201 Created):
{
  "id": 1,
  "user": {
    "id": 5,
    "username": "player1",
    "first_name": "Nguyen",
    "last_name": "Van A",
    "profile": {
      "skill_level": "advanced",
      "rating": 4.5,
      "total_matches": 25,
      "total_wins": 18
    },
    "win_rate": 72.0
  },
  "preferred_skill_level": "advanced",
  "min_rating": 3.5,
  "status": "active",
  "created_at": "2026-04-06T15:00:00Z",
  "expires_at": "2026-04-13T15:00:00Z"
}
```

#### 2. Lấy danh sách yêu cầu của tôi
```
GET /api/matchmaking/requests/my_requests/
Authorization: Token YOUR_TOKEN

Response (200 OK):
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    { ... opponent request object ... },
    { ... opponent request object ... }
  ]
}
```

#### 3. Lấy gợi ý đối thủ phù hợp
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
    "profile": {
      "skill_level": "advanced",
      "rating": 4.0,
      "total_matches": 30,
      "total_wins": 22,
      "preferred_position": "Forward"
    },
    "win_rate": 73.3
  },
  { ... more suggestions ... }
]
```

#### 4. Hủy yêu cầu tìm đối thủ
```
DELETE /api/matchmaking/requests/cancel_my_request/
Authorization: Token YOUR_TOKEN

Response (200 OK):
{
  "message": "Yeu cau tim doi thu da duoc huy"
}
```

---

### B. Match (Trận Đấu)

#### 1. Tạo match với một đối thủ cụ thể
```
POST /api/matchmaking/matches/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "opponent_id": 3,                  // ID của đối thủ
  "field": 1,                        // Optional: ID sân bóng
  "scheduled_date": "2026-04-10",    // YYYY-MM-DD
  "scheduled_time_start": "19:00",   // HH:MM
  "scheduled_time_end": "20:00",     // HH:MM
  "notes": "Meet at main entrance"
}

Response (201 Created):
{
  "message": "Da tao match, dang cho doi thu xac nhan",
  "match": {
    "id": 1,
    "requester": { ... user object ... },
    "opponent": { ... user object ... },
    "scheduled_date": "2026-04-10",
    "scheduled_time_start": "19:00",
    "scheduled_time_end": "20:00",
    "requester_confirmed": false,
    "opponent_confirmed": false,
    "status": "pending_confirmation",
    "match_result": null,
    "created_at": "2026-04-06T15:00:00Z"
  }
}
```

#### 2. Lấy danh sách matches của tôi
```
GET /api/matchmaking/matches/my_matches/
Authorization: Token YOUR_TOKEN

Response (200 OK):
[
  { ... match object ... },
  { ... match object ... }
]
```

#### 3. Xác nhận match
```
PUT /api/matchmaking/matches/{match_id}/confirm/
Authorization: Token YOUR_TOKEN

Response (200 OK):
{
  "message": "Ban da xac nhan match",
  "match": {
    ...match details...
    "requester_confirmed": true,
    "opponent_confirmed": true,
    "status": "confirmed"
  }
}
```

#### 4. Ghi lại kết quả trận đấu
```
PUT /api/matchmaking/matches/{match_id}/record_result/
Content-Type: application/json
Authorization: Token YOUR_TOKEN

{
  "match_result": "requester_win"  // requester_win|opponent_win|draw
}

Response (200 OK):
{
  "message": "Ket qua trận dấu da duoc ghi nhan",
  "match": {
    ...match details...
    "match_result": "requester_win",
    "status": "completed",
    "completed_at": "2026-04-10T20:30:00Z"
  }
}
```

#### 5. Hủy match
```
DELETE /api/matchmaking/matches/{match_id}/cancel/
Authorization: Token YOUR_TOKEN

Response (200 OK):
{
  "message": "Match da duoc huy"
}
```

---

## 4. Luồng Xử Lý Tiêu Biểu

### Scenario: Hai người chơi tìm kiếm nhau

```
1. Player A tạo yêu cầu tìm đối thủ (cấp độ Advanced)
   POST /api/matchmaking/requests/
   └─> Status: "active"

2. Player A xem gợi ý đối thủ
   GET /api/matchmaking/requests/suggestions/
   └─> Thấy Player B (cấp độ Advanced, rating 4.0)

3. Player A tạo match với Player B
   POST /api/matchmaking/matches/
   └─> Match status: "pending_confirmation"
   └─> Player B cần xác nhận

4. Player B xem matches của mình
   GET /api/matchmaking/matches/my_matches/
   └─> Thấy match từ Player A

5. Cả hai xác nhận match
   Player A: PUT /api/matchmaking/matches/{id}/confirm/
   Player B: PUT /api/matchmaking/matches/{id}/confirm/
   └─> Match status: "confirmed"

6. Sau khi đấu xong, ghi lại kết quả
   Player A: PUT /api/matchmaking/matches/{id}/record_result/
   {
     "match_result": "requester_win"  // A chiến thắng
   }
   └─> Match status: "completed"
   └─> Player A: total_wins += 1, total_matches += 1
   └─> Player B: total_matches += 1
```

---

## 5. Thống Kê và Xếp Hạng

### Cách Tính Toán:
- **Total Matches**: Số trận đã hoàn thành
- **Total Wins**: Số trận thắng
- **Total Draws**: Số trận hòa
- **Win Rate** = (Total Wins / Total Matches) × 100 %
- **Rating**: Đánh giá từ 0-5 sao (tính từ reviews hoặc admin cập nhật)

### Ví Dụ:
```
Player A:
  - Total Matches: 25
  - Total Wins: 18
  - Total Draws: 3
  - Losses: 4
  - Win Rate: 72.0%
  - Rating: 4.5 ⭐
```

---

## 6. Admin Interface

### Quản Lý Opponent Requests
- **URL**: http://localhost:8000/admin/matchmaking/opponentrequest/
- **Có thể**:
  - Xem danh sách các yêu cầu tìm đối thủ
  - Filter theo trạng thái, trình độ, ngày tạo
  - Tìm kiếm theo username hoặc ghi chú
  - Chỉnh sửa thông tin yêu cầu
  - Xóa yêu cầu hết hạn

### Quản Lý Matches
- **URL**: http://localhost:8000/admin/matchmaking/matchmakingmatch/
- **Có thể**:
  - Xem danh sách matches
  - Filter theo trạng thái, kết quả, ngày
  - Tìm kiếm theo username người chơi
  - Ghi lại kết quả trận đấu
  - Xóa matches (nếu chưa hoàn thành)

### Quản Lý Hồ Sơ Người Chơi
- **URL**: http://localhost:8000/admin/accounts/userprofile/
- **Cập nhật**:
  - Trình độ kỹ năng
  - Đánh giá (rating)
  - Vị trí ưa thích
  - Thống kê trận đấu
  - Tiểu sử/Ghi chú

---

## 7. Lỗi Phổ Biến

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|----------|
| 404 - Không tìm thấy [...]| Người dùng/Match không tồn tại | Kiểm tra ID |
| 400 - Bạn không có quyền | Không phải owner của request | Chỉ có thể quản lý yêu cầu của chính mình |
| 400 - Chỉ có thể ghi kết quả match đã xác nhận | Match chưa confirm | Cả hai người phải xác nhận trước |
| 400 - Không tìm thấy yêu cầu | Không có yêu cầu active | Tạo yêu cầu mới trước |

---

## 8. Ví Dụ Thực Tế (cURL)

```bash
# 1. Tạo yêu cầu tìm đối thủ
curl -X POST http://localhost:8000/api/matchmaking/requests/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "preferred_skill_level": "advanced",
    "min_rating": 3.5,
    "notes": "Looking for a serious match"
  }'

# 2. Lấy gợi ý
curl -X GET http://localhost:8000/api/matchmaking/requests/suggestions/ \
  -H "Authorization: Token YOUR_TOKEN"

# 3. Tạo match với opponent
curl -X POST http://localhost:8000/api/matchmaking/matches/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "opponent_id": 5,
    "scheduled_date": "2026-04-12",
    "scheduled_time_start": "19:00",
    "scheduled_time_end": "20:00"
  }'

# 4. Xác nhận match
curl -X PUT http://localhost:8000/api/matchmaking/matches/1/confirm/ \
  -H "Authorization: Token YOUR_TOKEN"

# 5. Ghi kết quả
curl -X PUT http://localhost:8000/api/matchmaking/matches/1/record_result/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "match_result": "requester_win"
  }'
```

---

## 9. Bảng Trường Dữ Liệu

### UserProfile
```
- skill_level: CharField (beginner|intermediate|advanced|professional)
- rating: FloatField (0-5)
- total_matches: IntegerField
- total_wins: IntegerField
- total_draws: IntegerField
- bio: TextField
- preferred_position: CharField
```

### OpponentRequest
```
- user: ForeignKey(User)
- field: ForeignKey(Field)
- preferred_skill_level: CharField
- min_rating: FloatField
- preferred_date: DateField
- preferred_time_start: TimeField
- preferred_time_end: TimeField
- notes: TextField
- status: CharField (active|matched|cancelled|expired)
- is_open_to_team: BooleanField
- created_at: DateTimeField
- expires_at: DateTimeField (7 ngày từ khi tạo)
```

### MatchmakingMatch
```
- requester: ForeignKey(User)
- opponent: ForeignKey(User)
- opponent_request: ForeignKey(OpponentRequest)
- field: ForeignKey(Field)
- scheduled_date: DateField
- scheduled_time_start: TimeField
- scheduled_time_end: TimeField
- requester_confirmed: BooleanField
- opponent_confirmed: BooleanField
- status: CharField (pending_confirmation|confirmed|completed|cancelled)
- match_result: CharField (requester_win|opponent_win|draw)
- notes: TextField
- created_at: DateTimeField
- confirmed_at: DateTimeField
- completed_at: DateTimeField
```
