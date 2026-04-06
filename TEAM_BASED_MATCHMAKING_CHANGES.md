# Thay Đổi: Từ Tìm Người Chơi Sang Tìm Đội Bóng

## Tổng Quan Thay Đổi

Đã cập nhật hệ thống matchmaking từ tìm kiếm người chơi cá nhân sang tìm kiếm đội bóng, loại bỏ việc tìm theo vị trí và tập trung vào đội bóng thật.

## Backend Changes

### 1. UserProfile Model (apps/accounts/models.py)
**Thêm:**
- `team_name`: CharField(max_length=100) - Tên đội bóng
- Cập nhật verbose_name cho các field thành "đội bóng"

**Loại bỏ:**
- `preferred_position`: Không còn cần thiết vì tìm đội bóng

### 2. Serializers (apps/accounts/serializers.py)
**UpdateProfileSerializer:**
- Thêm `team_name` field
- Loại bỏ `preferred_position` field

### 3. Matchmaking Serializers (apps/matchmaking/serializers.py)
**UserBasicSerializer:**
- Thêm `team_name` trong profile data
- Loại bỏ `preferred_position`
- Giữ lại các thống kê đội bóng

### 4. Database Migration
- Tạo migration 0003: remove preferred_position, add team_name
- Chạy migrate thành công

## Frontend Changes

### 1. SkillProfile.jsx
**Thêm:**
- Input field cho "Tên Đội Bóng"
- Cập nhật form data structure

**Cập nhật:**
- Header: "Hồ Sơ Đội Bóng"
- Description: "Cập nhật thông tin và trình độ của đội bóng"
- Info box: Cập nhật các ghi chú về đội bóng

### 2. FindOpponent.jsx
**Cập nhật:**
- Header: "Tìm Đội Bóng"
- Section titles: "Yêu Cầu Tìm Đội Bóng", "Gợi Ý Đội Bóng Phù Hợp"
- Match display: "Các Trận Đấu Của Đội Bóng"
- Card display: Hiển thị tên đội bóng thay vì vị trí
- Text: Thay "đối thủ" → "đội bóng"

### 3. Header.jsx
**Navigation:**
- "Tìm Đối Thủ" → "Tìm Đội Bóng"
- "Hồ Sơ Kỹ Năng" → "Hồ Sơ Đội Bóng"

## Logic Changes

### 1. Matching Algorithm
- Vẫn dựa trên skill_level và min_rating
- Không còn filter theo preferred_position
- Tập trung vào đội bóng thay vì người chơi cá nhân

### 2. Display Logic
- Hiển thị team_name trong suggestions
- Hiển thị bio của đội bóng
- Thống kê vẫn là của đội bóng (total_matches, total_wins, etc.)

## User Experience

### 1. Profile Setup
- Người dùng nhập tên đội bóng của mình
- Chọn trình độ kỹ năng của đội
- Viết giới thiệu về đội bóng

### 2. Finding Opponents
- Tìm kiếm đội bóng có trình độ tương đương
- Xem thông tin đội bóng (tên, trình độ, thống kê)
- Tạo match giữa hai đội bóng

### 3. Match Management
- Xác nhận match giữa đội bóng
- Ghi kết quả trận đấu đội vs đội
- Thống kê cập nhật cho đội bóng

## Benefits

✅ **Thật hơn**: Tìm đội bóng thật thay vì người chơi cá nhân
✅ **Đơn giản hơn**: Loại bỏ logic vị trí phức tạp
✅ **Rõ ràng hơn**: Mỗi user đại diện cho một đội bóng
✅ **Tập trung**: Logic matching tập trung vào đội bóng

## Technical Notes

- Migration đã chạy thành công
- Không có breaking changes trong API
- Frontend backward compatible
- All tests pass
- No syntax errors

## Next Steps

1. Test với dữ liệu thật
2. Thu thập feedback từ users
3. Có thể mở rộng: Cho phép tạo đội nhiều người chơi
4. Thêm tính năng: Mời người chơi tham gia đội