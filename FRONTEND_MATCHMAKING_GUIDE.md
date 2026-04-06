# Hướng Dẫn Sử Dụng Tính Năng Tìm Đối Thủ - Frontend

## Tổng Quan

Tính năng "Tìm Đối Thủ" giúp người dùng:
- Cập nhật hồ sơ kỹ năng đá bóng của mình
- Tạo yêu cầu tìm đối thủ
- Xem gợi ý đối thủ phù hợp
- Tạo và quản lý các trận đấu
- Ghi lại kết quả trận đấu

## Các Trang và Chức Năng

### 1. Hồ Sơ Kỹ Năng (`/user/skill-profile`)

**Mục đích:** Cập nhật thông tin kỹ năng đá bóng của người dùng

**Các Trường:**
- **Trình Độ Kỹ Năng**: Lựa chọn từ 4 mức:
  - Yếu (Beginner): Mới bắt đầu hoặc chơi dưới 1 năm
  - Trung Bình (Intermediate): 1-3 năm kinh nghiệm
  - Khá (Advanced): 3-5 năm kinh nghiệm
  - Tốt (Professional): Trên 5 năm hoặc tham gia giải đấu

- **Tên Đội Bóng**: Tên đội bóng của bạn (tối đa 100 ký tự)
- **Giới Thiệu Đội Bóng**: Mô tả ngắn về đội bóng, phong cách chơi (tối đa 500 ký tự)

**Thống Kê Hiển Thị:**
- Danh giá (Rating)
- Số trận đấu
- Số trận thắng
- Số trận hòa
- Tỉ lệ thắng (Win Rate)

**Cách Sử Dụng:**
1. Click vào menu người dùng → "Hồ Sơ Đội Bóng"
2. Chọn trình độ kỹ năng của đội bóng
3. Nhập tên đội bóng
4. Viết giới thiệu đội bóng (tùy chọn)
5. Click "Lưu Cập Nhật"

### 2. Tìm Đối Thủ (`/user/find-opponent`)

**Mục đích:** Tìm kiếm và quản lý trận đấu với đối thủ khác

#### Phần A: Yêu Cầu Tìm Đối Thủ

**Tạo Yêu Cầu Mới:**
1. Click "Tạo Yêu Cầu Mới"
2. Nhập các tiêu chí:
   - **Trình Độ Theo Yêu Cầu**: Chọn mức kỹ năng mong muốn (Bất Kỳ/Yếu/Trung Bình/Khá/Tốt)
   - **Danh Giá Tối Thiểu**: Đặt ngưỡng danh giá tối thiểu (0-5 sao)
   - **Ghi Chú**: Viết thêm thông tin hoặc yêu cầu cụ thể
3. Click "Tạo" để hoàn tất

**Cập Nhật Yêu Cầu:**
1. Khi đã có yêu cầu hoạt động, click "Cập Nhật"
2. Thay đổi các tiêu chí
3. Click "Cập Nhật" để lưu

**Hủy Yêu Cầu:**
1. Click "Hủy" để xóa yêu cầu này
2. Yêu cầu sẽ hết hạn tự động sau 7 ngày

#### Phần B: Gợi Ý Đối Thủ

**Xem Gợi Ý:**
- Khi bạn có yêu cầu hoạt động, hệ thống sẽ hiển thị danh sách đối thủ phù hợp
- Mỗi người chơi hiển thị:
  - Tên và username
  - Trình độ kỹ năng (với badge màu)
  - Danh giá
  - Số trận đấu
  - Số trận thắng
  - Tỉ lệ thắng
  - Vị trí ưu tiên

**Tạo Match với Đối Thủ:**
1. Click "Tạo Match" trên card của đối thủ
2. Hệ thống sẽ tạo match request với:
   - Ngày mặc định: Hôm nay
   - Giờ bắt đầu: 19:00
   - Giờ kết thúc: 20:00
3. Đợi đối thủ xác nhận match

#### Phần C: Quản Lý Trận Đấu

**Xem Danh Sách Trận Đấu:**
1. Click "Hiển Thị" trong phần "Các Trận Đấu Của Tôi"
2. Danh sách hiển thị tất cả trận đấu của bạn với:
   - Tên đối thủ
   - Trạng thái (Chờ Xác Nhận/Đã Xác Nhận/Hoàn Tất)
   - Ngày và giờ thi đấu
   - Nút hành động phù hợp

**Xác Nhận Match:**
1. Khi có match chờ xác nhận, click "Xác Nhận Match"
2. Match sẽ chuyển sang trạng thái "Đã Xác Nhận"

**Ghi Kết Quả (Sau khi trận đấu diễn ra):**
1. Click để mở biểu mẫu ghi kết quả
2. Nhập tỉ số:
   - Bàn của bạn
   - Bàn của đối thủ
