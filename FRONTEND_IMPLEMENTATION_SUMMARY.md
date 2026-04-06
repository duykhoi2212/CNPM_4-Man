# Frontend Implementation - Matchmaking Feature

## Tệp Được Tạo

### 1. Pages (Trang)

#### `frontend/src/pages/user/FindOpponent.jsx`
- Trang chính cho tính năng tìm đối thủ
- Gồm 3 phần chính:
  1. **Yêu Cầu Tìm Đối Thủ**: Tạo, cập nhật, hủy yêu cầu tìm đối thủ
  2. **Gợi Ý Đối Thủ**: Hiển thị danh sách đối thủ phù hợp dựa trên tiêu chí
  3. **Quản Lý Trận Đấu**: Xem, xác nhận, ghi kết quả trận đấu
- State: myRequest, suggestions, matches, formData, các flags control
- Hàm chính:
  - `fetchMyRequest()`: Lấy yêu cầu hiện tại
  - `fetchSuggestions()`: Lấy gợi ý đối thủ
  - `fetchMatches()`: Lấy danh sách match
  - `handleCreateRequest()`: Tạo/cập nhật yêu cầu
  - `handleCancelRequest()`: Hủy yêu cầu
  - `handleSelectOpponent()`: Tạo match mới
  - `handleConfirmMatch()`: Xác nhận match

#### `frontend/src/pages/user/SkillProfile.jsx`
- Trang cập nhật hồ sơ kỹ năng của người dùng
- Hiển thị:
  - Thống kê hiện tại (Danh giá, Số trận, Số thắng, Số hòa)
  - Form cập nhật với các trường:
    - Radio buttons chọn trình độ kỹ năng (4 mức)
    - Dropdown chọn vị trí ưu tiên
    - Textarea cho giới thiệu bản thân (tối đa 500 ký tự)
- State: profile, formData, loading, saving, error, success
- Hàm chính:
  - `fetchProfile()`: Lấy thông tin hồ sơ
  - `handleSubmit()`: Lưu cập nhật

### 2. Components (Thành Phần)

#### `frontend/src/components/matchmaking/MatchResultForm.jsx`
- Component modal để ghi kết quả trận đấu
- Input:
  - `match`: Thông tin trận đấu
  - `onClose`: Callback đóng modal
  - `onSuccess`: Callback thành công
- Cho phép:
  - Nhập tỉ số (bàn thắng của bạn vs đối thủ)
  - Chọn kết quả (Thắng/Thua/Hòa)
  - Viết ghi chú (tùy chọn, max 200 ký tự)
- State: result, score, notes, loading, error

### 3. API Service

#### `frontend/src/api/matchmaking.js`
- Tập trung tất cả các API calls cho matchmaking
- Các endpoint:
  ```javascript
  matchmakingAPI = {
    // Yêu cầu
    getMyCurrentRequest()           
    createOrUpdateRequest(data)     
    updateMyRequest(data)           
    cancelMyRequest()               
    getSuggestions()                
    
    // Trận đấu
    getMyMatches()                  
    createMatch(data)               
    confirmMatch(matchId)           
    recordMatchResult(matchId, data)
    cancelMatch(matchId)            
    
    // Hồ sơ
    getProfile()                    
    updateProfile(data)             
  }
  ```

## Tệp Được Cập Nhật

### 1. `frontend/src/routes/AppRouter.jsx`
**Thay Đổi:**
- Thêm import cho `FindOpponent` và `SkillProfile`
- Thêm 2 route mới:
  - `/user/skill-profile` → SkillProfile page
  - `/user/find-opponent` → FindOpponent page

### 2. `frontend/src/components/layout/Header.jsx`
**Thay Đổi:**
- Thêm state `showUserMenu` để quản lý dropdown menu
- Thêm các link trong nav cho đã đăng nhập:
  - "Tìm Đối Thủ" → /user/find-opponent
  - "Hồ Sơ Kỹ Năng" → /user/skill-profile
- Cải thiện UX: Thêm dropdown menu khi click trên username
  - "Lịch Sử Đặt Sân"
  - "Hồ Sơ Kỹ Năng"
  - "Tìm Đối Thủ"
  - "Đăng Xuất"

## Tính Năng Chính