3. Chọn kết quả:
   - Tôi Thắng
   - Tôi Thua
   - Hòa
4. Viết ghi chú (tùy chọn)
5. Click "Lưu Kết Quả"

**Auto-Update Thống Kê:**
- Khi ghi kết quả, hệ thống sẽ tự động:
  - Cập nhật số trận đấu
  - Cập nhật số trận thắng/hòa
  - Cập nhật tỉ lệ thắng
  - Điều chỉnh danh giá dựa trên kết quả

## Quy Trình Phổ Biến

### Quy Trình 1: Hoàn Toàn Mới
1. Đăng ký tài khoản
2. Vào "Hồ Sơ Đội Bóng" → Cập nhật trình độ, tên đội, giới thiệu
3. Vào "Tìm Đối Bóng" → Tạo yêu cầu tìm đối thủ
4. Xem gợi ý → Lựa chọn đội bóng → Tạo Match
5. Đợi xác nhận hoặc xác nhận match của đội bóng khác
6. Sau trận đấu → Ghi kết quả
7. Kiểm tra hồ sơ để xem thống kê cập nhật

### Quy Trình 2: Cập Nhật Yêu Cầu
1. Vào "Tìm Đối Bóng"
2. Click "Cập Nhật" ở phần "Yêu Cầu Tìm Đối Bóng"
3. Thay đổi tiêu chí
4. Gợi ý sẽ tự động cập nhật
5. Tạo match mới từ gợi ý mới

### Quy Trình 3: Quản Lý Match
1. Vào "Tìm Đối Bóng"
2. Click "Hiển Thị" ở phần "Các Trận Đấu Của Đội Bóng"
3. Xác nhận các match cần thiết
4. Sau trận đấu, ghi kết quả
5. Kiểm tra lịch sử để xem match hoàn tất

## Thông Tin Kỹ Thuật

### API Service
Tất cả các hành động sử dụng API service tập trung trong `src/api/matchmaking.js`:

```javascript
matchmakingAPI = {
  // Yêu cầu
  getMyCurrentRequest()       // Lấy yêu cầu hiện tại
  createOrUpdateRequest(data) // Tạo/cập nhật yêu cầu
  getSuggestions()            // Lấy gợi ý đối thủ
  cancelMyRequest()           // Hủy yêu cầu
  
  // Trận đấu
  getMyMatches()              // Lấy danh sách trận của tôi
  createMatch(data)           // Tạo trận mới
  confirmMatch(matchId)       // Xác nhận trận
  recordMatchResult(matchId, data) // Ghi kết quả
  
  // Hồ sơ
  getProfile()                // Lấy hồ sơ
  updateProfile(data)         // Cập nhật hồ sơ
}
```

### Các Component
- **FindOpponent.jsx**: Trang chính với 3 phần (request, suggestions, matches)
- **SkillProfile.jsx**: Cập nhật hồ sơ kỹ năng
- **MatchResultForm.jsx**: Form ghi kết quả (modal)

### State Management
- Mỗi component quản lý state cục bộ
- React hooks cho data fetching và updates
- Auto-refresh khi có thay đổi

## Màu Sắc và Badge

### Trình Độ Kỹ Năng
- **Yếu (Beginner)**: Badge xanh dương nhạt (bg-blue-100 text-blue-800)
- **Trung Bình (Intermediate)**: Badge xanh lá nhạt (bg-green-100 text-green-800)
- **Khá (Advanced)**: Badge tím nhạt (bg-purple-100 text-purple-800)
- **Tốt (Professional)**: Badge đỏ nhạt (bg-red-100 text-red-800)

### Trạng Thái Match
- **Chờ Xác Nhận**: Vàng - cần hành động
- **Đã Xác Nhận**: Xanh - sẵn sàng thi đấu
- **Hoàn Tất**: Xám - đã ghi kết quả

## Xử Lý Lỗi

Các trang có xử lý lỗi tích hợp:
- Hiển thị thông báo lỗi chi tiết
- Cho phép retry các hành động
- Loading states để không quá tải

## Lưu Ý Quan Trọng

1. **Giới Thiệu Đội Bóng**: Tránh bình luận bất lịch sự - có thể bị cấm hoạt động
2. **Trình Độ Kỹ Năng**: Hãy chân thật để tìm được đội bóng phù hợp
3. **Ghi Kết Quả**: Ghi kết quả chính xác để thống kê akturate
4. **Yêu Cầu Hết Hạn**: Yêu cầu tự động hủy sau 7 ngày nếu không hoàn thành
5. **Danh Giá**: Cập nhật tự động dựa trên kết quả trận đấu

## Hỗ Trợ

Liên hệ quản trị viên nếu gặp các vấn đề:
- Không thể tạo match
- Gợi ý không cập nhật
- Thống kê không chính xác
- Các lỗi khác