### 1. Quản Lý Hồ Sơ Kỹ Năng
- Người dùng có thể cập nhật:
  - Trình độ kỹ năng (4 mức)
  - Vị trí ưu tiên
  - Giới thiệu bạn thân
- Hiển thị thống kê tự động:
  - Danh giá hiện tại
  - Số trận đấu
  - Số trận thắng/hòa
  - Tỉ lệ thắng

### 2. Tạo Yêu Cầu Tìm Đối Thủ
- Form đơn giản với các tiêu chí:
  - Trình độ ưu tiên (Bất kỳ/Yếu/Trung Bình/Khá/Tốt)
  - Danh giá tối thiểu
  - Ghi chú
- Cho phép cập nhật/hủy yêu cầu hiện tại

### 3. Gợi Ý Đối Thủ
- Danh sách card hiển thị:
  - Thông tin cơ bản (tên, username)
  - Trình độ (với badge màu)
  - Thống kê (danh giá, trận, thắng, tỉ lệ)
  - Vị trí ưu tiên
- Nút "Tạo Match" để yêu cầu thi đấu

### 4. Quản Lý Trận Đấu
- Danh sách tất cả match của người dùng
- Xác nhận match
- Ghi kết quả (tỉ số, kết quả, ghi chú)
- Cập nhật thống kê tự động

### 5. Cải Thiện Navigation
- Dropdown menu khi đăng nhập
- Link trực tiếp đến các tính năng
- UX cải thiện cho người dùng

## Kiến Trúc

```
frontend/src/
├── api/
│   ├── axios.js          (Existing - HTTP client)
│   └── matchmaking.js    (NEW - API service for matchmaking)
├── pages/
│   └── user/
│       ├── Checkout.jsx
│       ├── History.jsx
│       ├── ReviewForm.jsx
│       ├── FindOpponent.jsx     (NEW)
│       └── SkillProfile.jsx     (NEW)
├── components/
│   ├── matchmaking/
│   │   └── MatchResultForm.jsx  (NEW)
│   └── layout/
│       ├── Header.jsx (UPDATED)
│       ├── Footer.jsx
│       └── MainLayout.jsx
└── routes/
    └── AppRouter.jsx (UPDATED)
```

## Style & Design

### Màu Sắc
- Trình độ kỹ năng:
  - Yếu: Xanh dương (bg-blue-100)
  - Trung Bình: Xanh lá (bg-green-100)
  - Khá: Tím (bg-purple-100)
  - Tốt: Đỏ (bg-red-100)
  - Xanh (primary): Bàn nút chính, link

### Layout
- Max-width: 6xl (for FindOpponent)
- Max-width: 2xl (for SkillProfile)
- Responsive: Mobile-first approach
- Tailwind CSS cho styling

## Validation & Error Handling

Toàn bộ các trang có:
- Input validation
- Error messages rõ ràng
- Loading states
- Success notifications
- Try-catch handling cho API calls

## Tích Hợp Backend

Tất cả các API calls sử dụng:
- `matchmakingAPI` service layer
- Token authentication (qua axios instance)
- RESTful endpoints
- JSON data format

## Hướng Sử Dụng

1. **Lần đầu tiên:**
   - Login/Register
   - Vào "Hồ Sơ Kỹ Năng" → Cập nhật trình độ
   - Vào "Tìm Đối Thủ" → Tạo yêu cầu tìm

2. **Tìm Đối Thủ:**
   - Xem gợi ý
   - Chọn đối thủ → Tạo Match
   - Đợi xác nhận hoặc xác nhận match khác

3. **Sau Trận:**
   - Ghi kết quả
   - Kiểm tra thống kê cập nhật
   - Tạo match mới

## Testing

Tất cả file đã pass kiểm tra:
- ✅ No syntax errors
- ✅ No import errors
- ✅ Proper component structure
- ✅ Responsive design
- ✅ Error handling

## Chú Ý Quan Trọng

1. Đảm bảo backend API đang chạy trước khi test
2. Token authentication phải hoạt động
3. CORS phải được cấu hình đúng
4. Database migrations phải đủ (đã làm ở backend)

## Mở Rộng Tương Lai

Có thể mở rộng với:
- Bộ lọc nâng cao cho gợi ý
- Lịch sử chi tiết trận đấu
- Chat/Message giữa các người chơi
- Rating review từ đối thủ
- Leaderboard
- In-game statistics
